<template>
  <!-- 社区公告 tab：展示/编辑（保存于本机，后端暂无公告字段） -->
  <div>
    <!-- 面板头：标签 + 操作，发丝线收口（无框结构，替代原卡片边界） -->
    <div class="flex items-center justify-between gap-3 pb-3 mb-4 border-b border-zinc-200/60 dark:border-zinc-800/60">
      <span class="text-sm font-semibold text-zinc-700 dark:text-zinc-200 inline-flex items-center gap-1.5">
        <svg aria-hidden="true" class="w-4 h-4 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg>社区公告
      </span>
      <div v-if="canManage && !announceEdit">
        <button class="h-8 px-3 rounded-[5%] text-xs text-amber-600 dark:text-amber-400 bg-amber-400/15 hover:bg-amber-400/25 transition-colors inline-flex items-center gap-1" @click="startEdit"><svg aria-hidden="true" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> 编辑公告</button>
      </div>
      <div v-else-if="canManage && announceEdit" class="flex items-center gap-2">
        <button class="h-8 px-3 rounded-[5%] text-xs text-zinc-500 dark:text-zinc-300 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors" @click="announceEdit = false">取消</button>
        <button class="h-8 px-3 rounded-[5%] text-xs font-medium bg-gradient-to-r from-amber-400 to-orange-500 text-white hover:opacity-90 active:scale-95 transition-all" @click="save">保存公告</button>
      </div>
    </div>

    <textarea v-if="announceEdit" v-model="announceDraft" rows="10" name="announceDraft" aria-label="社区公告内容" class="w-full rounded-[5%] border border-zinc-200/70 dark:border-zinc-800 bg-transparent p-3.5 text-sm leading-relaxed text-zinc-700 dark:text-zinc-200 outline-none focus:ring-2 focus:ring-amber-400/40 transition-all" placeholder="输入社区公告…"></textarea>
    <div v-else class="max-w-[70ch] space-y-1.5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
      <p v-for="(line, i) in (currentAnnounce || '').split('\n')" :key="i" :class="line.trim() === '' ? 'h-2' : ''">{{ line }}</p>
      <p v-if="!currentAnnounce" class="text-zinc-400">暂无公告</p>
    </div>
    <p class="mt-5 text-[11px] text-zinc-400">公告保存于本机（后端暂不支持公告字段）</p>
  </div>
</template>

<script setup lang="ts">
// 社区公告：Owner/Admin 可编辑，localStorage 持久化（notblog-circle-announce-{guid}）
import { computed, ref, watch } from 'vue'
import { useToastStore } from '@/stores/toast'

interface CircleData {
  circleGuid?: string
  announcement?: string
}

const props = defineProps<{
  current: CircleData | null
  canManage?: boolean
}>()

const toast = useToastStore()
const announceEdit = ref(false)
const announceDraft = ref('')

const currentAnnounce = computed(() => {
  const c = props.current
  if (!c) return ''
  if (c.announcement) return c.announcement
  try {
    return localStorage.getItem('notblog-circle-announce-' + c.circleGuid) || ''
  } catch (e) {
    return ''
  }
})

watch(() => props.current?.circleGuid, () => {
  announceEdit.value = false
})

function startEdit() {
  announceDraft.value = currentAnnounce.value
  announceEdit.value = true
}

function save() {
  if (!props.current) return
  try {
    localStorage.setItem('notblog-circle-announce-' + props.current.circleGuid, announceDraft.value)
    announceEdit.value = false
    toast.push('公告已保存（本机）', 'success')
  } catch (e) {
    toast.push('保存失败', 'error')
  }
}
</script>
