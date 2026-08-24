<template>
  <div class="min-h-screen flex items-center justify-center bg-amber-50/30 px-4">
    <div class="w-full max-w-md">
      <!-- 卡片 -->
      <div class="bg-white rounded-[5%] p-8 transition-all duration-300">
        <!-- 返回按钮 -->
        <button
          class="mb-6 flex items-center text-sm text-zinc-500 hover:text-zinc-700 transition-colors duration-200"
          @click="handleGoBack"
        >
          <svg class="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          返回登录
        </button>

        <!-- 标题 -->
        <div class="mb-6">
          <h1 class="text-2xl font-bold text-zinc-800 dark:text-zinc-100 mb-2">验证您的身份</h1>
          <p class="text-sm text-zinc-500 dark:text-zinc-300">
            我们已向
            <span class="font-semibold text-zinc-700 dark:text-zinc-200">{{ maskedTarget }}</span>
            发送了验证码
          </p>
        </div>

        <!-- 验证码输入区域（9 位数字+英文混合） -->
        <div class="mb-6">
          <label class="block text-xs font-semibold text-zinc-600 dark:text-zinc-200 tracking-wide mb-3">
            请输入 9 位验证码（数字和字母混合）
          </label>

          <VerificationCodeInput
            v-model="code"
            :length="9"
            :error="!!errorMessage"
            @complete="handleSubmit"
          />

          <p v-if="errorMessage" class="mt-2 text-xs text-red-500 text-center">{{ errorMessage }}</p>
          <p class="mt-2 text-[11px] text-zinc-400 dark:text-zinc-400 text-center">验证码区分大小写，请按邮件内容原样输入</p>
        </div>

        <!-- 倒计时 & 重新发送 -->
        <div class="mb-6 text-center">
          <p v-if="countdown > 0" class="text-sm text-zinc-500 dark:text-zinc-300">
            {{ countdown }} 秒后可重新发送
          </p>
          <button
            v-else
            class="text-sm text-amber-600 font-medium hover:text-amber-700 dark:text-amber-400 underline underline-offset-2 decoration-amber-300 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="resendLoading"
            @click="handleResendCode"
          >
            <span v-if="resendLoading" class="inline-flex items-center gap-1">
              <span class="h-3 w-3 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></span>
              发送中...
            </span>
            <span v-else>重新发送验证码</span>
          </button>
        </div>

        <!-- 提交按钮 -->
        <button
          class="w-full py-2.5 bg-amber-700 text-white text-sm font-medium rounded-[5%] transition-all duration-200 flex justify-center items-center focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-1"
          :class="submitLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-amber-800 active:bg-amber-900 active:scale-[0.98]'"
          :disabled="submitLoading || !isCodeComplete"
          @click="handleSubmit"
        >
          <span v-if="submitLoading" class="mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          验证并登入
        </button>

        <!-- 提示信息 -->
        <p class="mt-4 text-xs text-center text-zinc-400 dark:text-zinc-400">
          没有收到验证码？请检查垃圾邮件文件夹或确认输入的联系方式是否正确
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import VerificationCodeInput from '@/components/VerificationCodeInput.vue'
import { sendEmailCode, login, saveLoginResult } from '@/api/auth'

const route = useRoute()
const router = useRouter()

// 登录页经路由 state 传来的密码（仅内存态，刷新页面即失效，需重新登录）
const historyState: any = window.history.state
const password = historyState && historyState.password
  ? historyState.password
  : ''

// ==================== 从路由参数获取目标信息 ====================
const target = computed(() => (route.query.email || route.query.phone || '') as string)

const maskedTarget = computed(() => {
  const t = target.value
  if (!t) return '***'
  if (t.includes('@')) {
    // 邮箱脱敏: abc****@domain.com
    const [name, domain] = t.split('@')
    if (name.length <= 2) return `${name[0]}***@${domain}`
    return `${name.slice(0, 2)}***@${domain}`
  }
  // 手机号脱敏: 138****1234
  if (t.length === 11) return `${t.slice(0, 3)}****${t.slice(7)}`
  return t
})

// ==================== 9 位验证码（数字+英文混合） ====================
const code = ref('')
const isCodeComplete = computed(() => code.value.length === 9)

// ==================== 倒计时 ====================
const countdown = ref(60)
let countdownTimer: ReturnType<typeof setInterval> | null = null

const startCountdown = () => {
  countdown.value = 60
  if (countdownTimer) clearInterval(countdownTimer)
  countdownTimer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(countdownTimer)
      countdownTimer = null
    }
  }, 1000)
}

// ==================== 提交 ====================
const errorMessage = ref('')
const submitLoading = ref(false)

const handleSubmit = async () => {
  if (!isCodeComplete.value || submitLoading.value) return

  errorMessage.value = ''
  submitLoading.value = true

  if (!password) {
    errorMessage.value = '登录信息已失效，请返回重新登录'
    submitLoading.value = false
    return
  }

  try {
    // 两步登录：邮箱 + 密码 + 验证码（后端校验并一次性消费验证码）
    // 成功返回 { accessToken, ... }；失败返回 200 + 空 body（null）
    const res = await login({ email: target.value, password, code: code.value })
    if (saveLoginResult(res)) {
      // 清除内存中的密码后进入主页
      window.history.replaceState({}, '')
      router.replace('/home')
    } else {
      errorMessage.value = '登录失败：邮箱、密码或验证码不正确'
    }
  } catch (error) {
    errorMessage.value = '验证码错误，请重新输入'
    console.error('验证码校验错误:', error)
  } finally {
    submitLoading.value = false
  }
}

// ==================== 重新发送 ====================
const resendLoading = ref(false)

const handleResendCode = async () => {
  if (countdown.value > 0 || resendLoading.value) return

  resendLoading.value = true
  errorMessage.value = ''

  if (!target.value.includes('@')) {
    errorMessage.value = '手机验证码登录暂未开放'
    resendLoading.value = false
    return
  }

  try {
    await sendEmailCode(target.value)
    startCountdown()
  } catch (error) {
    errorMessage.value = error.response && error.response.data && error.response.data.error
      ? error.response.data.error
      : '重新发送失败，请稍后重试'
    console.error('重发验证码错误:', error)
  } finally {
    resendLoading.value = false
  }
}

// ==================== 返回登录 ====================
const handleGoBack = () => {
  router.push('/login')
}

// ==================== 生命周期 ====================
onMounted(async () => {
  // 进入页面自动发送邮箱验证码（邮箱两步登录）
  if (target.value.includes('@')) {
    try {
      await sendEmailCode(target.value)
      startCountdown()
    } catch (error) {
      errorMessage.value = '验证码发送失败，请点击重新发送'
      console.error('发送验证码错误:', error)
    }
  } else {
    errorMessage.value = '手机验证码登录暂未开放'
  }
})

onUnmounted(() => {
  if (countdownTimer) clearInterval(countdownTimer)
})
</script>
