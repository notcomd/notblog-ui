<template>
  <div
    class="qm-auth"
    :class="appClasses"
    role="region"
    aria-label="登入 MonoHub"
  >
    <!-- ===== 叶片 SVG 精灵（隐藏；仅作 <use> 引用源，id 加 qm- 前缀避免全局冲突） ===== -->
    <svg class="svg-leafs" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      <defs>
        <filter id="qmLeafShadowA" x="0" y="11.42" width="141.121" height="116.457" filterUnits="userSpaceOnUse">
          <feOffset input="SourceAlpha" />
          <feGaussianBlur stdDeviation="2" result="b" />
          <feFlood flood-opacity="0.102" />
          <feComposite operator="in" in2="b" />
          <feComposite in="SourceGraphic" />
        </filter>
        <filter id="qmLeafShadowB" x="30" y="5" width="150" height="140" filterUnits="userSpaceOnUse">
          <feOffset input="SourceAlpha" />
          <feGaussianBlur stdDeviation="5" result="d" />
          <feFlood flood-opacity="0.102" />
          <feComposite operator="in" in2="d" />
          <feComposite in="SourceGraphic" />
        </filter>
      </defs>
      <g id="qm-leafs" transform="translate(-744.034 -593.436)">
        <path
          d="M863.5,421.5s8.259,5.707,15.234,25.935"
          transform="translate(156.156 66.187) rotate(16)"
          fill="none"
          stroke="var(--qm-leaf-stroke)"
          stroke-linecap="round"
          stroke-width="0.4"
        />
        <g transform="matrix(1, 0, 0, 1, 744.03, 593.44)" filter="url(#qmLeafShadowA)">
          <path
            d="M902.99,490.315s-43.333-18.667-50.49-50.667,10.49-31.667,10.49-31.667A314.915,314.915,0,0,1,895.5,411c16.5,2.5,69.5,37.5,81,70.5,3.829,10.989,7.49,22.815-7.176,29.815S902.99,490.315,902.99,490.315Z"
            transform="translate(-844.79 -390.56)"
            fill="var(--qm-leaf-1)"
          />
        </g>
        <path
          d="M863.5,421.5s12.557,3.337,25.522,21.57"
          transform="translate(355.423 -110.67) rotate(32)"
          fill="none"
          stroke="var(--qm-leaf-stroke)"
          stroke-linecap="round"
          stroke-width="0.4"
        />
        <g transform="matrix(1, 0, 0, 1, 744.03, 593.44)" filter="url(#qmLeafShadowB)">
          <path
            d="M906.186,482.446A113.239,113.239,0,0,1,885.911,470c-5.977-4.556-11.973-10.782-16.832-16.173-12.146-13.478-10.038-42.395-5.407-45.119s27.019,5.924,27.019,5.924,30.8,14.016,39.021,25.114c16.177,21.847,23.864,43.4,14.867,49.079S908.19,483.261,906.186,482.446Z"
            transform="translate(-701.6 -564.26) rotate(12.09)"
            fill="var(--qm-leaf-2)"
          />
        </g>
      </g>
    </svg>

    <!-- ===== 三片叶片：随屏幕状态换位 ===== -->
    <div class="leafs" aria-hidden="true">
      <div class="leaf leaf--1">
        <svg xmlns="http://www.w3.org/2000/svg" width="176" height="152" viewBox="0 0 176 152">
          <use href="#qm-leafs" />
        </svg>
      </div>
      <div class="leaf leaf--2">
        <svg xmlns="http://www.w3.org/2000/svg" width="176" height="152" viewBox="0 0 176 152">
          <use href="#qm-leafs" />
        </svg>
      </div>
      <div class="leaf leaf--3">
        <svg xmlns="http://www.w3.org/2000/svg" width="176" height="152" viewBox="0 0 176 152">
          <use href="#qm-leafs" />
        </svg>
      </div>
    </div>

    <!-- ===== 第一屏：欢迎 ===== -->
    <section class="screen first-screen">
      <p class="number font-numeric">MONOHUB</p>
      <h1 class="heading font-display">MonoHub</h1>
      <p class="description">在这里，遇见同好，记录热爱。<br />登录后即可发布、收藏与交流。</p>
      <button
        type="button"
        class="btn-circle btn-pTSecond"
        aria-label="前往登入"
        @click="goForm"
        @mouseenter="introHover = true"
        @mouseleave="introHover = false"
        @focus="introHover = true"
        @blur="introHover = false"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M5 12h13M13 6l6 6-6 6" />
        </svg>
      </button>
    </section>

    <!-- ===== 第二屏：登入（单表单双通道） ===== -->
    <section class="screen second-screen">
      <button type="button" class="btn-circle btn-pTFirst" aria-label="返回欢迎页" @click="backToIntro">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M19 12H6M11 18l-6-6 6-6" />
        </svg>
      </button>

      <h1 class="heading font-display">登入</h1>

      <!-- 通道切换 -->
      <div class="tabs">
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
      </div>

      <form class="form" novalidate @submit.prevent="onSubmit">
        <!-- 邮箱 -->
        <div class="form__field">
          <label class="sr-only" for="qm-login-email">邮箱</label>
          <input
            id="qm-login-email"
            v-model="email"
            class="form__input"
            type="email"
            name="email"
            autocomplete="email"
            placeholder="邮箱"
            :disabled="loading || submitted"
          />
        </div>
        <p v-if="errors.email" class="form__error">{{ errors.email }}</p>

        <!-- 密码登入 -->
        <template v-if="mode === 'password'">
          <div class="form__field">
            <label class="sr-only" for="qm-login-password">密码</label>
            <input
              id="qm-login-password"
              v-model="password"
              class="form__input form__input--peek"
              :type="showPassword ? 'text' : 'password'"
              name="password"
              autocomplete="current-password"
              placeholder="密码"
              :disabled="loading || submitted"
            />
            <button
              type="button"
              class="form__peek"
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
          <p v-if="errors.password" class="form__error">{{ errors.password }}</p>

          <div class="form__row">
            <label class="remember">
              <input v-model="rememberMe" type="checkbox" :disabled="loading || submitted" />
              <span>记住我</span>
            </label>
            <button type="button" class="form__link" @click="onForgotPassword">忘记密码？</button>
          </div>
        </template>

        <!-- 验证码登入（未注册邮箱自动注册） -->
        <template v-else>
          <div class="form__field">
            <label class="sr-only" for="qm-login-code">邮箱验证码</label>
            <input
              id="qm-login-code"
              v-model="code"
              class="form__input form__input--code"
              type="text"
              inputmode="text"
              maxlength="9"
              name="code"
              autocomplete="one-time-code"
              placeholder="邮箱验证码"
              :disabled="loading || submitted"
            />
            <button
              type="button"
              class="form__code-btn"
              :disabled="codeCountdown > 0 || loading || submitted"
              @click="handleSendCode"
            >
              {{ codeCountdown > 0 ? `${codeCountdown}s 后重发` : '获取验证码' }}
            </button>
          </div>
          <p v-if="errors.code" class="form__error">{{ errors.code }}</p>
          <p class="form__hint">未注册邮箱将自动注册，初始密码会发送到您的邮箱。</p>
        </template>

        <div class="form__submit">
          <button type="submit" class="btn-words btn-form" :disabled="loading || submitted">
            <span class="btn-form__label">{{ loading ? '处理中' : mode === 'password' ? '登入' : '登入 / 注册' }}</span>
          </button>
          <div class="form__success" aria-live="polite">成功</div>
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
    <section class="screen third-screen">
      <h1 class="heading font-display">欢迎</h1>
      <p class="description">{{ successText }}</p>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
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
const mode = ref<LoginMode>('password')
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

