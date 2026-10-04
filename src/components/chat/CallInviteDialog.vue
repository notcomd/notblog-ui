<template>
  <!-- 发起群组语音/视频房间：选择被邀请成员 + 可选入会密码 -->
  <div class="fixed inset-0 z-[75] flex items-center justify-center bg-zinc-950/70" @click.self="close">
    <div class="w-[360px] max-h-[80vh] qm-surface p-5 flex flex-col gap-4">
      <div class="flex items-center justify-between shrink-0">
        <h3 class="text-base font-semibold text-zinc-800 dark:text-zinc-100">发起{{ type === 'Video' ? '视频' : '语音' }}房间</h3>
        <button class="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:bg-white/60 dark:hover:bg-zinc-800/60" aria-label="关闭" @click="close">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      <!-- 成员多选（被选者收到来电，未选者仍可自由加入） -->
      <div class="flex-1 min-h-0 overflow-y-auto space-y-1 pr-1 overscroll-contain">
        <label v-for="m in members" :key="m.id" class="flex items-center gap-2.5 py-1.5 px-2 rounded-lg hover:bg-white/60 dark:hover:bg-zinc-800/60 cursor-pointer text-sm text-zinc-600 dark:text-zinc-300">
          <input type="checkbox" :value="m.id" v-model="selected" class="accent-amber-500 shrink-0" />
          <img :src="m.avatar || demoAvatar(m.name || '友', '#a1a1aa')" alt="" class="w-7 h-7 rounded-[10px] object-cover shrink-0" />
          <span class="flex-1 min-w-0 truncate">{{ m.name }}</span>
          <span class="w-2 h-2 rounded-full shrink-0" :class="m.online ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-600'"></span>
        </label>
      </div>
      <div class="flex items-center justify-between text-xs text-zinc-400 shrink-0">
        <label class="flex items-center gap-1.5 cursor-pointer">
          <input type="checkbox" :checked="allSelected" class="accent-amber-500" @change="toggleAll" /> 全选
        </label>
        <span>已选 {{ selected.length }} / {{ members.length }}</span>
      </div>

      <!-- 入会密码（可选） -->
      <div class="flex flex-col gap-1.5 shrink-0">
        <label class="text-xs text-zinc-400">入会密码（可选，设置后成员需密码才能加入）</label>
        <input v-model="password" type="password" placeholder="不填则为公开房间"
          class="h-10 rounded-[10px] bg-white/70 dark:bg-zinc-800/70 border border-white/60 dark:border-white/10 px-3 text-sm outline-none" />
      </div>

      <div class="flex gap-2 shrink-0">
        <button class="flex-1 h-10 rounded-[10px] bg-white/60 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-300 text-sm" @click="close">取消</button>
        <button class="flex-1 h-10 rounded-[10px] bg-gradient-to-r from-amber-400 to-orange-500 text-white text-sm font-medium disabled:opacity-50"
          :disabled="!selected.length" @click="confirm">开启房间</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCallStore } from '@/stores/call'
import { charAvatar as demoAvatar } from '@/utils/avatar'

const props = defineProps<{
  sessionId: string
  type: 'Audio' | 'Video'
  members: { id: string; name: string; avatar?: string; online?: boolean }[]
}>()
const emit = defineEmits<{ (e: 'close'): void }>()

const call = useCallStore()
const selected = ref<string[]>(props.members.map((m) => m.id))
const password = ref('')
const allSelected = computed(() => props.members.length > 0 && selected.value.length === props.members.length)

function toggleAll(e: Event) {
  const checked = (e.target as HTMLInputElement).checked
  selected.value = checked ? props.members.map((m) => m.id) : []
}

function confirm() {
  if (!selected.value.length) return
  call.startCall(props.sessionId, props.type, {
    memberIds: selected.value,
    password: password.value.trim() || undefined
  })
  close()
}

function close() {
  emit('close')
}
</script>
