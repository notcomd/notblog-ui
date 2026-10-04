<template>
  <!-- 会话主视窗：消息列表 + 输入区；容器扁平（仅发丝分隔线），与左侧列表及全站风格一致 -->
  <div class="flex-1 min-w-0 flex flex-col min-h-0">
    <!-- 功能面板：与消息视图共用右侧栏位（由 ChatPage 按路由 query 下发 panelMode） -->
    <ChatGroupPanel
      v-if="panel.startsWith('group-')"
      :mode="panel === 'group-create' ? 'create' : 'search'"
      @close="emit('close-panel')"
    />
    <ChatFriendPanel
      v-else-if="panel.startsWith('friend-')"
      :mode="panel === 'friend-add' ? 'add' : 'search'"
      @close="emit('close-panel')"
    />

    <template v-else>
      <!-- 会话头部 -->
      <header class="flex items-center gap-3 px-5 py-3 border-b border-zinc-200/60 dark:border-zinc-700/60 shrink-0">
        <div class="flex-1 min-w-0">
          <h2 class="text-sm font-semibold text-zinc-800 dark:text-zinc-100 font-display truncate">{{ activeTitle }}</h2>
          <p class="text-xs truncate">
            <!-- 对方正在输入优先于在线态展示 -->
            <span v-if="typingLabel" class="text-amber-600 dark:text-amber-400" aria-live="polite">{{ typingLabel }}</span>
            <span v-else class="text-zinc-400">{{ activeSubtitle }}</span>
          </p>
        </div>

        <!-- 通话操作（私聊/群聊会话；AI/匿名会话不可通话） -->
        <template v-if="active && canCall">
          <button
            class="h-8 w-8 rounded-full bg-white/60 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-300 hover:text-emerald-500 dark:hover:text-emerald-400 flex items-center justify-center transition-colors"
            title="语音通话" aria-label="语音通话" @click="startCall('Audio')">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
          </button>
          <button
            class="h-8 w-8 rounded-full bg-white/60 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-300 hover:text-amber-500 dark:hover:text-amber-400 flex items-center justify-center transition-colors"
            title="视频通话" aria-label="视频通话" @click="startCall('Video')">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <polygon points="23 7 16 12 23 17 23 7" />
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
          </button>
        </template>
        <button v-if="active && active.groupId"
          class="h-8 px-3 rounded-[5%] text-xs bg-white/60 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-300"
          type="button" :aria-expanded="memberOpen" @click="memberOpen = !memberOpen">成员</button>
        <!-- 进行中的房间入口（群组） -->
        <button v-if="active && active.groupId"
          class="relative h-8 px-3 rounded-[5%] text-xs bg-white/60 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-300 hover:text-amber-500 dark:hover:text-amber-400 transition-colors"
          type="button" title="进行中的语音/视频房间" aria-label="进行中的房间" @click="roomOpen = true">
          房间
          <span v-if="rooms.length"
            class="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] flex items-center justify-center font-numeric">
            {{ rooms.length }}
          </span>
        </button>
      </header>

      <!-- 进行中的房间快捷条（群组） -->
      <div v-if="active && active.groupId && rooms.length"
        class="px-5 py-2 border-b border-zinc-200/60 dark:border-zinc-700/60 flex items-center gap-2 overflow-x-auto overscroll-contain">
        <button v-for="r in rooms" :key="r.callId"
          class="shrink-0 h-7 px-3 rounded-full bg-white/60 dark:bg-zinc-800/60 text-xs text-zinc-600 dark:text-zinc-300 flex items-center gap-1.5 hover:text-amber-500 dark:hover:text-amber-400 transition-colors"
          type="button"
          :title="`${r.type === 'Video' ? '视频' : '语音'}房${r.requiresPassword ? '（需密码）' : ''}`"
          @click="joinRoom(r)">
          {{ r.type === 'Video' ? '视频' : '语音' }}房
          <span class="text-[10px] opacity-70 font-numeric">{{ (r.joinedMembers || []).length }}人</span>
          <span v-if="r.requiresPassword" class="text-[10px] opacity-70" aria-label="需要密码">需密码</span>
        </button>
      </div>

      <CallInviteDialog
        v-if="inviteOpen && active"
        :session-id="active.sessionId"
        :type="inviteType"
        :members="inviteMembers"
        @close="inviteOpen = false"
      />
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
        <div v-for="m in members" :key="m.id" class="flex items-center gap-2 py-1 text-sm text-zinc-600 dark:text-zinc-300">
          <img :src="m.avatar || charAvatar(m.name.charAt(0), '#a1a1aa')" alt="" width="28" height="28" class="w-7 h-7 rounded-[10px] object-cover" @error="onAvatarError" />
          <span class="truncate">{{ m.name }}</span>
          <span class="ml-auto w-2 h-2 rounded-full shrink-0" :class="m.online ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-600'" :title="m.online ? '在线' : '离线'"></span>
        </div>
      </div>

      <!-- 消息列表 -->
      <div class="relative flex-1 min-h-0">
        <div ref="msgBox" class="h-full overflow-y-auto px-5 py-4 scroll-native" @scroll="onScroll">
          <!-- 未选择会话 -->
          <div v-if="!active" class="h-full flex flex-col items-center justify-center text-center gap-3">
            <div class="w-16 h-16 rounded-full bg-amber-400/12 dark:bg-amber-400/10 flex items-center justify-center">
              <svg class="w-8 h-8 text-amber-400/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <p class="text-base font-medium text-zinc-700 dark:text-zinc-200">选择一个会话</p>
            <p class="text-sm text-zinc-500 dark:text-zinc-400 max-w-[34ch] leading-relaxed">从左侧列表选择好友或群聊，开始你们的对话</p>
          </div>

          <!-- 空会话（已选中但还没有消息） -->
          <div v-else-if="!rows.length" class="h-full flex flex-col items-center justify-center text-center gap-3">
            <div class="w-16 h-16 rounded-full bg-amber-400/12 dark:bg-amber-400/10 flex items-center justify-center">
              <svg class="w-8 h-8 text-amber-400/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </div>
            <p class="text-base font-medium text-zinc-700 dark:text-zinc-200">还没有消息</p>
            <p class="text-sm text-zinc-500 dark:text-zinc-400 max-w-[34ch] leading-relaxed">在下方输入框打个招呼，开始这段对话</p>
          </div>

          <!-- 消息（日期分隔 + 连续消息分组） -->
          <template v-for="row in rows" :key="row.key">
            <div v-if="row.kind === 'day'" class="flex items-center justify-center my-4">
              <span class="text-[11px] text-zinc-400 font-numeric">{{ row.label }}</span>
            </div>
            <ChatMessageItem
              v-else
              :message="row.message"
              :is-group-start="row.isGroupStart"
              :is-group-end="row.isGroupEnd"
              @retry="retryMessage(row.message)"
            />
          </template>
        </div>

        <!-- 回到最新：不在底部时出现 -->
        <button
          v-if="active && !atBottom"
          class="absolute bottom-4 right-5 w-9 h-9 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200/70 dark:border-white/10 flex items-center justify-center text-zinc-500 dark:text-zinc-300 hover:text-amber-500 dark:hover:text-amber-400 shadow-lg transition-colors"
          type="button" title="回到最新" aria-label="回到最新" @click="scrollToBottom(true)">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5v14M19 12l-7 7-7-7" /></svg>
        </button>
      </div>

      <!-- 输入区（仅在选中会话时可用） -->
      <ChatComposer v-if="active" @sent="scrollToBottom(true)" />
    </template>
  </div>
