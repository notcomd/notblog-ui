<template>
  <div
    ref="rootEl"
    class="qm-auth"
    :class="appClasses"
    role="region"
    aria-label="登入 MonoHub"
  >
    <!-- ===== 第一屏：欢迎（无卡片，内容直接浮于背景之上） ===== -->
    <section
      class="screen screen--intro"
      :inert="screen !== 'intro' ? true : undefined"
      :aria-hidden="screen !== 'intro'"
    >
      <p class="eyebrow font-numeric">MONOHUB</p>
      <h1 class="display font-display">在这里，遇见同好</h1>
      <p class="lede">记录热爱，分享灵感。<br />登录后即可发布、收藏与交流。</p>
      <button
        type="button"
        class="cta btn-sheen"
        @click="goForm"
        @mouseenter="introHover = true"
        @mouseleave="introHover = false"
        @focus="introHover = true"
        @blur="introHover = false"
      >
        <span>开始登入</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M5 12h13M13 6l6 6-6 6" />
        </svg>
      </button>
    </section>

    <!-- ===== 第二屏：登入（单表单双通道） ===== -->
    <section
      class="screen screen--form"
      :inert="screen !== 'form' ? true : undefined"
      :aria-hidden="screen !== 'form'"
    >
      <button type="button" class="back" @click="backToIntro">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M19 12H6M11 18l-6-6 6-6" />
        </svg>
        返回
      </button>

      <h2 class="title font-display">登入</h2>
      <p class="subtitle">用邮箱验证码或密码继续</p>

      <!-- 通道切换 -->
      <div class="tabs">
        <button
          type="button"
          class="tab"
          :class="{ 'tab--active': mode === 'code' }"
          :aria-pressed="mode === 'code'"
          :disabled="loading || submitted"
          @click="switchMode('code')"
        >
          验证码登入
        </button>
        <button
          type="button"
          class="tab"
          :class="{ 'tab--active': mode === 'password' }"
          :aria-pressed="mode === 'password'"
          :disabled="loading || submitted"
          @click="switchMode('password')"
        >
          密码登入
        </button>
      </div>

      <form class="form" novalidate @submit.prevent="onSubmit">
        <!-- 邮箱 -->
        <div class="field">
          <label class="field__label" for="qm-login-email">邮箱</label>
          <input
            id="qm-login-email"
            v-model="email"
            class="field__input"
            type="email"
            name="email"
            autocomplete="email"
            :aria-describedby="errors.email ? 'qm-email-error' : undefined"
            :disabled="loading || submitted"
          />
        </div>
        <p v-if="errors.email" id="qm-email-error" class="error" role="alert">{{ errors.email }}</p>

        <!-- 密码登入 -->
        <template v-if="mode === 'password'">
          <div class="field">
            <label class="field__label" for="qm-login-password">密码</label>
            <input
              id="qm-login-password"
              v-model="password"
              class="field__input field__input--peek"
              :type="showPassword ? 'text' : 'password'"
              name="password"
              autocomplete="current-password"
              :aria-describedby="errors.password ? 'qm-password-error' : undefined"
              :disabled="loading || submitted"
            />
            <button
              type="button"
              class="peek"
              tabindex="-1"
              :aria-label="showPassword ? '隐藏密码' : '显示密码'"
              @click="showPassword = !showPassword"
            >
              <svg v-if="!showPassword" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243" />
                <path d="M3 3l18 18" />
              </svg>
            </button>
          </div>
          <p v-if="errors.password" id="qm-password-error" class="error" role="alert">{{ errors.password }}</p>

          <div class="row">
            <label class="remember">
              <input v-model="rememberMe" type="checkbox" :disabled="loading || submitted" />
              <span>记住我</span>
            </label>
            <button type="button" class="link" @click="onForgotPassword">忘记密码？</button>
          </div>
        </template>

        <!-- 验证码登入（未注册邮箱自动注册） -->
        <template v-else>
          <div class="field">
            <label class="field__label" for="qm-login-code">邮箱验证码</label>
            <input
              id="qm-login-code"
              v-model="code"
              class="field__input field__input--code"
              type="text"
              inputmode="text"
              maxlength="9"
              name="code"
              autocomplete="one-time-code"
              :aria-describedby="errors.code ? 'qm-code-error' : undefined"
              :disabled="loading || submitted"
            />
            <button
              type="button"
              class="send"
              :disabled="codeCountdown > 0 || loading || submitted"
              @click="handleSendCode"
            >
              {{ codeCountdown > 0 ? `${codeCountdown}s 后重发` : '获取验证码' }}
            </button>
          </div>
          <p v-if="errors.code" id="qm-code-error" class="error" role="alert">{{ errors.code }}</p>
          <p class="hint">未注册邮箱将自动注册，初始密码会发送到您的邮箱。</p>
        </template>

        <div class="form__submit">
          <button type="submit" class="btn-form btn-sheen" :disabled="loading || submitted">
            <span class="btn-form__stack">
              <span class="btn-form__label">{{ loading ? '处理中…' : mode === 'password' ? '登入' : '登入 / 注册' }}</span>
              <span class="btn-form__done" aria-hidden="true">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                已登入
              </span>
            </span>
          </button>
          <!-- 成功状态由实时区播报（可见反馈在按钮内与第三屏，不再重复「成功」文案） -->
          <div class="sr-only" aria-live="polite">{{ submitted ? '已登入，正在进入' : '' }}</div>
        </div>
      </form>

      <div class="divider">或使用第三方账号登录</div>

      <div class="oauth">
        <button type="button" class="oauth-btn" aria-label="使用 Microsoft 登录" title="Microsoft 登录" @click="handleMicrosoftLogin">
          <svg width="18" height="18" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <rect x="1" y="1" width="9" height="9" fill="#F25022" />
            <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
            <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
            <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
          </svg>
        </button>
        <button type="button" class="oauth-btn" aria-label="使用 GitHub 登录" title="GitHub 登录" @click="handleGitHubLogin">
          <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path fill-rule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
          </svg>
        </button>
        <button type="button" class="oauth-btn" aria-label="使用微信登录" title="微信登录" @click="handleWeChatLogin">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#07C160" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 00.167-.054l1.903-1.114a.864.864 0 01.717-.098 10.16 10.16 0 002.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178A1.17 1.17 0 014.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178 1.17 1.17 0 01-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 01.598.082l1.584.926a.272.272 0 00.14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 01-.023-.156.49.49 0 01.201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.952-7.062-6.122zm-2.18 2.769c.535 0 .969.44.969.982a.976.976 0 01-.969.983.976.976 0 01-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 01-.969.983.976.976 0 01-.969-.983c0-.542.434-.982.97-.982z" />
          </svg>
        </button>
        <button type="button" class="oauth-btn" aria-label="使用 Google 登录" title="Google 登录" @click="handleGoogleLogin">
          <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
        </button>
      </div>

      <p v-if="errorMessage" class="alert" role="alert">{{ errorMessage }}</p>
    </section>

    <!-- ===== 第三屏：欢迎回来 ===== -->
    <section
      class="screen screen--done"
      :inert="screen !== 'welcome' ? true : undefined"
      :aria-hidden="screen !== 'welcome'"
    >
      <div class="done-badge">
        <span class="done-ping" aria-hidden="true"></span>
        <div class="done-mark" aria-hidden="true">
          <svg width="27" height="27" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
      </div>
      <h2 class="display font-display">欢迎回来</h2>
      <p class="lede">{{ successText }}</p>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { animate, createTimeline, stagger } from 'animejs'
