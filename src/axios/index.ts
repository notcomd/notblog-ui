import axios from 'axios'
import type { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { getRefreshToken, getToken, setRefreshToken, setToken } from '@/utils/auth'
import { emitSessionExpired } from '@/axios/session'
import type { ApiResponseResult } from '@/types'

// ═══════════════════════════════════════════════════════════════════════
// 统一 API 请求出口（axios 单实例）
//
// 网络拓扑（设计约定，勿直连服务端口）：
//   开发环境  baseURL = '' → 相对路径 → vite.config.ts devServer 代理
//             /api、/files、/MessageHub、/CallHub → http://localhost:5000（YARP 网关）→ 各服务
//   生产环境  baseURL = import.meta.env.VUE_APP_API_BASE_URL（网关公网地址）
//
// 后端统一响应信封 ApiResponseResult（Commons）：{ statusCode, message, responseData, isSuccess, responseDateTime }
//   成功（HTTP 2xx）→ isSuccess=true，responseData 承载业务数据
//   失败（HTTP 4xx/5xx）→ isSuccess=false，message 承载领域错误消息
//
// 拦截器职责：
//   请求
//     · 自动附加 Bearer token
//     · FormData（multipart）不写死 Content-Type，交由浏览器生成带 boundary 的头
//   响应
//     · 识别统一信封：成功时把 response.data 原地替换为 responseData（业务数据），
//       各 api 模块无需关心信封结构；失败时以信封 message 拒绝
//     · 业务/HTTP 401 → 自动刷新（refresh token 单飞互斥）→ 成功后重放原请求一次
//     · 刷新失败 / 无 refresh token / 重放仍 401 → 广播 session-expired（入口跳登录）
//     · 403 → 广播 forbidden（管理端布局订阅后展示可关闭的权限提示条，已节流去重）
//     · 登录 / 验证码 / 刷新等公开认证端点豁免：其 401 不代表会话失效（页面自行提示）
// ═══════════════════════════════════════════════════════════════════════

const BIZ_UNAUTHORIZED = 401
const BIZ_FORBIDDEN = 403

/** 会话失效文案 */
const SESSION_EXPIRED_MESSAGE = '登录状态已过期，请重新登录'

/**
 * 403 权限不足的默认引导文案。
 * 两层信息：说明「该操作需要相应权限」，并给出可执行路径「联系 Root 账号授予权限」。
 * 仅在服务未返回中文具体原因时兜底；服务返回具体原因（如「只有圈主或管理员可以移出成员」）时优先采用原话。
 */
const PERMISSION_DENIED_MESSAGE = '该操作需要相应权限，请联系 Root 账号授予权限'

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

// ══════════════ 权限不足（403）广播 ══════════════
// 与 session-expired 同构：axios 层不直接依赖 router / pinia store，经 window 自定义事件单向广播，
// 由管理端布局（AdminLayout）订阅后展示一条可关闭的权限提示条，让用户看清「这是权限问题，可由 Root 授予」，
// 而非网络异常。仅管理端订阅，用户端页面不受影响（其自身 catch 后的 toast 行为保持不变）。
const FORBIDDEN_EVENT = 'notblog:forbidden'

/** 节流窗口（ms）：页面加载时多个并发请求会同时 403，窗口内只广播一次，避免刷屏/叠加多条提示 */
const FORBIDDEN_THROTTLE_MS = 3000
let lastForbiddenAt = 0

/** 广播「权限不足」（同一时间窗口内去重，只发一次） */
export function emitForbidden(message: string): void {
  const now = Date.now()
  if (now - lastForbiddenAt < FORBIDDEN_THROTTLE_MS) return
  lastForbiddenAt = now
  window.dispatchEvent(new CustomEvent<string>(FORBIDDEN_EVENT, { detail: message }))
}

/** 订阅「权限不足」事件，返回取消订阅函数 */
export function onForbidden(handler: (message: string) => void): () => void {
  const listener = (e: Event): void => {
    const detail = (e as CustomEvent<string>).detail
    handler(detail || PERMISSION_DENIED_MESSAGE)
  }
  window.addEventListener(FORBIDDEN_EVENT, listener)
  return () => window.removeEventListener(FORBIDDEN_EVENT, listener)
}

/** 扩展请求配置：_retried 标记已因 401 重放过一次 */
interface RetriableConfig extends InternalAxiosRequestConfig {
  _retried?: boolean
}

/** 判断响应体是否为后端统一响应信封 ApiResponseResult */
function isUnifiedEnvelope(body: unknown): body is ApiResponseResult {
  return !!body && typeof body === 'object' && 'isSuccess' in body && 'statusCode' in body
}

/** 无拦截器裸实例：仅供「刷新 token」内部使用（避免与主实例拦截器递归） */
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
        // 后端已统一信封：responseData 内为 { accessToken, refreshToken, ... }
        const resp = await raw.post('/api/identity/ready/identity/refresh', { refreshToken })
        const body = resp.data as ApiResponseResult<{ accessToken?: string; refreshToken?: string }> | null
        const data = body && body.responseData
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
 * 统一 401 处理（HTTP 401 与信封 statusCode 401 共用）：
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

  // 游客（从未登录）：401 只代表「该资源需要登录」，不是会话过期。
  // 不能广播 session-expired —— 那会清空凭证并把访客从公开页面（如首页）强行跳到登录页，
  // 还会弹出对访客毫无意义的「登录状态已过期」。此处直接拒绝，由页面自行决定是否引导登录。
  if (!getToken() && !getRefreshToken()) {
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

/** 是否只含 ASCII（用于识别英文样板文案，如中间件的 "Forbidden"） */
function isAsciiOnly(s: string): boolean {
  // eslint-disable-next-line no-control-regex
  return /^[\x00-\x7F]*$/.test(s)
}

/**
 * 从错误响应体提取面向用户的领域错误消息。
 *
 * 后端存在三种错误体形态，必须都能解析，否则页面只能显示 axios 的
 * "Request failed with status code 400" 这类无信息量文案：
 *  1. 统一信封 ApiResponseResult（Message / Markdown / Video / FileDev 部分端点）
 *  2. 裸错误体（Identity、FileDev 未启用信封包装）：`{ error }`
 *  3. RFC 7807 ProblemDetails（Results.Problem / 框架自动 400）：`title` / `detail` / `errors`
 */
function extractDomainMessage(body: unknown, status?: number): string | null {
  let message: string | null = null

  if (body && typeof body === 'object') {
    const envelope = body as ApiResponseResult
    if (isUnifiedEnvelope(envelope)) {
      if (envelope.message) message = envelope.message
      else {
        // 部分旧端点把领域错误放在 responseData 内（如 { error, message }），作回退提取
        const nested = envelope.responseData as { error?: string; message?: string } | null | undefined
        message = nested?.error || nested?.message || null
      }
    } else {
      const raw = body as {
        error?: unknown
        message?: unknown
        detail?: unknown
        title?: unknown
        errors?: Record<string, unknown>
      }
      if (typeof raw.error === 'string' && raw.error) message = raw.error
      else if (typeof raw.message === 'string' && raw.message) message = raw.message
      else if (typeof raw.detail === 'string' && raw.detail) message = raw.detail
      else if (typeof raw.title === 'string' && raw.title) message = raw.title
      else if (raw.errors && typeof raw.errors === 'object') {
        // 模型绑定/校验失败：{ errors: { Field: ["msg"] } } → 取首条
        const first = Object.values(raw.errors).flat().find((v) => typeof v === 'string')
        if (typeof first === 'string' && first) message = first
      }
    }
  }

  // 403 的英文样板（"Forbidden" / "Insufficient permissions"）对用户无意义，统一换中文引导；
  // 若服务返回了中文的具体原因（如「只有圈主或管理员可以移出成员」）则原样保留。
  if (status === 403 && (!message || isAsciiOnly(message))) {
    return PERMISSION_DENIED_MESSAGE
  }

  return message
}

service.interceptors.response.use(
  (response: AxiosResponse) => {
    const body = response.data as unknown

    if (isUnifiedEnvelope(body)) {
      if (!body.isSuccess) {
        // 信封标识失败（业务码为非 2xx）
        if (body.statusCode === BIZ_UNAUTHORIZED) {
          return handleUnauthorized(response.config as RetriableConfig, new Error(String(body.message ?? '未授权')))
        }
        // 信封标识 403：权限不足（业务码），广播给管理端布局展示可关闭提示条
        if (body.statusCode === BIZ_FORBIDDEN) {
          emitForbidden(body.message || PERMISSION_DENIED_MESSAGE)
        }
        console.warn('[api] 业务错误:', body.statusCode, body.message)
        return Promise.reject(new Error(body.message || '请求失败'))
      }
      // 成功：原地替换为业务数据（responseData），调用方 res.data 直接取数
      response.data = body.responseData ?? null
      return response
    }

    // 非统一信封（如空响应体 / 流式透传的中间产物）：原样放行
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
    const body = error.response.data as unknown

    // 错误体里的领域消息覆盖通用 HTTP 文案，供页面 toast 展示
    const domainMessage = extractDomainMessage(body, status)
    if (domainMessage) {
      error.message = domainMessage
      ;(error as AxiosError & { friendlyMessage?: string }).friendlyMessage = domainMessage
    }

    // 401：统一刷新重放（公开认证端点除外）
    const envelopeStatus = isUnifiedEnvelope(body) ? body.statusCode : null
    if (envelopeStatus === BIZ_UNAUTHORIZED || status === 401) {
      return handleUnauthorized(config, error)
    }
    if (status === 403) {
      console.warn('[api] 拒绝访问:', config?.url)
      // 广播权限不足（令牌侧节流去重）；domainMessage 在 403 下必非空
      emitForbidden(domainMessage || PERMISSION_DENIED_MESSAGE)
    }
    else if (status === 404) console.warn('[api] 资源不存在:', config?.url)
    else if (status >= 500) console.warn(`[api] 服务器错误 ${status}:`, config?.url)
    return Promise.reject(error)
  }
)

export default service
