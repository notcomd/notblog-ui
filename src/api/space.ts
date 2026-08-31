import service from '@/axios';

/** 修改密码请求体 */
interface ChangePasswordData {
  email: string;
  oldPassword: string;
  newPassword: string;
}

// 我的收藏列表：GET /api/tweets/favorites/my -> ApiResponse<PagedResult<CommunityPostDto>>
export function getUserFavorites(params?: { page?: number; pageSize?: number }) {
  return service.get('/api/tweets/favorites/my', { params });
}

// 我的文件列表：GET /api/filestorage/files/my -> { ok, items, total, page, pageSize }
export function getUserFiles(params?: { page?: number; pageSize?: number }) {
  return service.get('/api/filestorage/files/my', { params });
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

// ===== 二次验证（Identity：/api/identity/ready/identity/UserSafety，需认证） =====

// 读取当前二次验证开关状态：GET .../UserSafety -> { isTwoFactorEnabled }
export function getUserSafety() {
  return service.get('/api/identity/ready/identity/UserSafety');
}

// 更新二次验证开关：POST .../UserSafety { isTwoFactorEnabled, password?, code? }
// 关闭（置 false）为降级操作，后端要求携带 password 或 code 之一进行二次确认。
export function updateUserSafety(isTwoFactorEnabled: boolean, password?: string, code?: string) {
  return service.post('/api/identity/ready/identity/UserSafety', {
    isTwoFactorEnabled,
    password,
    code
  });
}
