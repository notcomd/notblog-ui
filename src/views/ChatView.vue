<template>
  <div class="max-w-[1400px] mx-auto flex gap-5 h-[calc(100vh-7.5rem)]">
    <!-- ===== 左：消息列表（切换按钮在底部） ===== -->
    <div class="w-80 shrink-0 flex flex-col glass-card p-3 min-h-0">
      <!-- 列表区 -->
      <div class="flex-1 overflow-y-auto space-y-1 min-h-0">
        <!-- 空态 -->
        <div v-if="visibleSessions.length === 0 && !sessionsLoading" class="py-12 flex flex-col items-center gap-2 text-zinc-400">
          <div class="text-4xl">{{ emptyIcon }}</div>
          <p class="text-xs">{{ emptyText }}</p>
        </div>

        <!-- 列表项：头像 | 名称+日期 / 消息 两列（高度按头像） -->
        <button
          v-for="s in visibleSessions"
          :key="s.sessionId || s.notifyGuid"
          class="w-full flex items-center gap-3 px-3 py-2 rounded-[5%] transition-all text-left"
          :class="isActiveRow(s) ? 'bg-gradient-to-r from-amber-400/15 to-orange-400/10' : 'hover:bg-white/60 dark:hover:bg-zinc-800/60'"
          @click="onItemClick(s)"
        >
          <!-- 头像（通知项为类型图标） -->
          <div class="relative shrink-0">
            <img v-if="!isNotify(s)" :src="sessionAvatar(s)" alt="" class="w-11 h-11 rounded-[5%] object-cover border border-white/60 dark:border-white/10" @error="hideImg" />
            <div v-else class="w-11 h-11 rounded-[5%] flex items-center justify-center" :class="notificationMeta(s.type).bg">
              <svg class="w-5 h-5" :class="notificationMeta(s.type).fg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" v-html="notificationMeta(s.type).icon"></svg>
            </div>
            <!-- 实时在线状态（好友单聊） -->
            <span v-if="!isNotify(s) && !s.groupId" class="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-zinc-800" :class="isRowOnline(s) ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-600'"></span>
          </div>

          <!-- 消息视图右列：名称+日期 / 消息 两列（高度按头像，单行省略号不可展开） -->
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

          <!-- 好友/群聊视图右列：仅头像对应的名称（不显示消息内容和时间） -->
          <span v-else class="flex-1 min-w-0 flex items-center justify-between gap-2">
            <span class="text-sm font-medium text-zinc-700 dark:text-zinc-200 truncate">{{ sessionTitle(s) }}</span>
            <span v-if="rowUnread(s) > 0" class="min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">{{ rowUnread(s) > 99 ? '99+' : rowUnread(s) }}</span>
          </span>

          <!-- 示例数据徽标 -->
          <span v-if="s.isSample" class="shrink-0 text-[10px] leading-none px-1 py-0.5 rounded-[5%] bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-300">示例</span>

          <!-- 会话操作（通知项无） -->
          <span v-if="!isNotify(s)" class="relative shrink-0" @click.stop>
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

      <!-- 底部：按钮切换（好友 | 群聊 | 消息） -->
      <div class="mt-2 pt-2 border-t border-zinc-200/60 dark:border-zinc-700/60 flex gap-1">
        <button
          v-for="b in BOTTOM_TABS"
          :key="b.key"
          class="flex-1 py-2 rounded-[5%] text-sm font-medium transition-all inline-flex items-center justify-center gap-1.5"
          :class="tab === b.key
            ? 'bg-amber-400/15 text-amber-600 dark:text-amber-300'
            : 'text-zinc-500 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'"
          @click="switchTab(b.key)"
        >
          <span>{{ b.label }}</span>
          <span v-if="b.key === 'messages' && msgUnread > 0" class="min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">{{ msgUnread > 99 ? '99+' : msgUnread }}</span>
        </button>
      </div>
    </div>

    <!-- ===== 右：聊天窗 ===== -->
    <div class="flex-1 min-w-0 glass-card flex flex-col min-h-0">
      <!-- 顶部：会话标题栏（居中显示会话者名称，左侧通话/视频/更多按钮） -->
      <div v-if="active" class="relative px-5 py-3 border-b border-zinc-200/60 dark:border-zinc-700/60 flex items-center justify-center shrink-0">
        <!-- 左侧操作按钮组（通知查看模式不显示） -->
        <div v-if="!isNotify(active)" class="absolute left-4 flex items-center gap-1.5">
          <button class="w-9 h-9 rounded-[5%] flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:bg-white/60 dark:hover:bg-zinc-800/60 hover:text-emerald-500 transition-colors" title="语音通话" @click="toast.push('语音通话开发中（Phase 8）', 'info')">
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
          </button>
          <button class="w-9 h-9 rounded-[5%] flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:bg-white/60 dark:hover:bg-zinc-800/60 hover:text-amber-500 transition-colors" title="视频通话" @click="toast.push('视频通话开发中（Phase 8）', 'info')">
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 7l-7 5 7 5V7z" /><rect x="1" y="5" width="15" height="14" rx="2" /></svg>
          </button>
          <!-- 群成员（仅群聊显示） -->
          <button v-if="active && active.groupId" class="w-9 h-9 rounded-[5%] flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:bg-white/60 dark:hover:bg-zinc-800/60 hover:text-amber-500 transition-colors" title="群成员" @click="memberOpen = !memberOpen">
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
          </button>
          <!-- 群成员面板 -->
          <div v-if="memberOpen" class="fixed inset-0 z-40" @click="memberOpen = false"></div>
          <div v-if="memberOpen" class="absolute left-4 top-full mt-1 w-72 z-50 rounded-[5%] bg-white dark:bg-zinc-800/95 border border-zinc-200/70 dark:border-zinc-700/60 p-2">
            <div class="px-2 py-1.5 text-sm font-medium text-zinc-800 dark:text-zinc-100 border-b border-zinc-200/70 dark:border-zinc-700/60">群成员（{{ members.length }} 人）</div>
            <div class="max-h-72 overflow-y-auto">
              <div v-for="mb in members" :key="mb.id" class="flex items-center gap-2.5 px-2 py-2">
                <img :src="mb.avatar" alt="" class="w-9 h-9 rounded-[5%] object-cover border border-white/60 dark:border-white/10 shrink-0" @error="hideImg" />
                <span class="flex-1 min-w-0 text-sm text-zinc-700 dark:text-zinc-200 truncate">{{ mb.name }}</span>
                <span class="flex items-center gap-1 text-xs shrink-0" :class="mb.online ? 'text-emerald-500' : 'text-zinc-400'">
                  <span class="w-2 h-2 rounded-full" :class="mb.online ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-600'"></span>
                  {{ mb.online ? '在线' : '离线' }}
                </span>
              </div>
            </div>
          </div>
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
          <img v-if="!isNotify(active)" :src="sessionAvatar(active)" alt="" class="w-9 h-9 rounded-[5%] object-cover" @error="hideImg" />
          <div v-else class="w-9 h-9 rounded-[5%] flex items-center justify-center" :class="notificationMeta(active.type).bg">
            <svg class="w-5 h-5" :class="notificationMeta(active.type).fg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" v-html="notificationMeta(active.type).icon"></svg>
          </div>
          <div>
            <div class="text-sm font-semibold text-zinc-800 dark:text-zinc-100">{{ isNotify(active) ? notificationMeta(active.type).name : sessionTitle(active) }}</div>
            <div class="text-xs text-zinc-400 mt-0.5 text-center">
              <span v-if="isNotify(active)">系统通知</span>
              <span v-else-if="isFriendSession(active)">
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
          <!-- 消息（自己靠右，对方靠左；每条显示发送者头像 + 名称） -->
          <div v-for="m in activeMessages" :key="m.messageId" class="flex items-start gap-2.5" :class="isMine(m) ? 'justify-end' : 'justify-start'">
            <img :src="senderAvatar(m)" alt="" class="w-8 h-8 rounded-[5%] object-cover border border-white/60 dark:border-white/10 shrink-0" :class="isMine(m) ? 'order-2' : ''" @error="hideImg" />
            <div class="relative max-w-[70%] min-w-0 w-fit pt-4">
              <!-- 发送者名称（absolute 不撑宽容器，气泡宽度由内容决定，头像紧贴气泡） -->
              <div class="absolute top-0 text-xs text-zinc-400 px-1 truncate max-w-[220px]" :class="isMine(m) ? 'right-0 text-right' : 'left-0'">{{ senderName(m) }}</div>
              <div v-if="m.isRecalled" class="px-4 py-2 rounded-[5%] text-xs text-zinc-400 bg-zinc-100 dark:bg-zinc-800/60 w-fit">消息已撤回</div>
              <div v-else class="px-4 py-2.5 rounded-[5%] text-sm leading-relaxed break-words w-fit max-w-full"
                :class="isMine(m) ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-white rounded-br-md' : 'bg-white/80 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-200 rounded-bl-md'">
                {{ m.content }}
              </div>
              <div class="text-[10px] text-zinc-400 mt-1 px-1 w-fit" :class="isMine(m) ? 'ml-auto text-right' : ''">
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

      <!-- 底部：输入区（通知查看模式不显示，聊天窗仅用于查看消息） -->
      <div v-if="active && !isNotify(active)" class="px-5 py-3.5 border-t border-zinc-200/60 dark:border-zinc-700/60 shrink-0">
        <div class="flex items-end gap-2">
          <div class="relative flex-1">
            <textarea
              v-model="draft"
              ref="draftBox"
              rows="1"
              class="w-full resize-none rounded-[5%] bg-white/60 dark:bg-zinc-800/60 border border-white/50 dark:border-white/10 px-3.5 py-2.5 text-sm leading-5 outline-none focus:ring-2 focus:ring-amber-400/50 transition-all min-h-[40px] max-h-[120px] overflow-y-auto"
              placeholder="输入消息，Enter 发送，Shift+Enter 换行"
              @keydown.enter.exact.prevent="onEnter"
              @input="onInput"
            ></textarea>
            <div v-if="emojiOpen" class="absolute bottom-full left-0 mb-2 glass-card p-2 w-64 z-20">
              <div class="grid grid-cols-8 gap-1">
                <button v-for="e in EMOJIS" :key="e" class="w-7 h-7 rounded-[5%] hover:bg-amber-50 dark:hover:bg-zinc-800 text-base transition-colors" @click="insertEmoji(e)">{{ e }}</button>
              </div>
            </div>
          </div>
          <button class="w-10 h-10 rounded-[5%] flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:bg-white/60 dark:hover:bg-zinc-800/60 transition-colors shrink-0" title="表情" @click="emojiOpen = !emojiOpen; moreOpen = false">
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" /></svg>
          </button>
          <!-- 更多（图片/文件/视频等后续扩展） -->
          <div class="relative shrink-0">
            <button class="w-10 h-10 rounded-[5%] flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:bg-white/60 dark:hover:bg-zinc-800/60 transition-colors" title="更多" @click="moreOpen = !moreOpen; emojiOpen = false">
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></svg>
            </button>
            <div v-if="moreOpen" class="absolute bottom-full left-0 mb-2 w-36 glass-card p-1.5 z-20">
              <button v-for="a in MORE_ACTIONS" :key="a.key" class="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs text-zinc-600 dark:text-zinc-300 hover:bg-white/70 dark:hover:bg-zinc-800/70 transition-colors" @click="onMoreAction(a)">{{ a.label }}</button>
            </div>
          </div>
          <button class="h-10 px-4 rounded-[5%] bg-gradient-to-r from-amber-400 to-orange-500 text-white text-sm font-medium hover: active:scale-95 transition-all disabled:opacity-50 shrink-0" :disabled="!draft.trim() || sending" @click="send">发送</button>
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
import { getNotifications, markNotificationRead } from '@/api/notification'
import { notificationMeta, SAMPLE_NOTIFICATIONS } from '@/utils/notifications'
import { useToastStore } from '@/stores/toast'
import { useAuthStore } from '@/stores/auth'

