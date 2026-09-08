<template>
  <div class="max-w-[1400px] mx-auto space-y-6">
    <!-- 4列统计卡片 -->
    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
      <div class="glass-card p-5 bg-gradient-to-br from-amber-400/10 to-orange-500/5 hover: transition-all cursor-pointer" tabindex="0" @click="router.push('/admin/users')" @keydown.enter.prevent="router.push('/admin/users')" @keydown.space.prevent="router.push('/admin/users')">
        <div class="flex items-center justify-between">
          <span class="text-3xl text-amber-500"><svg class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></span>
          <span class="text-xs px-2 py-1 rounded-full font-medium" :class="stats.userGrowth >= 0 ? 'bg-emerald-400/15 text-emerald-500' : 'bg-red-400/15 text-red-500'">
            {{ stats.userGrowth >= 0 ? '▲' : '▼' }} {{ Math.abs(stats.userGrowth) }}%
          </span>
        </div>
        <div class="text-2xl font-bold text-zinc-800 dark:text-zinc-100 mt-3">{{ compactNumber(stats.totalUsers) }}</div>
        <div class="text-xs text-zinc-400 mt-1">总注册用户</div>
      </div>

      <div class="glass-card p-5 bg-gradient-to-br from-emerald-500/10 to-teal-500/5 hover: transition-all cursor-pointer" tabindex="0" @click="showOnline = true" @keydown.enter.prevent="showOnline = true" @keydown.space.prevent="showOnline = true">
        <div class="flex items-center justify-between">
          <span class="text-3xl text-emerald-500"><svg class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/></svg></span>
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        </div>
        <div class="text-2xl font-bold text-zinc-800 dark:text-zinc-100 mt-3">{{ stats.onlineUsers }}</div>
        <div class="text-xs text-zinc-400 mt-1">当前在线人数（实时）</div>
      </div>

      <div class="glass-card p-5 bg-gradient-to-br from-amber-400/10 to-orange-400/5 hover: transition-all cursor-pointer" tabindex="0" @click="router.push('/admin/content')" @keydown.enter.prevent="router.push('/admin/content')" @keydown.space.prevent="router.push('/admin/content')">
        <div class="flex items-center justify-between">
          <span class="text-3xl text-amber-500"><svg class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></span>
          <span class="w-2 h-2 rounded-full bg-amber-400"></span>
        </div>
        <div class="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-3">{{ stats.pendingTweets }}</div>
        <div class="text-xs text-zinc-400 mt-1">待审核内容（点击处理）</div>
      </div>

      <div class="glass-card p-5 bg-gradient-to-br from-red-500/10 to-rose-500/5 hover: transition-all cursor-pointer" tabindex="0" @click="router.push('/admin/reports')" @keydown.enter.prevent="router.push('/admin/reports')" @keydown.space.prevent="router.push('/admin/reports')">
        <div class="flex items-center justify-between">
          <span class="text-3xl text-red-500"><svg class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg></span>
          <span class="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
        </div>
        <div class="text-2xl font-bold text-red-500 mt-3">{{ stats.pendingReports }}</div>
        <div class="text-xs text-zinc-400 mt-1">未处理举报（点击处理）</div>
      </div>
    </div>

    <!-- 快捷操作区 -->
    <div class="glass-card p-4 flex flex-wrap items-center gap-3">
      <span class="text-sm font-medium text-zinc-700 dark:text-zinc-200 shrink-0">快捷操作：</span>
      <button class="px-4 h-10 rounded-[5%] text-sm font-medium bg-gradient-to-r from-amber-400 to-orange-500 text-white hover: active:scale-95 transition-all inline-flex items-center gap-1" @click="router.push('/admin/announcements')"><svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 11l18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg> 发布系统公告</button>
      <button class="px-4 h-10 rounded-[5%] text-sm font-medium bg-white/60 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-300 hover: active:scale-95 transition-all inline-flex items-center gap-1" @click="exportReport"><svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg> 导出运营日报</button>
    </div>

    <!-- 最近动态列表 -->
    <div class="glass-card p-5">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-base font-bold text-zinc-800 dark:text-zinc-100">最近动态</h3>
        <button class="text-xs text-amber-600 hover:text-amber-600 transition-colors" @click="toast.push('全部日志开发中', 'info')">查看全部 →</button>
      </div>
      <div class="space-y-2.5">
        <div v-for="log in logs" :key="log.id" class="flex items-center gap-3 px-3 py-2 rounded-[5%] hover:bg-white/50 dark:hover:bg-zinc-800/40 transition-colors">
          <span class="text-xs px-2 py-1 rounded-full shrink-0" :class="typeClass(log.type)">{{ log.type }}</span>
          <span class="text-sm text-zinc-600 dark:text-zinc-300 flex-1 truncate">
            <span class="font-medium">{{ log.actor }}</span> 对 <span class="text-amber-600">{{ log.target }}</span> 执行了操作
          </span>
          <span class="text-xs text-zinc-400 shrink-0">{{ relativeTime(log.time) }}</span>
        </div>
        <div v-if="logs.length === 0" class="py-8 text-center text-sm text-zinc-400">暂无动态</div>
      </div>
    </div>

    <!-- 在线用户弹窗 -->
    <AdminModal v-if="showOnline" title="在线用户（实时）" width="w-[560px]" @close="showOnline = false">
      <div class="space-y-2">
        <div v-for="u in onlineUsers" :key="u.userGuid" class="flex items-center gap-3 px-3 py-2.5 rounded-[5%] bg-white/50 dark:bg-zinc-800/50">
          <span class="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
          <span class="text-sm font-medium text-zinc-700 dark:text-zinc-200 flex-1">{{ u.userName }}</span>
          <span class="text-xs text-zinc-400">{{ u.page }}</span>
          <span class="text-[10px] text-zinc-400">{{ relativeTime(u.lastActive) }}活跃</span>
        </div>
        <div v-if="onlineUsers.length === 0" class="py-6 text-center text-sm text-zinc-400">暂无在线用户</div>
      </div>
    </AdminModal>
  </div>
