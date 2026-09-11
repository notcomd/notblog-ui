<template>
  <div
    class="relative min-h-screen overflow-hidden"
    @mousemove="onMouseMove"
    @mouseleave="cursorVisible = false"
  >
    <!-- 背景壁纸（fixed inset-0 z-0，内容层 z-10 保证不被盖住） -->
    <BackgroundImage />

    <!-- 可读性遮罩：暗色主题加深 -->
    <div
      class="absolute inset-0 z-[5] transition-colors duration-300"
      :class="theme.isDark ? 'bg-black/45' : 'bg-black/15'"
    ></div>

    <!-- ===== 左上角 Logo（与 SideNav 品牌一致） ===== -->
    <router-link
      to="/home"
      class="fixed top-6 left-6 z-50 flex items-center gap-2.5 group"
      title="MonoHub"
    >
      <div
        class="w-10 h-10 rounded-lg overflow-hidden bg-white border border-white/40 shadow-md"
      >
        <img src="@/assets/monohub-logo.jpg" alt="MonoHub" class="w-full h-full object-cover" />
      </div>
      <span class="text-xl font-bold tracking-wide font-display text-white drop-shadow">MonoHub</span>
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

    <!-- ===== 中央登入卡片（三屏动画：欢迎 → 登入表单 → 登录成功） ===== -->
    <div class="relative z-10 min-h-screen flex items-center justify-center p-6">
      <LoginFrom class="transition-forment" @success="finishLogin" />
    </div>

    <!-- ===== 自定义光标（桌面精细指针；跟随鼠标的柔和圆环） ===== -->
    <div
      v-show="cursorVisible"
      class="custom-cursor"
      :style="{ transform: `translate3d(${cursor.x}px, ${cursor.y}px, 0)` }"
      aria-hidden="true"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useThemeStore } from '@/stores/theme'
import LoginFrom from '@/components/LoginFrom.vue'
import BackgroundImage from '@/components/BackgroundImage.vue'
import { oauthCallback, saveLoginResult } from '@/api/auth'
import type { TokenResult } from '@/types'

const route = useRoute()
const router = useRouter()
const theme = useThemeStore()

// ==================== 登录收尾（表单登录 / OAuth 回调共用） ====================
// 凭证落盘后按 ?redirect 回跳原页面（由 main.ts 会话失效装配写入），无则回首页
const finishLogin = (payload: TokenResult): void => {
  if (!saveLoginResult(payload)) {
    console.error('登录失败：响应缺少 accessToken', payload)
    return
  }
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

// ==================== 自定义光标 ====================
const cursor = reactive({ x: -100, y: -100 })
const cursorVisible = ref(false)
// 仅精细指针（鼠标/触控板）启用，触摸屏与「减弱动态」偏好下不显示
const cursorEnabled = ref(false)

onMounted(() => {
  if (window.matchMedia('(pointer: fine)').matches
    && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    cursorEnabled.value = true
  }
})

const onMouseMove = (event: MouseEvent): void => {
  if (!cursorEnabled.value) return
  cursor.x = event.clientX
  cursor.y = event.clientY
  if (!cursorVisible.value) cursorVisible.value = true
}
</script>

<style scoped>
/* 卡片入场：轻微上浮淡入 */
@keyframes cardIn {
  from {
    opacity: 0;
    transform: translateY(18px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

.transition-forment {
  animation: cardIn 0.6s cubic-bezier(0.22, 1, 0.36, 1) both;
}

/* 自定义光标：柔和圆环，跟随鼠标（translate3d 由内联样式驱动，性能更好） */
.custom-cursor {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 60;
  width: 30px;
  height: 30px;
  margin: -15px 0 0 -15px;
  border: 1px solid hsla(0, 0%, 100%, 0.7);
  border-radius: 50%;
  background: hsla(0, 0%, 80%, 0.2);
  pointer-events: none;
  will-change: transform;
}

@media (pointer: coarse) {
  .custom-cursor {
    display: none;
  }
}
</style>
