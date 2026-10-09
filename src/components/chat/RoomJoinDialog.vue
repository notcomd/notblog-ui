<template>
  <!-- 群组进行中的房间列表：成员可自由加入（需密码房间先输密码） -->
  <BaseModal title="进行中的房间" width="w-[380px]" body-class="p-5 flex flex-col gap-4" @close="close">
    <div v-if="!rooms.length" class="py-8 text-center text-sm text-zinc-400">当前没有进行中的房间</div>
    <div v-else class="flex flex-col gap-2">
      <div v-for="r in rooms" :key="r.callId" class="flex items-center gap-3 p-3 rounded-[5%] bg-black/[0.03] dark:bg-white/[0.04]">
        <span class="w-9 h-9 rounded-full flex items-center justify-center text-white text-lg shrink-0"
          :class="r.type === 'Video' ? 'bg-amber-500' : 'bg-emerald-500'">
          {{ r.type === 'Video' ? '📹' : '🎤' }}
        </span>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-zinc-800 dark:text-zinc-100 truncate">
            {{ r.type === 'Video' ? '视频' : '语音' }}房{{ r.requiresPassword ? ' · 密码保护' : '' }}
          </p>
          <p class="text-xs text-zinc-400">{{ (r.joinedMembers || []).length }} 人在线</p>
        </div>
        <div class="flex flex-col items-end gap-1.5 shrink-0">
          <input
            v-if="pendingPwd === r.callId"
            v-model="pwdInput"
            type="password"
            placeholder="入会密码"
            aria-label="入会密码"
            class="w-32 h-8 rounded-[5%] bg-transparent ring-1 ring-inset ring-zinc-200/70 dark:ring-zinc-800 px-2 text-xs outline-none focus:ring-2 focus:ring-amber-400/50 transition-all"
            @keyup.enter="join(r)"
          />
          <button class="h-8 px-3 rounded-[5%] bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-medium active:scale-95 transition-all"
            @click="join(r)">
            {{ r.requiresPassword && pendingPwd !== r.callId ? '输密码' : '加入' }}
          </button>
        </div>
      </div>
    </div>

    <template #footer>
      <button class="w-full h-9 rounded-[5%] text-sm text-zinc-500 dark:text-zinc-400 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors" @click="refresh">刷新</button>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import BaseModal from '@/components/common/BaseModal.vue'
import { useCallStore, type CallPayload } from '@/stores/call'

const props = defineProps<{
  sessionId: string
  rooms: CallPayload[]
}>()
const emit = defineEmits<{ (e: 'close'): void; (e: 'refresh'): void }>()

const call = useCallStore()
const pendingPwd = ref('')
const pwdInput = ref('')

async function join(r: CallPayload) {
  if (r.requiresPassword && pendingPwd.value !== r.callId) {
    // 第一步：展开密码输入
    pendingPwd.value = r.callId
    pwdInput.value = ''
    return
  }
  const pwd = r.requiresPassword ? pwdInput.value || undefined : undefined
  await call.joinCall(r.callId, pwd)
  pendingPwd.value = ''
  pwdInput.value = ''
  close()
}

function refresh() {
  emit('refresh')
}

function close() {
  emit('close')
}
</script>
