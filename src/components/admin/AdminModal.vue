<template>
  <div class="fixed inset-0 z-[80] flex items-center justify-center bg-black/40" @click.self="emit('close')">
    <div class="qm-surface flex flex-col max-h-[85vh]" :class="widthClass">
      <!-- 头部 -->
      <div class="flex items-center justify-between px-5 py-4 border-b border-black/[0.06] dark:border-white/[0.08] shrink-0">
        <h3 class="text-base font-bold text-zinc-800 dark:text-zinc-100">{{ title }}</h3>
        <button class="w-8 h-8 rounded-[5%] flex items-center justify-center text-zinc-400 hover:bg-black/[0.05] dark:hover:bg-white/[0.07] transition-colors" @click="emit('close')" aria-label="关闭">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12" /></svg>
        </button>
      </div>
      <!-- 内容 -->
      <div class="p-5 overflow-y-auto overscroll-contain">
        <slot></slot>
      </div>
      <!-- 底部（可选） -->
      <div v-if="$slots.footer" class="px-5 py-4 border-t border-black/[0.06] dark:border-white/[0.08] flex justify-end gap-2 shrink-0">
        <slot name="footer"></slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  title: string
  /** 形如 w-[720px]；未传时用默认宽度 */
  width?: string
}
const props = defineProps<Props>()

const emit = defineEmits<{ (e: 'close'): void }>()

// 任意 px 宽度都自动收敛为 min(px, 92vw)，避免小屏溢出；
// 解析失败时原样透传（支持传入非 px 的宽度类）。
const widthClass = computed(() => {
  const w = props.width
  if (!w) return 'w-[min(700px,92vw)]'
  const m = /^w-\[(\d+)px\]$/.exec(w)
  return m ? `w-[min(${m[1]}px,92vw)]` : w
})
</script>