import { login, sendEmailCode, oauthLoginInit } from '@/api/auth'
import type { TokenResult } from '@/types'

/** 登录通道：密码登入 / 邮箱验证码登入（未注册邮箱自动注册） */
type LoginMode = 'password' | 'code'
/** 卡片屏幕：欢迎页 → 登入表单 → 登录成功 */
type Screen = 'intro' | 'form' | 'welcome'

const emit = defineEmits<{ (e: 'success', payload: TokenResult): void }>()

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const CODE_REGEX = /^[A-Za-z0-9]{9}$/
/** 从登录响应中取业务数据（axios 拦截器未解包，业务数据在 res.data） */
const unwrap = (res: unknown): Record<string, unknown> => {
  const wrapped = res as { data?: Record<string, unknown> } | null
  const data = wrapped && wrapped.data ? wrapped.data : (res as Record<string, unknown>)
  return data && typeof data === 'object' ? data : {}
}

// ==================== 屏幕与动画状态 ====================
const screen = ref<Screen>('intro')
const introHover = ref(false)
const submitted = ref(false)
const isNewUser = ref(false)

// ==================== 表单状态 ====================
// 默认通道为验证码登入（与标签页排序一致：验证码在前，密码在后）
const mode = ref<LoginMode>('code')
const email = ref('')
const password = ref('')
const code = ref('')
const rememberMe = ref(false)
const showPassword = ref(false)
const codeCountdown = ref(0)
const loading = ref(false)
const errorMessage = ref('')
const errors = ref<Record<string, string>>({})

let codeTimer: ReturnType<typeof setInterval> | null = null
let welcomeTimer: ReturnType<typeof setTimeout> | null = null
let finishTimer: ReturnType<typeof setTimeout> | null = null

