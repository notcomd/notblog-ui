import { animate } from 'animejs'

// ============================================================
// 路由切换过渡（anime.js）
// App.vue 根路由、AppLayout / AdminLayout 内容区共用同一套动效规格，
// 通过 <Transition :css="false" @enter @leave> 的 JS 钩子驱动。
// ============================================================

/** 旧页面退场时长（保持轻快，避免拖慢导航节奏） */
const LEAVE_MS = 160
/** 新页面入场时长 */
const ENTER_MS = 300

/** 用户偏好「减弱动态」时不做位移/淡入，直接切换 */
const reduceMotion = (): boolean =>
  typeof window !== 'undefined'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * 播放一段过渡动画并保证 done 一定被调用。
 * 动画被取消或元素被移除时 onComplete 不再触发，兜底定时器避免路由过渡卡死（页面白屏）。
 */
function run(target: Element, params: Record<string, unknown>, done: () => void): void {
  let settled = false
  const settle = (): void => {
    if (settled) return
    settled = true
    done()
  }
  animate(target, { ...params, onComplete: settle })
  setTimeout(settle, (params.duration as number) + 120)
}

/** 旧页面退场：淡出并轻微上移 */
export function pageLeave(el: Element, done: () => void): void {
  if (reduceMotion()) {
    done()
    return
  }
  run(el, { opacity: [1, 0], translateY: [0, -6], duration: LEAVE_MS, ease: 'inQuad' }, done)
}

/** 新页面入场：淡入并自下而上滑入 */
export function pageEnter(el: Element, done: () => void): void {
  if (reduceMotion()) {
    done()
    return
  }
  run(el, { opacity: [0, 1], translateY: [14, 0], duration: ENTER_MS, ease: 'outQuart' }, done)
}
