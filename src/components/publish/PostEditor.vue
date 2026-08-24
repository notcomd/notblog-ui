<template>
  <div class="flex flex-col flex-1">
    <!-- 图片（置顶，九宫格展示；第一张作为封面） -->
    <div class="mb-4">
      <div class="flex items-center justify-between mb-1.5">
        <label class="text-xs text-zinc-400 block">图片（可选 · 第一张作为封面）</label>
        <button type="button" class="text-[11px] px-2.5 h-7 rounded-lg bg-amber-400/15 text-amber-600 dark:text-amber-400 hover:bg-amber-400/25 transition-colors flex items-center gap-1 disabled:opacity-50" :disabled="splitting" @click="pickSplitImage">
          <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M12 8v8M8 12h8" /></svg>
          <span v-if="!splitting" class="inline-flex items-center gap-1.5"><svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></svg>切九宫格</span><span v-else>切分中...</span>
        </button>
      </div>
      <!-- 无图：大虚线区点击上传 -->
      <div
        v-if="images.length === 0"
        class="max-w-[480px] rounded-2xl border-2 border-dashed border-zinc-300 dark:border-zinc-600 bg-zinc-100/60 dark:bg-zinc-900/60 cursor-pointer group transition-colors hover:border-amber-400 dark:hover:border-amber-400 flex-1 min-h-[10rem] flex flex-col items-center justify-center gap-2 text-zinc-400"
        @click="pickImage"
      >
        <svg class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="4" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>
        <span class="text-xs">{{ uploading ? '上传中...' : '点击上传图片（最多 9 张）' }}</span>
      </div>
      <!-- 九宫格网格 -->
      <div v-else class="grid grid-cols-3 gap-2 max-w-[480px]">
        <div v-for="(img, i) in images" :key="i" class="relative aspect-square rounded-xl overflow-hidden border border-white/60 dark:border-white/10 group">
          <img :src="img.preview" alt="" class="w-full h-full object-cover cursor-pointer" @click="openCrop(i)" />
          <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button type="button" class="w-7 h-7 rounded-full bg-white/90 text-zinc-700 flex items-center justify-center hover:bg-white transition-colors" title="裁剪" @click.stop="openCrop(i)">
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2v14a2 2 0 0 0 2 2h14" /><path d="M18 22V8a2 2 0 0 0-2-2H2" /></svg>
            </button>
            <button type="button" class="w-7 h-7 rounded-full bg-white/90 text-red-500 flex items-center justify-center hover:bg-white transition-colors" title="删除" @click.stop="removeImage(i)">
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /></svg>
            </button>
          </div>
        </div>
        <div v-if="images.length < 9" class="aspect-square rounded-xl border-2 border-dashed border-zinc-300 dark:border-zinc-600 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-amber-400 hover:text-amber-500 transition-colors text-zinc-400" @click="pickImage">
          <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14" /></svg>
          <span class="text-[11px]">{{ uploading ? '上传中...' : '添加' }}</span>
        </div>
      </div>
      <input ref="imageInput" type="file" accept="image/*" class="hidden" :disabled="uploading" @change="onPickImage" />
      <input ref="splitInput" type="file" accept="image/*" class="hidden" @change="onSplitPick" />
      <p class="text-[11px] text-zinc-400 mt-2">图片 ≤10MB（后端：POST /api/files/upload-image → FileDev 存储）</p>
    </div>

    <!-- 正文 -->
    <textarea
      v-model="content"
      rows="8"
      class="w-full resize-none rounded-2xl bg-white/70 dark:bg-zinc-800/70 border border-white/60 dark:border-white/10 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-amber-400/50 transition-all"
      placeholder="分享你的想法、故事或见闻...（支持 @提及）"
    ></textarea>

    <!-- 发布到社区（可选） -->
    <div class="mt-4">
      <select v-model="circleGuid" class="w-full h-11 px-4 rounded-2xl bg-white/70 dark:bg-zinc-800/70 border border-white/60 dark:border-white/10 text-sm outline-none focus:ring-2 focus:ring-amber-400/50 transition-all">
        <option value="">发布到主页（不选社区）</option>
        <option v-for="c in myCircles" :key="c.circleGuid" :value="c.circleGuid">{{ c.name }}</option>
      </select>
    </div>

    <!-- 可见范围：公开 / 私密 -->
    <div class="mt-4">
      <label class="text-xs text-zinc-400 block mb-1.5">谁可以看</label>
      <div class="flex flex-wrap gap-2">
        <button type="button" class="h-9 px-4 rounded-xl text-xs font-medium transition-all" :class="visibility === 'Public' ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-white' : 'bg-white/60 dark:bg-zinc-800/60 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 dark:text-zinc-300'" @click="visibility = 'Public'"><svg class="w-3.5 h-3.5 inline-block align-[-2px] mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>公开</button>
        <button type="button" class="h-9 px-4 rounded-xl text-xs font-medium transition-all" :class="visibility === 'Private' ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-white' : 'bg-white/60 dark:bg-zinc-800/60 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 dark:text-zinc-300'" @click="visibility = 'Private'"><svg class="w-3.5 h-3.5 inline-block align-[-2px] mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>私密 · 仅自己可见</button>
      </div>
    </div>

    <!-- 底部按钮：右对齐，固定宽度 -->
    <div class="mt-5 flex flex-col sm:flex-row justify-end gap-3">
      <button class="w-full sm:w-44 h-11 rounded-2xl bg-white/60 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-300 text-sm font-medium hover: active:scale-[0.98] transition-all disabled:opacity-50" :disabled="savingDraft" @click="saveAsDraft">
        <span v-if="!savingDraft" class="inline-flex items-center gap-1.5"><svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>存草稿</span><span v-else>保存中...</span>
      </button>
      <button class="w-full sm:w-44 h-11 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 text-white text-sm font-medium hover: active:scale-[0.98] transition-all disabled:opacity-50" :disabled="publishing || !content.trim()" @click="publish">
        {{ publishing ? '发布中...' : '发布' }}
      </button>
    </div>

    <!-- 裁剪弹窗 -->
    <Teleport to="body">
      <div v-if="cropOpen" class="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4" @click.self="closeCrop">
        <div class="glass-card p-5 w-[min(92vw,720px)]">
          <div class="flex items-center justify-between gap-3 mb-3">
            <h3 class="text-base font-bold text-zinc-800 dark:text-zinc-100">裁剪图片</h3>
            <div class="flex gap-1">
              <button v-for="r in RATIO_KEYS" :key="r" type="button" class="px-2.5 h-8 rounded-lg text-xs font-medium transition-all" :class="ratioKey === r ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-white' : 'bg-white/60 dark:bg-zinc-800/60 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 dark:text-zinc-300'" @click="setRatio(r)">{{ r === 'free' ? '自由' : r }}</button>
            </div>
          </div>
          <div class="bg-zinc-900 rounded-xl overflow-hidden h-[56vh] flex items-center justify-center">
            <img ref="cropImg" :src="cropSrc" alt="" class="max-w-full max-h-full" />
          </div>
          <div class="flex justify-end gap-2 mt-4">
            <button type="button" class="px-4 h-10 rounded-xl text-sm text-zinc-500 hover:bg-white/60 dark:hover:bg-zinc-800/60 transition-all" @click="closeCrop">取消</button>
            <button type="button" class="px-4 h-10 rounded-xl text-sm font-medium bg-gradient-to-r from-amber-400 to-orange-500 text-white active:scale-95 transition-all" @click="confirmCrop">确认裁剪</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import Cropper from 'cropperjs'
