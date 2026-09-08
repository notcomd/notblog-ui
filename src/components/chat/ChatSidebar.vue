<template>
  <!-- 会话侧边栏：消息 / 好友 / 群聊 列表 + 通知 + 会话操作 -->
  <div class="w-full lg:w-80 lg:shrink-0 flex flex-col glass-card p-3 min-h-0">
    <!-- 列表头部 -->
    <div class="flex items-center justify-between shrink-0 px-1 pb-2">
      <span class="text-sm font-semibold text-zinc-700 dark:text-zinc-200">{{ tabTitle }}</span>
      <div v-if="tab === 'messages'" class="flex items-center gap-2">
        <span v-if="msgUnread > 0" class="text-xs text-zinc-400">未读 {{ msgUnread > 99 ? '99+' : msgUnread }}</span>
        <button
          class="h-7 px-2.5 rounded-[5%] text-xs font-medium transition-colors inline-flex items-center gap-1 shrink-0"
          :class="msgUnread > 0 ? 'bg-amber-400/15 text-amber-600 dark:text-amber-300 hover:bg-amber-400/25' : 'text-zinc-400 cursor-default'"
          :disabled="msgUnread === 0 || allReadBusy"
          @click="markAllRead"
        ><span v-if="!allReadBusy" class="inline-flex items-center gap-1"><svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>一键已读</span><span v-else>处理中…</span></button>
      </div>
      <div v-else class="flex items-center gap-1 shrink-0">
        <button
          v-for="a in listMoreActions"
          :key="a.key"
          class="w-7 h-7 rounded-[5%] flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:bg-white/60 dark:hover:bg-zinc-800/60 transition-colors shrink-0"
          :title="a.label"
          :aria-label="a.label"
          @click="onListMoreAction(a)"
        >
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" v-html="a.icon" aria-hidden="true"></svg>
        </button>
      </div>
    </div>

    <!-- 列表区 -->
    <div class="flex-1 overflow-y-auto space-y-1 min-h-0">
      <div v-if="visibleSessions.length === 0 && !sessionsLoading" class="py-12 flex flex-col items-center gap-2 text-zinc-400">
        <div class="text-4xl" v-html="emptyIcon"></div>
        <p class="text-xs">{{ emptyText }}</p>
      </div>

      <button
        v-for="s in visibleSessions"
        :key="String(s.sessionId || s.notifyGuid)"
        class="w-full flex items-center gap-3 px-3 py-2 rounded-[5%] transition-all text-left"
        :class="isActiveRow(s) ? 'bg-gradient-to-r from-amber-400/15 to-orange-400/10' : 'hover:bg-white/60 dark:hover:bg-zinc-800/60'"
        @click="onItemClick(s)"
        @contextmenu.prevent="openRowContextMenu(s, $event)"
      >
        <div class="relative shrink-0">
          <img v-if="!isNotify(s)" :src="sessionAvatar(s)" alt="" class="w-11 h-11 rounded-[5%] object-cover border border-white/60 dark:border-white/10" @error="hideImg" />
          <div v-else class="w-11 h-11 rounded-[5%] flex items-center justify-center" :class="notificationMeta(s.type).bg">
            <svg class="w-5 h-5" :class="notificationMeta(s.type).fg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" v-html="notificationMeta(s.type).icon" aria-hidden="true"></svg>
          </div>
          <span v-if="!isNotify(s) && !s.groupId" class="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-zinc-800" :class="isRowOnline(s) ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-600'"></span>
        </div>

        <span v-if="tab === 'messages'" class="flex-1 min-w-0 h-11 flex flex-col justify-center gap-0.5">
          <span class="flex items-center justify-between gap-2 min-w-0">
            <span class="text-sm font-medium text-zinc-700 dark:text-zinc-200 truncate">{{ isNotify(s) ? notificationMeta(s.type).name : sessionTitle(s) }}</span>
            <span class="text-xs text-zinc-400 shrink-0">{{ rowTime(s) }}</span>
          </span>
          <span class="flex items-center justify-between gap-2 min-w-0">
            <span class="text-xs text-zinc-400 truncate">{{ isNotify(s) ? notifyText(s) : (s.lastMessageContent || '暂无消息') }}</span>
            <span v-if="rowUnread(s) > 0" class="min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">{{ rowUnread(s) > 99 ? '99+' : rowUnread(s) }}</span>
          </span>
        </span>
        <span v-else class="flex-1 min-w-0 flex items-center justify-between gap-2">
          <span class="text-sm font-medium text-zinc-700 dark:text-zinc-200 truncate">{{ sessionTitle(s) }}</span>
          <span v-if="rowUnread(s) > 0" class="min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">{{ rowUnread(s) > 99 ? '99+' : rowUnread(s) }}</span>
        </span>

        <span v-if="!isNotify(s)" class="relative shrink-0" @click.stop>
          <button class="w-6 h-6 rounded-[5%] flex items-center justify-center text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-zinc-700/60" aria-label="会话操作" @click="sessionMenuTarget = sessionMenuTarget === s.sessionId ? null : s.sessionId">
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>
          </button>
          <div v-if="sessionMenuTarget === s.sessionId" class="absolute right-0 top-full mt-1 w-36 glass-card p-1.5 z-50">
            <button class="w-full flex items-center gap-2 px-2.5 py-2 rounded-[5%] text-xs text-zinc-600 dark:text-zinc-300 hover:bg-white/70 dark:hover:bg-zinc-800/70" @click="togglePin(s)"><span v-if="!s.isPinned" class="inline-flex items-center gap-1"><svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1z"/></svg>置顶</span><span v-else>取消置顶</span></button>
            <button class="w-full flex items-center gap-2 px-2.5 py-2 rounded-[5%] text-xs text-zinc-600 dark:text-zinc-300 hover:bg-white/70 dark:hover:bg-zinc-800/70" @click="toggleMute(s)"><span v-if="!s.isMuted" class="inline-flex items-center gap-1"><svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13.73 21a2 2 0 0 1-3.46 0"/><path d="M18.63 13A17.89 17.89 0 0 1 18 8"/><path d="M6.26 6.26A5.86 5.86 0 0 0 6 8c0 7-3 9-3 9h14"/><path d="M18 8a6 6 0 0 0-9.33-5"/><line x1="1" y1="1" x2="23" y2="23"/></svg>免打扰</span><span v-else>恢复提醒</span></button>
            <button class="w-full flex items-center gap-2 px-2.5 py-2 rounded-[5%] text-xs text-red-500 hover:bg-red-500/10" @click="removeSession(s)"><svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg> 删除会话</button>
          </div>
        </span>
      </button>
    </div>

    <!-- 底部 Tab 切换 -->
    <div class="mt-2 pt-2 border-t border-zinc-200/60 dark:border-zinc-700/60 flex gap-1">
      <button v-for="b in BOTTOM_TABS" :key="b.key" class="flex-1 py-2 rounded-[5%] text-sm font-medium transition-all inline-flex items-center justify-center gap-1.5"
        :class="tab === b.key ? 'bg-amber-400/15 text-amber-600 dark:text-amber-300' : 'text-zinc-500 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'"
        @click="switchTab(b.key)"
      >
        <span>{{ b.label }}</span>
        <span v-if="b.key === 'messages' && msgUnread > 0" class="min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">{{ msgUnread > 99 ? '99+' : msgUnread }}</span>
      </button>
    </div>

    <!-- 右键菜单 -->
    <div v-if="ctxMenu" class="fixed inset-0 z-40" @click="ctxMenu = null" @contextmenu.prevent="ctxMenu = null" @keydown.enter.prevent="ctxMenu = null" @keydown.space.prevent="ctxMenu = null" tabindex="0"></div>
    <div v-if="ctxMenu" class="fixed z-50 w-40 glass-card p-1.5" :style="{ left: ctxMenu.x + 'px', top: ctxMenu.y + 'px' }">
      <button v-if="!isNotify(ctxMenu.s) && rowUnread(ctxMenu.s) > 0" class="w-full flex items-center gap-2 px-2.5 py-2 rounded-[5%] text-xs text-zinc-600 dark:text-zinc-300 hover:bg-white/70 dark:hover:bg-zinc-800/70" @click="markOneRead(ctxMenu.s)"><svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> 设为已读</button>
      <button v-if="isNotify(ctxMenu.s) && !ctxMenu.s.isRead" class="w-full flex items-center gap-2 px-2.5 py-2 rounded-[5%] text-xs text-zinc-600 dark:text-zinc-300 hover:bg-white/70 dark:hover:bg-zinc-800/70" @click="markOneRead(ctxMenu.s)"><svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> 设为已读</button>
      <button v-if="!isNotify(ctxMenu.s)" class="w-full flex items-center gap-2 px-2.5 py-2 rounded-[5%] text-xs text-zinc-600 dark:text-zinc-300 hover:bg-white/70 dark:hover:bg-zinc-800/70" @click="onCtxPin"><svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1z"/></svg> {{ ctxMenu.s.isPinned ? '取消置顶' : '置顶' }}</button>
      <button v-if="!isNotify(ctxMenu.s)" class="w-full flex items-center gap-2 px-2.5 py-2 rounded-[5%] text-xs text-red-500 hover:bg-red-500/10" @click="onCtxDelete"><svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg> 删除会话</button>
    </div>

    <!-- 添加好友弹窗 -->
    <div v-if="addFriendOpen" class="fixed inset-0 z-[70] flex items-center justify-center bg-black/30" @click.self="addFriendOpen = false">
      <div class="glass-card p-6 w-[min(26rem,92vw)]">
        <h3 class="text-lg font-bold text-zinc-800 dark:text-zinc-100 mb-1">添加好友</h3>
        <p class="text-xs text-zinc-400 mb-4">输入对方邮箱查找用户并发起好友请求</p>
        <div class="flex gap-2">
          <input v-model="addEmail" type="email" name="addEmail" aria-label="对方邮箱" class="flex-1 min-w-0 rounded-[5%] bg-white/60 dark:bg-zinc-800/60 border border-white/60 dark:border-white/10 px-3.5 py-2.5 text-sm outline-none" placeholder="对方邮箱" @keydown.enter.exact.prevent="onLookupEnter" />
          <button class="h-10 px-4 rounded-[5%] bg-gradient-to-r from-amber-400 to-orange-500 text-white text-sm font-medium" :disabled="addLoading || !addEmail.trim()" @click="lookupUser">查找</button>
        </div>
        <div class="mt-4">
          <div v-if="addLoading" class="py-8 text-center text-xs text-zinc-400">查找中…</div>
          <div v-else-if="addNotFound" class="py-8 text-center text-xs text-zinc-400">未找到该用户，请确认邮箱是否正确</div>
          <div v-else-if="addUser" class="flex items-center gap-3 p-3 rounded-[5%] bg-white/60 dark:bg-zinc-800/60">
            <img :src="addUser.imageCover || demoAvatar((addUser.userName || '友').charAt(0), '#a1a1aa')" alt="" class="w-12 h-12 rounded-[5%] object-cover" @error="hideImg" />
            <span class="flex-1 min-w-0 text-sm font-medium text-zinc-800 dark:text-zinc-100 truncate">{{ addUser.userName || '未命名用户' }}</span>
            <span v-if="addUserIsSelf" class="shrink-0 text-xs px-2 py-1 rounded-[5%] bg-zinc-100 dark:bg-zinc-800 text-zinc-500">不能添加自己</span>
            <span v-else-if="addUserIsFriend" class="shrink-0 text-xs px-2 py-1 rounded-[5%] bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300">已是好友</span>
            <button v-else class="h-9 px-3.5 rounded-[5%] bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-medium" :disabled="addSending" @click="sendAddRequest">发送好友请求</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 搜索好友弹窗 -->
    <div v-if="friendSearchOpen" class="fixed inset-0 z-[70] flex items-center justify-center bg-black/30" @click.self="friendSearchOpen = false">
      <div class="glass-card p-6 w-[min(26rem,92vw)] max-h-[85vh] flex flex-col">
        <h3 class="text-lg font-bold text-zinc-800 dark:text-zinc-100 mb-3">搜索好友</h3>
        <div class="flex gap-2">
          <input v-model="friendKeyword" name="friendKeyword" aria-label="按备注搜索好友" class="flex-1 min-w-0 rounded-[5%] bg-white/60 dark:bg-zinc-800/60 border border-white/60 dark:border-white/10 px-3.5 py-2.5 text-sm outline-none" placeholder="按备注搜索好友" @keydown.enter.exact.prevent="onFriendSearchEnter" />
          <button class="h-10 px-4 rounded-[5%] bg-gradient-to-r from-amber-400 to-orange-500 text-white text-sm font-medium" :disabled="friendSearching || !friendKeyword.trim()" @click="doFriendSearch">搜索</button>
        </div>
        <div class="mt-4 flex-1 min-h-0 overflow-y-auto overscroll-contain space-y-1">
          <div v-if="friendSearching" class="py-8 text-center text-xs text-zinc-400">搜索中…</div>
          <div v-else-if="friendSearched && friendResults.length === 0" class="py-8 text-center text-xs text-zinc-400">未找到匹配的好友</div>
          <button v-for="f in friendResults" :key="f.friendshipId || f.friendId" class="w-full flex items-center gap-3 px-3 py-2 rounded-[5%] transition-all text-left hover:bg-white/60 dark:hover:bg-zinc-800/60" @click="openFriendChat(f)">
            <img :src="f.friendAvatar || demoAvatar('友', '#a1a1aa')" alt="" class="w-10 h-10 rounded-[5%] object-cover" @error="hideImg" />
            <span class="flex-1 min-w-0 text-sm font-medium text-zinc-700 dark:text-zinc-200 truncate">{{ friendDisplayName(f) }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 会话侧边栏：负责会话/好友/群聊列表、通知列表、会话操作、添加/搜索好友
import { computed, onMounted, ref } from 'vue'
import { charAvatar as demoAvatar } from '@/utils/avatar'
import { useRouter } from 'vue-router'
import { useChatStore } from '@/stores/chat'
import { useToastStore } from '@/stores/toast'
import {
  pinSession, unpinSession, muteSession, unmuteSession, deleteSession,
  createSession, sendFriendRequest, searchFriends,
  getUnreadMessages, markRead
} from '@/api/chat'
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '@/api/notification'
import { notificationMeta } from '@/utils/notifications'

interface SessionItem {
  sessionId?: string
  notifyGuid?: string
  groupId?: string
  isPinned?: boolean
  isMuted?: boolean
  isRead?: boolean
  unreadCount?: number
  lastMessageContent?: string
  lastMessageTime?: any
  createdTime?: any
  createTime?: any
  sessionName?: string
  avatarUrl?: string
  [key: string]: any
}

interface CtxMenuData {
  s: SessionItem
  x: number
  y: number
}

interface ActionItem {
  key: string
  label: string
  icon: string
}

const chat = useChatStore()
const toast = useToastStore()
const router = useRouter()

const BOTTOM_TABS: { key: string; label: string }[] = [
  { key: 'messages', label: '消息' },
  { key: 'friends', label: '好友' },
  { key: 'groups', label: '群聊' }
]

const tab = ref('messages')
const tabTitle = computed(() => (tab.value === 'friends' ? '好友' : tab.value === 'groups' ? '群聊' : '消息'))
const sessionsLoading = ref(true)
const notifItems = ref<SessionItem[]>([])
const sessionMenuTarget = ref<string | null>(null)
const ctxMenu = ref<CtxMenuData | null>(null)
const allReadBusy = ref(false)

const myId = computed(() => chat.currentUserId ? chat.currentUserId() : '')
const displaySessions = computed(() => sessionsLoading.value ? [] : chat.sessions)
const friendSessions = computed(() => displaySessions.value.filter(s => !s.groupId))
const groupSessions = computed(() => displaySessions.value.filter(s => !!s.groupId))
const messageItems = computed(() => {
  const t = x => (x.lastMessageTime || x.createdTime || x.createTime || 0)
  return [...displaySessions.value, ...notifItems.value].sort((a, b) => t(b) - t(a))
})
const visibleSessions = computed(() => {
  if (tab.value === 'groups') return groupSessions.value
  if (tab.value === 'messages') return messageItems.value
  return friendSessions.value
})
const msgUnread = computed(() => messageItems.value.reduce((sum, s) => sum + rowUnread(s), 0))
const emptyText = computed(() => {
  if (tab.value === 'groups') return '暂无群聊，去社区页创建或加入吧'
  if (tab.value === 'messages') return '暂无消息，和好友聊聊吧'
  return '暂无会话，去好友列表发起聊天吧'
})
const emptyIcon = computed(() => (tab.value === 'groups' ? '<svg class="w-14 h-14 mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>' : tab.value === 'messages' ? '<svg class="w-14 h-14 mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>' : '<svg class="w-14 h-14 mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>'))

function switchTab(t: string) {
  tab.value = t
  sessionMenuTarget.value = null
  ctxMenu.value = null
}

function isNotify(s: SessionItem): boolean { return !!s.notifyGuid }
function rowUnread(s: SessionItem): number { return isNotify(s) ? (s.isRead ? 0 : 1) : (s.unreadCount || 0) }
function rowTime(s: SessionItem): string { return timeText(s.lastMessageTime || s.createdTime || s.createTime) }
function notifyText(n: SessionItem): string { return ((n.title ? n.title + '：' : '') + (n.content || '')).replace(/\s+/g, ' ').trim() }
function isActiveRow(s: SessionItem): boolean {
  if (isNotify(s)) return false
  return chat.activeSessionId === s.sessionId
}

function timeText(t: any): string {
  const d = new Date(t)
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return sameDay ? `${hh}:${mm}` : `${d.getMonth() + 1}/${d.getDate()} ${hh}:${mm}`
}


function sessionTitle(s: SessionItem): string {
  if (s.sessionName) return s.sessionName
  const peerId = chat.peerIdOf(s.sessionId || '')
  const f = chat.friends.find(x => String(x.friendId) === String(peerId))
  return f ? f.friendName : '会话'
}

function sessionAvatar(s: SessionItem): string {
  if (s.avatarUrl) return s.avatarUrl
  if (s.groupId) {
    const g = chat.groups.find(x => String(x.groupId) === String(s.groupId))
    if (g && g.avatarUrl) return g.avatarUrl
  }
  const peerId = chat.peerIdOf(s.sessionId || '')
  const f = chat.friends.find(x => String(x.friendId) === String(peerId))
  return typeof f?.friendAvatar === 'string' ? f.friendAvatar : 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="#d6d3d1"/><path d="M30 32h40v26H47l-11 11v-11h-6z" fill="#fff"/></svg>')
}

function isOnline(s: SessionItem): boolean {
  const peerId = chat.peerIdOf(s.sessionId || '')
  return chat.onlineUsers[String(peerId)] === true
}
function isRowOnline(s: SessionItem): boolean { return isOnline(s) }

const listMoreActions = computed(() => {
  if (tab.value === 'groups') {
    return [
      { key: 'createGroup', label: '创建群聊', icon: '<path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><path d="M20 8v6M23 11h-6" />' },
      { key: 'searchGroup', label: '搜索群聊', icon: '<circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />' }
    ]
  }
  return [
    { key: 'addFriend', label: '添加好友', icon: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M19 8v6M22 11h-6" />' },
    { key: 'searchFriend', label: '搜索好友', icon: '<circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />' }
  ]
})

function onListMoreAction(a: ActionItem) {
  if (a.key === 'addFriend') addFriendOpen.value = true
  else if (a.key === 'searchFriend') friendSearchOpen.value = true
  else if (a.key === 'createGroup') router.push({ path: '/chat', query: { action: 'createGroup' } })
  else if (a.key === 'searchGroup') router.push({ path: '/chat', query: { action: 'searchGroup' } })
}

function onItemClick(s: SessionItem) {
  if (isNotify(s)) {
    markNotifyRead(s)
    return
  }
  openChat(s)
}

async function openChat(s: SessionItem) {
  sessionMenuTarget.value = null
  const real = chat.sessions.find(x => x.sessionId === s.sessionId)
  if (!real) return
  await chat.openSession(real.sessionId)
  chat.clearUnread(real.sessionId)
  await chat.markSessionRead(real.sessionId).catch(() => {})
  router.push('/chat/' + real.sessionId)
}

async function markNotifyRead(n: SessionItem) {
  if (n.isRead) return
  n.isRead = true
  if (n.notifyGuid) {
    try { await markNotificationRead(n.notifyGuid) } catch (e) { /* 忽略 */ }
  }
}

function openRowContextMenu(s: SessionItem, e: MouseEvent) {
  sessionMenuTarget.value = null
  const itemCount = isNotify(s) ? (s.isRead ? 0 : 1) : 3
  if (!itemCount) return
  const menuW = 160
  const menuH = itemCount * 36 + 12
  ctxMenu.value = {
    s,
    x: Math.max(0, Math.min(e.clientX, window.innerWidth - menuW - 8)),
    y: Math.max(0, Math.min(e.clientY, window.innerHeight - menuH - 8))
  }
}

async function markOneRead(s: SessionItem) {
  ctxMenu.value = null
  if (isNotify(s)) {
    if (!s.isRead) {
      s.isRead = true
      if (s.notifyGuid) {
        try { await markNotificationRead(s.notifyGuid) } catch (e) { /* 忽略 */ }
      }
    }
    chat.loadUnread()
    return
  }
  try {
    const res = await getUnreadMessages()
    const data = res && res.data ? res.data : res
    const list = (data && (data.items || data.list || data)) || []
    const ids = [...new Set(list.filter(m => String(m.sessionId) === String(s.sessionId)).map(m => m.messageId).filter(Boolean))].map(id => String(id))
    await Promise.all(ids.map(id => markRead(id).catch(() => {})))
  } catch (e) { /* 后端未就绪 */ }
  if (s.unreadCount) s.unreadCount = 0
  chat.loadUnread()
  toast.push('已设为已读', 'success')
}

async function markAllRead() {
  if (allReadBusy.value || msgUnread.value === 0) return
  allReadBusy.value = true
  try {
    try {
      const res = await getUnreadMessages()
      const data = res && res.data ? res.data : res
      const list = (data && (data.items || data.list || data)) || []
      const ids = [...new Set(list.map(m => m.messageId).filter(Boolean))].map(id => String(id))
      await Promise.all(ids.map(id => markRead(id).catch(() => {})))
    } catch (e) { /* 忽略 */ }
    try { await markAllNotificationsRead() } catch (e) { /* 忽略 */ }
    chat.sessions.forEach(s => { s.unreadCount = 0 })
    notifItems.value.forEach(n => { n.isRead = true })
    await chat.loadUnread()
    toast.push('已全部标为已读', 'success')
  } finally {
    allReadBusy.value = false
  }
}

async function togglePin(s: SessionItem) {
  try {
    if (s.isPinned) await unpinSession(s.sessionId || '')
    else await pinSession(s.sessionId || '')
    s.isPinned = !s.isPinned
    toast.push(s.isPinned ? '已置顶会话' : '已取消置顶', 'success')
  } catch (e) {
    toast.push('操作失败（后端未就绪）', 'error')
  }
}

async function toggleMute(s: SessionItem) {
  try {
    if (s.isMuted) await unmuteSession(s.sessionId || '')
    else await muteSession(s.sessionId || '')
    s.isMuted = !s.isMuted
    toast.push(s.isMuted ? '已开启免打扰' : '已恢复提醒', 'success')
  } catch (e) {
    toast.push('操作失败（后端未就绪）', 'error')
  }
}

async function removeSession(s: SessionItem) {
  try {
    await deleteSession(s.sessionId || '')
    chat.removeSession(s.sessionId || '')
    toast.push('会话已删除', 'success')
  } catch (e) {
    toast.push('删除失败（后端未就绪）', 'error')
  }
}

function onCtxPin() {
  const s = ctxMenu.value && ctxMenu.value.s
  ctxMenu.value = null
  if (s) togglePin(s)
}
function onCtxDelete() {
  const s = ctxMenu.value && ctxMenu.value.s
  ctxMenu.value = null
  if (s) removeSession(s)
}

// 添加好友
const addFriendOpen = ref(false)
const addEmail = ref('')
const addUser = ref<any | null>(null)
const addLoading = ref(false)
const addNotFound = ref(false)
const addSending = ref(false)
const addUserIsSelf = computed(() => addUser.value && String(addUser.value.userGuid) === String(myId.value))
const addUserIsFriend = computed(() => addUser.value && chat.friends.some(f => String(f.friendId) === String(addUser.value.userGuid)))

function onLookupEnter(e: KeyboardEvent) {
  if (e.isComposing || e.keyCode === 229) return
  lookupUser()
}
async function lookupUser() {
  const email = addEmail.value.trim()
  if (!email || addLoading.value) return
  addLoading.value = true
  addNotFound.value = false
  addUser.value = null
  // 已移除无鉴权 Identity 查询；等待后端安全接口
  addNotFound.value = true
  addLoading.value = false
}

async function sendAddRequest() {
  const u = addUser.value
  if (!u || addSending.value || addUserIsSelf.value || addUserIsFriend.value) return
  addSending.value = true
  try {
    await sendFriendRequest({ friendId: u.userGuid })
    toast.push('好友请求已发送，等待对方验证', 'success')
    addFriendOpen.value = false
    addEmail.value = ''
    addUser.value = null
  } catch (e) {
    toast.push('发送失败：' + (e.message || '请稍后重试'), 'error')
  } finally {
    addSending.value = false
  }
}

// 搜索好友
const friendSearchOpen = ref(false)
const friendKeyword = ref('')
const friendResults = ref<any[]>([])
const friendSearching = ref(false)
const friendSearched = ref(false)
function onFriendSearchEnter(e: KeyboardEvent) {
  if (e.isComposing || e.keyCode === 229) return
  doFriendSearch()
}
async function doFriendSearch() {
  const kw = friendKeyword.value.trim()
  if (!kw || friendSearching.value) return
  friendSearching.value = true
  friendSearched.value = true
  try {
    const res = await searchFriends({ searchTerm: kw })
    const data = res && res.data ? res.data : res
    friendResults.value = (data && (data.items || data.list || data)) || []
  } catch (e) {
    friendResults.value = []
    toast.push('搜索失败（后端未就绪）', 'error')
  } finally {
    friendSearching.value = false
  }
}
function friendDisplayName(f: any): string {
  return f.friendName || f.remark || ('好友 ' + String(f.friendId).slice(0, 8))
}
async function openFriendChat(f: any) {
  try {
    const res = await createSession(f.friendId)
    const d = res && res.data ? res.data : res
    const sessionId = (d && (d.sessionId || d.id)) || (typeof d === 'string' ? d : '')
    if (!sessionId) throw new Error('no sessionId')
    await chat.loadSessions()
    friendSearchOpen.value = false
    router.push('/chat/' + sessionId)
  } catch (e) {
    toast.push('无法发起会话，请稍后重试', 'error')
  }
}

async function loadNotifications() {
  try {
    const res = await getNotifications({ pageSize: 20 })
    const items = (res && res.data && (res.data.items || res.data.list)) || []
    // 诚实空态：无数据时展示「暂无通知」，不填充示例通知
    notifItems.value = items
  } catch (e) {
    notifItems.value = []
  }
}

function hideImg(e: Event) { (e.target as HTMLElement).style.visibility = 'hidden' }

onMounted(async () => {
  await Promise.all([chat.loadSessions(), chat.loadFriends(), chat.loadGroups(), chat.loadUnread(), loadNotifications()])
  sessionsLoading.value = false
})
</script>
