<template>
  <div class="max-w-[1400px] mx-auto">
    <!-- 页头 -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-zinc-800 dark:text-zinc-100">主页</h1>
        <p class="text-sm text-zinc-400 mt-1">关注的人的最新动态，都在这里</p>
      </div>
      <div class="flex gap-2 glass-card p-1">
        <button class="px-4 py-1.5 rounded-[5%] text-sm font-medium transition-all" :class="tab === 'follow' ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 dark:text-zinc-200'" @click="switchTab('follow')">
          <span v-if="!auth.isLoggedIn()" class="mr-1">🔒</span>关注
        </button>
        <button class="px-4 py-1.5 rounded-[5%] text-sm font-medium transition-all" :class="tab === 'hot' ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 dark:text-zinc-200'" @click="switchTab('hot')">热门</button>
      </div>
    </div>

    <!-- 未登录引导条 -->
    <div v-if="!auth.isLoggedIn()" class="mb-5 glass-card px-4 py-3 flex items-center gap-3 bg-gradient-to-r from-amber-400/10 to-orange-400/5">
      <span class="text-2xl">🔒</span>
      <p class="text-sm text-zinc-600 dark:text-zinc-300 flex-1">登录后解锁关注动态、点赞收藏评论等全部互动功能</p>
      <button class="px-4 h-9 rounded-[5%] text-sm font-medium bg-gradient-to-r from-amber-400 to-orange-500 text-white hover: active:scale-95 transition-all" @click="router.push('/login')">立即登录</button>
    </div>

    <PostGrid :loader="tab === 'follow' ? getTimeline : getTrending" :key="tab" :empty-text="emptyText" />
  </div>
</template>

<script>
export default { name: 'HomeView' }
</script>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import PostGrid from '@/components/post/PostGrid.vue'
import { getTimeline, getTrending } from '@/api/tweet'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'

const auth = useAuthStore()
const toast = useToastStore()
const router = useRouter()

const tab = ref(auth.isLoggedIn() ? 'follow' : 'hot')

const emptyText = computed(() => {
  if (!auth.isLoggedIn()) return '登录后查看关注动态与更多内容'
  return tab.value === 'follow' ? '关注的人还没有动态，去探索页发现更多兴趣吧' : '暂无热门内容'
})

function switchTab(t) {
  // 关注 Tab 需要登录
  if (t === 'follow' && !auth.isLoggedIn()) {
    toast.push('请先登录后再查看关注动态', 'info')
    router.push('/login')
    return
  }
  if (tab.value !== t) tab.value = t
}
</script>
