<template>
  <div class="relative">
    <!-- 3列等宽网格（<1200px 自适应 2 列） -->
    <!-- 瀑布流：columns 多列交错（视频 1:1 与图文 9:16 混排无空隙，视觉更自然） -->
    <div class="columns-1 sm:columns-2 xl:columns-3 gap-5 qm-stagger">
      <div v-for="(post, i) in posts" :key="getTweetGuid(post)" class="break-inside-avoid mb-5" :style="{ animationDelay: (i * 60) + 'ms' }">
        <PostCard :post="post" />
      </div>
    </div>

    <!-- 加载中：骨架屏（瀑布流，模拟图文/视频交错比例） -->
    <div v-if="loading" class="columns-1 sm:columns-2 xl:columns-3 gap-5 mt-5" role="status">
      <div v-for="i in 6" :key="i" class="break-inside-avoid mb-5">
        <div class="glass-card overflow-hidden animate-pulse">
          <div class="bg-zinc-200/70 dark:bg-zinc-800/70" :class="i % 4 === 3 ? 'aspect-square' : 'aspect-[9/16]'"></div>
          <div class="p-4 space-y-2">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-full bg-zinc-200/70 dark:bg-zinc-800/70"></div>
              <div class="h-3 flex-1 rounded bg-zinc-200/70 dark:bg-zinc-800/70"></div>
            </div>
            <div class="h-3 w-4/5 rounded bg-zinc-200/70 dark:bg-zinc-800/70"></div>
            <div class="h-3 w-3/5 rounded bg-zinc-200/70 dark:bg-zinc-800/70"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="!loading && posts.length === 0" class="py-24 flex flex-col items-center gap-4">
      <div class="text-6xl"><svg class="w-14 h-14 mx-auto text-zinc-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 20h10"/><path d="M12 20v-8"/><path d="M12 12c0-4-2-7-6-7 0 4 2 7 6 7z"/><path d="M12 12c0-3 2-5 5-5 0 3-2 5-5 5z"/></svg></div>
      <p class="text-zinc-500 dark:text-zinc-400">{{ emptyText }}</p>
    </div>

    <!-- 触底加载更多 -->
    <div v-if="hasMore && !loading" ref="sentinel" class="h-10"></div>
    <div v-if="!hasMore && posts.length > 0" class="py-8 text-center text-sm text-zinc-400">— 已经到底啦 —</div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import PostCard from './PostCard.vue'

interface LoaderParams {
  page: number
  pageSize: number
}

interface FeedData {
  list?: unknown[]
  items?: unknown[]
  page?: number
  total?: number
}

interface Props {
  // 数据加载函数：(page, size) => Promise<{ list, total, page, size }>
  loader: (params: LoaderParams) => Promise<unknown>
  emptyText?: string
}
const props = withDefaults(defineProps<Props>(), {
  emptyText: '还没有内容，快来发布第一条吧～'
})

const posts = ref<unknown[]>([])
const loading = ref(false)
const page = ref(0)
const size = 9
const hasMore = ref(true)
const sentinel = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null

function getTweetGuid(post: unknown): string {
  if (typeof post === 'object' && post !== null && 'tweetGuid' in post) {
    return String((post as { tweetGuid: unknown }).tweetGuid)
  }
  return ''
}

async function loadMore(reset = false) {
  if (loading.value) return
  if (reset) {
    posts.value = []
    page.value = 0
    hasMore.value = true
  }
  if (!hasMore.value) return

  loading.value = true
  try {
    const res: unknown = await props.loader({ page: page.value + 1, pageSize: size })
    const data = (res && (res as { data?: FeedData }).data) ? (res as { data: FeedData }).data : (res as FeedData)
    const list = data.list || data.items || []
    posts.value = reset ? list : [...posts.value, ...list]
    page.value = data.page || page.value + 1
    hasMore.value = list.length >= size && (posts.value.length < (data.total || Infinity))
  } catch (e) {
    console.error('加载信息流失败:', e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadMore(true)
  observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) loadMore()
  }, { rootMargin: '200px' })
  if (sentinel.value) observer.observe(sentinel.value)
})

onUnmounted(() => {
  if (observer) observer.disconnect()
})

// loader 变化（如社区切换）时重置
watch(() => props.loader, () => loadMore(true))
</script>