// ==================== 派生状态 ====================
/** 表单填写完整（驱动主按钮由灰转品牌色） */
const formReady = computed<boolean>(() => {
  if (loading.value || submitted.value) return false
  if (!EMAIL_REGEX.test(email.value.trim())) return false
  return mode.value === 'password' ? password.value.length > 0 : CODE_REGEX.test(code.value)
})

/** 根节点状态类：模板的动画全部由这些类驱动 */
const appClasses = computed<Record<string, boolean>>(() => ({
  'on-btn-pTSecond': introHover.value,
  'second-screen-opened': screen.value !== 'intro',
  'third-screen-opened': screen.value === 'welcome',
  'form-ready': formReady.value,
  'form-submitted': submitted.value
}))

const successText = computed<string>(() =>
  isNewUser.value
    ? '账号已创建，初始密码已发送至你的邮箱。'
    : '登录成功，正在进入部落…'
)

// ==================== 三屏过渡（anime.js） ====================
// 三屏以绝对定位叠放，显示与否完全由 anime.js 写入行内 opacity/transform 控制
// （CSS 只保留布局与 pointer-events，避免 CSS 过渡与 JS 动画抢同一批属性）
const rootEl = ref<HTMLElement | null>(null)
let running: { cancel: () => void }[] = []

/** 各屏参与错峰入场的元素（选择器限定在屏内，避免跨屏误匹配） */
const INTRO_ITEMS = '.screen--intro .eyebrow, .screen--intro .display, .screen--intro .lede, .screen--intro .cta'
const FORM_ITEMS = '.screen--form .back, .screen--form .title, .screen--form .subtitle, .screen--form .tabs, .screen--form .form, .screen--form .divider, .screen--form .oauth'

const reduceMotion = (): boolean =>
  typeof window !== 'undefined'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches

const pick = (sel: string): HTMLElement | null =>
  rootEl.value ? rootEl.value.querySelector<HTMLElement>(sel) : null

const pickAll = (sel: string): HTMLElement[] =>
  rootEl.value ? Array.from(rootEl.value.querySelectorAll<HTMLElement>(sel)) : []

/** 静态落位（首帧初始化 / 减弱动效时替代动画）。
    位移一律归零：隐藏屏若带向下位移会撑出可滚动溢出区域（入场 from 值由 anime.js 注入，无需预设偏移） */
const place = (node: HTMLElement | null, visible: boolean): void => {
  if (!node) return
  node.style.opacity = visible ? '1' : '0'
  node.style.transform = 'translateY(0px)'
}

/** 清空子元素的行内动画残留，交回给新的时间线 */
const resetItems = (items: HTMLElement[]): void => {
  items.forEach((n) => {
    n.style.opacity = '1'
    n.style.transform = 'none'
  })
}

/** 播放前把子项同步压到透明。
    anime.js 的 from 值要等该补间开始才写入，若子项此时是不透明 1，
    会先以完整不透明度绘制（首屏闪一下、切换时先整块出现再跳回透明，观感像卡顿）。 */
const hideItems = (items: HTMLElement[]): void => {
  items.forEach((n) => {
    n.style.opacity = '0'
  })
}

const stopRunning = (): void => {
  running.forEach((a) => a.cancel())
  running = []
}

/** 第一屏入场：标题/说明/按钮自下而上错峰浮现 */
const playIntroIn = (withScreen: boolean): void => {
  const intro = pick('.screen--intro')
  if (!intro) return
  const items = pickAll(INTRO_ITEMS)

  if (reduceMotion()) {
    place(intro, true)
    resetItems(items)
    return
  }

  stopRunning()
  hideItems(items)
  if (!withScreen) {
    if (!items.length) return
    running = [animate(items, {
      opacity: [0, 1],
      translateY: [16, 0],
      duration: 620,
      delay: stagger(85),
      ease: 'outQuart'
    })]
    return
  }

  const tl = createTimeline({ defaults: { ease: 'outQuart' } })
  tl.add(intro, { opacity: [0, 1], translateY: [-12, 0], duration: 420 }, 0)
  if (items.length) {
    tl.add(items, { opacity: [0, 1], translateY: [16, 0], duration: 460, delay: stagger(70) }, 110)
  }
  running = [tl]
}

/** 第一屏 → 第二屏：欢迎屏上移退场，表单整屏滑入 + 子项错峰 */
const playToForm = (): void => {
  const intro = pick('.screen--intro')
  const form = pick('.screen--form')
  if (!intro || !form) return
  const items = pickAll(FORM_ITEMS)

  if (reduceMotion()) {
    place(intro, false)
    place(form, true)
    resetItems(items)
    return
  }

  stopRunning()
  hideItems(items)
  const tl = createTimeline({ defaults: { ease: 'outQuart' } })
  tl.add(intro, { opacity: [1, 0], translateY: [0, -26], duration: 300, ease: 'inQuad' }, 0)
    .add(form, { opacity: [0, 1], translateY: [26, 0], duration: 520 }, 130)
  if (items.length) {
    tl.add(items, { opacity: [0, 1], translateY: [16, 0], duration: 480, delay: stagger(50) }, 210)
  }
  running = [tl]
}

