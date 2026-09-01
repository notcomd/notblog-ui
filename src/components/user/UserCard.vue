<template>
  <div class="glass-card overflow-hidden">
    <!-- ===== 封面区：媒体 + 主题色边缘渐变模糊 + 右上角上传按钮 ===== -->
    <div class="relative h-44 overflow-hidden">
      <!-- 无封面 / 加载失败：默认渐变 -->
      <template v-if="!user.coverUrl || coverFailed">
        <div class="absolute inset-0 bg-gradient-to-r from-amber-300/70 via-orange-300/50 to-emerald-300/60 dark:from-amber-500/25 dark:via-orange-500/20 dark:to-emerald-500/25">
          <div class="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(255,255,255,0.5),transparent_50%)]"></div>
        </div>
      </template>
      <template v-else>
        <!-- 底层：模糊主题底色（blur ≈ 封面高度 20%：176px × 20% ≈ 35px），边缘经渐变融入 -->
        <div class="absolute inset-0 blur-[35px] scale-[1.3]">
          <img v-if="!coverIsVideo" :src="user.coverUrl" alt="" class="w-full h-full object-cover" @error="coverFailed = true" />
          <video v-else :src="user.coverUrl" :autoplay="!reduceMotion" muted loop playsinline class="w-full h-full object-cover"></video>
        </div>
        <!-- 前景：清晰层（中心清晰，动态图/视频自动播放） -->
        <img v-if="!coverIsVideo" :src="user.coverUrl" alt="" class="absolute inset-0 w-full h-full object-cover" @error="coverFailed = true" />
        <video v-else :src="user.coverUrl" :autoplay="!reduceMotion" muted loop playsinline class="absolute inset-0 w-full h-full object-cover"></video>
        <!-- 边缘→中心 主题色渐变遮罩（canvas 采样主色，失败回退琥珀） -->
        <div class="absolute inset-0" :style="coverOverlayStyle"></div>
      </template>

      <!-- 右上角：添加/更换封面（仅自己） -->
      <button
        v-if="isSelf"
        class="absolute top-3 right-3 z-10 flex items-center gap-1.5 px-3 h-8 rounded-[5%] bg-black/45 hover:bg-black/60 text-white text-xs font-medium transition-colors active:scale-95 disabled:opacity-60"
        type="button"
        :disabled="coverUploading"
        title="上传封面（图片/动态图/视频，≤20MB）"
        @click="coverInput && coverInput.click()"
      >
        <svg v-if="!coverUploading" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>
        <svg v-else class="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M21 12a9 9 0 1 1-6.2-8.56" /></svg>
        {{ coverUploading ? `上传中 ${coverProgress}%` : (user.coverUrl ? '更换封面' : '添加封面') }}
      </button>
      <input ref="coverInput" type="file" accept="image/*,video/*" class="hidden" @change="onCoverPick" />
    </div>

    <!-- ===== 信息区：头像 + 用户名/等级/签名 + 操作（与封面完全分离，头像不叠封面） ===== -->
    <div class="px-5 sm:px-6 pt-4 pb-4">
      <div class="flex items-center gap-3 sm:gap-4">
        <!-- 头像（失败回退首字母头像） -->
        <div class="relative group shrink-0">
          <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 sm:border-4 border-white dark:border-zinc-800 bg-gradient-to-br from-amber-300 to-orange-400 flex items-center justify-center select-none">
            <img v-if="!avatarFailed && user.avatar" :src="user.avatar" alt="" class="w-full h-full object-cover" @error="avatarFailed = true" />
            <span v-else class="text-2xl sm:text-3xl font-bold text-white">{{ avatarChar }}</span>
          </div>
          <button v-if="isSelf" type="button" class="absolute inset-0 rounded-2xl bg-black/45 text-white text-[10px] font-medium flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" title="更换头像" @click="avatarInput && avatarInput.click()">更换头像</button>
          <input ref="avatarInput" type="file" accept="image/*" class="hidden" @change="onAvatarChange" />
        </div>

        <!-- 用户名 / 等级（一行）+ 签名（另起一行，自己可编辑） -->
        <div class="flex-1 min-w-0 sm:pb-1">
          <div class="flex items-center gap-2">
            <span class="text-lg sm:text-xl font-bold text-zinc-800 dark:text-zinc-100 truncate shrink-0 max-w-[45%]">{{ displayName }}</span>
            <span v-if="isSelf" class="shrink-0 px-1.5 py-0.5 rounded-[5%] text-[10px] font-medium text-amber-600 dark:text-amber-400 bg-amber-400/10 border border-amber-400/30">我的主页</span>
            <span v-if="userInfo" class="shrink-0 px-1.5 py-0.5 rounded-[5%] bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-bold">Lv.{{ userInfo.level }}</span>
          </div>

          <!-- 签名行：只读展示 / 编辑态输入框（仅自己） -->
          <div class="mt-1 flex items-center gap-2 min-w-0">
            <template v-if="bioEditing">
              <input
                ref="bioInput"
                v-model="bioDraft"
                type="text"
                name="bio"
                aria-label="个人签名"
                maxlength="60"
                placeholder="写点什么介绍一下自己…"
                class="flex-1 min-w-0 h-8 px-3 rounded-[5%] bg-white/70 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-700 dark:text-zinc-200 outline-none focus:ring-2 focus:ring-amber-400/50 transition-all"
                @keyup.enter="saveBio"
                @keyup.esc="cancelBio"
              />
              <button type="button" class="shrink-0 px-2.5 h-8 rounded-[5%] text-xs font-medium bg-gradient-to-r from-amber-400 to-orange-500 text-white active:scale-95 transition-all" @click="saveBio">保存</button>
              <button type="button" class="shrink-0 px-2.5 h-8 rounded-[5%] text-xs text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors" @click="cancelBio">取消</button>
            </template>
            <template v-else>
              <p class="text-sm text-zinc-400 truncate flex-1 min-w-0">{{ bioDisplay }}</p>
              <button
                v-if="isSelf"
                type="button"
                class="shrink-0 w-7 h-7 rounded-[5%] flex items-center justify-center text-zinc-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-zinc-800 transition-colors"
                title="编辑签名"
                aria-label="编辑签名"
                @click="startEditBio"
              >
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
              </button>
            </template>
          </div>
        </div>

        <!-- 操作区：他人主页显示 聊天 + 关注 按钮 -->
        <div class="shrink-0 flex items-center gap-2">
          <template v-if="!isSelf">
            <button
              type="button"
              class="px-4 h-9 rounded-[5%] text-sm font-medium border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700/60 active:scale-95 transition-all"
              title="发起聊天"
              @click="emit('chat')"
            >
              <span class="flex items-center gap-1.5">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                聊天
              </span>
            </button>
            <button
              type="button"
              class="px-5 h-9 rounded-[5%] text-sm font-medium transition-all active:scale-95"
              :class="following ? 'bg-white border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500' : 'bg-gradient-to-r from-amber-400 to-orange-500 text-white'"
              :aria-label="following ? '取消关注' : '关注'"
              @click="emit('toggle-follow')"
            >{{ following ? '已关注' : '关注' }}</button>
          </template>
        </div>
      </div>
    </div>

    <!-- 头像裁剪面板（Teleport 到 body，避免被卡片 overflow-hidden 裁剪；固定 1:1 方形） -->
    <Teleport to="body">
      <div v-if="avatarCropOpen" class="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4">
        <div class="bg-white dark:bg-zinc-800 rounded-[5%] w-[min(92vw,480px)] p-5">
          <div class="text-sm font-bold text-zinc-800 dark:text-zinc-100">裁剪头像</div>
          <p class="text-xs text-zinc-400 mt-1 mb-3">拖拽 / 滚轮调整裁剪区域（1:1 方形）</p>
          <div class="rounded-[5%] overflow-hidden bg-zinc-900">
            <img ref="avatarCropImg" :src="avatarCropSrc" alt="" class="max-h-[320px] w-full object-contain" />
          </div>
          <div class="flex justify-end gap-2 mt-4">
            <button type="button" class="px-4 h-9 rounded-[5%] text-sm text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors" :disabled="avatarUploading" @click="closeAvatarCrop">取消</button>
            <button type="button" class="px-5 h-9 rounded-[5%] text-sm font-medium bg-gradient-to-r from-amber-400 to-orange-500 text-white active:scale-95 transition-all disabled:opacity-60" :disabled="avatarUploading" @click="confirmAvatarCrop">{{ avatarUploading ? '上传中…' : '裁剪并上传' }}</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import Cropper from 'cropperjs'
