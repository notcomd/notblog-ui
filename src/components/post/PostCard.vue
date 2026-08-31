<template>
  <div
    class="glass-card overflow-hidden card-lift cursor-pointer"
    @click="goDetail"
  >
    <!-- 封面区：图文 9:16 竖图 / 视频 1:1 带播放按钮 -->
    <div class="relative w-full overflow-hidden" :class="isVideo ? 'aspect-square' : 'aspect-[9/16]'">
      <img
        :src="cover"
        alt="cover"
        class="w-full h-full object-cover"
        loading="lazy"
        @error="onCoverError"
      />
      <!-- 加载失败柔和占位 -->
      <div v-if="coverFailed" class="absolute inset-0 bg-gradient-to-br from-amber-100 to-emerald-100 dark:from-zinc-800 dark:to-zinc-800 flex items-center justify-center">
        <svg class="w-10 h-10 text-amber-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="4" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>
      </div>
      <!-- 视频播放按钮悬浮层 -->
      <div v-if="isVideo" class="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/10 transition-colors group">
        <div class="w-14 h-14 rounded-full bg-white/95 flex items-center justify-center group-hover:scale-110 transition-transform">
          <svg class="w-6 h-6 text-zinc-800 ml-1 dark:text-zinc-100" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
        </div>
      </div>
      <!-- 私密徽标（仅自己可见） -->
      <span v-if="post.visibility === 'Private'" class="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/60 text-white text-[10px] flex items-center gap-1" title="仅自己可见">
        <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
        私密
      </span>
      <!-- 更多操作 -->
      <div class="absolute top-2 right-2 opacity-100 lg:opacity-0 lg:hover:opacity-100 transition-opacity">
        <button class="w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center" @click.stop="openMore">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>
        </button>
      </div>
    </div>

    <div class="p-4 flex flex-col gap-3">
      <!-- 用户信息栏 -->
      <div class="flex items-center gap-2">
        <img :src="authorAvatar" alt="" class="w-8 h-8 rounded-full object-cover border border-white/60 dark:border-white/10" @error="hideAvatar" />
        <span class="text-sm font-medium text-zinc-700 dark:text-zinc-200 truncate flex-1">{{ authorName }}</span>
        <span class="text-xs text-zinc-400 shrink-0">{{ timeText }}</span>
      </div>
      <!-- 标题/简述：最多 2 行 -->
      <p class="text-sm text-zinc-800 dark:text-zinc-100 text-2lines leading-relaxed">{{ post.content }}</p>
      <!-- 底部互动栏 -->
      <div class="flex items-center justify-between pt-1">
        <button class="flex items-center gap-1.5 text-sm transition-all active:scale-90" :class="post.isLiked ? 'text-red-500' : 'text-zinc-500 dark:text-zinc-400 hover:text-red-500'" @click.stop="onLike">
          <svg class="w-[18px] h-[18px] transition-transform" :class="post.isLiked ? 'fill-current scale-110' : ''" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21.2l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z" />
          </svg>
          {{ compactNumber(post.likeCount) }}
        </button>
        <button class="flex items-center gap-1.5 text-sm transition-all active:scale-90" :class="post.isFavorited ? 'text-amber-500' : 'text-zinc-500 dark:text-zinc-400 hover:text-amber-500'" @click.stop="onFavorite">
          <svg class="w-[18px] h-[18px]" :class="post.isFavorited ? 'fill-current' : ''" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round">
            <path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z" />
          </svg>
          {{ compactNumber(post.favoriteCount) }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { compactNumber, relativeTime } from '@/utils/format'
import { toggleLike, toggleFavorite } from '@/api/tweet'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'

interface PostAuthor {
  userName?: string
  name?: string
  nickname?: string
  avatar?: string
}

interface PostItem {
  tweetGuid: string
  content?: string
  isVideo?: boolean
  isLiked?: boolean
  isFavorited?: boolean
  likeCount?: number
  favoriteCount?: number
  mediaUrls?: string[]
  publishTime?: string | number
  createTime?: string | number
  visibility?: string
  author?: PostAuthor
  [key: string]: unknown
}

interface Props {
  post: PostItem
}
const props = defineProps<Props>()

const router = useRouter()
const auth = useAuthStore()
const toast = useToastStore()
const coverFailed = ref(false)

// 互动操作需要登录：未登录时提示并跳转登录页
function requireLogin(): boolean {
  if (auth.isLoggedIn()) return true
  toast.push('请先登录后再进行互动', 'info')
  router.push('/login')
  return false
}

const cover = computed(() => {
  const urls = props.post.mediaUrls || []
  return urls[0] || ''
})
// 视频判定：优先后端字段，兜底按媒体 URL 后缀识别（后端 TweetDto 暂无 isVideo 字段）
const isVideo = computed(() => {
  if (props.post.isVideo) return true
  return /\.(mp4|webm|ogg|mov|m4v)(\?|#|$)/i.test(cover.value)
})
const authorName = computed(() => {
  const a = props.post.author
  return a ? (a.userName || a.name || a.nickname || '用户') : '用户'
})
const authorAvatar = computed(() => props.post.author ? (props.post.author.avatar || '') : '')
const timeText = computed(() => relativeTime(props.post.publishTime || props.post.createTime))

function onCoverError() {
  coverFailed.value = true
}

function hideAvatar(e: Event) {
  (e.target as HTMLElement).style.visibility = 'hidden'
}

async function onLike() {
  if (!requireLogin()) return
  const liked = !props.post.isLiked
  const prev = props.post.likeCount
  props.post.isLiked = liked
  props.post.likeCount = Math.max(0, (prev || 0) + (liked ? 1 : -1))
  try {
    await toggleLike(props.post.tweetGuid, liked)
  } catch (e) {
    props.post.isLiked = !liked
    props.post.likeCount = prev
  }
}

async function onFavorite() {
  if (!requireLogin()) return
  const favorited = !props.post.isFavorited
  const prev = props.post.favoriteCount
  props.post.isFavorited = favorited
  props.post.favoriteCount = Math.max(0, (prev || 0) + (favorited ? 1 : -1))
  try {
    await toggleFavorite(props.post.tweetGuid, favorited)
  } catch (e) {
    props.post.isFavorited = !favorited
    props.post.favoriteCount = prev
  }
}

function openMore() {
  // Phase 2：举报/屏蔽菜单
}

function goDetail() {
  if (!auth.isLoggedIn()) {
    toast.push('请先登录后查看内容详情', 'info')
    router.push('/login')
    return
  }
  router.push(`/posts/${props.post.tweetGuid}`)
}
</script>
