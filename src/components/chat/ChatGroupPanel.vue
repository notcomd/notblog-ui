<template>
  <!-- 群聊创建/搜索面板：由 ChatConversation 按 mode 切换显示（扁平容器，与侧栏同构） -->
  <div class="flex-1 min-w-0 flex flex-col min-h-0">
    <!-- 创建群聊 -->
    <template v-if="mode === 'create'">
      <div class="flex items-center gap-3 px-5 py-3 border-b border-zinc-200/60 dark:border-zinc-700/60 shrink-0">
        <button class="w-9 h-9 rounded-[5%] flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:bg-white/60 dark:hover:bg-zinc-800/60" aria-label="关闭" @click="$emit('close')"><svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg></button>
        <span class="text-sm font-semibold text-zinc-800 dark:text-zinc-100">创建群聊</span>
      </div>
      <div class="flex-1 overflow-y-auto px-6 py-5 min-h-0 space-y-5">
        <div class="flex flex-col items-center gap-2.5">
          <div class="w-20 h-20 rounded-[10px] overflow-hidden flex items-center justify-center shrink-0 border border-zinc-200/70 dark:border-zinc-700/60">
            <img v-if="groupAvatarPreview" :src="groupAvatarPreview" alt="" class="w-full h-full object-cover" />
            <span v-else class="w-full h-full flex items-center justify-center text-2xl font-bold text-white" style="background-color: #6366f1">{{ (groupName.trim() || '群').charAt(0) }}</span>
          </div>
          <label class="h-8 px-3 rounded-[5%] bg-amber-400/15 text-amber-600 dark:text-amber-300 text-xs font-medium inline-flex items-center cursor-pointer">
            {{ groupAvatarUpdating ? '上传中…' : '上传头像' }}
            <input type="file" accept="image/jpeg,image/png,image/webp" class="hidden" :disabled="groupAvatarUpdating" @change="onGroupAvatarChange" />
          </label>
        </div>
        <input v-model="groupName" name="groupName" aria-label="群聊名称（必填）" maxlength="30" class="w-full rounded-[5%] bg-white/60 dark:bg-zinc-800/60 border border-white/50 dark:border-white/10 px-3.5 py-2.5 text-sm outline-none" placeholder="群聊名称（必填）" />
        <input v-model="groupDesc" name="groupDesc" aria-label="群聊简介（选填）" maxlength="100" class="w-full rounded-[5%] bg-white/60 dark:bg-zinc-800/60 border border-white/50 dark:border-white/10 px-3.5 py-2.5 text-sm outline-none" placeholder="群聊简介（选填）" />
        <label class="flex items-center gap-2 cursor-pointer select-none">
          <input type="checkbox" v-model="groupPublic" class="accent-amber-500 shrink-0" />
          <span class="text-sm text-zinc-600 dark:text-zinc-300">公开群聊</span>
        </label>
        <div v-if="chat.friends.length">
          <p class="text-xs text-zinc-400 mb-1.5">选择好友加入（{{ groupMembers.length }}）</p>
          <div class="max-h-56 overflow-y-auto border border-zinc-200/60 dark:border-zinc-700/60 rounded-[5%] p-1.5 space-y-0.5">
            <label v-for="f in chat.friends" :key="f.friendId" class="flex items-center gap-2.5 px-2 py-1.5 rounded-[5%] hover:bg-white/60 dark:hover:bg-zinc-800/60 cursor-pointer">
              <input type="checkbox" class="accent-amber-500 shrink-0" :value="f.friendId" v-model="groupMembers" />
              <span class="flex-1 min-w-0 text-sm text-zinc-700 dark:text-zinc-200 truncate">{{ f.friendName || f.remark || '好友' }}</span>
            </label>
          </div>
        </div>
      </div>
      <div class="px-5 py-3.5 border-t border-zinc-200/60 dark:border-zinc-700/60 flex justify-end gap-2 shrink-0">
        <button class="h-10 px-4 rounded-[5%] text-sm text-zinc-500 dark:text-zinc-300 hover:bg-white/60 dark:hover:bg-zinc-800/60" @click="$emit('close')">取消</button>
        <button class="h-10 px-4 rounded-[5%] bg-gradient-to-r from-amber-400 to-orange-500 text-white text-sm font-medium" :disabled="groupSending || !groupName.trim()" @click="doCreateGroup">{{ groupSending ? '创建中…' : '创建群聊' }}</button>
      </div>
    </template>

    <!-- 搜索群聊 -->
    <template v-else-if="mode === 'search'">
      <div class="flex items-center gap-3 px-5 py-3 border-b border-zinc-200/60 dark:border-zinc-700/60 shrink-0">
        <button class="w-9 h-9 rounded-[5%] flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:bg-white/60 dark:hover:bg-zinc-800/60" aria-label="关闭" @click="$emit('close')"><svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg></button>
        <span class="text-sm font-semibold text-zinc-800 dark:text-zinc-100">搜索群聊</span>
      </div>
      <div class="flex-1 overflow-y-auto overscroll-contain px-6 py-5 min-h-0 space-y-3">
        <div class="flex gap-2">
          <input v-model="groupKeyword" name="groupKeyword" aria-label="搜索公开群聊" class="flex-1 min-w-0 rounded-[5%] bg-white/60 dark:bg-zinc-800/60 border border-white/50 dark:border-white/10 px-3.5 py-2.5 text-sm outline-none" placeholder="搜索公开群聊" @keydown.enter.exact.prevent="doGroupSearch" />
          <button class="h-10 px-4 rounded-[5%] bg-gradient-to-r from-amber-400 to-orange-500 text-white text-sm font-medium" :disabled="groupSearching || !groupKeyword.trim()" @click="doGroupSearch">搜索</button>
        </div>
        <div v-if="groupSearching" class="py-8 text-center text-sm text-zinc-400">搜索中…</div>
        <div v-else-if="groupSearched && groupResults.length === 0" class="py-8 text-center text-sm text-zinc-400">未找到匹配的公开群聊</div>
        <button v-for="g in groupResults" :key="g.groupId" class="w-full flex items-center gap-3 px-3 py-2 rounded-[5%] bg-white/60 dark:bg-zinc-800/60" @click="onGroupResultClick(g)">
          <span class="flex-1 min-w-0 text-sm font-medium text-zinc-700 dark:text-zinc-200 truncate">{{ g.groupName }}</span>
          <span class="text-xs text-zinc-400">{{ isJoinedGroup(g) ? '已加入' : '未加入' }}</span>
        </button>
      </div>
    </template>

    <!-- 管理群聊：成员查看/移除、改群名、退出、解散（入口位与创建/搜索同构） -->
    <template v-else-if="mode === 'manage'">
      <div class="flex items-center gap-3 px-5 py-3 border-b border-zinc-200/60 dark:border-zinc-700/60 shrink-0">
        <button class="w-9 h-9 rounded-[5%] flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:bg-white/60 dark:hover:bg-zinc-800/60" type="button" aria-label="关闭" @click="$emit('close')"><svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg></button>
        <span class="text-sm font-semibold text-zinc-800 dark:text-zinc-100">群管理</span>
      </div>

      <!-- 加载中 -->
      <div v-if="loading" class="flex-1 px-6 py-5 min-h-0 space-y-3" role="status">
        <span class="sr-only">正在加载群信息…</span>
        <div class="h-14 rounded-[5%] bg-zinc-200/70 dark:bg-zinc-800/70 qm-shimmer" aria-hidden="true"></div>
        <div v-for="i in 4" :key="i" class="h-12 rounded-[5%] bg-zinc-200/70 dark:bg-zinc-800/70" aria-hidden="true"></div>
      </div>

      <!-- 未指定群 -->
      <div v-else-if="!groupId" class="flex-1 flex flex-col items-center justify-center text-center gap-3 px-6">
        <p class="text-sm text-zinc-500 dark:text-zinc-400">未指定要管理的群聊</p>
      </div>

      <!-- 加载失败 -->
      <div v-else-if="loadError" class="flex-1 flex flex-col items-center justify-center text-center gap-3 px-6">
        <p class="text-sm text-zinc-500 dark:text-zinc-400">群信息加载失败</p>
        <button class="h-9 px-4 rounded-[5%] bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-medium" type="button" @click="loadAll">重试</button>
      </div>

      <template v-else>
        <div class="flex-1 overflow-y-auto overscroll-contain px-6 py-5 min-h-0 space-y-5">
          <!-- 群标识 -->
          <div class="flex items-center gap-3">
            <div class="w-14 h-14 rounded-[10px] overflow-hidden shrink-0 border border-zinc-200/70 dark:border-zinc-700/60">
              <img :src="groupAvatarUrl" alt="" class="w-full h-full object-cover" @error="onGroupAvatarError" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-zinc-800 dark:text-zinc-100 truncate">{{ group?.groupName || '群聊' }}</p>
              <p class="text-xs text-zinc-400 mt-0.5">{{ memberCountText }}<span v-if="group?.isPublic"> · 公开群聊</span></p>
            </div>
          </div>

          <!-- 改群名（群主/管理员） -->
          <div v-if="canEditInfo" class="space-y-2">
            <p class="text-xs text-zinc-400">群名称（{{ name.trim().length }}/30）</p>
            <div class="flex gap-2">
              <input v-model="name" maxlength="30" name="groupNameEdit" aria-label="群名称" :disabled="renaming"
                class="flex-1 min-w-0 rounded-[5%] bg-white/60 dark:bg-zinc-800/60 border border-white/50 dark:border-white/10 px-3.5 py-2.5 text-sm outline-none disabled:opacity-60" placeholder="群名称" />
              <button class="h-10 px-4 rounded-[5%] bg-gradient-to-r from-amber-400 to-orange-500 text-white text-sm font-medium disabled:opacity-50" type="button" :disabled="renaming || !nameDirty" @click="saveName">{{ renaming ? '保存中…' : '保存' }}</button>
            </div>
          </div>

          <!-- 成员 -->
          <div>
            <p class="text-xs text-zinc-400 mb-1.5">群成员（{{ memberRows.length }}）</p>
            <div v-if="membersError" class="py-6 flex flex-col items-center gap-2 text-center">
              <p class="text-xs text-zinc-400">成员加载失败</p>
              <button class="h-8 px-3 rounded-[5%] text-xs bg-white/60 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-300" type="button" @click="loadMembers">重试</button>
            </div>
            <div v-else-if="!memberRows.length" class="py-6 text-center text-xs text-zinc-400">暂无成员</div>
            <div v-else class="rounded-[5%] border border-zinc-200/60 dark:border-zinc-700/60 divide-y divide-zinc-200/60 dark:divide-zinc-700/60">
              <div v-for="m in memberRows" :key="m.userId" class="flex items-center gap-3 px-3 py-2">
                <img :src="m.avatar" alt="" width="36" height="36" class="w-9 h-9 rounded-[10px] object-cover shrink-0" @error="onMemberAvatarError($event, m)" />
                <div class="flex-1 min-w-0">
                  <p class="text-sm text-zinc-700 dark:text-zinc-200 truncate">{{ m.name }}<span v-if="m.isMe" class="text-zinc-400">（我）</span></p>
                  <p class="text-[11px] text-zinc-400">{{ m.roleLabel }}<span v-if="m.isMuted"> · 已禁言</span><span v-if="m.isBanned"> · 已封禁</span></p>
                </div>
                <button v-if="canRemove(m)" class="h-7 px-2.5 rounded-[5%] text-xs text-red-500 hover:bg-red-500/10 disabled:opacity-50 shrink-0" type="button" :disabled="busyUserId === m.userId" @click="askRemove(m)">{{ busyUserId === m.userId ? '处理中…' : '移除' }}</button>
              </div>
            </div>
          </div>

          <!-- 邀请好友（群主/管理员） -->
          <div v-if="canEditInfo && invitableFriends.length">
            <p class="text-xs text-zinc-400 mb-1.5">邀请好友加入</p>
            <div class="flex flex-wrap gap-2">
              <button v-for="f in invitableFriends" :key="f.friendId" class="h-8 px-3 rounded-[5%] text-xs bg-white/60 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-300 hover:text-amber-500 dark:hover:text-amber-400 disabled:opacity-50" type="button" :disabled="busyUserId === String(f.friendId)" @click="invite(f)">{{ busyUserId === String(f.friendId) ? '邀请中…' : '＋ ' + friendName(f) }}</button>
            </div>
          </div>
        </div>

        <!-- 危险操作：退出 / 解散 -->
        <div class="px-5 py-3.5 border-t border-zinc-200/60 dark:border-zinc-700/60 flex items-center justify-between gap-2 shrink-0">
          <span class="text-[11px] text-zinc-400">{{ isOwner ? '群主可解散本群' : '退出后需重新被邀请' }}</span>
          <button v-if="isOwner" class="h-9 px-3.5 rounded-[5%] text-sm text-white bg-gradient-to-r from-red-500 to-rose-500 disabled:opacity-50" type="button" :disabled="dismissing" @click="askDismiss">{{ dismissing ? '解散中…' : '解散群聊' }}</button>
          <button v-else class="h-9 px-3.5 rounded-[5%] text-sm text-red-500 hover:bg-red-500/10 disabled:opacity-50" type="button" :disabled="leaving" @click="askLeave">{{ leaving ? '退出中…' : '退出群聊' }}</button>
        </div>
      </template>

      <ConfirmDialog
        v-if="confirmTarget"
        danger
        :title="confirmTitle"
        :message="confirmMessage"
        :confirm-text="confirmText"
        @close="confirmTarget = null"
        @confirm="onConfirm"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
