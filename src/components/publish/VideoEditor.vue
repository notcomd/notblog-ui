<template>
  <div class="flex flex-col">
    <!-- ===== ① 标题与描述：写作优先，无框书写面 ===== -->
    <section>
      <label for="video-content" class="block text-[11px] font-medium text-zinc-400 dark:text-zinc-500">标题与描述</label>
      <textarea
        id="video-content"
        v-model="content"
        name="content"
        aria-label="视频标题与描述"
        rows="4"
        class="mt-2 min-h-[120px] w-full resize-none rounded-[5%] border-0 bg-transparent py-1 text-[15px] leading-7 text-zinc-800 outline-none transition-colors placeholder:text-zinc-400 focus:bg-black/[0.02] dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:bg-white/[0.03]"
        placeholder="视频标题与描述…（首行为标题，其余为简介）"
      ></textarea>
    </section>

    <!-- ===== ② 视频与封面 ===== -->
    <section class="mt-8 border-t border-zinc-200/70 pt-6 dark:border-zinc-800/70">
      <div class="mb-3 flex items-baseline justify-between gap-3">
        <span class="text-[11px] font-medium text-zinc-400 dark:text-zinc-500">
          视频与封面
          <span class="ml-1.5 font-normal">视频必填 · 封面用于列表展示</span>
        </span>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <!-- 视频 -->
        <div class="flex flex-col">
          <span class="text-[11px] text-zinc-400 dark:text-zinc-500">视频文件</span>
          <div
            class="mt-2 flex aspect-video cursor-pointer flex-col items-center justify-center gap-2 rounded-[5%] border border-dashed border-zinc-300 bg-black/[0.015] text-zinc-400 transition-colors hover:border-amber-400 dark:border-zinc-700 dark:bg-white/[0.02] dark:hover:border-amber-400"
            tabindex="0"
            @click="pickVideo"
            @keydown.enter.prevent="pickVideo"
            @keydown.space.prevent="pickVideo"
          >
            <svg class="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" /></svg>
            <span class="text-xs">{{ videoFileName ? '点击重新选择视频文件' : '点击选择视频文件' }}</span>
          </div>
          <input ref="videoInput" type="file" accept="video/*" class="hidden" @change="onVideoFile" />
          <div v-if="videoFileName" class="mt-2 flex items-center gap-2">
            <span class="min-w-0 flex-1 truncate text-xs text-zinc-600 dark:text-zinc-300" :title="videoFileName">{{ videoFileName }}</span>
            <button class="flex h-9 w-9 shrink-0 items-center justify-center rounded-[5%] text-zinc-400 transition-colors hover:bg-red-500/10 hover:text-red-500" title="清除视频" aria-label="清除视频" @click="clearVideo">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /></svg>
            </button>
          </div>
          <p class="mt-1.5 text-[11px] text-zinc-400">mp4 / webm / mkv / mov / avi / flv ≤500MB</p>
        </div>

        <!-- 封面 -->
        <div class="flex flex-col">
          <span class="text-[11px] text-zinc-400 dark:text-zinc-500">封面图</span>
          <div
            class="group mt-2 relative flex aspect-video cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-[5%] border border-dashed border-zinc-300 bg-black/[0.015] text-zinc-400 transition-colors hover:border-amber-400 dark:border-zinc-700 dark:bg-white/[0.02] dark:hover:border-amber-400"
            @click="pickCover"
          >
            <img v-if="coverUrl" :src="coverUrl" alt="封面" class="h-full w-full object-cover" @error="hideImg" />
            <template v-else>
              <svg class="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>
              <span class="text-xs">点击上传封面</span>
            </template>
            <div class="absolute inset-0 flex items-center justify-center bg-black/40 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
              {{ coverUrl ? '点击更换封面' : '点击上传封面' }}
            </div>
            <button
              v-if="coverUrl"
              class="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
              title="移除封面"
              aria-label="移除封面"
              @click.stop="clearCover"
            ><svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
          </div>
          <input ref="coverInput" type="file" accept="image/*" class="hidden" @change="onCoverPick" />
          <p class="mt-1.5 text-[11px] text-zinc-400">图片 ≤10MB，建议 16:9</p>
        </div>
      </div>
    </section>

    <!-- ===== ③ 操作 ===== -->
    <section class="mt-8 flex justify-end gap-3 border-t border-zinc-200/70 pt-6 dark:border-zinc-800/70">
      <button class="h-11 rounded-[5%] border border-zinc-200/80 px-6 text-sm font-medium text-zinc-600 transition-colors hover:bg-black/[0.03] disabled:opacity-50 dark:border-zinc-700/80 dark:text-zinc-300 dark:hover:bg-white/[0.05]" :disabled="savingDraft" @click="saveAsDraft">
        <span v-if="!savingDraft" class="inline-flex items-center gap-1.5"><svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>存草稿</span><span v-else>保存中…</span>
      </button>
      <button class="btn-sheen h-11 rounded-[5%] bg-gradient-to-r from-amber-400 to-orange-500 px-8 text-sm font-medium text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50" :disabled="publishing || !content.trim() || !coverUrl" @click="publish">
        {{ publishing ? '提交中…' : '发布视频' }}
      </button>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { addVideo, updateVideo, submitVideo } from '@/api/video'
