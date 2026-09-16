<template>
  <!-- 会话主视窗：聊天消息、输入框、创建/搜索群聊面板 -->
  <div class="flex-1 min-w-0 glass-card flex flex-col min-h-0">
    <ChatGroupDialogs v-if="mode" :mode="mode" @close="closeGroupMode" />

    <template v-else>
      <!-- 会话头部 -->
      <div class="flex items-center gap-3 px-5 py-3 border-b border-zinc-200/60 dark:border-zinc-700/60 shrink-0">
        <div class="flex-1 min-w-0">
          <div class="text-sm font-semibold text-zinc-800 dark:text-zinc-100 truncate">{{ activeTitle }}</div>
          <div class="text-xs text-zinc-400 truncate">{{ activeSubtitle }}</div>
        </div>
        <!-- 通话操作（私聊/群聊会话；AI/匿名会话不可通话） -->
        <template v-if="active && canCall">
          <button
            class="h-8 w-8 rounded-full bg-white/60 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-300 hover:text-emerald-500 dark:hover:text-emerald-400 flex items-center justify-center transition-colors"
            title="语音通话" aria-label="语音通话" @click="startCall('Audio')">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path
                d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
          </button>
          <button
            class="h-8 w-8 rounded-full bg-white/60 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-300 hover:text-amber-500 dark:hover:text-amber-400 flex items-center justify-center transition-colors"
            title="视频通话" aria-label="视频通话" @click="startCall('Video')">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <polygon points="23 7 16 12 23 17 23 7" />
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
          </button>
        </template>
        <button v-if="active && active.groupId"
          class="h-8 px-3 rounded-[5%] text-xs bg-white/60 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-300"
          @click="memberOpen = !memberOpen">成员</button>
        <!-- 进行中的房间入口（群组） -->
        <button v-if="active && active.groupId"
          class="relative h-8 px-3 rounded-[5%] text-xs bg-white/60 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-300 hover:text-amber-500 dark:hover:text-amber-400 transition-colors"
          title="进行中的语音/视频房间" aria-label="进行中的房间" @click="roomOpen = true">
          房间
          <span v-if="rooms.length"
            class="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] flex items-center justify-center">
            {{ rooms.length }}
          </span>
        </button>
      </div>

      <!-- 进行中的房间快捷条（群组） -->
      <div v-if="active && active.groupId && rooms.length"
        class="px-5 py-2 border-b border-zinc-200/60 dark:border-zinc-700/60 flex items-center gap-2 overflow-x-auto overscroll-contain">
        <button v-for="r in rooms" :key="r.callId"
          class="shrink-0 h-7 px-3 rounded-full bg-white/60 dark:bg-zinc-800/60 text-xs text-zinc-600 dark:text-zinc-300 flex items-center gap-1.5 hover:text-amber-500 dark:hover:text-amber-400 transition-colors"
          :title="r.type === 'Video' ? '视频房' : '语音房' + (r.requiresPassword ? '（需密码）' : '')"
          @click="joinRoom(r)">
          {{ r.type === 'Video' ? '📹' : '🎤' }} {{ r.type === 'Video' ? '视频' : '语音' }}房
          <span class="text-[10px] opacity-70">{{ (r.joinedMembers || []).length }}人</span>
          <span v-if="r.requiresPassword" class="text-[10px] opacity-70">🔒</span>
        </button>
      </div>

      <!-- 发起邀请对话框 -->
      <CallInviteDialog
        v-if="inviteOpen && active"
        :session-id="active.sessionId"
        :type="inviteType"
        :members="inviteMembers"
        @close="inviteOpen = false"
      />
      <!-- 房间列表对话框 -->
      <RoomJoinDialog
        v-if="roomOpen && active"
        :session-id="active.sessionId"
        :rooms="rooms"
        @close="roomOpen = false"
        @refresh="refreshRooms"
      />

      <!-- 群成员下拉 -->
      <div v-if="memberOpen"
        class="px-5 py-3 border-b border-zinc-200/60 dark:border-zinc-700/60 max-h-48 overflow-y-auto overscroll-contain">
        <div v-for="m in members" :key="m.id"
          class="flex items-center gap-2 py-1 text-sm text-zinc-600 dark:text-zinc-300">
          <img :src="m.avatar || demoAvatar('友', '#a1a1aa')" alt="" class="w-7 h-7 rounded-[10px] object-cover" />
          <span>{{ m.name }}</span>
          <span class="ml-auto w-2 h-2 rounded-full"
            :class="m.online ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-600'"></span>
        </div>
      </div>

      <!-- 消息列表 -->
      <div ref="msgBox" class="flex-1 overflow-y-auto px-5 py-4 min-h-0 space-y-3" @scroll="onScroll">
        <div v-if="!active" class="py-24 text-center text-sm text-zinc-400">选择一个会话开始聊天</div>
        <template v-else>
          <div v-for="m in activeMessages" :key="m.messageId" class="flex items-start gap-2.5"
            :class="isMine(m) ? 'justify-end' : 'justify-start'">
            <!-- 发送者头像（自己的排到气泡右侧） -->
            <img :src="senderAvatar(m)" alt=""
              class="w-8 h-8 rounded-[10px] object-cover border border-white/60 dark:border-white/10 shrink-0"
              :class="isMine(m) ? 'order-2' : ''" @error="hideImg" />
            <div class="min-w-0 max-w-[70%] flex flex-col" :class="isMine(m) ? 'items-end' : 'items-start'">
              <span class="text-xs text-zinc-400 px-1 pb-0.5 truncate max-w-[220px]">{{ senderName(m) }}</span>
              <div class="rounded-[10px] px-3 py-2 text-sm"
                :class="isMine(m) ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-white' : 'bg-white/70 dark:bg-zinc-800/70 text-zinc-700 dark:text-zinc-200'">
                <!-- 图片消息：点击新窗口查看原图 -->
                <a v-if="m.messageType === MessageType.Image && m.mediaUrl" :href="m.mediaUrl" target="_blank" rel="noopener" class="block">
                  <img :src="m.mediaUrl" alt="图片消息" class="max-w-[260px] max-h-[260px] rounded-[10px] object-cover" @error="hideImg" />
                </a>
                <!-- 文件消息：文件名 + 体积，点击下载 -->
                <a v-else-if="m.messageType === MessageType.File && m.mediaUrl" :href="m.mediaUrl" target="_blank" rel="noopener" class="flex items-center gap-2 min-w-[150px]">
                  <svg aria-hidden="true" class="w-8 h-8 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  <span class="min-w-0">
                    <span class="block truncate">{{ m.fileName || '文件' }}</span>
                    <span class="block text-[11px] opacity-70">{{ formatSize(m.fileSize) }}</span>
                  </span>
                </a>
                <div v-else class="whitespace-pre-wrap break-words">{{ m.content }}</div>
                <div class="mt-1 flex items-center gap-2 text-[10px] opacity-70">
                  <span>{{ timeText(m.sentTime) }}</span>
                  <span v-if="isMine(m) && m.status === 0">发送中…</span>
                  <span v-else-if="isMine(m) && m.status === -1" class="text-red-200 cursor-pointer"
                    @click="retryMessage(m)" role="button" tabindex="0" @keydown.enter.prevent="retryMessage(m)"
                    @keydown.space.prevent="retryMessage(m)">发送失败，点击重试</span>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>

      <!-- 输入区：表情 / 图片 / 文件 + 文本 + 发送 -->
      <div class="border-t border-zinc-200/60 dark:border-zinc-700/60 p-3 flex items-end gap-2">
        <!-- 表情：弹出面板，插入到光标处 -->
        <div class="relative shrink-0">
          <button
            class="w-10 h-10 rounded-[10px] flex items-center justify-center text-zinc-500 dark:text-zinc-300 hover:bg-white/60 dark:hover:bg-zinc-800/60 transition-colors"
            title="表情" aria-label="表情" @click="emojiOpen = !emojiOpen">
            <svg aria-hidden="true" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
          </button>
          <div v-if="emojiOpen" class="fixed inset-0 z-[60]" @click="emojiOpen = false"></div>
          <div v-if="emojiOpen" class="absolute bottom-full left-0 mb-2 w-[272px] glass-card p-2 grid grid-cols-8 gap-0.5 z-[70]">
            <button v-for="e in EMOJIS" :key="e" class="h-8 rounded-[10px] text-lg leading-none hover:bg-white/70 dark:hover:bg-zinc-800/70 transition-colors" @click="insertEmoji(e)">{{ e }}</button>
          </div>
        </div>
        <!-- 图片：选择后上传并发送图片消息 -->
        <button
          class="w-10 h-10 rounded-[10px] flex items-center justify-center text-zinc-500 dark:text-zinc-300 hover:bg-white/60 dark:hover:bg-zinc-800/60 transition-colors disabled:opacity-40 shrink-0"
          title="图片" aria-label="图片" :disabled="uploading" @click="pickImage">
          <svg aria-hidden="true" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
        </button>
        <!-- 文件：选择后上传并发送文件消息 -->
        <button
          class="w-10 h-10 rounded-[10px] flex items-center justify-center text-zinc-500 dark:text-zinc-300 hover:bg-white/60 dark:hover:bg-zinc-800/60 transition-colors disabled:opacity-40 shrink-0"
          title="文件" aria-label="文件" :disabled="uploading" @click="pickFile">
          <svg aria-hidden="true" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
        </button>
        <input ref="imageInput" type="file" accept="image/*" class="hidden" @change="onImagePicked" />
        <input ref="fileInput" type="file" class="hidden" @change="onFilePicked" />

        <textarea ref="draftBox" v-model="draft" rows="1" name="messageInput" aria-label="消息输入"
          class="flex-1 resize-none rounded-[10px] bg-white/70 dark:bg-zinc-800/70 border border-white/60 dark:border-white/10 px-3 py-2.5 text-sm outline-none max-h-[120px]"
          placeholder="输入消息，Enter 发送，Shift+Enter 换行" @keydown.enter.exact.prevent="onEnter" @input="onInput"></textarea>
        <span v-if="uploading" class="text-xs text-zinc-400 shrink-0 pb-2.5">上传中…</span>
        <button
          class="h-10 px-4 rounded-[10px] bg-gradient-to-r from-amber-400 to-orange-500 text-white text-sm font-medium shrink-0 disabled:opacity-50"
          :disabled="!draft.trim() || sending" @click="send">发送</button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
