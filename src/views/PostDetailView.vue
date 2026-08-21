<template>
  <div class="max-w-[1200px] mx-auto">
    <!-- 顶部导航条（详情页专用） -->
    <div class="flex items-center justify-between mb-5">
      <button class="flex items-center gap-1.5 px-3.5 py-2 rounded-[5%] glass-card text-sm font-medium text-zinc-700 dark:text-zinc-200 hover: active:scale-95 transition-all" @click="goBack">
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
        返回
      </button>
      <div class="flex items-center gap-2">
        <span class="px-3 py-1.5 rounded-full text-xs font-medium bg-gradient-to-r from-amber-400/15 to-orange-400/10 text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-500/20">
          {{ isVideo ? '# 视频' : '# 图文博客' }}
        </span>
        <button class="w-9 h-9 rounded-[5%] glass-card flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover: active:scale-95 transition-all" title="更多操作" @click="onMore">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>
        </button>
      </div>
    </div>

    <!-- 举报弹窗 -->
    <div v-if="reportOpen" class="fixed inset-0 z-[85] flex items-center justify-center bg-black/40" @click.self="reportOpen = false">
      <div class="glass-card p-6 w-[440px]">
        <h3 class="text-base font-bold text-zinc-800 dark:text-zinc-100 mb-1">举报内容</h3>
        <p class="text-sm text-zinc-500 dark:text-zinc-400 mb-4">请选择举报类型，我们会尽快核实处理</p>
        <div class="grid grid-cols-3 gap-2 mb-4">
          <button v-for="(c, i) in REPORT_CATEGORIES" :key="i" class="py-2.5 rounded-xl text-sm font-medium transition-all"
            :class="reportCategory === i ? 'bg-gradient-to-r from-red-400 to-rose-500 text-white shadow' : 'bg-white/60 dark:bg-zinc-800/60 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200'"
            @click="reportCategory = i">{{ c }}</button>
        </div>
        <textarea v-model="reportReason" rows="2" class="w-full resize-none rounded-xl bg-white/70 dark:bg-zinc-800/70 border border-white/60 dark:border-white/10 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-400/50 transition-all" placeholder="补充说明（选填）"></textarea>
        <div class="flex justify-end gap-2 mt-4">
          <button class="px-4 h-10 rounded-xl text-sm text-zinc-500 hover:bg-white/60 dark:hover:bg-zinc-800/60 transition-all" @click="reportOpen = false">取消</button>
          <button class="px-4 h-10 rounded-xl text-sm font-medium bg-gradient-to-r from-red-400 to-rose-500 text-white active:scale-95 transition-all" @click="submitReportReport">提交举报</button>
        </div>
      </div>
    </div>

    <!-- 加载骨架 -->
    <div v-if="loading" class="grid grid-cols-5 gap-6">
      <div class="col-span-3 space-y-4 animate-pulse">
        <div class="aspect-[4/3] rounded-[5%] bg-zinc-200/70 dark:bg-zinc-800/70"></div>
        <div class="h-6 w-3/4 rounded bg-zinc-200/70 dark:bg-zinc-800/70"></div>
        <div class="space-y-2">
          <div class="h-3 w-full rounded bg-zinc-200/70 dark:bg-zinc-800/70"></div>
          <div class="h-3 w-5/6 rounded bg-zinc-200/70 dark:bg-zinc-800/70"></div>
          <div class="h-3 w-2/3 rounded bg-zinc-200/70 dark:bg-zinc-800/70"></div>
        </div>
      </div>
      <div class="col-span-2">
        <div class="glass-card p-4 space-y-3 animate-pulse">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-full bg-zinc-200/70 dark:bg-zinc-800/70"></div>
            <div class="flex-1 space-y-2"><div class="h-3 w-20 rounded bg-zinc-200/70 dark:bg-zinc-800/70"></div><div class="h-2 w-28 rounded bg-zinc-200/70 dark:bg-zinc-800/70"></div></div>
          </div>
          <div class="h-8 rounded-[5%] bg-zinc-200/70 dark:bg-zinc-800/70"></div>
        </div>
      </div>
    </div>

    <!-- 主体：6:4 分栏 -->
    <div v-else-if="tweet" class="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <!-- ===== 左侧 60%：内容展示区 ===== -->
      <div class="lg:col-span-3 min-w-0">
        <div class="glass-card overflow-hidden">
          <!-- 媒体：视频模式 -> 播放器（含弹幕系统）；图文模式 -> 轮播 -->
          <VideoPlayer v-if="isVideo && mediaUrls.length" :src="mediaUrls[0]" :video-guid="tweet.tweetGuid" class="p-3" />
          <div v-else-if="mediaUrls.length" class="relative bg-zinc-100 dark:bg-zinc-900">
            <div class="relative overflow-hidden aspect-[4/3]">
              <transition name="fade">
                <img :key="activeMedia" :src="mediaUrls[activeMedia]" alt="" class="w-full h-full object-contain" @error="onMediaError" />
              </transition>
              <!-- 左右切换箭头（多图） -->
              <button v-if="mediaUrls.length > 1" class="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/50 transition-colors" @click="prevMedia">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M15 18l-6-6 6-6" /></svg>
              </button>
              <button v-if="mediaUrls.length > 1" class="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/50 transition-colors" @click="nextMedia">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M9 6l6 6-6 6" /></svg>
              </button>
              <!-- 缩略图指示点 -->
              <div v-if="mediaUrls.length > 1" class="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                <button v-for="(m, i) in mediaUrls" :key="i" class="h-1.5 rounded-full transition-all duration-300" :class="i === activeMedia ? 'w-5 bg-amber-400' : 'w-1.5 bg-white/70'" @click="activeMedia = i"></button>
              </div>
            </div>
          </div>

          <div class="p-6">
            <!-- 标题 -->
            <h1 class="text-2xl font-bold text-zinc-900 dark:text-zinc-50 leading-snug">{{ tweet.content }}</h1>

            <!-- 元数据 -->
            <div class="flex flex-wrap items-center gap-3 mt-4 text-sm text-zinc-400">
              <span class="flex items-center gap-1">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                {{ relativeTime(tweet.publishTime || tweet.createTime) }}
              </span>
              <span v-if="tweet.circleName" class="flex items-center gap-1 cursor-pointer hover:text-amber-500 transition-colors" @click="goCircle">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21v-4m0 0V5a2 2 0 0 1 2-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 0 0-2 2z" /></svg>
                {{ tweet.circleName }}
              </span>
              <span class="flex items-center gap-1">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                {{ compactNumber(tweet.viewCount) }} 次浏览
              </span>
            </div>

            <!-- 正文：Markdown 内容走渲染器，普通内容走段落渲染 -->
            <div v-if="isMarkdown" class="mt-6 markdown-body text-[15px] leading-[1.8]" v-html="renderedMarkdown"></div>
            <div v-else class="mt-6 space-y-4 text-[15px] leading-[1.8] text-zinc-700 dark:text-zinc-300">
              <template v-for="(block, i) in bodyBlocks" :key="i">
                <blockquote v-if="block.type === 'quote'" class="border-l-4 border-amber-300 dark:border-amber-500/50 bg-amber-50/60 dark:bg-amber-500/10 px-4 py-2.5 rounded-r-[5%] text-amber-800 dark:text-amber-200/90">
                  {{ block.text }}
                </blockquote>
                <p v-else class="whitespace-pre-wrap">
                  <template v-for="(seg, j) in highlightMentions(block.text)" :key="j">
                    <span v-if="seg.type === 'mention'" class="text-amber-600 dark:text-amber-400 font-medium cursor-pointer hover:underline" @click="goUser(seg.name)">@{{ seg.name }}</span>
                    <span v-else>{{ seg.text }}</span>
                  </template>
                </p>
              </template>
            </div>
          </div>
        </div>
      </div>

      <!-- ===== 右侧 40%：互动与社交区（固定不滚动） ===== -->
      <div class="lg:col-span-2 min-w-0 flex flex-col gap-4 h-fit lg:sticky lg:top-20">
        <!-- 发布者信息卡片 -->
        <div class="glass-card p-5">
          <div class="flex items-center gap-3">
            <img :src="authorAvatar" alt="" class="w-12 h-12 rounded-full object-cover border-2 border-white/60 dark:border-white/10 cursor-pointer hover:scale-105 transition-transform" @error="hideAvatar" @click="goAuthor" />
            <div class="flex-1 min-w-0">
              <div class="font-semibold text-zinc-800 dark:text-zinc-100 cursor-pointer hover:text-amber-500 transition-colors truncate" @click="goAuthor">{{ authorName }}</div>
              <div class="text-xs text-zinc-400 truncate">{{ authorBio }}</div>
            </div>
            <!-- 作者视角：编辑内容；否则关注按钮 -->
            <button v-if="isAuthor" class="px-3.5 h-9 rounded-[5%] text-sm font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 active:scale-95 transition-all" @click="onEdit">
              <span class="flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                编辑内容
              </span>
            </button>
            <button v-else class="h-9 px-4 rounded-[5%] text-sm font-medium transition-all active:scale-95"
              :class="isFollowing ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 border border-zinc-200 dark:border-zinc-700' : 'bg-gradient-to-r from-amber-400 to-orange-500 text-white hover:'"
              @click="toggleFollow"
            >
              {{ isFollowing ? '已关注' : '关注' }}
            </button>
          </div>
          <!-- 作者视角：内容数据统计 -->
          <div v-if="isAuthor" class="mt-4 grid grid-cols-3 gap-2 text-center">
            <div class="rounded-[5%] bg-zinc-50 dark:bg-zinc-800/60 py-2">
              <div class="text-lg font-bold text-zinc-800 dark:text-zinc-100">{{ compactNumber(tweet.viewCount) }}</div>
              <div class="text-[11px] text-zinc-400">阅读量</div>
            </div>
            <div class="rounded-[5%] bg-zinc-50 dark:bg-zinc-800/60 py-2">
              <div class="text-lg font-bold text-zinc-800 dark:text-zinc-100">{{ compactNumber(tweet.likeCount) }}</div>
              <div class="text-[11px] text-zinc-400">点赞</div>
            </div>
            <div class="rounded-[5%] bg-zinc-50 dark:bg-zinc-800/60 py-2">
              <div class="text-lg font-bold text-zinc-800 dark:text-zinc-100">{{ compactNumber(tweet.commentCount) }}</div>
              <div class="text-[11px] text-zinc-400">评论</div>
            </div>
          </div>
        </div>

        <!-- 核心互动栏 -->
        <div class="glass-card px-5 py-4 flex items-center justify-around">
          <button class="flex flex-col items-center gap-1 text-sm transition-all active:scale-90" :class="detail.isLiked ? 'text-red-500' : 'text-zinc-500 dark:text-zinc-400 hover:text-red-500'" @click="onLike">
            <svg class="w-6 h-6" :class="detail.isLiked ? 'fill-current' : ''" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21.2l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z" />
            </svg>
            <span>{{ compactNumber(tweet.likeCount) }}</span>
          </button>
          <button class="flex flex-col items-center gap-1 text-sm transition-all active:scale-90" :class="detail.isFavorited ? 'text-amber-500' : 'text-zinc-500 dark:text-zinc-400 hover:text-amber-500'" @click="onFavorite">
            <svg class="w-6 h-6" :class="detail.isFavorited ? 'fill-current' : ''" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round">
              <path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z" />
            </svg>
            <span>{{ compactNumber(tweet.favoriteCount) }}</span>
          </button>
          <button class="flex flex-col items-center gap-1 text-sm text-zinc-500 dark:text-zinc-400 hover:text-amber-500 transition-all active:scale-90" @click="scrollToComments">
            <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
            <span>{{ compactNumber(tweet.commentCount) }}</span>
          </button>
          <button class="flex flex-col items-center gap-1 text-sm text-zinc-500 dark:text-zinc-400 hover:text-emerald-500 transition-all active:scale-90" @click="onShare">
            <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" /></svg>
            <span>分享</span>
          </button>
        </div>

        <!-- 评论区（占右侧主要高度，独立滚动） -->
        <div class="glass-card p-4 h-[480px] flex flex-col min-h-0">
          <CommentSection :cfg="commentCfg" ref="commentSection" />
        </div>
      </div>
    </div>

    <!-- 加载失败 -->
    <div v-else class="py-24 flex flex-col items-center gap-4">
      <div class="text-6xl"><svg class="w-14 h-14 mx-auto text-zinc-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg></div>
      <p class="text-zinc-500 dark:text-zinc-400">内容不存在或已被删除</p>
      <button class="px-4 py-2 rounded-[5%] glass-card text-sm text-zinc-600 dark:text-zinc-300 hover: transition-all" @click="goBack">返回</button>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import CommentSection from '@/components/comment/CommentSection.vue'
