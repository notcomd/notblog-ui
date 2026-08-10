<template>
  <header class="fixed top-0 left-0 right-0 z-50 glass border-b border-white/40 dark:border-white/10 transition-all duration-300" :class="blurred ? 'opacity-60 saturate-50 pointer-events-none' : ''">
    <div class="h-16 px-5 flex items-center gap-4">
      <!-- 左侧 Logo -->
      <router-link to="/home" class="flex items-center gap-2 shrink-0">
        <div class="w-9 h-9 rounded-[5%] bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
          <svg class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 3l7 4v5c0 4.4-3 7.9-7 9-4-1.1-7-4.6-7-9V7l7-4z" />
          </svg>
        </div>
        <span class="text-lg font-bold tracking-wide text-zinc-800 dark:text-zinc-100">轻芒 · 兴趣部落</span>
      </router-link>

      <!-- 中部：全局搜索 -->
      <div class="flex-1 max-w-md mx-auto">
        <div class="relative group">
          <svg class="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" />
          </svg>
          <input
            v-model="keyword"
            class="w-full h-10 pl-11 pr-4 rounded-[5%] bg-white/60 dark:bg-zinc-800/60 border border-white/50 dark:border-white/10 text-sm outline-none focus:ring-2 focus:ring-amber-400/50 transition-all"
            placeholder="搜兴趣、找好友、看热门..."
            @keyup.enter="onSearch"
          />
        </div>
      </div>

      <!-- 右侧 -->
      <div class="flex items-center gap-3 shrink-0">
        <!-- 消息铃铛（点击下拉通知面板） -->
        <div class="relative">
          <button class="w-10 h-10 rounded-[5%] flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:bg-white/60 dark:hover:bg-zinc-800/60 transition-colors" title="消息" @click.stop="onBellClick">
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.7 21a2 2 0 0 1-3.4 0" />
            </svg>
            <span v-if="unread > 0" class="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
              {{ unread > 99 ? '99+' : unread }}
            </span>
          </button>
          <!-- 通知下拉面板 -->
          <transition
            enter-active-class="transition-all duration-200 ease-linear"
            leave-active-class="transition-all duration-200 ease-linear"
            enter-from-class="opacity-0 -translate-y-1"
            leave-to-class="opacity-0 -translate-y-1"
          >
            <NotificationPanel
              v-if="notifOpen"
              @read-all="unread = 0"
              @unread-changed="delta => { unread = Math.max(0, unread + delta) }"
            />
          </transition>
        </div>

        <!-- 皮肤设置：调色板图标 → 皮肤面板（颜色皮肤 + 背景设置） -->
        <button class="w-10 h-10 rounded-[5%] flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:bg-white/60 dark:hover:bg-zinc-800/60 transition-colors" title="皮肤设置" @click="skinOpen = true">
          <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.93 0 1.65-.75 1.65-1.69 0-.44-.18-.84-.44-1.13-.29-.29-.44-.65-.44-1.12 0-.92.75-1.66 1.67-1.66h2c3.05 0 5.56-2.5 5.56-5.55C21.96 6.01 17.46 2 12 2z" />
            <circle cx="6.5" cy="12" r="0.7" fill="currentColor" stroke="none" />
            <circle cx="9.2" cy="7.6" r="0.7" fill="currentColor" stroke="none" />
            <circle cx="15" cy="7.6" r="0.7" fill="currentColor" stroke="none" />
          </svg>
        </button>

        <!-- 未登录：登录按钮 -->
        <template v-if="!auth.isLoggedIn()">
          <button class="px-4 h-9 rounded-[5%] text-sm font-medium bg-gradient-to-r from-amber-400 to-orange-500 text-white hover: active:scale-95 transition-all" @click="router.push('/login')">登录</button>
        </template>

        <!-- 已登录：用户头像（点击展开下拉：用户数据 + 菜单） -->
        <div v-else class="relative">
          <button
            class="flex items-center pl-1 pr-1.5 py-1 rounded-[5%] hover:bg-white/60 dark:hover:bg-zinc-800/60 transition-colors"
            title="用户菜单"
            @click.stop="userMenuOpen = !userMenuOpen"
          >
            <img
              :src="auth.user && auth.user.avatar ? auth.user.avatar : avatarFallback"
              alt="avatar"
              class="w-9 h-9 rounded-full object-cover border-2 border-white/60 dark:border-white/10"
            />
          </button>

          <!-- 下拉菜单（点击外部关闭） -->
          <transition
            enter-active-class="transition-all duration-200 ease-linear"
            leave-active-class="transition-all duration-200 ease-linear"
            enter-from-class="opacity-0 -translate-y-1"
            leave-to-class="opacity-0 -translate-y-1"
          >
            <div v-if="userMenuOpen" class="absolute right-0 top-full mt-2 w-60 p-2 z-50 rounded-[5%] bg-white dark:bg-zinc-800/95 border border-zinc-200/70 dark:border-zinc-700/60">
              <!-- 用户数据区：用户名 + 等级 + 经验 + 硬币 -->
              <div class="px-3 pt-2 pb-3">
                <div class="flex items-center gap-3">
                  <img
                    :src="auth.user && auth.user.avatar ? auth.user.avatar : avatarFallback"
                    alt="avatar"
                    class="w-10 h-10 rounded-full object-cover border-2 border-white/60 dark:border-white/10"
                  />
                  <div class="min-w-0">
                    <div class="text-sm font-medium text-zinc-800 dark:text-zinc-100 truncate">{{ auth.user ? (auth.user.name || '用户') : '未登录' }}</div>
                    <div class="mt-0.5 flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                      <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.9 6.26L21.5 9.3l-4.75 4.4 1.13 6.8L12 17.3l-5.88 3.2 1.13-6.8L2.5 9.3l6.6-1.04L12 2z" /></svg>
                      Lv.{{ userInfo ? userInfo.level : 1 }}
                    </div>
                  </div>
                </div>

                <!-- 经验进度条：当前等级经验 / 升级所需（满级显示已满级） -->
                <div class="mt-3">
                  <div class="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 mb-1">
                    <span>经验</span>
                    <span v-if="isMaxLevel">已满级 · 累计 {{ userInfo ? userInfo.experience : 0 }} 经验</span>
                    <span v-else>{{ userInfo ? userInfo.experience : 0 }} / {{ levelThreshold }}</span>
                  </div>
                  <div class="h-1.5 rounded-full bg-zinc-200/70 dark:bg-zinc-700/60 overflow-hidden">
                    <div class="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-300" :style="{ width: expPercent + '%' }"></div>
                  </div>
                </div>

                <!-- 硬币 -->
                <div class="mt-2.5 flex items-center gap-1.5 text-sm text-zinc-700 dark:text-zinc-200">
                  <svg class="w-4 h-4 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v10M9.5 9.5c.5-.7 1.4-1 2.5-1s2 .3 2.5 1c.6.8.2 1.8-1.2 2.3-1.8.6-2.4 1.5-1.8 2.4.5.8 1.5 1.1 2.5 1s2-.4 2.5-1.2" /></svg>
                  <span class="font-medium">{{ userInfo ? userInfo.coins : 0 }}</span>
                  <span class="text-xs text-zinc-400">硬币</span>
                </div>
              </div>

              <div class="h-px bg-zinc-200/70 dark:bg-zinc-700/60 my-1"></div>

              <router-link :to="auth.user ? '/users/' + auth.user.id : '/login'" class="flex items-center gap-2 px-3 py-2 rounded-[5%] text-sm text-zinc-700 dark:text-zinc-200 hover:bg-amber-50 dark:hover:bg-zinc-800 transition-colors">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                个人主页
              </router-link>
              <router-link to="/admin" class="flex items-center gap-2 px-3 py-2 rounded-[5%] text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-zinc-800 transition-colors">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>
                管理后台
              </router-link>
              <div class="h-px bg-zinc-200 dark:bg-zinc-700 my-1"></div>
              <button @click="onLogout" class="w-full flex items-center gap-2 px-3 py-2 rounded-[5%] text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5M21 12H9" /></svg>
                退出登录
              </button>
            </div>
          </transition>
        </div>
      </div>
    </div>

    <!-- 皮肤面板（Teleport 到 body，脱离 header 的 backdrop-filter 包含块） -->
    <SkinPanel v-if="skinOpen" @close="skinOpen = false" />
  </header>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