// 群聊创建/搜索/管理面板：处理群头像上传、建群、搜索公开群、打开已有群会话，
// 以及群管理（成员查看/移除/邀请、改群名、退出、解散）。
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useChatStore } from '@/stores/chat'
import { useToastStore } from '@/stores/toast'
import {
  addGroupMember,
  createGroup,
  createGroupSession,
  dismissGroup,
  getGroup,
  getGroupMembers,
  removeGroupMember,
  searchGroups,
  updateGroupInfo
} from '@/api/chat'
import { uploadImage } from '@/api/publish'
import { unwrap } from '@/utils/response'
import { validateImageFile, compressImage, blobToDataUri } from '@/utils/image'
import { charAvatar, groupIconAvatar } from '@/utils/avatar'
import ConfirmDialog from '@/components/admin/ConfirmDialog.vue'

const props = defineProps<{
  mode?: string
  groupId?: string
}>()
const emit = defineEmits<{
  close: []
}>()

const chat = useChatStore()
const toast = useToastStore()
const router = useRouter()

const groupName = ref('')
const groupDesc = ref('')
const groupPublic = ref(false)
const groupMembers = ref<string[]>([])
const groupSending = ref(false)
const groupAvatarPreview = ref('')
const groupAvatarUpdating = ref(false)

