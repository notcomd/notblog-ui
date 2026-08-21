<template>
  <div class="mt-8 pt-6 border-t border-zinc-200/70 dark:border-zinc-700/60">
    <!-- 标题 -->
    <div class="flex items-center justify-between mb-4">
      <span class="text-sm font-semibold text-zinc-700 dark:text-zinc-200">评论 ({{ reviews.length }})</span>
    </div>

    <!-- 评论列表 -->
    <div v-if="loading" class="py-8 text-center text-sm text-zinc-400">加载评论中...</div>
    <div v-else-if="!reviews.length" class="py-8 text-center text-sm text-zinc-400">还没有评论，来说两句吧～</div>
    <div v-else class="space-y-4">
      <div v-for="r in reviews" :key="r.markReviewGuid" class="py-3">
        <div class="flex gap-3">
          <!-- 头像（首字） -->
          <div class="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
            {{ userNameOf(r).slice(0, 1) }}
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <span class="text-sm font-medium text-zinc-700 dark:text-zinc-200">{{ userNameOf(r) }}</span>
              <span v-if="isMine(r)" class="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400">我</span>
              <span class="text-xs text-zinc-400">{{ formatTime(r.reviewTime) }}</span>
            </div>
            <p class="text-sm text-zinc-700 dark:text-zinc-200 mt-1 leading-relaxed break-words">{{ r.content }}</p>

            <!-- 评论配图 -->
            <div v-if="r.reviewImages && r.reviewImages.length" class="mt-2 grid gap-1.5" :class="r.reviewImages.length === 1 ? 'grid-cols-1 max-w-[280px]' : 'grid-cols-3 max-w-[420px]'">
              <img
                v-for="(img, idx) in r.reviewImages"
                :key="idx"
                :src="img"
                class="w-full aspect-square object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                @click="openImage(img)"
                @error="hideImg"
              />
            </div>

            <!-- 操作行 -->
            <div class="flex items-center gap-4 mt-1.5">
              <button class="flex items-center gap-1 text-xs text-zinc-400 hover:text-red-500 transition-colors" @click="toggleLike(r)">
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21.2l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>
                {{ (r.quote && r.quote.loveCount) || 0 }}
              </button>
              <button class="text-xs text-zinc-400 hover:text-amber-500 transition-colors" @click="startReply(r)">回复</button>
              <button v-if="isMine(r)" class="text-xs text-zinc-400 hover:text-red-500 transition-colors" @click="removeReview(r)">删除</button>
            </div>

            <!-- 子评论 -->
            <div v-if="r.childReviewCount > 0 || childrenOf(r).length" class="mt-2 pl-3 border-l-2 border-zinc-200 dark:border-zinc-700 space-y-2">
              <div v-for="c in childrenOf(r)" :key="c.markReviewGuid" class="py-2">
                <div class="flex gap-2.5">
                  <div class="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400/80 to-orange-500/80 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {{ userNameOf(c).slice(0, 1) }}
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2">
                      <span class="text-xs font-medium text-zinc-600 dark:text-zinc-300">{{ userNameOf(c) }}</span>
                      <span v-if="isMine(c)" class="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400">我</span>
                      <span class="text-[10px] text-zinc-400">{{ formatTime(c.reviewTime) }}</span>
                    </div>
                    <p class="text-sm text-zinc-700 dark:text-zinc-200 mt-0.5 leading-relaxed break-words">{{ c.content }}</p>
                    <div v-if="c.reviewImages && c.reviewImages.length" class="mt-1.5 grid grid-cols-3 gap-1.5 max-w-[240px]">
                      <img v-for="(img, idx) in c.reviewImages" :key="idx" :src="img" class="w-full aspect-square object-cover rounded-md cursor-pointer hover:opacity-80 transition-opacity" @click="openImage(img)" @error="hideImg" />
                    </div>
                    <div class="flex items-center gap-3 mt-1">
                      <button class="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-red-500 transition-colors" @click="toggleLike(c)">
                        <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21.2l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>
                        {{ (c.quote && c.quote.loveCount) || 0 }}
                      </button>
                      <button class="text-[11px] text-zinc-400 hover:text-amber-500 transition-colors" @click="startReply(r, c)">回复</button>
                      <button v-if="isMine(c)" class="text-[11px] text-zinc-400 hover:text-red-500 transition-colors" @click="removeReview(c)">删除</button>
                    </div>
                  </div>
                </div>
              </div>
              <button v-if="r.childReviewCount > childrenOf(r).length && !childrenLoaded[r.markReviewGuid]" class="text-xs text-amber-500 hover:text-amber-600" @click="loadChildren(r)">
                查看 {{ r.childReviewCount }} 条回复
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 输入区 -->
    <div class="pt-4 mt-4 border-t border-zinc-200/70 dark:border-zinc-700/60">
      <div v-if="replyingTo" class="flex items-center justify-between mb-2">
        <span class="text-xs text-amber-600 dark:text-amber-400">回复 @{{ userNameOf(replyingTo) }}</span>
        <button class="text-xs text-zinc-400 hover:text-zinc-600 dark:text-zinc-300" @click="replyingTo = null">取消</button>
      </div>
      <textarea
        v-model="draft"
        rows="2"
        class="w-full resize-none rounded-xl bg-white/60 dark:bg-zinc-800/60 border border-white/50 dark:border-white/10 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-400/50 transition-all"
        :placeholder="replyingTo ? '回复 ' + userNameOf(replyingTo) + '...' : '写下你的评论...'"
      ></textarea>

      <!-- 图片选择与预览 -->
      <div class="mt-2 flex items-start gap-2">
        <button
          class="h-8 px-3 rounded-lg bg-white/60 dark:bg-zinc-800/60 text-zinc-500 dark:text-zinc-400 text-xs hover:text-emerald-500 transition-colors inline-flex items-center gap-1.5"
          :disabled="images.length >= 9 || uploading"
          @click="pickImages"
        >
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          {{ uploading ? '上传中...' : '图片（最多 9 张）' }}
        </button>
        <input ref="imageInput" type="file" accept="image/*" multiple class="hidden" @change="onImagesPick" />
        <div v-if="images.length" class="flex flex-wrap gap-1.5">
          <div v-for="(img, idx) in images" :key="idx" class="relative">
            <img :src="img" class="w-14 h-14 object-cover rounded-lg" @error="hideImg" />
            <button class="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center" @click="removeImage(idx)">✕</button>
          </div>
        </div>
      </div>

      <div class="mt-3 flex justify-end">
        <button
          class="h-9 px-5 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 text-white text-xs font-medium disabled:opacity-50 transition-all active:scale-95"
          :disabled="sending || (!draft.trim() && !images.length)"
          @click="submit"
        >
          {{ sending ? '发送中...' : '发表评论' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import { uploadImage } from '@/api/publish'
import { formatTime } from '@/utils/format'
import { unwrap } from '@/utils/response'
import {
  getMarkdownReviews,
  addMarkdownReview,
  replyMarkdownReview,
  deleteMarkdownReview,
  likeMarkdownReview,
  unlikeMarkdownReview,
  getMarkdownReviewChildren
} from '@/api/markdown'

const props = defineProps({
  markDownGuid: { type: String, required: true }
})

const auth = useAuthStore()
const toast = useToastStore()

const reviews = ref([])
const loading = ref(false)
const draft = ref('')
const sending = ref(false)
const uploading = ref(false)
const images = ref([])
const imageInput = ref(null)
const replyingTo = ref(null)          // 回复目标（顶层评论或子评论）
const children = reactive({})         // reviewGuid -> 子评论数组
const childrenLoaded = reactive({})   // reviewGuid -> bool
const likedReviews = reactive({})     // reviewGuid -> bool（本地点赞状态）

function userNameOf(r) {
  // 后端评论响应无用户名（仅 userId），显示短 ID
  return r && r.userId ? '用户 ' + String(r.userId).slice(0, 8) : '用户'
}

function isMine(r) {
  const uid = r && r.userId
  return !!uid && String(uid).toLowerCase() === String(auth.user && auth.user.id).toLowerCase()
}

function childrenOf(r) {
  return children[r.markReviewGuid] || []
}

async function load() {
  loading.value = true
  try {
    const res = await getMarkdownReviews(props.markDownGuid)
    const data = unwrap(res)
    reviews.value = Array.isArray(data) ? data : []
  } catch (e) {
    reviews.value = []
  } finally {
    loading.value = false
  }
}

async function loadChildren(r) {
  try {
    const res = await getMarkdownReviewChildren(props.markDownGuid, r.markReviewGuid)
    const data = unwrap(res)
    children[r.markReviewGuid] = Array.isArray(data) ? data : []
    childrenLoaded[r.markReviewGuid] = true
  } catch (e) {
    toast.push('回复加载失败', 'error')
  }
}

function startReply(review, child = null) {
  replyingTo.value = child || review
}

function pickImages() {
  if (imageInput.value && !uploading.value) imageInput.value.click()
}

async function onImagesPick(e) {
  const files = Array.from(e.target.files || []).slice(0, 9 - images.value.length)
  e.target.value = ''
  if (!files.length) return
  uploading.value = true
  try {
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        toast.push('单张图片不能超过 10MB', 'error')
        continue
      }
      const res = await uploadImage(file)
      const data = unwrap(res) || {}
      const uri = data.fileUri || data.file_url
      if (uri) images.value.push(uri)
      else toast.push('图片上传失败（无 fileUri）', 'error')
    }
  } catch (err) {
    toast.push('图片上传失败', 'error')
  } finally {
    uploading.value = false
  }
}

