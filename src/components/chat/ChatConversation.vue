<template>
  <!-- 会话主视窗：聊天消息、输入框、创建/搜索群聊面板 -->
  <div class="flex-1 min-w-0 glass-card flex flex-col min-h-0">
    <ChatGroupDialogs v-if="mode" :mode="mode" @close="closeGroupMode" />

    <template v-else>
      <!-- 会话头部 -->
      <div class="flex items-center gap-3 px-5 py-3 border-b border-zinc-200/60 dark:border-zinc-700/60 shrink-0">
        <!-- 移动端返回会话列表（桌面端隐藏） -->
        <button class="lg:hidden shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-zinc-500 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors" title="返回会话列表" @click="goBackList">
          <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <div class="flex-1 min-w-0">
          <div class="text-sm font-semibold text-zinc-800 dark:text-zinc-100 truncate">{{ activeTitle }}</div>
          <div class="text-xs text-zinc-400 truncate">{{ activeSubtitle }}</div>
        </div>
        <!-- 通话操作（私聊/群聊会话；AI/匿名会话不可通话） -->
        <template v-if="active && canCall">
          <button class="h-8 w-8 rounded-full bg-white/60 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-300 hover:text-emerald-500 dark:hover:text-emerald-400 flex items-center justify-center transition-colors" title="语音通话" @click="startCall('Audio')">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
          </button>
          <button class="h-8 w-8 rounded-full bg-white/60 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-300 hover:text-amber-500 dark:hover:text-amber-400 flex items-center justify-center transition-colors" title="视频通话" @click="startCall('Video')">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
          </button>
        </template>
        <button v-if="active && active.groupId" class="h-8 px-3 rounded-[5%] text-xs bg-white/60 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-300" @click="memberOpen = !memberOpen">成员</button>
      </div>

      <!-- 群成员下拉 -->
      <div v-if="memberOpen" class="px-5 py-3 border-b border-zinc-200/60 dark:border-zinc-700/60 max-h-48 overflow-y-auto">
        <div v-for="m in members" :key="m.id" class="flex items-center gap-2 py-1 text-sm text-zinc-600 dark:text-zinc-300">
          <img :src="m.avatar || demoAvatar('友', '#a1a1aa')" alt="" class="w-7 h-7 rounded-full object-cover" />
          <span>{{ m.name }}</span>
          <span class="ml-auto w-2 h-2 rounded-full" :class="m.online ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-600'"></span>
        </div>
      </div>

      <!-- 消息列表 -->
      <div ref="msgBox" class="flex-1 overflow-y-auto px-5 py-4 min-h-0 space-y-3" @scroll="onScroll">
        <div v-if="!active" class="py-24 text-center text-sm text-zinc-400">选择一个会话开始聊天</div>
        <template v-else>
          <div v-for="m in activeMessages" :key="m.messageId" class="flex" :class="isMine(m) ? 'justify-end' : 'justify-start'">
            <div class="max-w-[70%] rounded-[10px] px-3 py-2 text-sm overflow-hidden"
              :class="isMine(m) ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-white' : 'bg-white/70 dark:bg-zinc-800/70 text-zinc-700 dark:text-zinc-200'">
              <!-- 消息主体（按类型渲染：文本/图片/视频/音频/文件/位置/链接） -->
              <div class="whitespace-pre-wrap break-words">{{ messageBody(m) }}</div>

              <!-- 图片消息 -->
              <template v-if="m.messageType === MsgType.Image">
                <a v-if="m.mediaUrl" :href="m.mediaUrl" target="_blank" rel="noopener" class="block mt-1">
                  <img :src="m.thumbnailUrl || m.mediaUrl" alt="图片消息"
                    class="max-h-64 w-auto max-w-full rounded-lg object-cover cursor-zoom-in"
                    loading="lazy" />
                </a>
              </template>

              <!-- 视频消息 -->
              <video v-else-if="m.messageType === MsgType.Video && m.mediaUrl" :src="m.mediaUrl" controls
                class="mt-1 max-h-64 w-auto max-w-full rounded-lg bg-black"></video>

              <!-- 音频消息 -->
              <audio v-else-if="m.messageType === MsgType.Audio && m.mediaUrl" :src="m.mediaUrl" controls
                class="mt-1 w-full max-w-[240px]"></audio>

              <!-- 文件消息：文件名 + 大小 + 下载 -->
              <div v-else-if="m.messageType === MsgType.File" class="mt-1 flex items-center gap-2">
                <span class="h-9 w-9 rounded-lg flex items-center justify-center shrink-0"
                  :class="isMine(m) ? 'bg-white/20' : 'bg-zinc-100 dark:bg-zinc-700'">
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                </span>
                <div class="min-w-0 flex-1">
                  <div class="text-[13px] font-medium truncate">{{ m.fileName || '文件' }}</div>
                  <div class="text-[10px] opacity-70">{{ sizeText(m.fileSize) }}</div>
                </div>
                <a v-if="m.mediaUrl" :href="m.mediaUrl" download :title="m.fileName || '下载文件'"
                  class="shrink-0 text-xs underline opacity-80 hover:opacity-100">下载</a>
                <a v-else-if="m.attachments && m.attachments.length" :href="String((m.attachments as any[])[0].fileUrl || '')" download
                  class="shrink-0 text-xs underline opacity-80 hover:opacity-100">下载</a>
              </div>

              <!-- 位置消息 -->
              <div v-else-if="m.messageType === MsgType.Location" class="mt-1 text-[13px]">
                <span class="inline-flex items-center gap-1">
                  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  {{ m.locationName || '位置' }}
                </span>
              </div>

              <!-- 链接卡片 -->
              <a v-else-if="m.messageType === MsgType.Link && m.linkUrl" :href="m.linkUrl" target="_blank" rel="noopener"
                class="mt-1 block rounded-lg px-3 py-2 text-[13px]"
                :class="isMine(m) ? 'bg-white/20' : 'bg-zinc-100 dark:bg-zinc-700'">
                <div class="font-medium">{{ m.linkTitle || m.linkUrl }}</div>
                <div v-if="m.linkDescription" class="text-xs opacity-80 mt-0.5 line-clamp-2">{{ m.linkDescription }}</div>
              </a>

              <div class="mt-1 flex items-center gap-2 text-[10px] opacity-70">
                <span>{{ timeText(m.sentTime) }}</span>
                <span v-if="isMine(m) && m.status === 0">发送中...</span>
                <span v-else-if="isMine(m) && m.status === -1" class="text-red-200 cursor-pointer" @click="retryMessage(m)">发送失败，点击重试</span>
              </div>
            </div>
          </div>
        </template>
      </div>

      <!-- 输入区 -->
      <div class="border-t border-zinc-200/60 dark:border-zinc-700/60 p-3 flex items-end gap-2">
        <!-- 图片发送 -->
        <label class="h-10 w-10 shrink-0 rounded-[5%] bg-white/70 dark:bg-zinc-800/70 border border-white/60 dark:border-white/10 flex items-center justify-center cursor-pointer text-zinc-500 dark:text-zinc-300 hover:text-amber-500 dark:hover:text-amber-400 transition-colors" title="发送图片">
          <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          <input type="file" accept="image/*" class="hidden" :disabled="sending || sendingMedia" @change="onPickImage" />
        </label>
        <!-- 文件发送 -->
        <label class="h-10 w-10 shrink-0 rounded-[5%] bg-white/70 dark:bg-zinc-800/70 border border-white/60 dark:border-white/10 flex items-center justify-center cursor-pointer text-zinc-500 dark:text-zinc-300 hover:text-amber-500 dark:hover:text-amber-400 transition-colors" title="发送文件">
          <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          <input type="file" class="hidden" :disabled="sending || sendingMedia" @change="onPickFile" />
        </label>
        <textarea
          ref="draftBox"
          v-model="draft"
          rows="1"
          class="flex-1 resize-none rounded-[5%] bg-white/70 dark:bg-zinc-800/70 border border-white/60 dark:border-white/10 px-3 py-2.5 text-sm outline-none max-h-[120px]"
          placeholder="输入消息，Enter 发送，Shift+Enter 换行"
          @keydown.enter.exact.prevent="onEnter"
          @input="onInput"
        ></textarea>
        <button class="h-10 px-4 rounded-[5%] bg-gradient-to-r from-amber-400 to-orange-500 text-white text-sm font-medium shrink-0" :disabled="(!draft.trim() && !sendingMedia) || sending" @click="send">发送</button>
      </div>
      <!-- 上传中提示 -->
      <div v-if="sendingMedia" class="px-3 pb-2 text-xs text-amber-500">{{ uploadTip }}</div>
    </template>
  </div>