import 'cropperjs/dist/cropper.css'
import { uploadAvatar } from '@/api/auth'
import { uploadUserCover, updateBackgroundCover } from '@/api/userinfo'
import { useToastStore } from '@/stores/toast'
import { unwrap } from '@/utils/response'

interface UserInfoData {
  level?: number
}

interface Props {
  user: Record<string, unknown>
  isSelf?: boolean
  // Message /api/user-info/me：他人无该数据时为空（不显示等级徽章）
  userInfo?: UserInfoData | null
  following?: boolean
}
const props = withDefaults(defineProps<Props>(), {
  isSelf: false,
  userInfo: null,
  following: false
})
const emit = defineEmits<{
  (e: 'avatar-changed', url: string): void
  (e: 'cover-changed', url: string): void
  (e: 'bio-changed', bio: string): void
  (e: 'chat'): void
  (e: 'toggle-follow'): void
}>()

const toast = useToastStore()

// ===== 减弱动态效果（prefers-reduced-motion）：封面视频停止自动播放 =====
const reduceMotion = ref(false)
let motionQuery: MediaQueryList | null = null
function onMotionChange(mq: MediaQueryList | MediaQueryListEvent): void {
  reduceMotion.value = mq.matches
}
onMounted(() => {
  motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  onMotionChange(motionQuery)
  motionQuery.addEventListener('change', onMotionChange)
})
onUnmounted(() => {
  if (motionQuery) motionQuery.removeEventListener('change', onMotionChange)
})

