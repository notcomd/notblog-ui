import service from '@/axios';
import { setToken, setRefreshToken, removeToken, removeRefreshToken } from '@/utils/auth';
import type { TokenResult, OAuthProvider } from '@/types';

/** 邮箱登录请求体（统一登录/注册）：
 * - 仅验证码登录：email + code（未注册邮箱自动注册并下发初始密码）
 * - 密码登入：email + password + code（开启二次验证时 code 必填；关闭二次验证可省略 code） */
export interface EmailLoginData {
  email: string;
  code?: string;
  password?: string;
}

// ==================== 邮箱登录（后端 Identity：/api/identity/ready/identity/*） ====================

// 登录：POST /api/identity/ready/identity/Login { email, code?, password? }
// 携带密码走「密码登入」（开启二次验证的用户需同时传入 code）；仅携带 code 走「验证码登入/自动注册」。
// 成功返回 { accessToken, refreshToken, tokenType, expiresAt, isNewUser }
// 验证码/密码错误或账号锁定返回 401
export function login({ email, code, password }: EmailLoginData) {
  return service.post('/api/identity/ready/identity/Login', {
    email,
    code,
    password
  });
}

// 发送邮箱验证码：POST /api/identity/ready/email-verifications { email } -> 202 { message }
export function sendEmailCode(email: string) {
  return service.post('/api/identity/ready/email-verifications', { email });
}

// 确认邮箱验证码（只校验不消费，注册/登录时才消费）：POST .../confirm { email, code } -> { valid }
export function confirmEmailCode(email: string, code: string) {
  return service.post('/api/identity/ready/email-verifications/confirm', { email, code });
}

// 刷新 Token：POST /api/identity/ready/identity/refresh { refreshToken }
export function refreshToken(token: string) {
  return service.post('/api/identity/ready/identity/refresh', { refreshToken: token });
}

// ==================== OAuth 第三方登录（后端 Identity：/api/identity/auth/oauth/*） ====================

// 可用提供商列表：GET /api/identity/auth/oauth/providers -> [{ provider, name, enabled }]
export function getOAuthProviders() {
  return service.get<OAuthProvider[]>('/api/identity/auth/oauth/providers');
}

// 获取授权地址：POST /api/identity/auth/oauth/login/init { provider, redirectUri } -> { authorizationUrl }
// （redirectUri 白名单 AllowedRedirectUris；state 生成后存 Redis 10min 防 CSRF）
export function oauthLoginInit(provider: string, redirectUri: string) {
  return service.post('/api/identity/auth/oauth/login/init', { provider, redirectUri });
}

// 回调换取 Token：POST /api/identity/auth/oauth/{provider}/callback
// -> { accessToken, refreshToken, expiresAt, userInfo, isNewUser }
export function oauthCallback(provider: string, code: string, state: string, redirectUri: string) {
  return service.post(`/api/identity/auth/oauth/${provider}/callback`, {
    provider,
    code,
    state,
    redirectUri
  });
}

// ==================== 登录结果处理 ====================

// 保存登录结果（TokenResult / OAuthLoginResponse 共用 accessToken/refreshToken 字段）
export function saveLoginResult(res: TokenResult | null | undefined): boolean {
  if (res && res.accessToken) {
    setToken(res.accessToken);
    if (res.refreshToken) setRefreshToken(res.refreshToken);
    return true;
  }
  return false;
}

export function clearAuth(): void {
  removeToken();
  removeRefreshToken();
}

// ==================== 用户信息 / 头像 / 退出 ====================

// ⚠️ 原 getUserInfoByEmail 调用无鉴权 Identity 接口，会返回完整 User 实体含 PasswordHash。
// 已从前端移除；需要后端提供安全的“按邮箱搜索用户”鉴权接口后再恢复。

// 头像上传：POST /api/identity/avatar/upload（multipart: file）-> UploadAvatarResult{fileId,fileUri,...}
export function uploadAvatar(file: File) {
  const form = new FormData();
  form.append('file', file);
  return service.post('/api/identity/avatar/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
}

// 退出登录：POST /api/identity/ready/identity/Logout
export function logout() {
  return service.post('/api/identity/ready/identity/Logout');
}
