<template>
  <div class="max-w-[860px] mx-auto">
    <!-- ===== 页头 ===== -->
    <header class="flex items-start justify-between gap-4">
      <div class="min-w-0">
        <button
          type="button"
          class="mb-3 -ml-1 flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
          @click="goBack"
        >
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
          返回主页
        </button>
        <h1 class="font-display text-2xl font-bold text-zinc-800 dark:text-zinc-100">账号与安全</h1>
        <p class="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">管理登录密码、二次验证与第三方账号绑定</p>
      </div>
    </header>

    <!-- ===== 修改密码 ===== -->
    <section class="mt-10 pt-8 border-t border-zinc-200/70 dark:border-zinc-800/70">
      <div class="flex items-baseline gap-2.5">
        <h2 class="font-display text-lg font-bold text-zinc-800 dark:text-zinc-100">修改密码</h2>
        <span class="text-xs text-zinc-400">修改后需用新密码登录</span>
      </div>
      <form class="mt-5 max-w-[420px] space-y-3" @submit.prevent="submitPassword">
        <input v-model="pwd.oldPassword" name="oldPassword" aria-label="旧密码" type="password" placeholder="旧密码" autocomplete="current-password" class="w-full h-11 px-4 rounded-[5%] bg-white/70 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700/70 text-sm text-zinc-700 dark:text-zinc-200 outline-none focus:ring-2 focus:ring-amber-400/50 transition-all" />
        <input v-model="pwd.newPassword" name="newPassword" aria-label="新密码" type="password" placeholder="新密码（至少 8 位）" autocomplete="new-password" class="w-full h-11 px-4 rounded-[5%] bg-white/70 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700/70 text-sm text-zinc-700 dark:text-zinc-200 outline-none focus:ring-2 focus:ring-amber-400/50 transition-all" />
        <input v-model="pwd.confirmPassword" name="confirmPassword" aria-label="确认新密码" type="password" placeholder="确认新密码" autocomplete="new-password" class="w-full h-11 px-4 rounded-[5%] bg-white/70 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700/70 text-sm text-zinc-700 dark:text-zinc-200 outline-none focus:ring-2 focus:ring-amber-400/50 transition-all" />
        <p v-if="pwdError" class="text-xs text-red-500" role="alert">{{ pwdError }}</p>
        <button class="w-full h-11 rounded-[5%] bg-gradient-to-r from-amber-400 to-orange-500 text-white text-sm font-medium hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50" type="submit" :disabled="pwdSaving">
          {{ pwdSaving ? '提交中…' : '修改密码' }}
        </button>
      </form>
    </section>

    <!-- ===== 二次验证 ===== -->
    <section class="mt-10 pt-8 border-t border-zinc-200/70 dark:border-zinc-800/70">
      <div class="flex items-start justify-between gap-4">
        <div class="min-w-0">
          <h2 class="font-display text-lg font-bold text-zinc-800 dark:text-zinc-100">二次验证</h2>
          <p class="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400 max-w-[46ch]">
            开启后使用密码登入需额外输入邮箱验证码；关闭二次验证需进行身份二次确认
          </p>
        </div>
        <button
          type="button"
          role="switch"
          :aria-checked="twoFactorEnabled"
          :aria-label="twoFactorEnabled ? '点击关闭二次验证' : '点击开启二次验证'"
          :class="twoFactorEnabled ? 'bg-gradient-to-r from-amber-400 to-orange-500' : 'bg-zinc-300 dark:bg-zinc-600'"
          class="relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-1 disabled:opacity-60"
          :disabled="toggleBusy"
          @click="handleToggleTwoFactor"
        >
          <span
            :class="twoFactorEnabled ? 'translate-x-5' : 'translate-x-0.5'"
            class="absolute top-0.5 left-0 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200"
          ></span>
        </button>
      </div>

      <!-- 关闭二次验证的二次确认面板 -->
      <div v-if="confirmOpen" class="mt-5 max-w-[420px] space-y-3 rounded-[5%] bg-amber-50/70 dark:bg-zinc-800/50 border border-amber-200/70 dark:border-white/10 p-4">
        <p class="text-xs font-medium text-zinc-600 dark:text-zinc-300">选择身份确认方式</p>
        <div class="flex gap-2">
          <button
            type="button"
            class="flex-1 h-9 rounded-[5%] text-xs font-medium transition-colors"
            :class="secConfirmMethod === 'password' ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white' : 'bg-white/70 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-200 border border-white/60 dark:border-white/10'"
            :aria-pressed="secConfirmMethod === 'password'"
            @click="secConfirmMethod = 'password'"
          >
            使用密码确认
          </button>
          <button
            type="button"
            class="flex-1 h-9 rounded-[5%] text-xs font-medium transition-colors"
            :class="secConfirmMethod === 'code' ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white' : 'bg-white/70 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-200 border border-white/60 dark:border-white/10'"
            :aria-pressed="secConfirmMethod === 'code'"
            @click="secConfirmMethod = 'code'"
          >
            使用验证码确认
          </button>
        </div>

        <!-- 密码确认 -->
        <div v-if="secConfirmMethod === 'password'">
          <input v-model="confirmPassword" name="confirmPassword" aria-label="请输入密码确认" type="password" placeholder="请输入密码确认" autocomplete="current-password" class="w-full h-11 px-4 rounded-[5%] bg-white/70 dark:bg-zinc-800/70 border border-white/60 dark:border-white/10 text-sm outline-none focus:ring-2 focus:ring-amber-400/50 transition-all" />
        </div>

        <!-- 验证码确认 -->
        <div v-else class="flex gap-2">
          <input v-model="confirmCode" name="confirmCode" aria-label="邮箱验证码" type="text" maxlength="9" placeholder="9 位验证码" class="flex-1 h-11 px-4 rounded-[5%] bg-white/70 dark:bg-zinc-800/70 border border-white/60 dark:border-white/10 text-sm outline-none focus:ring-2 focus:ring-amber-400/50 transition-all" @input="confirmCode = confirmCode.replace(/[^A-Za-z0-9]/g, '').slice(0, 9)" />
          <button
            type="button"
            class="px-3 h-11 rounded-[5%] text-xs font-medium whitespace-nowrap transition-colors"
            :class="codeCountdown > 0 ? 'bg-amber-100 text-amber-500 cursor-not-allowed dark:bg-zinc-800 dark:text-amber-300' : 'bg-gradient-to-r from-amber-400 to-orange-500 text-white hover:brightness-110'"
            :disabled="codeCountdown > 0 || toggleBusy"
            @click="handleSendSecurityCode"
          >
            {{ codeCountdown > 0 ? `${codeCountdown}s 后重发` : '获取验证码' }}
          </button>
        </div>

        <p v-if="securityMsg" class="text-xs" :class="securityError ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'">{{ securityMsg }}</p>

        <button
          type="button"
          class="w-full h-11 rounded-[5%] bg-red-500/90 text-white text-sm font-medium hover:bg-red-500 transition-colors disabled:opacity-50"
          :disabled="toggleBusy"
          @click="handleConfirmDisable"
        >
          {{ toggleBusy ? '提交中…' : '确认关闭二次验证' }}
        </button>
      </div>
    </section>

    <!-- ===== 第三方账号绑定 ===== -->
    <section class="mt-10 pt-8 border-t border-zinc-200/70 dark:border-zinc-800/70">
      <div class="flex items-baseline gap-2.5">
        <h2 class="font-display text-lg font-bold text-zinc-800 dark:text-zinc-100">第三方账号绑定</h2>
        <span class="text-xs text-zinc-400">解绑后将无法使用该账号登录</span>
      </div>
      <div class="mt-5 space-y-2.5 max-w-[520px]">
        <div v-for="a in linkedAccounts" :key="a.provider" class="flex items-center justify-between gap-3 px-4 py-3 rounded-[5%] bg-white/60 dark:bg-zinc-800/60 border border-zinc-200/70 dark:border-zinc-700/50">
          <div class="flex items-center gap-3 min-w-0">
            <span class="w-9 h-9 rounded-[5%] bg-zinc-100 dark:bg-zinc-700 flex items-center justify-center shrink-0" v-html="providerIcon(a.provider)"></span>
            <div class="min-w-0">
              <div class="text-sm font-medium text-zinc-700 dark:text-zinc-200 truncate">{{ a.displayName }}</div>
              <div class="text-[11px] text-zinc-400">{{ relativeTime(a.linkedAt) }} 绑定</div>
            </div>
          </div>
          <button class="shrink-0 px-3 h-8 rounded-[5%] text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors" type="button" @click="unlinkTarget = a">解绑</button>
        </div>
        <div v-if="linkedAccounts.length === 0" class="py-10 text-center text-sm text-zinc-400">还没有绑定第三方账号</div>
      </div>
    </section>

    <!-- 解绑第三方账号确认 -->
    <ConfirmDialog
      v-if="unlinkTarget"
      danger
      title="解绑第三方账号"
      :message="'确定解绑 ' + (unlinkTarget ? unlinkTarget.displayName : '') + ' 吗？解绑后将无法使用该账号登录。'"
      confirm-text="解绑"
      @close="unlinkTarget = null"
      @confirm="unlink(unlinkTarget)"
    />
  </div>