import 'cropperjs/dist/cropper.css'
import { useRouter } from 'vue-router'
import { createTweet, createCirclePost, uploadImage } from '@/api/publish'
import { saveDraft, removeDraft } from '@/utils/drafts'
import { unwrap } from '@/utils/response'
import { useToastStore } from '@/stores/toast'

interface Props {
  myCircles?: unknown[]
  draft?: unknown
}
const props = withDefaults(defineProps<Props>(), {
  myCircles: () => [],
  draft: null
})

const router = useRouter()
const toast = useToastStore()

interface ImageItem {
  fileId: string
  preview: string
}

const content = ref('')
const images = ref<ImageItem[]>([])
const circleGuid = ref('')
const visibility = ref('Public')
const uploading = ref(false)
const publishing = ref(false)
const savingDraft = ref(false)
const draftId = ref('')
const imageInput = ref<HTMLInputElement | null>(null)
const splitInput = ref<HTMLInputElement | null>(null)
const splitting = ref(false)

// ---------- 裁剪 ----------
const RATIO_KEYS: string[] = ['free', '1:1', '3:4', '9:16']
const RATIOS: Record<string, number> = { free: NaN, '1:1': 1, '3:4': 3 / 4, '9:16': 9 / 16 }

const cropOpen = ref(false)
const cropIndex = ref(-1)
const cropSrc = ref('')
const cropImg = ref<HTMLImageElement | null>(null)
const cropper = ref<Cropper | null>(null)
const ratioKey = ref('free')

