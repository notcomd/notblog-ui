<template>
  <!-- 频道侧边栏：我的频道列表 + 创建/加入入口（收缩态仅图标） -->
  <div class="shrink-0 flex flex-col glass-card p-3 h-full min-h-0 transition-all duration-300" :class="collapsed ? 'w-16' : 'w-64'">
    <!-- 头部：标题 + 收缩按钮 -->
    <div class="pb-3 flex items-center" :class="collapsed ? 'justify-center px-1' : 'px-2 gap-2'">
      <span v-if="!collapsed" class="flex-1 text-sm font-semibold text-zinc-700 dark:text-zinc-200">我的频道</span>
      <button
        class="w-7 h-7 rounded-[5%] flex items-center justify-center text-zinc-400 hover:bg-white/60 dark:hover:bg-zinc-800/60 transition-colors"
        :title="collapsed ? '展开频道列表' : '收缩频道列表'"
        @click="toggleCollapsed"
      >
        <svg class="w-4 h-4 transition-transform duration-300" :class="collapsed ? 'rotate-180' : ''" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
      </button>
    </div>

    <!-- 列表区 -->
    <div class="flex-1 overflow-y-auto space-y-1 min-h-0">
      <div v-if="loading" class="py-10 text-center text-xs text-zinc-400">加载中...</div>
      <div v-else-if="circles.length === 0" class="py-10 flex flex-col items-center gap-2 text-zinc-400">
        <span class="text-4xl">🏕️</span>
        <p class="text-xs">还没有加入任何频道</p>
      </div>
      <button
        v-for="c in circles"
        :key="c.circleGuid"
        class="w-full flex items-center transition-all text-left"
        :class="[current && String(current.circleGuid) === String(c.circleGuid) ? 'bg-gradient-to-r from-amber-400/15 to-orange-400/10' : 'hover:bg-white/60 dark:hover:bg-zinc-800/60', collapsed ? 'justify-center p-0 rounded-none' : 'gap-2.5 px-2.5 py-2 rounded-[5%]']"
        :title="collapsed ? c.name : undefined"
        @click="$emit('select', c)"
      >
        <img :src="c.avatarUrl || fallback" alt="" class="rounded-[5%] object-cover border border-white/60 dark:border-white/10 shrink-0" :class="collapsed ? 'w-9 h-9' : 'w-10 h-10'" @error="hideImg" />
        <span v-if="!collapsed" class="flex-1 min-w-0">
          <span class="block text-sm font-medium text-zinc-700 dark:text-zinc-200 truncate">{{ c.name }}</span>
          <span class="block text-xs text-zinc-400">{{ c.memberCount || 0 }} 成员</span>
        </span>
        <span v-if="c.isSample" class="shrink-0 text-[10px] leading-none px-1 py-0.5 rounded-[5%] bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400">示例</span>
      </button>
    </div>

    <!-- 底部：创建 / 加入（收缩态竖向排列） -->
    <div class="pt-2 border-t border-zinc-200/60 dark:border-zinc-700/60 flex gap-2" :class="collapsed ? 'flex-col' : ''">
      <button class="flex items-center justify-center rounded-[5%] text-sm font-medium bg-gradient-to-r from-amber-400 to-orange-500 text-white" :class="collapsed ? 'w-full py-2.5' : 'flex-1 gap-1.5 px-2 py-2.5'" title="创建频道" @click="$emit('create')">
        <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 5v14M5 12h14" /></svg>
        <span v-if="!collapsed">创建频道</span>
      </button>
      <button class="flex items-center justify-center rounded-[5%] text-sm font-medium bg-amber-400/15 text-amber-600 dark:text-amber-300" :class="collapsed ? 'w-full py-2.5' : 'flex-1 gap-1.5 px-2 py-2.5'" title="加入频道" @click="$emit('join')">
        <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M19 8v6M22 11h-6" /></svg>
        <span v-if="!collapsed">加入频道</span>
      </button>
    </div>
  </div>
</template>

<script setup>
// 频道侧边栏：我的频道列表（含示例数据徽标）+ 创建/加入入口
// 状态：收缩态本地持久化（notblog-circle-list-collapsed）
import { onMounted, ref } from 'vue'

defineProps({
  circles: { type: Array, default: () => [] },
  current: { type: Object, default: null },
  loading: { type: Boolean, default: false }
})
defineEmits(['select', 'create', 'join'])

const COLLAPSE_KEY = 'notblog-circle-list-collapsed'
const collapsed = ref(false)

onMounted(() => {
  collapsed.value = localStorage.getItem(COLLAPSE_KEY) === '1'
})

function toggleCollapsed() {
  collapsed.value = !collapsed.value
  localStorage.setItem(COLLAPSE_KEY, collapsed.value ? '1' : '0')
}

const fallback = 'data:image/svg+xml;utf8,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" rx="8" fill="#f59e0b"/><text x="40" y="52" font-size="36" text-anchor="middle" fill="#fff" font-family="sans-serif">🏕</text></svg>'
)

function hideImg(e) { e.target.style.visibility = 'hidden' }
</script>