// 会话主视窗：负责消息展示、发送、失败重试、输入状态、滚动加载和群聊面板切换
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { charAvatar as demoAvatar } from '@/utils/avatar'
import { useRoute, useRouter } from 'vue-router'
import { useChatStore } from '@/stores/chat'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import { useCallStore, type CallPayload } from '@/stores/call'
import { uploadImage } from '@/api/publish'
import { uploadChatFile, MessageType } from '@/api/chat'
import { unwrap } from '@/utils/response'
import { formatSize } from '@/utils/format'
import ChatGroupDialogs from '@/components/chat/ChatGroupDialogs.vue'
import CallInviteDialog from '@/components/chat/CallInviteDialog.vue'
import RoomJoinDialog from '@/components/chat/RoomJoinDialog.vue'

const chat = useChatStore()
const auth = useAuthStore()
const toast = useToastStore()
const call = useCallStore()
const route = useRoute()
const router = useRouter()

const draft = ref('')
const sending = ref(false)
const msgBox = ref<HTMLElement | null>(null)
const draftBox = ref<HTMLTextAreaElement | null>(null)
const memberOpen = ref(false)
const emojiOpen = ref(false)
const uploading = ref(false)
const imageInput = ref<HTMLInputElement | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
// 群组房间：邀请对话框 + 房间列表
const inviteOpen = ref(false)
const inviteType = ref<'Audio' | 'Video'>('Audio')
const roomOpen = ref(false)
const rooms = ref<CallPayload[]>([])
const MAX_IMAGE_SIZE = 10 * 1024 * 1024
const MAX_FILE_SIZE = 50 * 1024 * 1024
// 表情面板：常用表情，插入到输入框光标处
const EMOJIS: string[] = ['😀','😄','😁','😆','😅','😂','🙂','😉','😊','😍','😘','😜','🤗','🤔','😐','😴','😢','😭','😡','🥺','👍','👌','🙏','👏','💪','🎉','🔥','❤️','💡','🌟','☕','🍔','🍺','🌈','✅','❌','⏰','📌','🚀','🎁']
let typingTimer: ReturnType<typeof setTimeout> | null = null
let scrollLock = false

