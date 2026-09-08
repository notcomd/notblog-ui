<template>
  <!-- 群聊创建/搜索面板：由 ChatConversation 按 mode 切换显示 -->
  <div class="flex-1 min-w-0 glass-card flex flex-col min-h-0">
    <!-- 创建群聊 -->
    <template v-if="mode === 'create'">
      <div class="flex items-center gap-3 px-5 py-3 border-b border-zinc-200/60 dark:border-zinc-700/60 shrink-0">
        <button class="w-9 h-9 rounded-[5%] flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:bg-white/60 dark:hover:bg-zinc-800/60" aria-label="关闭" @click="$emit('close')"><svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg></button>
        <span class="text-sm font-semibold text-zinc-800 dark:text-zinc-100">创建群聊</span>
      </div>
      <div class="flex-1 overflow-y-auto px-6 py-5 min-h-0 space-y-5">
        <div class="flex flex-col items-center gap-2.5">
          <div class="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center shrink-0 border border-zinc-200/70 dark:border-zinc-700/60">
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
        <button class="h-10 px-4 rounded-[5%] bg-gradient-to-r from-amber-400 to-orange-500 text-white text-sm font-medium" :disabled="groupSending || !groupName.trim()" @click="doCreateGroup">{{ groupSending ? '创建中...' : '创建群聊' }}</button>
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
  </div>
</template>

<script setup lang="ts">
// 群聊创建/搜索面板：处理群头像上传、建群、搜索公开群、打开已有群会话
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useChatStore } from '@/stores/chat'
import { useToastStore } from '@/stores/toast'
import { createGroup, createGroupSession, searchGroups } from '@/api/chat'
import { uploadImage } from '@/api/publish'
import { getMyUserInfo } from '@/api/userinfo'
import { validateImageFile, compressImage, blobToDataUri } from '@/utils/image'

defineProps<{
  mode?: string
}>()
defineEmits<{
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
const groupAvatarValue = ref('')
const groupAvatarUpdating = ref(false)
const myLevel = ref(1)

const groupKeyword = ref('')
const groupResults = ref<any[]>([])
const groupSearching = ref(false)
const groupSearched = ref(false)

function groupAvatarKey(groupId: string): string {
  return 'notblog-group-avatar-' + groupId
}

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
      const d = res && res.data ? res.data : res
      const uri = d && (d.fileUri || d.url)
      if (!uri) throw new Error('no fileUri')
      groupAvatarPreview.value = uri
      groupAvatarValue.value = uri
    } catch (err) {
      const uri = await blobToDataUri(blob)
      groupAvatarPreview.value = uri
      groupAvatarValue.value = uri
      toast.push('头像已本地保存（后端未就绪）', 'info')
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
    const d = res && res.data ? res.data : res
    const groupId = typeof d === 'string' ? d : (d && (d.groupId || d.id)) || ''
    if (!groupId) throw new Error('no groupId')
    if (groupAvatarValue.value) {
      try { localStorage.setItem(groupAvatarKey(groupId), groupAvatarValue.value) } catch (err) { /* 忽略 */ }
    }
    toast.push('群聊创建成功', 'success')
    groupName.value = ''
    groupDesc.value = ''
    groupPublic.value = false
    groupMembers.value = []
    groupAvatarPreview.value = ''
    groupAvatarValue.value = ''
    chat.loadGroups()
    chat.loadSessions()
    try {
      const sres = await createGroupSession(groupId, name)
      const sd = sres && sres.data ? sres.data : sres
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
    const res = await searchGroups({ searchTerm: kw, page: 1, pageSize: 20 })
    const data = res && res.data ? res.data : res
    groupResults.value = (data && (data.items || data.list || data)) || []
  } catch (e) {
    groupResults.value = []
    toast.push('搜索失败（后端未就绪）', 'error')
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

watch(() => myLevel.value, () => {})
getMyUserInfo().then(u => {
  const d = u && u.data ? u.data : u
  if (d && d.level) myLevel.value = d.level
}).catch(() => {})
</script>
