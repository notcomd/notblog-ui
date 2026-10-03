<template>
  <!-- 群组进行中的房间列表：成员可自由加入（需密码房间先输密码） -->
  <div class="fixed inset-0 z-[75] flex items-center justify-center bg-zinc-950/70" @click.self="close">
    <div class="w-[380px] glass-card p-5 flex flex-col gap-4">
      <div class="flex items-center justify-between shrink-0">
        <h3 class="text-base font-semibold text-zinc-800 dark:text-zinc-100">进行中的房间</h3>
        <button class="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:bg-white/60 dark:hover:bg-zinc-800/60" aria-label="关闭" @click="close">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      <div v-if="!rooms.length" class="py-8 text-center text-sm text-zinc-400">当前没有进行中的房间</div>
      <div v-else class="flex flex-col gap-2 max-h-[50vh] overflow-y-auto overscroll-contain">
        <div v-for="r in rooms" :key="r.callId" class="flex items-center gap-3 p-3 rounded-xl bg-white/60 dark:bg-zinc-800/60 border border-white/60 dark:border-white/10">
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
              class="w-32 h-8 rounded-lg bg-white/70 dark:bg-zinc-800/70 border border-white/60 dark:border-white/10 px-2 text-xs outline-none"
              @keyup.enter="join(r)"
            />
            <button class="h-8 px-3 rounded-lg bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-medium"
              @click="join(r)">
              {{ r.requiresPassword && pendingPwd !== r.callId ? '输密码' : '加入' }}
            </button>
          </div>
        </div>
      </div>

      <button class="h-9 rounded-[10px] bg-white/60 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-300 text-xs shrink-0" @click="refresh">刷新</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
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