</template>

<script lang="ts">
export default { name: 'SecuritySettingsView' }
</script>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import ConfirmDialog from '@/components/admin/ConfirmDialog.vue'
import { getLinkedAccounts, unlinkAccount, changePassword, getUserSafety, updateUserSafety } from '@/api/space'
import { sendEmailCode } from '@/api/auth'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import { relativeTime } from '@/utils/format'

const router = useRouter()
const auth = useAuthStore()
const toast = useToastStore()

// 返回个人主页（安全设置已从空间导航移除，返回主页 tab）
function goBack(): void {
  const id = auth.user ? auth.user.id : ''
  router.push(id ? { path: `/users/${id}`, query: { tab: 'home' } } : '/home')
}

// ===== 修改密码 =====
const pwd = ref({ oldPassword: '', newPassword: '', confirmPassword: '' })
const pwdError = ref('')
const pwdSaving = ref(false)

async function submitPassword(): Promise<void> {
  pwdError.value = ''
  if (!pwd.value.oldPassword || !pwd.value.newPassword) {
    pwdError.value = '请填写旧密码和新密码'
    return
  }
  if (pwd.value.newPassword.length < 8) {
    pwdError.value = '新密码至少 8 位'
    return
  }
  if (pwd.value.newPassword !== pwd.value.confirmPassword) {
    pwdError.value = '两次输入的新密码不一致'
    return
  }
  pwdSaving.value = true
  try {
    await changePassword({ email: auth.user ? auth.user.email : '', oldPassword: pwd.value.oldPassword, newPassword: pwd.value.newPassword })
    toast.push('密码修改成功', 'success')
    pwd.value = { oldPassword: '', newPassword: '', confirmPassword: '' }
  } catch (e: any) {
    const data = e.response && e.response.data
    pwdError.value = (typeof data === 'string' && data) || (data && (data.error || data.message)) || '修改失败，请检查旧密码'
  } finally {
    pwdSaving.value = false
  }
}

