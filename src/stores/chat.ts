import { ref } from 'vue';
import { defineStore } from 'pinia';
import type { HubConnection } from '@microsoft/signalr';
import {
  getSessions,
  getMessages,
  getFriends,
  getGroups,
  getUnreadCount,
  MessageType
} from '@/api/chat';
import { connectSignalR, isConnected } from '@/socket/signalr';

interface SessionDto {
  sessionId: string;
  sessionName?: string;
  isPinned?: boolean;
  unreadCount?: number;
  lastMessageTime?: number;
  createdTime?: number;
  lastMessageContent?: string;
  participants?: string[];
  [key: string]: unknown;
}

interface FriendDto {
  friendId: string;
  friendName?: string;
  [key: string]: unknown;
}

interface MessageDto {
  messageId: string;
  sessionId: string;
  senderId: string;
  receiverId?: string | null;
  messageType?: number;
  status?: number;
  content?: string;
  sentTime?: number;
  isRead?: boolean;
  isRecalled?: boolean;
  /** 媒体/文件消息字段（与后端 MessageDto 对齐） */
  mediaUrl?: string;
  thumbnailUrl?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  duration?: number | null;
  caption?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  locationName?: string | null;
  linkUrl?: string | null;
  linkTitle?: string | null;
  linkDescription?: string | null;
  attachments?: Array<Record<string, unknown>> | null;
  [key: string]: unknown;
}

/** 消息类型简易文案（未读摘要与会话列表展示用） */
function messageSummary(m: MessageDto): string {
  switch (m.messageType ?? MessageType.Text) {
    case MessageType.Image: return '[图片]';
    case MessageType.Video: return '[视频]';
    case MessageType.Audio: return '[语音]';
    case MessageType.File: return `[文件${m.fileName ? ' ' + m.fileName : ''}]`;
    case MessageType.Location: return '[位置]';
    case MessageType.Link: return m.linkTitle || '[链接]';
    case MessageType.Expression: return '[表情]';
    default: return m.content || '[消息]';
  }
}

