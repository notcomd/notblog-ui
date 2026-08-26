<template>
  <div class="w-full max-w-md">
    <!-- 卡片 -->
    <div class="transition-all duration-300">
      <!-- 标题 -->
      <div class="mb-6">
        <h1 class="text-3xl font-bold text-zinc-800 dark:text-zinc-100 mb-2">加入 NotBlog</h1>
        <p class="text-sm text-zinc-500 dark:text-zinc-300">输入邮箱获取验证码，即可登录；未注册邮箱将自动注册并下发初始密码</p>
      </div>

      <!-- ==================== 邮箱登录/注册表单 ==================== -->
      <form @submit.prevent="handleEmailLogin" novalidate>
        <!-- 邮箱输入框 -->
        <div class="mb-4">
          <label for="reg-email" class="block text-xs font-semibold text-zinc-600 dark:text-zinc-200 tracking-wide mb-1.5">
            邮箱
          </label>
          <div class="relative">
            <span class="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400 dark:text-zinc-400">
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </span>
            <input
              type="email"
              id="reg-email"
              v-model="email"
              class="w-full pl-10 pr-4 py-2.5 bg-amber-50/50 border rounded-[5%] text-sm text-zinc-700 placeholder-amber-300 transition-all duration-200 focus:outline-none focus:ring-1 dark:bg-zinc-800/60 dark:border-zinc-600/60 dark:text-zinc-100 dark:placeholder-zinc-500"
              :class="errors.email ? 'border-red-300 focus:border-red-400 focus:ring-red-300 dark:border-red-400/70 dark:focus:ring-red-400/50' : 'border-amber-200 focus:border-amber-400 focus:ring-amber-300 dark:border-zinc-600/60 dark:focus:ring-amber-400/50'"
              :disabled="emailLoading"
              placeholder="请输入您的邮箱"
              autocomplete="email"
            >
          </div>
          <p v-if="errors.email" class="mt-1.5 text-xs text-red-500 flex items-center gap-1">
            <svg class="h-3 w-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
            {{ errors.email }}
          </p>
        </div>

        <!-- 邮箱验证码 -->
        <div class="mb-5">
          <label for="reg-code" class="block text-xs font-semibold text-zinc-600 dark:text-zinc-200 tracking-wide mb-1.5">
            邮箱验证码（9 位数字+英文混合）
          </label>
          <div class="flex gap-2">
            <input
              type="text"
              id="reg-code"
              v-model="generatecode"
              maxlength="9"
              class="flex-1 py-2.5 px-4 bg-amber-50/50 border rounded-[5%] text-sm text-zinc-700 placeholder-amber-300 transition-all duration-200 focus:outline-none focus:ring-1 dark:bg-zinc-800/60 dark:border-zinc-600/60 dark:text-zinc-100 dark:placeholder-zinc-500"
              :class="errors.generatecode ? 'border-red-300 focus:border-red-400 focus:ring-red-300 dark:border-red-400/70 dark:focus:ring-red-400/50' : 'border-amber-200 focus:border-amber-400 focus:ring-amber-300 dark:border-zinc-600/60 dark:focus:ring-amber-400/50'"
              :disabled="emailLoading"
              placeholder="9 位数字和字母混合"
              @input="generatecode = generatecode.replace(/[^A-Za-z0-9]/g, '').slice(0, 9)"
            >
            <button
              type="button"
              class="px-4 py-2.5 text-xs font-medium rounded-[5%] whitespace-nowrap transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1"
              :class="emailCodeCountdown > 0 ? 'bg-amber-100 text-amber-500 cursor-not-allowed dark:bg-zinc-800 dark:text-amber-300' : 'bg-gradient-to-r from-amber-400 to-orange-500 text-white hover:brightness-110 focus:ring-amber-400 active:scale-[0.97]'"
              :disabled="emailCodeCountdown > 0 || emailLoading"
              @click="handleSendEmailCode"
            >
              {{ emailCodeCountdown > 0 ? `${emailCodeCountdown}s 后重发` : '获取验证码' }}
            </button>
          </div>
          <p v-if="errors.generatecode" class="mt-1.5 text-xs text-red-500 flex items-center gap-1">
            <svg class="h-3 w-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
            {{ errors.generatecode }}
          </p>
        </div>

        <!-- 登录/注册按钮 -->
        <button
          type="submit"
          class="w-full py-2.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-sm font-medium rounded-[5%] transition-all duration-200 flex justify-center items-center focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-1"
          :class="emailLoading ? 'opacity-70 cursor-not-allowed' : 'hover:brightness-110 active:scale-[0.98]'"
          :disabled="emailLoading"
        >
          <span v-if="emailLoading" class="mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          登录 / 注册
        </button>
      </form>

      <!-- 登录链接 -->
      <div class="mt-5 text-center">
        <p class="text-xs text-zinc-500 dark:text-zinc-300">
          已有账号？
          <a
            href="#"
            class="text-amber-600 dark:text-amber-400 font-semibold hover:text-amber-700 dark:hover:text-amber-300 transition-colors duration-200 underline underline-offset-2 decoration-amber-300 dark:decoration-amber-500"
            @click.prevent="handleLoginClick"
          >
            立即登入
          </a>
        </p>
      </div>
    </div>

    <!-- 错误提示 -->
    <div
      v-if="errorMessage"
      class="mt-4 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-400/30 rounded-[5%] flex items-start gap-2 animate-fade-in"
    >
      <svg class="h-4 w-4 text-red-400 dark:text-red-300 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
      </svg>
      <p class="text-xs text-red-700 dark:text-red-300">{{ errorMessage }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { login, saveLoginResult, sendEmailCode } from '@/api/auth'
import router from '@/router'

// ==================== Props & Emits ====================
defineProps<{
  showLoginForm?: boolean
  showRegisterForm?: boolean
}>()

const emit = defineEmits<{
  (e: 'showLoginForm', v: boolean): void
}>()

// ==================== 邮箱登录/注册状态 ====================
const email = ref('')
const generatecode = ref('')
const emailLoading = ref(false)
const emailCodeCountdown = ref(0)
let emailCodeTimer: ReturnType<typeof setInterval> | null = null

// ==================== 通用状态 ====================
const errorMessage = ref('')
const errors = ref<Record<string, string>>({})

// ==================== 切换到登录 ====================
const handleLoginClick = (): void => {
  emit('showLoginForm', true)
}

// ==================== 邮箱验证码发送 ====================
const handleSendEmailCode = async (): Promise<void> => {
  errors.value.email = ''

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email.value)) {
    errors.value.email = '请输入有效的邮箱地址'
    return
  }

  emailLoading.value = true
  try {
    // 后端发送邮件验证码（Identity：POST /api/identity/ready/email-verifications）
    await sendEmailCode(email.value)
    startEmailCodeCountdown()
  } catch (error: any) {
    errorMessage.value = error && error.response && error.response.data && error.response.data.error
      ? error.response.data.error
      : '验证码发送失败，请稍后重试'
    console.error('发送邮箱验证码错误:', error)
  } finally {
    emailLoading.value = false
  }
}