// ===== 头像（选择后先裁剪 1:1，再上传裁剪结果） =====
const avatarInput = ref<HTMLInputElement | null>(null)
const avatarFailed = ref(false)
const avatarCropOpen = ref(false)
const avatarCropSrc = ref('')
const avatarCropImg = ref<HTMLImageElement | null>(null)
const avatarCropper = ref<Cropper | null>(null)
const avatarUploading = ref(false)
const displayName = computed(() => (props.user.nickname as string) || (props.user.name as string) || '未命名用户')
const avatarChar = computed(() => (displayName.value || '芒').slice(0, 1))

function onAvatarChange(e: Event) {
  const el = e.target as HTMLInputElement
  const file = el.files && el.files[0]
  el.value = ''
  if (!file) return
  if (!file.type.startsWith('image/')) {
    toast.push('请选择图片文件', 'error')
    return
  }
  if (file.size > 10 * 1024 * 1024) {
    toast.push('图片不能超过 10MB', 'error')
    return
  }
  // 打开裁剪面板（固定 1:1，头像为方形展示）
  avatarCropSrc.value = URL.createObjectURL(file)
  avatarCropOpen.value = true
  nextTick(() => {
    const el2 = avatarCropImg.value
    if (!el2) return
    const init = () => {
      if (avatarCropper.value) avatarCropper.value.destroy()
      avatarCropper.value = new Cropper(el2, { aspectRatio: 1, viewMode: 1, autoCropArea: 0.85, background: false, dragMode: 'move' })
    }
    if (el2.complete && el2.naturalWidth) init()
    else el2.onload = init
  })
}

function closeAvatarCrop() {
  if (avatarCropper.value) {
    avatarCropper.value.destroy()
    avatarCropper.value = null
  }
  if (avatarCropSrc.value) {
    URL.revokeObjectURL(avatarCropSrc.value)
    avatarCropSrc.value = ''
  }
  avatarCropOpen.value = false
}

// 裁剪并上传（Identity：POST /api/avatar/upload）
function confirmAvatarCrop() {
  if (!avatarCropper.value || avatarUploading.value) return
  avatarUploading.value = true
  const canvas = avatarCropper.value.getCroppedCanvas({ width: 512, height: 512, imageSmoothingQuality: 'high' })
  canvas.toBlob(async (blob) => {
    if (!blob) {
      avatarUploading.value = false
      toast.push('裁剪失败，请重试', 'error')
      return
    }
    const file = new File([blob], 'avatar-' + Date.now() + '.jpg', { type: 'image/jpeg' })
    try {
      const res = await uploadAvatar(file)
      const data = res && res.data ? res.data : res
      const url = data.fileUri || data.url || data.path
      if (url) {
        avatarFailed.value = false
        emit('avatar-changed', url)
        toast.push('头像已更新', 'success')
      } else {
        toast.push('上传失败（后端未就绪）', 'error')
      }
    } catch (err) {
      toast.push('上传失败（后端未就绪）', 'error')
    } finally {
      avatarUploading.value = false
      closeAvatarCrop()
    }
  }, 'image/jpeg', 0.9)
}

// ===== 签名（编辑态：仅自己；持久化由父组件处理，后端暂无 bio 字段/端点） =====
const bioEditing = ref(false)
const bioDraft = ref('')
const bioInput = ref<HTMLInputElement | null>(null)
const bioDisplay = computed(() => (props.user.bio as string) || '这个人很懒，什么都没有写')

function startEditBio() {
  bioDraft.value = (props.user.bio as string) || ''
  bioEditing.value = true
  nextTick(() => bioInput.value && bioInput.value.focus())
}

