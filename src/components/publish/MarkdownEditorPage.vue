<template>
  <div class="flex flex-col flex-1">
    <!-- ============ 第 1 步：文章信息（写作优先纵向流：标题 → 封面 → 渠道 → 下一步） ============ -->
    <div v-if="step === 'meta'" class="flex flex-col">
      <!-- ① 标题（无框大标题，像写稿一样直接落字） -->
      <section>
        <label for="md-title" class="block text-[11px] font-medium text-zinc-400 dark:text-zinc-500">标题</label>
        <input
          id="md-title"
          v-model="title"
          name="title"
          aria-label="输入文章标题"
          type="text"
          maxlength="200"
          placeholder="输入文章标题"
          class="mt-2 w-full rounded-[5%] border-0 bg-transparent py-1 text-xl font-medium text-zinc-800 outline-none transition-colors placeholder:text-zinc-400 focus:bg-black/[0.02] dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:bg-white/[0.03]"
          @keyup.enter="goWrite"
        />
      </section>

      <!-- ② 封面 -->
      <section class="mt-8 border-t border-zinc-200/70 pt-6 dark:border-zinc-800/70">
        <span class="block text-[11px] font-medium text-zinc-400 dark:text-zinc-500">
          封面
          <span class="ml-1.5 font-normal">用于列表展示 · 建议 3:4</span>
        </span>
        <div class="mt-3 w-[200px]">
          <div
            class="group relative aspect-[3/4] cursor-pointer overflow-hidden rounded-[5%] border border-dashed border-zinc-300 bg-black/[0.015] text-zinc-400 transition-colors hover:border-amber-400 dark:border-zinc-700 dark:bg-white/[0.02] dark:hover:border-amber-400"
            tabindex="0"
            @click="pickCover"
            @keydown.enter.prevent="pickCover"
            @keydown.space.prevent="pickCover"
          >
            <img v-if="coverUrl" :src="coverUrl" alt="封面" class="h-full w-full object-cover" @error="hideImg" />
            <div v-else class="flex h-full w-full flex-col items-center justify-center gap-2">
              <svg class="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>
              <span class="text-xs">{{ coverUploading ? '上传中…' : '点击上传封面' }}</span>
            </div>
            <div class="absolute inset-0 flex items-center justify-center bg-black/40 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
              {{ coverUrl ? '点击更换封面' : '点击上传封面' }}
            </div>
            <button
              v-if="coverUrl"
              type="button"
              class="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
              title="移除封面"
              aria-label="移除封面"
              @click.stop="clearCover"
            ><svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
          </div>
        </div>
        <input ref="coverInput" type="file" accept="image/*" class="hidden" :disabled="coverUploading" @change="onCoverPick" />
        <p class="mt-2 text-[11px] text-zinc-400">图片 ≤10MB</p>
      </section>

      <!-- ③ 发布渠道 -->
      <section class="mt-8 border-t border-zinc-200/70 pt-6 dark:border-zinc-800/70">
        <span class="block text-[11px] font-medium text-zinc-400 dark:text-zinc-500">发布渠道</span>
        <div class="mt-2 flex h-11 max-w-[420px] gap-1 rounded-[5%] bg-black/5 p-1 dark:bg-white/10" role="group" aria-label="发布渠道">
          <button type="button" class="inline-flex flex-1 items-center justify-center gap-1.5 rounded-[5%] text-xs font-medium transition-colors" :class="visibility === 'Public' ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white' : 'text-zinc-600 hover:bg-white/60 dark:text-zinc-300 dark:hover:bg-zinc-800/60'" :aria-pressed="visibility === 'Public'" @click="visibility = 'Public'"><svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>公开</button>
          <button type="button" class="inline-flex flex-1 items-center justify-center gap-1.5 rounded-[5%] text-xs font-medium transition-colors" :class="visibility === 'Private' ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white' : 'text-zinc-600 hover:bg-white/60 dark:text-zinc-300 dark:hover:bg-zinc-800/60'" :aria-pressed="visibility === 'Private'" @click="visibility = 'Private'"><svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>私密</button>
        </div>
        <p class="mt-2 text-[11px] text-zinc-400">{{ visibility === 'Public' ? '出现在广场与你自己的主页' : '仅登录后你本人可查看' }}</p>
      </section>

      <!-- ④ 下一步 -->
      <section class="mt-8 flex justify-end border-t border-zinc-200/70 pt-6 dark:border-zinc-800/70">
        <button type="button" class="btn-sheen inline-flex h-11 items-center justify-center gap-1.5 rounded-[5%] bg-gradient-to-r from-amber-400 to-orange-500 px-8 text-sm font-medium text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50" :disabled="!title.trim() || !coverUrl" @click="goWrite">
          下一步：写正文
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
        </button>
      </section>
    </div>

    <!-- ============ 第 2 步：书写正文（全屏编辑器；保存/发布/预览开关已并入顶部工具栏） ============ -->
    <!-- 专注模式下功能栏、顶栏与页面标题区均已让位，故仅留内容区自身高度 -->
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
            class="inline-flex h-8 items-center gap-1 rounded-[5%] px-3 text-xs font-medium text-zinc-600 transition-colors hover:bg-black/[0.04] dark:text-zinc-300 dark:hover:bg-white/[0.06]"
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
