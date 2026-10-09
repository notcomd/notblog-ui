import { reactive } from 'vue';
import { getToken } from '@/utils/auth';
import { unwrap } from '@/utils/response';
import { getUserProfile } from '@/api/chat';
import { getMarkdownDoc } from '@/api/markdown';

// 作者名解析：把「后端只给出 GUID / GUID 片段」的作者位统一解析为可显示的用户名。
//
// 背景：部分后端 DTO 没有昵称字段，映射时会用作者 GUID 的前 8 位充当名称
// （如 Message TweetDto.Author.UserName = AuthorGuid.ToString("N")[..8]，
//  Markdown MarkdownResponse 只有 MarkUserGuid），直接渲染出来就是一串用户 ID。
// 本模块集中定义优先级：真实昵称 → 当前登录用户（本地 me 缓存）→ 保留原值/兜底短文案。

/** 作者体（各 DTO 字段名不一，取并集） */
export interface AuthorLike {
  /** 用户 GUID（用户资料 / 推文作者） */
  userGuid?: string | null;
  /** 用户 GUID（评论 / 关注等 DTO） */
  userId?: string | null;
  /** 用户 GUID（备用字段名） */
  
  guid?: string | null;
  /** 用户 GUID（备用字段名） */
  id?: string | null;
  /** 昵称（UserInfoDto / UserProfileDto） */
  nickName?: string | null;
  /** 昵称（部分前端结构体） */
  nickname?: string | null;
  /** 用户名（UserBriefDto.userName） */
  userName?: string | null;
  /** 名称（备用字段名） */
  name?: string | null;
}

const GUID_HEX_RE = /^[0-9a-f]{32}$/i;
const GUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const GUID_PREFIX_RE = /^[0-9a-f]{8}$/i;

/** 取作者体上的用户 GUID（归一为字符串） */
export function authorGuid(author?: AuthorLike | null): string {
  if (!author) return '';
  return String(author.userGuid || author.userId || author.guid || author.id || '').trim();
}

/** 字符串是否是完整 GUID（带连字符或 N 格式） */
export function looksLikeGuid(v?: string | null): boolean {
  const s = String(v || '').trim();
  return GUID_RE.test(s) || GUID_HEX_RE.test(s);
}

/** 名字是否只是作者 GUID 前 8 位的占位（后端无昵称时的降级值） */
export function isGuidPlaceholder(name: string | null | undefined, guid?: string | null): boolean {
  const n = String(name || '').trim().toLowerCase();
  if (!n || !GUID_PREFIX_RE.test(n)) return false;
  const hex = String(guid || '').replace(/-/g, '').toLowerCase();
  return hex.length >= 8 && hex.slice(0, 8) === n;
}

/**
 * 解析作者显示名，优先级：
 * 1. 后端给出的真实昵称/用户名（非 GUID、也非 GUID 片段占位）→ 直接使用；
 * 2. 作者恰好是当前登录用户 → 用本地缓存的 me 昵称（来自 Message /api/user-info/me）；
 * 3. 兜底：保留后端原值（可能是 8 位 GUID 片段，无处取名，不凭空编造）；原值为空时返回 fallback。
 */
export function resolveAuthorName(
  author?: AuthorLike | null,
  current?: { guid?: string | null; name?: string | null } | null,
  fallback = '未知用户'
): string {
  if (!author) return fallback;
  const guid = authorGuid(author);
  const raw = String(
    author.nickName || author.nickname || author.name || author.userName || ''
  ).trim();

  if (raw && !looksLikeGuid(raw) && !isGuidPlaceholder(raw, guid)) return raw;

  const curGuid = String(current?.guid || '').trim();
  const curName = String(current?.name || '').trim();
  if (curGuid && curName && guid && curGuid.toLowerCase() === guid.toLowerCase()) return curName;

  return raw || fallback;
}

// ============================================================
// 异步补取作者资料（昵称 + 头像）：部分后端 DTO 只有作者 GUID（Markdown MarkUserGuid、
// CommunityPostDto.AuthorGuid、VideoDetailDto.AuthorGuid、VideoReviewResponse.UserGuid、
// CommentDto 空 UserName 等），后端无用户查询机制无法填昵称/头像。方案 A：前端按 GUID 调
// Message 的 GET /api/users/{userGuid}（UserProfileDto.nickName + avatarUrl）一次取回两者，
// 昵称与头像共用同一份缓存/在途请求/并发上限。
// ============================================================