// ===== 二次验证开关（GET/POST /api/identity/ready/identity/UserSafety，需认证） =====
const twoFactorEnabled = ref(false) // 是否已开启二次验证
const confirmOpen = ref(false) // 关闭二次验证的二次确认面板是否展开
const secConfirmMethod = ref<'password' | 'code'>('password') // 二次确认方式
const confirmPassword = ref('') // 密码二次确认输入
const confirmCode = ref('') // 验证码二次确认输入
const codeCountdown = ref(0) // 验证码重发倒计时
const securityMsg = ref('') // 二次验证操作反馈信息
const securityError = ref(false) // securityMsg 是否为错误（红色）样式
const toggleBusy = ref(false) // 二次验证操作进行中（禁用开关及各提交按钮）
let securityCodeTimer: ReturnType<typeof setInterval> | null = null

// 读取二次验证开关状态
async function loadSafety(): Promise<void> {
  try {
    const res = await getUserSafety()
    const d: any = res && res.data ? res.data : res
    twoFactorEnabled.value = !!d && !!d.IsTwoFactorEnabled
  } catch (e) {
    twoFactorEnabled.value = false
  }
}

// 统一提交二次验证开关变更；关闭（降级）时携带密码或验证码二次确认
async function setTwoFactor(target: boolean, password?: string, code?: string): Promise<boolean> {
  toggleBusy.value = true
  securityError.value = false
  securityMsg.value = ''
  try {
    await updateUserSafety(target, password, code)
    twoFactorEnabled.value = target
    confirmOpen.value = false
    confirmPassword.value = ''
    confirmCode.value = ''
    toast.push(target ? '已开启二次验证' : '已关闭二次验证', 'success')
    return true
  } catch (e: any) {
    const data = e.response && e.response.data
    securityError.value = true
    securityMsg.value = (data && (data.error || data.message)) || '操作失败，请稍后重试'
    return false
  } finally {
    toggleBusy.value = false
  }
}

