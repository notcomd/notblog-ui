<template>
  <aside
    class="sticky top-0 h-screen flex flex-col items-center py-6 gap-3 shrink-0 bg-white dark:bg-zinc-900 border-r border-zinc-200/60 dark:border-zinc-800/60 transition-[width,opacity] duration-[250ms] ease"
    :class="[collapsed ? 'w-[72px]' : 'w-[220px]', blurred ? 'opacity-60 saturate-50' : '']"
  >
    <!-- 顶部 Logo（pl-6 让图标与导航项图标对齐 x=24；文字展开从左向右显示、收缩从右向左擦除） -->
    <router-link
      to="/home"
      class="flex items-center gap-2 rounded-[5%] shrink-0 mb-1 w-full pl-6 pr-3"
    >
      <svg class="w-7 h-7 shrink-0 text-amber-500 dark:text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M12 3l7 4v5c0 4.4-3 7.9-7 9-4-1.1-7-4.6-7-9V7l7-4z" />
      </svg>
      <span class="wipe-text text-lg font-bold tracking-wide text-zinc-800 dark:text-zinc-100 whitespace-nowrap" :class="{ 'wipe-hidden': collapsed }">轻芒 · 兴趣部落</span>
    </router-link>

    <!-- 搜索功能：展开态为输入框，收缩态为图标入口（点击展开并聚焦） -->
    <div class="w-full px-3">
      <div v-if="!collapsed" class="relative">
        <svg class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" />
        </svg>
        <input
          ref="searchInput"
          v-model="keyword"
          name="navSearch"
          autocomplete="off"
          aria-label="搜索兴趣、好友、热门"
          class="w-full h-10 pl-10 pr-3 rounded-[5%] bg-white/60 dark:bg-zinc-800/60 border border-white/50 dark:border-white/10 text-sm outline-none focus:ring-2 focus:ring-amber-400/50 transition-all"
          placeholder="搜兴趣、找好友、看热门..."
          @keyup.enter="onSearch"
        />
      </div>
      <button
        v-else
        class="w-11 h-11 rounded-[5%] flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:bg-white/60 dark:hover:bg-zinc-800/60 transition-colors"
        title="搜索"
        aria-label="搜索"
        type="button"
        @click="expandAndFocus"
      >
        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" />
        </svg>
      </button>
    </div>

    <nav class="flex flex-col items-center gap-2 w-full px-3">
      <!-- 主导航 -->
      <router-link
        v-for="item in navItems"
        :key="item.to.path + (item.to.query ? item.to.query.tab : '')"
        :to="item.to"
        class="flex items-center gap-3 rounded-[5%] transition-all duration-200 relative group w-full px-3 h-11"
        :class="[isActive(item) ? 'bg-gradient-to-r from-amber-400/15 to-orange-400/10 text-amber-600 dark:text-amber-400 font-medium ' : 'text-zinc-600 dark:text-zinc-300 hover:bg-white/60 dark:hover:bg-zinc-800/60 hover:translate-x-0.5']"
        :aria-current="isActive(item) ? 'page' : undefined"
      >
        <svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path :d="item.icon" />
        </svg>
        <!-- 收缩时悬停文字提示 -->
        <span v-if="collapsed" class="absolute left-full ml-3 px-2 py-1 rounded-[5%] bg-zinc-800 text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">{{ item.label }}</span>
        <span class="wipe-text text-sm" :class="{ 'wipe-hidden': collapsed }">{{ item.label }}</span>
      </router-link>

      <!-- 发布按钮（与其他功能选项统一样式：透明底 + 图标文字 + hover 背景 + 收缩 tooltip） -->
      <button
        class="mt-3 w-full px-3 h-11 flex items-center gap-3 rounded-[5%] transition-all duration-200 relative group text-zinc-600 dark:text-zinc-300 hover:bg-white/60 dark:hover:bg-zinc-800/60 hover:translate-x-0.5"
        type="button"
        @click="onPublish"
      >
        <svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
        <span v-if="collapsed" class="absolute left-full ml-3 px-2 py-1 rounded-[5%] bg-zinc-800 text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">发布</span>
        <span class="wipe-text text-sm" :class="{ 'wipe-hidden': collapsed }">发布</span>
      </button>
    </nav>

    <!-- 底部收缩控制（与其他功能选项统一样式：w-full px-3 h-11 + hover 背景 + wipe 文字） -->
    <div class="mt-auto w-full px-3">
      <button
        class="w-full px-3 h-11 flex items-center gap-3 rounded-[5%] transition-all duration-200 text-zinc-500 dark:text-zinc-400 hover:bg-white/60 dark:hover:bg-zinc-800/60"
        type="button"
        :title="collapsed ? '展开侧边栏' : '收缩侧边栏'"
        :aria-expanded="!collapsed"
        @click="collapsed = !collapsed"
      >
        <svg class="w-5 h-5 shrink-0 transition-transform duration-300" :class="collapsed ? 'rotate-180' : ''" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M11 17l-5-5 5-5M18 17l-5-5 5-5" />
        </svg>
        <span class="wipe-text text-xs" :class="{ 'wipe-hidden': collapsed }">收缩侧边栏</span>
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed, ref, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { MAIN_NAV_ITEMS, buildSpaceNavItems } from '@/layout/navItems'

withDefaults(defineProps<{ blurred?: boolean }>(), { blurred: false })

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

// 个人主页：SideNav 导航项切换为空间工具栏（作品/收藏/我的仓库/安全），与主页面公用同一布局
const isUserSpace = computed(() => route.path.startsWith('/users/'))

const isSelf = computed(() => !!auth.user && String(auth.user.id) === String((route.params.id as string) || ''))

const spaceNavItems = computed(() => buildSpaceNavItems((route.params.id as string) || '', isSelf.value))

const navItems = computed(() => (isUserSpace.value ? spaceNavItems.value : MAIN_NAV_ITEMS))

function isActive(item: any) {
  if (isUserSpace.value) {
    const tab = item.to.query.tab
    return (route.query.tab || 'home') === tab
  }
  return route.path === item.to.path || route.path.startsWith(item.to.path + '/')
}

const collapsed = ref(false)

// ==================== 搜索功能（展开态输入框 / 收缩态图标入口） ====================
const keyword = ref('')
const searchInput = ref<HTMLElement | null>(null)

function onSearch(): void {
  const kw = keyword.value.trim()
  if (!kw) return
  router.push({ path: '/search', query: { q: kw } })
}

// 收缩态点击搜索图标：先展开功能栏，再聚焦输入框
async function expandAndFocus(): Promise<void> {
  collapsed.value = false
  await nextTick()
  searchInput.value && searchInput.value.focus()
}

function onPublish(): void {
  // 发布入口 → 工作台（四个类型选择 + 未发布作品管理）
  router.push('/workspace')
}
</script>

<style scoped>
/* 文字擦除效果：展开时 max-width 0→200px（从左向右显示），收缩时 200px→0（从右向左擦除）。
   与功能栏宽度动画同步（0.25s ease）。收缩态宽度为 0 不占位 → 图标不被 flex 压缩、文字不溢出 */
.wipe-text {
  overflow: hidden;
  white-space: nowrap;
  max-width: 200px;
  transition: max-width 0.25s ease;
}
.wipe-hidden {
  max-width: 0;
}
</style>
