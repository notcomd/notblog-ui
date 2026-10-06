<template>
  <div class="max-w-[880px] mx-auto">
    <!-- ===== 页头 ===== -->
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div class="min-w-0">
        <h1 class="font-display text-2xl font-bold text-zinc-800 dark:text-zinc-100">账号安全</h1>
        <p class="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">修改当前管理员账号的登录密码</p>
      </div>
    </header>

    <!-- ===== 当前账号 ===== -->
    <section class="mt-8 border-t border-zinc-200/70 pt-6 dark:border-zinc-800/70">
      <h2 class="text-[11px] font-medium uppercase tracking-wider text-zinc-400">当前账号</h2>
      <div class="mt-4 flex items-center gap-3.5">
        <img
          v-if="avatarUrl"
          :src="avatarUrl"
          alt=""
          class="h-12 w-12 shrink-0 rounded-full object-cover ring-1 ring-black/10 dark:ring-white/10"
          @error="avatarFailed = true"
        />
        <span
          v-else
          class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-sm font-medium text-white"
        >{{ initial }}</span>
        <div class="min-w-0">
          <div class="truncate text-sm font-medium text-zinc-800 dark:text-zinc-100">{{ displayName }}</div>
          <div class="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-400">{{ accountEmail || '未获取到账号邮箱' }}</div>
        </div>
      </div>
    </section>

    <!-- ===== 修改密码 ===== -->
    <section class="mt-8 border-t border-zinc-200/70 pt-6 dark:border-zinc-800/70">
      <h2 class="text-[11px] font-medium uppercase tracking-wider text-zinc-400">修改密码</h2>
      <p class="mt-2 max-w-[52ch] text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
        新密码至少 8 位。修改成功后旧密码立即失效，其他设备上的登录状态可能需要重新验证。
      </p>

      <form class="mt-5 max-w-[420px] space-y-3" @submit.prevent="submit">
        <label class="block">
          <span class="mb-1.5 block text-[11px] text-zinc-500 dark:text-zinc-400">当前密码</span>
          <input
            v-model="form.oldPassword"
            type="password"
            name="oldPassword"
            autocomplete="current-password"
            aria-label="当前密码"
            placeholder="请输入当前登录密码"
            class="h-11 w-full rounded-[5%] bg-transparent px-3.5 text-sm text-zinc-700 outline-none ring-1 ring-inset ring-zinc-200/70 transition-all placeholder:text-zinc-400 focus:ring-2 focus:ring-amber-400/60 dark:text-zinc-200 dark:ring-zinc-800"
          />
        </label>

        <label class="block">
          <span class="mb-1.5 block text-[11px] text-zinc-500 dark:text-zinc-400">新密码</span>
          <input
            v-model="form.newPassword"
            type="password"
            name="newPassword"
            autocomplete="new-password"
            aria-label="新密码"
            placeholder="至少 8 位"
            class="h-11 w-full rounded-[5%] bg-transparent px-3.5 text-sm text-zinc-700 outline-none ring-1 ring-inset ring-zinc-200/70 transition-all placeholder:text-zinc-400 focus:ring-2 focus:ring-amber-400/60 dark:text-zinc-200 dark:ring-zinc-800"
          />
        </label>

        <label class="block">
          <span class="mb-1.5 block text-[11px] text-zinc-500 dark:text-zinc-400">确认新密码</span>
          <input
            v-model="form.confirmPassword"
            type="password"
            name="confirmPassword"
            autocomplete="new-password"
            aria-label="确认新密码"
            placeholder="再次输入新密码"
            class="h-11 w-full rounded-[5%] bg-transparent px-3.5 text-sm text-zinc-700 outline-none ring-1 ring-inset ring-zinc-200/70 transition-all placeholder:text-zinc-400 focus:ring-2 focus:ring-amber-400/60 dark:text-zinc-200 dark:ring-zinc-800"
          />
        </label>

        <p v-if="error" class="text-xs text-red-500" role="alert">{{ error }}</p>

        <button
          type="submit"
          class="h-11 w-full rounded-[5%] bg-gradient-to-r from-amber-400 to-orange-500 text-sm font-medium text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
          :disabled="saving || !accountEmail"
        >{{ saving ? '提交中…' : '修改密码' }}</button>

        <p v-if="!accountEmail" class="text-xs text-amber-600 dark:text-amber-400">
          未能从登录态读取邮箱，无法修改密码，请重新登录后再试。
        </p>
      </form>
    </section>
  </div>
</template>

<script lang="ts">
export default { name: 'AdminSecurityView' }
</script>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { changePassword } from '@/api/space'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'

const auth = useAuthStore()
const toast = useToastStore()

const accountEmail = computed(() => String(auth.user?.email || ''))
const displayName = computed(() => String(auth.user?.name || accountEmail.value || '管理员'))
const initial = computed(() => (displayName.value || '?').slice(0, 1))

const avatarFailed = ref(false)
const avatarUrl = computed(() => (!avatarFailed.value && auth.user?.avatar) || '')

const form = ref({ oldPassword: '', newPassword: '', confirmPassword: '' })
const error = ref('')
const saving = ref(false)

function apiError(e: any, fallback: string): string {
  const body = e?.response?.data
  return body?.error || body?.message || (e?.message !== 'Error' ? e?.message : '') || fallback
}

async function submit(): Promise<void> {
  error.value = ''
  if (!form.value.oldPassword || !form.value.newPassword) {
    error.value = '请填写当前密码和新密码'
    return
  }
  if (form.value.newPassword.length < 8) {
    error.value = '新密码至少 8 位'
    return
  }
  if (form.value.newPassword !== form.value.confirmPassword) {
    error.value = '两次输入的新密码不一致'
    return
  }

  saving.value = true
  try {
    await changePassword({
      email: accountEmail.value,
      oldPassword: form.value.oldPassword,
      newPassword: form.value.newPassword
    })
    form.value = { oldPassword: '', newPassword: '', confirmPassword: '' }
    toast.push('密码修改成功', 'success')
  } catch (e: any) {
    error.value = apiError(e, '修改失败，请检查当前密码是否正确')
  } finally {
    saving.value = false
  }
}
</script>
