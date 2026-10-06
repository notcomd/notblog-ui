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
