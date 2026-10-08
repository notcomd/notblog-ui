import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import {
  getToken,
  removeToken,
  removeRefreshToken,
  getUserInfoCache,
  setUserInfoCache,
  removeUserInfoCache,
  hasAdminRole
} from '@/utils/auth';
import { getMyUserInfo } from '@/api/userinfo';
import { authorGuid, displayAuthorName, resolveAuthorName } from '@/utils/author';
import type { AuthorLike } from '@/utils/author';
import type { CurrentUser, UserInfo } from '@/types';

// 从 JWT payload 解析用户信息（sub/email/name/role claims）
function parseJwt(token: string): Record<string, unknown> | null {
  try {
    const payload = token.split('.')[1];
    const json = decodeURIComponent(escape(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))));
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

// .NET 的 JwtSecurityTokenHandler（本项目 .NET 10）序列化时不压缩 claim 名，
// payload 里是完整 URI（如 .../nameidentifier）。统一归一化为短名再解析。
const CLAIM_URI_MAP: Record<string, string> = {
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier': 'nameid',
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name': 'unique_name',
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress': 'email',
  'http://schemas.microsoft.com/ws/2008/06/identity/claims/role': 'role'
};

function normalizeClaims(claims: Record<string, unknown>): Record<string, unknown> {
  const out = { ...claims };
  for (const [uri, short] of Object.entries(CLAIM_URI_MAP)) {
    if (out[uri] != null && out[short] == null) out[short] = out[uri];
  }
  return out;
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref(getToken());
  const user = ref<CurrentUser | null>(null);
  // 用户资料（含头像）：JWT 不含头像，唯一来源是 Message /api/user-info/me。
  // 首帧先用本地缓存渲染，随后由 loadUserInfo() 拉取覆盖，避免刷新时头像闪一下占位图。
  const userInfo = ref<UserInfo | null>(getUserInfoCache<UserInfo>());

  /** 把资料的 avatarUrl 合并进 user —— user 来自 JWT，资料来自接口，两者需显式同步 */
  function applyUserInfo(): void {
    if (!user.value) return;
    user.value.avatar = userInfo.value?.avatarUrl || '';
  }

  function refreshUserFromToken() {
    const t = getToken();
    token.value = t;
    const claims = t ? normalizeClaims(parseJwt(t) ?? {}) : null;
    user.value = claims
      ? {
          // Identity 用默认 JwtSecurityTokenHandler 签发：NameIdentifier→nameid、Name→unique_name
          id: String(
            claims.sub ?? claims.user_guid ?? claims.nameid ?? claims.NameIdentifier ?? ''
          ),
          email: String(claims.email ?? claims.Email ?? ''),
          name: String(claims.name ?? claims.unique_name ?? claims.Name ?? claims.email ?? '用户'),
          role: String(claims.role ?? claims.Role ?? '')
        }
      : null;
    applyUserInfo();
  }

  refreshUserFromToken();

  /**
   * 拉取当前用户资料（Message GET /api/user-info/me，含 avatarUrl）并写入本地缓存。
   * 失败静默：保留缓存值，不因一次网络抖动把顶栏头像清成占位图。
   * 并发去重：应用启动 / 登录成功 / 顶栏挂载可能几乎同时触发，共享同一在途请求，
   * 避免同一接口被重复请求。
   */
  let inflightLoad: Promise<void> | null = null;

  function loadUserInfo(): Promise<void> {
    if (inflightLoad) return inflightLoad;
    inflightLoad = doLoadUserInfo().finally(() => {
      inflightLoad = null;
    });
    return inflightLoad;
  }

  async function doLoadUserInfo(): Promise<void> {
    if (!getToken()) {
      // 未登录：不发请求，并清掉可能残留的上一个用户的资料
      userInfo.value = null;
      removeUserInfoCache();
      applyUserInfo();
      return;
    }
    try {
      const res = await getMyUserInfo();
      const d = (res && (res as { data?: UserInfo }).data) || (res as unknown as UserInfo);
      if (!d) return;
      userInfo.value = d;
      setUserInfoCache(d);
      applyUserInfo();
    } catch {
      /* 静默：沿用缓存 */
    }
  }

  // 读响应式 token ref（而非直读 localStorage），否则模板 v-if 与 watch 都不会随登录态变化重算
  function isLoggedIn(): boolean {
    return !!token.value;
  }

  /**
   * 是否为后台管理角色（Root / Administrator）：管理端入口显隐与路由门禁共用这一处判定。
   * 判定细节见 utils/auth 的 hasAdminRole（含多角色 claim 的拆分与精确匹配）。
   * ⚠️ 前端判定只用于界面与路由，真正的鉴权在后端权限中间件。
   */
  const isAdmin = computed<boolean>(() => hasAdminRole(user.value?.role));

  /**
   * 当前登录用户显示名：优先本地缓存 me 的昵称（Message /api/user-info/me），
   * 其次 JWT 用户名/邮箱。用于「作者就是自己」时把 GUID 映射为用户名。
   */
  const displayName = computed<string>(() => {
    const nick = (userInfo.value?.nickName || '').trim();
    if (nick) return nick;
    const name = (user.value?.name || '').trim();
    if (name && name !== '用户') return name;
    return ((userInfo.value?.email || user.value?.email || '').trim()) || '未知用户';
  });

  /** 作者 GUID → 显示名：当前用户自己的内容用本地 me 兜底（规则见 utils/author） */
  function resolveName(author?: AuthorLike | null): string {
    return resolveAuthorName(author, { guid: user.value?.id, name: displayName.value });
  }

  /**
   * 作者显示名（含异步补取，供列表/详情直接渲染）：
   * 自己 → 本地 me 昵称；后端已给真实昵称 → 直接用；只有 GUID → 按 GUID 异步取昵称。
   * 异步未就绪 / 失败时返回 fallback（响应式缓存，拿到后自动重渲染）。
   */
  function resolveDisplayName(author?: AuthorLike | null, fallback = '未知用户'): string {
    const guid = authorGuid(author);
    if (guid && user.value?.id && String(user.value.id).toLowerCase() === guid.toLowerCase()) {
      return displayName.value;
    }
    return displayAuthorName(guid, author?.userName || author?.nickName || author?.nickname || author?.name, fallback);
  }

  function logout() {
    removeToken();
    removeRefreshToken();
    removeUserInfoCache();
    token.value = '';
    user.value = null;
    userInfo.value = null;
  }

  return {
    token,
    user,
    userInfo,
    isLoggedIn,
    isAdmin,
    displayName,
    resolveName,
    resolveDisplayName,
    logout,
    refreshUserFromToken,
    loadUserInfo
  };
});
