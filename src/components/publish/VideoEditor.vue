<template>
  <div>
    <!-- 视频源 -->
    <div class="mb-4">
      <label class="text-xs text-zinc-400 block mb-1.5">视频地址 / 文件</label>
      <div class="flex gap-2">
        <input v-model="videoUrl" class="flex-1 h-11 px-4 rounded-2xl bg-white/70 dark:bg-zinc-800/70 border border-white/60 dark:border-white/10 text-sm outline-none focus:ring-2 focus:ring-blue-400/50 transition-all min-w-0" placeholder="粘贴视频 URL（mp4/webm）" />
        <label class="shrink-0 inline-flex items-center gap-1.5 px-4 h-11 rounded-2xl text-xs font-medium bg-blue-400/15 text-blue-600 dark:text-blue-400 hover:bg-blue-400/25 transition-colors cursor-pointer">
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" /></svg>
          {{ videoUploading ? '上传中...' : '上传文件' }}
          <input type="file" accept="video/*" class="hidden" :disabled="videoUploading" @change="onVideoFile" />
        </label>
      </div>
      <p class="text-[10px] text-zinc-400 mt-1.5">本地文件载入后自动生成预览地址；上传接口见后端 /api/files/upload（分片）</p>
    </div>

    <!-- 封面 -->
    <div class="mb-4">
      <label class="text-xs text-zinc-400 block mb-1.5">封面图（必填）</label>
      <div class="flex items-center gap-3">
        <div class="w-32 h-20 rounded-2xl overflow-hidden border border-white/60 dark:border-white/10 bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center relative group">
          <img v-if="coverUrl" :src="coverUrl" alt="" class="w-full h-full object-cover" @error="hideImg" />
          <button v-if="coverUrl" class="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/50 text-white text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" @click="coverUrl = ''; coverFileId = ''">✕</button>
          <span v-if="!coverUrl" class="text-xl">🎬</span>
        </div>
        <label class="px-3.5 h-9 rounded-xl text-xs font-medium bg-blue-400/15 text-blue-600 dark:text-blue-400 hover:bg-blue-400/25 transition-colors cursor-pointer">
          {{ coverUploading ? '上传中...' : '上传封面' }}
          <input type="file" accept="image/*" class="hidden" :disabled="coverUploading" @change="onCoverPick" />
        </label>
      </div>
    </div>

    <textarea
      v-model="content"
      rows="4"
      class="w-full resize-none rounded-2xl bg-white/70 dark:bg-zinc-800/70 border border-white/60 dark:border-white/10 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-400/50 transition-all"
      placeholder="视频标题与描述...（支持 @提及）"
    ></textarea>

    <!-- 发布到频道（可选） -->
    <div class="mt-4">
      <select v-model="circleGuid" class="w-full h-11 px-4 rounded-2xl bg-white/70 dark:bg-zinc-800/70 border border-white/60 dark:border-white/10 text-sm outline-none focus:ring-2 focus:ring-blue-400/50 transition-all">
        <option value="">发布到主页（不选频道）</option>
        <option v-for="c in myCircles" :key="c.circleGuid" :value="c.circleGuid">🏕️ {{ c.name }}</option>
      </select>
    </div>

    <div class="mt-5 flex gap-3">
      <button class="flex-1 h-11 rounded-2xl bg-white/60 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-300 text-sm font-medium hover: active:scale-[0.98] transition-all disabled:opacity-50" :disabled="savingDraft" @click="saveAsDraft">
        {{ savingDraft ? '保存中...' : '💾 存草稿' }}
      </button>
      <button class="flex-1 h-11 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-sm font-medium hover: active:scale-[0.98] transition-all disabled:opacity-50" :disabled="publishing || !content.trim() || !coverUrl" @click="publish">
        {{ publishing ? '发布中...' : '发布视频' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { createTweet, createCirclePost, uploadImage } from '@/api/publish'
import { saveDraft, removeDraft } from '@/utils/drafts'
import { unwrap } from '@/utils/response'
import { useToastStore } from '@/stores/toast'

const props = defineProps({
  myCircles: { type: Array, default: () => [] },
  draft: { type: Object, default: null }
})

const router = useRouter()
const toast = useToastStore()

const videoUrl = ref('')
const coverUrl = ref('')     // 可显示 URL（预览用）
const coverFileId = ref('')  // 发布用（fileId）
const content = ref('')
const circleGuid = ref('')
const videoUploading = ref(false)
const coverUploading = ref(false)
const publishing = ref(false)
const savingDraft = ref(false)
const draftId = ref('')

watch(() => props.draft, (d) => {
  if (!d) return
  draftId.value = d.id
  videoUrl.value = d.videoUrl || ''
  coverUrl.value = d.coverUrl || d.cover || ''
  coverFileId.value = d.coverFileId || ''
  content.value = d.content || ''
  if (d.circleGuid) circleGuid.value = d.circleGuid
}, { immediate: true })

function onVideoFile(e) {
  const file = e.target.files && e.target.files[0]
  e.target.value = ''
  if (!file) return
  if (file.size > 500 * 1024 * 1024) { toast.push('视频不能超过 500MB', 'error'); return }
  videoUrl.value = URL.createObjectURL(file)
  videoUploading.value = false
  toast.push('视频已载入（上传接口见后端 /api/files/upload）', 'info')
}

async function onCoverPick(e) {
  const file = e.target.files && e.target.files[0]
  e.target.value = ''
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

function hideImg(e) { e.target.style.visibility = 'hidden' }

function firstLine(s) {
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
      cover: coverUrl.value,
      coverUrl: coverUrl.value,
      coverFileId: coverFileId.value,
      circleGuid: circleGuid.value
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
    const payload = { content: content.value.trim(), fileIds: coverFileId.value ? [coverFileId.value] : [] }
    const res = circleGuid.value
      ? await createCirclePost({ circleGuid: circleGuid.value, ...payload })
      : await createTweet(payload)
    const data = unwrap(res)
    const newId = (data && typeof data === 'object' && (data.data || data.tweetGuid)) || data
    toast.push(circleGuid.value ? '已发布到频道' : '视频发布成功', 'success')
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
