<template>
  <div class="max-w-[1400px] mx-auto px-6 py-6">
    <!-- 加载态 -->
    <div v-if="loading" class="glass-card p-12 text-center text-sm text-zinc-400">加载中...</div>

    <!-- 不存在/无权访问 -->
    <div v-else-if="!doc" class="glass-card p-12 text-center">
      <p class="text-sm text-zinc-500">文章不存在或无权访问</p>
      <router-link to="/home" class="inline-block mt-4 text-sm text-amber-600 dark:text-amber-400 hover:underline">← 返回首页</router-link>
    </div>

    <!-- 文章主体 -->
    <article v-else class="glass-card p-8">
      <button
        class="mb-6 text-sm text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors inline-flex items-center gap-1"
        @click="router.back()"
      >
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
        返回
      </button>

      <!-- 标题 -->
      <h1 class="text-3xl font-bold text-zinc-800 dark:text-zinc-100 leading-snug">{{ doc.name }}</h1>

      <!-- 元数据 -->
      <div class="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-zinc-400">
        <span>{{ formatTime(doc.createAt) }}</span>
        <span class="text-zinc-300 dark:text-zinc-500">·</span>
        <span class="inline-flex items-center gap-1.5">
          <img
            :src="authorAvatar"
            alt=""
            width="20"
            height="20"
            class="h-5 w-5 shrink-0 rounded-full object-cover"
            @error="avatarFailed = true"
          />
          作者 {{ authorName }}
        </span>
        <span v-if="doc.auth === 'PrivateMark' || doc.auth === 'private'" class="text-red-400">🔒 私密</span>
        <span
          v-for="t in doc.tags"
          :key="t"
          class="px-2 py-0.5 rounded-full bg-emerald-400/15 text-emerald-600 dark:text-emerald-300"
        >{{ t }}</span>
      </div>

      <!-- 封面 -->
      <img
        v-if="doc.coverUrl"
        :src="doc.coverUrl"
        alt="封面"
        class="mt-6 w-full max-h-[420px] object-cover rounded-xl"
        @error="hideImg"
      />

      <!-- 正文（Markdown 渲染） -->
      <div v-if="content" class="mt-6 markdown-body text-[15px] leading-[1.8]" v-html="renderedContent"></div>
      <p v-else class="mt-6 text-sm text-zinc-400">正文加载失败</p>

      <!-- 操作区 -->
      <div class="mt-8 pt-4 border-t border-zinc-200/70 dark:border-zinc-700/60 flex flex-wrap items-center gap-3">
        <button
          class="h-9 px-4 rounded-xl text-xs font-medium transition-all inline-flex items-center gap-1.5"
          :class="liked ? 'bg-red-500/10 text-red-500' : 'bg-white/60 dark:bg-zinc-800/60 text-zinc-500 hover:text-red-500 dark:text-zinc-300'"
          @click="toggleLike"
        >
          <svg class="w-4 h-4" :fill="liked ? 'currentColor' : 'none'" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          点赞 {{ quote.LoveCount }}
        </button>
        <button
          class="h-9 px-4 rounded-xl text-xs font-medium transition-all inline-flex items-center gap-1.5"
          :class="favorited ? 'bg-amber-500/10 text-amber-500' : 'bg-white/60 dark:bg-zinc-800/60 text-zinc-500 hover:text-amber-500 dark:text-zinc-300'"
          @click="toggleFavorite"
        >
          <svg class="w-4 h-4" :fill="favorited ? 'currentColor' : 'none'" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          收藏 {{ quote.FavoriteCount }}
        </button>
        <span class="text-xs text-zinc-400 inline-flex items-center gap-1">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          {{ quote.ViewCount }} 浏览
        </span>
      </div>

      <!-- 评论（支持图片评论） -->
      <CommentSection v-if="doc" :cfg="commentCfg" />
    </article>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  getMarkdownDoc,
  getMarkdownContent,
  viewMarkdown,
  likeMarkdown,
  unlikeMarkdown,
  favoriteMarkdown,
  unfavoriteMarkdown,
  getMyFavorites,
  getMarkdownReviews,
  addMarkdownReview,
  deleteMarkdownReview,
  replyMarkdownReview,
  likeMarkdownReview,
  unlikeMarkdownReview,
  getMarkdownReviewChildren
} from '@/api/markdown'
import { renderMarkdown } from '@/utils/markdown'
import CommentSection from '@/components/comment/CommentSection.vue'
import { formatTime } from '@/utils/format'
import { unwrap } from '@/utils/response'
import { themeAvatar } from '@/utils/avatar'
import { authorAvatarOf } from '@/utils/author'
import { useToastStore } from '@/stores/toast'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const toast = useToastStore()
const auth = useAuthStore()

/** 当前文档 Guid（vue-router 的 params 值类型为 string | string[]，统一归一化为字符串） */
const docGuid = computed(() => String(route.params.guid ?? ''))

const doc = ref<any>(null)