const chat = useChatStore()
const toast = useToastStore()
const route = useRoute()
const auth = useAuthStore()

// 底部切换按钮：消息 | 好友 | 群聊（消息 = 好友+群聊+通知 统一列表，排最前）
const BOTTOM_TABS = [
  { key: 'messages', label: '消息' },
  { key: 'friends', label: '好友' },
  { key: 'groups', label: '群聊' }
]

const tab = ref('messages')
const draft = ref('')
const emojiOpen = ref(false)
const moreOpen = ref(false)
const sending = ref(false)
const sessionsLoading = ref(true)
const msgBox = ref(null)
const draftBox = ref(null)
let typingTimer = null
let scrollLock = false

// 输入区「更多」菜单（图片/文件/视频等后续扩展）
const MORE_ACTIONS = [
  { key: 'image', label: '🖼️ 图片', tip: '图片上传开发中（Phase 7）' },
  { key: 'file', label: '📁 文件', tip: '文件上传开发中（Phase 7）' },
  { key: 'video', label: '🎬 视频', tip: '视频上传开发中（Phase 7）' }
]

const EMOJIS = ['😀', '😄', '😂', '🤣', '😊', '😍', '😘', '🥰', '😎', '🤔', '👍', '👏', '🙏', '💪', '🔥', '🎉', '❤️', '⭐', '🌹', '🍻', '☕', '🎂', '🚀', '🌈', '🌊', '🏔️', '🐱', '🐶', '🍀', '✨']