/** 卡片根节点的状态类：模板的动画全部由这些类驱动 */
const appClasses = computed<Record<string, boolean>>(() => ({
  'on-btn-pTSecond': introHover.value,
  'second-screen-opened': screen.value !== 'intro',
  'third-screen-opened': screen.value === 'welcome',
  'form-ready': formReady.value,
  'form-submitted': submitted.value,
  'has-alert': errorMessage.value.length > 0
}))

const successText = computed<string>(() =>
  isNewUser.value
    ? '账号已创建，初始密码已发送至你的邮箱。'
    : '登录成功，正在进入部落…'
)

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
    // 成功：先让主按钮收成 ✓，再滑入欢迎屏，最后交回父级保存凭证并跳转
    submitted.value = true
    loading.value = false
    welcomeTimer = setTimeout(() => {
      screen.value = 'welcome'
      finishTimer = setTimeout(() => emit('success', payload as unknown as TokenResult), 900)
    }, 520)
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
  if (codeTimer) clearInterval(codeTimer)
  if (welcomeTimer) clearTimeout(welcomeTimer)
  if (finishTimer) clearTimeout(finishTimer)
})
</script>

<style scoped>
/* ============================================================
   MonoHub 登入卡片（改编自「创意动画登录注册 UI」模板）
   结构：三屏卡片 + 三片叶 + 圆形按钮涟漪 + 下划线表单
   配色：保留模板的自然叶片，主色替换为品牌暖琥珀
   ============================================================ */

