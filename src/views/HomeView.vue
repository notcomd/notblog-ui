<template>
  <div class="max-w-[1400px] mx-auto">
    <!-- 页面标题：视觉标题已在顶部栏（广场 + Tab），此处只补语义，让文档大纲有 h1 -->
    <h1 class="sr-only">广场动态</h1>

    <!-- 未登录引导条：图标 + 两行说明 + 主 CTA，比单行渐变横幅更聚焦 -->
    <div v-if="!auth.isLoggedIn()" class="qm-rise mb-6 pl-4 py-1 border-l-2 border-amber-400/70 flex items-center gap-3.5">
      <span class="shrink-0 w-10 h-10 rounded-[5%] bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white">
        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      </span>
      <div class="min-w-0 flex-1">
        <p class="text-sm font-medium text-zinc-800 dark:text-zinc-100">登录后解锁全部互动</p>
        <p class="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400 truncate">最新动态、点赞、收藏与评论</p>
      </div>
      <router-link
        class="btn-sheen shrink-0 px-4 h-9 rounded-[5%] text-sm font-medium bg-gradient-to-r from-amber-400 to-orange-500 text-white hover:opacity-90 active:scale-95 transition-[opacity,transform] duration-200 inline-flex items-center"
        to="/login"
      >立即登录</router-link>
    </div>

    <!-- 广场：图文推文（Message）+ 视频（Video 服务）+ Markdown 博客，三源混合、不分类别、随机打散 -->
    <PostGrid :loader="loader" :card="PlazaCard" :empty-text="emptyText" :empty-title="emptyTitle" />
  </div>
</template>

