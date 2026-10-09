<template>
  <Teleport to="body">
    <Transition name="qm-modal" appear @after-leave="onAfterLeave">
      <!-- 根容器：层级由统一 z-index 约定 + 叠放顺序决定（见 script） -->
      <div
        v-if="visible"
        class="fixed inset-0 flex"
        :class="variant === 'right' ? 'justify-end' : 'items-center justify-center p-4'"
        :style="{ zIndex }"
      >
        <!-- 遮罩层：统一不透明度与深色适配；滚轮不穿透到背景 -->
        <div class="absolute inset-0 bg-black/40 dark:bg-black/65" aria-hidden="true" @click="onOverlayClick" @wheel.prevent></div>

        <!-- 面板 -->
        <div
          ref="panelRef"
          class="qm-modal-panel relative"
          :class="panelClassList"
          :style="panelStyle"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="labelledby || (title ? internalTitleId : undefined)"
          tabindex="-1"
        >
          <template v-if="!bare">
            <!-- 头部（固定不滚动） -->
            <div
              v-if="showHeaderBar"
              class="flex items-center justify-between gap-3 px-5 py-4 border-b border-black/[0.06] dark:border-white/[0.08] shrink-0"
            >
              <slot name="header">
                <h3 :id="internalTitleId" class="text-base font-bold text-zinc-800 dark:text-zinc-100 truncate">{{ title }}</h3>
              </slot>
              <button
                v-if="showClose"
                type="button"
                class="w-8 h-8 shrink-0 rounded-[5%] flex items-center justify-center text-zinc-400 hover:bg-black/[0.05] dark:hover:bg-white/[0.07] transition-colors"
                aria-label="关闭"
                @click="requestClose"
              >
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>
            <!-- 无头但有标题时：仅为对话框提供可访问名称 -->
            <h3 v-else-if="title" :id="internalTitleId" class="sr-only">{{ title }}</h3>

            <!-- 内容（内部滚动，加载/错误态统一表达） -->
            <div v-if="loading" class="flex-1 min-h-0 flex items-center justify-center" :class="bodyClass" role="status" aria-label="加载中">
              <span class="w-6 h-6 border-2 border-zinc-200 dark:border-zinc-700 border-t-amber-400 rounded-full animate-spin"></span>
            </div>
            <div v-else-if="error" class="flex-1 min-h-0 overflow-y-auto overscroll-contain" :class="bodyClass">
              <div class="rounded-[5%] border border-dashed border-red-300/70 dark:border-red-500/30 px-4 py-6 text-center text-sm text-red-500">{{ error }}</div>
            </div>
            <div v-else class="flex-1 min-h-0 overflow-y-auto overscroll-contain" :class="bodyClass">
              <slot></slot>
            </div>

            <!-- 底部（固定不滚动） -->
            <div
              v-if="$slots.footer"
              class="px-5 py-4 border-t border-black/[0.06] dark:border-white/[0.08] flex items-center justify-end gap-2 shrink-0"
            >
              <slot name="footer"></slot>
            </div>
          </template>

          <!-- 无壳模式（图片预览等自定义面板） -->
          <slot v-else></slot>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script lang="ts">
// 模块级自增序号：为每个弹窗实例生成唯一标题 id（供 aria-labelledby 关联）
let modalIdSeq = 0
</script>

<script setup lang="ts">
// ============================================================
// 全站统一弹窗基座（用户端 / 管理端共用）
// · 遮罩 + Esc / 点击遮罩关闭（可配置）· body 滚动锁（引用计数，关闭必还原）
// · 层级约定：基线 z-80，每叠加一层 +10（保证压过顶栏 z-50、侧栏，且多层不互压）
// · 动画：淡入 + 轻微位移/缩放，尊重 prefers-reduced-motion（见 input.css）
// · 无障碍：role=dialog / aria-modal / aria-labelledby、焦点陷阱、焦点归还
// · 头部/底部固定，仅中间内容滚动；宽度自动收敛 min(px, 92vw)
// ============================================================
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useSlots, watch } from 'vue'

