<template>
  <!-- 发起群组语音/视频房间：选择被邀请成员 + 可选入会密码 -->
  <BaseModal :title="`发起${type === 'Video' ? '视频' : '语音'}房间`" width="w-[360px]" body-class="p-5 flex flex-col gap-4" @close="close">
    <!-- 成员多选（被选者收到来电，未选者仍可自由加入） -->
    <div class="flex flex-col gap-1">
      <label v-for="m in members" :key="m.id" class="flex items-center gap-2.5 py-1.5 px-2 rounded-[5%] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] cursor-pointer text-sm text-zinc-600 dark:text-zinc-300">
        <input type="checkbox" :value="m.id" v-model="selected" class="accent-amber-500 shrink-0" />
        <img :src="m.avatar || demoAvatar(m.name || '友', '#a1a1aa')" alt="" class="w-7 h-7 rounded-[5%] object-cover shrink-0" />
        <span class="flex-1 min-w-0 truncate">{{ m.name }}</span>
        <span class="w-2 h-2 rounded-full shrink-0" :class="m.online ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-600'"></span>
      </label>
    </div>
    <div class="flex items-center justify-between text-xs text-zinc-400">
      <label class="flex items-center gap-1.5 cursor-pointer">
        <input type="checkbox" :checked="allSelected" class="accent-amber-500" @change="toggleAll" /> 全选
      </label>
      <span>已选 {{ selected.length }} / {{ members.length }}</span>
    </div>

    <!-- 入会密码（可选） -->
    <div class="flex flex-col gap-1.5">
      <label class="text-xs text-zinc-400">入会密码（可选，设置后成员需密码才能加入）</label>
      <input v-model="password" type="password" placeholder="不填则为公开房间" aria-label="入会密码"
        class="h-10 rounded-[5%] bg-transparent ring-1 ring-inset ring-zinc-200/70 dark:ring-zinc-800 px-3 text-sm outline-none focus:ring-2 focus:ring-amber-400/50 transition-all" />
    </div>

    <template #footer>
      <div class="flex gap-2 w-full">
        <button class="flex-1 h-10 rounded-[5%] text-sm text-zinc-500 dark:text-zinc-400 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-all" @click="close">取消</button>
        <button class="flex-1 h-10 rounded-[5%] bg-gradient-to-r from-amber-400 to-orange-500 text-white text-sm font-medium disabled:opacity-50 active:scale-95 transition-all"
          :disabled="!selected.length" @click="confirm">开启房间</button>
      </div>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import BaseModal from '@/components/common/BaseModal.vue'
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