function saveBio() {
  const bio = bioDraft.value.trim()
  bioEditing.value = false
  emit('bio-changed', bio)
  toast.push(bio ? '签名已更新' : '签名已清除', 'success')
}

function cancelBio() {
  bioEditing.value = false
}

// ===== 封面 =====
const coverInput = ref<HTMLInputElement | null>(null)
const coverFailed = ref(false)
const coverUploading = ref(false)
const coverProgress = ref(0)
const coverTheme = ref<{ r: number; g: number; b: number } | null>(null) // canvas 采样主色 {r,g,b} | null → 回退默认琥珀

const coverIsVideo = computed(() => /\.(mp4|webm|ogg|mov|m4v)(\?|#|$)/i.test((props.user.coverUrl as string) || ''))

// 边缘→中心主题色渐变遮罩（中心透明，四边染主题色，与底层模糊融合）
const coverOverlayStyle = computed(() => {
  const c = coverTheme.value
  const rgb = c ? `${c.r},${c.g},${c.b}` : '251,191,36'
  return {
    background: `radial-gradient(130% 100% at 50% 15%, transparent 45%, rgba(${rgb},0.22) 72%, rgba(${rgb},0.55) 100%)`
  }
})

// 采样封面主色：canvas 8×8 降采样取平均色（跨域/视频失败回退默认琥珀）
function sampleColor(source: HTMLImageElement | HTMLVideoElement): Promise<{ r: number; g: number; b: number } | null> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    canvas.width = 8
    canvas.height = 8
    const ctx = canvas.getContext('2d')
    const done = () => {
      try {
        const data = ctx.getImageData(0, 0, 8, 8).data
        let r = 0, g = 0, b = 0
        for (let i = 0; i < data.length; i += 4) { r += data[i]; g += data[i + 1]; b += data[i + 2] }
        const n = data.length / 4
        resolve({ r: Math.round(r / n), g: Math.round(g / n), b: Math.round(b / n) })
      } catch (e) { resolve(null) }
    }
    if (source.tagName === 'VIDEO') {
      source.onloadeddata = () => { try { ctx.drawImage(source, 0, 0, 8, 8); done() } catch (e) { resolve(null) } }
      source.onerror = () => resolve(null)
    } else {
      source.onload = () => { try { ctx.drawImage(source, 0, 0, 8, 8); done() } catch (e) { resolve(null) } }
      source.onerror = () => resolve(null)
    }
  })
}

async function refreshTheme(url: string) {
  coverTheme.value = null
  if (!url) return
  const timeout: Promise<null> = new Promise(r => setTimeout(() => r(null), 4000))
  if (coverIsVideo.value) {
    const v = document.createElement('video')
    v.muted = true
    v.crossOrigin = 'anonymous' // ⚠️ 必须先于 src 设置，否则跨域视频无法采样
    v.src = url
    coverTheme.value = await Promise.race([sampleColor(v), timeout])
  } else {
    const img = new Image()
    img.crossOrigin = 'anonymous' // ⚠️ 必须先于 src 设置，否则跨域图片无法采样（canvas 污染）
    img.src = url
    coverTheme.value = await Promise.race([sampleColor(img), timeout])
  }
}

async function onCoverPick(e: Event) {
  const el = e.target as HTMLInputElement
  const file = el.files && el.files[0]
  el.value = ''
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
  coverUploading.value = true
  coverProgress.value = 0
  try {
    // 上传（≤10MB 直传 /api/files/upload(-image)；>10MB 自动分片）→ FileRef.fileUri
    const res = await uploadUserCover(file, (p) => { coverProgress.value = p })
    const data = unwrap(res) || {}
    const url = data.fileUri || data.file_url || ''
    if (!url) throw new Error('上传响应缺少 fileUri')
    // 本地立即生效（父组件更新 user.coverUrl）
    emit('cover-changed', url)
    refreshTheme(url)
    // 持久化（Message：PUT /api/user-info/me/background）
    try {
      await updateBackgroundCover(url)
      toast.push('封面已更新', 'success')
    } catch (err) {
      toast.push('封面已更新，但保存失败（后端未就绪）', 'info')
    }
  } catch (err) {
    toast.push('封面上传失败，请稍后重试', 'error')
  } finally {
    coverUploading.value = false
  }
}

// 封面/头像变化（含用户切换）时重置失败态 + 重新采样主题色
watch(() => props.user.coverUrl, (url) => {
  coverFailed.value = false
  if (url) refreshTheme(url as string)
})
watch(() => props.user.avatar, () => { avatarFailed.value = false })
</script>