/** 第二屏 → 第一屏（返回）：表单下移退场，欢迎屏重新错峰浮现 */
const playBackToIntro = (): void => {
  const form = pick('.screen--form')
  if (!form) return

  if (reduceMotion()) {
    place(form, false)
    playIntroIn(true)
    return
  }

  const intro = pick('.screen--intro')
  const items = pickAll(INTRO_ITEMS)
  stopRunning()
  hideItems(items)
  const tl = createTimeline({ defaults: { ease: 'outQuart' } })
  tl.add(form, { opacity: [1, 0], translateY: [0, 24], duration: 280, ease: 'inQuad' }, 0)
  // 退场结束后把位移归零：向下位移留在隐藏屏上会撑出多余的可滚动区域
  tl.call(() => { if (form) form.style.transform = 'translateY(0px)' }, 300)
  if (intro) tl.add(intro, { opacity: [0, 1], translateY: [-12, 0], duration: 400 }, 120)
  if (items.length) {
    tl.add(items, { opacity: [0, 1], translateY: [16, 0], duration: 440, delay: stagger(65) }, 190)
  }
  running = [tl]
}

/** 第二屏 → 第三屏：表单上移退场 → 勾号弹性落位 + 成功波环 → 文案依次跟进。
    整段约 770ms 落定，之后留一小段稳定停留再交回父级跳转（否则刚播完就被切走）。 */
const playToWelcome = (): void => {
  const form = pick('.screen--form')
  const done = pick('.screen--done')
  if (!form || !done) return
  const mark = pick('.screen--done .done-mark')
  const ping = pick('.screen--done .done-ping')
  const title = pick('.screen--done .display')
  const lede = pick('.screen--done .lede')

  if (reduceMotion()) {
    place(form, false)
    place(done, true)
    if (mark) {
      mark.style.opacity = '1'
      mark.style.transform = 'none'
    }
    if (ping) ping.style.opacity = '0'
    resetItems([title, lede].filter((n): n is HTMLElement => !!n))
    return
  }

  stopRunning()
  hideItems([mark, ping, title, lede].filter((n): n is HTMLElement => !!n))
  const tl = createTimeline({ defaults: { ease: 'outQuart' } })
  tl.add(form, { opacity: [1, 0], translateY: [0, -22], duration: 260, ease: 'inQuad' }, 0)
    .add(done, { opacity: [0, 1], translateY: [16, 0], duration: 280 }, 110)
  // 勾号：略小尺寸弹性放大到满格（outBack 收尾带轻微回弹）
  if (mark) tl.add(mark, { opacity: [0, 1], scale: [0.4, 1], duration: 620, ease: 'outBack' }, 150)
  // 成功波环：与勾号同时向外扩散并淡出（只动 transform/opacity）
  if (ping) tl.add(ping, { opacity: [0.55, 0], scale: [0.85, 1.8], duration: 680, ease: 'outQuad' }, 150)
  if (title) tl.add(title, { opacity: [0, 1], translateY: [16, 0], duration: 420 }, 270)
  if (lede) tl.add(lede, { opacity: [0, 1], translateY: [12, 0], duration: 420 }, 350)
  running = [tl]
}

// 屏幕切换驱动动画（首屏 'intro' 不触发，由 onMounted 单独播放入场）
watch(screen, (next) => {
  if (next === 'form') playToForm()
  else if (next === 'welcome') playToWelcome()
  else playBackToIntro()
})

onMounted(() => {
  // 先落位再播动画：第二/第三屏预置为隐藏，第一屏内容错峰浮现
  place(pick('.screen--intro'), true)
  place(pick('.screen--form'), false)
  place(pick('.screen--done'), false)
  playIntroIn(false)
})

// ==================== 屏幕切换 ====================
const goForm = (): void => {
  introHover.value = false
  screen.value = 'form'
}

const backToIntro = (): void => {
  if (loading.value) return
  screen.value = 'intro'
  submitted.value = false
  errors.value = {}
  errorMessage.value = ''
}

const switchMode = (next: LoginMode): void => {
  if (mode.value === next) return
  mode.value = next
  errors.value = {}
  errorMessage.value = ''
  code.value = ''
  codeCountdown.value = 0
  if (codeTimer) {
    clearInterval(codeTimer)
    codeTimer = null
  }
}

