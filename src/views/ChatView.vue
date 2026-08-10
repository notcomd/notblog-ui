<template>
  <div class="max-w-[1400px] mx-auto flex gap-5 h-[calc(100vh-7.5rem)]">
    <!-- ===== 左：会话列表 ===== -->
    <div class="w-80 shrink-0 flex flex-col glass-card p-3 min-h-0">
      <!-- Tab：好友 | 群聊 -->
      <div class="flex gap-1 glass p-1 rounded-[5%] mb-3">
        <button class="flex-1 py-2 rounded-[5%] text-sm font-medium transition-all" :class="tab === 'friends' ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 dark:text-zinc-200'" @click="switchTab('friends')">好友列表</button>
        <button class="flex-1 py-2 rounded-[5%] text-sm font-medium transition-all" :class="tab === 'groups' ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 dark:text-zinc-200'" @click="switchTab('groups')">群聊列表</button>
      </div>

      <!-- 会话列表 -->
      <div class="flex-1 overflow-y-auto space-y-1 min-h-0">
        <div v-if="tab === 'friends' && friendSessions.length === 0 && !sessionsLoading" class="py-12 flex flex-col items-center gap-2 text-zinc-400">
          <div class="text-4xl">💬</div>
          <p class="text-xs">暂无会话，去好友列表发起聊天吧</p>
        </div>
        <button
          v-for="s in visibleSessions"
          :key="s.sessionId"
          class="w-full flex items-center gap-3 px-3 py-2.5 rounded-[5%] transition-all text-left"
          :class="chat.activeSessionId === s.sessionId ? 'bg-gradient-to-r from-amber-400/15 to-orange-400/10 ' : 'hover:bg-white/60 dark:hover:bg-zinc-800/60'"
          @click="openChat(s)"
        >
          <div class="relative shrink-0">
            <img :src="sessionAvatar(s)" alt="" class="w-11 h-11 rounded-[5%] object-cover border border-white/60 dark:border-white/10" @error="hideImg" />
            <!-- 实时在线状态（好友单聊） -->
            <span v-if="isFriendSession(s)" class="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-zinc-800" :class="isOnline(s) ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-600'"></span>
          </div>
          <span class="flex-1 min-w-0">
            <span class="flex items-center justify-between">
              <span class="text-sm font-medium text-zinc-700 dark:text-zinc-200 truncate">{{ sessionTitle(s) }}</span>
              <span class="text-[10px] text-zinc-400 shrink-0 ml-2">{{ sessionTime(s) }}</span>
            </span>
            <span class="flex items-center justify-between mt-0.5">
              <span class="text-xs text-zinc-400 truncate">
                <span v-if="chat.typing[s.sessionId]" class="text-emerald-500">正在输入...</span>
                <span v-else>{{ s.lastMessageContent || '暂无消息' }}</span>
              </span>
              <span v-if="s.unreadCount > 0" class="min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0 ml-2">{{ s.unreadCount }}</span>
            </span>
          </span>
          <!-- 会话操作 -->
          <span class="relative shrink-0" @click.stop>
            <button class="w-6 h-6 rounded-lg flex items-center justify-center text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-zinc-700/60 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors" @click="sessionMenuTarget = sessionMenuTarget === s.sessionId ? null : s.sessionId">
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>
            </button>
            <div v-if="sessionMenuTarget === s.sessionId" class="absolute right-0 top-full mt-1 w-36 glass-card p-1.5 z-50">
              <button class="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs text-zinc-600 dark:text-zinc-300 hover:bg-white/70 dark:hover:bg-zinc-800/70 transition-colors" @click="togglePin(s)">{{ s.isPinned ? '取消置顶' : '📌 置顶' }}</button>
              <button class="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs text-zinc-600 dark:text-zinc-300 hover:bg-white/70 dark:hover:bg-zinc-800/70 transition-colors" @click="toggleMute(s)">{{ s.isMuted ? '恢复提醒' : '🔕 免打扰' }}</button>
              <button class="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs text-red-500 hover:bg-red-500/10 transition-colors" @click="removeSession(s)">🗑 删除会话</button>
            </div>
          </span>
        </button>
      </div>
    </div>

    <!-- ===== 右：聊天窗 ===== -->
    <div class="flex-1 min-w-0 glass-card flex flex-col min-h-0">
      <!-- 顶部：会话标题栏（居中显示会话者名称，左侧通话/视频/更多按钮） -->
      <div v-if="active" class="relative px-5 py-3 border-b border-zinc-200/60 dark:border-zinc-700/60 flex items-center justify-center shrink-0">
        <!-- 左侧操作按钮组 -->
        <div class="absolute left-4 flex items-center gap-1.5">
          <button class="w-9 h-9 rounded-[5%] flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:bg-white/60 dark:hover:bg-zinc-800/60 hover:text-emerald-500 transition-colors" title="语音通话" @click="toast.push('语音通话开发中（Phase 8）', 'info')">
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
          </button>
          <button class="w-9 h-9 rounded-[5%] flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:bg-white/60 dark:hover:bg-zinc-800/60 hover:text-amber-500 transition-colors" title="视频通话" @click="toast.push('视频通话开发中（Phase 8）', 'info')">
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 7l-7 5 7 5V7z" /><rect x="1" y="5" width="15" height="14" rx="2" /></svg>
          </button>
          <!-- 更多（会话操作下拉） -->
          <div class="relative">
            <button class="w-9 h-9 rounded-[5%] flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:bg-white/60 dark:hover:bg-zinc-800/60 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors" title="更多" @click="headerMoreOpen = !headerMoreOpen">
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>
            </button>
            <div v-if="headerMoreOpen" class="absolute left-0 top-full mt-1 w-36 glass-card p-1.5 z-50">
              <button class="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs text-zinc-600 dark:text-zinc-300 hover:bg-white/70 dark:hover:bg-zinc-800/70 transition-colors" @click="togglePin(active)">{{ active.isPinned ? '取消置顶' : '📌 置顶' }}</button>
              <button class="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs text-zinc-600 dark:text-zinc-300 hover:bg-white/70 dark:hover:bg-zinc-800/70 transition-colors" @click="toggleMute(active)">{{ active.isMuted ? '恢复提醒' : '🔕 免打扰' }}</button>
              <button class="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs text-red-500 hover:bg-red-500/10 transition-colors" @click="removeSession(active)">🗑 删除会话</button>
            </div>
          </div>
        </div>
        <!-- 居中：会话者头像 + 名称 + 状态 -->
        <div class="flex items-center gap-3">
          <img :src="sessionAvatar(active)" alt="" class="w-9 h-9 rounded-[5%] object-cover" @error="hideImg" />
          <div>
            <div class="text-sm font-semibold text-zinc-800 dark:text-zinc-100">{{ sessionTitle(active) }}</div>
            <div class="text-xs text-zinc-400 mt-0.5 text-center">
              <span v-if="isFriendSession(active)">
                <span class="inline-block w-2 h-2 rounded-full mr-1" :class="isOnline(active) ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-600'"></span>
                {{ isOnline(active) ? '在线' : '离线' }}
              </span>
              <span v-else>{{ active.participants ? active.participants.length : 0 }} 位成员</span>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="px-5 py-3.5 border-b border-zinc-200/60 dark:border-zinc-700/60 text-sm text-zinc-400 shrink-0">会话</div>

      <!-- 中部：消息气泡流 -->
      <div ref="msgBox" class="flex-1 overflow-y-auto px-5 py-4 space-y-3 min-h-0 bg-gradient-to-b from-transparent to-amber-50/30 dark:to-transparent">
        <div v-if="!active" class="h-full flex flex-col items-center justify-center gap-3 text-zinc-400">
          <div class="text-6xl">💬</div>
          <p class="text-sm">选择一个会话开始聊天</p>
        </div>
        <template v-else>
          <!-- 加载更多 -->
          <div v-if="chat.hasMoreMessages[active.sessionId]" class="text-center">
            <button class="text-xs text-zinc-400 hover:text-amber-500 transition-colors" @click="loadOlder">加载更早的消息</button>
          </div>
          <!-- 消息 -->
          <div v-for="m in activeMessages" :key="m.messageId" class="flex" :class="m.senderId === myId ? 'justify-end' : 'justify-start'">
            <div class="max-w-[70%]">
              <div v-if="m.isRecalled" class="px-4 py-2 rounded-[5%] text-xs text-zinc-400 bg-zinc-100 dark:bg-zinc-800/60">消息已撤回</div>
              <div v-else class="px-4 py-2.5 rounded-[5%] text-sm leading-relaxed break-words"
                :class="m.senderId === myId ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-white rounded-br-md' : 'bg-white/80 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-200 rounded-bl-md'">
                {{ m.content }}
              </div>
              <div class="text-[10px] text-zinc-400 mt-1 px-1" :class="m.senderId === myId ? 'text-right' : ''">
                {{ timeText(m.sentTime) }}
              </div>
            </div>
          </div>
          <!-- 正在输入 -->
          <div v-if="chat.typing[active.sessionId]" class="flex justify-start">
            <div class="px-4 py-2.5 rounded-[5%] bg-white/80 dark:bg-zinc-800/80 text-xs text-zinc-400 flex items-center gap-1">
              <span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>
              <span class="ml-1">正在输入...</span>
            </div>
          </div>
        </template>
      </div>

      <!-- 底部：输入区 -->
      <div v-if="active" class="px-5 py-3.5 border-t border-zinc-200/60 dark:border-zinc-700/60 shrink-0">
        <div class="flex items-end gap-2">
          <div class="relative flex-1">
            <textarea
              v-model="draft"
              rows="2"
              class="w-full resize-none rounded-[5%] bg-white/60 dark:bg-zinc-800/60 border border-white/50 dark:border-white/10 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-400/50 transition-all"
              placeholder="输入消息，Enter 发送"
              @keydown.enter.exact.prevent="send"
              @input="notifyTyping"
            ></textarea>
            <div v-if="emojiOpen" class="absolute bottom-full left-0 mb-2 glass-card p-2 w-64 z-20">
              <div class="grid grid-cols-8 gap-1">
                <button v-for="e in EMOJIS" :key="e" class="w-7 h-7 rounded-[5%] hover:bg-amber-50 dark:hover:bg-zinc-800 text-base transition-colors" @click="insertEmoji(e)">{{ e }}</button>
              </div>
            </div>
          </div>
          <button class="w-9 h-9 rounded-[5%] flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:bg-white/60 dark:hover:bg-zinc-800/60 transition-colors" title="表情" @click="emojiOpen = !emojiOpen">
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" /></svg>
          </button>
          <button class="w-9 h-9 rounded-[5%] flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:bg-white/60 dark:hover:bg-zinc-800/60 transition-colors" title="图片/文件上传（Phase 7）" @click="toast.push('附件上传开发中（Phase 7）', 'info')">
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="4" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>
          </button>
          <button class="h-10 px-4 rounded-[5%] bg-gradient-to-r from-amber-400 to-orange-500 text-white text-sm font-medium hover: active:scale-95 transition-all disabled:opacity-50" :disabled="!draft.trim() || sending" @click="send">发送</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default { name: 'ChatView' }