/** 作者资料（一次 GUID 查询的落地结果） */
export interface AuthorProfile {
  name: string;
  avatar: string;
}

/** 作者资料缓存：GUID(小写) → { name, avatar }。只写请求成功的结果；失败不写，允许后续重试 */
const authorProfileCache = reactive<Record<string, AuthorProfile>>({});

/** 在途请求：GUID(小写) → Promise。并发去重：同一 GUID 的多个调用共享同一个请求 */
const inflight = new Map<string, Promise<AuthorProfile | null>>();

/** 并发上限：列表场景多行同时展开时，最多同时打这么多请求，其余排队，避免瞬时请求风暴 */
const MAX_CONCURRENT_FETCH = 4;
let activeFetches = 0;
const waitQueue: Array<() => void> = [];

function acquireSlot(): Promise<void> {
  if (activeFetches < MAX_CONCURRENT_FETCH) {
    activeFetches++;
    return Promise.resolve();
  }
  return new Promise<void>((resolve) => {
    waitQueue.push(() => {
      activeFetches++;
      resolve();
    });
  });
}

function releaseSlot(): void {
  activeFetches--;
  const next = waitQueue.shift();
  if (next) next();
}

/** 真正发起一次请求：取 UserProfileDto.nickName + avatarUrl。全程静默，失败返回 null（不算成功，不缓存） */
async function fetchAuthorProfile(guid: string): Promise<AuthorProfile | null> {
  await acquireSlot();
  try {
    const dto = unwrap(await getUserProfile(guid)) as
      | { nickName?: string | null; avatarUrl?: string | null }
      | null;
    const rawName = String(dto?.nickName || '').trim();
    const profile: AuthorProfile = {
      // GUID 片段占位不入缓存（等同未取到昵称）
      name: rawName && !looksLikeGuid(rawName) ? rawName : '',
      avatar: String(dto?.avatarUrl || '').trim()
    };
    authorProfileCache[guid.toLowerCase()] = profile;
    return profile;
  } catch {
    // 静默降级：网络错误 / 403 / 404 均不抛出、不缓存，交由调用方兜底
    return null;
  } finally {
    releaseSlot();
  }
}

/** 取作者资料（缓存 → 在途去重 → 排队发请求）。失败返回 null，不写缓存，允许后续重试 */
function authorProfileOf(guid: string): Promise<AuthorProfile | null> {
  const key = guid.toLowerCase();
  const cached = authorProfileCache[key];
  if (cached) return Promise.resolve(cached);
  let pending = inflight.get(key);
  if (!pending) {
    pending = fetchAuthorProfile(guid).finally(() => {
      inflight.delete(key);
    });
    inflight.set(key, pending);
  }
  return pending;
}

/**
 * 按 GUID 异步解析作者昵称。
 * - 缓存命中直接返回；
 * - 同一 GUID 的并发调用共享同一个在途 Promise（去重，不重复打接口）；
 * - 全局并发上限，超出排队；
 * - 失败 / 拿不到昵称 → 返回 fallback（不抛出、不缓存失败，允许重试）；
 * - GUID 为空、非完整 GUID（含「GUID 前 8 位」这类占位）或游客（无 token）→ 不发请求，直接兜底。
 */
export async function resolveAuthorNameAsync(
  guid?: string | null,
  fallback = '未知用户'
): Promise<string> {
  const g = String(guid || '').trim();
  if (!g || !looksLikeGuid(g) || !getToken()) return fallback;
  const profile = await authorProfileOf(g);
  return (profile && profile.name) || fallback;
}

/**
 * 按 GUID 异步解析作者头像地址（与昵称共用同一份缓存 / 在途请求 / 并发上限，不额外打接口）。
 * 失败 / 无头像 / 游客 → 返回 fallback（由调用方回退首字头像）。
 */
export async function resolveAuthorAvatarAsync(
  guid?: string | null,
  fallback = ''
): Promise<string> {
  const g = String(guid || '').trim();
  if (!g || !looksLikeGuid(g) || !getToken()) return fallback;
  const profile = await authorProfileOf(g);
  return (profile && profile.avatar) || fallback;
}