// ==================== 校验 ====================
const validateEmail = (): boolean => {
  if (!email.value.trim()) {
    errors.value.email = '请输入邮箱'
    return false
  }
  if (!EMAIL_REGEX.test(email.value.trim())) {
    errors.value.email = '请输入有效的邮箱地址'
    return false
  }
  return true
}

// ==================== 邮箱验证码 ====================
const handleSendCode = async (): Promise<void> => {
  errors.value = {}
  errorMessage.value = ''
  if (!validateEmail()) return

  loading.value = true
  try {
    // 后端发送邮件验证码（Identity：POST /api/identity/ready/email-verifications）
    await sendEmailCode(email.value.trim())
    startCodeCountdown()
  } catch (err: unknown) {
    errorMessage.value = resolveError(err, '验证码发送失败，请稍后重试')
    console.error('发送邮箱验证码错误:', err)
  } finally {
    loading.value = false
  }
}

// 验证码只保留 9 位数字/字母（用 watch 而非 @input，避免与 v-model 写入竞争）
watch(code, (value: string) => {
  const cleaned = value.replace(/[^A-Za-z0-9]/g, '').slice(0, 9)
  if (cleaned !== value) code.value = cleaned
})

const startCodeCountdown = (): void => {
  codeCountdown.value = 60
  if (codeTimer) clearInterval(codeTimer)
  codeTimer = setInterval(() => {
    codeCountdown.value--
    if (codeCountdown.value <= 0) {
      clearInterval(codeTimer!)
      codeTimer = null
    }
  }, 1000)
}

// ==================== 错误信息归一化 ====================
const resolveError = (err: unknown, fallback: string): string => {
  const data = (err as { response?: { data?: unknown } })?.response?.data
  if (typeof data === 'string' && data) return data
  const message = (data as { error?: string; message?: string })?.error
    || (data as { message?: string })?.message
  return message || fallback
}

// ==================== 登录提交（双通道统一入口） ====================
const onForgotPassword = (): void => {
  errorMessage.value = '忘记密码请联系管理员重置'
}

const onSubmit = async (): Promise<void> => {
  errorMessage.value = ''
  errors.value = {}

  let valid = true
  if (!validateEmail()) valid = false

  if (mode.value === 'password') {
    if (!password.value) {
      errors.value.password = '请输入密码'
      valid = false
    }
  } else if (!CODE_REGEX.test(code.value)) {
    errors.value.code = '请输入 9 位验证码（数字和字母混合）'
    valid = false
  }
  if (!valid) return

  // 后端统一登录/注册：POST /api/identity/ready/identity/Login { email, code?, password? }
  const payloadInput = mode.value === 'password'
    ? { email: email.value.trim(), password: password.value }
    : { email: email.value.trim(), code: code.value }

  loading.value = true
  try {
    const payload = unwrap(await login(payloadInput))
    if (!payload.accessToken) {
      errorMessage.value = '登录响应异常，请稍后重试'
      return
    }
    isNewUser.value = Boolean(payload.isNewUser)
    // 成功：主按钮内文案切到「✓ 已登入」→ 滑入欢迎屏 → 交回父级保存凭证并跳转
    submitted.value = true
    loading.value = false
    welcomeTimer = setTimeout(() => {
      screen.value = 'welcome'
      // 第三屏入场约 770ms 落定，再留 ~180ms 稳定停留后才跳转
      finishTimer = setTimeout(() => emit('success', payload as unknown as TokenResult), 950)
    }, 420)
  } catch (err: unknown) {
    errorMessage.value = resolveError(
      err,
      mode.value === 'password' ? '登入失败，请检查邮箱和密码' : '登入失败，请检查邮箱和验证码'
    )
    console.error('登入错误:', err)
  } finally {
    loading.value = false
  }
}

// ==================== 第三方登录（后端 OAuth） ====================
// 回调地址：后端 OAuth 白名单校验（AllowedRedirectUris 配置）需包含该地址；
// 提供方完成授权后带 code/state 回到 /login，由 LoginPage 换取 Token
const oauthRedirectUri = (): string => window.location.origin + '/login'

const handleOAuthLogin = async (provider: string): Promise<void> => {
  errorMessage.value = ''
  try {
    // 记录当前提供商，供回调页（/login?code=&state=）换取 Token 时使用
    sessionStorage.setItem('oauth_provider', provider)
    // 后端返回拼接好的授权地址（含 state，存入 Redis 防 CSRF）
    const res = (await oauthLoginInit(provider, oauthRedirectUri())) as any
    const oauthUrl: string | undefined = res && res.authorizationUrl
    if (oauthUrl) {
      window.location.href = oauthUrl
    } else {
      errorMessage.value = '登录服务暂不可用，请稍后重试'
    }
  } catch (err: unknown) {
    sessionStorage.removeItem('oauth_provider')
    console.error(`获取 ${provider} OAuth 授权地址失败:`, err)
    errorMessage.value = `${provider} 登录服务暂不可用，请稍后重试`
  }
}