// 评论配置（通用评论组件，Markdown 后端：全量 + 图片评论 + 子评论接口）
const commentCfg: any = {
  idField: 'markReviewGuid',
  contentField: 'content',
  timeField: 'reviewTime',
  likeCountField: '',
  replyCountField: '',
  imagesField: 'reviewImages',
  images: true,
  sortable: false,
  replyMode: 'direct',
  loader: () => getMarkdownReviews(docGuid.value),
  creator: (payload) => addMarkdownReview(docGuid.value, payload),
  remove: (id) => deleteMarkdownReview(docGuid.value, id),
  replyLoader: (parentId) => getMarkdownReviewChildren(docGuid.value, parentId),
  replier: (parentId, payload) => replyMarkdownReview(docGuid.value, parentId, payload),
  like: (id) => likeMarkdownReview(docGuid.value, id),
  unlike: (id) => unlikeMarkdownReview(docGuid.value, id),
  authorName: (r) => auth.resolveDisplayName({ userGuid: r.userId }, '用户'),
  authorId: (r) => r.userId
}
const content = ref('')
const loading = ref(true)
const liked = ref(false)
const favorited = ref(false)

const quote = computed(() => doc.value?.quote || { LoveCount: 0, FavoriteCount: 0, ViewCount: 0 })
const renderedContent = computed(() => renderMarkdown(content.value))
// 作者名：后端详情仅返回 MarkUserGuid（GUID），无昵称字段。
// 自己 → 本地 me 昵称；其它用户 → 按 GUID 异步取昵称（缓存 + 去重 + 并发上限），
// 未就绪先显示兜底，拿到后自动替换，不再显示 GUID 片段（见 utils/author、stores/auth）
const authorName = computed(() => {
  if (!doc.value) return ''
  return auth.resolveDisplayName({ userGuid: String(doc.value.markUserGuid || '') })
})

// 作者头像：详情只有作者 GUID，按 GUID 解析（缓存 + 去重 + 并发上限；自己用本地 me 头像），
// 拿不到或加载失败回退首字头像，不留空白。
const avatarFailed = ref(false)
const authorAvatar = computed<string>(() => {
  const guid = doc.value ? String(doc.value.markUserGuid || '') : ''
  if (!avatarFailed.value && guid) {
    const selfId = auth.user?.id ? String(auth.user.id).toLowerCase() : ''
    if (selfId && selfId === guid.toLowerCase() && auth.user?.avatar) return auth.user.avatar
    const resolved = authorAvatarOf(guid)
    if (resolved) return resolved
  }
  return themeAvatar(authorName.value.charAt(0) || '用')
})

async function load(): Promise<void> {
  loading.value = true
  doc.value = null
  content.value = ''
  liked.value = false
  favorited.value = false
  avatarFailed.value = false
  try {
    const [docRes, contentRes] = await Promise.all([
      getMarkdownDoc(docGuid.value),
      getMarkdownContent(docGuid.value)
    ])
    const d = unwrap(docRes)
    if (!d || !d.markDownGuid) return
    doc.value = d
    content.value = unwrap(contentRes) || ''
    // 浏览 +1（尽力而为，失败不影响展示）
    viewMarkdown(docGuid.value)
      .then((r) => {
        const v = unwrap(r)
        if (typeof v === 'number' && doc.value) {
          doc.value.quote = { ...doc.value.quote, ViewCount: v }
        }
      })
      .catch(() => {})
    checkFavorite()
  } catch (e) {
    doc.value = null
  } finally {
    loading.value = false
  }
}

// 收藏初始状态：从我的收藏列表比对（后端详情无 isFavorited 字段）
async function checkFavorite(): Promise<void> {
  try {
    const res = await getMyFavorites({ page: 1, pageSize: 50 })
    const items = unwrap(res) || []
    favorited.value = items.some((i: any) => String(i.markDownGuid) === docGuid.value)
  } catch (e) {
    favorited.value = false
  }
}

async function toggleLike(): Promise<void> {
  if (!doc.value) return
  try {
    const res = liked.value
      ? await unlikeMarkdown(docGuid.value)
      : await likeMarkdown(docGuid.value)
    const v = unwrap(res)
    if (typeof v === 'number') doc.value.quote = { ...doc.value.quote, LoveCount: v }
    liked.value = !liked.value
    toast.push(liked.value ? '已点赞' : '已取消点赞', 'success')
  } catch (e) {
    toast.push('操作失败，请稍后重试', 'error')
  }
}

async function toggleFavorite(): Promise<void> {
  if (!doc.value) return
  try {
    if (favorited.value) {
      await unfavoriteMarkdown(docGuid.value)
      doc.value.quote = { ...doc.value.quote, FavoriteCount: Math.max(0, (doc.value.quote.FavoriteCount || 0) - 1) }
    } else {
      await favoriteMarkdown(docGuid.value)
      doc.value.quote = { ...doc.value.quote, FavoriteCount: (doc.value.quote.FavoriteCount || 0) + 1 }
    }
    favorited.value = !favorited.value
    toast.push(favorited.value ? '已收藏' : '已取消收藏', 'success')
  } catch (e) {
    toast.push('操作失败，请稍后重试', 'error')
  }
}

function hideImg(e: Event) { (e.target as HTMLElement).style.visibility = 'hidden' }

onMounted(load)
// keep-alive 缓存内切换文档时重新加载
watch(docGuid, () => { load() })
</script>