import { uploadImage } from '@/api/publish'
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

const content = ref('')
// 选中但未上传的本地文件（视频整包随表单提交到 Video 服务）
const videoFile = ref<File | null>(null)
const coverFile = ref<File | null>(null)
const videoUrl = ref('')      // 预览地址（本地 objectURL 或服务端地址）
const coverUrl = ref('')      // 预览地址（本地 objectURL 或服务端地址）
const publishing = ref(false)
const savingDraft = ref(false)
const draftId = ref('')
// 服务端已有视频 Guid：存在时「存草稿 / 发布」改调 PUT / submit
const serverId = ref('')
const videoInput = ref<HTMLInputElement | null>(null)
const coverInput = ref<HTMLInputElement | null>(null)

const videoFileName = computed<string>(() => {
  if (videoFile.value) return videoFile.value.name
  return serverId.value ? '已上传的视频（重新发布无需更换）' : ''
})

watch(() => props.draft, (d) => {
  if (!d) return
  draftId.value = d.id
  videoUrl.value = d.videoUrl || ''
  coverUrl.value = d.coverUrl || d.cover || ''
  content.value = d.content || ''
}, { immediate: true })

// 点击区域触发文件选择
function pickVideo() {
  if (videoInput.value) videoInput.value.click()
}
function pickCover() {
  if (coverInput.value) coverInput.value.click()
}
function clearCover() {
  coverUrl.value = ''
  coverFile.value = null
}
function clearVideo() {
  videoUrl.value = ''
  videoFile.value = null
}

function onVideoFile(e: Event) {
  const el = e.target as HTMLInputElement
  const file = el.files && el.files[0]
  el.value = ''
  if (!file) return
  if (file.size > 500 * 1024 * 1024) { toast.push('视频不能超过 500MB', 'error'); return }
  videoFile.value = file
  videoUrl.value = URL.createObjectURL(file)
}

function onCoverPick(e: Event) {
  const el = e.target as HTMLInputElement
  const file = el.files && el.files[0]
  el.value = ''
  if (!file) return
  if (file.size > 10 * 1024 * 1024) { toast.push('图片不能超过 10MB', 'error'); return }
  coverFile.value = file
  coverUrl.value = URL.createObjectURL(file)
}

function hideImg(e: Event) { (e.target as HTMLElement).style.visibility = 'hidden' }

// 载入服务端已有视频（编辑草稿 / 被驳回）
watch(() => props.server, (s) => {
  if (!s) return
  serverId.value = s.id
  const d = s.data || {}
  content.value = d.content || d.videoName || ''
  coverUrl.value = d.coverUrl || ''
  videoUrl.value = d.videoFileUri || ''
  videoFile.value = null
  coverFile.value = null
}, { immediate: true })