</template>

<script setup lang="ts">
// 会话主视窗：负责消息展示、发送、失败重试、输入状态、滚动加载和群聊面板切换
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { charAvatar as demoAvatar } from '@/utils/avatar'
import { useRoute, useRouter } from 'vue-router'
import { useChatStore } from '@/stores/chat'
import { useToastStore } from '@/stores/toast'
import { useCallStore } from '@/stores/call'
import { MessageType, uploadChatImage, uploadChatFile } from '@/api/chat'
import ChatGroupDialogs from '@/components/chat/ChatGroupDialogs.vue'

const chat = useChatStore()
const toast = useToastStore()
const call = useCallStore()
const route = useRoute()
const router = useRouter()

// 模板中使用消息类型常量（与后端 MessageType 枚举数字一致）
const MsgType = MessageType

const draft = ref('')
const sending = ref(false)
const sendingMedia = ref(false)
const uploadTip = ref('')
const msgBox = ref<HTMLElement | null>(null)
const draftBox = ref<HTMLTextAreaElement | null>(null)
const memberOpen = ref(false)
let typingTimer: ReturnType<typeof setTimeout> | null = null
let scrollLock = false

const mode = computed(() => route.query.action === 'createGroup' ? 'create' : route.query.action === 'searchGroup' ? 'search' : '')
const active = computed(() => chat.sessions.find(s => s.sessionId === chat.activeSessionId) || null)
const activeMessages = computed(() => (chat.activeSessionId && chat.messages[chat.activeSessionId]) || [])
const myId = computed(() => chat.currentUserId ? chat.currentUserId() : '')
const activeTitle = computed(() => active.value ? (active.value.sessionName || '会话') : '轻芒会话')
const activeSubtitle = computed(() => {
  if (!active.value) return '选择左侧会话开始聊天'
  if (active.value.groupId || active.value.circleId) return `${active.value.participants ? active.value.participants.length : 0} 人`
  const peerId = chat.peerIdOf(active.value.sessionId)
  return chat.onlineUsers[String(peerId)] ? '在线' : '离线'
})

