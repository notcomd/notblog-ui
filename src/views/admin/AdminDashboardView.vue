<template>
  <div class="max-w-[1400px] mx-auto space-y-6">
    <!-- 4列统计（无框：去掉卡片描边，语义色由图标与数值承担，层级靠字号与留白） -->
    <div class="grid grid-cols-2 gap-x-4 gap-y-2 lg:grid-cols-4">
      <div class="group cursor-pointer rounded-[5%] p-5 transition-colors hover:bg-black/[0.03] dark:hover:bg-white/[0.045]" tabindex="0" @click="router.push('/admin/users')" @keydown.enter.prevent="router.push('/admin/users')" @keydown.space.prevent="router.push('/admin/users')">
        <div class="flex items-center justify-between">
          <span class="text-3xl text-amber-500"><svg class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></span>
          <span v-if="stats.newUsersLast30Days !== null" class="text-xs px-2 py-1 rounded-full font-medium bg-emerald-400/15 text-emerald-500">
            近 30 天 +{{ stats.newUsersLast30Days }}
          </span>
        </div>
        <div class="mt-3 font-numeric text-3xl font-bold text-zinc-800 dark:text-zinc-100">{{ statCompact(stats.totalUsers) }}</div>
        <div class="mt-1 flex items-center gap-1.5 text-xs text-zinc-400">
          <span>总注册用户</span>
          <span v-if="stats.totalUsers === null" class="text-amber-600 dark:text-amber-400">· 数据源不可用</span>
        </div>
      </div>

      <div class="group cursor-pointer rounded-[5%] p-5 transition-colors hover:bg-black/[0.03] dark:hover:bg-white/[0.045]" tabindex="0" @click="showOnline = true" @keydown.enter.prevent="showOnline = true" @keydown.space.prevent="showOnline = true">
        <div class="flex items-center justify-between">
          <span class="text-3xl text-emerald-500"><svg class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/></svg></span>
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        </div>
        <div class="mt-3 font-numeric text-3xl font-bold text-emerald-600 dark:text-emerald-400">{{ statText(stats.onlineUsers) }}</div>
        <div class="mt-1 flex items-center gap-1.5 text-xs text-zinc-400">
          <span>当前在线人数</span>
          <span v-if="stats.onlineUsers === null" class="text-amber-600 dark:text-amber-400">· 数据源不可用</span>
        </div>
      </div>

      <div class="group cursor-pointer rounded-[5%] p-5 transition-colors hover:bg-black/[0.03] dark:hover:bg-white/[0.045]" tabindex="0" @click="router.push('/admin/content')" @keydown.enter.prevent="router.push('/admin/content')" @keydown.space.prevent="router.push('/admin/content')">
        <div class="flex items-center justify-between">
          <span class="text-3xl text-amber-500"><svg class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></span>
          <span class="w-2 h-2 rounded-full bg-amber-400"></span>
        </div>
        <div class="mt-3 font-numeric text-3xl font-bold text-amber-600 dark:text-amber-400">{{ statText(stats.pendingTweets) }}</div>
        <div class="mt-1 flex items-center gap-1.5 text-xs text-zinc-400">
          <span>待审核内容（点击处理）</span>
          <span v-if="stats.pendingTweets === null" class="text-amber-600 dark:text-amber-400">· 数据源不可用</span>
        </div>
      </div>

      <div class="group cursor-pointer rounded-[5%] p-5 transition-colors hover:bg-black/[0.03] dark:hover:bg-white/[0.045]" tabindex="0" @click="router.push('/admin/reports')" @keydown.enter.prevent="router.push('/admin/reports')" @keydown.space.prevent="router.push('/admin/reports')">
        <div class="flex items-center justify-between">
          <span class="text-3xl text-red-500"><svg class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg></span>
          <span class="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
        </div>
        <div class="mt-3 font-numeric text-3xl font-bold text-red-500">{{ statText(stats.pendingReports) }}</div>
        <div class="mt-1 flex items-center gap-1.5 text-xs text-zinc-400">
          <span>未处理举报（点击处理）</span>
          <span v-if="stats.pendingReports === null" class="text-amber-600 dark:text-amber-400">· 数据源不可用</span>
        </div>
      </div>
    </div>

    <!-- 快捷操作区 -->
    <div class="pt-4 border-t border-black/[0.06] dark:border-white/[0.08] flex flex-wrap items-center gap-3">
      <span class="text-sm font-medium text-zinc-700 dark:text-zinc-200 shrink-0">快捷操作：</span>
      <button class="px-4 h-10 rounded-[5%] text-sm font-medium bg-gradient-to-r from-amber-400 to-orange-500 text-white hover:opacity-90 active:scale-95 transition-all inline-flex items-center gap-1" @click="router.push('/admin/announcements')"><svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 11l18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg> 发布系统公告</button>
      <button class="px-4 h-10 rounded-[5%] text-sm font-medium bg-transparent ring-1 ring-inset ring-zinc-200/70 dark:ring-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] active:scale-95 transition-colors inline-flex items-center gap-1" @click="exportReport"><svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg> 导出运营日报</button>
    </div>

    <!-- 最近动态列表 -->
    <div class="pt-5 border-t border-black/[0.06] dark:border-white/[0.08]">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-base font-bold text-zinc-800 dark:text-zinc-100">最近动态</h3>
        <button class="text-xs text-amber-600 hover:text-amber-600 transition-colors" @click="toast.push('全部日志开发中', 'info')">查看全部 →</button>
      </div>
      <div class="space-y-2.5">
        <div v-for="log in logs" :key="log.id" class="flex items-center gap-3 px-3 py-2 rounded-[5%] hover:bg-black/[0.03] dark:hover:bg-white/[0.045] transition-colors">
          <span class="text-xs px-2 py-1 rounded-full shrink-0" :class="typeClass(log.type)">{{ log.type }}</span>
          <span class="text-sm text-zinc-600 dark:text-zinc-300 flex-1 truncate">
            <span class="font-medium">{{ log.actor }}</span> 对 <span class="text-amber-600">{{ log.target }}</span> 执行了操作
          </span>
          <span class="text-xs text-zinc-400 shrink-0">{{ relativeTime(log.time) }}</span>
        </div>
        <div v-if="logs.length === 0" class="py-8 text-center text-sm text-zinc-400">暂无动态</div>
      </div>
    </div>

    <!-- 在线用户弹窗：一次快照 + 手动刷新（非轮询，故不标「实时」） -->
    <AdminModal v-if="showOnline" title="在线用户" width="w-[560px]" @close="showOnline = false">
      <!-- 概览条：人数 / 数据源状态 + 刷新 -->
      <div class="flex items-center justify-between gap-3 pb-3.5 border-b border-black/[0.06] dark:border-white/[0.08]">
        <div class="flex items-center gap-2 min-w-0">
          <span class="w-2 h-2 shrink-0 rounded-full" :class="onlineSourceAvailable ? 'bg-emerald-400' : 'bg-zinc-300 dark:bg-zinc-600'"></span>
          <span class="text-sm text-zinc-600 dark:text-zinc-300 truncate">
            <template v-if="onlineSourceAvailable">当前在线 <span class="font-semibold text-zinc-800 dark:text-zinc-100">{{ onlineUsers.length }}</span> 人</template>
            <template v-else>实时在线数据源未接入</template>
          </span>
        </div>
        <button
          class="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-[5%] px-2.5 text-xs text-zinc-500 transition-colors hover:bg-black/[0.04] hover:text-zinc-700 disabled:opacity-50 dark:text-zinc-400 dark:hover:bg-white/[0.06] dark:hover:text-zinc-200"
          :disabled="onlineLoading"
          @click="loadOnlineUsers"
        >
          <svg class="w-3.5 h-3.5" :class="onlineLoading ? 'animate-spin' : ''" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a9 9 0 1 1-2.64-6.36"/><polyline points="21 3 21 9 15 9"/></svg>
          {{ onlineLoading ? '刷新中' : '刷新' }}
        </button>
      </div>

      <!-- 数据源不可用：必须与「无人在线」区分，否则等于向管理员汇报了错误结论 -->
      <div v-if="!onlineSourceAvailable" class="py-9 text-center">
        <svg class="mx-auto mb-3 w-10 h-10 text-amber-500/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        <p class="text-sm font-medium text-zinc-700 dark:text-zinc-200">在线名单读取失败</p>
        <p class="mx-auto mt-1.5 max-w-[23rem] text-xs leading-relaxed text-zinc-400">未能从后端读取在线状态（服务不可用或权限不足），这里不代表「无人在线」。</p>
      </div>

      <!-- 已接入但当前无人 -->
      <div v-else-if="onlineUsers.length === 0" class="py-9 text-center">
        <svg class="mx-auto mb-3 w-10 h-10 text-zinc-300 dark:text-zinc-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        <p class="text-sm text-zinc-500 dark:text-zinc-400">当前无人在线</p>
      </div>

      <!-- 在线名单：无框行 + 发丝分隔（与内容管理列表同一套语言） -->
      <div v-else class="divide-y divide-black/[0.06] dark:divide-white/[0.08]">
        <div v-for="u in onlineUsers" :key="u.userGuid" class="flex items-center gap-3 py-3">
          <span class="w-2.5 h-2.5 shrink-0 rounded-full bg-emerald-400 ring-2 ring-emerald-400/20"></span>
          <img v-if="u.avatarUrl" :src="u.avatarUrl" alt="" class="w-8 h-8 shrink-0 rounded-full object-cover ring-1 ring-black/10 dark:ring-white/10" @error="hideImg" />
          <div class="min-w-0 flex-1">
            <div class="truncate text-sm font-medium text-zinc-700 dark:text-zinc-200">{{ u.nickName || '未设置昵称' }}</div>
            <div class="mt-0.5 truncate font-mono text-[11px] text-zinc-400">{{ u.userGuid }}</div>
          </div>
        </div>
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