/* ===== 主题变量（浅色） ===== */
.qm-auth {
  --qm-paper-1: #fffdf7;
  --qm-paper-2: #f7f3ea;
  --qm-ink-1: #26261f;
  --qm-ink-2: #6b6a60;
  --qm-brand-ink: #b45309;
  --qm-brand: #f59e0b;
  --qm-brand-deep: #ea580c;
  --qm-leaf-1: #34d399;
  --qm-leaf-2: #10b981;
  --qm-leaf-stroke: #047857;
  --qm-line: #c9c3b6;
  --qm-placeholder: #b3ab9c;
  --qm-soft: #ece6da;
  --qm-danger: #dc2626;
  --qm-cream: #fffbeb;
  --qm-grad-brand: linear-gradient(to right bottom, var(--qm-brand), var(--qm-brand-deep));
  --qm-grad-paper: linear-gradient(to right bottom, var(--qm-paper-1), var(--qm-paper-2));

  position: relative;
  isolation: isolate;
  width: min(360px, calc(100vw - 32px));
  height: clamp(540px, calc(100vh - 32px), 640px);
  border-radius: 22px;
  overflow: hidden;
  color: var(--qm-ink-1);
  box-shadow:
    0 34px 64px -24px rgba(24, 24, 27, 0.5),
    0 14px 28px -14px rgba(24, 24, 27, 0.3);
}