const members = computed(() => {
  const a = active.value
  if (!a || !a.groupId) return []
  const g = chat.groups.find(x => String(x.groupId) === String(a.groupId))
  const pids = (g && g.participants) || a.participants || []
  return pids.map(pid => {
    const f = chat.friends.find(x => String(x.friendId) === String(pid))
    return {
      id: String(pid),
      name: f ? f.friendName : '成员',
      avatar: f && f.friendAvatar ? f.friendAvatar : '',
      online: chat.onlineUsers[String(pid)] === true
    }
  })
})

// 可通话会话：排除通知会话（notifyGuid）；后端限制私聊/群聊/频道可发起通话
const canCall = computed(() => !!active.value && !active.value.notifyGuid)

function startCall(type: 'Audio' | 'Video') {
  if (!active.value) return
  call.startCall(active.value.sessionId, type)
}


function isMine(m: any): boolean {
  return String(m.senderId) === String(myId.value)
}

/** 消息主体文本（媒体/文件消息不重复展示占位文案） */
function messageBody(m: any): string {
  const t = Number(m.messageType)
  if (t === MsgType.Image || t === MsgType.Video || t === MsgType.Audio || t === MsgType.File) return ''
  return m.content || ''
}

/** 文件大小可读化（B → KB/MB/GB） */
function sizeText(bytes: any): string {
  const n = Number(bytes)
  if (!n || n <= 0) return ''
  if (n < 1024) return n + ' B'
  const kb = n / 1024
  if (kb < 1024) return kb.toFixed(1) + ' KB'
  const mb = kb / 1024
  if (mb < 1024) return mb.toFixed(1) + ' MB'
  return (mb / 1024).toFixed(2) + ' GB'
}

