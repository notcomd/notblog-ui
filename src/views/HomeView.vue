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

    <!-- 视频区块：视频发布已不再进入 Message 时间线，这里补回展示（独立拉取、独立降级） -->
    <VideoSection />

    <PostGrid :loader="loader" :empty-text="emptyText" :empty-title="emptyTitle" />
  </div>
</template>

<script lang="ts">
export default { name: 'HomeView' }
</script>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import PostGrid from '@/components/post/PostGrid.vue'
import VideoSection from '@/components/video/VideoSection.vue'
import { getTimeline, getTrending } from '@/api/tweet'
import { useAuthStore } from '@/stores/auth'
import { useFeedTabStore } from '@/stores/feedTab'

const route = useRoute()
const auth = useAuthStore()
// 热门/最新切换状态：由全局 TopBar 切换，此处只消费
const feedTab = useFeedTabStore()

// URL 是 Tab 的真源（TopBar 写入），这里把它读回 store：
// 首次进入按 ?tab= 定位，浏览器前进/后退也能同步切换
watch(() => route.query.tab, (raw) => feedTab.syncFromQuery(raw), { immediate: true })

// 不按 Tab 加 key：PostGrid 内部会在 loader 变化时先让旧卡片退场再拉新数据，
// 强行 remount 会跳过退场动画（内容瞬间清空），也会丢掉无限滚动的已加载页
// 包一层以匹配 PostGrid 的 (page, pageSize) 加载器签名（直接传 API 函数参数类型不兼容）
const loader = computed(() => {
  const fn = feedTab.tab === 'latest' ? getTimeline : getTrending
  return (params: { page: number; pageSize: number }): Promise<unknown> => fn(params)
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