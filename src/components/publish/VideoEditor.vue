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
        placeholder="视频标题与描述…（支持 @提及）"
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
            <span class="text-xs">{{ videoUploading ? '上传中…' : '点击上传视频文件' }}</span>
          </div>
          <input ref="videoInput" type="file" accept="video/*" class="hidden" :disabled="videoUploading" @change="onVideoFile" />
          <div v-if="videoUrl" class="mt-2 flex items-center gap-2">
            <input
              v-model="videoUrl"
              name="videoUrl"
              aria-label="视频 URL"
              class="min-w-0 flex-1 rounded-[5%] border border-white/60 bg-white/70 px-3.5 h-10 text-xs text-zinc-600 outline-none transition-all focus:ring-2 focus:ring-amber-400/50 dark:border-white/10 dark:bg-zinc-800/70 dark:text-zinc-300"
              placeholder="视频 URL（mp4/webm）"
            />
            <button class="flex h-9 w-9 shrink-0 items-center justify-center rounded-[5%] text-zinc-400 transition-colors hover:bg-red-500/10 hover:text-red-500" title="清除视频" aria-label="清除视频" @click="clearVideo">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /></svg>
            </button>
          </div>
          <p class="mt-1.5 text-[11px] text-zinc-400">mp4 / webm ≤500MB，也可直接粘贴地址</p>
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
              <span class="text-xs">{{ coverUploading ? '上传中…' : '点击上传封面' }}</span>
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
          <input ref="coverInput" type="file" accept="image/*" class="hidden" :disabled="coverUploading" @change="onCoverPick" />
          <p class="mt-1.5 text-[11px] text-zinc-400">图片 ≤10MB，建议 16:9</p>
        </div>
      </div>
    </section>

    <!-- ===== ③ 发布设置 ===== -->
    <section class="mt-8 grid grid-cols-2 gap-5 border-t border-zinc-200/70 pt-6 dark:border-zinc-800/70">
      <div>
        <label for="video-circle" class="block text-[11px] font-medium text-zinc-400 dark:text-zinc-500">发布到</label>
        <select id="video-circle" v-model="circleGuid" name="circleGuid" aria-label="发布到社区" class="mt-2 h-11 w-full rounded-[5%] border border-white/60 bg-white/70 px-4 text-sm outline-none transition-all focus:ring-2 focus:ring-amber-400/50 dark:border-white/10 dark:bg-zinc-800/70">
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
      <button class="btn-sheen h-11 rounded-[5%] bg-gradient-to-r from-amber-400 to-orange-500 px-8 text-sm font-medium text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50" :disabled="publishing || !content.trim() || !coverUrl" @click="publish">
        {{ publishing ? '发布中…' : '发布视频' }}
      </button>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { createTweet, createCirclePost, uploadImage } from '@/api/publish'
import { uploadVideo } from '@/api/publish'
import { updateTweet, submitTweet } from '@/api/tweet'
import { saveDraft, removeDraft } from '@/utils/drafts'
import { unwrap } from '@/utils/response'
import { pickCoverUrl, pickVideoUrl } from '@/utils/media'
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
// 服务端已有内容 Guid：存在时「存草稿 / 发布」改调 PUT（+ submit）
const serverId = ref('')
const videoFileId = ref('')  // 发布用视频文件 fileId
const videoInput = ref<HTMLInputElement | null>(null)
const coverInput = ref<HTMLInputElement | null>(null)

watch(() => props.draft, (d) => {
  if (!d) return
  draftId.value = d.id
  videoFileId.value = d.videoFileId || ''
  videoUrl.value = d.videoUrl || ''
  coverUrl.value = d.coverUrl || d.cover || ''
  coverFileId.value = d.coverFileId || ''
  content.value = d.content || ''
  if (d.circleGuid) circleGuid.value = d.circleGuid
  visibility.value = d.visibility || 'Public'
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
    videoUrl.value = ''
    toast.push('视频上传失败，请稍后重试', 'error')
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
    coverFileId.value = ''
    coverUrl.value = ''
    toast.push('封面上传失败，请稍后重试', 'error')
  } finally {
    coverUploading.value = false
  }
}

function hideImg(e: Event) { (e.target as HTMLElement).style.visibility = 'hidden' }

// 载入服务端已有内容（编辑草稿/被驳回）
watch(() => props.server, (s) => {
  if (!s) return
  serverId.value = s.id
  content.value = s.data?.content || ''
  visibility.value = s.data?.visibility || 'Public'
  const urls: string[] = s.data?.mediaUrls || []
  videoUrl.value = pickVideoUrl(urls) || ''
  coverUrl.value = pickCoverUrl(urls) || ''
  videoFileId.value = ''
  coverFileId.value = ''
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

// fileIds：新上传的 fileId 优先；服务端回填的媒体只有 URL（无 fileId）则跳过
function buildFileIds(): string[] {
  const ids: string[] = []
  if (videoFileId.value) ids.push(videoFileId.value)
  if (coverFileId.value) ids.push(coverFileId.value)
  return ids
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
    videoFileId: videoFileId.value,
    cover: coverUrl.value,
    coverUrl: coverUrl.value,
    coverFileId: coverFileId.value,
    circleGuid: circleGuid.value,
    visibility: visibility.value
  })
  draftId.value = saved.id
  try {
    if (!content.value.trim()) {
      toast.push('草稿已保存到本机', 'success')
      return
    }
    const payload = { content: content.value.trim(), fileIds: buildFileIds(), visibility: visibility.value }
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

// 发布视频：新建需含视频文件 fileId；编辑已有内容时沿用服务端媒体
async function publish() {
  if (publishing.value) return
  if (!videoFileId.value && !serverId.value) {
    toast.push('请先上传视频文件', 'error')
    return
  }
  publishing.value = true
  try {
    const payload = { content: content.value.trim(), fileIds: buildFileIds(), visibility: visibility.value }
    let newId = ''
    if (serverId.value) {
      await updateTweet(serverId.value, payload)
      await submitTweet(serverId.value)
      newId = serverId.value
      toast.push('已提交审核', 'success')
    } else if (circleGuid.value) {
      newId = extractId(unwrap(await createCirclePost({ circleGuid: circleGuid.value, ...payload })))
      toast.push('已发布到社区', 'success')
    } else {
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