<script lang="ts">
// 会话级随机种子（模块级：同一页面会话内顺序可复现，避免来回切页时顺序乱跳；整页刷新才是新顺序）
const PLAZA_SEED = (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0

export default { name: 'HomeView' }
</script>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import PostGrid from '@/components/post/PostGrid.vue'
import PlazaCard from '@/components/post/PlazaCard.vue'
import type { PlazaItem } from '@/components/post/PlazaCard.vue'
import { getTimeline, getTrending } from '@/api/tweet'
import { getVideos } from '@/api/video'
import { getMarkdownDocs } from '@/api/markdown'
import { unwrap } from '@/utils/response'
import { pickCoverUrl } from '@/utils/media'
import { toMillis } from '@/utils/format'
import { useAuthStore } from '@/stores/auth'
import { useFeedTabStore } from '@/stores/feedTab'

const route = useRoute()
const auth = useAuthStore()
// 热门/最新切换状态：由全局 TopBar 切换，此处只消费
const feedTab = useFeedTabStore()

// URL 是 Tab 的真源（TopBar 写入），这里把它读回 store：
// 首次进入按 ?tab= 定位，浏览器前进/后退也能同步切换
watch(() => route.query.tab, (raw) => feedTab.syncFromQuery(raw), { immediate: true })

// ==================== 三源混合瀑布流 ====================
// 数据来源：
//   图文/视频推文 → Message  GET /api/tweets/timeline（最新） | /api/tweets/trending（热门）
//   视频作品      → Video    GET /api/video（一次取回可见列表，客户端分批）
//   Markdown 博客 → Markdown GET /api/markdown?skip&take（公开已过审摘要）
// 合并后不分类别、每批打散后按列瀑布流（CSS columns）排布。

/** mulberry32：轻量确定性伪随机，用于「稳定但打散」的洗牌（种子见模块级 PLAZA_SEED） */
function createRng(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** 本组件的洗牌器（重建时会话内顺序可复现，避免同一会话内来回切换顺序乱跳） */
const rng = createRng(PLAZA_SEED)

function shuffled<T>(input: T[]): T[] {
  const arr = input.slice()
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function firstLine(text?: string): string {
  const t = String(text || '').replace(/\s+/g, ' ').trim()
  return t || '无标题内容'
}

function mapTweet(t: Record<string, any>): PlazaItem {
  const guid = String(t.tweetGuid || '')
  const author: Record<string, any> = t.author || {}
  return {
    tweetGuid: `post:${guid}`,
    id: guid,
    type: 'post',
    title: firstLine(t.content),
    cover: pickCoverUrl(t.mediaUrls),
    authorGuid: String(author.userGuid || ''),
    authorName: String(author.userName || author.nickName || ''),
    authorAvatar: String(author.avatar || ''),
    time: t.publishTime || t.createTime
  }
}

function mapVideo(v: Record<string, any>): PlazaItem {
  const guid = String(v.videoGuid || '')
  // 视频实体无独立作者字段：作者在 affiliated[]（发布者授权列表）首位
  const affiliated: string[] = Array.isArray(v.affiliated) ? v.affiliated : []
  return {
    tweetGuid: `video:${guid}`,
    id: guid,
    type: 'video',
    title: String(v.videoName || '未命名视频'),
    cover: String(v.videoCover || ''),
    authorGuid: String(affiliated[0] || ''),
    authorName: '',
    authorAvatar: '',
    time: v.timeSpace?.createAt || v.createTime
  }
}

function mapMarkdown(m: Record<string, any>): PlazaItem {
  const guid = String(m.markDownGuid || '')
  return {
    tweetGuid: `markdown:${guid}`,
    id: guid,
    type: 'markdown',
    title: String(m.name || '未命名文章'),
    cover: String(m.coverUrl || ''),
    // 摘要响应不含作者字段：作者 GUID 由卡片按文档 GUID 异步补取（见 utils/author）
    authorGuid: '',
    authorName: '',
    authorAvatar: '',
    time: m.createAt
  }
}

// 每个来源每次取多少条（PostGrid 的 pageSize=9 透传进来）
const SIZE = 9

// 各来源游标：page===1 视为一次新的加载（Tab 切换 / 重载），全部归零
let videoPool: Record<string, any>[] = []
let videoLoaded = false
let videoCursor = 0
let markdownSkip = 0

async function loadPlaza(params: { page: number; pageSize: number }): Promise<{ list: PlazaItem[]; page: number }> {
  const size = params.pageSize || SIZE
  if (params.page <= 1) {
    videoPool = []
    videoLoaded = false
    videoCursor = 0
    markdownSkip = 0
  }

  const tweetFn = feedTab.tab === 'latest' ? getTimeline : getTrending

  const tweetReq = tweetFn({ page: params.page, pageSize: size })
  // 视频接口无分页参数：首次取回整份可见列表（按发布时间倒序）后客户端分批
  const videoReq = (async (): Promise<Record<string, any>[]> => {
    if (!videoLoaded) {
      const raw = unwrap(await getVideos())
      videoPool = (Array.isArray(raw) ? raw : [])
        .filter((v: any) => v && v.videoGuid)
        .sort((a: any, b: any) => toMillis(b.timeSpace?.createAt) - toMillis(a.timeSpace?.createAt))
      videoLoaded = true
    }
    return videoPool.slice(videoCursor, videoCursor + size)
  })()
  const markdownReq = (async (): Promise<Record<string, any>[]> => {
    const raw = unwrap(await getMarkdownDocs({ skip: markdownSkip, take: size }))
    return Array.isArray(raw) ? raw : []
  })()

  // 单源失败静默降级（不刷屏、不影响其余来源）；三源全失败才算整页失败
  const [tweets, videos, marks] = await Promise.allSettled([tweetReq, videoReq, markdownReq])
  if (tweets.status === 'rejected' && videos.status === 'rejected' && marks.status === 'rejected') {
    throw (tweets as PromiseRejectedResult).reason
  }

  let tweetList: Record<string, any>[] = []
  if (tweets.status === 'fulfilled') {
    const d: any = unwrap(tweets.value)
    tweetList = d?.list || d?.items || []
  }
  const videoList = videos.status === 'fulfilled' ? videos.value : []
  const markList = marks.status === 'fulfilled' ? marks.value : []
  videoCursor += videoList.length
  markdownSkip += markList.length

  const list = shuffled([
    ...tweetList.map(mapTweet),
    ...videoList.map(mapVideo),
    ...markList.map(mapMarkdown)
  ])
  return { list, page: params.page }
}

// 不按 Tab 加 key：PostGrid 内部会在 loader 变化时先让旧卡片退场再拉新数据，
// 强行 remount 会跳过退场动画（内容瞬间清空），也会丢掉无限滚动的已加载页。
// 包一层以匹配 PostGrid 的 (page, pageSize) 加载器签名（直接传 API 函数参数类型不兼容）。
const loader = computed(() => {
  return (params: { page: number; pageSize: number }): Promise<unknown> => loadPlaza(params)
})

// 空态文案：访客看的是公开的「热门」，无需登录即可浏览，
// 因此不再把「登录」说成看内容的前提（登录只解锁互动与关注流）。
const emptyTitle = computed<string>(() =>
  auth.isLoggedIn() ? '这里还很安静' : '暂时还没有热门内容'
)

const emptyText = computed<string>(() => {
  if (!auth.isLoggedIn()) return '稍后再来看看，或登录后查看你关注的人的最新动态。'
  return feedTab.tab === 'latest'
    ? '你关注的人还没有发布内容。去热门看看大家都在聊什么吧。'
    : '暂时还没有热门内容，稍后再来看看。'
})
</script>