// ===== 演示数据（后端离线/无会话时展示；isSample 标记「示例」徽标） =====
function demoAvatar(char, bg) {
  return 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="${bg}"/><text x="50" y="62" font-size="40" text-anchor="middle" fill="#fff" font-family="sans-serif">${char}</text></svg>`)
}

const SAMPLE_SESSIONS = [
  { sessionId: 'demo-friend-1', sessionName: '小明', avatarUrl: demoAvatar('明', '#f59e0b'), participants: ['demo-peer-1'], demoOnline: true, lastMessageContent: '周末露营的装备清单我精简到 12 件了，你再看看还缺不缺什么，缺的话我周末顺路帮你带', lastMessageTime: Date.now() - 2 * 60 * 1000, unreadCount: 2, isPinned: false, isMuted: false, isSample: true },
  { sessionId: 'demo-friend-2', sessionName: '林小满', avatarUrl: demoAvatar('林', '#10b981'), participants: ['demo-peer-2'], demoOnline: false, lastMessageContent: '新发的作品求支持～点开帮我看看构图有没有问题', lastMessageTime: Date.now() - 3 * 60 * 60 * 1000, unreadCount: 0, isPinned: false, isMuted: false, isSample: true },
  { sessionId: 'demo-group-1', groupId: 'demo-group-1', sessionName: '兴趣部落交流群', avatarUrl: demoAvatar('部', '#6366f1'), participants: ['demo-peer-1', 'demo-peer-2'], demoMembers: [{ id: 'demo-peer-1', name: '李雷', avatar: demoAvatar('李', '#f59e0b'), online: true }, { id: 'demo-peer-2', name: '王芳', avatar: demoAvatar('王', '#10b981'), online: false }], lastMessageContent: '李雷：欢迎新成员加入！记得先看群公告，本周六有线下见面会，想参加的接龙报名哦', lastMessageTime: Date.now() - 26 * 60 * 60 * 1000, unreadCount: 5, isPinned: false, isMuted: false, isSample: true },
  { sessionId: 'demo-group-2', groupId: 'demo-group-2', sessionName: '摄影爱好者群', avatarUrl: demoAvatar('摄', '#ec4899'), participants: ['demo-peer-1', 'demo-peer-2'], demoMembers: [{ id: 'demo-peer-1', name: '阿凯', avatar: demoAvatar('凯', '#6366f1'), online: true }, { id: 'demo-peer-2', name: '苏苏', avatar: demoAvatar('苏', '#ec4899'), online: false }], lastMessageContent: '王芳：这张星空参数 ISO 3200 曝光 25 秒，光圈 F2.8，供大家参考', lastMessageTime: Date.now() - 2 * 24 * 60 * 60 * 1000, unreadCount: 0, isPinned: false, isMuted: false, isSample: true }
]

// 演示会话集合（可被删除操作修改）
const demoList = ref(SAMPLE_SESSIONS)
// 通知列表（真实接口失败/为空时用示例通知兜底）
const notifItems = ref([])
// 当前打开的演示会话（示例数据无真实后端，本地模拟聊天窗）
const localActive = ref(null)

const myId = computed(() => chat.currentUserId ? chat.currentUserId() : '')
const active = computed(() => {
  if (localActive.value) return localActive.value.session
  return chat.sessions.find(s => s.sessionId === chat.activeSessionId) || null
})
const activeMessages = computed(() => {
  if (localActive.value) return localActive.value.messages
  return (chat.activeSessionId && chat.messages[chat.activeSessionId]) || []
})

// 会话来源：真实数据优先，无数据时用演示数据
const displaySessions = computed(() => {
  if (sessionsLoading.value) return []
  return chat.sessions.length ? chat.sessions : demoList.value
})
const friendSessions = computed(() => displaySessions.value.filter(s => !s.groupId))
const groupSessions = computed(() => displaySessions.value.filter(s => !!s.groupId))
// 「消息」视图 = 好友会话 + 群聊会话 + 通知，按时间倒序
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
  if (tab.value === 'groups') return '暂无群聊，去频道页创建或加入吧'
  if (tab.value === 'messages') return '暂无消息，和好友聊聊吧'
  return '暂无会话，去好友列表发起聊天吧'
})
const emptyIcon = computed(() => (tab.value === 'groups' ? '👥' : tab.value === 'messages' ? '🔔' : '💬'))

function switchTab(t) {
  tab.value = t
  sessionMenuTarget.value = null
}

function isNotify(s) {
  return !!s.notifyGuid
}

function rowTime(s) {
  return timeText(s.lastMessageTime || s.createdTime || s.createTime)
}

function rowUnread(s) {
  return isNotify(s) ? (s.isRead ? 0 : 1) : (s.unreadCount || 0)
}

function notifyText(n) {
  return ((n.title ? n.title + '：' : '') + (n.content || '')).replace(/\s+/g, ' ').trim()
}

function isActiveRow(s) {
  if (localActive.value) {
    if (isNotify(s)) return localActive.value.session.notifyGuid === s.notifyGuid
    return localActive.value.session.sessionId === s.sessionId
  }
  return !isNotify(s) && chat.activeSessionId === s.sessionId
}

// ===== 会话操作（真实端点 /api/sessions；示例数据仅本地生效） =====
const sessionMenuTarget = ref(null)
// 标题栏"更多"下拉
const headerMoreOpen = ref(false)
// 群成员面板
const memberOpen = ref(false)

// 群成员列表（群聊标题栏面板；示例群用 demoMembers，真实群从群对象组装）
const members = computed(() => {
  const a = active.value
  if (!a || !a.groupId) return []
  if (a.demoMembers) return a.demoMembers
  const g = chat.groups.find(x => String(x.id) === String(a.groupId))
  if (g && g.demoMembers) return g.demoMembers
  const pids = (g && g.participants) || a.participants || []
  return pids.map(pid => {
    const f = chat.friends.find(x => String(x.friendId) === String(pid))
    return {
      id: String(pid),
      name: f ? f.friendName : '成员',
      avatar: f && f.friendAvatar ? f.friendAvatar : demoAvatar('友', '#a1a1aa'),
      online: chat.onlineUsers[String(pid)] === true
    }
  })
})

async function togglePin(s) {
  if (s.isSample) {
    s.isPinned = !s.isPinned
    return
  }
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
  if (s.isSample) {
    s.isMuted = !s.isMuted
    return
  }
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
  if (s.isSample) {
    demoList.value = demoList.value.filter(x => x.sessionId !== s.sessionId)
    if (localActive.value && localActive.value.session.sessionId === s.sessionId) localActive.value = null
    return
  }
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

function isRowOnline(s) {
  if (s.isSample) return !!s.demoOnline
  return isOnline(s)
}

function sessionTitle(s) {
  if (s.sessionName) return s.sessionName
  const peerId = chat.peerIdOf(s.sessionId)
  const f = chat.friends.find(x => String(x.friendId) === String(peerId))
  return f ? f.friendName : '会话'
}

function sessionAvatar(s) {
  if (s.avatarUrl) return s.avatarUrl
  if (s.groupId) {
    const g = chat.groups.find(x => String(x.id) === String(s.groupId))
    if (g && g.avatarUrl) return g.avatarUrl
  }
  const peerId = chat.peerIdOf(s.sessionId)
  const f = chat.friends.find(x => String(x.friendId) === String(peerId))
  return f ? f.friendAvatar : 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="#d6d3d1"/><text x="50" y="60" font-size="36" text-anchor="middle" fill="white">💬</text></svg>')
}

function timeText(t) {
  const d = new Date(t)
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return sameDay ? `${hh}:${mm}` : `${d.getMonth() + 1}/${d.getDate()} ${hh}:${mm}`
}

// ===== 消息气泡：发送者标识（自己靠右 + 头像/名称） =====
function isMine(m) {
  return String(m.senderId) === String(myId.value)
}

function senderName(m) {
  // 通知查看模式：显示通知来源名
  if (active.value && isNotify(active.value) && m.senderId === 'notify-sender') {
    return notificationMeta(active.value.type).name
  }
  if (isMine(m)) return (auth.user && auth.user.name) || '我'
  const f = chat.friends.find(x => String(x.friendId) === String(m.senderId))
  if (f) return f.friendName
  // 示例单聊：发送者 = 会话对方（后端离线时好友列表为空）
  const a = active.value
  if (a && a.isSample && !a.groupId && a.participants && a.participants.includes(m.senderId)) {
    return a.sessionName || '用户'
  }
  // 示例群消息：从 demoMembers 匹配发送者名
  const dm = a && a.demoMembers
  if (dm) {
    const hit = dm.find(x => String(x.id) === String(m.senderId))
    if (hit) return hit.name
  }
  return '用户'
}

function senderAvatar(m) {
  if (isMine(m)) {
    const name = (auth.user && auth.user.name) || '我'
    return demoAvatar(name.charAt(0), '#f59e0b')
  }
  const f = chat.friends.find(x => String(x.friendId) === String(m.senderId))
  if (f && f.friendAvatar) return f.friendAvatar
  // 示例单聊：对方头像 = 会话头像
  const a = active.value
  if (a && a.isSample && !a.groupId && a.participants && a.participants.includes(m.senderId) && a.avatarUrl) {
    return a.avatarUrl
  }
  // 示例群消息：从 demoMembers 匹配头像
  const dm = a && a.demoMembers
  if (dm) {
    const hit = dm.find(x => String(x.id) === String(m.senderId))
    if (hit && hit.avatar) return hit.avatar
  }
  return demoAvatar('友', '#a1a1aa')
}

// ===== 点击行 =====
function onItemClick(s) {
  if (isNotify(s)) {
    markNotifyRead(s)
    openNotification(s)
    return
  }
  openChat(s)
}

// 通知查看模式：在聊天窗中展示该通知（聊天窗不仅是发送消息，也是查看消息的地方）
function openNotification(n) {
  headerMoreOpen.value = false
  localActive.value = {
    session: n,
    messages: [{
      messageId: 'notify-' + (n.notifyGuid || Date.now()),
      sessionId: 'notify-view',
      senderId: 'notify-sender',
      receiverId: null,
      messageType: 0,
      status: 1,
      content: notifyText(n),
      sentTime: n.createTime
    }]
  }
  scrollToBottom(true)
}

async function markNotifyRead(n) {
  if (n.isRead) return
  n.isRead = true
  if (!n.isSample) {
    try { await markNotificationRead(n.notifyGuid) } catch (e) { /* 失败忽略 */ }
  }
}

async function openChat(s) {
  sessionMenuTarget.value = null
  if (s.isSample) {
    localActive.value = { session: s, messages: sampleMessages(s) }
    scrollToBottom(true)
    return
  }
  localActive.value = null
  const real = chat.sessions.find(x => x.sessionId === s.sessionId)
  if (!real) return
  await chat.openSession(real.sessionId)
  chat.clearUnread(real.sessionId)
  scrollToBottom(true)
}

// 演示会话的模拟消息（仅本地展示）
function sampleMessages(s) {
  const me = myId.value || 'me'
  const peer = (s.participants && s.participants[0]) || 'demo-peer'
  const base = s.lastMessageTime || Date.now()
  return [
    { messageId: `${s.sessionId}-m1`, sessionId: s.sessionId, senderId: peer, receiverId: null, messageType: 0, status: 1, content: '你好呀，最近怎么样？', sentTime: base - 30 * 60 * 1000 },
    { messageId: `${s.sessionId}-m2`, sessionId: s.sessionId, senderId: me, receiverId: null, messageType: 0, status: 1, content: '还不错！刚看完你的新作品，太棒了 👍', sentTime: base - 28 * 60 * 1000 },
    { messageId: `${s.sessionId}-m3`, sessionId: s.sessionId, senderId: peer, receiverId: null, messageType: 0, status: 1, content: s.lastMessageContent || '周末有空一起出去玩呀', sentTime: base }
  ]
}

async function loadNotifications() {
  try {
    const res = await getNotifications({ pageSize: 20 })
    const items = (res && res.data && (res.data.items || res.data.list)) || []
    notifItems.value = items.length ? items : SAMPLE_NOTIFICATIONS
  } catch (e) {
    // 后端离线/未鉴权 → 示例通知兜底（仅用于展示）
    notifItems.value = SAMPLE_NOTIFICATIONS
  }
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
  if (!content || sending.value) return
  // 示例会话：无真实后端，本地追加消息演示发送
  if (localActive.value) {
    localActive.value.messages.push({
      messageId: 'local-' + Date.now(),
      sessionId: localActive.value.session.sessionId,
      senderId: myId.value || 'me',
      receiverId: null,
      messageType: 0,
      status: 1,
      content,
      sentTime: Date.now()
    })
    draft.value = ''
    resetDraftHeight()
    scrollToBottom(true)
    return
  }
  if (!chat.activeSessionId) return
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

// Enter 发送（中文输入法选词确认时不触发）；Shift+Enter 由浏览器默认行为换行
function onEnter(e) {
  if (e.isComposing || e.keyCode === 229) return
  send()
}

// 发送后把输入框高度重置回单行
function resetDraftHeight() {
  nextTick(() => {
    if (draftBox.value) {
      draftBox.value.style.height = 'auto'
      draftBox.value.style.height = Math.min(draftBox.value.scrollHeight, 120) + 'px'
    }
  })
}

function notifyTyping() {
  if (!chat.activeSessionId) return
  if (typingTimer) clearTimeout(typingTimer)
  typingTimer = setTimeout(() => chat.sendTyping(chat.activeSessionId), 500)
}

// 输入事件：通知 typing + 输入框随内容自动增高（初始一行，最多约 6 行）
function onInput(e) {
  notifyTyping()
  autoGrow(e.target)
}

function autoGrow(el) {
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 120) + 'px'
}

function onMoreAction(a) {
  moreOpen.value = false
  toast.push(a.tip, 'info')
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
  await Promise.all([chat.loadSessions(), chat.loadFriends(), chat.loadGroups(), chat.loadUnread(), loadNotifications()])
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
