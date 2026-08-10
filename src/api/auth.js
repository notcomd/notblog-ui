import service from '@/axios'
import { setToken, setRefreshToken, removeToken, removeRefreshToken } from '@/utils/auth'

// ==================== 邮箱注册/登录（后端 Identity：/api/identity/ready/*） ====================

// 注册：POST /api/identity/ready/Register { userEmail, userPassword, verificationCode }
// 成功返回 200 { message: '注册成功' }；用户已存在/验证码错误返回 400
export function register(data) {
  return service.post('/api/identity/ready/Register', {
    userEmail: data.email,
    userPassword: data.password,
    verificationCode: data.code
  })
}

// 邮箱登录：POST /api/identity/ready/Login { email, password, code, ... }
// code 为空 = 纯密码登录；传 code = 密码 + 邮箱验证码两步登录（后端校验并一次性消费）
// 成功返回 { accessToken, refreshToken, tokenType, expiresAt, claims }；失败返回 200 + 空 body（null）
export function login({ email, password, code = '' }) {
  return service.post('/api/identity/ready/Identity/Login', {
    email,
    password,
    code,
    provider: null,
    redirectUri: null,
    clientId: null,
    clientSecret: null,
    grantType: null
  })
}

// 发送邮箱验证码：POST /api/identity/ready/email-verifications { email } -> 202 { message }
export function sendEmailCode(email) {
  return service.post('/api/identity/ready/email-verifications', { email })
}

// 确认邮箱验证码（只校验不消费，注册/登录时才消费）：POST .../confirm { email, code } -> { valid }
export function confirmEmailCode(email, code) {
  return service.post('/api/identity/ready/email-verifications/confirm', { email, code })
}

// 刷新 Token：POST /api/identity/ready/refresh { refreshToken }
export function refreshToken(token) {
  return service.post('/api/identity/ready/refresh', { refreshToken: token })
}

// ==================== OAuth 第三方登录（后端 Identity：/api/identity/auth/oauth/*） ====================

// 可用提供商列表：GET /api/identity/auth/oauth/providers -> [{ provider, name, enabled }]
export function getOAuthProviders() {
  return service.get('/api/identity/auth/oauth/providers')
}

// 获取授权地址：POST /api/identity/auth/oauth/login/init { provider, redirectUri } -> { authorizationUrl }
// （redirectUri 白名单 AllowedRedirectUris；state 生成后存 Redis 10min 防 CSRF）
export function oauthLoginInit(provider, redirectUri) {
  return service.post('/api/identity/auth/oauth/login/init', { provider, redirectUri })
}

// 回调换取 Token：POST /api/identity/auth/oauth/{provider}/callback
// -> { accessToken, refreshToken, expiresAt, userInfo, isNewUser }
export function oauthCallback(provider, code, state, redirectUri) {
  return service.post(`/api/identity/auth/oauth/${provider}/callback`, { provider, code, state, redirectUri })
}

// ==================== 登录结果处理 ====================

// 保存登录结果（TokenResult / OAuthLoginResponse 共用 accessToken/refreshToken 字段）
export function saveLoginResult(res) {
  if (res && res.accessToken) {
    setToken(res.accessToken)
    if (res.refreshToken) setRefreshToken(res.refreshToken)
    return true
  }
  return false
}

export function clearAuth() {
  removeToken()
  removeRefreshToken()
}

// ==================== 用户信息 / 头像 / 退出 ====================

// 用户信息兜底：GET /api/identity/manger/user-manager/GetUserInfo?userQuery={email}
// ⚠️ 无鉴权端点（返回完整 User 实体含 PasswordHash，仅开发兜底用）
export function getUserInfoByEmail(email) {
  return service.get('/api/identity/manger/user-manager/GetUserInfo', { params: { userQuery: email } })
}

// 头像上传：POST /api/avatar/upload（multipart: file）
export function uploadAvatar(file) {
  const form = new FormData()
  form.append('file', file)
  return service.post('/api/avatar/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } })
}

// 退出登录：POST /api/identity/Logout
export function logout() {
  return service.post('/api/identity/Logout')
}
