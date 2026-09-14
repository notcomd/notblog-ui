<template>
  <div class="flex flex-col flex-1">
    <!-- ============ 第 1 步：创建博客文章（封面 + 标题 + 发布渠道） ============ -->
    <div v-if="step === 'meta'" class="grid grid-cols-[280px_1fr] gap-5">
      <!-- 左列：封面卡（3:4 竖版，等高） -->
      <div class="flex flex-col">
        <label class="text-xs text-zinc-400 block mb-1.5">封面（用于列表展示，必填 · 点击上传）</label>
        <div
          class="relative flex-1 aspect-[3/4] rounded-2xl overflow-hidden border-2 border-dashed border-zinc-300 dark:border-zinc-600 bg-zinc-100/60 dark:bg-zinc-900/60 cursor-pointer group transition-colors hover:border-emerald-400 dark:hover:border-emerald-400"
          tabindex="0"
          @click="pickCover"
          @keydown.enter.prevent="pickCover"
          @keydown.space.prevent="pickCover"
        >
          <img v-if="coverUrl" :src="coverUrl" alt="封面" class="w-full h-full object-cover" @error="hideImg" />
          <div v-else class="w-full h-full flex flex-col items-center justify-center gap-2 text-zinc-400">
            <span class="text-3xl"><svg class="w-8 h-8 mx-auto text-zinc-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></span>
            <span class="text-xs">{{ coverUploading ? '上传中…' : '点击上传封面' }}</span>
          </div>
          <div class="absolute inset-0 bg-black/40 text-white text-xs font-medium flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            {{ coverUrl ? '点击更换封面' : '点击上传封面' }}
          </div>
          <button
            v-if="coverUrl"
            type="button"
            class="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/50 text-white text-[10px] flex items-center justify-center hover:bg-black/70 transition-colors"
            title="移除封面"
            aria-label="移除封面"
            @click.stop="clearCover"
          ><svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        </div>
        <input ref="coverInput" type="file" accept="image/*" class="hidden" :disabled="coverUploading" @change="onCoverPick" />
        <p class="text-[10px] text-zinc-400 mt-1.5">图片 ≤10MB，建议 3:4 比例</p>
      </div>

      <!-- 右列：标题 + 发布渠道 + 下一步 -->
      <div class="flex flex-col gap-4">
        <!-- 标题（必填） -->
        <div>
          <label class="text-xs text-zinc-400 block mb-1.5">标题（必填）</label>
          <input
            v-model="title"
            name="title"
            aria-label="输入文章标题"
            type="text"
            maxlength="200"
            placeholder="输入文章标题"
            class="w-full h-11 px-4 rounded-xl bg-white/70 dark:bg-zinc-800/70 border border-white/60 dark:border-white/10 text-sm outline-none focus:ring-2 focus:ring-emerald-400/50 transition-all"
            @keyup.enter="goWrite"
          />
        </div>

        <!-- 发布渠道（后端 Markdown 支持公开 / 私密两类） -->
        <div>
          <label class="text-xs text-zinc-400 block mb-1.5">发布渠道</label>
          <div class="flex flex-wrap gap-3">
            <button
              type="button"
              class="flex-1 min-w-[180px] h-16 px-4 rounded-2xl border transition-all text-left"
              :class="visibility === 'Public' ? 'border-emerald-400 bg-emerald-400/10 ring-1 ring-emerald-400/40' : 'border-zinc-200 dark:border-zinc-700 bg-white/60 dark:bg-zinc-800/60 hover:border-emerald-300'"
              :aria-pressed="visibility === 'Public'"
              @click="visibility = 'Public'"
            >
              <span class="block text-sm font-medium text-zinc-700 dark:text-zinc-200"><svg class="w-3.5 h-3.5 inline-block align-[-2px] mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>发布到主页 · 所有人可见</span>
              <span class="block text-[11px] text-zinc-400 mt-0.5">出现在广场与你自己的主页</span>
            </button>
            <button
              type="button"
              class="flex-1 min-w-[180px] h-16 px-4 rounded-2xl border transition-all text-left"
              :class="visibility === 'Private' ? 'border-emerald-400 bg-emerald-400/10 ring-1 ring-emerald-400/40' : 'border-zinc-200 dark:border-zinc-700 bg-white/60 dark:bg-zinc-800/60 hover:border-emerald-300'"
              :aria-pressed="visibility === 'Private'"
              @click="visibility = 'Private'"
            >
              <span class="block text-sm font-medium text-zinc-700 dark:text-zinc-200"><svg class="w-3.5 h-3.5 inline-block align-[-2px] mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>私密 · 仅自己可见</span>
              <span class="block text-[11px] text-zinc-400 mt-0.5">仅登录后你本人可查看</span>
            </button>
          </div>
        </div>

        <!-- 下一步 -->
        <div class="mt-auto pt-3 flex flex-row justify-end gap-3">
          <button type="button" class="w-52 h-11 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-500 text-white text-sm font-medium hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50" :disabled="!title.trim() || !coverUrl" @click="goWrite">
            <span class="inline-flex items-center justify-center gap-1.5">下一步：写正文 <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7" /></svg></span>
          </button>
        </div>
      </div>
    </div>

    <!-- ============ 第 2 步：书写正文（全屏编辑器；保存/发布/预览开关已并入顶部工具栏） ============ -->
    <!-- 专注模式下功能栏、顶栏、卡片内边距与页面标题区均已让位，故仅留内容区自身外边距（含卡片 1px 边框余量） -->
    <div v-else class="min-h-[420px]" :class="focus.focusMode ? 'h-[calc(100vh-1.75rem)]' : 'h-[calc(100vh-16rem)]'">
      <MarkdownEditor
        ref="mdEditorRef"
        v-model="content"
        :doc-title="title || '未命名文章'"
        :saving="savingDraft"
        :publishing="publishing"
        :can-publish="Boolean(title.trim() && content.trim() && coverUrl)"
        @images-changed="mdImages = $event"
        @save-draft="saveAsDraft"
        @publish="publish"
      >
        <template #toolbar-extra>
          <button
            type="button"
            class="h-8 px-3 rounded-lg text-xs font-medium bg-white/60 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-300 hover:opacity-90 transition-all inline-flex items-center gap-1"
            @click="step = 'meta'"
          >
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
            修改封面 / 标题
          </button>
        </template>
      </MarkdownEditor>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import MarkdownEditor from '@/components/publish/MarkdownEditor.vue'
