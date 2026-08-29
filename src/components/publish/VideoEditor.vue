<template>
  <div class="flex flex-col flex-1">
    <!-- 封面（最上方，点击封面框直接上传/更换） -->
    <div class="mb-4">
      <label class="text-xs text-zinc-400 block mb-1.5">封面图（必填 · 点击上传）</label>
      <div
        class="relative max-w-[360px] aspect-video rounded-2xl overflow-hidden border-2 border-dashed border-zinc-300 dark:border-zinc-600 bg-zinc-100/60 dark:bg-zinc-900/60 cursor-pointer group transition-colors hover:border-blue-400 dark:hover:border-blue-400"
        @click="pickCover"
      >
        <img v-if="coverUrl" :src="coverUrl" alt="封面" class="w-full h-full object-cover" @error="hideImg" />
        <div v-else class="w-full h-full flex flex-col items-center justify-center gap-2 text-zinc-400">
          <span class="text-3xl"><svg class="w-8 h-8 mx-auto text-zinc-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/></svg></span>
          <span class="text-xs">{{ coverUploading ? '上传中...' : '点击上传封面' }}</span>
        </div>
        <div class="absolute inset-0 bg-black/40 text-white text-xs font-medium flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          {{ coverUrl ? '点击更换封面' : '点击上传封面' }}
        </div>
        <button
          v-if="coverUrl"
          class="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 text-white text-[10px] flex items-center justify-center hover:bg-black/70 transition-colors"
          title="移除封面"
          @click.stop="clearCover"
        ><svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
      </div>
      <input ref="coverInput" type="file" accept="image/*" class="hidden" :disabled="coverUploading" @change="onCoverPick" />
    </div>

    <!-- 视频文件 / 地址（点击上传，上传后下方显示视频 URL） -->
    <div class="mb-4 flex flex-col">
      <label class="text-xs text-zinc-400 block mb-1.5">视频文件 / 地址</label>
      <div
        class="rounded-2xl border-2 border-dashed border-zinc-300 dark:border-zinc-600 bg-zinc-100/60 dark:bg-zinc-900/60 cursor-pointer group transition-colors hover:border-blue-400 dark:hover:border-blue-400 flex-1 min-h-[10rem] flex flex-col items-center justify-center gap-2 text-zinc-400"
        @click="pickVideo"
      >
        <svg class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" /></svg>
        <span class="text-xs">{{ videoUploading ? '上传中...' : '点击上传视频文件（mp4/webm，≤500MB）' }}</span>
      </div>
      <input ref="videoInput" type="file" accept="video/*" class="hidden" :disabled="videoUploading" @change="onVideoFile" />
      <!-- 上传后显示视频 URL（也可直接粘贴地址） -->
      <div v-if="videoUrl" class="mt-2 flex items-center gap-2">
        <input
          v-model="videoUrl"
          class="flex-1 h-10 px-3.5 rounded-xl bg-white/70 dark:bg-zinc-800/70 border border-white/60 dark:border-white/10 text-xs text-zinc-600 dark:text-zinc-300 outline-none focus:ring-2 focus:ring-blue-400/50 transition-all min-w-0"
          placeholder="视频 URL（mp4/webm）"
        />
        <button class="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-zinc-400 hover:bg-red-500/10 hover:text-red-500 transition-colors" title="清除视频" @click="clearVideo">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /></svg>
        </button>
      </div>
      <p class="text-[10px] text-zinc-400 mt-1.5">点击上方区域选择本地文件，或粘贴视频地址到下方输入框</p>
    </div>

    <!-- 视频描述（高度减半） -->
    <textarea
      v-model="content"
      rows="3"
      class="w-full resize-none rounded-2xl bg-white/70 dark:bg-zinc-800/70 border border-white/60 dark:border-white/10 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-400/50 transition-all"
      placeholder="视频标题与描述...（支持 @提及）"
    ></textarea>

    <!-- 发布到社区（可选） -->
    <div class="mt-4">
      <select v-model="circleGuid" class="w-full h-11 px-4 rounded-2xl bg-white/70 dark:bg-zinc-800/70 border border-white/60 dark:border-white/10 text-sm outline-none focus:ring-2 focus:ring-blue-400/50 transition-all">
        <option value="">发布到主页（不选社区）</option>
        <option v-for="c in myCircles" :key="c.circleGuid" :value="c.circleGuid">{{ c.name }}</option>
      </select>
    </div>

    <!-- 可见范围：公开 / 私密 -->
    <div class="mt-4">
      <label class="text-xs text-zinc-400 block mb-1.5">谁可以看</label>
      <div class="flex flex-wrap gap-2">
        <button type="button" class="h-9 px-4 rounded-xl text-xs font-medium transition-all" :class="visibility === 'Public' ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white' : 'bg-white/60 dark:bg-zinc-800/60 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 dark:text-zinc-300'" @click="visibility = 'Public'"><svg class="w-3.5 h-3.5 inline-block align-[-2px] mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>公开</button>
        <button type="button" class="h-9 px-4 rounded-xl text-xs font-medium transition-all" :class="visibility === 'Private' ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white' : 'bg-white/60 dark:bg-zinc-800/60 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 dark:text-zinc-300'" @click="visibility = 'Private'"><svg class="w-3.5 h-3.5 inline-block align-[-2px] mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>私密 · 仅自己可见</button>
      </div>
    </div>

    <!-- 底部按钮：右对齐，固定宽度 -->
    <div class="mt-5 flex flex-col sm:flex-row justify-end gap-3">
      <button class="w-full sm:w-44 h-11 rounded-2xl bg-white/60 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-300 text-sm font-medium hover: active:scale-[0.98] transition-all disabled:opacity-50" :disabled="savingDraft" @click="saveAsDraft">
        <span v-if="!savingDraft" class="inline-flex items-center gap-1.5"><svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>存草稿</span><span v-else>保存中...</span>
      </button>
      <button class="w-full sm:w-44 h-11 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-sm font-medium hover: active:scale-[0.98] transition-all disabled:opacity-50" :disabled="publishing || !content.trim() || !coverUrl" @click="publish">
        {{ publishing ? '发布中...' : '发布视频' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { createTweet, createCirclePost, uploadImage } from '@/api/publish'
import { uploadVideo } from '@/api/publish'
import { saveDraft, removeDraft } from '@/utils/drafts'
import { unwrap } from '@/utils/response'
import { useToastStore } from '@/stores/toast'

interface Props {
  myCircles?: Array<{ circleGuid: string; name: string }>
  draft?: unknown
}
const props = withDefaults(defineProps<Props>(), {
  myCircles: () => [],
  draft: null
})

interface DraftShape {
  id?: string
  videoFileId?: string
  videoUrl?: string
  cover?: string
  coverUrl?: string
  coverFileId?: string
  content?: string
  circleGuid?: string
  visibility?: string
}

const router = useRouter()
const toast = useToastStore()

const videoUrl = ref('')
const coverUrl = ref('')     // 可显示 URL（预览用）
const coverFileId = ref('')  // 发布用（fileId）
const content = ref('')
const circleGuid = ref('')
const visibility = ref('Public')
const videoUploading = ref(false)
const coverUploading = ref(false)
const publishing = ref(false)
const savingDraft = ref(false)
const draftId = ref('')
const videoFileId = ref('')  // 发布用视频文件 fileId
const videoInput = ref<HTMLInputElement | null>(null)
const coverInput = ref<HTMLInputElement | null>(null)

watch(() => props.draft, (d) => {
  if (!d) return
  const draft = d as DraftShape
  draftId.value = draft.id
  videoFileId.value = draft.videoFileId || ''
  videoUrl.value = draft.videoUrl || ''
  coverUrl.value = draft.coverUrl || draft.cover || ''
  coverFileId.value = draft.coverFileId || ''
  content.value = draft.content || ''
  if (draft.circleGuid) circleGuid.value = draft.circleGuid
  visibility.value = draft.visibility || 'Public'
}, { immediate: true })

// 点击区域触发文件选择
function pickVideo() {
  if (!videoUploading.value && videoInput.value) videoInput.value.click()
}
function pickCover() {
  if (!coverUploading.value && coverInput.value) coverInput.value.click()
}
function clearCover() {
  coverUrl.value = ''
  coverFileId.value = ''
}

// 清除视频时同时清除已上传的 fileId
function clearVideo() {
  videoUrl.value = ''
  videoFileId.value = ''
}


// 真实上传视频文件到后端（≤10MB 直传 /api/files/upload、>10MB 分片），保存 fileId 用于发布
async function onVideoFile(e: Event) {
  const el = e.target as HTMLInputElement
  const file = el.files && el.files[0]
  el.value = ''
  if (!file) return
  if (file.size > 500 * 1024 * 1024) { toast.push('视频不能超过 500MB', 'error'); return }
  videoUploading.value = true
  try {
    const data = await uploadVideo(file, (p) => {
      // 可扩展：显示上传进度
      console.log('视频上传进度:', p)
    })
    const fileId = (data && (data.fileId || data.file_id)) || ''
    const fileUri = (data && (data.fileUri || data.file_url || data.url)) || ''
    if (!fileId) throw new Error('上传未返回 fileId')
    videoFileId.value = fileId
    videoUrl.value = fileUri || URL.createObjectURL(file)
    toast.push('视频上传成功', 'success')
  } catch (err) {
    videoFileId.value = ''
    videoUrl.value = URL.createObjectURL(file)
    toast.push('视频上传失败，当前仅本地预览，发布将失败', 'error')
  } finally {
    videoUploading.value = false
  }
}

async function onCoverPick(e: Event) {
  const el = e.target as HTMLInputElement
  const file = el.files && el.files[0]
  el.value = ''
  if (!file) return
  if (file.size > 10 * 1024 * 1024) { toast.push('图片不能超过 10MB', 'error'); return }
  coverUploading.value = true
  try {
    const res = await uploadImage(file)
    const data = unwrap(res) || {}
    coverUrl.value = data.fileUri || data.file_url || URL.createObjectURL(file)
    coverFileId.value = data.fileId || data.file_id || ''
    if (!coverUrl.value) coverUrl.value = URL.createObjectURL(file)
    toast.push('封面上传成功', 'success')
  } catch (err) {
    coverUrl.value = URL.createObjectURL(file)
    coverFileId.value = ''
    toast.push('上传失败（mock 模式已本地预览）', 'info')
  } finally {
    coverUploading.value = false
  }
}

function hideImg(e: Event) { (e.target as HTMLElement).style.visibility = 'hidden' }

function firstLine(s?: string): string {
  const t = (s || '').trim()
  return t ? t.split('\n')[0].slice(0, 40) : ''
}

function saveAsDraft() {
  savingDraft.value = true
  try {
    const saved = saveDraft({
      id: draftId.value || undefined,
      type: 'video',
      title: firstLine(content.value),
      content: content.value,
      videoUrl: videoUrl.value,
      videoFileId: videoFileId.value,
      cover: coverUrl.value,
      coverUrl: coverUrl.value,
      coverFileId: coverFileId.value,
      circleGuid: circleGuid.value,
      visibility: visibility.value
    } as unknown as Parameters<typeof saveDraft>[0])
    draftId.value = saved.id
    toast.push('草稿已保存', 'success')
  } finally {
    savingDraft.value = false
  }
}

// 发布视频：必须包含视频文件 fileId，封面 fileId 作为封面资源一并提交
async function publish() {
  if (publishing.value) return
  if (!videoFileId.value) {
    toast.push('请先上传视频文件', 'error')
    return
  }
  publishing.value = true
  try {
    const fileIds = [videoFileId.value]
    if (coverFileId.value) fileIds.push(coverFileId.value)
    const payload = { content: content.value.trim(), fileIds, visibility: visibility.value }
    const res = circleGuid.value
      ? await createCirclePost({ circleGuid: circleGuid.value, ...payload })
      : await createTweet(payload)
    const data = unwrap(res)
    const newId = (data && typeof data === 'object' && (data.data || data.tweetGuid)) || data
    toast.push(circleGuid.value ? '已发布到社区' : '视频发布成功', 'success')
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