</template>

<script setup lang="ts">
// 会话主视窗：消息列表（日期分隔 + 连续消息分组）、滚动加载历史、通话与群房间入口。
// 会话激活由 ChatPage/侧栏/社区页统一驱动（见 chat.activateSession），本组件不依赖路由。
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { charAvatar } from '@/utils/avatar'
import { useChatStore, type MessageDto } from '@/stores/chat'
import { useCallStore, type CallPayload } from '@/stores/call'
import { groupMessages } from '@/utils/chatMessages'
import ChatGroupPanel from '@/components/chat/ChatGroupPanel.vue'
import ChatFriendPanel from '@/components/chat/ChatFriendPanel.vue'
import ChatMessageItem from '@/components/chat/ChatMessageItem.vue'
import ChatComposer from '@/components/chat/ChatComposer.vue'
import CallInviteDialog from '@/components/chat/CallInviteDialog.vue'
import RoomJoinDialog from '@/components/chat/RoomJoinDialog.vue'

// panelMode：右侧栏位的模式（'' = 会话；group-*/friend-* = 功能面板），由页面按路由下发。
// 本组件不依赖路由（社区页内嵌时不会传该 prop，自然走会话视图）。
const props = defineProps<{ panelMode?: string }>()
const emit = defineEmits<{ (e: 'close-panel'): void }>()

/** 归一为字符串，避免内嵌场景未传 prop 时对 undefined 调 startsWith */
const panel = computed(() => props.panelMode || '')

const chat = useChatStore()
const call = useCallStore()

const msgBox = ref<HTMLElement | null>(null)
const memberOpen = ref(false)
const atBottom = ref(true)
// 群组房间：邀请对话框 + 房间列表
const inviteOpen = ref(false)
const inviteType = ref<'Audio' | 'Video'>('Audio')
const roomOpen = ref(false)
const rooms = ref<CallPayload[]>([])
let scrollLock = false

const active = computed(() => chat.sessions.find((s) => s.sessionId === chat.activeSessionId) || null)
const activeMessages = computed<MessageDto[]>(
  () => (chat.activeSessionId && chat.messages[chat.activeSessionId]) || []
)
/** 消息渲染项：日期分隔 + 连续消息分组（纯函数在 utils/chatMessages） */
const rows = computed(() => groupMessages(activeMessages.value))