import VideoPlayer from '@/components/video/VideoPlayer.vue'
import { getTweetDetail, toggleLike, toggleFavorite, recordView, shareTweet } from '@/api/tweet'
import { getComments, addComment, deleteComment, getReplies } from '@/api/comment'
import { getFollowing, follow, unfollow } from '@/api/follow'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import { submitReport } from '@/api/report'
import { renderMarkdown, looksLikeMarkdown } from '@/utils/markdown'
import { compactNumber, relativeTime } from '@/utils/format'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const toast = useToastStore()

const tweet = ref(null)

// 评论配置（通用评论组件，tweets 后端：分页 + 排序 + 回复折叠）
const commentCfg = {
  idField: 'commentGuid',
  contentField: 'content',
  timeField: 'createTime',
  likeCountField: 'likeCount',
  replyCountField: 'replyCount',
  imagesField: '',
  images: false,
  sortable: true,
  replyMode: 'fold',
  loader: (params) => getComments(tweet.value && tweet.value.tweetGuid, params),
  creator: (payload) => addComment({ ...payload, tweetGuid: tweet.value && tweet.value.tweetGuid }),
  remove: (id) => deleteComment(id),
  replyLoader: (parentId) => getReplies(parentId),
  parseList: (data) => {
    const list = (data && (data.items || data.list)) || []
    return { items: list, total: (data && (data.totalCount ?? data.total)) || list.length, hasMore: list.length >= 20 }
  },
  authorName: (c) => (c.user && c.user.userName) || '用户',
  authorId: (c) => c.user && c.user.userGuid,
  like: null,
  unlike: null
}