html[data-theme='dark'] .qm-auth {
  --qm-paper-1: #26262b;
  --qm-paper-2: #1b1b1f;
  --qm-ink-1: #f4f4f5;
  --qm-ink-2: #a1a1aa;
  --qm-brand-ink: #fbbf24;
  --qm-line: #4b4b52;
  --qm-placeholder: #71717a;
  --qm-soft: #3a3a41;
  --qm-danger: #fca5a5;
  --qm-grad-brand: linear-gradient(to right bottom, #f59e0b, #d97706);
  box-shadow:
    0 34px 64px -24px rgba(0, 0, 0, 0.75),
    0 14px 28px -14px rgba(0, 0, 0, 0.55);
}

/* ===== 叶片精灵（隐藏，仅作引用源） ===== */
.svg-leafs {
  position: absolute;
  top: -100%;
  left: -100%;
  visibility: hidden;
}

/* ===== 叶片 =====
   图形本体：一片朝右下的叶子，叶柄位于盒子右下角（art 占 x 6.6~138.8、y 13.8~123.6）。
   摆放原则 —— 叶从卡片边缘「探入」，由卡片的 overflow:hidden 自然裁切，
   因此 right/bottom 多为负值（把叶柄推到卡外，只留叶身在画面内）；
   左下的叶用 scaleX(-1) 做镜像，让叶柄朝左下角，与右下叶对称。 */
.leaf {
  position: absolute;
  right: 0;
  bottom: 0;
  z-index: 4;
  width: 150px;
  transform-origin: center;
  pointer-events: none;
  transition: 0.3s;
}

.leaf svg {
  display: block;
  width: 100%;
  height: auto;
}

/* 默认（第一屏）：左下 / 右下两片从底边探入，右上叶倒挂 */
.leaf--1 {
  right: -36px;
  bottom: -34px;
  transform: rotate(-10deg);
}

.leaf--2 {
  right: 246px;
  bottom: -30px;
  transform: rotate(10deg) scaleX(-1);
}

.leaf--3 {
  right: -52px;
  bottom: 510px;
  transform: rotate(176deg);
}

/* ===== 屏幕 ===== */
.screen {
  position: absolute;
  top: 0;
  left: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 26px;
  border-radius: inherit;
  color: var(--qm-cream);
  background: transparent;
}

.first-screen {
  align-items: flex-start;
  background: var(--qm-grad-brand);
}

.second-screen {
  left: 100%;
  z-index: 2;
  justify-content: center;
  padding: 72px 26px 26px;
  color: var(--qm-brand-ink);
}

.third-screen {
  left: 100%;
  z-index: 3;
  background: var(--qm-grad-brand);
  /* 琥珀色以圆形从主按钮位置扩散，铺满后完全覆盖第二屏（不留表单残影） */
  clip-path: circle(0% at 42% 65%);
}

/* ===== 文案 ===== */
.number {
  width: 100%;
  margin-bottom: 14px;
  text-align: right;
  font-size: 11px;
  letter-spacing: 0.12em;
  opacity: 0.85;
}

.heading {
  font-size: 30px;
  letter-spacing: 0.06em;
  transition: 0.4s;
}

.description {
  margin-top: 16px;
  font-size: 13px;
  line-height: 2;
  opacity: 0.95;
}

/* ===== 圆形按钮 ===== */
.btn-circle {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 42px;
  height: 42px;
  border: none;
  border-radius: 100px;
  background: transparent;
  color: inherit;
  cursor: pointer;
}

.btn-pTSecond {
  margin-top: 22px;
  border: 1px solid var(--qm-cream);
  transform: scale(0.8);
  transform-origin: left center;
  transition: 0.3s;
}

.btn-pTSecond:hover,
.btn-pTSecond:focus-visible {
  transform: scale(1);
}

.btn-pTSecond::before {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: inherit;
  background: var(--qm-grad-paper);
  transform: scale(0);
  transition: 0.6s;
}

.btn-pTFirst {
  position: absolute;
  top: 18px;
  left: 18px;
  color: var(--qm-cream);
  background: var(--qm-grad-brand);
  transition: 0.3s;
}

.btn-pTFirst:hover {
  transform: translateX(-2px);
}

/* ===== 通道切换 ===== */
.tabs {
  display: flex;
  gap: 18px;
  margin-top: 22px;
}

.tab {
  padding: 0 0 7px;
  border: none;
  border-bottom: 1px solid transparent;
  background: transparent;
  color: var(--qm-ink-2);
  font-size: 13px;
  letter-spacing: 0.06em;
  cursor: pointer;
  transition: 0.35s;
}

.tab--active {
  color: var(--qm-brand-ink);
  border-bottom-color: var(--qm-brand-ink);
}

.tab:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

/* ===== 表单 ===== */
.form {
  width: 100%;
  margin: 18px 0 0;
  text-align: center;
  opacity: 0;
  transform: translateY(18px);
}

.form__field {
  position: relative;
  width: 100%;
  height: auto;
  margin-bottom: 20px;
}

.form__field::before,
.form__field::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0;
  transition: 0.5s;
}

.form__field::before {
  border-bottom: 1px solid var(--qm-line);
  opacity: 0.45;
}

.form__field::after {
  border-bottom: 1px solid var(--qm-brand-ink);
}

.form__field:focus-within::after {
  width: 100%;
}

.form__input {
  width: 100%;
  padding: 0 0 9px;
  border: none;
  background: transparent;
  color: var(--qm-ink-1);
  font-family: inherit;
  font-size: 14px;
}

.form__input::placeholder {
  color: var(--qm-placeholder);
}

.form__input--peek {
  padding-right: 30px;
}

.form__input--code {
  padding-right: 104px;
}

.form__peek {
  position: absolute;
  right: 0;
  bottom: 8px;
  display: flex;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--qm-ink-2);
  cursor: pointer;
  transition: color 0.25s;
}

.form__peek:hover {
  color: var(--qm-brand-ink);
}

.form__code-btn {
  position: absolute;
  right: 0;
  bottom: 8px;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--qm-brand-ink);
  font-family: inherit;
  font-size: 12px;
  cursor: pointer;
  transition: 0.25s;
}

.form__code-btn:disabled {
  color: var(--qm-ink-2);
  cursor: not-allowed;
  opacity: 0.7;
}

.form__error {
  margin: -12px 0 12px;
  text-align: left;
  font-size: 11.5px;
  color: var(--qm-danger);
}

