// 通用业务类型定义（供 api / stores / utils 复用）

/** 后端统一响应包装 ApiResponse<T>：axios 拦截器已解包一层，业务数据在 res.data */
export interface ApiResponse<T = unknown> {
  success?: boolean;
  code?: number;
  message?: string;
  data: T;
}

/** 登录成功后返回的令牌信息 */
export interface TokenResult {
  accessToken: string;
  refreshToken?: string;
  tokenType?: string;
  expiresAt?: string | number;
}

/** OAuth 登录回调的结果 */
export interface OAuthLoginResult extends TokenResult {
  userInfo?: Record<string, unknown>;
  isNewUser?: boolean;
}

/** 从 JWT claims 归一化出的当前用户 */
export interface CurrentUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

/** OAuth 提供商信息 */
export interface OAuthProvider {
  provider: string;
  name: string;
  enabled: boolean;
}

/** 分页请求公共参数 */
export interface PageParams {
  page?: number;
  pageSize?: number;
  pageIndex?: number;
  [key: string]: unknown;
}