/** null = 数据源不可用（不冒充 0） */
type StatValue = number | null
const stats = ref<{ totalUsers: StatValue; newUsersLast30Days: StatValue; onlineUsers: StatValue; pendingTweets: StatValue; pendingReports: StatValue }>({
  totalUsers: null,
  newUsersLast30Days: null,
  onlineUsers: null,
  pendingTweets: null,
  pendingReports: null
})
const logs = ref<any[]>([])
const onlineUsers = ref<any[]>([])
const onlineSourceAvailable = ref(true)
const onlineLoading = ref(false)
const showOnline = ref(false)

/** 统计值展示：数据源不可用时显示「—」 */
function statText(v: StatValue): string {
  return v === null ? '—' : String(v)
}

function statCompact(v: StatValue): string {
  return v === null ? '—' : compactNumber(v)
}

function hideImg(e: Event): void {
  (e.target as HTMLElement).style.visibility = 'hidden'
}

/**
 * 拉取实时在线名单（Message GET /api/audit/online-users）。
 * 失败时只标记「数据源不可用」；绝不把空数组当成「当前无人在线」展示给管理员。
 */
async function loadOnlineUsers(): Promise<void> {
  onlineLoading.value = true
  try {
    const od: any = await getAdminOnlineUsers()
    onlineSourceAvailable.value = od?.available !== false
    onlineUsers.value = Array.isArray(od) ? od : (od?.items || od?.list || [])
  } catch {
    onlineSourceAvailable.value = false
    onlineUsers.value = []
  } finally {
    onlineLoading.value = false
  }
}

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
  // 两个数据源互不阻塞：统计失败时保留 null（显示「—」），日志失败降级为空列表
  stats.value = { ...stats.value, ...(await getAdminStats()) }
  logs.value = await getAdminActivityLog().catch(() => [])
  void loadOnlineUsers()
})
</script>