const activeTitle = computed(() => (active.value ? chat.sessionTitle(active.value) : 'MonoHub'))
const activeSubtitle = computed(() => {
  const a = active.value
  if (!a) return '选择左侧会话开始聊天'
  if (a.groupId || a.circleId) return `${a.participants ? a.participants.length : 0} 人`
  return chat.isPeerOnline(a) ? '在线' : '离线'
})

/**
 * 「对方正在输入…」。
 * 昵称只能从资料缓存或好友列表解析——群成员若从未发过消息就无从命名，
 * 此时回退为通用文案（senderName 的未知占位就是「用户」）。
 */
const typingLabel = computed(() => {
  const userId = chat.typing[chat.activeSessionId]
  if (!userId) return ''
  const name = chat.senderName({ senderId: userId } as MessageDto)
  return name && name !== '用户' ? `${name} 正在输入…` : '正在输入…'
})

const members = computed(() => chat.membersOf(active.value))
const inviteMembers = computed(() => members.value.filter((m) => m.id !== String(chat.currentUserId())))
// 可通话会话：排除通知会话（notifyGuid）；后端限制私聊/群聊/频道可发起通话
const canCall = computed(() => !!active.value && !active.value.notifyGuid)

function startCall(type: 'Audio' | 'Video') {
  const a = active.value
  if (!a) return
  if (a.groupId) {
    // 群组：打开邀请对话框（选择成员 + 可选密码）
    inviteType.value = type
    inviteOpen.value = true
    return
  }
  // 私聊：直接发起即时呼叫
  call.startCall(a.sessionId, type)
}

/** 刷新会话下的活跃房间（群组）。跨会话竞态：请求期间已切走则丢弃结果，避免 A 的房间覆盖 B */
async function refreshRooms() {
  const a = active.value
  if (!a || !a.groupId) {
    rooms.value = []
    return
  }
  const sessionId = a.sessionId
  const list = await call.getSessionRooms(sessionId)
  if (chat.activeSessionId !== sessionId) return
  rooms.value = list
}

/** 快捷条加入房间：需密码则打开房间对话框，否则直接加入 */
async function joinRoom(r: CallPayload) {
  if (r.requiresPassword) {
    roomOpen.value = true
    return
  }
  await call.joinCall(r.callId)
}

/** 补取当前会话出现的发送者资料（已缓存的 id 由 store 跳过，不会重复请求） */
function loadSenderProfiles(): void {
  const ids = activeMessages.value.map((m) => String(m.senderId || '')).filter(Boolean)
  if (ids.length) chat.loadProfiles(ids)
}

function scrollToBottom(force = false) {
  if (scrollLock && !force) return
  nextTick(() => {
    if (msgBox.value) msgBox.value.scrollTop = msgBox.value.scrollHeight
    atBottom.value = true
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
  // 跨会话竞态：加载期间已切走则不再改滚动位置，否则新会话滚动条会跳位、scrollLock 会卡死
  if (chat.activeSessionId === id && msgBox.value) {
    msgBox.value.scrollTop = msgBox.value.scrollHeight - oldHeight
  }
  scrollLock = false
}

function onScroll() {
  const el = msgBox.value
  if (!el) return
  atBottom.value = el.scrollTop + el.clientHeight >= el.scrollHeight - 40
  if (el.scrollTop <= 40) loadOlder()
}

async function retryMessage(m: MessageDto) {
  if (!chat.activeSessionId || m.status !== -1) return
  try {
    await chat.retryMessage(chat.activeSessionId, m.messageId)
  } catch (e) {
    /* 状态已由 store 回写为失败 */
  }
}

/** 成员/头像加载失败：换首字头像，避免留下空洞 */
function onAvatarError(e: Event): void {
  const el = e.target as HTMLImageElement
  const fallback = charAvatar('友', '#a1a1aa')
  if (el.src !== fallback) el.src = fallback
}

watch(() => activeMessages.value.length, () => {
  scrollToBottom()
  loadSenderProfiles()
})

// 会话切换的唯一触发源是 chat.activeSessionId（由 ChatPage 路由、侧栏点击、社区页统一驱动）。
// 本组件不再自己拉会话（activateSession 已负责加载与已读），只做与该会话相关的视图收尾。
watch(() => chat.activeSessionId, async (id) => {
  if (!id) return
  memberOpen.value = false
  loadSenderProfiles()
  scrollToBottom(true)
  await refreshRooms()
})

onMounted(async () => {
  // 首屏数据单次加载（侧栏共用同一份，不再各拉一遍）
  await chat.ensureLoaded()
  // 实时通道的生命周期必须留在这里：社区页内嵌本组件时不挂 ChatPage/ChatSidebar，
  // 上移到页面级会让社区聊天失去实时推送
  await chat.initRealtime()
})
</script>