/** 从上传响应中解出 FileRef（{ fileId, fileUri, fileName, fileSize, mimeType, ... }） */
function fileRefOf(res: any): any {
  const d = res && res.data ? res.data : res
  return (d && d.data) || d
}

async function onPickImage(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input && input.files && input.files[0]
  input.value = ''
  if (!file || !chat.activeSessionId || sendingMedia.value) return
  if (file.size > 50 * 1024 * 1024) {
    toast.push('图片过大，请选择 50MB 以内的文件', 'error')
    return
  }
  sendingMedia.value = true
  uploadTip.value = '正在上传图片…'
  try {
    const res = await uploadChatImage(file)
    const ref_ = fileRefOf(res)
    if (!ref_ || !ref_.fileId) throw new Error('上传失败：未返回文件')
    uploadTip.value = '图片已上传，发送中…'
    await chat.sendImage(chat.activeSessionId, {
      fileId: ref_.fileId,
      thumbnailFileId: ref_.fileId,
      mediaUrl: ref_.fileUri,
      thumbnailUrl: ref_.fileUri,
      fileName: ref_.fileName || file.name,
      fileSize: ref_.fileSize || file.size,
      mimeType: file.type
    })
    scrollToBottom(true)
  } catch (err: any) {
    toast.push('图片发送失败：' + (err && err.message ? err.message : '请重试'), 'error')
  } finally {
    sendingMedia.value = false
    uploadTip.value = ''
  }
}

async function onPickFile(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input && input.files && input.files[0]
  input.value = ''
  if (!file || !chat.activeSessionId || sendingMedia.value) return
  if (file.size > 500 * 1024 * 1024) {
    toast.push('文件过大，请选择 500MB 以内的文件', 'error')
    return
  }
  sendingMedia.value = true
  uploadTip.value = '正在上传文件…'
  try {
    const res = await uploadChatFile(file)
    const ref_ = fileRefOf(res)
    if (!ref_ || !ref_.fileId) throw new Error('上传失败：未返回文件')
    uploadTip.value = '文件已上传，发送中…'
    await chat.sendFile(chat.activeSessionId, {
      fileId: ref_.fileId,
      mediaUrl: ref_.fileUri,
      fileName: ref_.fileName || file.name,
      fileSize: ref_.fileSize || file.size,
      mimeType: file.type || 'application/octet-stream'
    })
    scrollToBottom(true)
  } catch (err: any) {
    toast.push('文件发送失败：' + (err && err.message ? err.message : '请重试'), 'error')
  } finally {
    sendingMedia.value = false
    uploadTip.value = ''
  }
}
function timeText(t: any): string {
  const d = new Date(t)
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return sameDay ? `${hh}:${mm}` : `${d.getMonth() + 1}/${d.getDate()} ${hh}:${mm}`
}

function closeGroupMode() {
  router.replace({ path: '/chat' })
}

// 移动端返回会话列表（由头部返回按钮触发；桌面端该按钮隐藏）
function goBackList() {
  router.push({ path: '/chat' })
}

