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
        <span>作者 {{ shortAuthor }}</span>
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
      <MarkdownCommentSection v-if="doc" :mark-down-guid="route.params.guid" />
    </article>
  </div>
</template>

<script setup>
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
  getMyFavorites
} from '@/api/markdown'
import { renderMarkdown } from '@/utils/markdown'
import MarkdownCommentSection from '@/components/markdown/MarkdownCommentSection.vue'
import { formatTime } from '@/utils/format'
import { unwrap } from '@/utils/response'
import { useToastStore } from '@/stores/toast'

const route = useRoute()
const router = useRouter()
const toast = useToastStore()

const doc = ref(null)
const content = ref('')
const loading = ref(true)
const liked = ref(false)
const favorited = ref(false)

const quote = computed(() => doc.value?.quote || { LoveCount: 0, FavoriteCount: 0, ViewCount: 0 })
const renderedContent = computed(() => renderMarkdown(content.value))
const shortAuthor = computed(() => (doc.value ? String(doc.value.markUserGuid).slice(0, 8) : ''))

async function load() {
  loading.value = true
  doc.value = null
  content.value = ''
  liked.value = false
  favorited.value = false
  try {
    const [docRes, contentRes] = await Promise.all([
      getMarkdownDoc(route.params.guid),
      getMarkdownContent(route.params.guid)
    ])
    const d = unwrap(docRes)
    if (!d || !d.markDownGuid) return
    doc.value = d
    content.value = unwrap(contentRes) || ''
    // 浏览 +1（尽力而为，失败不影响展示）
    viewMarkdown(route.params.guid)
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
async function checkFavorite() {
  try {
    const res = await getMyFavorites({ page: 1, pageSize: 50 })
    const items = unwrap(res) || []
    favorited.value = items.some((i) => String(i.markDownGuid) === String(route.params.guid))
  } catch (e) {
    favorited.value = false
  }
}

async function toggleLike() {
  if (!doc.value) return
  try {
    const res = liked.value
      ? await unlikeMarkdown(route.params.guid)
      : await likeMarkdown(route.params.guid)
    const v = unwrap(res)
    if (typeof v === 'number') doc.value.quote = { ...doc.value.quote, LoveCount: v }
    liked.value = !liked.value
    toast.push(liked.value ? '已点赞' : '已取消点赞', 'success')
  } catch (e) {
    toast.push('操作失败，请稍后重试', 'error')
  }
}

async function toggleFavorite() {
  if (!doc.value) return
  try {
    if (favorited.value) {
      await unfavoriteMarkdown(route.params.guid)
      doc.value.quote = { ...doc.value.quote, FavoriteCount: Math.max(0, (doc.value.quote.FavoriteCount || 0) - 1) }
    } else {
      await favoriteMarkdown({ markDownGuid: route.params.guid })
      doc.value.quote = { ...doc.value.quote, FavoriteCount: (doc.value.quote.FavoriteCount || 0) + 1 }
    }
    favorited.value = !favorited.value
    toast.push(favorited.value ? '已收藏' : '已取消收藏', 'success')
  } catch (e) {
    toast.push('操作失败，请稍后重试', 'error')
  }
}

function hideImg(e) { e.target.style.visibility = 'hidden' }

onMounted(load)
// keep-alive 缓存内切换文档时重新加载
watch(() => route.params.guid, () => { load() })
</script>