</script>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useChatStore } from '@/stores/chat'
import { pinSession, unpinSession, muteSession, unmuteSession, deleteSession } from '@/api/chat'
import { useToastStore } from '@/stores/toast'
import { relativeTime } from '@/utils/format'

const chat = useChatStore()
const toast = useToastStore()
const route = useRoute()

const tab = ref('friends')
const draft = ref('')
const emojiOpen = ref(false)
const sending = ref(false)
const sessionsLoading = ref(true)
const msgBox = ref(null)
let typingTimer = null
let scrollLock = false

const EMOJIS = ['😀', '😄', '😂', '🤣', '😊', '😍', '😘', '🥰', '😎', '🤔', '👍', '👏', '🙏', '💪', '🔥', '🎉', '❤️', '⭐', '🌹', '🍻', '☕', '🎂', '🚀', '🌈', '🌊', '🏔️', '🐱', '🐶', '🍀', '✨']

const myId = computed(() => chat.currentUserId ? chat.currentUserId() : '')
const active = computed(() => chat.sessions.find(s => s.sessionId === chat.activeSessionId) || null)
const activeMessages = computed(() => (chat.activeSessionId && chat.messages[chat.activeSessionId]) || [])
const friendSessions = computed(() => chat.sessions.filter(s => !s.groupId))
const groupSessions = computed(() => chat.sessions.filter(s => !!s.groupId))
const visibleSessions = computed(() => tab.value === 'friends' ? friendSessions.value : groupSessions.value)