async function send() {
  const content = draft.value.trim()
  if (!content || sending.value || !chat.activeSessionId) return
  sending.value = true
  try {
    await chat.sendText(chat.activeSessionId, content)
    draft.value = ''
    resetDraftHeight()
    scrollToBottom(true)
  } catch (e) {
    toast.push('发送失败，请重试', 'error')
  } finally {
    sending.value = false
  }
}

async function retryMessage(m: any) {
  if (!chat.activeSessionId || m.status !== -1) return
  try {
    await chat.retryMessage(chat.activeSessionId, m.messageId)
    toast.push('已重新发送', 'success')
  } catch (e) {
    toast.push('重试失败，请稍后再试', 'error')
  }
}

function onEnter(e: KeyboardEvent) {
  if (e.isComposing || e.keyCode === 229) return
  send()
}

function onInput(e: Event) {
  notifyTyping()
  autoGrow(e.target as HTMLTextAreaElement)
}

function notifyTyping() {
  if (!chat.activeSessionId) return
  if (typingTimer) clearTimeout(typingTimer)
  typingTimer = setTimeout(() => chat.sendTyping(chat.activeSessionId), 500)
}

function autoGrow(el: HTMLElement) {
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 120) + 'px'
}

function resetDraftHeight() {
  nextTick(() => {
    if (draftBox.value) {
      draftBox.value.style.height = 'auto'
      draftBox.value.style.height = Math.min(draftBox.value.scrollHeight, 120) + 'px'
    }
  })
}

function scrollToBottom(force: boolean = false) {
  if (scrollLock && !force) return
  nextTick(() => {
    if (msgBox.value) msgBox.value.scrollTop = msgBox.value.scrollHeight
  })
}

async function loadOlder() {
  const id = chat.activeSessionId
  if (!id || !msgBox.value) return
  const oldHeight = msgBox.value.scrollHeight
  scrollLock = true
  await chat.loadMessages(id, false)
  await nextTick()
  if (msgBox.value) msgBox.value.scrollTop = msgBox.value.scrollHeight - oldHeight
  scrollLock = false
}

function onScroll() {
  if (msgBox.value && msgBox.value.scrollTop <= 40) loadOlder()
}

watch(() => activeMessages.value.length, () => scrollToBottom())
watch(() => chat.activeSessionId, async (id) => {
  if (id) {
    await chat.openSession(id)
    chat.clearUnread(id)
    await chat.markSessionRead(id).catch(() => {})
    scrollToBottom(true)
  }
})
watch(() => route.params.sessionId, async (rawId) => {
  const id = typeof rawId === 'string' ? rawId : (rawId as string[])?.[0] ?? ''
  if (id) {
    const s = chat.sessions.find(x => x.sessionId === id)
    if (s) {
      chat.activeSessionId = id
      await chat.openSession(id)
      chat.clearUnread(id)
      await chat.markSessionRead(id).catch(() => {})
      scrollToBottom(true)
    } else {
      await chat.loadSessions()
      const s2 = chat.sessions.find(x => x.sessionId === id)
      if (s2) {
        chat.activeSessionId = id
        await chat.openSession(id)
        chat.clearUnread(id)
        await chat.markSessionRead(id).catch(() => {})
        scrollToBottom(true)
      }
    }
  }
}, { immediate: true })

onMounted(async () => {
  await Promise.all([chat.loadSessions(), chat.loadFriends(), chat.loadGroups(), chat.loadUnread()])
  await chat.initRealtime()
  const rawId = route.params.sessionId
  const id = typeof rawId === 'string' ? rawId : (rawId as string[])?.[0] ?? ''
  if (id) {
    const s = chat.sessions.find(x => x.sessionId === id)
    if (s) {
      chat.activeSessionId = id
      await chat.openSession(id)
      chat.clearUnread(id)
      await chat.markSessionRead(id).catch(() => {})
      scrollToBottom(true)
    }
  }
})

onBeforeUnmount(() => {
  if (typingTimer) clearTimeout(typingTimer)
})
</script>
