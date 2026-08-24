<template>
  <div class="flex flex-col flex-1 min-h-0">
    <!-- 头部：返回 + 标题 -->
    <div class="flex items-center gap-3 px-5 py-3 border-b border-zinc-200/60 dark:border-zinc-700/60 shrink-0">
      <button class="w-9 h-9 rounded-[5%] flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:bg-white/60 dark:hover:bg-zinc-800/60 transition-colors" title="返回" @click="emit('close')">
        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
      </button>
      <span class="text-sm font-semibold text-zinc-800 dark:text-zinc-100">创建社区</span>
    </div>

    <!-- 表单区 -->
    <div class="flex-1 overflow-y-auto px-6 py-5 min-h-0 space-y-6">
      <!-- 封面（静态图可裁剪；动图/视频直传） -->
      <div>
        <div class="text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-2 flex items-center gap-2">
          社区封面
          <span class="text-xs font-normal text-zinc-400">支持图片 / 动图 / 视频（≤20MB）</span>
        </div>
        <div class="relative h-32 rounded-[5%] overflow-hidden group">
          <template v-if="coverPreview">
            <img v-if="!coverIsVideo" :src="coverPreview" alt="" class="w-full h-full object-cover" />
            <video v-else :src="coverPreview" autoplay muted loop playsinline class="w-full h-full object-cover"></video>
            <!-- hover 遮罩：更换 / 移除 -->
            <div class="absolute inset-0 bg-black/50 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <button class="px-3 h-9 rounded-[5%] text-xs font-medium bg-white/20 text-white border border-white/40 hover:bg-white/35 active:scale-95 transition-all" :disabled="coverUploading" @click="coverInput && coverInput.click()">更换</button>
              <button class="px-3 h-9 rounded-[5%] text-xs font-medium bg-red-500 text-white hover:bg-red-600 active:scale-95 transition-all" :disabled="coverUploading" @click="removeCover">移除</button>
            </div>
          </template>
          <button v-else class="w-full h-full flex flex-col items-center justify-center gap-1.5 border-2 border-dashed border-zinc-300 dark:border-zinc-600 rounded-[5%] text-zinc-400 dark:text-zinc-500 hover:border-amber-400/60 hover:text-amber-500 transition-colors" :disabled="coverUploading" @click="coverInput && coverInput.click()">
            <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>
            <span class="text-xs">{{ coverUploading ? `上传中 ${coverProgress}%` : '点击上传封面' }}</span>
          </button>
        </div>
        <input ref="coverInput" type="file" accept="image/*,video/*" class="hidden" @change="onCoverPick" />
      </div>

      <!-- 头像（1:1 裁剪；动图直传） -->
      <div class="flex items-center gap-4">
        <div class="relative group shrink-0">
          <div class="w-20 h-20 rounded-[5%] overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
            <img v-if="avatarPreview" :src="avatarPreview" alt="" class="w-full h-full object-cover" />
            <svg v-else class="w-8 h-8 text-zinc-300 dark:text-zinc-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
          </div>
          <button v-if="avatarPreview" class="absolute inset-0 rounded-[5%] bg-black/45 text-white text-[10px] font-medium flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" title="更换头像" :disabled="avatarUploading" @click="avatarInput && avatarInput.click()">更换头像</button>
        </div>
        <div class="flex-1 min-w-0">
          <div class="text-sm font-medium text-zinc-700 dark:text-zinc-200">社区头像</div>
          <p class="text-xs text-zinc-400 mt-1">{{ avatarPreview ? '点击头像可更换' : '选图后 1:1 裁剪（JPG / PNG / WebP / 动图）' }}</p>
          <button v-if="!avatarPreview" class="mt-2 px-3 h-8 rounded-[5%] text-xs font-medium border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-60" :disabled="avatarUploading" @click="avatarInput && avatarInput.click()">{{ avatarUploading ? '上传中...' : '选择图片' }}</button>
        </div>
        <input ref="avatarInput" type="file" accept="image/*" class="hidden" @change="onAvatarPick" />
      </div>

      <!-- 社区名称 -->
      <div>
        <div class="text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-2">社区名称 <span class="text-red-500">*</span></div>
        <input v-model="form.name" maxlength="50" placeholder="给社区起个名字（必填）" class="w-full h-11 px-4 rounded-[5%] bg-white/70 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700 text-sm outline-none focus:ring-2 focus:ring-amber-400/50 transition-all" />
      </div>

      <!-- 社区简介 -->
      <div>
        <div class="text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-2">社区简介</div>
        <textarea v-model="form.description" rows="3" maxlength="500" placeholder="介绍一下这个社区是做什么的（可选）" class="w-full resize-none rounded-[5%] bg-white/70 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-amber-400/50 transition-all"></textarea>
      </div>

      <!-- 成员上限 -->
      <div>
        <div class="text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-2">成员上限</div>
        <input v-model.number="form.maxMembers" type="number" min="1" max="5000" placeholder="默认 500" class="w-44 h-11 px-4 rounded-[5%] bg-white/70 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700 text-sm outline-none focus:ring-2 focus:ring-amber-400/50 transition-all" />
      </div>
    </div>

    <!-- 底部按钮 -->
    <div class="px-5 py-3.5 border-t border-zinc-200/60 dark:border-zinc-700/60 flex justify-end gap-2 shrink-0">
      <button class="h-10 px-4 rounded-[5%] text-sm text-zinc-500 dark:text-zinc-300 hover:bg-white/60 dark:hover:bg-zinc-800/60 transition-colors" @click="emit('close')">取消</button>
      <button class="h-10 px-4 rounded-[5%] bg-gradient-to-r from-amber-400 to-orange-500 text-white text-sm font-medium active:scale-95 transition-all disabled:opacity-50" :disabled="creating || !form.name.trim()" @click="doCreate">
        {{ creating ? '创建中...' : '创建社区' }}
      </button>
    </div>

    <!-- 裁剪面板（Teleport 到 body；头像 1:1 / 封面自由比例） -->
    <Teleport to="body">
      <div v-if="cropOpen" class="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4">
        <div class="bg-white dark:bg-zinc-800 rounded-[5%] w-[min(92vw,560px)] p-5">
          <div class="text-sm font-bold text-zinc-800 dark:text-zinc-100">{{ cropMode === 'avatar' ? '裁剪头像' : '裁剪封面' }}</div>
          <p class="text-xs text-zinc-400 mt-1 mb-3">{{ cropMode === 'avatar' ? '拖拽 / 滚轮调整裁剪区域（1:1 方形）' : '拖拽 / 滚轮调整裁剪区域（自由比例）' }}</p>
          <div class="rounded-[5%] overflow-hidden bg-zinc-900">
            <img ref="cropImg" :src="cropSrc" alt="" class="max-h-[320px] w-full object-contain" />
          </div>
          <div class="flex justify-end gap-2 mt-4">
            <button class="px-4 h-9 rounded-[5%] text-sm text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors" :disabled="cropUploading" @click="closeCrop">取消</button>
            <button class="px-5 h-9 rounded-[5%] text-sm font-medium bg-gradient-to-r from-amber-400 to-orange-500 text-white active:scale-95 transition-all disabled:opacity-60" :disabled="cropUploading" @click="confirmCrop">{{ cropUploading ? '上传中...' : '裁剪并上传' }}</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import Cropper from 'cropperjs'