async function openCrop(i: number) {
  cropIndex.value = i
  cropSrc.value = images.value[i]?.preview
  cropOpen.value = true
  ratioKey.value = 'free'
  await nextTick()
  const el = cropImg.value
  if (!el) return
  const init = () => {
    if (cropper.value) cropper.value.destroy()
    cropper.value = new Cropper(el, { viewMode: 1, autoCropArea: 1, background: false })
  }
  if (el.complete && el.naturalWidth) init()
  else el.onload = init
}

function closeCrop() {
  if (cropper.value) { cropper.value.destroy(); cropper.value = null }
  cropOpen.value = false
}

function setRatio(k: string) {
  ratioKey.value = k
  if (cropper.value) cropper.value.setAspectRatio(RATIOS[k])
}

function confirmCrop() {
  if (!cropper.value) return
  const canvas = cropper.value.getCroppedCanvas({ maxWidth: 1280, maxHeight: 1280, imageSmoothingQuality: 'high' })
  const idx = cropIndex.value
  closeCrop()
  canvas.toBlob(async (blob) => {
    if (!blob || !images.value[idx]) return
    const file = new File([blob], 'crop-' + Date.now() + '.jpg', { type: 'image/jpeg' })
    const prevId = images.value[idx].fileId
    images.value[idx].fileId = 'crop-' + Date.now()
    images.value[idx].preview = URL.createObjectURL(file)
    try {
      const res = await uploadImage(file)
      const data = unwrap(res) || {}
      images.value[idx].fileId = data.fileId || data.file_id || images.value[idx].fileId
      const uri = data.fileUri || data.file_url
      if (uri) images.value[idx].preview = uri
      toast.push('裁剪完成', 'success')
    } catch (err) {
      images.value[idx].fileId = prevId // 上传失败恢复原 fileId（发布仍用原图）
      toast.push('裁剪图上传失败（本地预览已生效）', 'info')
    }
  }, 'image/jpeg', 0.9)
}

// ---------- 九宫格切图 ----------
function pickSplitImage() {
  if (!splitting.value && splitInput.value) splitInput.value.click()
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('图片加载失败'))
    img.src = url
  })
}

async function onSplitPick(e: Event) {
  const el = e.target as HTMLInputElement
  const file = el.files && el.files[0]
  el.value = ''
  if (!file) return
  if (file.size > 10 * 1024 * 1024) { toast.push('图片不能超过 10MB', 'error'); return }
  splitting.value = true
  try {
    const img = await loadImage(file)
    const size = Math.min(img.naturalWidth, img.naturalHeight)
    const cell = Math.floor(size / 3)
    const sx = Math.floor((img.naturalWidth - size) / 2)
    const sy = Math.floor((img.naturalHeight - size) / 2)
    images.value = []
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const canvas = document.createElement('canvas')
        canvas.width = canvas.height = 512
        const ctx = canvas.getContext('2d')
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(img, sx + c * cell, sy + r * cell, cell, cell, 0, 0, 512, 512)
        const blob = await new Promise(res => canvas.toBlob(res, 'image/jpeg', 0.9))
        const item = { fileId: 'split-' + Date.now() + '-' + (r * 3 + c), preview: URL.createObjectURL(blob) }
        images.value.push(item)
        uploadGridPart(item, blob)
      }
    }
    toast.push('已按九宫格切分为 9 张图片', 'success')
  } catch (err) {
    toast.push('切分失败，请换一张图片', 'error')
  } finally {
    splitting.value = false
  }
}

