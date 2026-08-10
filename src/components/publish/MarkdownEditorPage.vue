<template>
  <div class="flex flex-col flex-1">
    <!-- 封面（必填 · 点击上传） -->
    <div class="mb-4">
      <label class="text-xs text-zinc-400 block mb-1.5">封面（用于列表展示，必填 · 点击上传）</label>
      <div
        class="relative max-w-[220px] aspect-[3/4] rounded-2xl overflow-hidden border-2 border-dashed border-zinc-300 dark:border-zinc-600 bg-zinc-100/60 dark:bg-zinc-900/60 cursor-pointer group transition-colors hover:border-emerald-400 dark:hover:border-emerald-400"
        @click="pickCover"
      >
        <img v-if="coverUrl" :src="coverUrl" alt="封面" class="w-full h-full object-cover" @error="hideImg" />
        <div v-else class="w-full h-full flex flex-col items-center justify-center gap-2 text-zinc-400">
          <span class="text-3xl">🖼️</span>
          <span class="text-xs">{{ coverUploading ? '上传中...' : '点击上传封面' }}</span>
        </div>
        <div class="absolute inset-0 bg-black/40 text-white text-xs font-medium flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          {{ coverUrl ? '点击更换封面' : '点击上传封面' }}
        </div>
        <button
          v-if="coverUrl"
          class="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/50 text-white text-[10px] flex items-center justify-center hover:bg-black/70 transition-colors"
          title="移除封面"
          @click.stop="clearCover"
        >✕</button>
      </div>
      <input ref="coverInput" type="file" accept="image/*" class="hidden" :disabled="coverUploading" @change="onCoverPick" />
      <p class="text-[10px] text-zinc-400 mt-1.5">图片 ≤10MB，建议 3:4 比例</p>
    </div>

    <MarkdownEditor ref="mdEditorRef" v-model="content" @images-changed="mdImages = $event" />

    <!-- 发布到频道（可选） -->
    <div class="mt-4">
      <select v-model="circleGuid" class="w-full h-11 px-4 rounded-2xl bg-white/70 dark:bg-zinc-800/70 border border-white/60 dark:border-white/10 text-sm outline-none focus:ring-2 focus:ring-emerald-400/50 transition-all">
        <option value="">发布到主页（不选频道）</option>
        <option v-for="c in myCircles" :key="c.circleGuid" :value="c.circleGuid">🏕️ {{ c.name }}</option>
      </select>
    </div>

    <!-- 可见范围：公开 / 私密 -->
    <div class="mt-4">
      <label class="text-xs text-zinc-400 block mb-1.5">谁可以看</label>
      <div class="flex gap-2">
        <button type="button" class="h-9 px-4 rounded-xl text-xs font-medium transition-all" :class="visibility === 'Public' ? 'bg-gradient-to-r from-emerald-400 to-teal-500 text-white' : 'bg-white/60 dark:bg-zinc-800/60 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 dark:text-zinc-300'" @click="visibility = 'Public'">🌍 公开</button>
        <button type="button" class="h-9 px-4 rounded-xl text-xs font-medium transition-all" :class="visibility === 'Private' ? 'bg-gradient-to-r from-emerald-400 to-teal-500 text-white' : 'bg-white/60 dark:bg-zinc-800/60 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 dark:text-zinc-300'" @click="visibility = 'Private'">🔒 私密 · 仅自己可见</button>
      </div>
    </div>

    <div class="mt-5 flex justify-end gap-3">
      <button class="w-44 h-11 rounded-2xl bg-white/60 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-300 text-sm font-medium hover: active:scale-[0.98] transition-all disabled:opacity-50" :disabled="savingDraft" @click="saveAsDraft">
        {{ savingDraft ? '保存中...' : '💾 存草稿' }}
      </button>
      <button class="w-44 h-11 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-500 text-white text-sm font-medium hover: active:scale-[0.98] transition-all disabled:opacity-50" :disabled="publishing || !content.trim() || !coverUrl" @click="publish">
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
const visibility = ref('Public')
const coverInput = ref(null)
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
  visibility.value = d.visibility || 'Public'
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

// 点击封面框触发文件选择
function pickCover() {
  if (!coverUploading.value && coverInput.value) coverInput.value.click()
}
function clearCover() {
  coverUrl.value = ''
  coverFileId.value = ''
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
    // 正文图片 fileId + 封面 fileId 合并去重
    const fileIds = [...new Set([...mdImages.value.map(i => i.fileId), ...(coverFileId.value ? [coverFileId.value] : [])])]
    const payload = { content: content.value.trim(), fileIds, visibility: visibility.value }
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
