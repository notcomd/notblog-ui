<template>
  <!-- 社区公告 tab：只读展示（公告字段由圈子信息提供，后端暂未提供圈子公告编辑能力） -->
  <div class="mt-4">
    <div class="glass-card p-6">
      <div class="flex items-center justify-between mb-4">
        <span class="text-sm font-semibold text-zinc-700 dark:text-zinc-200 inline-flex items-center gap-1.5"><svg class="w-4 h-4 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg>社区公告</span>
      </div>
      <div class="space-y-2 text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
        <p v-for="(line, i) in (announcement || '').split('\n')" :key="i" :class="line.trim() === '' ? 'h-2' : ''">{{ line }}</p>
        <p v-if="!announcement" class="text-zinc-400">暂无公告</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 社区公告：只读展示圈子公告（读取圈子信息字段；后端暂无圈子公告编辑端点）
import { computed } from 'vue'

interface CircleData {
  circleGuid?: string
  announcement?: string
  description?: string
}

const props = defineProps<{
  current: CircleData | null
  canManage?: boolean
}>()

const announcement = computed(() => props.current?.announcement || '')
</script>