<template>
  <!-- 会话侧边栏：扁平栏（与社区侧栏同构：无卡片化，仅右侧分隔线）+ 会话/好友/群聊列表 -->
  <div class="w-80 shrink-0 flex flex-col p-3 border-r border-zinc-200/60 dark:border-zinc-800/60 min-h-0">
    <!-- 列表头部：功能按钮（消息页为「一键已读」，其余页为新建/搜索） -->
    <div class="flex items-center justify-end gap-2 shrink-0 px-1 pb-3">
      <div v-if="tab === 'messages'" class="flex items-center gap-2">
        <span v-if="msgUnread > 0" class="text-[11px] px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-500 font-numeric">{{ msgUnread > 99 ? '99+' : msgUnread }}</span>
        <button
          class="h-7 px-2.5 rounded-[5%] text-xs font-medium transition-colors inline-flex items-center gap-1 shrink-0"
          :class="msgUnread > 0 ? 'bg-amber-400/15 text-amber-600 dark:text-amber-300 hover:bg-amber-400/25' : 'text-zinc-400 cursor-default'"
          type="button"
          :disabled="msgUnread === 0 || allReadBusy"
          @click="markAllRead"
        >
          <template v-if="allReadBusy">处理中…</template>
          <template v-else><svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>一键已读</template>
        </button>
      </div>
      <div v-else class="flex items-center gap-1 shrink-0">
        <button
          v-for="a in listMoreActions"
          :key="a.key"
          class="w-7 h-7 rounded-[5%] flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:bg-white/60 dark:hover:bg-zinc-800/60 transition-colors shrink-0"
          type="button"
          :title="a.label"
          :aria-label="a.label"
          @click="onListMoreAction(a.key)"
        >
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path v-for="(d, i) in a.icon" :key="i" :d="d" />
          </svg>
        </button>
      </div>
    </div>

    <!-- 列表区 -->
    <div class="flex-1 overflow-y-auto space-y-1 min-h-0">
      <!-- 首次加载：骨架屏（避免「加载中」与「暂无会话」混淆） -->
      <div v-if="!chat.initialLoaded" class="space-y-1" role="status">
        <span class="sr-only">正在加载会话…</span>
        <div v-for="i in 6" :key="i" class="flex items-center gap-3 px-3 py-2" aria-hidden="true">
          <div class="w-11 h-11 rounded-[10px] bg-zinc-200/70 dark:bg-zinc-800/70 qm-shimmer shrink-0"></div>
          <div class="flex-1 min-w-0 space-y-2">
            <div class="h-3 w-2/3 rounded bg-zinc-200/70 dark:bg-zinc-800/70"></div>
            <div class="h-3 w-1/2 rounded bg-zinc-200/70 dark:bg-zinc-800/70"></div>
          </div>
        </div>
      </div>

      <!-- 空状态：图标 + 文案，且说明下一步去哪 -->
      <div v-else-if="visibleSessions.length === 0" class="qm-rise py-12 flex flex-col items-center text-center gap-3">
        <div class="w-14 h-14 rounded-full bg-amber-400/12 dark:bg-amber-400/10 flex items-center justify-center">
          <svg class="w-7 h-7 text-amber-400/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path v-for="(d, i) in emptyIconPaths" :key="i" :d="d" />
          </svg>
        </div>
        <p class="text-sm text-zinc-500 dark:text-zinc-400 max-w-[24ch] leading-relaxed">{{ emptyText }}</p>
      </div>

      <template v-else>
        <button
          v-for="s in visibleSessions"
          :key="String(s.sessionId || s.notifyGuid)"
          class="relative w-full flex items-center gap-3 px-3 py-2 rounded-[10px] transition-colors text-left"
          :class="isActiveRow(s) ? 'bg-gradient-to-r from-amber-400/15 to-orange-400/10' : 'hover:bg-white/60 dark:hover:bg-zinc-800/60'"
          type="button"
          @click="onItemClick(s)"
          @contextmenu.prevent="openRowContextMenu(s, $event)"
        >
        <!-- 选中态：左侧琥珀光条（与社区侧栏一致） -->
        <span v-if="isActiveRow(s)" class="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-8 rounded-full bg-gradient-to-b from-amber-400 to-orange-500"></span>
        <div class="relative shrink-0">
          <img v-if="!isNotify(s)" :src="chat.sessionAvatar(s)" alt="" width="44" height="44" class="w-11 h-11 rounded-[10px] object-cover border border-white/60 dark:border-white/10" @error="onAvatarError(s, $event)" />
          <div v-else class="w-11 h-11 rounded-[10px] flex items-center justify-center" :class="notificationMeta(s.type).bg">
            <!-- notificationMeta().icon 是共享工具里写死的 SVG 内层标记（含多个 path/circle），故沿用 v-html -->
            <svg class="w-5 h-5" :class="notificationMeta(s.type).fg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" v-html="notificationMeta(s.type).icon"></svg>
          </div>
          <span v-if="!isNotify(s) && !s.groupId" class="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-zinc-800" :class="chat.isPeerOnline(s) ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-600'" :title="chat.isPeerOnline(s) ? '在线' : '离线'"></span>
        </div>

        <!-- 消息页：两行（标题 + 摘要）；好友/群聊页：单行 -->
        <span v-if="tab === 'messages'" class="flex-1 min-w-0 h-11 flex flex-col justify-center gap-0.5">
          <span class="flex items-center justify-between gap-2 min-w-0">
            <span class="text-sm font-medium text-zinc-700 dark:text-zinc-200 truncate">{{ rowTitle(s) }}</span>
            <span class="text-xs text-zinc-400 shrink-0 font-numeric">{{ clockTime(rowTimestamp(s)) }}</span>
          </span>
          <span class="flex items-center justify-between gap-2 min-w-0">
            <span class="text-xs text-zinc-400 truncate">{{ isNotify(s) ? notifyText(s) : (s.lastMessageContent || '暂无消息') }}</span>
            <span v-if="rowUnread(s) > 0" class="min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0 font-numeric">{{ rowUnread(s) > 99 ? '99+' : rowUnread(s) }}</span>
          </span>
        </span>
        <span v-else class="flex-1 min-w-0 flex items-center justify-between gap-2">
          <span class="text-sm font-medium text-zinc-700 dark:text-zinc-200 truncate">{{ rowTitle(s) }}</span>
          <span v-if="rowUnread(s) > 0" class="min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0 font-numeric">{{ rowUnread(s) > 99 ? '99+' : rowUnread(s) }}</span>
        </span>

        <!-- 行内操作菜单（⋯） -->
        <span v-if="!isNotify(s)" class="relative shrink-0" @click.stop>
          <button
            class="w-6 h-6 rounded-[5%] flex items-center justify-center text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-zinc-700/60"
            type="button"
            aria-label="会话操作"
            :aria-expanded="sessionMenuTarget === s.sessionId"
            @click="sessionMenuTarget = sessionMenuTarget === s.sessionId ? null : s.sessionId"
          >
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>
          </button>
          <div v-if="sessionMenuTarget === s.sessionId" class="absolute right-0 top-full mt-1 w-36 qm-surface p-1.5 z-50">
            <button v-if="s.groupId" class="w-full flex items-center gap-2 px-2.5 py-2 rounded-[5%] text-xs text-zinc-600 dark:text-zinc-300 hover:bg-white/70 dark:hover:bg-zinc-800/70" type="button" @click="openGroupManage(s)">
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              群管理
            </button>
            <button class="w-full flex items-center gap-2 px-2.5 py-2 rounded-[5%] text-xs text-zinc-600 dark:text-zinc-300 hover:bg-white/70 dark:hover:bg-zinc-800/70" type="button" @click="togglePin(s)">
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1z"/></svg>
              {{ s.isPinned ? '取消置顶' : '置顶' }}
            </button>
            <button class="w-full flex items-center gap-2 px-2.5 py-2 rounded-[5%] text-xs text-zinc-600 dark:text-zinc-300 hover:bg-white/70 dark:hover:bg-zinc-800/70" type="button" @click="toggleMute(s)">
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13.73 21a2 2 0 0 1-3.46 0"/><path d="M18.63 13A17.89 17.89 0 0 1 18 8"/><path d="M6.26 6.26A5.86 5.86 0 0 0 6 8c0 7-3 9-3 9h14"/><path d="M18 8a6 6 0 0 0-9.33-5"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              {{ s.isMuted ? '恢复提醒' : '免打扰' }}
            </button>
            <button class="w-full flex items-center gap-2 px-2.5 py-2 rounded-[5%] text-xs text-red-500 hover:bg-red-500/10" type="button" @click="removeSession(s)">
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              删除会话
            </button>
          </div>
        </span>
      </button>
      </template>
    </div>

    <!-- 底部 Tab 切换：下划线指示（与社区详情卡 tab 同构） -->
    <div class="mt-2 pt-2 border-t border-zinc-200/60 dark:border-zinc-700/60 flex items-center" role="tablist" aria-label="会话分类">
      <button
        v-for="b in BOTTOM_TABS"
        :key="b.key"
        class="relative flex-1 h-10 text-sm transition-colors inline-flex items-center justify-center gap-1.5"
        type="button"
        role="tab"
        :aria-selected="tab === b.key"
        :tabindex="tab === b.key ? 0 : -1"
        :class="tab === b.key ? 'text-amber-600 dark:text-amber-400 font-medium' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'"
        @click="switchTab(b.key)"
      >
        <span>{{ b.label }}</span>
        <span v-if="b.key === 'messages' && msgUnread > 0" class="min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center font-numeric">{{ msgUnread > 99 ? '99+' : msgUnread }}</span>
        <span v-if="tab === b.key" class="absolute left-6 right-6 bottom-0 h-px rounded-full bg-amber-500"></span>
      </button>
    </div>

    <!-- 右键菜单（关闭：点击遮罩 / Escape） -->
    <div v-if="ctxMenu" class="fixed inset-0 z-40" @click="ctxMenu = null" @contextmenu.prevent="ctxMenu = null"></div>
    <div v-if="ctxMenu" class="fixed z-50 w-40 qm-surface p-1.5" :style="{ left: ctxMenu.x + 'px', top: ctxMenu.y + 'px' }">
      <button v-if="canMarkRead(ctxMenu.s)" class="w-full flex items-center gap-2 px-2.5 py-2 rounded-[5%] text-xs text-zinc-600 dark:text-zinc-300 hover:bg-white/70 dark:hover:bg-zinc-800/70" type="button" @click="markOneRead(ctxMenu.s)">
        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
        设为已读
      </button>
      <button v-if="ctxMenu.s.groupId" class="w-full flex items-center gap-2 px-2.5 py-2 rounded-[5%] text-xs text-zinc-600 dark:text-zinc-300 hover:bg-white/70 dark:hover:bg-zinc-800/70" type="button" @click="onCtxGroupManage">
        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        群管理
      </button>
      <button v-if="!isNotify(ctxMenu.s)" class="w-full flex items-center gap-2 px-2.5 py-2 rounded-[5%] text-xs text-zinc-600 dark:text-zinc-300 hover:bg-white/70 dark:hover:bg-zinc-800/70" type="button" @click="onCtxPin">
        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1z"/></svg>
        {{ ctxMenu.s.isPinned ? '取消置顶' : '置顶' }}
      </button>
      <button v-if="!isNotify(ctxMenu.s)" class="w-full flex items-center gap-2 px-2.5 py-2 rounded-[5%] text-xs text-red-500 hover:bg-red-500/10" type="button" @click="onCtxDelete">
        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        删除会话
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
// 会话侧边栏：会话/好友/群聊列表、通知列表、会话操作。
// 添加/搜索好友与创建/搜索群聊都在右侧栏以面板呈现（按路由 query 切换），本组件只负责入口跳转。
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { charAvatar, groupIconAvatar } from '@/utils/avatar'
import { clockTime } from '@/utils/format'
import { useRouter } from 'vue-router'
import { useChatStore, type SessionDto } from '@/stores/chat'
import { useToastStore } from '@/stores/toast'
import {
  pinSession, unpinSession, muteSession, unmuteSession, deleteSession
} from '@/api/chat'
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '@/api/notification'
import { unwrap } from '@/utils/response'
import { notificationMeta } from '@/utils/notifications'