interface Props {
  /** 标题：有头部时渲染为 h3，无头部时作为对话框可访问名称（sr-only） */
  title?: string
  /** 形如 w-[720px]；未传时默认 w-[min(700px,92vw)]；任意 px 自动收敛为 min(px,92vw) */
  width?: string
  /** center=居中弹窗；right=右侧抽屉 */
  variant?: 'center' | 'right'
  /** 点击遮罩是否关闭（表单类可设为 false 防误关） */
  closeOnOverlay?: boolean
  /** Esc 是否关闭 */
  closeOnEsc?: boolean
  /** 是否显示右上角关闭按钮 */
  showClose?: boolean
  /** 不渲染头部条（标题仅用于 aria，布局交回调用方） */
  noHeader?: boolean
  /** 无壳模式：不套 qm-surface / 内边距，完全由插槽自定义（图片预览等） */
  bare?: boolean
  /** 追加到面板的类名 */
  panelClass?: string
  /** 内容区类名（默认 p-5） */
  bodyClass?: string
  /** 显式指定 aria-labelledby（调用方自渲染可见标题时使用） */
  labelledby?: string
  /** 覆盖自动层级 */
  zIndex?: number
  /** 统一加载态 */
  loading?: boolean
  /** 统一错误态 */
  error?: string | null
  /**
   * 受控显隐：true 立即渲染并播放入场；false 先播退场过渡，过渡结束后卸载内容并 emit('closed')。
   * 不传时默认 true —— 供「父级 v-if 卸载」的旧用法继续工作（此时无退场动画，行为与改造前一致）。
   */
  open?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  width: '',
  variant: 'center',
  closeOnOverlay: true,
  closeOnEsc: true,
  showClose: true,
  noHeader: false,
  bare: false,
  panelClass: '',
  bodyClass: 'p-5',
  labelledby: '',
  zIndex: undefined,
  loading: false,
  error: null,
  open: true
})

const emit = defineEmits<{ (e: 'close'): void; (e: 'closed'): void }>()
const slots = useSlots()
const panelRef = ref<HTMLElement | null>(null)

// ---------- 显隐状态机：open 受控时先播退场再卸载；v-if 用法下恒为 true ----------
const visible = ref(props.open)

// ---------- 层级：统一约定 + 叠放顺序 ----------
const MODAL_Z_BASE = 80
const MODAL_Z_STEP = 10
const stack: symbol[] = []
const uid = Symbol('qm-modal')
const layer = ref(1)
const zIndex = computed(() => props.zIndex ?? MODAL_Z_BASE + (layer.value - 1) * MODAL_Z_STEP)

// ---------- 标题 id / 头部可见性 ----------
const internalTitleId = `qm-modal-title-${++modalIdSeq}`
const showHeaderBar = computed(() => !props.noHeader && (!!props.title || !!slots.header || props.showClose))

// ---------- 宽度：任意 px 收敛为 min(px,92vw)，避免小屏溢出 ----------
const widthClass = computed(() => {
  const w = props.width
  if (!w) return 'w-[min(700px,92vw)]'
  const m = /^w-\[(\d+)px\]$/.exec(w)
  return m ? `w-[min(${m[1]}px,92vw)]` : w
})

const panelClassList = computed(() => {
  if (props.bare) return [props.panelClass]
  const list = ['qm-surface flex flex-col', widthClass.value]
  list.push(props.variant === 'right' ? 'h-full max-h-full' : 'max-h-[85vh]')
  if (props.panelClass) list.push(props.panelClass)
  return list
})

// 右侧抽屉：贴右满高，右侧直角
const panelStyle = computed(() =>
  !props.bare && props.variant === 'right'
    ? { borderTopRightRadius: '0px', borderBottomRightRadius: '0px', borderRightWidth: '0px' }
    : undefined
)

// ---------- 关闭 ----------
function requestClose() {
  emit('close')
}
function onOverlayClick() {
  if (props.closeOnOverlay) requestClose()
}

// ---------- 滚动锁：引用计数，多弹窗叠加/连续开关不残留 ----------
let lockCount = 0
let savedOverflows: Array<{ el: HTMLElement; overflow: string }> = []

