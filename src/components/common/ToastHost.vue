<template>
  <!-- 全局轻提示：从顶部导航栏下方滑出，3 秒自动消失 -->
  <div class="fixed top-16 left-1/2 -translate-x-1/2 z-[999] flex flex-col items-center gap-2 pointer-events-none">
    <transition-group name="toast-slide">
      <div
        v-for="m in toast.messages"
        :key="m.id"
        class="glass-card px-5 py-2.5 text-sm font-medium"
        :class="toastClass(m.type)"
      >
        {{ m.text }}
      </div>
    </transition-group>
  </div>
</template>

<script setup>
import { useToastStore } from '@/stores/toast'

const toast = useToastStore()

function toastClass(type) {
  switch (type) {
    case 'success': return 'text-emerald-600 dark:text-emerald-400'
    case 'error': return 'text-red-500'
    default: return 'text-zinc-700 dark:text-zinc-200'
  }
}
</script>

<style scoped>
.toast-slide-enter-active {
  transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
}

.toast-slide-leave-active {
  transition: all 0.25s ease;
}

.toast-slide-enter-from {
  opacity: 0;
  transform: translateY(-16px);
}

.toast-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
