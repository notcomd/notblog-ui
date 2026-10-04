<template>
  <div class="min-h-screen">
    <!-- 顶栏 -->
    <header class="fixed top-0 left-0 right-0 z-50 glass border-b border-white/40 dark:border-white/10">
      <div class="h-16 px-5 flex items-center gap-4">
        <router-link to="/admin" class="flex items-center gap-2 shrink-0">
          <div class="w-9 h-9 rounded-[5%] overflow-hidden bg-white border border-zinc-200/70 dark:border-white/10 flex items-center justify-center">
            <img src="@/assets/monohub-logo.jpg" alt="MonoHub" class="w-full h-full object-cover" />
          </div>
          <div class="leading-tight">
            <div class="text-base font-bold text-zinc-800 dark:text-zinc-100">MonoHub · 管理后台</div>
            <div class="text-[10px] text-zinc-400">运营版</div>
          </div>
        </router-link>

        <!-- 中部：全局管理搜索 -->
        <div class="flex-1 max-w-md mx-auto">
          <div class="relative">
            <svg class="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
            <input v-model="keyword" name="adminSearch" autocomplete="off" aria-label="全局搜索" class="w-full h-10 pl-11 pr-4 rounded-[5%] bg-white/60 dark:bg-zinc-800/60 border border-white/50 dark:border-white/10 text-sm outline-none focus:ring-2 focus:ring-amber-400/50 transition-all" placeholder="搜索用户ID、内容标题、社区名称..." @keyup.enter="onSearch" />
          </div>
        </div>

        <div class="flex items-center gap-3 shrink-0">
          <!-- 系统通知铃铛 -->
          <button class="relative w-10 h-10 rounded-[5%] flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:bg-white/60 dark:hover:bg-zinc-800/60 transition-colors" title="系统通知" aria-label="系统通知" type="button" @click="toast.push('通知功能开发中', 'info')">
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></svg>
            <span class="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">{{ pendingCount }}</span>
          </button>
          <!-- 主题切换 -->
          <button class="w-10 h-10 rounded-[5%] flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:bg-white/60 dark:hover:bg-zinc-800/60 transition-colors" title="切换主题" aria-label="切换主题" type="button" @click="theme.toggle()">
            <svg v-if="theme.isDark" class="w-5 h-5 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
            <svg v-else class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>
          </button>
          <!-- 管理员菜单 -->
          <div class="relative group">
            <button class="flex items-center gap-2 pl-1 pr-3 py-1 rounded-[5%] hover:bg-white/60 dark:hover:bg-zinc-800/60 transition-colors" aria-label="管理员菜单" aria-haspopup="menu">
              <img :src="adminAvatar" alt="" class="w-9 h-9 rounded-full object-cover border-2 border-white/60 dark:border-white/10" />
              <span class="text-sm font-medium text-zinc-700 dark:text-zinc-200">{{ auth.user?.name || '管理员' }}</span>
            </button>
            <div class="absolute right-0 top-full mt-2 w-44 qm-surface p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <button class="w-full flex items-center gap-2 px-3 py-2 rounded-[5%] text-sm text-zinc-700 dark:text-zinc-200 hover:bg-amber-100 dark:hover:bg-zinc-800 transition-colors" @click="toast.push('个人中心开发中', 'info')">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                个人中心
              </button>
              <button class="w-full flex items-center gap-2 px-3 py-2 rounded-[5%] text-sm text-zinc-700 dark:text-zinc-200 hover:bg-amber-100 dark:hover:bg-zinc-800 transition-colors" @click="toast.push('操作日志开发中', 'info')">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" /></svg>
                操作日志
              </button>
              <div class="h-px bg-zinc-200 dark:bg-zinc-700 my-1"></div>
              <router-link to="/home" class="flex items-center gap-2 px-3 py-2 rounded-[5%] text-sm text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-zinc-800 transition-colors">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12l9-9 9 9M5 10v10a1 1 0 0 0 1 1h3v-6h6v6h3a1 1 0 0 0 1-1V10" /></svg>
                返回用户端
              </router-link>
              <button class="w-full flex items-center gap-2 px-3 py-2 rounded-[5%] text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors" @click="onLogout">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></svg>
                退出登录
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- 左栏 + 主内容（桌面化：侧栏常显，无移动横条） -->
    <div class="flex pt-16">
      <!-- 侧边栏：常驻显示 -->
      <aside class="flex sticky top-16 h-[calc(100vh-4rem)] flex-col items-center py-5 gap-2 shrink-0 transition-all duration-300 border-r border-zinc-200/50 dark:border-zinc-800/50 bg-white/95 dark:bg-zinc-900/95"
        :class="collapsed ? 'w-[72px]' : 'w-[210px]'">
        <nav class="flex flex-col items-center gap-1.5 w-full px-3">
          <router-link
            v-for="item in navItems"
            :key="item.path"
            :to="item.path"
            class="flex items-center gap-3 rounded-[5%] transition-all duration-200 relative group w-full"
            :class="[collapsed ? 'w-11 h-11 justify-center mx-auto' : 'px-3 h-11', isActive(item.path) ? 'bg-gradient-to-r from-amber-400/15 to-orange-500/10 text-amber-600 dark:text-amber-400 font-medium ' : 'text-zinc-600 dark:text-zinc-300 hover:bg-white/60 dark:hover:bg-zinc-800/60 hover:translate-x-0.5']"
            :aria-current="isActive(item.path) ? 'page' : undefined"
          >
            <span class="shrink-0" v-html="item.icon"></span>
            <span v-if="!collapsed" class="text-sm">{{ item.label }}</span>
            <span v-else class="absolute left-full ml-3 px-2 py-1 rounded-[5%] bg-zinc-800 text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">{{ item.label }}</span>
            <!-- 公报高亮 -->
            <span v-if="item.badge && !collapsed" class="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-amber-400/20 text-amber-600 dark:text-amber-400">{{ item.badge }}</span>
          </router-link>
        </nav>
        <div class="mt-auto w-full px-3">
          <button class="rounded-[5%] flex items-center justify-center gap-2 text-zinc-500 dark:text-zinc-400 hover:bg-white/60 dark:hover:bg-zinc-800/60 transition-all" :class="collapsed ? 'w-10 h-10 mx-auto' : 'w-full h-10'" type="button" :aria-expanded="!collapsed" @click="collapsed = !collapsed">
            <svg class="w-5 h-5 transition-transform duration-300" :class="collapsed ? 'rotate-180' : ''" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 17l-5-5 5-5M18 17l-5-5 5-5" /></svg>
            <span v-if="!collapsed" class="text-xs">收缩侧边栏</span>
          </button>
        </div>
      </aside>

      <!-- 主内容 -->
      <main class="relative flex-1 min-w-0 px-6 py-6 overflow-y-auto h-[calc(100vh-4rem)]">
        <router-view v-slot="{ Component }">
          <!-- 页面过渡：与用户端内容区同一套规格（不用 mode="out-in"，详见 input.css） -->
          <Transition
            enter-active-class="qm-page-enter-active"
            enter-from-class="qm-page-enter-from"
            leave-active-class="qm-page-leave-active"
            leave-to-class="qm-page-leave-to"
          >
            <component :is="Component" />
          </Transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useThemeStore } from '@/stores/theme'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import { getAdminStats } from '@/api/admin'