export const useChatStore = defineStore('chat', () => {
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

  // ===== 会话 =====
  async function loadSessions(): Promise<void> {
    try {
      const res = await getSessions();
      const data = res && res.data ? res.data : res;
      const list = data.items || data.list || data || [];
      sessions.value = sortSessions(list);
    } catch (e) {
      console.error('加载会话失败:', e);
    }
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
    try {
      const res = await getFriends();
      const data = res && res.data ? res.data : res;
      friends.value = data.items || data.list || data || [];
    } catch (e) {
      console.error('加载好友失败:', e);
    }
  }

  async function loadGroups(): Promise<void> {
    try {
      const res = await getGroups();
      const data = res && res.data ? res.data : res;
      groups.value = data.items || data.list || data || [];
    } catch (e) {
      console.error('加载群组失败:', e);
    }
  }

  async function loadUnread(): Promise<void> {
    try {
      const res = await getUnreadCount();
      const data = res && res.data ? res.data : res;
      unreadTotal.value = (data && (data.total !== undefined ? data.total : data.unreadCount)) || 0;
    } catch (e) {
      /* 静默 */
    }
  }

  // ===== 消息 =====
  async function openSession(sessionId: string): Promise<void> {
    if (activeSessionId.value === sessionId) {
      // ⚠️ 已激活但消息为空（首次加载失败/被并发锁吞掉）→ 补加载；
      //    否则该会话永远打不开，必须刷新重置 store 才能重试（用户反馈「点击会话要刷新才出现内容」）
      if (!messages.value[sessionId] || !messages.value[sessionId].length) {
        await loadMessages(sessionId, true);
      }
      return;
    }
    activeSessionId.value = sessionId;
    if (!messages.value[sessionId]) {
      await loadMessages(sessionId, true);
    }
    // 打开会话即通知服务端已读（SignalR MarkAsRead 逐条），并清零本会话未读角标
    await markSessionRead(sessionId);
  }

  async function loadMessages(sessionId: string, reset = false): Promise<void> {
    // 按会话粒度锁（曾为全局锁：会话 A 加载中点击会话 B 会被静默吞掉 → B 永远空白）
    if (messageLoading.value[sessionId]) return;
    messageLoading.value[sessionId] = true;
    try {
      const page = reset ? 1 : Math.floor((messages.value[sessionId] || []).length / 30) + 1;
      const res = await getMessages(sessionId, { page, pageSize: 30 });
      const data = res && res.data ? res.data : res;
      const list = data.items || data.list || [];
      if (reset) {
        messages.value[sessionId] = list;
      } else if (list.length) {
        messages.value[sessionId] = [...list.reverse(), ...(messages.value[sessionId] || [])];
      }
      hasMoreMessages.value[sessionId] = list.length >= 30;
    } catch (e) {
      console.error('加载消息失败:', e);
    } finally {
      messageLoading.value[sessionId] = false;
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

    const list = messages.value[sessionId] || [];
    const existing = list.find((m) => m.messageId === messageId);
    if (existing) {
      Object.assign(existing, msg);
    } else {
      pushMessage(msg);
    }
    bumpSession(sessionId, content);

    try {
      const conn = await connectSignalR();
      await conn.invoke('SendMessage', sessionId, {
        sessionId,
        messageType: MessageType.Text,
        content,
        fileId: null,
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
      const sent = (messages.value[sessionId] || []).find((m) => m.messageId === messageId);
      if (sent) sent.status = 1;
    } catch (e) {
      console.error('发送消息失败:', e);
      const failed = (messages.value[sessionId] || []).find((m) => m.messageId === messageId);
      if (failed) failed.status = -1;
      throw e;
    }
    return msg;
  }

  // 重发失败消息
  async function retryMessage(sessionId: string, messageId: string): Promise<boolean> {
    const list = messages.value[sessionId] || [];
    const target = list.find((m) => m.messageId === messageId);
    if (!target || target.status !== -1) return false;
    await sendText(sessionId, target.content as string, target.messageId);
    return true;
  }

  // ===== 媒体/文件消息 =====

  /**
   * 发送媒体/文件消息（图片/视频/音频走 SendMessage 指定 MessageType；
   * 文件走 SendFileMessage 由服务端按 MessageFile 建消息与附件）。
   * 乐观插入本地消息，服务端 ReceiveMessage 回执按 messageId 去重。
   */
  async function sendMedia(sessionId: string, payload: {
    type: number;
    fileId: string;
    thumbnailFileId?: string | null;
    content?: string;
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
    mediaUrl?: string;
    thumbnailUrl?: string;
    duration?: number | null;
  }): Promise<MessageDto> {
    const me = currentUserId();
    const messageId = 'local-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
    const msg: MessageDto = {
      messageId,
      sessionId,
      senderId: me,
      receiverId: null,
      messageType: payload.type,
      status: 0,
      content: payload.content || '',
      fileName: payload.fileName,
      fileSize: payload.fileSize,
      mimeType: payload.mimeType,
      mediaUrl: payload.mediaUrl,
      thumbnailUrl: payload.thumbnailUrl,
      duration: payload.duration ?? null,
      sentTime: Date.now()
    };
    pushMessage(msg);
    bumpSession(sessionId, messageSummary(msg));

    try {
      const conn = await connectSignalR();
      if (payload.type === MessageType.File) {
        // v2 专用文件通道：服务端自动创建 MessageFile 消息 + 附件记录
        await conn.invoke('SendFileMessage', sessionId, payload.fileId);
      } else {
        await conn.invoke('SendMessage', sessionId, {
          sessionId,
          messageType: payload.type,
          content: payload.content || '',
          fileId: payload.fileId,
          thumbnailFileId: payload.thumbnailFileId || null,
          duration: payload.duration ?? null,
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
      const sent = (messages.value[sessionId] || []).find((m) => m.messageId === messageId);
      if (sent) sent.status = 1;
    } catch (e) {
      console.error('发送媒体消息失败:', e);
      const failed = (messages.value[sessionId] || []).find((m) => m.messageId === messageId);
      if (failed) failed.status = -1;
      throw e;
    }
    return msg;
  }

  /** 发送图片消息 */
  function sendImage(sessionId: string, opts: { fileId: string; thumbnailFileId?: string | null; mediaUrl?: string; thumbnailUrl?: string; fileName?: string; fileSize?: number; mimeType?: string }) {
    return sendMedia(sessionId, { type: MessageType.Image, content: '[图片]', ...opts });
  }

  /** 发送视频消息 */
  function sendVideo(sessionId: string, opts: { fileId: string; thumbnailFileId?: string | null; mediaUrl?: string; thumbnailUrl?: string; fileName?: string; fileSize?: number; mimeType?: string }) {
    return sendMedia(sessionId, { type: MessageType.Video, content: '[视频]', ...opts });
  }

  /** 发送语音消息 */
  function sendAudio(sessionId: string, opts: { fileId: string; mediaUrl?: string; duration?: number | null }) {
    return sendMedia(sessionId, { type: MessageType.Audio, content: '[语音]', duration: opts.duration ?? null, ...opts });
  }

  /** 发送文件消息（SendFileMessage 通道） */
  function sendFile(sessionId: string, opts: { fileId: string; fileName?: string; fileSize?: number; mimeType?: string; mediaUrl?: string }) {
    return sendMedia(sessionId, { type: MessageType.File, content: opts.fileName || '[文件]', ...opts });
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

  async function markSessionRead(sessionId: string): Promise<void> {
    const list = messages.value[sessionId] || [];
    if (!list.length) return;
    try {
      const conn = await connectSignalR();
      for (const m of list) {
        if (m.senderId !== currentUserId()) {
          await conn.invoke('MarkAsRead', m.messageId);
          m.isRead = true;
        }
      }
    } catch (e) {
      /* 静默 */
    }
  }

  // ===== 内部工具 =====
  function currentUserId(): string {
    // 当前用户 ID 从 JWT payload 解析
    // ⚠️ Identity 签发的 JWT claim 名是完整 URI（.NET 10 不压缩），payload 无 sub
    const t = localStorage.getItem('token');
    try {
      const payload = JSON.parse(
        decodeURIComponent(
          escape(atob((t as string).split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
        )
      );
      return (
        payload.sub ||
        payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] ||
        ''
      );
    } catch (e) {
      return '';
    }
  }

  function peerIdOf(sessionId: string): string {
    const s = sessions.value.find((x) => x.sessionId === sessionId);
    const me = currentUserId();
    if (!s || !s.participants) return 'u-002';
    return s.participants.find((p) => p !== me) || 'u-002';
  }

  function sessionName(sessionId: string): string {
    const s = sessions.value.find((x) => x.sessionId === sessionId);
    if (s && s.sessionName) return s.sessionName;
    // 单聊：从好友列表找
    const peerId = peerIdOf(sessionId);
    const f = friends.value.find((x) => String(x.friendId) === String(peerId));
    return f ? f.friendName || '会话' : '会话';
  }

  function pushMessage(msg: MessageDto): void {
    const list = messages.value[msg.sessionId] || [];
    // 去重（本地乐观消息与服务器回执）
    if (list.some((m) => m.messageId === msg.messageId)) return;
    messages.value[msg.sessionId] = [...list, msg];
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
    if (connected.value) return;
    try {
      const conn = await connectSignalR();

      conn.on('ReceiveMessage', (message: MessageDto) => {
        pushMessage(message);
        bumpSession(message.sessionId, messageSummary(message));
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
          const list = messages.value[sessionId];
          const m = list.find((x) => x.messageId === messageId);
          if (m) m.isRecalled = true;
        }
      });

      conn.on('UserOnline', (userId: string) => {
        onlineUsers.value[String(userId)] = true;
      });

      conn.on('UserOffline', (userId: string) => {
        onlineUsers.value[String(userId)] = false;
      });

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
    if (activeSessionId.value === sessionId) activeSessionId.value = null;
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
    connected,
    messageLoading,
    hasMoreMessages,
    loadSessions,
    loadFriends,
    loadGroups,
    loadUnread,
    openSession,
    loadMessages,
    retryMessage,
    sendText,
    sendImage,
    sendVideo,
    sendAudio,
    sendFile,
    sendTyping,
    markSessionRead,
    clearUnread,
    sessionName,
    peerIdOf,
    currentUserId,
    initRealtime,
    removeSession
  };
});