const handleMicrosoftLogin = (): void => { void handleOAuthLogin('microsoft') }
const handleGitHubLogin = (): void => { void handleOAuthLogin('github') }
const handleWeChatLogin = (): void => { void handleOAuthLogin('wechat') }
const handleGoogleLogin = (): void => { void handleOAuthLogin('google') }

// ==================== 清理 ====================
onBeforeUnmount(() => {
  stopRunning()
  if (codeTimer) clearInterval(codeTimer)
  if (welcomeTimer) clearTimeout(welcomeTimer)
  if (finishTimer) clearTimeout(finishTimer)
})
</script>

<style scoped>
/* ============================================================
   MonoHub 登入（极简无卡片）
   内容直接浮于柔和背景之上：三屏交叉过渡 + 下划线表单 + 品牌暖琥珀
   配色/字体/圆角均沿用全局设计系统（input.css 的品牌色板与字体类）
   ============================================================ */

.qm-auth {
  /* 浅色：深墨文字 + 加深的次级色，叠于奶白背景上均满足 WCAG AA */
  --qm-fg: #27272a;
  --qm-fg-muted: #52525b;
  --qm-line: rgba(39, 39, 42, 0.24);
  --qm-accent: #9a3412;
  --qm-danger: #dc2626;
  --qm-soft: rgba(39, 39, 42, 0.08);
  --qm-soft-hover: rgba(39, 39, 42, 0.14);
  --qm-surface: rgba(255, 255, 255, 0.72);
  --qm-surface-border: rgba(39, 39, 42, 0.14);
  --qm-ease: cubic-bezier(0.22, 1, 0.36, 1);

  position: relative;
  /* 三屏用 grid 同格叠放（见 .screen），容器高度随当前屏内容自然增长，
     校验错误等新增内容不会再溢出容器；min-height 仅保证矮内容时的视觉体量 */
  display: grid;
  width: min(400px, calc(100vw - 48px));
  min-height: clamp(560px, calc(100vh - 200px), 620px);
  color: var(--qm-fg);
}

html[data-theme='dark'] .qm-auth {
  --qm-fg: #fafafa;
  --qm-fg-muted: #d4d4d8;
  --qm-line: rgba(255, 255, 255, 0.3);
  --qm-accent: #fbbf24;
  --qm-danger: #fca5a5;
  --qm-soft: rgba(255, 255, 255, 0.12);
  --qm-soft-hover: rgba(255, 255, 255, 0.2);
  --qm-surface: rgba(24, 24, 27, 0.55);
  --qm-surface-border: rgba(255, 255, 255, 0.16);
}

/* ===== 三屏：grid 同格叠放（无卡片背景/边框/阴影） =====
   三屏共用同一网格单元，容器高度取三者内容的最大值，容器高度永远够用；
   显示/隐藏与位移动画由 anime.js 写入行内样式控制（见 script 的三屏过渡段落），
   CSS 只负责布局与交互拦截，避免两套机制争抢同一批属性导致动画跳变。 */
.screen {
  grid-area: 1 / 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  pointer-events: none;
  /* 提升为独立合成层：opacity/transform 动画走合成器，避免逐帧重绘触发
     body::after 全屏 mix-blend-mode 颗粒层的整屏重新混合（那是切换卡顿的主因） */
  will-change: opacity, transform;
}

/* 当前屏可交互（与模板的 inert 双保险） */
.qm-auth:not(.second-screen-opened) .screen--intro,
.second-screen-opened .screen--form,
.third-screen-opened .screen--done {
  pointer-events: auto;
}

/* ===== 文案 ===== */
.eyebrow {
  margin: 0 0 18px;
  color: var(--qm-accent);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.28em;
  text-transform: uppercase;
}

.display {
  margin: 0;
  font-size: clamp(32px, 4.6vw, 44px);
  font-weight: 600;
  line-height: 1.18;
  letter-spacing: 0.01em;
}

.lede {
  margin: 18px 0 0;
  max-width: 34ch;
  color: var(--qm-fg-muted);
  font-size: 14px;
  line-height: 1.9;
}

.title {
  margin: 0;
  font-size: 30px;
  font-weight: 600;
  line-height: 1.25;
}

.subtitle {
  margin: 8px 0 0;
  color: var(--qm-fg-muted);
  font-size: 13px;
}

