<template>
  <!-- 移动端底部 Tab 导航（<lg 显示，桌面端 md: 隐藏）。固定底部，含 Home 指示条安全区 -->
  <nav class="fixed bottom-0 left-0 right-0 z-50 lg:hidden glass border-t border-zinc-200/70 dark:border-zinc-700/60 mb-safe">
    <div class="flex items-stretch h-14 max-w-lg mx-auto">
      <router-link
        v-for="item in tabItems"
        :key="item.path"
        :to="item.path"
        class="flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors"
        :class="isActive(item.path) ? 'text-amber-600 dark:text-amber-400' : 'text-zinc-500 dark:text-zinc-300'"
      >
        <div class="relative">
          <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path :d="item.icon" />
          </svg>
          <!-- 消息角标：未读数（登录态加载） -->
          <span v-if="item.key === 'chat' && unread > 0" class="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-0.5 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
            {{ unread > 99 ? '99+' : unread }}
          </span>
        </div>
        <span class="text-[11px] leading-none">{{ item.label }}</span>
      </router-link>
    </div>
  </nav>
</template>

<script setup lang="ts">
// ============================================================
// MobileNav 移动端底部 Tab 导航
// 仅在 <lg 视口显示（CSS lg:hidden，桌面端由 SideNav 承担主导航）。
// 提供：广场 / 社区 / 会话 / 我的 四个一级入口 + 未读数角标。
// ============================================================
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { getNotificationUnreadCount } from '@/api/notification'

interface TabItem {
  key: string
  path: string
  label: string
  icon: string
}

const TAB_ITEMS: TabItem[] = [
  {
    key: 'home',
    path: '/home',
    label: '广场',
    icon: 'M3 12l9-9 9 9M5 10v10a1 1 0 0 0 1 1h3m10-11v10a1 1 0 0 1-1 1h-3m-6 0a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1m-6 0h6'
  },
  { key: 'circles', path: '/circles', label: '社区', icon: 'M3.5 21 14 3l10.5 18M3.5 21h17M3.5 21 14 13' },
  { key: 'chat', path: '/chat', label: '会话', icon: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' },
  { key: 'me', path: '/users/me', label: '我的', icon: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z' }
]

const route = useRoute()
const auth = useAuthStore()

// 登录态下「我的」指向真实用户页；未登录时指向登录页
const tabItems = computed<TabItem[]>(() =>
  TAB_ITEMS.map((t) => (t.key === 'me' ? { ...t, path: auth.user?.id ? '/users/' + auth.user.id : '/login' } : t))
)

function isActive(path: string): boolean {
  // 个人空间归入「我的」，其余按前缀匹配（/chat/:id 也属于会话）
  if (path.startsWith('/users/')) return route.path.startsWith('/users/')
  return route.path === path || route.path.startsWith(path + '/') || (path === '/home' && route.path === '/')
}

const unread = ref(0)
function loadUnread(): void {
  if (!auth.isLoggedIn()) return
  getNotificationUnreadCount()
    .then((res) => { unread.value = (res && res.data) || 0 })
    .catch(() => { unread.value = 0 })
}

watch(() => auth.isLoggedIn(), (v) => { v ? loadUnread() : (unread.value = 0) })
onMounted(loadUnread)
onUnmounted(() => undefined)
</script>

<style scoped>
</style>