function switchTab(t) {
  tab.value = t
}

// ===== 会话操作（真实端点 /api/sessions） =====
const sessionMenuTarget = ref(null)
// 标题栏"更多"下拉
const headerMoreOpen = ref(false)

async function togglePin(s) {
  try {
    if (s.isPinned) await unpinSession(s.sessionId)
    else await pinSession(s.sessionId)
    s.isPinned = !s.isPinned
    toast.push(s.isPinned ? '已置顶会话' : '已取消置顶', 'success')
  } catch (e) {
    toast.push('操作失败（后端未就绪）', 'error')
  }
}

async function toggleMute(s) {
  try {
    if (s.isMuted) await unmuteSession(s.sessionId)
    else await muteSession(s.sessionId)
    s.isMuted = !s.isMuted
    toast.push(s.isMuted ? '已开启免打扰' : '已恢复提醒', 'success')
  } catch (e) {
    toast.push('操作失败（后端未就绪）', 'error')
  }
}

async function removeSession(s) {
  try {
    await deleteSession(s.sessionId)
    chat.removeSession(s.sessionId)
    toast.push('会话已删除', 'success')
  } catch (e) {
    toast.push('删除失败（后端未就绪）', 'error')
  }
}

function isFriendSession(s) {
  return !s.groupId
}