.form__hint {
  margin: -6px 0 14px;
  text-align: left;
  font-size: 11.5px;
  line-height: 1.7;
  color: var(--qm-ink-2);
}

.form__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
}

.remember {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 12.5px;
  color: var(--qm-ink-2);
  cursor: pointer;
}

.remember input {
  width: 14px;
  height: 14px;
  accent-color: var(--qm-brand);
  cursor: pointer;
}

.form__link {
  padding: 0;
  border: none;
  background: transparent;
  color: var(--qm-brand-ink);
  font-family: inherit;
  font-size: 12.5px;
  cursor: pointer;
  transition: opacity 0.25s;
}

.form__link:hover {
  opacity: 0.75;
}

/* ===== 主按钮（含 ✓ 与涟漪） ===== */
.btn-words {
  width: 100%;
  border: none;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.4s, transform 1s 0.5s;
}

.btn-form {
  position: relative;
  margin-top: 4px;
  padding: 12px 0;
  border-radius: 100px;
  background: var(--qm-soft);
  color: var(--qm-ink-2);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.06em;
}

.btn-form:disabled {
  cursor: not-allowed;
}

.btn-form__label {
  transition: opacity 0.3s;
}

.btn-form::before {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  font-size: 15px;
  transform: translate(-50%, -50%) scale(0);
  transition: 0.5s 0.4ms cubic-bezier(0.17, 0.09, 0.77, 1.8);
}

.form__submit {
  position: relative;
}

.form__success {
  position: absolute;
  top: 50%;
  left: 50%;
  font-size: 13px;
  color: var(--qm-brand-ink);
  pointer-events: none;
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.9);
  transition: 1s 0.5s;
}

/* ===== 分隔线与第三方 ===== */
.divider {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 22px 0 16px;
  font-size: 11px;
  color: var(--qm-ink-2);
  white-space: nowrap;
  opacity: 0;
  transform: translateY(14px);
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--qm-soft);
}

.oauth {
  display: flex;
  justify-content: center;
  gap: 14px;
  opacity: 0;
  transform: translateY(14px);
}

.oauth-btn {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 46px;
  height: 46px;
  border: 1px solid var(--qm-soft);
  border-radius: 50%;
  background: var(--qm-paper-1);
  cursor: pointer;
  transition: 0.25s;
}

.oauth-btn:hover {
  border-color: var(--qm-brand);
  transform: translateY(-2px);
  box-shadow: 0 8px 18px -10px rgba(245, 158, 11, 0.9);
}

