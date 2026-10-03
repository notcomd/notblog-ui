<template>
  <!-- 好友弹窗：添加好友 / 搜索好友（与 ChatGroupDialogs 同为 mode 驱动的双面板） -->
  <div
    class="fixed inset-0 z-[70] flex items-center justify-center bg-black/30"
    role="dialog"
    aria-modal="true"
    :aria-label="mode === 'add' ? '添加好友' : '搜索好友'"
    @click.self="emit('close')"
  >
    <!-- 添加好友 -->
    <div v-if="mode === 'add'" class="glass-card p-6 w-[min(26rem,92vw)]">
      <h3 class="text-lg font-bold text-zinc-800 dark:text-zinc-100 mb-1">添加好友</h3>
      <p class="text-xs text-zinc-400 mb-4">输入对方邮箱或昵称查找用户并发起好友请求</p>
      <div class="flex gap-2">
        <input
          v-model="addKeyword"
          type="text"
          name="addKeyword"
          aria-label="对方邮箱或昵称"
          class="flex-1 min-w-0 rounded-[5%] bg-white/60 dark:bg-zinc-800/60 border border-white/60 dark:border-white/10 px-3.5 py-2.5 text-sm outline-none"
          placeholder="对方邮箱或昵称"
          @keydown.enter.exact.prevent="onLookupEnter"
        />
        <button class="h-10 px-4 rounded-[5%] bg-gradient-to-r from-amber-400 to-orange-500 text-white text-sm font-medium disabled:opacity-50" type="button" :disabled="addLoading || !addKeyword.trim()" @click="lookupUser">查找</button>
      </div>
      <div class="mt-4">
        <div v-if="addLoading" class="py-8 text-center text-xs text-zinc-400" role="status">查找中…</div>
        <div v-else-if="addNotFound" class="py-8 text-center text-xs text-zinc-400" role="status">未找到该用户，请确认邮箱或昵称是否正确</div>
        <div v-else-if="addUser" class="flex items-center gap-3 p-3 rounded-[5%] bg-white/60 dark:bg-zinc-800/60">
          <img :src="addUser.imageCover || charAvatar((addUser.userName || '友').charAt(0), '#a1a1aa')" alt="" width="48" height="48" class="w-12 h-12 rounded-[10px] object-cover" @error="onAvatarError" />
          <span class="flex-1 min-w-0 text-sm font-medium text-zinc-800 dark:text-zinc-100 truncate">{{ addUser.userName || '未命名用户' }}</span>
          <span v-if="addUserIsSelf" class="shrink-0 text-xs px-2 py-1 rounded-[5%] bg-zinc-100 dark:bg-zinc-800 text-zinc-500">不能添加自己</span>
          <span v-else-if="addUserIsFriend" class="shrink-0 text-xs px-2 py-1 rounded-[5%] bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300">已是好友</span>
          <button v-else class="h-9 px-3.5 rounded-[5%] bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-medium disabled:opacity-50" type="button" :disabled="addSending" @click="sendAddRequest">发送好友请求</button>
        </div>
      </div>
    </div>

    <!-- 搜索好友 -->
    <div v-else class="glass-card p-6 w-[min(26rem,92vw)] max-h-[85vh] flex flex-col">
      <h3 class="text-lg font-bold text-zinc-800 dark:text-zinc-100 mb-3">搜索好友</h3>
      <div class="flex gap-2">
        <input
          v-model="friendKeyword"
          name="friendKeyword"
          aria-label="按备注搜索好友"
          class="flex-1 min-w-0 rounded-[5%] bg-white/60 dark:bg-zinc-800/60 border border-white/60 dark:border-white/10 px-3.5 py-2.5 text-sm outline-none"
          placeholder="按备注搜索好友"
          @keydown.enter.exact.prevent="onFriendSearchEnter"
        />
        <button class="h-10 px-4 rounded-[5%] bg-gradient-to-r from-amber-400 to-orange-500 text-white text-sm font-medium disabled:opacity-50" type="button" :disabled="friendSearching || !friendKeyword.trim()" @click="doFriendSearch">搜索</button>
      </div>
      <div class="mt-4 flex-1 min-h-0 overflow-y-auto overscroll-contain space-y-1">
        <div v-if="friendSearching" class="py-8 text-center text-xs text-zinc-400" role="status">搜索中…</div>
        <div v-else-if="friendSearched && friendResults.length === 0" class="py-8 text-center text-xs text-zinc-400" role="status">未找到匹配的好友</div>
        <button
          v-for="f in friendResults"
          :key="f.friendshipId || f.friendId"
          type="button"
          class="w-full flex items-center gap-3 px-3 py-2 rounded-[5%] transition-colors text-left hover:bg-white/60 dark:hover:bg-zinc-800/60"
          @click="openFriendChat(f)"
        >
          <img :src="f.friendAvatar || charAvatar('友', '#a1a1aa')" alt="" width="40" height="40" class="w-10 h-10 rounded-[10px] object-cover" @error="onAvatarError" />
          <span class="flex-1 min-w-0 text-sm font-medium text-zinc-700 dark:text-zinc-200 truncate">{{ friendDisplayName(f) }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 好友相关弹窗：查找用户并发起好友请求 / 按备注搜索好友并打开会话。
// 从 ChatSidebar 拆出（该文件已 500+ 行），与 ChatGroupDialogs 的 mode 约定保持一致。
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { createSession, lookupUsers, searchFriends, sendFriendRequest } from '@/api/chat'
import { unwrap } from '@/utils/response'
import { charAvatar } from '@/utils/avatar'
import { useChatStore } from '@/stores/chat'
import { useToastStore } from '@/stores/toast'

defineProps<{ mode: 'add' | 'search' }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const chat = useChatStore()
const toast = useToastStore()
const router = useRouter()

// ===== 添加好友 =====
interface LookupUser {
  userGuid: string
  userName?: string
  imageCover?: string
}

const addKeyword = ref('')
const addUser = ref<LookupUser | null>(null)
const addLoading = ref(false)
const addNotFound = ref(false)
const addSending = ref(false)

const addUserIsSelf = computed(
  () => !!addUser.value && String(addUser.value.userGuid) === String(chat.currentUserId())
)
const addUserIsFriend = computed(
  () => !!addUser.value && chat.friends.some((f) => String(f.friendId) === String(addUser.value?.userGuid))
)

function onLookupEnter(e: KeyboardEvent): void {
  if (e.isComposing || e.keyCode === 229) return
  void lookupUser()
}

/** 查找用户：走 Message 服务 GET /api/users/lookup（需认证 + 精确匹配 + 按用户限流） */
async function lookupUser(): Promise<void> {
  const keyword = addKeyword.value.trim()
  if (!keyword || addLoading.value) return
  addLoading.value = true
  addNotFound.value = false
  addUser.value = null
  try {
    const data = unwrap(await lookupUsers(keyword))
    const first = (Array.isArray(data) ? data : [])[0]
    if (!first) {
      addNotFound.value = true
      return
    }
    addUser.value = { userGuid: first.userGuid, userName: first.userName, imageCover: first.avatar }
  } catch (e: any) {
    toast.push(e?.message || '查找失败，请稍后重试', 'error')
  } finally {
    addLoading.value = false
  }
}

async function sendAddRequest(): Promise<void> {
  const u = addUser.value
  if (!u || addSending.value || addUserIsSelf.value || addUserIsFriend.value) return
  addSending.value = true
  try {
    await sendFriendRequest({ friendId: u.userGuid })
    toast.push('好友请求已发送，等待对方验证', 'success')
    emit('close')
  } catch (e: any) {
    toast.push('发送失败：' + (e?.message || '请稍后重试'), 'error')
  } finally {
    addSending.value = false
  }
}

// ===== 搜索好友 =====
interface FriendRow {
  friendshipId?: string
  friendId: string
  friendName?: string
  remark?: string
  friendAvatar?: string
}

const friendKeyword = ref('')
const friendResults = ref<FriendRow[]>([])
const friendSearching = ref(false)
const friendSearched = ref(false)

function onFriendSearchEnter(e: KeyboardEvent): void {
  if (e.isComposing || e.keyCode === 229) return
  void doFriendSearch()
}

async function doFriendSearch(): Promise<void> {
  const kw = friendKeyword.value.trim()
  if (!kw || friendSearching.value) return
  friendSearching.value = true
  friendSearched.value = true
  try {
    const data = unwrap(await searchFriends({ searchTerm: kw }))
    friendResults.value = (data && (data.items || data.list || data)) || []
  } catch (e) {
    friendResults.value = []
    toast.push('搜索失败，请稍后重试', 'error')
  } finally {
    friendSearching.value = false
  }
}

function friendDisplayName(f: FriendRow): string {
  return f.friendName || f.remark || '好友 ' + String(f.friendId).slice(0, 8)
}

async function openFriendChat(f: FriendRow): Promise<void> {
  try {
    const d = unwrap(await createSession(f.friendId))
    const sessionId = typeof d === 'string' ? d : (d && (d.sessionId || d.id)) || ''
    if (!sessionId) throw new Error('no sessionId')
    await chat.loadSessions()
    emit('close')
    router.push('/chat/' + sessionId)
  } catch (e) {
    toast.push('无法发起会话，请稍后重试', 'error')
  }
}

/** 头像加载失败：换首字头像，避免留下空洞 */
function onAvatarError(e: Event): void {
  const el = e.target as HTMLImageElement
  const fallback = charAvatar('友', '#a1a1aa')
  if (el.src !== fallback) el.src = fallback
}

// Escape 关闭（弹窗可键盘退出）
function onKeydown(e: KeyboardEvent): void {
  if (e.key === 'Escape') emit('close')
}
onMounted(() => document.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))
</script>