<template>
  <div>
    <textarea
      v-model="content"
      rows="6"
      class="w-full resize-none rounded-2xl bg-white/70 dark:bg-zinc-800/70 border border-white/60 dark:border-white/10 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-amber-400/50 transition-all"
      placeholder="分享你的想法、故事或见闻...（支持 @提及）"
    ></textarea>

    <!-- 图片上传 -->
    <div class="mt-4">
      <div class="flex flex-wrap gap-3">
        <div v-for="(img, i) in images" :key="i" class="relative w-28 h-36 rounded-2xl overflow-hidden border border-white/60 dark:border-white/10 group">
          <img :src="img.preview" alt="" class="w-full h-full object-cover" />
          <button class="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/50 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" @click="removeImage(i)">✕</button>
        </div>
        <label v-if="images.length < 9" class="w-28 h-36 rounded-2xl border-2 border-dashed border-zinc-300 dark:border-zinc-600 flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:border-amber-400 hover:text-amber-500 transition-colors text-zinc-400">
          <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="4" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>
          <span class="text-[11px]">{{ uploading ? '上传中...' : '添加图片' }}</span>
          <input type="file" accept="image/*" class="hidden" :disabled="uploading" @change="onPickImage" />
        </label>
      </div>
      <p class="text-[11px] text-zinc-400 mt-2">图片 ≤10MB（后端：POST /api/files/upload-image → FileDev 存储）</p>
    </div>

    <!-- 发布到频道（可选） -->
    <div class="mt-4">
      <select v-model="circleGuid" class="w-full h-11 px-4 rounded-2xl bg-white/70 dark:bg-zinc-800/70 border border-white/60 dark:border-white/10 text-sm outline-none focus:ring-2 focus:ring-amber-400/50 transition-all">
        <option value="">发布到主页（不选频道）</option>
        <option v-for="c in myCircles" :key="c.circleGuid" :value="c.circleGuid">🏕️ {{ c.name }}</option>
      </select>
    </div>

    <div class="mt-5 flex gap-3">
      <button class="flex-1 h-11 rounded-2xl bg-white/60 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-300 text-sm font-medium hover: active:scale-[0.98] transition-all disabled:opacity-50" :disabled="savingDraft" @click="saveAsDraft">
        {{ savingDraft ? '保存中...' : '💾 存草稿' }}
      </button>
      <button class="flex-1 h-11 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 text-white text-sm font-medium hover: active:scale-[0.98] transition-all disabled:opacity-50" :disabled="publishing || !content.trim()" @click="publish">
        {{ publishing ? '发布中...' : '发布' }}
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

const content = ref('')
const images = ref([])
const circleGuid = ref('')
const uploading = ref(false)
const publishing = ref(false)
const savingDraft = ref(false)
const draftId = ref('')

// 载入草稿
watch(() => props.draft, (d) => {
  if (!d) return
  draftId.value = d.id
  content.value = d.content || ''
  images.value = (d.images || []).map(i => ({ fileId: i.fileId, preview: i.url || i.fileId }))
  if (d.circleGuid) circleGuid.value = d.circleGuid
}, { immediate: true })

async function onPickImage(e) {
  const file = e.target.files && e.target.files[0]
  e.target.value = ''
  if (!file) return
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

function firstLine(s) {
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
    const payload = { content: content.value.trim(), fileIds: images.value.map(i => i.fileId) }
    const res = circleGuid.value
      ? await createCirclePost({ circleGuid: circleGuid.value, ...payload })
      : await createTweet(payload)
    const data = unwrap(res)
    const newId = (data && typeof data === 'object' && (data.data || data.tweetGuid)) || data
    toast.push(circleGuid.value ? '已发布到频道' : '发布成功', 'success')
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