const isMarkdown = computed(() => !!tweet.value && looksLikeMarkdown(tweet.value.content))
const renderedMarkdown = computed(() => (tweet.value ? renderMarkdown(tweet.value.content) : ''))
const detail = ref({ isLiked: false, isFavorited: false, isCoined: false })
const loading = ref(true)
const isFollowing = ref(false)
const activeMedia = ref(0)
const commentSection = ref(null)
const mediaFailed = ref(false)

const isVideo = computed(() => !!tweet.value && !!tweet.value.isVideo)
const mediaUrls = computed(() => (tweet.value && tweet.value.mediaUrls) || [])
const authorName = computed(() => {
  const a = tweet.value && tweet.value.author
  return a ? (a.userName || a.name || a.nickname || '用户') : '用户'
})
const authorAvatar = computed(() => (tweet.value && tweet.value.author && tweet.value.author.avatar) || '')
const authorBio = computed(() => (tweet.value && tweet.value.author && tweet.value.author.bio) || '这个人很懒，什么都没有写')
const authorId = computed(() => {
  const a = tweet.value && tweet.value.author
  return a ? (a.userGuid || a.id) : ''
})
const isAuthor = computed(() => !!authorId.value && !!auth.user && auth.user.id === authorId.value)

// 富文本解析：段落 / 引用块（> 开头）
const bodyBlocks = computed(() => {
  const body = (tweet.value && tweet.value.body) || tweet.value.content || ''
  return body.split('\n').map(line => {
    const t = line.trim()
    if (t.startsWith('> ')) return { type: 'quote', text: t.slice(2) }
    return { type: 'p', text: line }
  }).filter(b => b.type === 'quote' || b.text.trim())
})