import 'cropperjs/dist/cropper.css'
import { createCircle, uploadCircleFile } from '@/api/circle'
import { useToastStore } from '@/stores/toast'
import { unwrap } from '@/utils/response'

const emit = defineEmits<{
  close: []
  created: [guid: string]
}>()
const toast = useToastStore()

const form = ref({ name: '', description: '', maxMembers: 500 })

// ===== 封面 =====
const coverInput = ref<HTMLInputElement | null>(null)
const coverUploading = ref(false)
const coverProgress = ref(0)
const coverPreview = ref('') // fileUri（后端可用）或 objectURL（上传失败本地预览）
const coverUrl = ref('') // 真实可提交的 fileUri

const coverIsVideo = computed(() => /\.(mp4|webm|ogg|mov|m4v)(\?|#|$)/i.test(coverPreview.value || ''))

// ===== 头像 =====
const avatarInput = ref<HTMLInputElement | null>(null)
const avatarUploading = ref(false)
const avatarPreview = ref('')
const avatarUrl = ref('')

// ===== 裁剪面板（avatar 1:1 / cover 自由比例） =====
const cropOpen = ref(false)
const cropMode = ref('avatar')
const cropSrc = ref('')
const cropFile = ref<File | null>(null) // 原始文件（裁剪结果上传）
const cropImg = ref<HTMLImageElement | null>(null)
const cropper = ref<Cropper | null>(null)
const cropUploading = ref(false)

function onCoverPick(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files && input.files[0]
  input.value = ''
  if (!file) return
  const isImage = file.type.startsWith('image/')
  const isVideo = file.type.startsWith('video/')
  if (!isImage && !isVideo) {
    toast.push('仅支持图片或视频文件', 'error')
    return
  }
  if (file.size > 20 * 1024 * 1024) {
    toast.push('封面文件不能超过 20MB', 'error')
    return
  }
  if (isImage && file.type !== 'image/gif') {
    // 静态图片：先裁剪（自由比例）
    cropFile.value = file
    cropMode.value = 'cover'
    cropSrc.value = URL.createObjectURL(file)
    openCrop()
  } else {
    // 动图（gif）/ 视频：直接上传，不裁剪（避免丢失动画）
    uploadCover(file)
  }
}

function onAvatarPick(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files && input.files[0]
  input.value = ''
  if (!file) return
  if (!file.type.startsWith('image/')) {
    toast.push('请选择图片文件', 'error')
    return
  }
  if (file.size > 10 * 1024 * 1024) {
    toast.push('图片不能超过 10MB', 'error')
    return
  }
  if (file.type === 'image/gif') {
    // 动图：直接上传（保留动画）
    uploadAvatar(file)
  } else {
    cropFile.value = file
    cropMode.value = 'avatar'
    cropSrc.value = URL.createObjectURL(file)
    openCrop()
  }
}

function openCrop() {
  cropOpen.value = true
  nextTick(() => {
    const el = cropImg.value
    if (!el) return
    const init = () => {
      if (cropper.value) cropper.value.destroy()
      cropper.value = new Cropper(el, {
        aspectRatio: cropMode.value === 'avatar' ? 1 : NaN,
        viewMode: 1,
        autoCropArea: 0.85,
        background: false,
        dragMode: 'move'
      })
    }
    if (el.complete && el.naturalWidth) init()
    else el.onload = init
  })
}

function closeCrop() {
  if (cropper.value) {
    cropper.value.destroy()
    cropper.value = null
  }
  if (cropSrc.value) {
    URL.revokeObjectURL(cropSrc.value)
    cropSrc.value = ''
  }
  cropOpen.value = false
}

function confirmCrop() {
  if (!cropper.value || cropUploading.value) return
  cropUploading.value = true
  const canvas = cropMode.value === 'avatar'
    ? cropper.value.getCroppedCanvas({ width: 512, height: 512, imageSmoothingQuality: 'high' })
    : cropper.value.getCroppedCanvas({ maxWidth: 1600, imageSmoothingQuality: 'high' })
  canvas.toBlob(async (blob) => {
    if (!blob) {
      cropUploading.value = false
      toast.push('裁剪失败，请重试', 'error')
      return
    }
    const file = new File([blob], (cropMode.value === 'avatar' ? 'avatar-' : 'cover-') + Date.now() + '.jpg', { type: 'image/jpeg' })
    const mode = cropMode.value
    closeCrop()
    try {
      if (mode === 'avatar') await uploadAvatar(file)
      else await uploadCover(file)
    } catch (err) {
      // 错误 toast 已在 uploadXxx 内处理
    } finally {
      cropUploading.value = false
    }
  }, 'image/jpeg', 0.9)
}

// ===== 上传（拿到 fileUri 后写预览） =====
async function uploadAvatar(file: File) {
  avatarUploading.value = true
  try {
    const res = await uploadCircleFile(file, 'circle-avatar')
    const data = unwrap(res) || {}
    const url = data.fileUri || data.file_url || ''
    if (!url) throw new Error('上传响应缺少 fileUri')
    avatarUrl.value = url
    avatarPreview.value = url
    toast.push('头像已上传', 'success')
  } catch (err) {
    toast.push('头像上传失败（后端未就绪）', 'error')
  } finally {
    avatarUploading.value = false
  }
}

async function uploadCover(file: File) {
  coverUploading.value = true
  coverProgress.value = 0
  try {
    const res = await uploadCircleFile(file, 'circle-cover', (p) => { coverProgress.value = p })
    const data = unwrap(res) || {}
    const url = data.fileUri || data.file_url || ''
    if (!url) throw new Error('上传响应缺少 fileUri')
    coverUrl.value = url
    coverPreview.value = url
    toast.push('封面已上传', 'success')
  } catch (err) {
    toast.push('封面上传失败（后端未就绪）', 'error')
  } finally {
    coverUploading.value = false
  }
}

function removeCover() {
  coverUrl.value = ''
  coverPreview.value = ''
}

// ===== 创建 =====
const creating = ref(false)

async function doCreate() {
  if (creating.value || !form.value.name.trim()) return
  creating.value = true
  try {
    const res = await createCircle({
      name: form.value.name.trim(),
      description: form.value.description.trim() || undefined,
      avatarUrl: avatarUrl.value || undefined,
      coverUrl: coverUrl.value || undefined,
      maxMembers: form.value.maxMembers || 500
    })
    const data = unwrap(res)
    const guid = typeof data === 'object' && data !== null ? (data.circleGuid || data.data || data.guid || '') : (data || '')
    toast.push('社区创建成功', 'success')
    emit('created', guid)
  } catch (err) {
    toast.push('创建失败，请稍后重试', 'error')
  } finally {
    creating.value = false
  }
}
</script>