function firstLine(s?: string): string {
  const t = (s || '').trim()
  return t ? t.split('\n')[0].slice(0, 40) : ''
}

// 单个文本框 → VideoName（首行）+ BriefIntroduction（其余行）
function splitNameBrief(text: string): { name: string; brief: string } {
  const t = text.trim()
  if (!t) return { name: '', brief: '' }
  const nl = t.indexOf('\n')
  if (nl < 0) return { name: t.slice(0, 100), brief: '' }
  return { name: t.slice(0, nl).slice(0, 100), brief: t.slice(nl + 1).trim() }
}

// 编辑态更换封面：Video 更新接口只接受封面 Uri（不接受文件），先经文件服务取回 Uri 再局部更新
async function pushCoverIfChanged(): Promise<void> {
  if (!coverFile.value || !serverId.value) return
  const res = await uploadImage(coverFile.value)
  const data = unwrap(res) || {}
  const uri = data.fileUri || data.file_url
  if (uri) await updateVideo({ videoGuid: serverId.value, videoCover: uri })
}

async function saveAsDraft() {
  if (savingDraft.value) return
  savingDraft.value = true
  // 本地先存一份（断网 / 误关页的离线兼存）
  const saved = saveDraft({
    id: draftId.value || undefined,
    type: 'video',
    title: firstLine(content.value),
    content: content.value,
    videoUrl: videoUrl.value,
    cover: coverUrl.value,
    coverUrl: coverUrl.value
  })
  draftId.value = saved.id
  try {
    const { name, brief } = splitNameBrief(content.value)
    if (serverId.value) {
      await updateVideo({ videoGuid: serverId.value, videoName: name || '未命名视频', briefIntroduction: brief })
      await pushCoverIfChanged()
      removeDraft(draftId.value); draftId.value = ''
      toast.push('草稿已更新', 'success')
      return
    }
    if (!videoFile.value) {
      toast.push('草稿已保存到本机（发布视频需先选择视频文件）', 'success')
      return
    }
    const res = await addVideo({
      videoFile: videoFile.value,
      coverImage: coverFile.value,
      videoName: name || '未命名视频',
      briefIntroduction: brief,
      asDraft: true
    })
    serverId.value = String(unwrap(res) || '')
    removeDraft(draftId.value); draftId.value = ''
    toast.push('草稿已保存', 'success')
  } catch (e: any) {
    toast.push((e?.message || '保存失败') + '（已保存到本机）', 'error')
  } finally {
    savingDraft.value = false
  }
}

// 发布：新建整包上传（AsDraft=false 创建后进入待审核）；编辑已有内容则局部更新后提交审核
async function publish() {
  if (publishing.value) return
  publishing.value = true
  try {
    const { name, brief } = splitNameBrief(content.value)
    const videoName = name || '未命名视频'
    let newId = ''
    if (serverId.value) {
      await updateVideo({ videoGuid: serverId.value, videoName, briefIntroduction: brief })
      await pushCoverIfChanged()
      await submitVideo(serverId.value)
      newId = serverId.value
    } else {
      if (!videoFile.value) { toast.push('请先选择视频文件', 'error'); return }
      const res = await addVideo({
        videoFile: videoFile.value,
        coverImage: coverFile.value,
        videoName,
        briefIntroduction: brief,
        asDraft: false
      })
      newId = String(unwrap(res) || '')
      if (!newId) throw new Error('发布未返回视频标识')
    }
    toast.push('已提交审核', 'success')
    if (draftId.value) { removeDraft(draftId.value); draftId.value = '' }
    if (newId) router.push(`/videos/${newId}`)
  } catch (e: any) {
    toast.push(e?.message || '发布失败，请稍后重试', 'error')
  } finally {
    publishing.value = false
  }
}
</script>
