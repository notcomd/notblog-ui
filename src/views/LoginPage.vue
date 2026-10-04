<template>
  <div class="relative min-h-screen overflow-hidden">
    <!-- 背景壁纸（fixed inset-0 z-0，内容层 z-10 保证不被盖住） -->
    <BackgroundImage />

    <!-- 可读性遮罩：浅色铺一层柔和白纱，让背景更接近奶白并淡化线条；
         深色加深压暗，保证浮层文字对比度 -->
    <div
      class="absolute inset-0 z-[5] transition-colors duration-300"
      :class="theme.isDark ? 'bg-black/65' : 'bg-white/40'"
    ></div>

    <!-- ===== 左上角 Logo（与 SideNav 品牌一致） ===== -->
    <router-link
      to="/home"
      class="fixed top-6 left-6 z-50 flex items-center gap-2.5"
      title="MonoHub"
    >
      <div
        class="w-9 h-9 rounded-lg overflow-hidden bg-white border border-zinc-200/70 dark:border-white/10 shadow-sm"
      >
        <img src="@/assets/monohub-logo.jpg" alt="MonoHub" class="w-full h-full object-cover" />
      </div>
      <!-- text-zinc-800 在深色主题下由 input.css 统一转纯白，深浅背景均可读 -->
      <span class="text-lg font-bold tracking-wide font-display text-zinc-800">MonoHub</span>
    </router-link>

    <!-- ===== 右上角主题切换 ===== -->
    <button
      class="fixed top-6 right-6 z-50 w-11 h-11 flex items-center justify-center rounded-full text-zinc-800 dark:text-zinc-100 hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all duration-200"
      :title="theme.isDark ? '切换到浅色主题' : '切换到深色主题'"
      :aria-label="theme.isDark ? '切换到浅色主题' : '切换到深色主题'"
      @click="theme.toggle()"
    >
      <!-- 暗色 → 显示太阳（点击回浅色）；浅色 → 显示月亮（点击进暗色） -->
      <svg v-if="theme.isDark" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
      </svg>
      <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M21 12.79A9 9 0 1 1 11.31 3 7 7 0 0 0 21 12.79z" />
      </svg>
    </button>

    <!-- ===== 中央登入内容（三屏：欢迎 → 登入表单 → 登录成功；无卡片，直接浮于背景） ===== -->
    <div class="relative z-10 min-h-screen flex items-center justify-center p-6">
      <LoginFrom @success="finishLogin" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useThemeStore } from '@/stores/theme'
import { useAuthStore } from '@/stores/auth'
import LoginFrom from '@/components/LoginFrom.vue'
import BackgroundImage from '@/components/BackgroundImage.vue'
import { oauthCallback, saveLoginResult } from '@/api/auth'
import type { TokenResult } from '@/types'

const route = useRoute()
const router = useRouter()
const theme = useThemeStore()
const auth = useAuthStore()

// ==================== 登录收尾（表单登录 / OAuth 回调共用） ====================
// 凭证落盘后按 ?redirect 回跳原页面（由 main.ts 会话失效装配写入），无则回首页
const finishLogin = (payload: TokenResult): void => {
  if (!saveLoginResult(payload)) {
    console.error('登录失败：响应缺少 accessToken', payload)
    return
  }
  // store 在应用启动时就已创建，此时 token 还是旧的，必须先重解析 JWT 再拉资料，
  // 否则登录后 auth.user 为空、顶栏头像要等整页刷新才出现。
  auth.refreshUserFromToken()
  void auth.loadUserInfo()
  const redirect = route.query.redirect
  router.replace(
    typeof redirect === 'string' && redirect.startsWith('/') && !redirect.startsWith('//')
      ? redirect
      : '/home'
  )
}

// ==================== OAuth 回调 ====================
// 提供方授权完成后回跳到 /login?code=xxx&state=xxx，在此换取 Token
onMounted(async () => {
  const { code, state } = route.query
  const provider = sessionStorage.getItem('oauth_provider')
  if (provider && code && state) {
    sessionStorage.removeItem('oauth_provider')
    try {
      // axios 拦截器未解包，业务数据在 res.data
      const res = await oauthCallback(provider, code as string, state as string, window.location.origin + '/login')
      const data = res && (res as any).data ? (res as any).data : (res as any)
      finishLogin(data as TokenResult)
    } catch (err) {
      console.error('OAuth 回调换取 Token 失败:', err)
    }
  }
})
</script>
