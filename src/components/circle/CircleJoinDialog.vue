<template>
  <!-- 加入社区弹窗：邀请码/链接加入 + 收到的直邀（真实端点 accept/reject） -->
  <div class="fixed inset-0 z-[70] flex items-center justify-center bg-black/30" @click.self="$emit('close')">
    <div class="glass-card p-6 w-96 max-h-[85vh] overflow-y-auto">
      <h3 class="text-lg font-bold text-zinc-800 dark:text-zinc-100 mb-4">加入社区</h3>
      <p class="text-xs text-zinc-400 mb-3">输入社区邀请码即可加入</p>
      <input
        v-model="joinInput"
        class="w-full h-11 px-4 rounded-[5%] bg-white/70 dark:bg-zinc-800/70 border border-white/60 dark:border-white/10 text-sm text-zinc-700 dark:text-zinc-200 outline-none focus:ring-2 focus:ring-amber-400/50 transition-all"
        placeholder="请输入社区邀请码"
        @keyup.enter="$emit('join-submit', joinInput)"
      />
      <div class="flex justify-end gap-2 mt-4">
        <button class="px-4 h-10 rounded-[5%] text-sm text-zinc-500 dark:text-zinc-400 hover:bg-white/60 dark:hover:bg-zinc-800/60 transition-colors" @click="$emit('close')">取消</button>
        <button class="px-4 h-10 rounded-[5%] text-sm font-medium bg-gradient-to-r from-amber-400 to-orange-500 text-white hover:brightness-110 active:scale-95 transition-all" :disabled="joining" @click="$emit('join-submit', joinInput)">
          {{ joining ? '加入中...' : '加入社区' }}
        </button>
      </div>

      <!-- 收到的直邀（真实端点：GET /invitations/my + accept/reject） -->
      <div class="mt-4 pt-4 border-t border-zinc-200/60 dark:border-zinc-700/60">
        <p class="text-xs text-zinc-400 mb-2">收到的社区邀请</p>
        <div v-if="myInvites.length === 0" class="text-xs text-zinc-400 py-3 text-center bg-white/40 dark:bg-zinc-800/40 rounded-[5%]">暂无邀请</div>
        <div v-else class="space-y-1.5 max-h-44 overflow-y-auto pr-0.5">
          <div v-for="inv in myInvites" :key="inv.inviteGuid" class="flex items-center gap-2 px-3 py-2 rounded-[5%] bg-white/40 dark:bg-zinc-800/40">
            <span class="flex-1 min-w-0">
              <span class="block text-sm font-medium text-zinc-700 dark:text-zinc-200 truncate">{{ inv.circleName || '社区邀请' }}</span>
              <span class="block text-[10px] text-zinc-400">{{ statusText(inv) }}</span>
            </span>
            <template v-if="inv.status === 'Pending'">
              <button class="h-7 px-2.5 rounded-[5%] text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors" :disabled="busy === inv.inviteGuid" @click="$emit('accept', inv)">接受</button>
              <button class="h-7 px-2.5 rounded-[5%] text-[11px] font-medium text-red-500 hover:bg-red-500/10 transition-colors" :disabled="busy === inv.inviteGuid" @click="$emit('reject', inv)">拒绝</button>
            </template>
            <span v-if="inv.status === 'Accepted'" class="text-[11px] text-emerald-600 dark:text-emerald-400 shrink-0 inline-flex items-center gap-0.5"><svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>已接受</span>
            <span v-else class="text-[11px] text-zinc-400 shrink-0">已失效</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 加入社区弹窗：邀请码/链接加入 + 收到的直邀（接受/拒绝真实端点）
import { ref } from 'vue'

interface CircleInvite {
  inviteGuid?: string
  circleName?: string
  status?: string
}

defineProps<{
  myInvites?: CircleInvite[]
  busy?: string
  joining?: boolean
}>()
defineEmits<{
  close: []
  'join-submit': [code: string]
  accept: [inv: CircleInvite]
  reject: [inv: CircleInvite]
}>()

const joinInput = ref('')

const INVITE_STATUS_TEXT: Record<string, string> = { Pending: '待处理', Accepted: '已接受', Revoked: '已撤销', Expired: '已过期' }
function statusText(inv: CircleInvite): string {
  return INVITE_STATUS_TEXT[inv.status || ''] || inv.status || '未知'
}
</script>