const groupKeyword = ref('')
const groupResults = ref<any[]>([])
const groupSearching = ref(false)
const groupSearched = ref(false)

async function onGroupAvatarChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files && input.files[0]
  input.value = ''
  if (!file || groupAvatarUpdating.value) return
  const v = validateImageFile(file)
  if (!v.ok) { toast.push(v.error, 'error'); return }
  groupAvatarUpdating.value = true
  try {
    const { blob } = await compressImage(file)
    const upFile = new File([blob], 'group-avatar.webp', { type: 'image/webp' })
    try {
      const res = await uploadImage(upFile, 'group-avatar')
      const d = unwrap(res) || {}
      const uri = d.fileUri || d.url
      if (!uri) throw new Error('no fileUri')
      groupAvatarPreview.value = uri
    } catch (err) {
      // 上传失败时退化为本地预览（群头像当前不随建群请求提交，故仅作预览）
      groupAvatarPreview.value = await blobToDataUri(blob)
      toast.push('头像上传失败，已改用本地预览', 'info')
    }
  } catch (err) {
    toast.push('头像处理失败，请重试', 'error')
  } finally {
    groupAvatarUpdating.value = false
  }
}

async function doCreateGroup() {
  const name = groupName.value.trim()
  if (!name || groupSending.value) return
  groupSending.value = true
  try {
    const res = await createGroup({
      groupName: name,
      description: groupDesc.value.trim() || undefined,
      isPublic: groupPublic.value,
      initialMembers: groupMembers.value.length ? groupMembers.value : undefined
    })
    const d = unwrap(res)
    const groupId = typeof d === 'string' ? d : (d && (d.groupId || d.id)) || ''
    if (!groupId) throw new Error('no groupId')
    toast.push('群聊创建成功', 'success')
    groupName.value = ''
    groupDesc.value = ''
    groupPublic.value = false
    groupMembers.value = []
    groupAvatarPreview.value = ''
    chat.loadGroups()
    chat.loadSessions()
    try {
      const sres = await createGroupSession(groupId, name)
      const sd = unwrap(sres)
      const sessionId = typeof sd === 'string' ? sd : (sd && (sd.sessionId || sd.id)) || ''
      if (sessionId) {
        await chat.loadSessions()
        router.push('/chat/' + sessionId)
      }
    } catch (e) { /* 会话创建失败静默 */ }
  } catch (e) {
    toast.push('创建失败：' + (e.message || '请稍后重试'), 'error')
  } finally {
    groupSending.value = false
  }
}

