<template>
  <!-- 全局通知弹窗：顶部右侧堆叠，长方体卡片（图标 + 通知名称 + 消息 + 时间），可手动关闭 -->
  <Teleport to="body">
    <div class="fixed top-3 right-3 lg:top-4 lg:right-4 z-[999] flex flex-col items-end gap-2 pointer-events-none">
      <TransitionGroup name="notify-slide">
        <div
          v-for="item in toast.messages"
          :key="item.id"
          class="pointer-events-auto relative w-[min(360px,92vw)] rounded-[10px] border border-zinc-200/70 dark:border-zinc-700/60 bg-white/95 dark:bg-zinc-900/95 px-4 py-3 flex items-start gap-3"
        >
          <!-- 通知图标 -->
          <div class="w-10 h-10 shrink-0 rounded-[10px] bg-amber-400/15 dark:bg-amber-500/15 flex items-center justify-center text-xl">
            <span v-html="item.icon"></span>
          </div>

          <!-- 通知内容：名称 + 消息 + 时间 -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between gap-2">
              <span class="text-sm font-semibold text-zinc-800 dark:text-zinc-100 truncate">{{ item.title }}</span>
              <button
                class="shrink-0 w-5 h-5 rounded-[5px] flex items-center justify-center text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                title="关闭"
                @click="toast.dismiss(item.id)"
              >
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <p class="mt-1 text-sm text-zinc-600 dark:text-zinc-300 break-words">{{ item.text }}</p>
            <p class="mt-1.5 text-xs text-zinc-400">{{ formatTime(item.time) }}</p>
          </div>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
// 全局通知弹窗宿主：消费 toast store（原 ToastHost 纯文本提示已升级为此通知样式，
// 顶部右侧堆叠：图标 + 通知名称 + 消息 + 时间，兼容 push('文案', type) 简写调用）
import { useToastStore } from '@/stores/toast'
import { formatTime } from '@/utils/format'

const toast = useToastStore()
</script>

<style scoped>
.notify-slide-enter-active,
.notify-slide-leave-active {
  transition: all 0.25s ease;
}
.notify-slide-enter-from {
  opacity: 0;
  transform: translateX(24px);
}
.notify-slide-leave-to {
  opacity: 0;
  transform: translateX(24px);
}
</style>
