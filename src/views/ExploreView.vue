<template>
  <div class="max-w-[1400px] mx-auto">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-zinc-800 dark:text-zinc-100">探索</h1>
        <p class="text-sm text-zinc-400 mt-1">发现全网热门，看看大家都在关注什么</p>
      </div>
      <div class="flex gap-2 glass-card p-1">
        <button class="px-4 py-1.5 rounded-[5%] text-sm font-medium transition-all" :class="tab === 'hot' ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 dark:text-zinc-200'" @click="tab = 'hot'">🔥 热门</button>
        <button class="px-4 py-1.5 rounded-[5%] text-sm font-medium transition-all" :class="tab === 'follow' ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 dark:text-zinc-200'" @click="tab = 'follow'">✨ 关注动态</button>
      </div>
    </div>

    <PostGrid :loader="tab === 'hot' ? getTrending : getTimeline" :key="tab" empty-text="暂时没有热门内容" />
  </div>
</template>

<script>
export default { name: 'ExploreView' }
</script>

<script setup>
import { ref } from 'vue'
import PostGrid from '@/components/post/PostGrid.vue'
import { getTimeline, getTrending } from '@/api/tweet'

const tab = ref('hot')
</script>