/* ===== 第一屏 CTA ===== */
.cta {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  align-self: flex-start;
  margin-top: 32px;
  padding: 13px 26px;
  border: none;
  border-radius: 999px;
  background: linear-gradient(to bottom right, #f59e0b, #ea580c);
  color: #fffbeb;
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.03em;
  cursor: pointer;
  box-shadow: 0 14px 28px -16px rgba(234, 88, 12, 0.9);
  transition: transform 0.25s var(--qm-ease), box-shadow 0.25s var(--qm-ease);
}

.cta:hover {
  transform: translateY(-2px);
  box-shadow: 0 18px 32px -16px rgba(234, 88, 12, 0.95);
}

.cta:active {
  transform: translateY(0) scale(0.98);
}

/* 暖琥珀底上用深色描边，保证键盘焦点可见 */
.cta:focus-visible {
  outline: 2px solid var(--qm-fg);
  outline-offset: 3px;
}

.cta svg {
  transition: transform 0.25s var(--qm-ease);
}

.on-btn-pTSecond .cta svg {
  transform: translateX(3px);
}

/* ===== 返回 ===== */
.back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  align-self: flex-start;
  margin-bottom: 18px;
  padding: 6px 12px 6px 9px;
  border: none;
  border-radius: 999px;
  background: var(--qm-soft);
  color: var(--qm-fg-muted);
  font-family: inherit;
  font-size: 12.5px;
  cursor: pointer;
  transition: color 0.2s ease, background 0.2s ease;
}

.back:hover {
  color: var(--qm-fg);
  background: var(--qm-surface-border);
}

.back svg {
  transition: transform 0.2s var(--qm-ease);
}

.back:hover svg {
  transform: translateX(-2px);
}

/* ===== 通道切换（下划线标签页） ===== */
.tabs {
  display: flex;
  gap: 24px;
  margin-top: 24px;
  border-bottom: 1px solid var(--qm-line);
}

.tab {
  position: relative;
  padding: 0 0 10px;
  border: none;
  background: transparent;
  color: var(--qm-fg-muted);
  font-family: inherit;
  font-size: 14px;
  cursor: pointer;
  transition: color 0.2s ease;
}

.tab:hover:not(:disabled) {
  color: var(--qm-fg);
}

.tab--active {
  color: var(--qm-fg);
  font-weight: 600;
}

.tab--active::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: -1px;
  height: 2px;
  border-radius: 2px;
  background: linear-gradient(to right, #f59e0b, #ea580c);
}

.tab:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

/* ===== 表单（可见标签 + 下划线输入） ===== */
.form {
  margin: 20px 0 0;
}

.field {
  position: relative;
  margin-top: 18px;
}

.field__label {
  display: block;
  margin-bottom: 8px;
  color: var(--qm-fg-muted);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  transition: color 0.2s ease;
}

.field__input {
  width: 100%;
  padding: 0 0 10px;
  border: none;
  border-bottom: 1px solid var(--qm-line);
  background: transparent;
  color: var(--qm-fg);
  font-family: inherit;
  font-size: 15px;
  transition: border-color 0.25s ease, box-shadow 0.25s ease;
}

/* 焦点：2px 品牌色下划线 + 标签同色（替代默认描边环，避免方框压在标签上） */
.field__input:focus {
  outline: none;
  border-bottom-color: var(--qm-accent);
  box-shadow: 0 1px 0 0 var(--qm-accent);
}

.field:focus-within .field__label {
  color: var(--qm-accent);
}

.field__input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.field__input--peek {
  padding-right: 34px;
}

.field__input--code {
  padding-right: 108px;
}

.peek,
.send {
  position: absolute;
  right: 0;
  bottom: 8px;
  padding: 4px 0;
  border: none;
  background: transparent;
  font-family: inherit;
  cursor: pointer;
}

.peek {
  display: flex;
  color: var(--qm-fg-muted);
  transition: color 0.2s ease;
}

.peek:hover {
  color: var(--qm-fg);
}

.send {
  color: var(--qm-accent);
  font-size: 12.5px;
  font-weight: 600;
  transition: color 0.2s ease;
}

.send:disabled {
  color: var(--qm-fg-muted);
  cursor: not-allowed;
  opacity: 0.7;
}

.error {
  margin: 8px 0 0;
  color: var(--qm-danger);
  font-size: 12px;
  line-height: 1.6;
}

.hint {
  margin: 10px 0 0;
  color: var(--qm-fg-muted);
  font-size: 12px;
  line-height: 1.7;
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 18px;
}

.remember {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--qm-fg-muted);
  font-size: 13px;
  cursor: pointer;
}

.remember input {
  width: 15px;
  height: 15px;
  accent-color: #f59e0b;
  cursor: pointer;
}

.link {
  padding: 4px 0;
  border: none;
  background: transparent;
  color: var(--qm-accent);
  font-family: inherit;
  font-size: 13px;
  cursor: pointer;
  transition: opacity 0.2s ease;
}

.link:hover {
  opacity: 0.75;
}