/* ===== 错误提示 ===== */
.alert {
  margin-top: 14px;
  padding: 10px 12px;
  border: 1px solid rgba(239, 68, 68, 0.28);
  border-radius: 10px;
  background: rgba(239, 68, 68, 0.08);
  text-align: left;
  font-size: 11.5px;
  line-height: 1.7;
  color: var(--qm-danger);
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

/* ============================================================
   状态类驱动的动画（模板机制）
   ============================================================ */

/* ===== 悬停进入按钮：叶片轻微摇曳 ===== */
.on-btn-pTSecond .leaf--1 {
  right: -30px;
  bottom: -26px;
  transform: rotate(-4deg);
}

.on-btn-pTSecond .leaf--2 {
  right: 240px;
  bottom: -36px;
  transform: rotate(4deg) scaleX(-1);
}

.on-btn-pTSecond .leaf--3 {
  right: -46px;
  bottom: 502px;
  transform: rotate(168deg);
}

/* ===== 第二屏展开 ===== */
.second-screen-opened .leaf {
  transition: 1s;
}

/* 第二屏：叶片退到卡片四角留白带，避让表单内容与多行错误提示 */
.second-screen-opened .leaf--1 {
  right: -40px;
  bottom: -40px;
  transform: rotate(-8deg);
}

.second-screen-opened .leaf--2 {
  right: 250px;
  bottom: -44px;
  transform: rotate(8deg) scaleX(-1);
}

.second-screen-opened .leaf--3 {
  right: -60px;
  bottom: 518px;
  transform: rotate(184deg);
}

/* 错误提示出现时表单内容变高，底部叶片顺势下移避让 */
.has-alert.second-screen-opened .leaf--1,
.has-alert.second-screen-opened .leaf--2 {
  bottom: -64px;
}

.second-screen-opened .first-screen .heading {
  opacity: 0;
  transform: translateX(30px);
}

.second-screen-opened .btn-pTSecond::before {
  border-radius: 0;
  /* 卡片 360×640，按钮位于左下：scale(28) 才能保证涟漪铺满整卡（含四角） */
  transform: scale(28);
}

.second-screen-opened .second-screen {
  left: 0;
}

.second-screen-opened .second-screen .heading {
  opacity: 1;
  transform: translateX(0);
  transition: 1s 0.4s;
}

.second-screen-opened .second-screen .form {
  opacity: 1;
  transform: translateY(0);
  transition: 0.7s 0.1s;
}

.second-screen-opened .form__field::before {
  width: 100%;
  transition: 0.8s 0.3s;
}

.second-screen-opened .second-screen .tabs {
  opacity: 1;
  transform: translateY(0);
  transition: 0.6s 0.16s;
}

.second-screen-opened .divider {
  opacity: 1;
  transform: translateY(0);
  transition: 0.6s 0.3s;
}

.second-screen-opened .oauth {
  opacity: 1;
  transform: translateY(0);
  transition: 0.6s 0.36s;
}

.second-screen .heading {
  opacity: 0;
  transform: translateX(30px);
}

.second-screen .tabs {
  opacity: 0;
  transform: translateY(14px);
  transition: 0.5s;
}

/* ===== 第三屏展开 ===== */
/* 第三屏：叶片环绕（成功态无表单内容，可放开） */
.third-screen-opened .leaf--1 {
  right: -30px;
  bottom: -28px;
  transform: rotate(-14deg);
}

.third-screen-opened .leaf--2 {
  right: 240px;
  bottom: -26px;
  transform: rotate(14deg) scaleX(-1);
}

.third-screen-opened .leaf--3 {
  right: -46px;
  bottom: 504px;
  transform: rotate(170deg);
}

.third-screen-opened .second-screen .heading {
  opacity: 0;
  transform: translateX(30px);
}

.third-screen-opened .third-screen {
  left: 0;
  clip-path: circle(150% at 42% 65%);
  transition: clip-path 0.6s ease;
}

.third-screen-opened .third-screen .heading {
  opacity: 1;
  transform: translate(0);
  transition: 1s 0.4s;
}

.third-screen-opened .third-screen .description {
  opacity: 1;
  transform: translateY(0);
  transition: 0.6s 0.55s;
}

.third-screen .heading {
  opacity: 0;
  transform: translateY(30px);
}

.third-screen .description {
  opacity: 0;
  transform: translateY(16px);
  transition: 0.5s;
}

/* ===== 表单填写完成 ===== */
.form-ready .btn-form {
  color: var(--qm-cream);
  background: var(--qm-brand);
}

/* ===== 提交成功 ===== */
.form-submitted .btn-form {
  width: 42px;
  padding-left: 0;
  padding-right: 0;
  transform: translateX(-28px);
}

.form-submitted .btn-form__label {
  opacity: 0;
}

.form-submitted .btn-form::before {
  transform: translate(-50%, -50%) scale(1);
}

.form-submitted .form__success {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1);
}

/* ===== 窄/矮视口收紧间距 ===== */
@media (max-height: 700px) {
  .second-screen {
    padding-top: 62px;
  }

  .heading {
    font-size: 26px;
  }

  .form {
    margin-top: 14px;
  }

  .form__field {
    margin-bottom: 16px;
  }

  .divider {
    margin: 16px 0 12px;
  }

  .oauth-btn {
    width: 42px;
    height: 42px;
  }
}

/* ===== 减弱动态偏好：保留淡入，关闭位移/涟漪/叶片位移 ===== */
@media (prefers-reduced-motion: reduce) {
  .leaf,
  .heading,
  .description,
  .form,
  .tabs,
  .divider,
  .oauth,
  .third-screen,
  .btn-pTSecond,
  .btn-pTSecond::before,
  .btn-pTFirst,
  .oauth-btn,
  .form__success,
  .btn-form,
  .btn-form::before {
    transition: none !important;
  }

  .btn-pTSecond {
    transform: none;
  }

  .form,
  .tabs,
  .divider,
  .oauth,
  .description {
    transform: none;
  }

  .alert {
    animation: none;
  }
}
</style>
