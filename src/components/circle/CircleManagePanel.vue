<template>
  <!-- 社区管理面板（复用主视窗）：基本信息/加入方式三选/审核队列/邀请码 -->
  <div class="glass-card flex flex-col min-h-0">
    <!-- 头部 -->
    <div class="flex items-center gap-3 px-5 py-4 border-b border-zinc-200/60 dark:border-zinc-700/60 shrink-0">
      <button class="w-8 h-8 rounded-[5%] flex items-center justify-center text-zinc-500 dark:text-zinc-300 hover:bg-white/60 dark:hover:bg-zinc-800/60 transition-colors" title="返回" @click="$emit('close')">
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
      </button>
      <span class="text-base font-semibold text-zinc-800 dark:text-zinc-100">社区管理</span>
      <span v-if="!isOwner" class="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">管理员（仅审核/邀请，不可改信息）</span>
    </div>

    <div class="flex-1 overflow-y-auto px-5 py-4 space-y-6 min-h-0">
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
            <input v-model="name" maxlength="30" class="w-full h-10 px-3.5 rounded-[5%] bg-white/70 dark:bg-zinc-800/70 border border-white/60 dark:border-white/10 text-sm text-zinc-700 dark:text-zinc-200 outline-none focus:ring-2 focus:ring-amber-400/50 transition-all" />
          </div>
          <div>
            <label class="text-xs text-zinc-400 block mb-1">社区简介</label>
            <textarea v-model="desc" rows="2" maxlength="120" class="w-full rounded-[5%] bg-white/70 dark:bg-zinc-800/70 border border-white/60 dark:border-white/10 text-sm text-zinc-700 dark:text-zinc-200 outline-none focus:ring-2 focus:ring-amber-400/50 transition-all p-3 resize-none"></textarea>
          </div>
        </div>
      </div>

      <!-- 邀请码 -->
      <div>
        <div class="flex items-center justify-between mb-2">
          <p class="text-xs font-medium text-zinc-400">邀请码</p>
          <button class="h-7 px-2.5 rounded-[5%] text-[11px] font-medium bg-amber-400/15 text-amber-600 dark:text-amber-300 hover:bg-amber-400/25 transition-colors" :disabled="generating" @click="genInvite">
            {{ generating ? '生成中...' : '＋ 生成邀请码' }}
          </button>
        </div>
        <div v-if="inviteCodes.length === 0" class="text-xs text-zinc-400 py-3 text-center bg-white/40 dark:bg-zinc-800/40 rounded-[5%]">暂无邀请码，点击上方生成</div>
        <div v-for="it in inviteCodes" :key="it.inviteGuid" class="flex items-center gap-2 px-3 py-2 rounded-[5%] bg-white/40 dark:bg-zinc-800/40 mb-1">
          <code class="flex-1 text-sm font-mono tracking-wider text-zinc-700 dark:text-zinc-200">{{ it.code }}</code>
          <button class="h-7 px-2.5 rounded-[5%] text-[11px] text-zinc-500 dark:text-zinc-300 hover:bg-white/60 dark:hover:bg-zinc-800/60 transition-colors" @click="copy(it)">复制</button>
          <button class="h-7 px-2.5 rounded-[5%] text-[11px] text-red-500 hover:bg-red-500/10 transition-colors" @click="revoke(it)">撤销</button>
        </div>
        <p class="text-[10px] text-zinc-400 mt-2">成员凭邀请码加入圈子</p>
      </div>
    </div>

    <!-- 底部 -->
    <div class="px-5 py-3.5 border-t border-zinc-200/60 dark:border-zinc-700/60 flex justify-end gap-2 shrink-0">
      <button class="h-10 px-4 rounded-[5%] text-sm text-zinc-500 dark:text-zinc-300 hover:bg-white/60 dark:hover:bg-zinc-800/60 transition-colors" @click="$emit('close')">取消</button>
      <button class="h-10 px-4 rounded-[5%] bg-gradient-to-r from-amber-400 to-orange-500 text-white text-sm font-medium hover:brightness-110 active:scale-95 transition-all" :disabled="saving" @click="save">
        {{ saving ? '保存中...' : '保存修改' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
// 社区管理面板：基本信息（Owner）+ 邀请码（真实端点生成/撤销）
import { computed, ref, watch } from 'vue'
import { generateCircleInvitation, getCircleInvitations, revokeCircleInvitation, updateCircle } from '@/api/circle'
import { useToastStore } from '@/stores/toast'

interface CircleData {
  circleGuid?: string
  name?: string
  description?: string
  avatarUrl?: string
  coverUrl?: string
}

interface InviteCode {
  inviteGuid?: string
  code: string
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

const isOwner = computed(() => props.myRole === 'Owner')

const name = ref('')
const desc = ref('')
const avatarPreview = ref('')
const coverPreview = ref('')
const saving = ref(false)
const avatarInput = ref<HTMLInputElement | null>(null)
const coverInput = ref<HTMLInputElement | null>(null)
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
  loadInviteCodes(c.circleGuid)
}, { immediate: true })

// ===== 邀请码（真实端点生成/撤销） =====
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
    toast.push('邀请码生成失败：' + (e.message || '请重试'), 'error')
  } finally {
    generating.value = false
  }
}
async function revoke(it: InviteCode) {
  if (!props.current || !it.inviteGuid) return
  try {
    await revokeCircleInvitation(props.current.circleGuid, it.inviteGuid)
    inviteCodes.value = inviteCodes.value.filter(x => x.inviteGuid !== it.inviteGuid)
    toast.push('邀请码已撤销', 'info')
  } catch (e) {
    toast.push('撤销失败：' + (e.message || '请重试'), 'error')
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
    toast.push('头像上传失败，请重试', 'error')
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
    toast.push('封面上传失败，请重试', 'error')
  }
}

// ===== 保存（真实社区走 PUT /api/circles/{guid}） =====
async function save() {
  if (!props.current || !name.value.trim()) return
  saving.value = true
  try {
    if (!props.current.circleGuid) return
    const payload = {
      name: name.value.trim(),
      description: desc.value.trim(),
      ...(avatarPreview.value ? { avatarUrl: avatarPreview.value } : {}),
      ...(coverPreview.value ? { coverUrl: coverPreview.value } : {})
    }
    await updateCircle(props.current.circleGuid, payload)
    toast.push('社区信息已保存', 'success')
    emit('saved', {
      name: name.value.trim(),
      description: desc.value.trim(),
      avatarUrl: avatarPreview.value || props.current.avatarUrl || '',
      coverUrl: coverPreview.value || props.current.coverUrl || ''
    })
  } catch (e) {
    toast.push('保存失败：' + (e.message || '请重试'), 'error')
  } finally {
    saving.value = false
  }
}

// 主题渐变头像

</script>