import { uploadImage } from '@/api/publish'
import { createMarkdownDoc } from '@/api/markdown'
import { saveDraft, removeDraft } from '@/utils/drafts'
import { unwrap } from '@/utils/response'
import { useToastStore } from '@/stores/toast'
import { useFocusStore } from '@/stores/focus'

interface Props {
  myCircles?: unknown[]
  draft?: MarkdownDraft | null
}

interface MarkdownDraft {
  id: string
  title?: string
  content?: string
  images?: unknown[]
  coverUrl?: string
  cover?: string
  visibility?: string
}

interface MarkdownImage {
  fileId: string
  url: string
}
const props = withDefaults(defineProps<Props>(), {
  myCircles: () => [],
  draft: null
})

const router = useRouter()
const toast = useToastStore()

// 两步向导：meta（封面/标题/渠道）→ content（Markdown 正文）
const step = ref<'meta' | 'content'>('meta')

// 专注模式：进入正文步骤自动开启（隐藏左侧功能栏与顶部栏，编辑器独占全屏），
// 退回上一步或离开页面时恢复；编辑器工具栏仍可手动切换
const focus = useFocusStore()
watch(step, (s) => focus.setFocusMode(s === 'content'), { immediate: true })
onBeforeUnmount(() => focus.exit())

const title = ref('')          // 文章标题（必填）
const coverUrl = ref('')       // 可显示 URL（预览用）
const content = ref('')
const mdImages = ref<MarkdownImage[]>([])
const visibility = ref('Public')
const coverInput = ref<HTMLInputElement | null>(null)
const coverUploading = ref(false)
const publishing = ref(false)
const savingDraft = ref(false)
const draftId = ref('')
const mdEditorRef = ref<unknown>(null)

// 进入正文编辑：校验必填项
function goWrite(): void {
  if (!title.value.trim()) { toast.push('请填写文章标题', 'error'); return }
  if (!coverUrl.value) { toast.push('请上传文章封面', 'error'); return }
  step.value = 'content'
}

// 载入草稿：有正文直接进入编辑器，仅元数据则停留在创建步
watch(() => props.draft, (d) => {
  if (!d) return
  draftId.value = d.id
  title.value = d.title || ''
  content.value = d.content || ''
  mdImages.value = Array.isArray(d.images)
    ? d.images.filter((image): image is MarkdownImage => {
        if (!image || typeof image !== 'object') return false
        const value = image as Record<string, unknown>
        return typeof value.fileId === 'string' && typeof value.url === 'string'
      })
    : []
  coverUrl.value = d.coverUrl || d.cover || ''
  visibility.value = d.visibility || 'Public'
  if (content.value.trim()) step.value = 'content'
}, { immediate: true })

async function onCoverPick(e: Event) {
  const file = (e.target as HTMLInputElement).files && (e.target as HTMLInputElement).files[0]
  ;(e.target as HTMLInputElement).value = ''
  if (!file) return
  if (file.size > 10 * 1024 * 1024) { toast.push('图片不能超过 10MB', 'error'); return }
  coverUploading.value = true
  try {
    const res = await uploadImage(file)
    const data = unwrap(res) || {}
    // 优先可用 URL；fileId 不可显示 → 本地预览（仅预览，发布时不提交 blob 地址）
    coverUrl.value = data.fileUri || data.file_url || URL.createObjectURL(file)
    toast.push('封面上传成功', 'success')
  } catch (err) {
    coverUrl.value = ''
    toast.push('封面上传失败，请稍后重试', 'error')
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

function hideImg(e: Event) { (e.target as HTMLElement).style.visibility = 'hidden' }

function saveAsDraft() {
  savingDraft.value = true
  try {
    const saved = saveDraft({
      id: draftId.value || undefined,
      type: 'markdown',
      title: title.value.trim(),
      content: content.value,
      images: mdImages.value.map(image => image.url),
      cover: coverUrl.value,
      circleGuid: ''
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
      title: title.value.trim(),
      content: content.value.trim(),
      coverUrl: cover,
      auth: visibility.value === 'Private' ? 'private' : 'public'
    }
    const res = await createMarkdownDoc(payload)
    const data = unwrap(res)
    const newId = (data && typeof data === 'object' && (data.data || data.markDownGuid)) || data
    toast.push('文章发布成功', 'success')
    if (draftId.value) { removeDraft(draftId.value); draftId.value = '' }
    if (newId) router.push(`/markdown/${newId}`)
  } catch (e) {
    toast.push('发布失败，请稍后重试', 'error')
  } finally {
    publishing.value = false
  }
}
</script>