/** 列表项：会话 + 系统通知的并集（通知以 notifyGuid 区分） */
type SessionItem = SessionDto & {
  notifyGuid?: string
  /** 通知类型（notificationMeta 的键，如 TweetLiked） */
  type?: string
  title?: string
  content?: string
}

interface CtxMenuData {
  s: SessionItem
  x: number
  y: number
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
const notifItems = ref<SessionItem[]>([])
const sessionMenuTarget = ref<string | null>(null)
const ctxMenu = ref<CtxMenuData | null>(null)
const allReadBusy = ref(false)

// 空态图标：按页签存 path 数组，由模板统一渲染（原先是把整段 svg 拼成字符串再 v-html）
const EMPTY_ICON_PATHS: Record<string, string[]> = {
  groups: [
    'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2',
    'M5 7a4 4 0 1 0 8 0a4 4 0 1 0-8 0',
    'M23 21v-2a4 4 0 0 0-3-3.87',
    'M16 3.13a4 4 0 0 1 0 7.75'
  ],
  messages: [
    'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9',
    'M13.73 21a2 2 0 0 1-3.46 0'
  ],
  friends: ['M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z']
}
const emptyIconPaths = computed(() => EMPTY_ICON_PATHS[tab.value] || EMPTY_ICON_PATHS.friends)

const friendSessions = computed(() => chat.sessions.filter((s) => !s.groupId))
const groupSessions = computed(() => chat.sessions.filter((s) => !!s.groupId))
const messageItems = computed<SessionItem[]>(() => {
  const at = (x: SessionItem) => x.lastMessageTime || x.createdTime || x.createTime || 0
  return [...chat.sessions, ...notifItems.value].sort((a, b) => at(b) - at(a))
})
const visibleSessions = computed<SessionItem[]>(() => {
  if (tab.value === 'groups') return groupSessions.value
  if (tab.value === 'messages') return messageItems.value
  return friendSessions.value
})
const msgUnread = computed(() => messageItems.value.reduce((sum, s) => sum + rowUnread(s), 0))
const emptyText = computed(() => {
  if (tab.value === 'groups') return '暂无群聊，可在「群聊」页签右上角创建或搜索'
  if (tab.value === 'messages') return '暂无消息，在「好友」页签里找人聊聊'
  return '暂无好友，点右上角添加好友'
})

function switchTab(t: string) {
  tab.value = t
  sessionMenuTarget.value = null
  ctxMenu.value = null
}

function isNotify(s: SessionItem): boolean { return !!s.notifyGuid }
function rowUnread(s: SessionItem): number { return isNotify(s) ? (s.isRead ? 0 : 1) : (s.unreadCount || 0) }
function rowTimestamp(s: SessionItem): number | undefined {
  return (s.lastMessageTime || s.createdTime || s.createTime) as number | undefined
}
function notifyText(n: SessionItem): string { return ((n.title ? n.title + '：' : '') + (n.content || '')).replace(/\s+/g, ' ').trim() }
/** 列表行标题：通知用元数据名，会话统一走 store 的展示解析（侧栏与头部因此不再不一致） */
function rowTitle(s: SessionItem): string {
  return isNotify(s) ? notificationMeta(s.type).name : chat.sessionTitle(s)
}
function isActiveRow(s: SessionItem): boolean {
  return !isNotify(s) && chat.activeSessionId === s.sessionId
}
function canMarkRead(s: SessionItem): boolean {
  return isNotify(s) ? !s.isRead : rowUnread(s) > 0
}

/** 列表右上角的功能入口 → 右侧面板的路由 action（入口 key 即 action 名） */
const PANEL_ACTIONS = new Set(['createGroup', 'searchGroup', 'addFriend', 'searchFriend'])

const listMoreActions = computed(() => {
  if (tab.value === 'groups') {
    return [
      {
        key: 'createGroup',
        label: '创建群聊',
        icon: [
          'M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2',
          'M4.5 7a4 4 0 1 0 8 0a4 4 0 1 0-8 0',
          'M20 8v6M23 11h-6'
        ]
      },
      { key: 'searchGroup', label: '搜索群聊', icon: ['M3 11a8 8 0 1 0 16 0a8 8 0 1 0-16 0', 'M21 21l-4.35-4.35'] }
    ]
  }
  return [
    {
      key: 'addFriend',
      label: '添加好友',
      icon: [
        'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2',
        'M5 7a4 4 0 1 0 8 0a4 4 0 1 0-8 0',
        'M19 8v6M22 11h-6'
      ]
    },
    { key: 'searchFriend', label: '搜索好友', icon: ['M3 11a8 8 0 1 0 16 0a8 8 0 1 0-16 0', 'M21 21l-4.35-4.35'] }
  ]
})

function onListMoreAction(key: string) {
  // 四个入口统一在右侧会话栏内以面板呈现（不再弹窗），与群聊创建/搜索同构
  if (PANEL_ACTIONS.has(key)) router.push({ path: '/chat', query: { action: key } })
}

function onItemClick(s: SessionItem) {
  if (isNotify(s)) {
    void markNotifyRead(s)
    return
  }
  void openChat(s)
}

async function openChat(s: SessionItem) {
  sessionMenuTarget.value = null
  const real = chat.sessions.find((x) => x.sessionId === s.sessionId)
  if (!real) return
  // 会话激活收敛到 store 的唯一入口（含加载消息、清零未读、标记已读）；
  // 本处只负责同步 URL —— 路由 watcher 收到同一 id 时 activateSession 已幂等，不会重复标记
  await chat.activateSession(real.sessionId)
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
  if (!canMarkRead(s) && isNotify(s)) return
  const base = canMarkRead(s) ? (isNotify(s) ? 1 : 3) : 2
  const itemCount = base + (s.groupId ? 1 : 0)
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
    await markNotifyRead(s)
    return
  }
  await chat.markUnreadRead(s.sessionId)
  if (s.unreadCount) s.unreadCount = 0
  toast.push('已设为已读', 'success')
}

