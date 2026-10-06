<template>
  <div class="flex flex-col">
    <!-- ===== ① 正文：写作优先，无框书写面（文本直接落在页面上） ===== -->
    <section>
      <label for="post-content" class="block text-[11px] font-medium text-zinc-400 dark:text-zinc-500">正文</label>
      <textarea
        id="post-content"
        v-model="content"
        name="content"
        aria-label="正文"
        rows="7"
        class="mt-2 w-full min-h-[190px] resize-none rounded-[5%] border-0 bg-transparent py-1 text-[15px] leading-7 text-zinc-800 outline-none transition-colors placeholder:text-zinc-400 focus:bg-black/[0.02] dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:bg-white/[0.03]"
        placeholder="分享你的想法、故事或见闻…（支持 @提及）"
      ></textarea>
    </section>

    <!-- ===== ② 图片（第一张作封面） ===== -->
    <section class="mt-8 border-t border-zinc-200/70 pt-6 dark:border-zinc-800/70">
      <div class="mb-3 flex items-baseline justify-between gap-3">
        <span class="text-[11px] font-medium text-zinc-400 dark:text-zinc-500">
          图片
          <span class="ml-1.5 font-normal">第一张作封面 · 最多 9 张</span>
        </span>
        <button type="button" class="flex h-7 items-center gap-1 rounded-[5%] bg-amber-400/15 px-2.5 text-[11px] text-amber-600 transition-colors hover:bg-amber-400/25 disabled:opacity-50 dark:text-amber-400" :disabled="splitting" @click="pickSplitImage">
          <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
          切九宫格
        </button>
      </div>

      <!-- 无图：虚线投放区 -->
      <div
        v-if="images.length === 0"
        class="flex min-h-[9rem] cursor-pointer flex-col items-center justify-center gap-2 rounded-[5%] border border-dashed border-zinc-300 bg-black/[0.015] text-zinc-400 transition-colors hover:border-amber-400 dark:border-zinc-700 dark:bg-white/[0.02] dark:hover:border-amber-400"
        tabindex="0"
        @click="pickImage"
        @keydown.enter.prevent="pickImage"
        @keydown.space.prevent="pickImage"
      >
        <svg class="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>
        <span class="text-xs">{{ uploading ? '上传中…' : '点击上传图片' }}</span>
      </div>

      <!-- 九宫格 -->
      <div v-else class="grid grid-cols-3 gap-3">
        <div v-for="(img, i) in images" :key="i" class="group relative aspect-square overflow-hidden rounded-[5%] bg-zinc-100 dark:bg-zinc-900">
          <img :src="img.preview" alt="" class="h-full w-full cursor-pointer object-cover" @click="openCrop(i)" />
          <div class="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
            <button type="button" class="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-zinc-700 transition-colors hover:bg-white" title="裁剪" aria-label="裁剪" @click.stop="openCrop(i)">
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 2v14a2 2 0 0 0 2 2h14" /><path d="M18 22V8a2 2 0 0 0-2-2H2" /></svg>
            </button>
            <button type="button" class="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-red-500 transition-colors hover:bg-white" title="删除" aria-label="删除" @click.stop="removeImage(i)">
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /></svg>
            </button>
          </div>
        </div>
        <button
          v-if="images.length < 9"
          type="button"
          class="flex aspect-square flex-col items-center justify-center gap-1 rounded-[5%] border border-dashed border-zinc-300 text-zinc-400 transition-colors hover:border-amber-400 hover:text-amber-500 dark:border-zinc-700"
          @click="pickImage"
        >
          <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
          <span class="text-[11px]">{{ uploading ? '上传中…' : '添加' }}</span>
        </button>
      </div>
      <input ref="imageInput" type="file" accept="image/*" class="hidden" :disabled="uploading" @change="onPickImage" />
      <input ref="splitInput" type="file" accept="image/*" class="hidden" @change="onSplitPick" />
      <p class="mt-2 text-[11px] text-zinc-400">图片 ≤10MB；点图可裁剪，或用「切九宫格」把一张方图拆成 9 张</p>
    </section>

    <!-- ===== ③ 发布设置 ===== -->
    <section class="mt-8 grid grid-cols-2 gap-5 border-t border-zinc-200/70 pt-6 dark:border-zinc-800/70">
      <div>
        <label for="post-circle" class="block text-[11px] font-medium text-zinc-400 dark:text-zinc-500">发布到</label>
        <select id="post-circle" v-model="circleGuid" name="circleGuid" aria-label="发布到社区" class="mt-2 h-11 w-full rounded-[5%] border border-white/60 bg-white/70 px-4 text-sm outline-none transition-all focus:ring-2 focus:ring-amber-400/50 dark:border-white/10 dark:bg-zinc-800/70">
          <option value="">主页（不选社区）</option>
          <option v-for="c in myCircles" :key="c.circleGuid" :value="c.circleGuid">{{ c.name }}</option>
        </select>
      </div>
      <div>
        <span class="block text-[11px] font-medium text-zinc-400 dark:text-zinc-500">谁可以看</span>
        <div class="mt-2 flex h-11 gap-1 rounded-[5%] bg-black/5 p-1 dark:bg-white/10" role="group" aria-label="谁可以看">
          <button type="button" class="inline-flex flex-1 items-center justify-center gap-1.5 rounded-[5%] text-xs font-medium transition-colors" :class="visibility === 'Public' ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white' : 'text-zinc-600 hover:bg-white/60 dark:text-zinc-300 dark:hover:bg-zinc-800/60'" :aria-pressed="visibility === 'Public'" @click="visibility = 'Public'"><svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>公开</button>
          <button type="button" class="inline-flex flex-1 items-center justify-center gap-1.5 rounded-[5%] text-xs font-medium transition-colors" :class="visibility === 'Private' ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white' : 'text-zinc-600 hover:bg-white/60 dark:text-zinc-300 dark:hover:bg-zinc-800/60'" :aria-pressed="visibility === 'Private'" @click="visibility = 'Private'"><svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>私密</button>
        </div>
      </div>
    </section>

    <!-- ===== ④ 操作 ===== -->
    <section class="mt-8 flex justify-end gap-3 border-t border-zinc-200/70 pt-6 dark:border-zinc-800/70">
      <button class="h-11 rounded-[5%] border border-zinc-200/80 px-6 text-sm font-medium text-zinc-600 transition-colors hover:bg-black/[0.03] disabled:opacity-50 dark:border-zinc-700/80 dark:text-zinc-300 dark:hover:bg-white/[0.05]" :disabled="savingDraft" @click="saveAsDraft">
        <span v-if="!savingDraft" class="inline-flex items-center gap-1.5"><svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>存草稿</span><span v-else>保存中…</span>
      </button>
      <button class="btn-sheen h-11 rounded-[5%] bg-gradient-to-r from-amber-400 to-orange-500 px-8 text-sm font-medium text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50" :disabled="publishing || !content.trim()" @click="publish">
        {{ publishing ? '发布中…' : '发布' }}
      </button>
    </section>

    <!-- 裁剪弹窗 -->
    <Teleport to="body">
      <div v-if="cropOpen" class="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4" @click.self="closeCrop">
        <div class="qm-surface p-5 w-[min(92vw,720px)]">
          <div class="flex items-center justify-between gap-3 mb-3">
            <h3 class="text-base font-bold text-zinc-800 dark:text-zinc-100">裁剪图片</h3>
            <div class="flex gap-1">
              <button v-for="r in RATIO_KEYS" :key="r" type="button" class="px-2.5 h-8 rounded-[5%] text-xs font-medium transition-all" :class="ratioKey === r ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-white' : 'text-zinc-500 hover:bg-black/[0.04] dark:text-zinc-300 dark:hover:bg-white/[0.06]'" @click="setRatio(r)">{{ r === 'free' ? '自由' : r }}</button>
            </div>
          </div>
          <div class="bg-zinc-900 rounded-[5%] overflow-hidden h-[56vh] flex items-center justify-center">
            <img ref="cropImg" :src="cropSrc" alt="" class="max-w-full max-h-full" />
          </div>
          <div class="flex justify-end gap-2 mt-4">
            <button type="button" class="px-4 h-10 rounded-[5%] text-sm text-zinc-500 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-all" @click="closeCrop">取消</button>
            <button type="button" class="px-4 h-10 rounded-[5%] text-sm font-medium bg-gradient-to-r from-amber-400 to-orange-500 text-white active:scale-95 transition-all" @click="confirmCrop">确认裁剪</button>
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
import { updateTweet, submitTweet } from '@/api/tweet'
import { saveDraft, removeDraft } from '@/utils/drafts'
import { unwrap } from '@/utils/response'
import { useToastStore } from '@/stores/toast'

