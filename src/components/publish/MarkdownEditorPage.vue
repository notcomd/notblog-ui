<template>
  <div>
    <!-- 封面（必填） -->
    <div class="mb-4">
      <div class="text-xs text-zinc-400 mb-2 flex items-center gap-1.5">
        <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> 封面（用于列表展示，必填）
      </div>
      <div class="flex items-center gap-3">
        <div class="w-24 h-32 rounded-2xl overflow-hidden border border-white/60 dark:border-white/10 bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center relative group">
          <img v-if="coverUrl" :src="coverUrl" alt="" class="w-full h-full object-cover" @error="hideImg" />
          <button v-if="coverUrl" class="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/50 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" @click="coverUrl = ''; coverFileId = ''">✕</button>
          <span v-if="!coverUrl" class="text-2xl">🖼️</span>
        </div>
        <div class="flex flex-col gap-2">
          <label class="px-3.5 h-9 rounded-xl text-xs font-medium bg-emerald-400/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-400/25 transition-colors cursor-pointer flex items-center gap-1.5">
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" /></svg>
            {{ coverUploading ? '上传中...' : '上传封面' }}
            <input type="file" accept="image/*" class="hidden" :disabled="coverUploading" @change="onCoverPick" />
          </label>
          <p class="text-[10px] text-zinc-400 w-40">图片 ≤10MB，建议 3:4 比例</p>
        </div>
      </div>
    </div>

    <MarkdownEditor ref="mdEditorRef" v-model="content" @images-changed="mdImages = $event" />

    <!-- 发布到频道（可选） -->
    <div class="mt-4">
      <select v-model="circleGuid" class="w-full h-11 px-4 rounded-2xl bg-white/70 dark:bg-zinc-800/70 border border-white/60 dark:border-white/10 text-sm outline-none focus:ring-2 focus:ring-emerald-400/50 transition-all">
        <option value="">发布到主页（不选频道）</option>
        <option v-for="c in myCircles" :key="c.circleGuid" :value="c.circleGuid">🏕️ {{ c.name }}</option>
      </select>
    </div>

    <div class="mt-5 flex gap-3">
      <button class="flex-1 h-11 rounded-2xl bg-white/60 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-300 text-sm font-medium hover: active:scale-[0.98] transition-all disabled:opacity-50" :disabled="savingDraft" @click="saveAsDraft">
        {{ savingDraft ? '保存中...' : '💾 存草稿' }}
      </button>
      <button class="flex-1 h-11 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-500 text-white text-sm font-medium hover: active:scale-[0.98] transition-all disabled:opacity-50" :disabled="publishing || !content.trim() || !coverUrl" @click="publish">
        {{ publishing ? '发布中...' : '发布文章' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import MarkdownEditor from '@/components/publish/MarkdownEditor.vue'
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

const coverUrl = ref('')       // 可显示 URL（预览用；mock 模式用 objectURL 保证可见）
const coverFileId = ref('')    // 发布用（后端 fileId）
const content = ref('')
const mdImages = ref([])
const circleGuid = ref('')
const coverUploading = ref(false)
const publishing = ref(false)
const savingDraft = ref(false)
const draftId = ref('')

// 载入草稿
watch(() => props.draft, (d) => {
  if (!d) return
  draftId.value = d.id
  content.value = d.content || ''
  mdImages.value = d.images || []
  coverUrl.value = d.coverUrl || d.cover || ''
  coverFileId.value = d.coverFileId || ''
  if (d.circleGuid) circleGuid.value = d.circleGuid
}, { immediate: true })

async function onCoverPick(e) {
  const file = e.target.files && e.target.files[0]
  e.target.value = ''
  if (!file) return
  if (file.size > 10 * 1024 * 1024) { toast.push('图片不能超过 10MB', 'error'); return }
  coverUploading.value = true
  try {
    const res = await uploadImage(file)
    const data = unwrap(res) || {}
    // 优先可用 URL；fileId 不可显示 → objectURL 兜底保证预览
    coverUrl.value = data.fileUri || data.file_url || URL.createObjectURL(file)
    coverFileId.value = data.fileId || data.file_id || ''
    if (!coverUrl.value) coverUrl.value = URL.createObjectURL(file)
    toast.push('封面上传成功', 'success')
  } catch (err) {
    coverUrl.value = URL.createObjectURL(file)  // mock 模式本地预览
    coverFileId.value = ''
    toast.push('上传失败（mock 模式已本地预览）', 'info')
  } finally {
    coverUploading.value = false
  }
}

function hideImg(e) { e.target.style.visibility = 'hidden' }

function firstLine(s) {
  const t = (s || '').trim()
  return t ? t.replace(/^#+\s*/, '').split('\n')[0].slice(0, 40) : ''
}

function saveAsDraft() {
  savingDraft.value = true
  try {
    const saved = saveDraft({
      id: draftId.value || undefined,
      type: 'markdown',
      title: firstLine(content.value),
      content: content.value,
      images: mdImages.value,
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
    // 正文图片 fileId + 封面 fileId 合并去重
    const fileIds = [...new Set([...mdImages.value.map(i => i.fileId), ...(coverFileId.value ? [coverFileId.value] : [])])]
    const payload = { content: content.value.trim(), fileIds }
    const res = circleGuid.value
      ? await createCirclePost({ circleGuid: circleGuid.value, ...payload })
      : await createTweet(payload)
    const data = unwrap(res)
    const newId = (data && typeof data === 'object' && (data.data || data.tweetGuid)) || data
    toast.push(circleGuid.value ? '已发布到频道' : '文章发布成功', 'success')
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