async function doGroupSearch() {
  const kw = groupKeyword.value.trim()
  if (!kw || groupSearching.value) return
  groupSearching.value = true
  groupSearched.value = true
  try {
    const data = unwrap(await searchGroups({ searchTerm: kw, page: 1, pageSize: 20 }))
    groupResults.value = (data && (data.items || data.list || data)) || []
  } catch (e) {
    groupResults.value = []
    toast.push('搜索失败，请稍后重试', 'error')
  } finally {
    groupSearching.value = false
  }
}

function isJoinedGroup(g: any): boolean {
  return chat.groups.some(x => String(x.groupId) === String(g.groupId))
}

function onGroupResultClick(g: any) {
  if (!isJoinedGroup(g)) {
    toast.push('该群暂不支持直接加入', 'info')
    return
  }
  const s = chat.sessions.find(x => String(x.groupId) === String(g.groupId))
  if (s) router.push('/chat/' + s.sessionId)
  else toast.push('暂无可打开的群会话', 'info')
}

// ===== 群管理（mode === 'manage'） =====
// 后端群管理接口均为真实端点（见 api/chat.ts）；成员昵称/头像 GroupMemberDto 不返回，
// 需按 userId 走 UsersApi 补取（chat.loadProfiles）。角色：0=群主 1=管理员 2=成员。
const ROLE_LABEL: Record<number, string> = { 0: '群主', 1: '管理员', 2: '成员' }

