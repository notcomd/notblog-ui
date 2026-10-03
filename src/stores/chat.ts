import { ref } from 'vue';
import { defineStore } from 'pinia';
import {
  getSessions,
  getMessages,
  getFriends,
  getGroups,
  getUnreadCount,
  getUnreadMessages,
  getUserProfile,
  markRead,
  MessageType
} from '@/api/chat';
import { unwrap } from '@/utils/response';
import { toMillis } from '@/utils/format';
import { charAvatar, groupAvatar } from '@/utils/avatar';
import { useAuthStore } from '@/stores/auth';
import { connectSignalR, isConnected } from '@/socket/signalr';

export interface SessionDto {
  sessionId: string;
  sessionName?: string;
  avatarUrl?: string;
  groupId?: string;
  circleId?: string;
  notifyGuid?: string;
  isPinned?: boolean;
  isMuted?: boolean;
  isRead?: boolean;
  unreadCount?: number;
  lastMessageTime?: number;
  createdTime?: number;
  createTime?: number;
  lastMessageContent?: string;
  participants?: string[];
  [key: string]: unknown;
}

/** 群成员渲染项（membersOf 的返回元素） */
export interface MemberView {
  id: string;
  name: string;
  avatar: string;
  online: boolean;
}

export interface FriendDto {
  friendId: string;
  friendName?: string;
  [key: string]: unknown;
}

/** 用户资料（昵称/头像）：消息与好友接口都不返回，按 userId 从 UsersApi 补取的读侧缓存项 */
interface ChatUserProfile {
  name: string;
  avatar: string;
}

export interface MessageDto {
  messageId: string;
  sessionId: string;
  senderId: string;
  receiverId?: string | null;
  messageType?: number;
  status?: number;
  content?: string;
  mediaUrl?: string | null;
  thumbnailUrl?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  mimeType?: string | null;
  duration?: number | null;
  caption?: string | null;
  sentTime?: number;
  isRead?: boolean;
  isRecalled?: boolean;
  [key: string]: unknown;
}