defineProps({
  blurred: { type: Boolean, default: false }
})
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import SkinPanel from '@/components/common/SkinPanel.vue'
import NotificationPanel from '@/components/common/NotificationPanel.vue'
import { getMyUserInfo } from '@/api/userinfo'
import { getNotificationUnreadCount } from '@/api/notification'
import { SAMPLE_NOTIFICATIONS } from '@/utils/notifications'

const auth = useAuthStore()
const skinOpen = ref(false)
const toast = useToastStore()
const router = useRouter()

const keyword = ref('')
const unread = ref(0) // 通知未读数（GET /api/notifications/unread-count）
const notifOpen = ref(false) // 通知下拉面板
const avatarFallback = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="50" fill="#fbbf24"/><text x="50" y="62" font-size="40" text-anchor="middle" fill="white">芒</text></svg>')

// ==================== 用户下拉菜单（点击展开/关闭） ====================
const userMenuOpen = ref(false)
// 用户数据：等级 / 经验 / 硬币（GET /api/user-info/me；未创建资料时后端返回默认 1 级 / 0 币）
const userInfo = ref(null)

const MAX_LEVEL = 9 // 与后端 UserInfo.MaxLevel 一致

// 升级所需经验：后端 LevelUpThreshold(level) = 500 × 5 × level = 2500 × level
const levelThreshold = computed(() => (userInfo.value ? 2500 * userInfo.value.level : 2500))
const isMaxLevel = computed(() => !!userInfo.value && userInfo.value.level >= MAX_LEVEL)
const expPercent = computed(() => {
  if (!userInfo.value) return 0
  if (isMaxLevel.value) return 100
  const t = 2500 * userInfo.value.level
  return t > 0 ? Math.min(100, Math.round((userInfo.value.experience / t) * 100)) : 0
})

