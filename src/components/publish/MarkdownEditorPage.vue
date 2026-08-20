<template>
  <div class="flex flex-col flex-1">
    <!-- 标题（必填） -->
    <div class="mb-4">
      <label class="text-xs text-zinc-400 block mb-1.5">标题（必填）</label>
      <input
        v-model="title"
        type="text"
        maxlength="200"
        placeholder="输入文章标题"
        class="w-full h-11 px-4 rounded-xl bg-white/70 dark:bg-zinc-800/70 border border-white/60 dark:border-white/10 text-sm outline-none focus:ring-2 focus:ring-emerald-400/50 transition-all"
      />
    </div>

    <!-- 封面（必填 · 点击上传） -->
    <div class="mb-4">
      <label class="text-xs text-zinc-400 block mb-1.5">封面（用于列表展示，必填 · 点击上传）</label>
      <div
        class="relative max-w-[220px] aspect-[3/4] rounded-2xl overflow-hidden border-2 border-dashed border-zinc-300 dark:border-zinc-600 bg-zinc-100/60 dark:bg-zinc-900/60 cursor-pointer group transition-colors hover:border-emerald-400 dark:hover:border-emerald-400"
        @click="pickCover"
      >
        <img v-if="coverUrl" :src="coverUrl" alt="封面" class="w-full h-full object-cover" @error="hideImg" />
        <div v-else class="w-full h-full flex flex-col items-center justify-center gap-2 text-zinc-400">
          <span class="text-3xl"><svg class="w-8 h-8 mx-auto text-zinc-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></span>
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
        ><svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
      </div>
      <input ref="coverInput" type="file" accept="image/*" class="hidden" :disabled="coverUploading" @change="onCoverPick" />
      <p class="text-[10px] text-zinc-400 mt-1.5">图片 ≤10MB，建议 3:4 比例</p>
    </div>

    <MarkdownEditor ref="mdEditorRef" v-model="content" @images-changed="mdImages = $event" />

    <!-- 可见范围：公开 / 私密（映射 MarkDownAuth public/private） -->
    <div class="mt-4">
      <label class="text-xs text-zinc-400 block mb-1.5">谁可以看</label>
      <div class="flex gap-2">
        <button type="button" class="h-9 px-4 rounded-xl text-xs font-medium transition-all" :class="visibility === 'Public' ? 'bg-gradient-to-r from-emerald-400 to-teal-500 text-white' : 'bg-white/60 dark:bg-zinc-800/60 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 dark:text-zinc-300'" @click="visibility = 'Public'"><svg class="w-3.5 h-3.5 inline-block align-[-2px] mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>公开</button>
        <button type="button" class="h-9 px-4 rounded-xl text-xs font-medium transition-all" :class="visibility === 'Private' ? 'bg-gradient-to-r from-emerald-400 to-teal-500 text-white' : 'bg-white/60 dark:bg-zinc-800/60 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 dark:text-zinc-300'" @click="visibility = 'Private'"><svg class="w-3.5 h-3.5 inline-block align-[-2px] mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>私密 · 仅自己可见</button>
      </div>
    </div>

    <div class="mt-5 flex justify-end gap-3">
      <button class="w-44 h-11 rounded-2xl bg-white/60 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-300 text-sm font-medium hover: active:scale-[0.98] transition-all disabled:opacity-50" :disabled="savingDraft" @click="saveAsDraft">
        <span v-if="!savingDraft" class="inline-flex items-center gap-1.5"><svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>存草稿</span><span v-else>保存中...</span>
      </button>
      <button class="w-44 h-11 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-500 text-white text-sm font-medium hover: active:scale-[0.98] transition-all disabled:opacity-50" :disabled="publishing || !title.trim() || !content.trim() || !coverUrl" @click="publish">
        {{ publishing ? '发布中...' : '发布文章' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import MarkdownEditor from '@/components/publish/MarkdownEditor.vue'
import { uploadImage } from '@/api/publish'
import { createMarkdownDoc } from '@/api/markdown'
import { saveDraft, removeDraft } from '@/utils/drafts'
import { unwrap } from '@/utils/response'
import { useToastStore } from '@/stores/toast'

const props = defineProps({
  myCircles: { type: Array, default: () => [] },
  draft: { type: Object, default: null }
})

const router = useRouter()
const toast = useToastStore()

const title = ref('')          // 文章标题（必填）
const coverUrl = ref('')       // 可显示 URL（预览用；上传失败时 objectURL 兜底）
const content = ref('')
const mdImages = ref([])
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
  title.value = d.title || ''
  content.value = d.content || ''
  mdImages.value = d.images || []
  coverUrl.value = d.coverUrl || d.cover || ''
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
    if (!coverUrl.value) coverUrl.value = URL.createObjectURL(file)
    toast.push('封面上传成功', 'success')
  } catch (err) {
    coverUrl.value = URL.createObjectURL(file)  // 上传失败本地预览
    toast.push('上传失败（已本地预览，发布需重新上传）', 'info')
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
}

function hideImg(e) { e.target.style.visibility = 'hidden' }

function saveAsDraft() {
  savingDraft.value = true
  try {
    const saved = saveDraft({
      id: draftId.value || undefined,
      type: 'markdown',
      title: title.value.trim(),
      content: content.value,
      images: mdImages.value,
      cover: coverUrl.value,
      coverUrl: coverUrl.value,
      circleGuid: '',
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
  if (!title.value.trim() || !content.value.trim() || !coverUrl.value) {
    toast.push('请填写标题、内容并上传封面', 'error')
    return
  }
  publishing.value = true
  try {
    // 封面 URL：FileDev fileUri（blob 本地预览地址不提交）
    const cover = coverUrl.value.startsWith('blob:') ? '' : coverUrl.value
    const payload = {
      name: title.value.trim(),
      content: content.value.trim(),
      coverUrl: cover,
      auth: visibility.value === 'Private' ? 'private' : 'public'
    }
    const res = await createMarkdownDoc(payload)
    const data = unwrap(res)
    const newId = (data && typeof data === 'object' && (data.data || data.markDownGuid)) || data
    toast.push('文章发布成功', 'success')
    if (draftId.value) { removeDraft(draftId.value); draftId.value = '' }
    if (newId && String(newId).startsWith('mock')) router.push('/home')
    else router.push(`/markdown/${newId}`)
  } catch (e) {
    toast.push('发布失败，请稍后重试', 'error')
  } finally {
    publishing.value = false
  }
}
</script>