function removeImage(idx) {
  images.value.splice(idx, 1)
}

async function submit() {
  const content = draft.value.trim()
  if ((!content && !images.value.length) || sending.value) return
  sending.value = true
  try {
    const payload = {
      content,
      reviewImages: images.value.length ? [...images.value] : null
    }
    if (replyingTo.value) {
      await replyMarkdownReview(props.markDownGuid, replyingTo.value.markReviewGuid, payload)
    } else {
      await addMarkdownReview(props.markDownGuid, payload)
    }
    draft.value = ''
    images.value = []
    replyingTo.value = null
    await load()
    toast.push('评论发表成功', 'success')
  } catch (e) {
    toast.push('评论发表失败，请稍后重试', 'error')
  } finally {
    sending.value = false
  }
}

async function toggleLike(r) {
  const key = r.markReviewGuid
  try {
    const res = likedReviews[key]
      ? await unlikeMarkdownReview(props.markDownGuid, key)
      : await likeMarkdownReview(props.markDownGuid, key)
    const v = unwrap(res)
    if (typeof v === 'number') {
      if (!r.quote) r.quote = {}
      r.quote.loveCount = v
    }
    likedReviews[key] = !likedReviews[key]
  } catch (e) {
    toast.push('操作失败，请稍后重试', 'error')
  }
}

async function removeReview(r) {
  try {
    await deleteMarkdownReview(props.markDownGuid, r.markReviewGuid)
    toast.push('评论已删除', 'success')
    await load()
  } catch (e) {
    toast.push('删除失败', 'error')
  }
}

function openImage(url) {
  window.open(url, '_blank')
}

function hideImg(e) { e.target.style.visibility = 'hidden' }

load()
</script>