/* ===== 主按钮（就绪转品牌色；提交后收成 ✓） ===== */
.form__submit {
  position: relative;
  margin-top: 24px;
}

.btn-form {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 13px 0;
  border: none;
  border-radius: 999px;
  background: var(--qm-soft);
  color: var(--qm-fg-muted);
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.05em;
  cursor: pointer;
  /* 只过渡颜色/阴影：宽高与外边距会逐帧触发布局重排 */
  transition: background 0.35s ease, color 0.35s ease, box-shadow 0.35s ease;
}

.btn-form:disabled {
  cursor: not-allowed;
}

/* 未就绪（灰）态仍可点击：hover 给出可交互反馈；就绪后由品牌渐变接管 */
.qm-auth:not(.form-ready) .btn-form:hover:not(:disabled) {
  background: var(--qm-soft-hover);
}

.form-ready .btn-form {
  color: #fffbeb;
  background: linear-gradient(to bottom right, #f59e0b, #ea580c);
  box-shadow: 0 14px 28px -18px rgba(234, 88, 12, 0.9);
}

/* 标签与「已登入」同格叠放：切换只做透明度/缩放，不产生任何布局变化。
   （原先用 width + margin-left 把按钮收成圆点，会逐帧触发布局重排，
   叠加背景颗粒层的全屏混合，正是提交瞬间卡顿的来源） */
.btn-form__stack {
  display: grid;
  place-items: center;
}

.btn-form__label,
.btn-form__done {
  grid-area: 1 / 1;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: opacity 0.25s ease, transform 0.35s var(--qm-ease);
}

.btn-form__done {
  opacity: 0;
  transform: scale(0.8);
}

.form-submitted .btn-form__label {
  opacity: 0;
  transform: scale(0.92);
}

.form-submitted .btn-form__done {
  opacity: 1;
  transform: scale(1);
}

/* ===== 分隔线与第三方 ===== */
.divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 24px 0 16px;
  color: var(--qm-fg-muted);
  font-size: 12px;
  white-space: nowrap;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--qm-line);
}

.oauth {
  display: flex;
  justify-content: center;
  gap: 14px;
}

.oauth-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 46px;
  border: 1px solid var(--qm-surface-border);
  border-radius: 50%;
  background: var(--qm-surface);
  color: var(--qm-fg);
  cursor: pointer;
  transition: transform 0.22s var(--qm-ease), border-color 0.22s ease, box-shadow 0.22s ease;
}

.oauth-btn:hover {
  transform: translateY(-2px);
  border-color: #f59e0b;
  box-shadow: 0 10px 20px -12px rgba(245, 158, 11, 0.9);
}

.oauth-btn:active {
  transform: translateY(0) scale(0.96);
}

/* ===== 提示 ===== */
.alert {
  margin: 16px 0 0;
  padding: 10px 12px;
  border: 1px solid rgba(220, 38, 38, 0.3);
  border-radius: 10px;
  background: rgba(220, 38, 38, 0.08);
  color: var(--qm-danger);
  font-size: 12.5px;
  line-height: 1.7;
  animation: qm-alert-in 0.3s ease-out;
}

@keyframes qm-alert-in {
  from {
    opacity: 0;
    transform: translateY(-6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ===== 第三屏 ===== */
.done-badge {
  position: relative;
  width: 56px;
  height: 56px;
  margin-bottom: 22px;
}

.done-mark {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: linear-gradient(to bottom right, #f59e0b, #ea580c);
  color: #fffbeb;
  box-shadow: 0 16px 30px -18px rgba(234, 88, 12, 0.9);
}

/* 成功波环：勾号落位时向外扩散一圈，给「完成」一个收束感（只动 transform/opacity） */
.done-ping {
  position: absolute;
  inset: 0;
  border: 2px solid rgba(245, 158, 11, 0.6);
  border-radius: 50%;
  opacity: 0;
}

/* ===== 矮视口收紧间距 ===== */
@media (max-height: 700px) {
  .display {
    font-size: 32px;
  }

  .title {
    font-size: 26px;
  }

  .cta {
    margin-top: 24px;
  }

  .field {
    margin-top: 16px;
  }

  .divider {
    margin: 20px 0 12px;
  }
}

/* ===== 减弱动态偏好：取消 CSS 过渡（三屏过渡由 script 中的减弱动效分支跳过） ===== */
@media (prefers-reduced-motion: reduce) {
  .qm-auth,
  .cta,
  .cta svg,
  .back,
  .back svg,
  .tab,
  .field__input,
  .peek,
  .send,
  .link,
  .btn-form,
  .btn-form__label,
  .btn-form__done,
  .oauth-btn {
    transition: none !important;
  }

  .cta:hover,
  .oauth-btn:hover {
    transform: none;
  }

  .alert {
    animation: none;
  }
}
</style>