// 开关切换：开启直接提交；关闭需先展开二次确认面板
function handleToggleTwoFactor(): void {
  if (toggleBusy.value) return
  securityMsg.value = ''
  if (twoFactorEnabled.value) {
    // 关闭 → 展开（或收起）二次确认面板，并清空已输入内容
    confirmOpen.value = !confirmOpen.value
    if (!confirmOpen.value) {
      confirmPassword.value = ''
      confirmCode.value = ''
    }
    return
  }
  void setTwoFactor(true)
}

// 发送邮箱二次确认验证码（复用登录验证码通道）
async function handleSendSecurityCode(): Promise<void> {
  if (codeCountdown.value > 0 || toggleBusy.value) return
  if (!auth.user || !auth.user.email) {
    securityError.value = true
    securityMsg.value = '无法获取当前账号邮箱'
    return
  }
  securityError.value = false
  securityMsg.value = ''
  try {
    await sendEmailCode(auth.user.email)
    codeCountdown.value = 60
    if (securityCodeTimer) clearInterval(securityCodeTimer)
    securityCodeTimer = setInterval(() => {
      codeCountdown.value--
      if (codeCountdown.value <= 0) {
        if (securityCodeTimer) clearInterval(securityCodeTimer)
        securityCodeTimer = null
      }
    }, 1000)
    securityMsg.value = '验证码已发送至你的邮箱'
  } catch (e: any) {
    const data = e.response && e.response.data
    securityError.value = true
    securityMsg.value = (data && (data.error || data.message)) || '验证码发送失败，请稍后重试'
  }
}

// 确认关闭二次验证
async function handleConfirmDisable(): Promise<void> {
  if (toggleBusy.value) return
  if (secConfirmMethod.value === 'password') {
    if (!confirmPassword.value.trim()) {
      securityError.value = true
      securityMsg.value = '请输入当前密码'
      return
    }
    await setTwoFactor(false, confirmPassword.value)
  } else {
    if (confirmCode.value.length !== 9) {
      securityError.value = true
      securityMsg.value = '请输入 9 位验证码'
      return
    }
    await setTwoFactor(false, undefined, confirmCode.value)
  }
}

// ===== 第三方账号绑定 =====
const linkedAccounts = ref<any[]>([])
const unlinkTarget = ref<any>(null) // 待解绑的第三方账号（确认弹窗）