function isOnline(s) {
  const peerId = chat.peerIdOf(s.sessionId)
  return chat.onlineUsers[String(peerId)] === true
}

function sessionTitle(s) {
  if (s.sessionName) return s.sessionName
  const peerId = chat.peerIdOf(s.sessionId)
  const f = chat.friends.find(x => String(x.friendId) === String(peerId))
  return f ? f.friendName : '会话'
}

function sessionAvatar(s) {
  if (s.groupId) {
    const g = chat.groups.find(x => String(x.id) === String(s.groupId))
    if (g && g.avatarUrl) return g.avatarUrl
  }
  const peerId = chat.peerIdOf(s.sessionId)
  const f = chat.friends.find(x => String(x.friendId) === String(peerId))
  return f ? f.friendAvatar : 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="#d6d3d1"/><text x="50" y="60" font-size="36" text-anchor="middle" fill="white">💬</text></svg>')
}

function sessionTime(s) {
  return relativeTime(s.lastMessageTime || s.createdTime)
}

function timeText(t) {
  const d = new Date(t)
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return sameDay ? `${hh}:${mm}` : `${d.getMonth() + 1}/${d.getDate()} ${hh}:${mm}`
}

async function openChat(s) {
  await chat.openSession(s.sessionId)
  chat.clearUnread(s.sessionId)
  scrollToBottom(true)
}

async function loadOlder() {
  const id = chat.activeSessionId
  const oldHeight = msgBox.value ? msgBox.value.scrollHeight : 0
  scrollLock = true
  await chat.loadMessages(id, false)
  await nextTick()
  if (msgBox.value) msgBox.value.scrollTop = msgBox.value.scrollHeight - oldHeight
  scrollLock = false
}

async function send() {
  const content = draft.value.trim()
  if (!content || sending.value || !chat.activeSessionId) return
  sending.value = true
  try {
    await chat.sendText(chat.activeSessionId, content)
    draft.value = ''
    scrollToBottom(true)
  } catch (e) {
    toast.push('发送失败，请重试', 'error')
  } finally {
    sending.value = false
  }
}

function notifyTyping() {
  if (!chat.activeSessionId) return
  if (typingTimer) clearTimeout(typingTimer)
  typingTimer = setTimeout(() => chat.sendTyping(chat.activeSessionId), 500)
}

function insertEmoji(e) {
  draft.value += e
  emojiOpen.value = false
}

function scrollToBottom(force = false) {
  if (scrollLock && !force) return
  nextTick(() => {
    if (msgBox.value) msgBox.value.scrollTop = msgBox.value.scrollHeight
  })
}

function hideImg(e) {
  e.target.style.visibility = 'hidden'
}

// 新消息到达自动滚动到底
watch(() => activeMessages.value.length, () => scrollToBottom())

// 路由参数直达会话（/chat/:sessionId）
watch(() => route.params.sessionId, async (id) => {
  if (id) {
    const s = chat.sessions.find(x => x.sessionId === id)
    if (s) openChat(s)
    else {
      await chat.loadSessions()
      const s2 = chat.sessions.find(x => x.sessionId === id)
      if (s2) openChat(s2)
    }
  }
})

onMounted(async () => {
  await Promise.all([chat.loadSessions(), chat.loadFriends(), chat.loadGroups(), chat.loadUnread()])
  sessionsLoading.value = false
  await chat.initRealtime()
  // 进入已有会话时标记已读
  if (chat.activeSessionId) chat.markSessionRead(chat.activeSessionId)
  const id = route.params.sessionId
  if (id) {
    const s = chat.sessions.find(x => x.sessionId === id)
    if (s) openChat(s)
  }
})

onBeforeUnmount(() => {
  if (typingTimer) clearTimeout(typingTimer)
})
</script>

<style scoped>
.typing-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #a1a1aa;
  display: inline-block;
  animation: typing-bounce 1.2s infinite ease-in-out;
}

.typing-dot:nth-child(2) {
  animation-delay: 0.15s;
}

.typing-dot:nth-child(3) {
  animation-delay: 0.3s;
}

@keyframes typing-bounce {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
  30% { transform: translateY(-4px); opacity: 1; }
}
</style>