interface ServerContent {
  id: string
  status: string
  data: Record<string, any>
}

interface Props {
  myCircles?: any[]
  draft?: any
  server?: ServerContent | null
}
const props = withDefaults(defineProps<Props>(), {
  myCircles: () => [],
  draft: null,
  server: null
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
// 服务端已有内容 Guid：存在时「存草稿 / 发布」改调 PUT（+ submit）
const serverId = ref('')
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
        const blob = await new Promise<Blob>(res => canvas.toBlob(res as BlobCallback, 'image/jpeg', 0.9))
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
    const fileId = data.fileId || data.file_id
    if (!fileId) throw new Error('上传未返回 fileId')
    images.value.push({ fileId, preview: data.fileUri || data.file_url || URL.createObjectURL(file) })
  } catch (err) {
    toast.push('图片上传失败，请稍后重试', 'error')
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

// 载入服务端已有内容（编辑草稿/被驳回）
watch(() => props.server, (s) => {
  if (!s) return
  serverId.value = s.id
  content.value = s.data?.content || ''
  visibility.value = s.data?.visibility || 'Public'
  images.value = (s.data?.mediaUrls || []).map((url: string) => ({ fileId: '', preview: url }))
}, { immediate: true })

function firstLine(s?: string): string {
  const t = (s || '').trim()
  return t ? t.split('\n')[0].slice(0, 40) : ''
}

// 从创建接口响应中取出新内容 Guid
function extractId(data: any): string {
  if (!data) return ''
  if (typeof data === 'string') return data
  return String(data.data || data.tweetGuid || '')
}

// fileIds：过滤空串（服务端回填的媒体只有 URL、无 fileId）
function contentFileIds(): string[] {
  return images.value.map(i => i.fileId).filter(Boolean)
}

async function saveAsDraft() {
  if (savingDraft.value) return
  savingDraft.value = true
  // 本地先存一份（断网 / 误关页的离线兼存）
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
  try {
    if (!content.value.trim()) {
      toast.push('草稿已保存到本机', 'success')
      return
    }
    const payload = {
      content: content.value.trim(),
      fileIds: contentFileIds(),
      visibility: visibility.value
    }
    if (serverId.value) {
      await updateTweet(serverId.value, payload)
    } else {
      const res = await createTweet({ ...payload, asDraft: true })
      serverId.value = extractId(unwrap(res))
    }
    removeDraft(draftId.value); draftId.value = ''
    toast.push('草稿已保存', 'success')
  } catch (e: any) {
    toast.push((e?.message || '后端保存失败') + '（已保存到本机）', 'error')
  } finally {
    savingDraft.value = false
  }
}

async function publish() {
  if (publishing.value) return
  publishing.value = true
  try {
    const payload = {
      content: content.value.trim(),
      fileIds: contentFileIds(),
      visibility: visibility.value
    }
    let newId = ''
    if (serverId.value) {
      // 编辑草稿/被驳回 → 更新后提交审核
      await updateTweet(serverId.value, payload)
      await submitTweet(serverId.value)
      newId = serverId.value
      toast.push('已提交审核', 'success')
    } else if (circleGuid.value) {
      // 圈子帖：保持免审核，直接生效
      newId = extractId(unwrap(await createCirclePost({ circleGuid: circleGuid.value, ...payload })))
      toast.push('已发布到社区', 'success')
    } else {
      // 发布 → 进入待审核
      newId = extractId(unwrap(await createTweet({ ...payload, asDraft: false })))
      toast.push('已提交审核', 'success')
    }
    if (draftId.value) { removeDraft(draftId.value); draftId.value = '' }
    if (newId) router.push(`/posts/${newId}`)
  } catch (e: any) {
    toast.push(e?.message || '发布失败，请稍后重试', 'error')
  } finally {
    publishing.value = false
  }
}
</script>