async function markAllRead() {
  if (allReadBusy.value || msgUnread.value === 0) return
  allReadBusy.value = true
  try {
    await chat.markUnreadRead()
    try { await markAllNotificationsRead() } catch (e) { /* 忽略 */ }
    chat.sessions.forEach((s) => { s.unreadCount = 0 })
    notifItems.value.forEach((n) => { n.isRead = true })
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
    toast.push('操作失败，请稍后重试', 'error')
  }
}

async function toggleMute(s: SessionItem) {
  try {
    if (s.isMuted) await unmuteSession(s.sessionId || '')
    else await muteSession(s.sessionId || '')
    s.isMuted = !s.isMuted
    toast.push(s.isMuted ? '已开启免打扰' : '已恢复提醒', 'success')
  } catch (e) {
    toast.push('操作失败，请稍后重试', 'error')
  }
}

async function removeSession(s: SessionItem) {
  try {
    await deleteSession(s.sessionId || '')
    chat.removeSession(s.sessionId || '')
    toast.push('会话已删除', 'success')
  } catch (e) {
    toast.push('删除失败，请稍后重试', 'error')
  }
}

function onCtxPin() {
  const s = ctxMenu.value?.s
  ctxMenu.value = null
  if (s) void togglePin(s)
}

/** 群管理入口：跳转到会话页并打开群管理面板（成员/改群名/退出/解散都在面板内完成，含确认与 toast） */
function openGroupManage(s: SessionItem) {
  sessionMenuTarget.value = null
  ctxMenu.value = null
  if (!s.groupId) return
  router.push({ path: '/chat', query: { action: 'manageGroup', group: String(s.groupId) } })
}