const mode = computed(() => route.query.action === 'createGroup' ? 'create' : route.query.action === 'searchGroup' ? 'search' : '')
const active = computed(() => chat.sessions.find(s => s.sessionId === chat.activeSessionId) || null)
const activeMessages = computed(() => (chat.activeSessionId && chat.messages[chat.activeSessionId]) || [])
const myId = computed(() => chat.currentUserId ? chat.currentUserId() : '')
const activeTitle = computed(() => active.value ? (active.value.sessionName || '会话') : 'MonoHub')
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

// 邀请对话框成员：群组成员（排除自己）
const inviteMembers = computed(() => members.value.filter((m) => m.id !== String(myId.value)))

function startCall(type: 'Audio' | 'Video') {
  if (!active.value) return
  if (active.value.groupId) {
    // 群组：打开邀请对话框（选择成员 + 可选密码）
    inviteType.value = type
    inviteOpen.value = true
    return
  }
  // 私聊：直接发起即时呼叫
  call.startCall(active.value.sessionId, type)
}

/** 刷新会话下的活跃房间（群组） */
async function refreshRooms() {
  const a = active.value
  if (!a || !a.groupId) {
    rooms.value = []
    return
  }
  rooms.value = await call.getSessionRooms(a.sessionId)
}

/** 快捷条加入房间：需密码则打开房间对话框，否则直接加入 */
async function joinRoom(r: CallPayload) {
  if (r.requiresPassword) {
    roomOpen.value = true
    return
  }
  await call.joinCall(r.callId)
}