// 后台逐块上传换取真实 fileId（失败保留本地预览）
async function uploadGridPart(item: ImageItem, blob: Blob) {
  try {
    const res = await uploadImage(new File([blob], 'grid-' + Date.now() + '.jpg', { type: 'image/jpeg' }))
    const data = unwrap(res) || {}
    if (data.fileId || data.file_id) item.fileId = data.fileId || data.file_id
    const uri = data.fileUri || data.file_url
    if (uri) item.preview = uri
  } catch (err) { /* 保留本地预览 */ }
}

// ---------- 常规上传 ----------
function pickImage() {
  if (!uploading.value && imageInput.value) imageInput.value.click()
}

async function onPickImage(e: Event) {
  const el = e.target as HTMLInputElement
  const file = el.files && el.files[0]
  el.value = ''
  if (!file) return
  if (images.value.length >= 9) { toast.push('最多上传 9 张图片', 'info'); return }
  if (file.size > 10 * 1024 * 1024) {
    toast.push('图片不能超过 10MB', 'error')
    return
  }
  uploading.value = true
  try {
    const res = await uploadImage(file)
    const data = unwrap(res) || {}
    images.value.push({ fileId: data.fileId || data.file_id || 'mock-' + Date.now(), preview: data.fileUri || URL.createObjectURL(file) })
  } catch (err) {
    images.value.push({ fileId: 'mock-' + Date.now(), preview: URL.createObjectURL(file) })
    toast.push('上传失败（mock 模式已本地预览）', 'info')
  } finally {
    uploading.value = false
  }
}

function removeImage(i) {
  images.value.splice(i, 1)
}

// 载入草稿
watch(() => props.draft, (d) => {
  if (!d) return
  draftId.value = d.id
  content.value = d.content || ''
  images.value = (d.images || []).map(i => ({ fileId: i.fileId, preview: i.url || i.fileId }))
  if (d.circleGuid) circleGuid.value = d.circleGuid
  visibility.value = d.visibility || 'Public'
}, { immediate: true })

function firstLine(s?: string): string {
  const t = (s || '').trim()
  return t ? t.split('\n')[0].slice(0, 40) : ''
}

function saveAsDraft() {
  savingDraft.value = true
  try {
    const saved = saveDraft({
      id: draftId.value || undefined,
      type: 'post',
      title: firstLine(content.value),
      content: content.value,
      images: images.value.map(i => ({ fileId: i.fileId, url: i.preview })),
      circleGuid: circleGuid.value,
      visibility: visibility.value
    })
    draftId.value = saved.id
    toast.push('草稿已保存', 'success')
  } finally {
    savingDraft.value = false
  }
}

async function publish() {
  if (publishing.value) return
  publishing.value = true
  try {
    const payload = { content: content.value.trim(), fileIds: images.value.map(i => i.fileId), fileUri:images.value.map(i=>i.preview),visibility: visibility.value }
    const res = circleGuid.value
      ? await createCirclePost({ circleGuid: circleGuid.value, ...payload })
      : await createTweet(payload)
    const data = unwrap(res)
    const newId = (data && typeof data === 'object' && (data.data || data.tweetGuid)) || data
    toast.push(circleGuid.value ? '已发布到社区' : '发布成功', 'success')
    if (draftId.value) { removeDraft(draftId.value); draftId.value = '' }
    if (newId && String(newId).startsWith('mock')) router.push('/home')
    else router.push(`/posts/${newId}`)
  } catch (e) {
    toast.push('发布失败，请稍后重试', 'error')
  } finally {
    publishing.value = false
  }
}
</script>