</template>

<script lang="ts">
export default { name: 'AdminDashboardView' }
</script>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AdminModal from '@/components/admin/AdminModal.vue'
import { getAdminStats, getAdminActivityLog, getAdminOnlineUsers } from '@/api/admin'
import { useToastStore } from '@/stores/toast'
import { compactNumber, relativeTime } from '@/utils/format'

const router = useRouter()
const toast = useToastStore()

const stats = ref<{ totalUsers: number; userGrowth: number; onlineUsers: number; pendingTweets: number; pendingReports: number }>({ totalUsers: 0, userGrowth: 0, onlineUsers: 0, pendingTweets: 0, pendingReports: 0 })
const logs = ref<any[]>([])
const onlineUsers = ref<any[]>([])
const showOnline = ref(false)

function typeClass(t: string): string {
  const map: Record<string, string> = {
    '用户注册': 'bg-emerald-400/15 text-emerald-500',
    '内容发布': 'bg-blue-400/15 text-amber-600',
    '举报提交': 'bg-red-400/15 text-red-500',
    '审核通过': 'bg-emerald-400/15 text-emerald-500',
    '审核驳回': 'bg-amber-400/15 text-amber-600',
    '用户封禁': 'bg-red-400/15 text-red-500',
    '公报发送': 'bg-indigo-400/15 text-amber-600'
  }
  return map[t] || 'bg-zinc-400/15 text-zinc-500 dark:text-zinc-400'
}

function exportReport(): void {
  toast.push('导出运营日报开发中', 'info')
}

onMounted(async () => {
  const [s, l, o] = await Promise.all([getAdminStats(), getAdminActivityLog(), getAdminOnlineUsers()])
  const sd: any = s && s.data ? s.data : s
  const ld: any = l && l.data ? l.data : l
  const od: any = o && o.data ? o.data : o
  if (sd) stats.value = { ...stats.value, ...sd }
  logs.value = Array.isArray(ld) ? ld : (ld.items || ld.list || [])
  onlineUsers.value = Array.isArray(od) ? od : (od.items || od.list || [])
})
</script>
