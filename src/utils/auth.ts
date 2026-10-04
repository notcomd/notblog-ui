export const TOKEN_KEY = 'token';
export const REFRESH_TOKEN_KEY = 'refresh_token';
/** 当前用户资料缓存键（Message /api/user-info/me 的下发内容，含头像） */
export const USER_INFO_KEY = 'user_info';

export function getToken(): string {
  return localStorage.getItem(TOKEN_KEY) || '';
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function getRefreshToken(): string {
  return localStorage.getItem(REFRESH_TOKEN_KEY) || '';
}

export function setRefreshToken(token: string): void {
  localStorage.setItem(REFRESH_TOKEN_KEY, token);
}

export function removeRefreshToken(): void {
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

/**
 * 读取用户资料缓存（可能为 null）。
 * 用途：刷新页面时先渲染已缓存的头像/昵称，不必等 /api/user-info/me 返回，
 * 避免顶栏头像每次重载都先闪一下占位图。
 */
export function getUserInfoCache<T = Record<string, unknown>>(): T | null {
  try {
    const raw = localStorage.getItem(USER_INFO_KEY);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    // 缓存内容损坏/被手改：当作无缓存，不让解析异常打断启动
    return null;
  }
}

/** 写入用户资料缓存（写入失败不致命：隐私模式/配额满时静默降级为不缓存） */
export function setUserInfoCache(info: unknown): void {
  try {
    localStorage.setItem(USER_INFO_KEY, JSON.stringify(info));
  } catch {
    /* 忽略：缓存失败不影响功能，仅失去首帧渲染优势 */
  }
}

/** 清除用户资料缓存（登出/会话失效时调用，避免下一个用户看到上一个人的头像） */
export function removeUserInfoCache(): void {
  localStorage.removeItem(USER_INFO_KEY);
}

/** 后台管理角色名（小写）。后端预置为 Root / Administrator，Admin 兼容角色被改名的场景 */
const ADMIN_ROLE_NAMES = ['root', 'admin', 'administrator'];

/**
 * 角色 claim 是否包含后台管理角色（Root / Administrator）。
 * 后端把用户的多个角色以逗号拼接进同一个 ClaimTypes.Role（见 Identity 的 LogInCommandHandler），
 * 因此这里拆开后逐个精确匹配，不能用 includes('admin') 之类的子串匹配
 * —— 那会把 SuperAdmin 之类的角色名误判成管理员。
 * 后端预置角色名见 Identity 的 Roles.RoleFactory：Root / Administrator / User / Guest。
 */
export function hasAdminRole(role?: string | null): boolean {
  if (!role) return false;
  return role
    .split(',')
    .map((r) => r.trim().toLowerCase())
    .some((r) => ADMIN_ROLE_NAMES.includes(r));
}