async function loadUserInfo() {
  if (!auth.isLoggedIn()) {
    userInfo.value = null
    return
  }
  try {
    const res = await getMyUserInfo()
    userInfo.value = (res && res.data) || null
  } catch (e) {
    // 接口失败不阻塞界面，下拉显示默认值（Lv.1 / 0 币）
    userInfo.value = null
  }
}

function onDocClick() {
  userMenuOpen.value = false
  notifOpen.value = false
}

watch(userMenuOpen, open => {
  if (open) {
    notifOpen.value = false
    document.addEventListener('click', onDocClick)
  } else {
    document.removeEventListener('click', onDocClick)
  }
})

// 通知面板开合：与用户下拉互斥 + 点击外部关闭
watch(notifOpen, open => {
  if (open) {
    userMenuOpen.value = false
    document.addEventListener('click', onDocClick)
  } else {
    document.removeEventListener('click', onDocClick)
  }
})

// 登录状态变化时重新拉取/清空用户数据
watch(() => auth.isLoggedIn(), logged => {
  if (logged) {
    loadUserInfo()
    loadUnread()
  } else {
    userInfo.value = null
    userMenuOpen.value = false
    notifOpen.value = false
    unread.value = 0
  }
})

onMounted(() => {
  loadUserInfo()
  loadUnread()
})
onUnmounted(() => document.removeEventListener('click', onDocClick))

async function loadUnread() {
  if (!auth.isLoggedIn()) {
    unread.value = 0
    return
  }
  try {
    const res = await getNotificationUnreadCount()
    unread.value = (res && res.data) || 0
  } catch (e) {
    // 后端离线 → 示例未读数（仅用于展示）
    unread.value = SAMPLE_NOTIFICATIONS.filter(n => !n.isRead).length
  }
}

function onBellClick() {
  if (!auth.isLoggedIn()) {
    toast.push('请先登录后查看消息', 'info')
    router.push('/login')
    return
  }
  notifOpen.value = !notifOpen.value
}

function onSearch() {
  if (!keyword.value.trim()) return
  toast.push(`搜索「${keyword.value.trim()}」功能开发中`, 'info')
}

function onLogout() {
  auth.logout()
  userMenuOpen.value = false
  toast.push('已退出登录', 'success')
  router.push('/login')
}
</script>

<style scoped>
</style>
