<template>
  <!-- 社区管理面板（复用主视窗）：基本信息/加入方式三选/审核队列/邀请码 -->
  <div class="glass-card flex flex-col min-h-0">
    <!-- 头部 -->
    <div class="flex items-center gap-3 px-5 py-4 border-b border-zinc-200/60 dark:border-zinc-700/60 shrink-0">
      <button aria-label="返回" class="w-8 h-8 rounded-[5%] flex items-center justify-center text-zinc-500 dark:text-zinc-300 hover:bg-white/60 dark:hover:bg-zinc-800/60 transition-colors" title="返回" @click="$emit('close')">
        <svg aria-hidden="true" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
      </button>
      <span class="text-base font-semibold text-zinc-800 dark:text-zinc-100">社区管理</span>
      <span v-if="!isOwner" class="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">管理员（仅审核/邀请，不可改信息）</span>
    </div>

    <div class="flex-1 overflow-y-auto overscroll-contain px-5 py-4 space-y-6 min-h-0">
      <!-- 基本信息（仅创建者可改） -->
      <div>
        <p class="text-xs font-medium text-zinc-400 mb-2">基本信息</p>
        <div class="space-y-2.5" :class="!isOwner ? 'pointer-events-none opacity-60' : ''">
          <div class="flex items-center gap-3">
            <img :src="avatarPreview || avatarUrl || fallback" alt="" class="w-12 h-12 rounded-[5%] object-cover shrink-0" />
            <div class="flex gap-2">
              <button class="h-8 px-3 rounded-[5%] text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-colors" @click="pickAvatar">更换头像</button>
              <button class="h-8 px-3 rounded-[5%] text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-colors" @click="pickCover">更换封面</button>
            </div>
            <input ref="avatarInput" type="file" accept="image/*" class="hidden" @change="onAvatarFile" />
            <input ref="coverInput" type="file" accept="image/*,video/*" class="hidden" @change="onCoverFile" />
          </div>
          <div>
            <label class="text-xs text-zinc-400 block mb-1">社区名称</label>
            <input v-model="name" maxlength="30" aria-label="社区名称" class="w-full h-10 px-3.5 rounded-[5%] bg-white/70 dark:bg-zinc-800/70 border border-white/60 dark:border-white/10 text-sm text-zinc-700 dark:text-zinc-200 outline-none focus:ring-2 focus:ring-amber-400/50 transition-all" />
          </div>
          <div>
            <label class="text-xs text-zinc-400 block mb-1">社区简介</label>
            <textarea v-model="desc" rows="2" maxlength="120" aria-label="社区简介" class="w-full rounded-[5%] bg-white/70 dark:bg-zinc-800/70 border border-white/60 dark:border-white/10 text-sm text-zinc-700 dark:text-zinc-200 outline-none focus:ring-2 focus:ring-amber-400/50 transition-all p-3 resize-none"></textarea>
          </div>
        </div>
      </div>

      <!-- 加入方式三选（仅创建者可修改；localStorage 本地持久化，后端暂无字段） -->
      <div>
        <p class="text-xs font-medium text-zinc-400 mb-2">加入方式</p>
        <div class="grid grid-cols-3 gap-2">
          <button
            v-for="m in JOIN_MODES"
            :key="m.key"
            class="rounded-[5%] border px-3 py-2.5 text-left transition-colors"
            :class="joinMode === m.key ? 'border-amber-400 bg-amber-50 dark:bg-amber-500/10' : 'border-zinc-200/70 dark:border-zinc-700/60 hover:bg-white/60 dark:hover:bg-zinc-800/60'"
            :disabled="!isOwner"
            @click="setMode(m.key)"
          >
            <span class="block text-xs font-medium text-zinc-700 dark:text-zinc-200 inline-flex items-center gap-1"><svg aria-hidden="true" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" v-html="m.icon"></svg>{{ m.label }}</span>
            <span class="block text-[10px] text-zinc-400 mt-0.5">{{ m.desc }}</span>
          </button>
        </div>
        <p class="text-[10px] text-zinc-400 mt-1.5">加入方式保存在本机（后端暂无字段，跨设备不同步）</p>
      </div>

      <!-- 审核队列（审核制社区；创建者/管理者处理） -->
      <div v-if="joinMode === 'review'">
        <p class="text-xs font-medium text-zinc-400 mb-2">加入申请（{{ joinRequests.length }}）</p>
        <div v-if="joinRequests.length === 0" class="text-xs text-zinc-400 py-6 text-center bg-white/40 dark:bg-zinc-800/40 rounded-[5%]">暂无待审核申请</div>
        <div v-else class="space-y-1">
          <div v-for="r in joinRequests" :key="r.userGuid" class="flex items-center gap-3 px-2 py-2 rounded-[5%] hover:bg-white/60 dark:hover:bg-zinc-800/60 transition-colors">
            <img :src="themeAvatar((r.userName || '友').charAt(0))" alt="" class="w-9 h-9 rounded-[5%] object-cover shrink-0" />
            <span class="flex-1 min-w-0">
              <span class="block text-sm font-medium text-zinc-700 dark:text-zinc-200 truncate">{{ r.userName }}</span>
              <span class="block text-xs text-zinc-400">{{ new Date(r.time).toLocaleString() }}</span>
            </span>
            <div class="flex gap-1.5 shrink-0">
              <button class="h-7 px-2.5 rounded-[5%] text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors" @click="approve(r)">通过</button>
              <button class="h-7 px-2.5 rounded-[5%] text-[11px] font-medium text-red-500 hover:bg-red-500/10 transition-colors" @click="reject(r)">拒绝</button>
            </div>
          </div>
        </div>
      </div>

      <!-- 邀请码 -->
      <div>
        <div class="flex items-center justify-between mb-2">
          <p class="text-xs font-medium text-zinc-400">邀请码</p>
          <button class="h-7 px-2.5 rounded-[5%] text-[11px] font-medium bg-amber-400/15 text-amber-600 dark:text-amber-300 hover:bg-amber-400/25 transition-colors" :disabled="generating" @click="genInvite">
            {{ generating ? '生成中…' : '＋ 生成邀请码' }}
          </button>
        </div>
        <p v-if="joinMode === 'private' && !isOwner" class="text-xs text-zinc-400 py-3 text-center bg-white/40 dark:bg-zinc-800/40 rounded-[5%]">私密社区仅创建者可邀请</p>
        <div v-else-if="inviteCodes.length === 0" class="text-xs text-zinc-400 py-3 text-center bg-white/40 dark:bg-zinc-800/40 rounded-[5%]">暂无邀请码，点击上方生成</div>
        <div v-for="it in inviteCodes" :key="it.inviteGuid" class="flex items-center gap-2 px-3 py-2 rounded-[5%] bg-white/40 dark:bg-zinc-800/40 mb-1">
          <code class="flex-1 text-sm font-mono tracking-wider text-zinc-700 dark:text-zinc-200">{{ it.code }}</code>
          <button class="h-7 px-2.5 rounded-[5%] text-[11px] text-zinc-500 dark:text-zinc-300 hover:bg-white/60 dark:hover:bg-zinc-800/60 transition-colors" @click="copy(it)">复制</button>
          <button class="h-7 px-2.5 rounded-[5%] text-[11px] text-red-500 hover:bg-red-500/10 transition-colors" @click="revoke(it)">撤销</button>
        </div>
        <p class="text-[10px] text-zinc-400 mt-2">邀请：全员可用邀请码；审核：可公开申请，创建者/管理者审核；私密：仅创建者可邀请</p>
      </div>
    </div>

    <!-- 底部 -->
    <div class="px-5 py-3.5 border-t border-zinc-200/60 dark:border-zinc-700/60 flex justify-end gap-2 shrink-0">
      <button class="h-10 px-4 rounded-[5%] text-sm text-zinc-500 dark:text-zinc-300 hover:bg-white/60 dark:hover:bg-zinc-800/60 transition-colors" @click="$emit('close')">取消</button>
      <button class="h-10 px-4 rounded-[5%] bg-gradient-to-r from-amber-400 to-orange-500 text-white text-sm font-medium hover:brightness-110 active:scale-95 transition-all" :disabled="saving" @click="save">
        {{ saving ? '保存中…' : '保存修改' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
// 社区管理面板：基本信息（Owner）/加入方式三选（Owner）/审核队列/邀请码（localStorage 本地持久化）
import { computed, ref, watch } from 'vue'
import { themeAvatar } from '@/utils/avatar'
import { generateCircleInvitation, getCircleInvitations, revokeCircleInvitation, updateCircle } from '@/api/circle'
import { useToastStore } from '@/stores/toast'

interface CircleData {
  circleGuid?: string
  name?: string
  description?: string
  avatarUrl?: string
  coverUrl?: string
}

interface JoinMode {
  key: string
  label: string
  desc: string
  icon: string
}

interface InviteCode {
  inviteGuid?: string
  code: string
}

interface JoinRequest {
  userGuid: string
  userName: string
  time: any
}

const props = defineProps<{
  current: CircleData | null
  myRole?: string
}>()
const emit = defineEmits<{
  close: []
  saved: [patch: { name: string; description: string; avatarUrl: string; coverUrl: string }]
}>()

const toast = useToastStore()

const JOIN_MODES: JoinMode[] = [
  { key: 'invite', label: '邀请', desc: '全员可用邀请码', icon: '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/>' },
  { key: 'private', label: '私密', desc: '仅创建者可邀请', icon: '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>' },
  { key: 'review', label: '审核', desc: '公开申请+审核', icon: '<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>' }
]

const isOwner = computed(() => props.myRole === 'Owner')

const name = ref('')
const desc = ref('')
const avatarPreview = ref('')
const coverPreview = ref('')
const saving = ref(false)
const avatarInput = ref<HTMLInputElement | null>(null)
const coverInput = ref<HTMLInputElement | null>(null)
const joinMode = ref('invite')
const joinRequests = ref<JoinRequest[]>([])
const inviteCodes = ref<InviteCode[]>([])
const generating = ref(false)

const avatarUrl = computed(() => props.current?.avatarUrl || '')
const fallback = 'data:image/svg+xml;utf8,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" rx="8" fill="#f59e0b"/><path d="M14 50 L40 24 L66 50 Z" fill="#fff"/><path d="M40 50v-16" stroke="#f59e0b" stroke-width="4"/></svg>'
)

watch(() => props.current, (c) => {
  if (!c) return
  name.value = c.name || ''
  desc.value = c.description || ''
  avatarPreview.value = ''
  coverPreview.value = ''
  joinMode.value = circleJoinMode(c.circleGuid)
  joinRequests.value = loadJoinRequests(c.circleGuid)
  loadInviteCodes(c.circleGuid)
}, { immediate: true })

// ===== 加入方式（localStorage 本地持久化） =====
function circleJoinMode(guid: string): string {
  try {
    return localStorage.getItem('notblog-circle-joinmode-' + guid) || 'invite'
  } catch (e) {
    return 'invite'
  }
}
function setMode(m: string) {
  if (!isOwner.value || !props.current) return
  joinMode.value = m
  try {
    localStorage.setItem('notblog-circle-joinmode-' + props.current.circleGuid, m)
  } catch (e) { /* 忽略 */ }
}
function joinRequestsKey(guid: string): string {
  return 'notblog-circle-joinreq-' + guid
}
function loadJoinRequests(guid: string): JoinRequest[] {
  try {
    return JSON.parse(localStorage.getItem(joinRequestsKey(guid)) || '[]')
  } catch (e) {
    return []
  }
}
function saveJoinRequests() {
  if (!props.current) return
  try {
    localStorage.setItem(joinRequestsKey(props.current.circleGuid), JSON.stringify(joinRequests.value))
  } catch (e) { /* 忽略 */ }
}
function approve(r: JoinRequest) {
  joinRequests.value = joinRequests.value.filter(x => x.userGuid !== r.userGuid)
  saveJoinRequests()
  toast.push('已通过 ' + (r.userName || '') + ' 的加入申请', 'success')
}
function reject(r: JoinRequest) {
  joinRequests.value = joinRequests.value.filter(x => x.userGuid !== r.userGuid)
  saveJoinRequests()
  toast.push('已拒绝 ' + (r.userName || '') + ' 的加入申请', 'info')
}

// ===== 邀请码 =====
async function loadInviteCodes(guid: string) {
  try {
    const res = await getCircleInvitations(guid)
    const data = res && res.data ? res.data : res
    const list = (data && (data.items || data.list)) || data || []
    inviteCodes.value = (Array.isArray(list) ? list : []).map(x => ({ inviteGuid: x.inviteGuid, code: x.code }))
  } catch (e) {
    inviteCodes.value = []
  }
}
async function genInvite() {
  if (!props.current) return
  generating.value = true
  try {
    const res = await generateCircleInvitation(props.current.circleGuid, { type: 'code' })
    const data = res && res.data ? res.data : res
    const body = data && data.data ? data.data : data
    const code = (body && (body.code || body.inviteGuid)) || ''
    if (!code) throw new Error('未返回邀请码')
    inviteCodes.value.unshift({ inviteGuid: body.inviteGuid || '', code })
    toast.push('邀请码已生成', 'success')
  } catch (e) {
    toast.push('邀请码生成失败：' + ((e && e.message) || '后端未就绪'), 'error')
  } finally {
    generating.value = false
  }
}
async function revoke(it: InviteCode) {
  if (!props.current) return
  try {
    await revokeCircleInvitation(props.current.circleGuid, it.inviteGuid!)
    inviteCodes.value = inviteCodes.value.filter(x => x.inviteGuid !== it.inviteGuid)
    toast.push('邀请码已撤销', 'info')
  } catch (e) {
    toast.push('撤销失败：' + ((e && e.message) || '请重试'), 'error')
  }
}
function copy(it: InviteCode) {
  try {
    navigator.clipboard.writeText(it.code)
    toast.push('邀请码已复制', 'success')
  } catch (e) { /* 忽略 */ }
}

// ===== 头像/封面上传（≤10MB 直传 /api/files/upload-image） =====
function pickAvatar() {
  if (avatarInput.value) avatarInput.value.click()
}
function pickCover() {
  if (coverInput.value) coverInput.value.click()
}
async function onAvatarFile(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files && input.files[0]
  input.value = ''
  if (!file) return
  if (file.size > 10 * 1024 * 1024) { toast.push('图片不能超过 10MB', 'error'); return }
  try {
    const { uploadImage } = await import('@/api/publish')
    const res = await uploadImage(file, 'circle-avatar')
    const data = res && res.data ? res.data : res
    const body = data && data.data ? data.data : data
    avatarPreview.value = (body && (body.fileUri || body.url)) || URL.createObjectURL(file)
    toast.push('头像已上传', 'success')
  } catch (err) {
    avatarPreview.value = URL.createObjectURL(file)
    toast.push('上传失败（本地预览）', 'info')
  }
}
async function onCoverFile(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files && input.files[0]
  input.value = ''
  if (!file) return
  if (file.size > 20 * 1024 * 1024) { toast.push('封面不能超过 20MB', 'error'); return }
  try {
    const { uploadImage } = await import('@/api/publish')
    const res = await uploadImage(file, 'circle-cover')
    const data = res && res.data ? res.data : res
    const body = data && data.data ? data.data : data
    coverPreview.value = (body && (body.fileUri || body.url)) || URL.createObjectURL(file)
    toast.push('封面已上传', 'success')
  } catch (err) {
    coverPreview.value = URL.createObjectURL(file)
    toast.push('上传失败（本地预览）', 'info')
  }
}

// ===== 保存（真实端点 PUT /api/circles/{guid}） =====
async function save() {
  if (!props.current || !name.value.trim()) return
  saving.value = true
  try {
    const payload = {
      name: name.value.trim(),
      description: desc.value.trim(),
      ...(avatarPreview.value ? { avatarUrl: avatarPreview.value } : {}),
      ...(coverPreview.value ? { coverUrl: coverPreview.value } : {})
    }
    try {
      await updateCircle(props.current.circleGuid, payload)
    } catch (e) {
      toast.push('保存失败：' + ((e && e.message) || '请重试'), 'error')
      return
    }
    toast.push('社区信息已保存', 'success')
    emit('saved', {
      name: name.value.trim(),
      description: desc.value.trim(),
      avatarUrl: avatarPreview.value || props.current.avatarUrl || '',
      coverUrl: coverPreview.value || props.current.coverUrl || ''
    })
  } finally {
    saving.value = false
  }
}

// 主题渐变头像

</script>
