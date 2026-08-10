<template>
  <aside
    class="sticky top-16 h-[calc(100vh-4rem)] flex flex-col items-center py-5 gap-2 shrink-0 transition-[width,opacity] duration-[250ms] ease"
    :class="[collapsed ? 'w-[72px]' : 'w-[220px]', blurred ? 'opacity-60 saturate-50' : '']"
  >
    <nav class="flex flex-col items-center gap-1.5 w-full px-3">
      <!-- 主导航 -->
      <router-link
        v-for="item in navItems"
        :key="item.to.path + (item.to.query ? item.to.query.tab : '')"
        :to="item.to"
        class="flex items-center gap-3 rounded-[5%] transition-all duration-200 relative group"
        :class="[ collapsed ? 'w-11 h-11 justify-center' : 'w-full px-3 h-11', isActive(item) ? 'bg-gradient-to-r from-amber-400/15 to-orange-400/10 text-amber-600 dark:text-amber-400 font-medium ' : 'text-zinc-600 dark:text-zinc-300 hover:bg-white/60 dark:hover:bg-zinc-800/60 hover:translate-x-0.5' ]"
      >
        <svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path :d="item.icon" />
        </svg>
        <!-- 收缩时悬停文字提示 -->
        <span v-if="collapsed" class="absolute left-full ml-3 px-2 py-1 rounded-[5%] bg-zinc-800 text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">{{ item.label }}</span>
        <transition name="nav-label">
          <span v-if="!collapsed" class="text-sm">{{ item.label }}</span>
        </transition>
      </router-link>

      <!-- 发布按钮（收缩后变 FAB） -->
      <button
        class="mt-2 w-11 h-11 rounded-[5%] bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center hover: hover: hover:-translate-y-0.5 active:scale-95 transition-all"
        :class="collapsed ? '' : 'self-start ml-2'"
        :title="collapsed ? '发布' : ''"
        @click="onPublish"
      >
        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 5v14M5 12h14" /></svg>
      </button>
    </nav>

    <!-- 底部收缩控制 -->
    <div class="mt-auto w-full px-3">
      <button
        class="rounded-[5%] flex items-center justify-center gap-2 text-zinc-500 dark:text-zinc-400 hover:bg-white/60 dark:hover:bg-zinc-800/60 transition-all"
        :class="collapsed ? 'w-10 h-10 mx-auto' : 'w-full h-10'"
        :title="collapsed ? '展开侧边栏' : '收缩侧边栏'"
        @click="collapsed = !collapsed"
      >
        <svg class="w-5 h-5 transition-transform duration-300" :class="collapsed ? 'rotate-180' : ''" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M11 17l-5-5 5-5M18 17l-5-5 5-5" />
        </svg>
        <span v-if="!collapsed" class="text-xs">收缩侧边栏</span>
      </button>
    </div>
  </aside>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

defineProps({
  blurred: { type: Boolean, default: false }
})

const route = useRoute()
const router = useRouter()

// 个人主页：SideNav 导航项切换为空间工具栏（作品/收藏/我的仓库/安全），与主页面公用同一布局
const isUserSpace = computed(() => route.path.startsWith('/users/'))

const mainNavItems = [
  { to: { path: '/home' }, label: '主页', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 0 0 1 1h3m10-11l2 2m-2-2v10a1 1 0 0 1-1 1h-3m-6 0a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1m-6 0h6' },
  { to: { path: '/circles' }, label: '频道', icon: 'M3 21v-4m0 0V5a2 2 0 0 1 2-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 0 0-2 2zm9-13.5V9m0 4.5V19' },
  { to: { path: '/chat' }, label: '会话', icon: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' },
  { to: { path: '/explore' }, label: '探索', icon: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zm0-7a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm7-2h2m-2-6l-1.4 1.4M5 5l1.4 1.4M3 12h2' }
]

const spaceNavItems = computed(() => {
  const id = route.params.id || ''
  const tabItems = [
    { key: 'works', label: '作品', icon: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z' },
    { key: 'favorites', label: '收藏', icon: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' },
    { key: 'files', label: '我的仓库', icon: 'M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z' },
    { key: 'security', label: '安全', icon: 'M12 17v2M7 11V7a5 5 0 0 1 10 0v4M5 11h14a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1z' }
  ]
  return tabItems.map(t => ({ to: { path: `/users/${id}`, query: { tab: t.key } }, label: t.label, icon: t.icon }))
})

const navItems = computed(() => (isUserSpace.value ? spaceNavItems.value : mainNavItems))

function isActive(item) {
  if (isUserSpace.value) {
    const tab = item.to.query.tab
    return (route.query.tab || 'works') === tab
  }
  return route.path === item.to.path || route.path.startsWith(item.to.path + '/')
}

const collapsed = ref(false)

function onPublish() {
  // 发布入口 → 工作台（四个类型选择 + 未发布作品管理）
  router.push('/workspace')
}
</script>

<style scoped>
/* 导航文字消失效果：收缩时向左滑出淡出（与侧栏收回方向一致），展开时从左滑入淡入；
   与宽度动画同步（0.25s），开始即开始、结束即结束，展开时微延迟 50ms 让宽度先动 */
.nav-label-enter-active {
  transition: opacity 0.25s ease 0.05s, transform 0.25s ease 0.05s;
}
.nav-label-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.nav-label-enter-from,
.nav-label-leave-to {
  opacity: 0;
  transform: translateX(-16px);
}
</style>
