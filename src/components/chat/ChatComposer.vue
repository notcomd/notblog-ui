<template>
  <!-- 输入区：表情 / 图片 / 文件 + 文本 + 发送 -->
  <div class="border-t border-zinc-200/60 dark:border-zinc-700/60 p-3 flex items-end gap-2">
    <!-- 表情：弹出面板，插入到光标处 -->
    <div class="relative shrink-0">
      <button
        class="w-10 h-10 rounded-[5%] flex items-center justify-center text-zinc-500 dark:text-zinc-300 hover:bg-white/60 dark:hover:bg-zinc-800/60 transition-colors"
        title="表情" aria-label="表情" :aria-expanded="emojiOpen" @click="emojiOpen = !emojiOpen"
      >
        <svg aria-hidden="true" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
      </button>
      <!-- 点击遮罩关闭：用真实 button 承载「关闭」语义（可键盘触发），而非可点击的 div -->
      <button
        v-if="emojiOpen"
        type="button"
        class="fixed inset-0 z-[60] cursor-default"
        aria-label="关闭表情面板"
        @click="emojiOpen = false"
      ></button>
      <div v-if="emojiOpen" class="absolute bottom-full left-0 mb-2 w-[272px] glass-card p-2 grid grid-cols-8 gap-0.5 z-[70]">
        <button v-for="e in EMOJIS" :key="e" class="h-8 rounded-[5%] text-lg leading-none hover:bg-white/70 dark:hover:bg-zinc-800/70 transition-colors" type="button" @click="insertEmoji(e)">{{ e }}</button>
      </div>
    </div>

    <!-- 图片 / 文件：选择后上传并发送 -->
    <button
      class="w-10 h-10 rounded-[5%] flex items-center justify-center text-zinc-500 dark:text-zinc-300 hover:bg-white/60 dark:hover:bg-zinc-800/60 transition-colors disabled:opacity-40 shrink-0"
      title="图片" aria-label="图片" :disabled="uploading" @click="imageInput?.click()">
      <svg aria-hidden="true" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
    </button>
    <button
      class="w-10 h-10 rounded-[5%] flex items-center justify-center text-zinc-500 dark:text-zinc-300 hover:bg-white/60 dark:hover:bg-zinc-800/60 transition-colors disabled:opacity-40 shrink-0"
      title="文件" aria-label="文件" :disabled="uploading" @click="fileInput?.click()">
      <svg aria-hidden="true" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
    </button>
    <input ref="imageInput" type="file" accept="image/*" class="hidden" @change="onAttachmentPicked($event, 'image')" />
    <input ref="fileInput" type="file" class="hidden" @change="onAttachmentPicked($event, 'file')" />

    <textarea
      ref="draftBox"
      v-model="draft"
      rows="1"
      name="messageInput"
      aria-label="消息输入"
      class="flex-1 resize-none rounded-[5%] bg-white/70 dark:bg-zinc-800/70 border border-white/60 dark:border-white/10 px-3 py-2.5 text-sm outline-none max-h-[120px]"
      placeholder="输入消息，Enter 发送，Shift+Enter 换行"
      @keydown.enter.exact.prevent="onEnter"
      @input="onInput"
    ></textarea>

    <span v-if="uploading" class="text-xs text-zinc-400 shrink-0 pb-2.5">上传中…</span>
    <button
      class="h-10 px-4 rounded-[5%] bg-gradient-to-r from-amber-400 to-orange-500 text-white text-sm font-medium shrink-0 disabled:opacity-50 transition-[opacity,transform] duration-200 active:scale-95 disabled:active:scale-100"
      type="button" :disabled="!draft.trim() || sending" @click="send">发送</button>
  </div>
</template>

<script setup lang="ts">
// 消息输入区：表情插入、图片/文件上传发送、Enter 发送、输入时通知 typing
import { nextTick, onBeforeUnmount, ref } from 'vue'
import { MessageType, uploadChatFile } from '@/api/chat'
import { uploadImage } from '@/api/publish'
import { unwrap } from '@/utils/response'
import { useChatStore } from '@/stores/chat'
import { useToastStore } from '@/stores/toast'

const emit = defineEmits<{ (e: 'sent'): void }>()

const chat = useChatStore()
const toast = useToastStore()

