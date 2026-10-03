<template>
  <!-- 单条消息：头像/昵称仅在「组内首条」渲染，连续消息归于一组 -->
  <div
    class="flex items-start gap-2.5"
    :class="[isMine ? 'justify-end' : 'justify-start', isGroupStart ? 'mt-3' : 'mt-0.5']"
  >
    <!-- 头像：组内续条用等宽占位保持缩进对齐 -->
    <template v-if="isGroupStart">
      <img
        :src="chat.senderAvatar(message)"
        alt=""
        width="32"
        height="32"
        class="w-8 h-8 rounded-[10px] object-cover border border-white/60 dark:border-white/10 shrink-0"
        :class="isMine ? 'order-2' : ''"
        @error="onAvatarError"
      />
    </template>
    <span v-else class="w-8 shrink-0" :class="isMine ? 'order-2' : ''" aria-hidden="true"></span>

    <div class="min-w-0 max-w-[70%] flex flex-col" :class="isMine ? 'items-end' : 'items-start'">
      <!-- 昵称：仅他人消息的组首显示（自己的消息不必重复自己是谁） -->
      <span
        v-if="isGroupStart && !isMine"
        class="text-xs text-zinc-400 px-1 pb-0.5 truncate max-w-[220px]"
      >{{ chat.senderName(message) }}</span>

      <div
        class="rounded-[10px] px-3 py-2 text-sm"
        :class="isMine ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-white' : 'bg-white/70 dark:bg-zinc-800/70 text-zinc-700 dark:text-zinc-200'"
      >
        <!-- 图片消息：点击新窗口查看原图 -->
        <a v-if="message.messageType === MessageType.Image && message.mediaUrl" :href="message.mediaUrl" target="_blank" rel="noopener" class="block">
          <img :src="message.mediaUrl" alt="图片消息" class="max-w-[260px] max-h-[260px] rounded-[10px] object-cover" @error="onMediaError" />
        </a>
        <!-- 文件消息：文件名 + 体积，点击下载 -->
        <a v-else-if="message.messageType === MessageType.File && message.mediaUrl" :href="message.mediaUrl" target="_blank" rel="noopener" class="flex items-center gap-2 min-w-[150px]">
          <svg aria-hidden="true" class="w-8 h-8 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          <span class="min-w-0">
            <span class="block truncate">{{ message.fileName || '文件' }}</span>
            <span class="block text-[11px] opacity-70">{{ formatSize(message.fileSize) }}</span>
          </span>
        </a>
        <div v-else class="whitespace-pre-wrap break-words">{{ message.content }}</div>

        <!-- 元信息行：时间 + 发送状态；组内续条不重复显示时间 -->
        <div v-if="isGroupEnd || message.status === -1" class="mt-1 flex items-center gap-2 text-[10px] opacity-70">
          <span class="font-numeric">{{ clockTime(message.sentTime) }}</span>
          <span v-if="isMine && message.status === 0">发送中…</span>
          <!-- 失败重试：真实按钮，可键盘触发 -->
          <button
            v-else-if="isMine && message.status === -1"
            type="button"
            class="text-red-200 hover:text-red-100 underline underline-offset-2 cursor-pointer"
            @click="emit('retry')"
          >发送失败，点击重试</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 单条消息渲染：图片/文件/文本三态 + 发送中/失败重试。
// 昵称与头像一律取自 store 的展示解析（不再在本组件内做多层兜底）。
import { computed } from 'vue'
import { MessageType } from '@/api/chat'
import { clockTime, formatSize } from '@/utils/format'
import { charAvatar } from '@/utils/avatar'
import { useChatStore, type MessageDto } from '@/stores/chat'

const props = defineProps<{
  message: MessageDto
  /** 组内首条：渲染头像与昵称 */
  isGroupStart?: boolean
  /** 组内末条：显示时间等元信息 */
  isGroupEnd?: boolean
}>()

const emit = defineEmits<{ (e: 'retry'): void }>()

const chat = useChatStore()
const isMine = computed(() => chat.isMine(props.message))

/** 头像/图片加载失败：换成首字头像，避免留下空洞 */
function onAvatarError(e: Event): void {
  const el = e.target as HTMLImageElement
  const fallback = charAvatar(chat.senderName(props.message).charAt(0) || '友', isMine.value ? '#f59e0b' : '#a1a1aa')
  if (el.src !== fallback) el.src = fallback
}

function onMediaError(e: Event): void {
  ;(e.target as HTMLElement).style.opacity = '0.3'
}
</script>