<template>
  <!-- 频道公告 tab：展示/编辑（保存于本机，后端暂无公告字段） -->
  <div class="mt-4">
    <div class="glass-card p-6">
      <div class="flex items-center justify-between mb-4">
        <span class="text-sm font-semibold text-zinc-700 dark:text-zinc-200">📢 频道公告</span>
        <div v-if="canManage && !announceEdit" class="flex items-center gap-2">
          <button class="h-8 px-3 rounded-[5%] text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-colors" @click="startEdit">✏️ 编辑公告</button>
        </div>
        <div v-else-if="canManage && announceEdit" class="flex items-center gap-2">
          <button class="h-8 px-3 rounded-[5%] text-xs text-zinc-500 dark:text-zinc-300 hover:bg-white/60 dark:hover:bg-zinc-800/60 transition-colors" @click="announceEdit = false">取消</button>
          <button class="h-8 px-3 rounded-[5%] text-xs font-medium bg-gradient-to-r from-amber-400 to-orange-500 text-white hover:brightness-110 active:scale-95 transition-all" @click="save">保存公告</button>
        </div>
      </div>
      <textarea v-if="announceEdit" v-model="announceDraft" rows="8" class="w-full rounded-[5%] bg-white/60 dark:bg-zinc-800/60 border border-white/50 dark:border-white/10 text-sm text-zinc-700 dark:text-zinc-200 outline-none focus:ring-2 focus:ring-amber-400/50 transition-all p-3" placeholder="输入频道公告..."></textarea>
      <div v-else class="space-y-2 text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
        <p v-for="(line, i) in (currentAnnounce || '').split('\n')" :key="i" :class="line.trim() === '' ? 'h-2' : ''">{{ line }}</p>
        <p v-if="!currentAnnounce" class="text-zinc-400">暂无公告</p>
      </div>
      <p class="mt-4 text-[10px] text-zinc-400">公告保存于本机（后端暂不支持公告字段）</p>
    </div>
  </div>
</template>

<script setup>
// 频道公告：Owner/Admin 可编辑，localStorage 持久化（notblog-circle-announce-{guid}）
import { computed, ref, watch } from 'vue'
import { useToastStore } from '@/stores/toast'

const props = defineProps({
  current: { type: Object, default: null },
  canManage: { type: Boolean, default: false }
})

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
