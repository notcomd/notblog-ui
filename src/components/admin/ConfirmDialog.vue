<template>
  <BaseModal
    :open="open"
    no-header
    :show-close="false"
    width="w-[420px]"
    body-class="p-6"
    :labelledby="titleId"
    @close="emit('close')"
    @closed="emit('closed')"
  >
    <div class="flex items-start gap-3">
      <div class="w-10 h-10 rounded-[5%] flex items-center justify-center shrink-0" :class="danger ? 'bg-red-500/15 text-red-500' : 'bg-amber-400/15 text-amber-500'">
        <svg v-if="danger" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /><path d="M12 9v4M12 17h.01" /></svg>
        <svg v-else class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
      </div>
      <div class="flex-1 min-w-0">
        <h3 :id="titleId" class="text-base font-bold text-zinc-800 dark:text-zinc-100">{{ title }}</h3>
        <p class="text-sm text-zinc-500 dark:text-zinc-400 mt-1.5 leading-relaxed">{{ message }}</p>
        <!-- 操作原因输入 -->
        <input
          v-if="requireReason"
          v-model="reason"
          class="w-full h-10 px-3.5 mt-3 rounded-[5%] bg-transparent ring-1 ring-inset ring-zinc-200/70 dark:ring-zinc-800 text-sm outline-none focus:ring-2 focus:ring-amber-400/50 transition-all"
          name="reason"
          :aria-label="reasonPlaceholder"
          :placeholder="reasonPlaceholder"
        />
      </div>
    </div>
    <div class="flex justify-end gap-2 mt-5">
      <button class="px-4 h-10 rounded-[5%] text-sm text-zinc-500 dark:text-zinc-400 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-all" @click="emit('close')">取消</button>
      <button class="px-4 h-10 rounded-[5%] text-sm font-medium text-white active:scale-95 transition-all disabled:opacity-50"
        :class="danger ? 'bg-gradient-to-r from-red-500 to-rose-500 ' : 'bg-gradient-to-r from-amber-400 to-orange-500 '"
        :disabled="requireReason && !reason.trim()"
        @click="confirm">
        {{ confirmText }}
      </button>
    </div>
  </BaseModal>
</template>

<script lang="ts">
// 模块级自增序号：为每个确认框实例生成唯一标题 id（供 aria-labelledby 关联）
let confirmSeq = 0
</script>

<script setup lang="ts">
// 全站确认框：基于统一弹窗基座 BaseModal（对外 props/事件保持不变）
import { ref } from 'vue'
import BaseModal from '@/components/common/BaseModal.vue'

interface Props {
  title: string
  message?: string
  danger?: boolean
  confirmText?: string
  requireReason?: boolean
  reasonPlaceholder?: string
  /** 受控显隐：不传默认 true（父级 v-if 旧用法无退场动画，行为不变）；传 false 播退场后 emit('closed') */
  open?: boolean
}
withDefaults(defineProps<Props>(), { open: true })

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'closed'): void
  (e: 'confirm', reason: string): void
}>()

const titleId = `qm-confirm-title-${++confirmSeq}`
const reason = ref('')

function confirm() {
  emit('confirm', reason.value.trim())
}
</script>
