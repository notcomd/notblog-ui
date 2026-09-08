import { ref } from 'vue';
import { defineStore } from 'pinia';
import { getToken, removeToken, removeRefreshToken } from '@/utils/auth';
import type { CurrentUser } from '@/types';

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
  }

  refreshUserFromToken();

  function isLoggedIn(): boolean {
    return !!getToken();
  }

  function logout() {
    removeToken();
    removeRefreshToken();
    token.value = '';
    user.value = null;
  }

  return { token, user, isLoggedIn, logout, refreshUserFromToken };
});
