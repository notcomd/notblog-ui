<template>
  <!-- 会话主视窗：聊天消息、输入框、创建/搜索群聊面板 -->
  <div class="flex-1 min-w-0 glass-card flex flex-col min-h-0">
    <ChatGroupDialogs v-if="mode" :mode="mode" @close="closeGroupMode" />

    <template v-else>
      <!-- 会话头部 -->
      <div class="flex items-center gap-3 px-5 py-3 border-b border-zinc-200/60 dark:border-zinc-700/60 shrink-0">
        <!-- 移动端返回会话列表（桌面端隐藏） -->
        <button
          class="lg:hidden shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-zinc-500 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors"
          title="返回会话列表" aria-label="返回会话列表" @click="goBackList">
          <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
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
      </div>

      <!-- 群成员下拉 -->
      <div v-if="memberOpen"
        class="px-5 py-3 border-b border-zinc-200/60 dark:border-zinc-700/60 max-h-48 overflow-y-auto overscroll-contain">
        <div v-for="m in members" :key="m.id"
          class="flex items-center gap-2 py-1 text-sm text-zinc-600 dark:text-zinc-300">
          <img :src="m.avatar || demoAvatar('友', '#a1a1aa')" alt="" class="w-7 h-7 rounded-full object-cover" />
          <span>{{ m.name }}</span>
          <span class="ml-auto w-2 h-2 rounded-full"
            :class="m.online ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-600'"></span>
        </div>
      </div>

      <!-- 消息列表 -->
      <div ref="msgBox" class="flex-1 overflow-y-auto px-5 py-4 min-h-0 space-y-3" @scroll="onScroll">
        <div v-if="!active" class="py-24 text-center text-sm text-zinc-400">选择一个会话开始聊天</div>
        <template v-else>
          <div v-for="m in activeMessages" :key="m.messageId" class="flex"
            :class="isMine(m) ? 'justify-end' : 'justify-start'">
            <div class="max-w-[70%] rounded-[10px] px-3 py-2 text-sm"
              :class="isMine(m) ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-white' : 'bg-white/70 dark:bg-zinc-800/70 text-zinc-700 dark:text-zinc-200'">
              <div class="whitespace-pre-wrap break-words">{{ m.content }}</div>
              <div class="mt-1 flex items-center gap-2 text-[10px] opacity-70">
                <span>{{ timeText(m.sentTime) }}</span>
                <span v-if="isMine(m) && m.status === 0">发送中…</span>
                <span v-else-if="isMine(m) && m.status === -1" class="text-red-200 cursor-pointer"
                  @click="retryMessage(m)" role="button" tabindex="0" @keydown.enter.prevent="retryMessage(m)"
                  @keydown.space.prevent="retryMessage(m)">发送失败，点击重试</span>
              </div>
            </div>
          </div>
        </template>
      </div>

      <!-- 输入区 -->
      <div class="border-t border-zinc-200/60 dark:border-zinc-700/60 p-3 flex items-end gap-2">
        <textarea ref="draftBox" v-model="draft" rows="1" name="messageInput" aria-label="消息输入"
          class="flex-1 resize-none rounded-[5%] bg-white/70 dark:bg-zinc-800/70 border border-white/60 dark:border-white/10 px-3 py-2.5 text-sm outline-none max-h-[120px]"
          placeholder="输入消息，Enter 发送，Shift+Enter 换行" @keydown.enter.exact.prevent="onEnter" @input="onInput"></textarea>
        <button
          class="h-10 px-4 rounded-[5%] bg-gradient-to-r from-amber-400 to-orange-500 text-white text-sm font-medium shrink-0"
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
import { useToastStore } from '@/stores/toast'
import { useCallStore } from '@/stores/call'
import ChatGroupDialogs from '@/components/chat/ChatGroupDialogs.vue'

const chat = useChatStore()
const toast = useToastStore()
const call = useCallStore()
const route = useRoute()
const router = useRouter()

const draft = ref('')
const sending = ref(false)
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

function startCall(type: string) {
  if (!active.value) return
  call.startCall(active.value.sessionId, type)
}


function isMine(m: any): boolean {
  return String(m.senderId) === String(myId.value)
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
    await chat.markSessionRead(id).catch(() => { })
    scrollToBottom(true)
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
