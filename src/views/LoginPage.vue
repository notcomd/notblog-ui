<template>
  <div class="relative min-h-screen overflow-hidden">
    <!-- 背景壁纸（fixed inset-0 z-0，内容层 z-10 保证不被盖住） -->
    <BackgroundImage />

    <!-- 可读性遮罩：暗色主题加深 -->
    <div
      class="absolute inset-0 z-[5] transition-colors duration-300"
      :class="theme.isDark ? 'bg-black/45' : 'bg-black/15'"
    ></div>

    <!-- ===== 左上角 Logo（与 TopBar 品牌一致） ===== -->
    <router-link
      to="/home"
      class="fixed top-6 left-6 z-50 flex items-center gap-2.5 group"
      title="轻芒 · 兴趣部落"
    >
      <div
        class="w-10 h-10 flex items-center justify-center text-zinc-800 dark:text-zinc-100"
      >
        <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M12 3l7 4v5c0 4.4-3 7.9-7 9-4-1.1-7-4.6-7-9V7l7-4z" />
        </svg>
      </div>
      <span class="text-xl font-bold tracking-wide font-display text-white">轻芒 · 兴趣部落</span>
    </router-link>

    <!-- ===== 右上角主题切换 ===== -->
    <button
      class="fixed top-6 right-6 z-50 w-11 h-11 flex items-center justify-center text-zinc-800 dark:text-zinc-100 hover:scale-105 active:scale-95 transition-all duration-200"
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

    <!-- ===== 中央登录卡片（单表单双通道：密码登入 / 验证码登入） ===== -->
    <div class="relative z-10 min-h-screen flex items-center justify-center p-4 sm:p-6">
      <div class="w-full max-w-md glass-card p-6 sm:p-8">
        <LoginFrom class="transition-forment" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useThemeStore } from '@/stores/theme'
import LoginFrom from '@/components/LoginFrom.vue'
import BackgroundImage from '@/components/BackgroundImage.vue'
import { oauthCallback, saveLoginResult } from '@/api/auth'

const route = useRoute()
const router = useRouter()
const theme = useThemeStore()

// OAuth 提供方授权完成后回跳到 /login?code=xxx&state=xxx，在此换取 Token
onMounted(async () => {
  const { code, state } = route.query
  const provider = sessionStorage.getItem('oauth_provider')
  if (provider && code && state) {
    sessionStorage.removeItem('oauth_provider')
    try {
      // axios 拦截器未解包，业务数据在 res.data
      const res = await oauthCallback(provider, code as string, state as string, window.location.origin + '/login')
      const data = res && (res as any).data ? (res as any).data : (res as any)
      if (saveLoginResult(data)) {
        router.replace('/home')
      } else {
        console.error('OAuth 登录失败：响应缺少 accessToken', data)
      }
    } catch (err) {
      console.error('OAuth 回调换取 Token 失败:', err)
    }
  }
})
</script>

<style scoped>
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.transition-forment { animation: fadeIn 0.5s ease-out }
</style>