function isMine(m: any): boolean {
  return String(m.senderId) === String(myId.value)
}

/** 按发送者 id 查好友（好友接口不返回头像，仅作昵称/头像的兜底来源） */
function friendOf(senderId: any) {
  return chat.friends.find(f => String(f.friendId) === String(senderId))
}

/** 发送者昵称：优先用户资料缓存，其次好友昵称，最后自己用登录名、对方用占位名 */
function senderName(m: any): string {
  const p = chat.profiles[String(m.senderId)]
  if (p && p.name) return p.name
  const f = friendOf(m.senderId)
  if (f && f.friendName) return String(f.friendName)
  return isMine(m) ? (auth.user && auth.user.name) || '我' : '用户'
}

/** 发送者头像：优先用户资料缓存，其次好友头像，最后按昵称首字生成矢量头像 */
function senderAvatar(m: any): string {
  const p = chat.profiles[String(m.senderId)]
  if (p && p.avatar) return p.avatar
  const f = friendOf(m.senderId)
  if (f && typeof f.friendAvatar === 'string' && f.friendAvatar) return f.friendAvatar
  return demoAvatar(senderName(m).charAt(0), isMine(m) ? '#f59e0b' : '#a1a1aa')
}

/** 补取当前会话出现的发送者资料（已缓存的 id 由 store 跳过，不会重复请求） */
function loadSenderProfiles(): void {
  const ids = activeMessages.value.map(m => String(m.senderId || '')).filter(Boolean)
  if (ids.length) chat.loadProfiles(ids)
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

/** 打开图片选择器（上传中不可重复触发） */
function pickImage(): void {
  if (!uploading.value) imageInput.value?.click()
}

/** 打开文件选择器（上传中不可重复触发） */
function pickFile(): void {
  if (!uploading.value) fileInput.value?.click()
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
  const res = isImage ? await uploadImage(file, 'chat-image') : await uploadChatFile(file)
  const data = unwrap(res) || {}
  const fileId = data.fileId || data.file_id || ''
  if (!fileId) throw new Error('上传未返回文件ID')
  return { fileId, url: data.fileUri || data.file_url || '' }
}

/** 选择图片 → 上传 → 发送图片消息 */
async function onImagePicked(e: Event): Promise<void> {
  const el = e.target as HTMLInputElement
  const file = el.files && el.files[0]
  el.value = ''
  if (!file || !chat.activeSessionId) return
  if (file.size > MAX_IMAGE_SIZE) {
    toast.push('图片不能超过 10MB', 'error')
    return
  }
  uploading.value = true
  try {
    const { fileId, url } = await uploadAttachment(file)
    await chat.sendMedia(chat.activeSessionId, {
      messageType: MessageType.Image,
      fileId,
      localUrl: url || URL.createObjectURL(file)
    })
    scrollToBottom(true)
  } catch (err) {
    toast.push('图片发送失败：' + ((err as Error).message || '请重试'), 'error')
  } finally {
    uploading.value = false
  }
}

/** 选择文件 → 上传 → 发送文件消息 */
async function onFilePicked(e: Event): Promise<void> {
  const el = e.target as HTMLInputElement
  const file = el.files && el.files[0]
  el.value = ''
  if (!file || !chat.activeSessionId) return
  if (file.size > MAX_FILE_SIZE) {
    toast.push('文件不能超过 50MB', 'error')
    return
  }
  uploading.value = true
  try {
    const { fileId, url } = await uploadAttachment(file)
    await chat.sendMedia(chat.activeSessionId, {
      messageType: MessageType.File,
      fileId,
      localUrl: url || URL.createObjectURL(file),
      fileName: file.name,
      fileSize: file.size
    })
    scrollToBottom(true)
  } catch (err) {
    toast.push('文件发送失败：' + ((err as Error).message || '请重试'), 'error')
  } finally {
    uploading.value = false
  }
}

function hideImg(e: Event): void {
  (e.target as HTMLElement).style.visibility = 'hidden'
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
  // 已无更多历史（hasMoreMessages=false）时不空转；undefined（尚未加载过）放行
  if (chat.hasMoreMessages[id] === false) return
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

watch(() => activeMessages.value.length, () => {
  scrollToBottom()
  loadSenderProfiles()
})
watch(() => chat.activeSessionId, async (id) => {
  if (id) {
    await chat.openSession(id)
    chat.clearUnread(id)
    await chat.markSessionRead(id).catch(() => { })
    loadSenderProfiles()
    scrollToBottom(true)
    await refreshRooms()
  }
})
watch(() => route.params.sessionId, async (id) => {
  if (id) {
    const s = chat.sessions.find(x => x.sessionId === id)
    if (s) {
      chat.activeSessionId = id as string
      await chat.openSession(id as string)
      chat.clearUnread(id as string)
      await chat.markSessionRead(id as string).catch(() => { })
      scrollToBottom(true)
    } else {
      await chat.loadSessions()
      const s2 = chat.sessions.find(x => x.sessionId === id)
      if (s2) {
        chat.activeSessionId = id as string
        await chat.openSession(id as string )
        chat.clearUnread(id as string)
        await chat.markSessionRead(id as string).catch(() => { })
        scrollToBottom(true)
      }
    }
  }
}, { immediate: true })

onMounted(async () => {
  await Promise.all([chat.loadSessions(), chat.loadFriends(), chat.loadGroups(), chat.loadUnread()])
  await chat.initRealtime()
  const id = route.params.sessionId
  if (id) {
    const s = chat.sessions.find(x => x.sessionId === id)
    if (s) {
      chat.activeSessionId = id as string
      await chat.openSession(id as string)
      chat.clearUnread(id as string)
      await chat.markSessionRead(id as string).catch(() => { })
      scrollToBottom(true) 
    }
  }
})

onBeforeUnmount(() => {
  if (typingTimer) clearTimeout(typingTimer)
})
</script>
