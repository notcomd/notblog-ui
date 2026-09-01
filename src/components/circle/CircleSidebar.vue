<template>
  <!-- 社区侧边栏：我的社区列表 + 创建/加入入口（固定展开态，收缩功能已取消） -->
  <div class="w-full lg:w-64 lg:h-full lg:shrink-0 flex flex-col glass-card p-3 min-h-0">
    <!-- 头部：标题 -->
    <div class="pb-3 flex items-center px-2 gap-2">
      <span class="flex-1 text-sm font-semibold text-zinc-700 dark:text-zinc-200">我的社区</span>
    </div>

    <!-- 列表区 -->
    <div class="flex-1 overflow-y-auto overscroll-contain space-y-1 min-h-0">
      <div v-if="loading" class="py-10 text-center text-xs text-zinc-400">加载中…</div>
      <div v-else-if="circles.length === 0" class="py-10 flex flex-col items-center gap-2 text-zinc-400">
        <span class="text-4xl"><svg aria-hidden="true" class="w-14 h-14 mx-auto text-zinc-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 21l8.5-17 8.5 17"/><path d="M7 21l5-10 5 10"/><line x1="2" y1="21" x2="22" y2="21"/></svg></span>
        <p class="text-xs">还没有加入任何社区</p>
      </div>
      <button
        v-for="c in circles"
        :key="c.circleGuid"
        class="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-[5%] text-left transition-colors"
        :class="current && String(current.circleGuid) === String(c.circleGuid) ? 'bg-gradient-to-r from-amber-400/15 to-orange-400/10' : 'hover:bg-white/60 dark:hover:bg-zinc-800/60'"
        @click="$emit('select', c)"
      >
        <img :src="c.avatarUrl || fallback" alt="" class="w-10 h-10 rounded-[5%] object-cover border border-white/60 dark:border-white/10 shrink-0" @error="hideImg" />
        <span class="flex-1 min-w-0">
          <span class="block text-sm font-medium text-zinc-700 dark:text-zinc-200 truncate">{{ c.name }}</span>
          <span class="block text-xs text-zinc-400">{{ c.memberCount || 0 }} 成员</span>
        </span>
      </button>
    </div>

    <!-- 底部：创建 / 加入 -->
    <div class="pt-2 border-t border-zinc-200/60 dark:border-zinc-700/60 flex gap-2">
      <button class="flex items-center justify-center flex-1 gap-1.5 px-2 py-2.5 rounded-[5%] text-sm font-medium bg-gradient-to-r from-amber-400 to-orange-500 text-white" title="创建社区" @click="$emit('create')">
        <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 5v14M5 12h14" /></svg>
        <span>创建社区</span>
      </button>
      <button class="flex items-center justify-center flex-1 gap-1.5 px-2 py-2.5 rounded-[5%] text-sm font-medium bg-amber-400/15 text-amber-600 dark:text-amber-300" title="加入社区" @click="$emit('join')">
        <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M19 8v6M22 11h-6" /></svg>
        <span>加入社区</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
// 社区侧边栏：我的社区列表 + 创建/加入入口（固定展开态）
interface CircleItem {
  circleGuid?: string
  name?: string
  avatarUrl?: string
  memberCount?: number
}

defineProps<{
  circles?: CircleItem[]
  current?: CircleItem | null
  loading?: boolean
}>()
defineEmits<{
  select: [c: CircleItem]
  create: []
  join: []
}>()

const fallback = 'data:image/svg+xml;utf8,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" rx="8" fill="#f59e0b"/><path d="M14 50 L40 24 L66 50 Z" fill="#fff"/><path d="M40 50v-16" stroke="#f59e0b" stroke-width="4"/></svg>'
)

function hideImg(e: Event) { (e.target as HTMLElement).style.visibility = 'hidden' }
</script>