const draft = ref('')
const sending = ref(false)
const uploading = ref(false)
const emojiOpen = ref(false)
const draftBox = ref<HTMLTextAreaElement | null>(null)
const imageInput = ref<HTMLInputElement | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

const MAX_IMAGE_SIZE = 10 * 1024 * 1024
const MAX_FILE_SIZE = 50 * 1024 * 1024
const EMOJIS: string[] = ['😀','😄','😁','😆','😅','😂','🙂','😉','😊','😍','😘','😜','🤗','🤔','😐','😴','😢','😭','😡','🥺','👍','👌','🙏','👏','💪','🎉','🔥','❤️','💡','🌟','☕','🍔','🍺','🌈','✅','❌','⏰','📌','🚀','🎁']

let typingTimer: ReturnType<typeof setTimeout> | null = null

async function send(): Promise<void> {
  const content = draft.value.trim()
  if (!content || sending.value || !chat.activeSessionId) return
  sending.value = true
  try {
    await chat.sendText(chat.activeSessionId, content)
    draft.value = ''
    resetDraftHeight()
    emit('sent')
  } catch (e) {
    toast.push('发送失败，请重试', 'error')
  } finally {
    sending.value = false
  }
}

/** 在输入框光标处插入表情（无光标时追加到末尾） */
function insertEmoji(emoji: string): void {
  const el = draftBox.value
  if (!el) {
    draft.value += emoji
    return
  }
  const start = el.selectionStart ?? draft.value.length
  const end = el.selectionEnd ?? start
  draft.value = draft.value.slice(0, start) + emoji + draft.value.slice(end)
  nextTick(() => {
    const pos = start + emoji.length
    el.focus()
    el.setSelectionRange(pos, pos)
    autoGrow(el)
  })
}

/** 上传附件换取 FileDev 文件 ID 与可访问地址（图片走 upload-image，其余走 upload） */
async function uploadAttachment(file: File): Promise<{ fileId: string; url: string }> {
  const isImage = file.type.startsWith('image/')
  const data = unwrap(await (isImage ? uploadImage(file, 'chat-image') : uploadChatFile(file))) || {}
  const fileId = data.fileId || data.file_id || ''
  if (!fileId) throw new Error('上传未返回文件ID')
  return { fileId, url: data.fileUri || data.file_url || '' }
}

/**
 * 选择附件 → 上传 → 发送。
 * 图片与文件原先各写一份近乎相同的函数，仅在 messageType/体积上限/错误文案上不同。
 */
async function onAttachmentPicked(e: Event, kind: 'image' | 'file'): Promise<void> {
  const el = e.target as HTMLInputElement
  const file = el.files && el.files[0]
  el.value = ''
  if (!file || !chat.activeSessionId) return
  const isImage = kind === 'image'
  if (file.size > (isImage ? MAX_IMAGE_SIZE : MAX_FILE_SIZE)) {
    toast.push(isImage ? '图片不能超过 10MB' : '文件不能超过 50MB', 'error')
    return
  }
  uploading.value = true
  try {
    const { fileId, url } = await uploadAttachment(file)
    const localUrl = url || URL.createObjectURL(file)
    await chat.sendMedia(
      chat.activeSessionId,
      isImage
        ? { messageType: MessageType.Image, fileId, localUrl }
        : { messageType: MessageType.File, fileId, localUrl, fileName: file.name, fileSize: file.size }
    )
    emit('sent')
  } catch (err) {
    toast.push(`${isImage ? '图片' : '文件'}发送失败：${(err as Error).message || '请重试'}`, 'error')
  } finally {
    uploading.value = false
  }
}

function onEnter(e: KeyboardEvent): void {
  // 中文输入法组合期不触发发送
  if (e.isComposing || e.keyCode === 229) return
  void send()
}

function onInput(e: Event): void {
  notifyTyping()
  autoGrow(e.target as HTMLTextAreaElement)
}

function notifyTyping(): void {
  if (!chat.activeSessionId) return
  if (typingTimer) clearTimeout(typingTimer)
  typingTimer = setTimeout(() => chat.sendTyping(chat.activeSessionId), 500)
}

function autoGrow(el: HTMLElement): void {
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 120) + 'px'
}

function resetDraftHeight(): void {
  nextTick(() => {
    const el = draftBox.value
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
  })
}

onBeforeUnmount(() => {
  if (typingTimer) clearTimeout(typingTimer)
})
</script>