const loading = ref(false)
const loadError = ref(false)
const group = ref<any>(null)
const members = ref<any[]>([])
const membersError = ref(false)
const name = ref('')
const renaming = ref(false)
const busyUserId = ref('')
const leaving = ref(false)
const dismissing = ref(false)
const confirmTarget = ref<{ kind: 'remove' | 'leave' | 'dismiss'; userId?: string; name?: string } | null>(null)

const me = computed(() => String(chat.currentUserId()))
const isOwner = computed(() => !!group.value && String(group.value.ownerId) === me.value)
const myRole = computed(() => {
  const m = members.value.find((x) => String(x.userId) === me.value)
  return m ? Number(m.role) : -1
})
const canEditInfo = computed(() => isOwner.value || myRole.value === 1)
const nameDirty = computed(
  () => !!name.value.trim() && name.value.trim() !== String(group.value?.groupName || '')
)
const memberCountText = computed(() => `${memberRows.value.length || group.value?.memberCount || 0} 人`)
const groupAvatarUrl = computed(() => {
  const gid = String(group.value?.groupId || props.groupId || '')
  const g = chat.groups.find((x) => String(x.groupId) === gid)
  return (g && typeof g.avatarUrl === 'string' && g.avatarUrl) || groupIconAvatar()
})

/** 成员渲染项：昵称/头像按 资料缓存(profiles) → 好友 → 群内昵称 → 占位 的优先级解析 */
const memberRows = computed(() =>
  members.value.map((m) => {
    const uid = String(m.userId)
    const f = chat.friends.find((x) => String(x.friendId) === uid)
    const p = chat.profiles[uid]
    const display = (f && f.friendName) || (p && p.name) || m.nickname || (uid === me.value ? '我' : '成员')
    const avatar =
      (f && typeof f.friendAvatar === 'string' && f.friendAvatar) ||
      (p && p.avatar) ||
      charAvatar(String(display).charAt(0) || '友', uid === me.value ? '#f59e0b' : '#a1a1aa')
    const role = Number(m.role)
    return {
      userId: uid,
      name: String(display),
      avatar: String(avatar),
      role,
      roleLabel: ROLE_LABEL[role] || '成员',
      isMuted: !!m.isMuted,
      isBanned: !!m.isBanned,
      isMe: uid === me.value
    }
  })
)

