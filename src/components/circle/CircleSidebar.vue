<template>
  <!-- 社区侧边栏：扁平栏（与左侧功能栏同构：无卡片化，仅右侧分隔线），与右侧内容区同高对齐 -->
  <div class="w-64 h-full shrink-0 flex flex-col p-3 border-r border-zinc-200/60 dark:border-zinc-800/60 min-h-0">
    <!-- 栏目标题：无框下用「标签 + 发丝线」建立结构，替代卡片边界 -->
    <div class="px-2 pb-2.5 mb-1 border-b border-zinc-200/60 dark:border-zinc-800/60 shrink-0">
      <span class="text-[11px] font-medium text-zinc-400 dark:text-zinc-500">我的社区</span>
      <span v-if="circles.length" class="ml-1.5 text-[11px] text-zinc-400 dark:text-zinc-500 font-numeric">{{ circles.length }}</span>
    </div>

    <!-- 列表区 -->
    <div class="flex-1 overflow-y-auto overscroll-contain space-y-0.5 min-h-0">
      <div v-if="loading" class="py-10 text-center text-xs text-zinc-400">加载中…</div>
      <div v-else-if="circles.length === 0" class="py-10 flex flex-col items-center gap-2 text-zinc-400">
        <svg aria-hidden="true" class="w-12 h-12 text-zinc-300 dark:text-zinc-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 21l8.5-17 8.5 17"/><path d="M7 21l5-10 5 10"/><line x1="2" y1="21" x2="22" y2="21"/></svg>
        <p class="text-xs">还没有加入任何社区</p>
      </div>
      <button
        v-for="c in circles"
        :key="c.circleGuid"
        class="group relative w-full flex items-center gap-2.5 p-2 rounded-[5%] text-left transition-colors"
        :class="isActive(c) ? 'bg-amber-400/10' : 'hover:bg-black/[0.03] dark:hover:bg-white/[0.045]'"
        :aria-current="isActive(c) ? 'true' : undefined"
        @click="$emit('select', c)"
      >
        <!-- 选中态：左侧琥珀光条 -->
        <span v-if="isActive(c)" class="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-7 rounded-full bg-gradient-to-b from-amber-400 to-orange-500"></span>
        <img :src="c.avatarUrl || fallback" alt="" class="w-10 h-10 rounded-[5%] object-cover bg-zinc-100 dark:bg-zinc-800 shrink-0" @error="hideImg" />
        <span class="flex-1 min-w-0">
          <span class="block text-sm font-medium truncate" :class="isActive(c) ? 'text-amber-700 dark:text-amber-300' : 'text-zinc-700 dark:text-zinc-200'">{{ c.name }}</span>
          <span class="block text-xs text-zinc-400">{{ c.memberCount || 0 }} 成员</span>
        </span>
      </button>
    </div>

    <!-- 底部：创建 / 加入 -->
    <div class="pt-3 mt-2 border-t border-zinc-200/60 dark:border-zinc-800/60 flex gap-2 shrink-0">
      <button class="flex items-center justify-center flex-1 gap-1.5 px-2 py-2.5 rounded-[5%] text-sm font-medium bg-gradient-to-r from-amber-400 to-orange-500 text-white hover:opacity-90 active:scale-95 transition-all" title="创建社区" @click="$emit('create')">
        <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
        <span>创建社区</span>
      </button>
      <button class="flex items-center justify-center flex-1 gap-1.5 px-2 py-2.5 rounded-[5%] text-sm font-medium bg-amber-400/15 text-amber-600 dark:text-amber-300 hover:bg-amber-400/25 transition-colors" title="加入社区" @click="$emit('join')">
        <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M19 8v6M22 11h-6" /></svg>
        <span>加入社区</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
// 社区侧边栏：我的社区列表（无框行 + 选中琥珀光条）+ 创建/加入入口
interface CircleItem {
  circleGuid?: string
  name?: string
  avatarUrl?: string
  memberCount?: number
}

const props = defineProps<{
  circles?: CircleItem[]
  current?: CircleItem | null
  loading?: boolean
}>()
defineEmits<{
  select: [c: CircleItem]
  create: []
  join: []
}>()

/** 判断某个社区是否为当前选中项（Guid 统一转字符串比较） */
function isActive(c: CircleItem): boolean {
  return !!props.current && String(props.current.circleGuid) === String(c.circleGuid)
}

const fallback = 'data:image/svg+xml;utf8,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" rx="8" fill="#f59e0b"/><path d="M14 50 L40 24 L66 50 Z" fill="#fff"/><path d="M40 50v-16" stroke="#f59e0b" stroke-width="4"/></svg>'
)

function hideImg(e: Event) { (e.target as HTMLElement).style.visibility = 'hidden' }
</script>