const startEmailCodeCountdown = (): void => {
  emailCodeCountdown.value = 60
  if (emailCodeTimer) clearInterval(emailCodeTimer)
  emailCodeTimer = setInterval(() => {
    emailCodeCountdown.value--
    if (emailCodeCountdown.value <= 0) {
      clearInterval(emailCodeTimer!)
      emailCodeTimer = null
    }
  }, 1000)
}

// ==================== 邮箱登录/注册提交 ====================
const handleEmailLogin = async (): Promise<void> => {
  errors.value = {}
  errorMessage.value = ''

  let isValid = true
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (!emailRegex.test(email.value)) {
    errors.value.email = '请输入有效的邮箱地址'
    isValid = false
  }

  if (!/^[A-Za-z0-9]{9}$/.test(generatecode.value)) {
    errors.value.generatecode = '请输入 9 位验证码（数字和字母混合）'
    isValid = false
  }

  if (!isValid) return

  emailLoading.value = true

  try {
    // 后端统一登录/注册：POST /api/identity/ready/identity/Login { email, code }
    // 未注册邮箱自动注册并下发初始密码；成功返回 token + isNewUser
    const res = await login({
      email: email.value,
      code: generatecode.value
    })
    saveLoginResult(res)
    if (res && res.isNewUser) {
      errorMessage.value = '账号已自动注册，初始密码已发送到您的邮箱，请注意查收。'
    }
    router.push('/')
  } catch (error) {
    const data = (error as any).response && (error as any).response.data
    // 后端业务失败返回 401 + { error }
    errorMessage.value = (typeof data === 'string' && data)
      || (data && (data.error || data.message))
      || '登录失败，请检查邮箱和验证码'
  } finally {
    emailLoading.value = false
  }
}
</script>

<style scoped>
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fade-in 0.3s ease-out;
}
</style>