import { getMyMenus } from '@/api/menu'
import { DEFAULT_ADMIN_NAV, resolveMenuIcon, type AdminNavItem } from '@/components/admin/menuIcons'

const route = useRoute()
const router = useRouter()
const theme = useThemeStore()
const auth = useAuthStore()
const toast = useToastStore()

const collapsed = ref(false)
const keyword = ref('')
const pendingCount = ref(0)

// 侧栏导航由后端菜单接口驱动（当前用户可见 + 启用）；接口失败/为空时回退内置默认项
const navItems = ref<AdminNavItem[]>(DEFAULT_ADMIN_NAV)

// 菜单树 → 侧栏项：仅取有路由的节点（目录仅作分组，其子项按序展开）
function mapMenus(nodes: any[], out: AdminNavItem[] = []): AdminNavItem[] {
  for (const n of nodes) {
    if (n.url) {
      out.push({
        path: n.url,
        label: n.menuName,
        icon: resolveMenuIcon(n.icon),
        badge: n.url === '/admin/announcements' ? 'NEW' : undefined
      })
    }
    if (n.children && n.children.length) mapMenus(n.children, out)
  }
  return out
}

async function loadMenus(): Promise<void> {
  try {
    const res = await getMyMenus()
    const data: any = res && res.data ? res.data : res
    const mapped = Array.isArray(data) ? mapMenus(data) : []
    if (mapped.length) navItems.value = mapped
  } catch (e) {
    // 保留 DEFAULT_ADMIN_NAV 兜底，侧栏不为空
  }
}

const adminAvatar = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="50" fill="#3b82f6"/><text x="50" y="62" font-size="40" text-anchor="middle" fill="white">管</text></svg>')

function isActive(path: string): boolean {
  if (path === '/admin') return route.path === '/admin'
  return route.path.startsWith(path)
}

function onSearch(): void {
  if (!keyword.value.trim()) return
  toast.push(`全站检索「${keyword.value.trim()}」开发中`, 'info')
}

function onLogout(): void {
  auth.logout()
  router.push('/login')
}

onMounted(async () => {
  await loadMenus()
  try {
    const res = await getAdminStats()
    const data = res && res.data ? res.data : res
    pendingCount.value = (data && (data.pendingTweets || 0)) + (data && (data.pendingReports || 0))
  } catch (e) { /* 忽略 */ }
})
</script>