async function loadLinked(): Promise<void> {
  try {
    const res = await getLinkedAccounts()
    const data: any = res && res.data ? res.data : res
    linkedAccounts.value = Array.isArray(data) ? data : (data.items || data.list || [])
  } catch (e) {
    linkedAccounts.value = []
  }
}

async function unlink(a: any): Promise<void> {
  unlinkTarget.value = null
  try {
    await unlinkAccount(a.provider, a.providerUserId)
    linkedAccounts.value = linkedAccounts.value.filter(x => x.provider !== a.provider || x.providerUserId !== a.providerUserId)
    toast.push(`已解绑 ${a.displayName}`, 'success')
  } catch (e) {
    toast.push('解绑失败，请稍后重试', 'error')
  }
}

function providerIcon(p: string): string {
  const map: Record<string, string> = {
    github: '<svg class="w-5 h-5" viewBox="0 0 24 24" fill="#24292f"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>',
    google: '<svg class="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>',
    microsoft: '<svg class="w-5 h-5" viewBox="0 0 24 24"><rect x="2" y="2" width="10" height="10" fill="#F25022"/><rect x="13" y="2" width="9" height="10" fill="#7FBA00"/><rect x="2" y="13" width="10" height="9" fill="#00A4EF"/><rect x="13" y="13" width="9" height="9" fill="#FFB900"/></svg>',
    wechat: '<svg class="w-5 h-5" viewBox="0 0 24 24"><path fill="#07C160" d="M9.5 4C5.36 4 2 6.91 2 10.5c0 2.1 1.17 3.97 3 5.2l-.75 2.3 2.53-1.32c.85.24 1.77.37 2.72.37.18 0 .35-.01.53-.02A5.5 5.5 0 0 1 9.5 13c0-3.31 2.9-6 6.5-6h.26C15.13 5.03 12.5 4 9.5 4z"/><path fill="#07C160" d="M17.5 8C14.46 8 12 10.24 12 13s2.46 5 5.5 5c.7 0 1.37-.11 2-.3L21.5 19l-.62-1.9c1.33-.96 2.12-2.36 2.12-4.1C23 10.24 20.54 8 17.5 8z"/><circle cx="8.5" cy="10.8" r="1" fill="#fff"/><circle cx="12.5" cy="10.8" r="1" fill="#fff"/><circle cx="15.5" cy="13.2" r="1" fill="#fff"/><circle cx="19.5" cy="13.2" r="1" fill="#fff"/></svg>',
    qq: '<svg class="w-5 h-5" viewBox="0 0 24 24"><path fill="#12B7F5" d="M12 3c-3.6 0-6.5 2.9-6.5 6.5 0 1.3.4 2.5 1 3.5l-.9 3 3.1-1.5c.7.2 1.5.4 2.3.4s1.6-.1 2.3-.4l3.1 1.5-.9-3c.7-1 1-2.2 1-3.5C18.5 5.9 15.6 3 12 3z"/><circle cx="9.5" cy="9.5" r="1.2" fill="#fff"/><circle cx="14.5" cy="9.5" r="1.2" fill="#fff"/><path fill="#fff" d="M9.5 13.5c.8.8 1.6 1.2 2.5 1.2s1.7-.4 2.5-1.2c-.4 1.5-1.3 2.3-2.5 2.3s-2.1-.8-2.5-2.3z"/></svg>'
  }
  return map[p] || '<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>'
}

// 页面卸载时清理验证码倒计时定时器
function clearSecurityTimer(): void {
  if (securityCodeTimer) {
    clearInterval(securityCodeTimer)
    securityCodeTimer = null
  }
}

onMounted(() => {
  loadSafety()
  loadLinked()
  window.addEventListener('beforeunload', clearSecurityTimer)
})
onUnmounted(() => {
  clearSecurityTimer()
  window.removeEventListener('beforeunload', clearSecurityTimer)
})
</script>
