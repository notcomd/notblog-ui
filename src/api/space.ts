import service from '@/axios';

/** 修改密码请求体 */
interface ChangePasswordData {
  email: string;
  oldPassword: string;
  newPassword: string;
}

export function getUserFavorites() {
  // ⚠️ 后端缺口：无 GET /api/tweets/favorites/my，返回空态
  return Promise.resolve({ data: { items: [], total: 0, page: 1, pageSize: 9 } });
}

export function getUserFiles() {
  // ⚠️ 后端缺口：无「我的文件」列表端点，返回空态
  return Promise.resolve({ data: { items: [], total: 0, page: 1, pageSize: 50 } });
}

// ===== OAuth 绑定（Identity：/api/identity/auth/oauth/*） =====
// 已绑定列表：GET /api/identity/auth/oauth/linked -> [{ provider, providerUserId, displayName, linkedAt }]
export function getLinkedAccounts() {
  return service.get('/api/identity/auth/oauth/linked');
}

// 解绑：DELETE /api/identity/auth/oauth/unlink?provider=&providerUserId=
export function unlinkAccount(provider: string, providerUserId: string) {
  return service.delete('/api/identity/auth/oauth/unlink', {
    params: { provider, providerUserId }
  });
}

// ===== 修改密码（Identity：/api/identity/ready/identity/ChangeByPassword，需认证） =====
// body: { email, password(旧), newPassword, code(可空，邮箱验证码方式) }
export function changePassword(payload: ChangePasswordData) {
  return service.post('/api/identity/ready/identity/ChangeByPassword', {
    email: payload.email,
    password: payload.oldPassword,
    newPassword: payload.newPassword,
    code: null
  });
}