// @提及高亮
function highlightMentions(text) {
  const parts = []
  const re = /@([一-龥\w-]+)/g
  let last = 0
  let m
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push({ type: 'text', text: text.slice(last, m.index) })
    parts.push({ type: 'mention', name: m[1] })
    last = m.index + m[0].length
  }
  if (last < text.length) parts.push({ type: 'text', text: text.slice(last) })
  return parts.length ? parts : [{ type: 'text', text }]
}

async function load() {
  loading.value = true
  try {
    const res = await getTweetDetail(route.params.id)
    const data = res && res.data ? res.data : res
    tweet.value = data.tweet || data
    detail.value = {
      isLiked: !!(data.isLiked !== undefined ? data.isLiked : tweet.value.isLiked),
      isFavorited: !!(data.isFavorited !== undefined ? data.isFavorited : tweet.value.isFavorited),
      isCoined: !!data.isCoined
    }
    // 记录浏览
    if (tweet.value && tweet.value.tweetGuid) recordView(tweet.value.tweetGuid)
    // 关注状态：拉取我关注的人列表比对（后端暂无 is-following 端点）
    if (authorId.value) {
      try {
        const f = await getFollowing({ page: 1, pageSize: 100 })
        const list = (f.data && (f.data.items || f.data.list)) || []
        isFollowing.value = list.some(u => String(u.userGuid) === String(authorId.value))
      } catch (e) {
        isFollowing.value = false
      }
    }
  } catch (e) {
    console.error('加载详情失败:', e)
    tweet.value = null
  } finally {
    loading.value = false
  }
}

