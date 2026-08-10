<template>
  <div class="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 backdrop-blur-sm" @click.self="emit('close')">
    <div class="glass-card flex flex-col max-h-[85vh]" :class="widthClass">
      <!-- 头部 -->
      <div class="flex items-center justify-between px-5 py-4 border-b border-zinc-200/60 dark:border-zinc-700/60 shrink-0">
        <h3 class="text-base font-bold text-zinc-800 dark:text-zinc-100">{{ title }}</h3>
        <button class="w-8 h-8 rounded-[5%] flex items-center justify-center text-zinc-400 hover:bg-white/60 dark:hover:bg-zinc-800/60 transition-colors" @click="emit('close')">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
        </button>
      </div>
      <!-- 内容 -->
      <div class="p-5 overflow-y-auto">
        <slot></slot>
      </div>
      <!-- 底部（可选） -->
      <div v-if="$slots.footer" class="px-5 py-4 border-t border-zinc-200/60 dark:border-zinc-700/60 flex justify-end gap-2 shrink-0">
        <slot name="footer"></slot>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  width: { type: String, default: 'w-[560px]' }
})

const emit = defineEmits(['close'])

const widthClass = {
  'w-[560px]': 'w-[560px]',
  'w-[720px]': 'w-[720px]',
  'w-[900px]': 'w-[900px]'
}
</script>