export const useChatStore = defineStore('chat', () => {
  // 仅用于展示兜底（本人昵称）；当前用户 id 不走 auth.user——
  // auth.user 只在 store 创建时解析一次 token，登录后可能仍是旧值
  const auth = useAuthStore();

  // ===== 状态 =====
  const sessions = ref<SessionDto[]>([]); // 会话列表（未读置顶 + 最近活跃排序）
  const friends = ref<FriendDto[]>([]); // 好友列表
  const groups = ref<any[]>([]); // 群列表
  const messages = ref<Record<string, MessageDto[]>>({}); // { sessionId: [MessageDto] }
  const activeSessionId = ref<string>('');
  const unreadTotal = ref<number>(0); // 铃铛未读数
  const onlineUsers = ref<Record<string, boolean>>({}); // { userId: true/false } 在线状态（SignalR 事件驱动）
  const typing = ref<Record<string, string>>({}); // { sessionId: userId } 正在输入
  const connected = ref<boolean>(false);
  const messageLoading = ref<Record<string, boolean>>({}); // { sessionId: bool } 消息加载锁（按会话粒度，曾为全局 bool 锁）
  const hasMoreMessages = ref<Record<string, boolean>>({}); // { sessionId: bool }
  // { sessionId: 已加载页数 } —— 分页游标独立跟踪：
  // 旧实现用「数组长度 / 30 + 1」推算页码，SignalR 推送/去重/乐观消息改变数组长度后会拉错页 → 重复/漏消息
  const loadedPages = ref<Record<string, number>>({});
  const profiles = ref<Record<string, ChatUserProfile>>({}); // { userId: { name, avatar } } 发送者资料缓存

  /**
   * 列表加载统一实现：四个 load* 原本各写一份「请求 → 解包 → items/list/data → 赋值」。
   * 后端列表响应有三种形态（{items}/{list}/裸数组），此处一并兼容。
   */
  async function loadList(
    fetcher: () => Promise<unknown>,
    assign: (list: any[]) => void,
    label: string
  ): Promise<void> {
    try {
      const data = unwrap(await fetcher());
      const list = (data && (data.items || data.list || data)) || [];
      assign(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error(`加载${label}失败:`, e);
    }
  }

  // ===== 会话 =====
  async function loadSessions(): Promise<void> {
    await loadList(getSessions, (list) => { sessions.value = sortSessions(list) }, '会话');
  }

  function sortSessions(list: SessionDto[]): SessionDto[] {
    return [...list].sort((a, b) => {
      // 置顶优先
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      // 未读其次
      if ((a.unreadCount || 0) > 0 !== (b.unreadCount || 0) > 0)
        return (a.unreadCount || 0) > 0 ? -1 : 1;
      // 最近活跃
      return (b.lastMessageTime || b.createdTime || 0) - (a.lastMessageTime || a.createdTime || 0);
    });
  }

  async function loadFriends(): Promise<void> {
    await loadList(getFriends, (list) => { friends.value = list }, '好友');
  }

  async function loadGroups(): Promise<void> {
    await loadList(getGroups, (list) => { groups.value = list }, '群组');
  }

  async function loadUnread(): Promise<void> {
    try {
      const data = unwrap(await getUnreadCount()) || {};
      unreadTotal.value = (data && (data.total !== undefined ? data.total : data.unreadCount)) || 0;
    } catch (e) {
      /* 静默 */
    }
  }

  /**
   * 首屏数据单次加载（会话/好友/群/未读）。
   * 侧栏与主视窗原本各写一份相同的 Promise.all，同一页面会重复请求两遍；
   * 此处做单飞（in-flight 复用）+ 单次（成功后不再重复），供两处共用。
   * initialLoaded 供侧栏区分「首次加载中」与「真的没有会话」，避免空态闪错。
   */
  const initialLoaded = ref(false);
  let initialLoading: Promise<void> | null = null;

  function ensureLoaded(): Promise<void> {
    if (initialLoaded.value) return Promise.resolve();
    if (!initialLoading) {
      initialLoading = Promise.all([loadSessions(), loadFriends(), loadGroups(), loadUnread()])
        .then(() => {
          initialLoaded.value = true;
          // 深链冷启动时 activateSession 早于本节执行，clearUnread 当时查不到会话而空转，
          // 侧栏会残留未读角标；会话列表就绪后补清一次当前会话的未读。
          if (activeSessionId.value) clearUnread(activeSessionId.value);
        })
        .finally(() => {
          initialLoading = null;
        });
    }
    return initialLoading;
  }

  /** 会话不存在时由调用方（CircleChatTab 拉到的社区频道会话）注入列表 */
  function upsertSession(session: SessionDto): void {
    if (!session?.sessionId) return;
    if (sessions.value.some((s) => s.sessionId === session.sessionId)) return;
    sessions.value = sortSessions([...sessions.value, session]);
  }

  // ===== 用户资料 =====
  /**
   * 按需补取用户昵称/头像（消息列表逐条显示发送者头像所需）。
   * 好友/会话/消息接口都不返回昵称与头像，故按 userId 走 GET /api/users/{userGuid}；
   * 已缓存或已在途的 id 直接跳过（占位写入即视为「已查询」），
   * 查询失败也保留空资料，避免渲染循环触发重复请求。
   */
  async function loadProfiles(userIds: string[]): Promise<void> {
    const targets = [
      ...new Set(userIds.map((id) => String(id || '')).filter((id) => id && !profiles.value[id]))
    ];
    await Promise.all(
      targets.map(async (id) => {
        profiles.value[id] = { name: '', avatar: '' };
        try {
          const d = unwrap(await getUserProfile(id)) || {};
          profiles.value[id] = { name: d.nickName || d.userName || '', avatar: d.avatarUrl || '' };
        } catch (e) {
          /* 静默：调用方回退首字头像 */
        }
      })
    );
  }

  // ===== 消息 =====
  /**
   * 激活会话（唯一入口：路由深链、侧栏点击、社区频道切换都走这里）：
   * 设置当前会话、确保消息已加载、清零本会话未读角标、通知服务端已读。
   *
   * ⚠️ 两条必须保留的语义：
   * 1. 幂等——已是当前会话时只「确保消息已加载」，不重复清零/标记已读
   *    （该流程原先在 4 处各写一遍，导致同一会话被重复标记已读）。
   * 2. 不要求会话已存在于 sessions——路由深链时本方法会在 loadSessions 之前被调用，
   *    此刻 sessions 为空，故不能用「找不到会话就返回」把加载挡掉。
   * 3. 消息为空也要（重新）加载：首次加载失败或被并发锁吞掉时，否则该会话永远空白，
   *    必须刷新重置 store 才能重试（用户反馈「点击会话要刷新才出现内容」）。
   */
  async function activateSession(sessionId: string): Promise<void> {
    if (!sessionId) return;
    const isCurrent = activeSessionId.value === sessionId;
    activeSessionId.value = sessionId;
    if (!messages.value[sessionId]?.length) {
      await loadMessages(sessionId, true);
    }
    if (isCurrent) return;
    clearUnread(sessionId);
    await markSessionRead(sessionId);
  }

  async function loadMessages(sessionId: string, reset = false): Promise<void> {
    // 按会话粒度锁（曾为全局锁：会话 A 加载中点击会话 B 会被静默吞掉 → B 永远空白）
    if (messageLoading.value[sessionId]) return;
    messageLoading.value[sessionId] = true;
    try {
      // ⚠️ 分页契约：后端 GetBySessionIdAsync 返回 SentTime 降序（最新在前）+ MessageId 平局
      // tie-breaker（稳定分页）；前端 messages[sessionId] 统一以【升序（旧→新）】存储——
      // v-for 自上而下 = 数组序，新消息追加在尾部（底部）。两个方向必须在下方归一，不可混用。
      const page = reset ? 1 : (loadedPages.value[sessionId] || 1) + 1;
      const res = await getMessages(sessionId, { page, pageSize: 30 });
      const data = unwrap(res) || {};
      const list: MessageDto[] = data.items || data.list || [];
      const serverAsc = [...list].reverse(); // 后端 desc → 前端 asc（复制反转，勿原地改响应数据）
      if (reset) {
        // 以本地已有消息（乐观发送/推送先到）为优先保留项，服务器列表补充全集；
        // 合并按 messageId 去重 + 时间升序稳定排序，杜绝刷新后重复/倒序
        messages.value[sessionId] = mergeMessages(messages.value[sessionId] || [], serverAsc);
        loadedPages.value[sessionId] = 1;
      } else if (serverAsc.length) {
        // 向上翻页：更旧的一页并入头部（mergeMessages 内做去重 + 排序定位）
        messages.value[sessionId] = mergeMessages(messages.value[sessionId] || [], serverAsc);
        loadedPages.value[sessionId] = page;
      }
      hasMoreMessages.value[sessionId] = list.length >= 30;
    } catch (e) {
      console.error('加载消息失败:', e);
    } finally {
      messageLoading.value[sessionId] = false;
    }
  }

  /**
   * 经 Hub 发送一条消息。
   * SendMessage 载荷字段众多（含大量当前未使用的可空字段），集中在此构造，
   * 避免 sendText / sendMedia 各维护一份完全相同的载荷。
   */
  async function invokeSendMessage(
    sessionId: string,
    payload: { messageType: number; content?: string | null; fileId?: string | null }
  ): Promise<void> {
    const conn = await connectSignalR();
    await conn.invoke('SendMessage', sessionId, {
      sessionId,
      messageType: payload.messageType,
      content: payload.content ?? null,
      fileId: payload.fileId ?? null,
      thumbnailFileId: null,
      duration: null,
      caption: null,
      latitude: null,
      longitude: null,
      locationName: null,
      linkUrl: null,
      linkTitle: null,
      linkDescription: null,
      expressionCode: null,
      replyToMessageId: null
    });
  }

  /** 发送状态回写：0=发送中, 1=已发送, -1=发送失败 */
  function setMessageStatus(sessionId: string, messageId: string, status: number): void {
    const target = (messages.value[sessionId] || []).find((m) => m.messageId === messageId);
    if (target) target.status = status;
  }

  /** 乐观插入 + 失败回滚的统一收尾（sendText / sendMedia 共用） */
  async function deliver(
    sessionId: string,
    messageId: string,
    invoke: () => Promise<void>,
    errorLabel: string
  ): Promise<void> {
    try {
      await invoke();
      setMessageStatus(sessionId, messageId, 1);
    } catch (e) {
      console.error(errorLabel, e);
      setMessageStatus(sessionId, messageId, -1);
      throw e;
    }
  }

  // 发送文本消息；retryMessageId 存在时表示重发失败消息（复用原 messageId，避免重复插入）
  // 状态约定：0=发送中, 1=已发送, -1=发送失败
  async function sendText(
    sessionId: string,
    content: string,
    retryMessageId: string | null = null
  ): Promise<MessageDto> {
    const me = currentUserId();
    const messageId = retryMessageId || 'local-' + Date.now();
    const msg: MessageDto = {
      messageId,
      sessionId,
      senderId: me,
      receiverId: null,
      messageType: MessageType.Text,
      status: 0,
      content,
      sentTime: Date.now()
    };

    const existing = (messages.value[sessionId] || []).find((m) => m.messageId === messageId);
    if (existing) {
      Object.assign(existing, msg);
    } else {
      pushMessage(msg);
    }
    bumpSession(sessionId, content);

    await deliver(
      sessionId,
      messageId,
      () => invokeSendMessage(sessionId, { messageType: MessageType.Text, content }),
      '发送消息失败:'
    );
    return msg;
  }

  // 发送媒体消息（图片/文件）：调用方先上传拿到 fileId，再由 Hub 落库（服务端统一解析媒体元数据）
  // localUrl 为发送中的即时预览地址；状态约定同 sendText
  async function sendMedia(
    sessionId: string,
    payload: { messageType: number; fileId: string; localUrl?: string; fileName?: string; fileSize?: number }
  ): Promise<MessageDto> {
    const me = currentUserId();
    const messageId = 'local-' + Date.now();
    const summary = payload.messageType === MessageType.Image ? '[图片]' : '[文件]';
    const msg: MessageDto = {
      messageId,
      sessionId,
      senderId: me,
      receiverId: null,
      messageType: payload.messageType,
      status: 0,
      content: summary,
      mediaUrl: payload.localUrl || null,
      fileName: payload.fileName || null,
      fileSize: payload.fileSize ?? null,
      sentTime: Date.now()
    };
    pushMessage(msg);
    bumpSession(sessionId, summary);

    await deliver(
      sessionId,
      messageId,
      () => invokeSendMessage(sessionId, { messageType: payload.messageType, fileId: payload.fileId }),
      '发送媒体消息失败:'
    );
    return msg;
  }

  // 重发失败消息
  async function retryMessage(sessionId: string, messageId: string): Promise<boolean> {
    const target = (messages.value[sessionId] || []).find((m) => m.messageId === messageId);
    if (!target || target.status !== -1) return false;
    await sendText(sessionId, target.content as string, target.messageId);
    return true;
  }

  async function sendTyping(sessionId: string): Promise<void> {
    if (!isConnected()) return;
    try {
      const conn = await connectSignalR();
      await conn.invoke('SendTypingIndicator', sessionId);
    } catch (e) {
      /* 静默 */
    }
  }

  /**
   * 取真实未读消息 id（可按会话过滤）。
   * ⚠️ 后端 MessageDto 只有 ReadTime、没有 IsRead 字段，也没有批量已读端点
   * （只有 PUT /api/messages/{id}/read 与 GET /api/messages/unread），
   * 故只能先查未读集合再逐条标记。不可对整页消息无差别调用：每次标记后端都要
   * 存库 + 失效未读缓存 + 查会话 + 可能推送，全量并发即惊群。
   */
  async function unreadMessageIds(sessionId?: string): Promise<string[]> {
    try {
      const data = unwrap(await getUnreadMessages()) || {};
      const list = (data.items || data.list || data) || [];
      return [
        ...new Set(
          (Array.isArray(list) ? list : [])
            .filter((m: MessageDto) => !sessionId || String(m.sessionId) === String(sessionId))
            .map((m: MessageDto) => m.messageId)
            .filter(Boolean)
        )
      ].map((id) => String(id));
    } catch (e) {
      return [];
    }
  }

  /**
   * 打开会话时上报本会话已读 —— 走 Hub 的 MarkAsRead。
   * 该 Hub 方法除标记已读外，还会向会话其他参与者推送已读回执并失效未读计数缓存，
   * 故会话打开必须走实时通道（REST 端点没有这层通知）。
   */
  async function markSessionRead(sessionId: string): Promise<void> {
    if (!messages.value[sessionId]?.length) return;
    const ids = await unreadMessageIds(sessionId);
    if (!ids.length) return;
    try {
      const conn = await connectSignalR();
      await Promise.all(ids.map((id) => conn.invoke('MarkAsRead', id).catch(() => {})));
    } catch (e) {
      /* 静默：已读上报失败不应阻塞会话打开 */
    }
  }

  /**
   * 用户显式「设为已读 / 一键已读」—— 走 REST。
   * 刻意不复用上面的 Hub 通道：REST 不依赖实时连接，Hub 不可用时仍能生效
   * （这也是这两处操作原本的实现方式）。
   */
  async function markUnreadRead(sessionId?: string): Promise<void> {
    const ids = await unreadMessageIds(sessionId);
    await Promise.all(ids.map((id) => markRead(id).catch(() => {})));
  }

  // ===== 内部工具 =====
  // currentUserId 会被展示解析（每个会话行/每条消息）频繁调用，
  // 而解析需 atob + JSON.parse，故按 token 值缓存：token 变化（登录/登出）时自动失效重算。
  let cachedToken: string | null = null;
  let cachedUserId = '';

  function currentUserId(): string {
    const t = localStorage.getItem('token') || '';
    if (t === cachedToken) return cachedUserId;
    cachedToken = t;
    cachedUserId = parseUserIdFromToken(t);
    return cachedUserId;
  }

  function parseUserIdFromToken(t: string): string {
    // ⚠️ Identity 签发的 JWT claim 名是完整 URI（.NET 10 不压缩）；同时兼容短名与 user_guid
    try {
      const payload = JSON.parse(
        decodeURIComponent(escape(atob(t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))))
      );
      return (
        payload.sub ||
        payload.nameid ||
        payload.user_guid ||
        payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] ||
        ''
      );
    } catch (e) {
      return '';
    }
  }

  /** 单聊对端 id；无 participants 时返回空串（曾硬编码 'u-002'，会把会话解析到错误的昵称/头像/在线态） */
  function peerIdOf(sessionId: string): string {
    const s = sessions.value.find((x) => x.sessionId === sessionId);
    if (!s || !s.participants) return '';
    return s.participants.find((p) => p !== currentUserId()) || '';
  }

  // ===== 展示解析（会话 / 消息 / 群成员的昵称与头像） =====
  // 原在 ChatSidebar 与 ChatConversation 各写一份重叠的多层兜底，且两处结果不一致
  // （侧栏能显示好友名，会话头部只显示「会话」）。统一收敛到此处，组件只负责渲染。

  function friendById(id: unknown): FriendDto | undefined {
    return friends.value.find((x) => String(x.friendId) === String(id));
  }

  function groupById(id: unknown): Record<string, any> | undefined {
    return groups.value.find((x) => String(x.groupId) === String(id));
  }

  /** 会话标题：会话自带名 → 单聊对端好友名 → 兜底「会话」 */
  function sessionTitle(session: SessionDto | null | undefined): string {
    if (!session) return '';
    if (session.sessionName) return session.sessionName;
    const f = friendById(peerIdOf(session.sessionId));
    return (f && f.friendName) || '会话';
  }

  /** 会话头像：会话头像 → 群头像 → 单聊对端好友头像 → 群组占位图（不返回空串，避免破图留白） */
  function sessionAvatar(session: SessionDto | null | undefined): string {
    if (!session) return groupAvatar();
    if (session.avatarUrl) return session.avatarUrl;
    if (session.groupId) {
      const g = groupById(session.groupId);
      if (g && g.avatarUrl) return String(g.avatarUrl);
    }
    const f = friendById(peerIdOf(session.sessionId));
    if (f && typeof f.friendAvatar === 'string' && f.friendAvatar) return f.friendAvatar;
    return groupAvatar();
  }

  /** 单聊对端是否在线（群聊无「对端」概念 → false） */
  function isPeerOnline(session: SessionDto | null | undefined): boolean {
    if (!session) return false;
    const peerId = peerIdOf(session.sessionId);
    return !!peerId && onlineUsers.value[peerId] === true;
  }

  /** 是否本人发送 */
  function isMine(message: MessageDto): boolean {
    return String(message.senderId) === String(currentUserId());
  }

  /** 发送者昵称：资料缓存 → 好友昵称 → 本人用登录名、他人用占位名 */
  function senderName(message: MessageDto): string {
    const p = profiles.value[String(message.senderId)];
    if (p && p.name) return p.name;
    const f = friendById(message.senderId);
    if (f && f.friendName) return String(f.friendName);
    return isMine(message) ? (auth.user?.name || '我') : '用户';
  }

  /** 发送者头像：资料缓存 → 好友头像 → 首字头像 */
  function senderAvatar(message: MessageDto): string {
    const p = profiles.value[String(message.senderId)];
    if (p && p.avatar) return p.avatar;
    const f = friendById(message.senderId);
    if (f && typeof f.friendAvatar === 'string' && f.friendAvatar) return f.friendAvatar;
    return charAvatar(senderName(message).charAt(0), isMine(message) ? '#f59e0b' : '#a1a1aa');
  }

  /** 群成员列表（成员 id 可能不在好友列表，此时用占位名） */
  function membersOf(session: SessionDto | null | undefined): MemberView[] {
    if (!session || !session.groupId) return [];
    const g = groupById(session.groupId);
    const ids: unknown[] = (g && g.participants) || session.participants || [];
    return ids.map((pid) => {
      const id = String(pid);
      const f = friendById(id);
      return {
        id,
        name: (f && f.friendName) || '成员',
        avatar: (f && typeof f.friendAvatar === 'string' && f.friendAvatar) || '',
        online: onlineUsers.value[id] === true
      };
    });
  }

  /** 消息时间戳归一为毫秒（复用 utils/format 的 toMillis） */
  function messageTime(m: MessageDto): number {
    return toMillis(m.sentTime as string | number | undefined);
  }

  /** 升序比较：时间升序；同一时刻按 messageId 字典序（与后端 SentTime desc + MessageId tie-breaker 镜像一致） */
  function compareMessages(a: MessageDto, b: MessageDto): number {
    const ta = messageTime(a);
    const tb = messageTime(b);
    if (ta !== tb) return ta - tb;
    return a.messageId < b.messageId ? -1 : a.messageId > b.messageId ? 1 : 0;
  }

  /**
   * 合并消息列表（升序存储约束）：
   * keep 内对象优先保留（保住本地乐观状态 status/已读标记），extra 仅补充 keep 缺失的 messageId；
   * 结果按 compareMessages 稳定排序。reset 与向上翻页共用，天然去重。
   */
  function mergeMessages(keep: MessageDto[], extra: MessageDto[]): MessageDto[] {
    const map = new Map<string, MessageDto>();
    for (const m of keep) map.set(m.messageId, m);
    for (const m of extra) {
      if (!map.has(m.messageId)) map.set(m.messageId, m);
    }
    return [...map.values()].sort(compareMessages);
  }

  function pushMessage(msg: MessageDto): void {
    const list = messages.value[msg.sessionId] || [];
    // 去重（本地乐观消息与服务器回执）
    if (list.some((m) => m.messageId === msg.messageId)) return;
    // 升序（旧→新）数组：常规新消息直接追加尾部；乱序到达（时间早于末条，如并发多连接）时按序插入
    const last = list[list.length - 1];
    if (last && messageTime(msg) < messageTime(last)) {
      messages.value[msg.sessionId] = mergeMessages(list, [msg]);
    } else {
      messages.value[msg.sessionId] = [...list, msg];
    }
  }

  function bumpSession(sessionId: string, content: string): void {
    const s = sessions.value.find((x) => x.sessionId === sessionId);
    if (s) {
      s.lastMessageContent = content;
      s.lastMessageTime = Date.now();
      sessions.value = sortSessions(sessions.value);
    }
  }

  function clearUnread(sessionId: string): void {
    const s = sessions.value.find((x) => x.sessionId === sessionId);
    if (s && s.unreadCount) {
      s.unreadCount = 0;
      sessions.value = sortSessions(sessions.value);
      loadUnread();
    }
  }

  // ===== SignalR 事件绑定 =====
  async function initRealtime(): Promise<void> {
    // connected 既是「已连接」标记，也是重复注册守卫：
    // 无此守卫时 conn.on 会被注册多次，未读数随之双增
    if (connected.value) return;
    try {
      const conn = await connectSignalR();

      conn.on('ReceiveMessage', (message: MessageDto) => {
        pushMessage(message);
        bumpSession(message.sessionId, message.content || '[附件消息]');
        if (message.sessionId !== activeSessionId.value) {
          const s = sessions.value.find((x) => x.sessionId === message.sessionId);
          if (s) {
            s.unreadCount = (s.unreadCount || 0) + 1;
            sessions.value = sortSessions(sessions.value);
          }
          loadUnread();
        }
      });

      conn.on('MessageRecalled', (messageId: string) => {
        for (const sessionId of Object.keys(messages.value)) {
          const m = messages.value[sessionId].find((x) => x.messageId === messageId);
          if (m) m.isRecalled = true;
        }
      });

      conn.on('UserOnline', (userId: string) => {
        onlineUsers.value[String(userId)] = true;
      });

      conn.on('UserOffline', (userId: string) => {
        onlineUsers.value[String(userId)] = false;
      });

      // TypingIndicator 由服务端带上输入者 userId（且服务端已排除输入者自身）
      conn.on('TypingIndicator', (sessionId: string, userId: string) => {
        typing.value[sessionId] = String(userId);
        // 3 秒后清除
        setTimeout(() => {
          if (typing.value[sessionId] === String(userId)) delete typing.value[sessionId];
        }, 3000);
      });

      conn.on('UnreadCountUpdated', (sessionId: string, count: number) => {
        const s = sessions.value.find((x) => x.sessionId === sessionId);
        if (s) s.unreadCount = count;
        loadUnread();
      });

      connected.value = true;
      console.log('SignalR 已连接');
    } catch (e) {
      console.error('SignalR 初始化失败:', e);
    }
  }

  function removeSession(sessionId: string): void {
    sessions.value = sessions.value.filter((s) => s.sessionId !== sessionId);
    delete messages.value[sessionId];
    if (activeSessionId.value === sessionId) activeSessionId.value = '';
  }

  return {
    sessions,
    friends,
    groups,
    messages,
    activeSessionId,
    unreadTotal,
    onlineUsers,
    typing,
    messageLoading,
    hasMoreMessages,
    profiles,
    initialLoaded,
    ensureLoaded,
    loadSessions,
    loadFriends,
    loadGroups,
    loadUnread,
    loadProfiles,
    upsertSession,
    activateSession,
    loadMessages,
    retryMessage,
    sendText,
    sendMedia,
    sendTyping,
    markSessionRead,
    markUnreadRead,
    clearUnread,
    // 展示解析
    sessionTitle,
    sessionAvatar,
    isPeerOnline,
    isMine,
    senderName,
    senderAvatar,
    membersOf,
    peerIdOf,
    currentUserId,
    initRealtime,
    removeSession
  };
});