async function onLike() {
  if (!tweet.value) return
  const liked = !detail.value.isLiked
  const prev = tweet.value.likeCount
  detail.value.isLiked = liked
  tweet.value.likeCount = Math.max(0, prev + (liked ? 1 : -1))
  try {
    await toggleLike(tweet.value.tweetGuid, liked)
  } catch (e) {
    detail.value.isLiked = !liked
    tweet.value.likeCount = prev
  }
}

async function onFavorite() {
  if (!tweet.value) return
  const favorited = !detail.value.isFavorited
  const prev = tweet.value.favoriteCount
  detail.value.isFavorited = favorited
  tweet.value.favoriteCount = Math.max(0, prev + (favorited ? 1 : -1))
  try {
    await toggleFavorite(tweet.value.tweetGuid, favorited)
  } catch (e) {
    detail.value.isFavorited = !favorited
    tweet.value.favoriteCount = prev
  }
}

async function toggleFollow() {
  if (!authorId.value) return
  const target = !isFollowing.value
  isFollowing.value = target
  try {
    if (target) await follow(authorId.value)
    else await unfollow(authorId.value)
    toast.push(target ? '关注成功' : '已取消关注', 'success')
  } catch (e) {
    isFollowing.value = !target
    toast.push('操作失败，请稍后重试', 'error')
  }
}

async function onShare() {
  if (!tweet.value) return
  try {
    await shareTweet(tweet.value.tweetGuid)
  } catch (e) { /* 后端失败不影响复制 */ }
  const url = window.location.origin + '/posts/' + tweet.value.tweetGuid
  try {
    await navigator.clipboard.writeText(url)
  } catch (e) {
    // 剪贴板不可用时降级
    const ta = document.createElement('textarea')
    ta.value = url
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
  }
  toast.push('链接已复制', 'success')
}

function onMore() {
  reportOpen.value = true
  reportReason.value = ''
}

// 举报弹窗状态
const reportOpen = ref(false)
const reportCategory = ref(0)
const reportReason = ref('')

const REPORT_CATEGORIES = ['色情低俗', '暴力', '政治敏感', '广告营销', '其他']

async function submitReportReport() {
  if (!tweet.value) return
  try {
    // 真实端点：POST /api/reports（Message）
    await submitReport({
      targetType: 'Tweet',
      targetGuid: tweet.value.tweetGuid,
      category: reportCategory.value,
      reason: reportReason.value.trim() || REPORT_CATEGORIES[reportCategory.value],
      evidenceUrls: []
    })
    toast.push('举报已提交，感谢你的反馈', 'success')
    reportOpen.value = false
  } catch (e) {
    toast.push('举报提交失败，请稍后重试', 'error')
  }
}

function onEdit() {
  toast.push('编辑功能开发中（Phase 7）', 'info')
}

function scrollToComments() {
  if (commentSection.value) {
    // 滚动到评论区容器
    commentSection.value.$el.closest('.glass-card')?.scrollIntoView({ behavior: 'smooth' })
  }
}

function goBack() {
  if (window.history.length > 1) router.back()
  else router.push('/home')
}

function goCircle() {
  toast.push('社区页开发中（Phase 3）', 'info')
}

function goAuthor() {
  if (authorId.value) router.push(`/users/${authorId.value}`)
}

function goUser(name) {
  toast.push(`@${name} 用户主页开发中（Phase 5）`, 'info')
}

function prevMedia() {
  activeMedia.value = (activeMedia.value - 1 + mediaUrls.value.length) % mediaUrls.value.length
}

function nextMedia() {
  activeMedia.value = (activeMedia.value + 1) % mediaUrls.value.length
}

function onMediaError() {
  mediaFailed.value = true
}

function hideAvatar(e) {
  e.target.style.visibility = 'hidden'
}

function onKeydown(e) {
  if (e.key === 'Escape') goBack()
}

watch(() => route.params.id, () => {
  activeMedia.value = 0
  load()
})

onMounted(() => {
  load()
  window.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
})
</script>

<style scoped>
.fade-enter-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from {
  opacity: 0;
}
</style>
