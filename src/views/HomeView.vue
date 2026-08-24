<template>
  <div class="max-w-[1400px] mx-auto">
    <!-- 未登录引导条 -->
    <div v-if="!auth.isLoggedIn()" class="mb-5 glass-card px-4 py-3 flex flex-wrap items-center gap-3 bg-gradient-to-r from-amber-400/10 to-orange-400/5">
      <span class="text-2xl shrink-0"><svg class="w-7 h-7 mx-auto text-zinc-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></span>
      <p class="text-sm text-zinc-600 dark:text-zinc-300 flex-1 min-w-0">登录后解锁最新动态、点赞收藏评论等全部互动功能</p>
      <button class="px-4 h-9 shrink-0 rounded-[5%] text-sm font-medium bg-gradient-to-r from-amber-400 to-orange-500 text-white hover: active:scale-95 transition-all" @click="router.push('/login')">立即登录</button>
    </div>

    <PostGrid :loader="feedTab.tab === 'latest' ? getTimeline : getTrending" :key="feedTab.tab" :empty-text="emptyText" />
  </div>
</template>

<script lang="ts">
export default { name: 'HomeView' }
</script>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import PostGrid from '@/components/post/PostGrid.vue'
import { getTimeline, getTrending } from '@/api/tweet'
import { useAuthStore } from '@/stores/auth'
import { useFeedTabStore } from '@/stores/feedTab'

const auth = useAuthStore()
const router = useRouter()
// 热门/最新切换状态：由全局 TopBar 切换，此处只消费
const feedTab = useFeedTabStore()

const emptyText = computed<string>(() => {
  if (!auth.isLoggedIn()) return '登录后查看最新动态与更多内容'
  return feedTab.tab === 'latest' ? '暂无最新动态，去看看热门内容吧' : '暂无热门内容'
})
</script>