function scrollLockTargets(): HTMLElement[] {
  // body + 应用内滚动容器（主内容区 / 页面自管滚动容器）
  const els: HTMLElement[] = [document.body]
  document.querySelectorAll<HTMLElement>('.scroll-native, [data-scroll-container]').forEach((el) => els.push(el))
  return els
}
function lockScroll() {
  if (lockCount === 0) {
    const els = scrollLockTargets()
    savedOverflows = els.map((el) => ({ el, overflow: el.style.overflow }))
    savedOverflows.forEach(({ el }) => { el.style.overflow = 'hidden' })
  }
  lockCount++
}
function unlockScroll() {
  lockCount = Math.max(0, lockCount - 1)
  if (lockCount === 0) {
    savedOverflows.forEach(({ el, overflow }) => { el.style.overflow = overflow })
    savedOverflows = []
  }
}

// ---------- 键盘：Esc 关闭（仅最上层）+ 焦点陷阱 ----------
const FOCUSABLE = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
let previouslyFocused: HTMLElement | null = null

function isTop() {
  return stack[stack.length - 1] === uid
}
function focusables(): HTMLElement[] {
  const panel = panelRef.value
  if (!panel) return []
  return Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.tabIndex !== -1 && el.offsetParent !== null)
}
function onKeydown(e: KeyboardEvent) {
  if (!isTop()) return
  if (e.key === 'Escape' && props.closeOnEsc) {
    e.preventDefault()
    requestClose()
    return
  }
  if (e.key !== 'Tab') return
  const panel = panelRef.value
  if (!panel) return
  const list = focusables()
  if (!list.length) {
    e.preventDefault()
    panel.focus({ preventScroll: true })
    return
  }
  const first = list[0]
  const last = list[list.length - 1]
  const active = document.activeElement as HTMLElement | null
  if (e.shiftKey) {
    if (active === first || active === panel || !panel.contains(active)) {
      e.preventDefault()
      last.focus({ preventScroll: true })
    }
  } else if (active === last || !panel.contains(active)) {
    e.preventDefault()
    first.focus({ preventScroll: true })
  }
}

// 激活：加锁 + 入栈 + 监听键盘 + 聚焦面板（幂等，可重复开关）
let active = false
function activate() {
  if (active) return
  active = true
  previouslyFocused = document.activeElement as HTMLElement | null
  stack.push(uid)
  layer.value = stack.length
  lockScroll()
  document.addEventListener('keydown', onKeydown, true)
  nextTick(() => panelRef.value?.focus({ preventScroll: true }))
}

// 清理：解锁 + 出栈 + 摘监听 + 归还焦点（幂等）——退场结束后或 v-if 卸载时调用
function deactivate() {
  if (!active) return
  active = false
  document.removeEventListener('keydown', onKeydown, true)
  const i = stack.indexOf(uid)
  if (i >= 0) stack.splice(i, 1)
  unlockScroll()
  // 焦点归还触发元素（若焦点已进入其他弹窗则不抢夺）
  const current = document.activeElement as HTMLElement | null
  const insideSelf = !!panelRef.value && !!current && panelRef.value.contains(current)
  if (previouslyFocused && document.contains(previouslyFocused) && (!current || current === document.body || insideSelf)) {
    previouslyFocused.focus({ preventScroll: true })
  }
}

// 受控显隐：open 变真 → 立即显示；open 变假 → 交给 Transition 播退场（after-leave 再做清理）
watch(() => props.open, (val) => {
  if (val) {
    visible.value = true
    activate()
  } else {
    visible.value = false
  }
})

// 退场过渡结束：此刻才释放滚动锁 / 归还焦点 / 摘键盘监听，并通知调用方
function onAfterLeave() {
  deactivate()
  emit('closed')
}

onMounted(() => {
  if (visible.value) activate()
})

onBeforeUnmount(() => {
  // v-if 卸载路径：无退场过渡，直接清理（deactivate 幂等，与 after-leave 不会重复）
  deactivate()
})
</script>
