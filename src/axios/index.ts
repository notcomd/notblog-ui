import axios from 'axios'
import type { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { getRefreshToken, getToken, setRefreshToken, setToken } from '@/utils/auth'
import { emitSessionExpired } from '@/axios/session'

// ═══════════════════════════════════════════════════════════════════════
// 统一 API 请求出口（axios 单实例）
//
// 网络拓扑（设计约定，勿直连服务端口）：
//   开发环境  baseURL = '' → 相对路径 → vite.config.ts devServer 代理
//             /api、/files、/MessageHub、/CallHub → http://localhost:5000（YARP 网关）→ 各服务
//   生产环境  baseURL = import.meta.env.VUE_APP_API_BASE_URL（网关公网地址）
//
// 拦截器职责：
//   请求
//     · 自动附加 Bearer token
//     · FormData（multipart）不写死 Content-Type，交由浏览器生成带 boundary 的头
//   响应
//     · 业务包装 { code, message, data }：code !== 200 → 拒绝（code=401 与 HTTP 401 同路）
//     · HTTP 401 / 业务 401 → 自动刷新（refresh token 单飞互斥）→ 成功后重放原请求一次
//     · 刷新失败 / 无 refresh token / 重放仍 401 → 广播 session-expired（入口跳登录）
//     · 登录 / 验证码 / 刷新等公开认证端点豁免：其 401 不代表会话失效（页面自行提示）
// ═══════════════════════════════════════════════════════════════════════

const BIZ_OK = 200
const BIZ_UNAUTHORIZED = 401

/** 会话失效文案 */
const SESSION_EXPIRED_MESSAGE = '登录状态已过期，请重新登录'

/** 公开认证端点（401 时不做自动刷新 / 踢登录；如密码错误、验证码错误等） */
const AUTH_PUBLIC_PATH_PATTERNS: RegExp[] = [
  /\/Login$/i,
  /\/refresh$/i,
  /email-verifications/i,
  /\/oauth\/providers$/i,
  /\/oauth\/login\/init$/i,
  /\/oauth\/[^/]+\/callback$/i
]

function isAuthPublicPath(url: string | undefined): boolean {
  if (!url) return false
  const path = url.split('?')[0]
  return AUTH_PUBLIC_PATH_PATTERNS.some(re => re.test(path))
}

/** 扩展请求配置：_retried 标记已因 401 重放过一次 */
interface RetriableConfig extends InternalAxiosRequestConfig {
  _retried?: boolean
}

// 无拦截器裸实例：仅供「刷新 token」内部使用（避免与主实例拦截器递归）
const raw = axios.create({
  baseURL: import.meta.env.VUE_APP_API_BASE_URL || '',
  timeout: 15000
})

// ── 主实例 ──
const service: AxiosInstance = axios.create({
  baseURL: import.meta.env.VUE_APP_API_BASE_URL || '',
  timeout: 15000 // 默认 15s（列表/上传等场景），单请求可用 config.timeout 覆盖
})

// ══════════════ 请求拦截器 ══════════════

service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    if (config.data instanceof FormData) {
      // multipart：Content-Type 由浏览器自动生成（含 boundary）；显式传入的头保持原样
      if (!config.headers['Content-Type']) {
        config.headers.delete('Content-Type')
      }
    } else if (!config.headers['Content-Type']) {
      config.headers['Content-Type'] = 'application/json;charset=UTF-8'
    }
    return config
  },
  (error: unknown) => {
    console.error('请求拦截器错误:', error)
    return Promise.reject(error)
  }
)

// ══════════════ 会话刷新（单飞互斥） ══════════════

let refreshPromise: Promise<boolean> | null = null

/**
 * 使用 refresh token 换发新 token 对（单次使用，后端会吊销旧 refresh token）。
 * 单飞：并发多个 401 共享同一次刷新，避免「refresh token 被并发消费而全部失败」。
 */
function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return Promise.resolve(false)

  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const resp = await raw.post('/api/identity/ready/identity/refresh', { refreshToken })
        const data = resp.data as { accessToken?: string; refreshToken?: string } | null
        if (data && data.accessToken) {
          setToken(data.accessToken)
          if (data.refreshToken) setRefreshToken(data.refreshToken)
          return true
        }
        return false
      } catch (e) {
        const status = (e as AxiosError)?.response?.status
        console.warn('[api] 刷新 Token 失败:', status ?? (e as Error).message)
        return false
      } finally {
        refreshPromise = null
      }
    })()
  }
  return refreshPromise
}

/**
 * 统一 401 处理（HTTP 401 与业务码 401 共用）：
 * 公开认证端点 → 直接拒绝（页面自行提示）；否则刷新后重放一次，仍失败则广播会话过期。
 */
async function handleUnauthorized(
  config: RetriableConfig | undefined,
  error: unknown
): Promise<AxiosResponse> {
  // 无配置或公开认证端点：会话未失效（如登录密码错误），原样拒绝交给页面
  if (!config || isAuthPublicPath(config.url)) {
    return Promise.reject(error)
  }

  // 已重放过一次仍 401：会话确实失效
  if (config._retried) {
    emitSessionExpired(SESSION_EXPIRED_MESSAGE)
    return Promise.reject(error)
  }

  const ok = await refreshAccessToken()
  if (ok && config.headers) {
    config._retried = true
    config.headers.Authorization = `Bearer ${getToken()}`
    return service.request(config) // 重放原请求（带新 token）
  }

  // 无 refresh token 或刷新失败：清会话并踢出
  emitSessionExpired(SESSION_EXPIRED_MESSAGE)
  return Promise.reject(error)
}

// ══════════════ 响应拦截器 ══════════════

service.interceptors.response.use(
  (response: AxiosResponse) => {
    const res = response.data as { code?: number; message?: string } | null | undefined
    if (res && typeof res === 'object' && res.code !== undefined) {
      if (res.code !== BIZ_OK) {
        if (res.code === BIZ_UNAUTHORIZED) {
          // 业务层判定会话失效（罕见）：与 HTTP 401 同路径处理
          return handleUnauthorized(response.config as RetriableConfig, new Error(String(res.message ?? '未授权')))
        }
        console.warn('[api] 业务错误:', res.code, res.message)
        return Promise.reject(new Error(res.message || '请求失败'))
      }
    }
    return response
  },
  (error: AxiosError) => {
    const config = error.config as RetriableConfig | undefined

    // 无服务端响应：断网 / 超时 / 代理不可达
    if (!error.response) {
      const friendly = error.code === 'ECONNABORTED' ? '请求超时，请检查网络' : '网络异常，请检查网络连接'
      console.warn('[api]', friendly, error.message)
      ;(error as AxiosError & { friendlyMessage?: string }).friendlyMessage = friendly
      return Promise.reject(error)
    }

    const { status } = error.response
    if (status === 401) {
      return handleUnauthorized(config, error)
    }
    if (status === 403) console.warn('[api] 拒绝访问:', config?.url)
    else if (status === 404) console.warn('[api] 资源不存在:', config?.url)
    else if (status >= 500) console.warn(`[api] 服务器错误 ${status}:`, config?.url)
    return Promise.reject(error)
  }
)

export default service
