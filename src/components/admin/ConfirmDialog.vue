<template>
  <div class="fixed inset-0 z-[80] flex items-center justify-center bg-black/40" @click.self="emit('close')">
    <div class="glass-card p-6 w-[420px]">
      <div class="flex items-start gap-3">
        <div class="w-10 h-10 rounded-[5%] flex items-center justify-center shrink-0" :class="danger ? 'bg-red-500/15 text-red-500' : 'bg-amber-400/15 text-amber-500'">
          <svg v-if="danger" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /><path d="M12 9v4M12 17h.01" /></svg>
          <svg v-else class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
        </div>
        <div class="flex-1 min-w-0">
          <h3 class="text-base font-bold text-zinc-800 dark:text-zinc-100">{{ title }}</h3>
          <p class="text-sm text-zinc-500 dark:text-zinc-400 mt-1.5 leading-relaxed">{{ message }}</p>
          <!-- 操作原因输入 -->
          <input
            v-if="requireReason"
            v-model="reason"
            class="w-full h-10 px-3.5 mt-3 rounded-[5%] bg-white/70 dark:bg-zinc-800/70 border border-white/60 dark:border-white/10 text-sm outline-none focus:ring-2 focus:ring-amber-400/50 transition-all"
            :placeholder="reasonPlaceholder"
          />
        </div>
      </div>
      <div class="flex justify-end gap-2 mt-5">
        <button class="px-4 h-10 rounded-[5%] text-sm text-zinc-500 dark:text-zinc-400 hover:bg-white/60 dark:hover:bg-zinc-800/60 transition-all" @click="emit('close')">取消</button>
        <button class="px-4 h-10 rounded-[5%] text-sm font-medium text-white active:scale-95 transition-all disabled:opacity-50"
          :class="danger ? 'bg-gradient-to-r from-red-500 to-rose-500 ' : 'bg-gradient-to-r from-amber-400 to-orange-500 '"
          :disabled="requireReason && !reason.trim()"
          @click="confirm">
          {{ confirmText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
  title: { type: String, required: true },
  message: { type: String, default: '' },
  danger: { type: Boolean, default: true },
  confirmText: { type: String, default: '确认' },
  requireReason: { type: Boolean, default: false },
  reasonPlaceholder: { type: String, default: '请输入操作原因（必填）' }
})

const emit = defineEmits(['close', 'confirm'])

const reason = ref('')

function confirm() {
  emit('confirm', reason.value.trim())
}
</script>