const invitableFriends = computed(() => {
  const ids = new Set(members.value.map((m) => String(m.userId)))
  return chat.friends.filter((f) => !ids.has(String(f.friendId)))
})

function friendName(f: any): string {
  return String(f.friendName || f.remark || '好友')
}

function canRemove(m: { role: number; isMe: boolean }): boolean {
  return canEditInfo.value && !m.isMe && m.role !== 0
}

const confirmTitle = computed(() => {
  const k = confirmTarget.value?.kind
  return k === 'remove' ? '移除成员' : k === 'leave' ? '退出群聊' : '解散群聊'
})
const confirmMessage = computed(() => {
  const t = confirmTarget.value
  if (!t) return ''
  if (t.kind === 'remove') return `确定将「${t.name || '该成员'}」移出群聊吗？`
  if (t.kind === 'leave') return '退出后你将不再收到该群消息，需要重新被邀请才能加入。'
  return '解散后群聊与聊天记录将不可恢复，所有成员都会被移出。'
})
const confirmText = computed(() => {
  const k = confirmTarget.value?.kind
  return k === 'remove' ? '移除' : k === 'leave' ? '退出' : '解散'
})

async function loadAll(): Promise<void> {
  const gid = props.groupId
  if (!gid) return
  loading.value = true
  loadError.value = false
  try {
    const g = unwrap(await getGroup(gid)) || {}
    group.value = g
    name.value = g.groupName || ''
  } catch (e: any) {
    loadError.value = true
    loading.value = false
    toast.push(e?.message || '加载群信息失败', 'error')
    return
  }
  await loadMembers()
  loading.value = false
}

async function loadMembers(): Promise<void> {
  const gid = props.groupId
  if (!gid) return
  membersError.value = false
  try {
    const data = unwrap(await getGroupMembers(gid))
    const list = (data && (data.items || data.list || data)) || []
    members.value = Array.isArray(list) ? list : []
    const ids = members.value.map((m) => String(m.userId)).filter(Boolean)
    if (ids.length) chat.loadProfiles(ids)
  } catch (e: any) {
    membersError.value = true
    toast.push(e?.message || '加载群成员失败', 'error')
  }
}

