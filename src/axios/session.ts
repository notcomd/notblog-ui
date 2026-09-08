/**
 * 会话失效广播（axios 401 自动刷新失败时发出；由入口装配清理与跳转）
 *
 * 设计动机：axios 模块不直接依赖 router / pinia store，避免模块循环依赖；
 * 会话失效通过 window 自定义事件通知，main.ts 统一处理「清凭证 → 提示 → 跳登录」。
 */
const SESSION_EXPIRED_EVENT = 'notblog:session-expired'

/** 广播会话失效（幂等由监听方保证） */
export function emitSessionExpired(reason: string): void {
  window.dispatchEvent(new CustomEvent<string>(SESSION_EXPIRED_EVENT, { detail: reason }))
}

/** 订阅会话失效事件，返回取消订阅函数 */
export function onSessionExpired(handler: (reason: string) => void): () => void {
  const listener = (e: Event): void => {
    const detail = (e as CustomEvent<string>).detail
    handler(detail || '登录状态已过期，请重新登录')
  }
  window.addEventListener(SESSION_EXPIRED_EVENT, listener)
  return () => window.removeEventListener(SESSION_EXPIRED_EVENT, listener)
}