function onCtxGroupManage() {
  const s = ctxMenu.value?.s
  ctxMenu.value = null
  if (s) openGroupManage(s)
}

function onCtxDelete() {
  const s = ctxMenu.value?.s
  ctxMenu.value = null
  if (s) void removeSession(s)
}

/** 会话头像加载失败：群聊回退群图标，单聊回退对端首字头像，避免留下空洞/破图 */
function onAvatarError(s: SessionItem, e: Event): void {
  const el = e.target as HTMLImageElement
  const fallback = s.groupId
    ? groupIconAvatar()
    : charAvatar(chat.sessionTitle(s).charAt(0) || '友', '#a1a1aa')
  if (el.src !== fallback) el.src = fallback
}

async function loadNotifications() {
  try {
    const data = unwrap(await getNotifications({ pageSize: 20 }))
    // 诚实空态：无数据时不填充示例通知
    notifItems.value = (data && (data.items || data.list)) || []
  } catch (e) {
    notifItems.value = []
  }
}

// 右键菜单：Escape 关闭（原先靠一个 tabindex=0 的可点击 div 监听按键）
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    ctxMenu.value = null
    sessionMenuTarget.value = null
  }
}

onMounted(async () => {
  document.addEventListener('keydown', onKeydown)
  await chat.ensureLoaded()
  await loadNotifications()
})

onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))
</script>