async function saveName(): Promise<void> {
  const gid = props.groupId
  const nm = name.value.trim()
  if (!gid || !nm || renaming.value || !nameDirty.value) return
  renaming.value = true
  try {
    await updateGroupInfo(gid, { groupName: nm, description: group.value?.description })
    group.value = { ...(group.value || {}), groupName: nm }
    chat.loadGroups()
    chat.loadSessions()
    toast.push('群名称已更新', 'success')
  } catch (e: any) {
    toast.push(e?.message || '更新失败，请稍后重试', 'error')
  } finally {
    renaming.value = false
  }
}

async function invite(f: any): Promise<void> {
  const gid = props.groupId
  const uid = String(f.friendId)
  if (!gid || !uid || busyUserId.value) return
  busyUserId.value = uid
  try {
    await addGroupMember(gid, uid)
    toast.push('已邀请加入群聊', 'success')
    await loadMembers()
  } catch (e: any) {
    toast.push(e?.message || '邀请失败，请稍后重试', 'error')
  } finally {
    busyUserId.value = ''
  }
}

function askRemove(m: { userId: string; name: string }): void {
  confirmTarget.value = { kind: 'remove', userId: m.userId, name: m.name }
}
function askLeave(): void {
  confirmTarget.value = { kind: 'leave' }
}
function askDismiss(): void {
  confirmTarget.value = { kind: 'dismiss' }
}

async function onConfirm(): Promise<void> {
  const t = confirmTarget.value
  confirmTarget.value = null
  if (!t) return
  if (t.kind === 'remove' && t.userId) await doRemove(t.userId)
  else if (t.kind === 'leave') await doLeave()
  else if (t.kind === 'dismiss') await doDismiss()
}

async function doRemove(userId: string): Promise<void> {
  const gid = props.groupId
  if (!gid || busyUserId.value) return
  busyUserId.value = userId
  try {
    await removeGroupMember(gid, userId)
    toast.push('成员已移除', 'success')
    await loadMembers()
  } catch (e: any) {
    toast.push(e?.message || '移除失败，请稍后重试', 'error')
  } finally {
    busyUserId.value = ''
  }
}

async function doLeave(): Promise<void> {
  const gid = props.groupId
  if (!gid || leaving.value) return
  leaving.value = true
  try {
    await removeGroupMember(gid, me.value)
    toast.push('已退出群聊', 'success')
    exitToChatList()
  } catch (e: any) {
    toast.push(e?.message || '退出失败，请稍后重试', 'error')
  } finally {
    leaving.value = false
  }
}

async function doDismiss(): Promise<void> {
  const gid = props.groupId
  if (!gid || dismissing.value) return
  dismissing.value = true
  try {
    await dismissGroup(gid)
    toast.push('群聊已解散', 'success')
    exitToChatList()
  } catch (e: any) {
    toast.push(e?.message || '解散失败，请稍后重试', 'error')
  } finally {
    dismissing.value = false
  }
}

/** 退出/解散成功后：刷新列表并关闭面板回到会话视图（emit('close') 由 ChatPage 清理路由 query） */
function exitToChatList(): void {
  chat.loadGroups()
  chat.loadSessions()
  emit('close')
}

/** 群头像加载失败：回退群图标（不再出现破图） */
function onGroupAvatarError(e: Event): void {
  const el = e.target as HTMLImageElement
  const fallback = groupIconAvatar()
  if (el.src !== fallback) el.src = fallback
}

/** 成员头像加载失败：回退该成员首字头像 */
function onMemberAvatarError(e: Event, m: { name: string; isMe: boolean }): void {
  const el = e.target as HTMLImageElement
  const fallback = charAvatar(m.name.charAt(0) || '友', m.isMe ? '#f59e0b' : '#a1a1aa')
  if (el.src !== fallback) el.src = fallback
}

onMounted(() => {
  if (props.mode === 'manage') void loadAll()
})
watch(
  () => props.groupId,
  () => {
    if (props.mode === 'manage') void loadAll()
  }
)
</script>