/**
 * 组件模板用（响应式）：命中缓存返回昵称，否则返回 fallback 并触发一次后台解析。
 * 读取的是响应式缓存，解析成功后引用该值的组件会自动重渲染，无需等待 Promise。
 */
export function authorNameOf(guid?: string | null, fallback = '未知用户'): string {
  const g = String(guid || '').trim();
  if (!g || !looksLikeGuid(g)) return fallback;
  const cached = authorProfileCache[g.toLowerCase()];
  if (cached) return cached.name || fallback;
  // fallback 传空串：失败时不把「未知用户」写进缓存，由调用方的 fallback 兜底
  void resolveAuthorNameAsync(g, '');
  return fallback;
}

/**
 * 组件模板用（响应式）：命中缓存返回头像地址，否则返回 fallback 并触发一次后台解析。
 * 拿不到头像（无 token / 失败 / 该用户无头像）返回 fallback，由调用方回退首字头像。
 */
export function authorAvatarOf(guid?: string | null, fallback = ''): string {
  const g = String(guid || '').trim();
  if (!g || !looksLikeGuid(g)) return fallback;
  const cached = authorProfileCache[g.toLowerCase()];
  if (cached) return cached.avatar || fallback;
  void resolveAuthorAvatarAsync(g, '');
  return fallback;
}

/**
 * 组件模板用：综合「同步优先值 + 异步补取」。
 * syncName 是可用的真实昵称（非 GUID、非 GUID 片段占位）时直接用，否则按 guid 异步解析。
 */
export function displayAuthorName(
  guid?: string | null,
  syncName?: string | null,
  fallback = '未知用户'
): string {
  const raw = String(syncName || '').trim();
  if (raw && !looksLikeGuid(raw) && !isGuidPlaceholder(raw, guid)) return raw;
  return authorNameOf(guid, fallback);
}

// ============================================================
// Markdown 作者补取：文章「列表」摘要（MarkdownSummaryResponse）不含任何作者字段，
// 只有详情（MarkdownResponse.markUserGuid）才有作者 GUID。故按文档 GUID 先取作者 GUID，
// 再复用上面的按 GUID 解析头像/昵称。同样走缓存 + 在途去重 + 全局并发上限，避免请求风暴。
// ============================================================

/** 文档 GUID(小写) → 作者 GUID。只写成功结果；失败不写，允许后续重试 */
const markdownAuthorGuidCache = reactive<Record<string, string>>({});

/** 在途请求：文档 GUID(小写) → Promise */
const markdownInflight = new Map<string, Promise<string>>();

/** 真正发起一次请求：取 MarkdownResponse.markUserGuid。全程静默，失败返回空串（不缓存） */
async function fetchMarkdownAuthorGuid(markGuid: string): Promise<string> {
  await acquireSlot();
  try {
    const dto = unwrap(await getMarkdownDoc(markGuid)) as { markUserGuid?: string | null } | null;
    const guid = String(dto?.markUserGuid || '').trim();
    if (guid) markdownAuthorGuidCache[markGuid.toLowerCase()] = guid;
    return guid;
  } catch {
    return '';
  } finally {
    releaseSlot();
  }
}

/** 按文档 GUID 解析作者 GUID（缓存 + 在途去重 + 并发上限）。失败/无 token → 空串 */
export function resolveMarkdownAuthorGuidAsync(markGuid?: string | null): Promise<string> {
  const g = String(markGuid || '').trim();
  if (!g || !getToken()) return Promise.resolve('');
  const key = g.toLowerCase();
  const cached = markdownAuthorGuidCache[key];
  if (cached) return Promise.resolve(cached);
  let pending = markdownInflight.get(key);
  if (!pending) {
    pending = fetchMarkdownAuthorGuid(g).finally(() => {
      markdownInflight.delete(key);
    });
    markdownInflight.set(key, pending);
  }
  return pending;
}

/** 组件模板用（响应式）：命中缓存返回作者 GUID，否则返回空串并触发一次后台解析 */
export function markdownAuthorGuidOf(markGuid?: string | null): string {
  const g = String(markGuid || '').trim();
  if (!g) return '';
  const cached = markdownAuthorGuidCache[g.toLowerCase()];
  if (cached) return cached;
  void resolveMarkdownAuthorGuidAsync(g);
  return '';
}
