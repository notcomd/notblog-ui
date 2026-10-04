<template>
  <!-- relative：骨架屏退场时用 position:absolute 脱离文档流（避免与真实卡片同时占位造成跳位），
       需要本节点作为其定位参照 -->
  <section class="relative" :aria-busy="loading">
    <!-- 3列瀑布流（桌面常显） -->
    <!-- 瀑布流：columns 多列交错（视频 1:1 与图文 9:16 混排无空隙，视觉更自然） -->
    <!-- 卡片入场由 anime.js 驱动（见 script 的 playCardsIn），故不再用 CSS staggered 类 -->
    <div ref="gridEl" class="columns-3 gap-5">
      <div v-for="(post, i) in posts" :key="keyOf(post, i)" class="break-inside-avoid mb-5">
        <PostCard :post="post" />
      </div>
    </div>

    <!-- 加载中：骨架屏（与真实栅格同宽同列，形状模拟图文/视频交错比例）。
         只在尚无内容时铺满呈现；已有内容时改用下方轻量指示，避免整页高度暴涨 -->
    <Transition name="qm-skel">
      <div v-if="showSkeleton" class="columns-3 gap-5" role="status">
        <span class="sr-only">正在加载内容…</span>
        <div v-for="i in 6" :key="i" class="break-inside-avoid mb-5" aria-hidden="true">
          <!-- 逐张错开微光相位（--qm-shimmer-delay 由 .qm-shimmer::after 读取） -->
          <div class="overflow-hidden qm-shimmer" :style="{ '--qm-shimmer-delay': `${(i - 1) * 0.12}s` }">
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
    </Transition>

    <!-- 追加加载更多：轻量指示（不铺骨架卡，避免页面高度突增导致滚动跳位） -->
    <div v-if="showMoreIndicator" class="py-6 flex items-center justify-center gap-2.5 text-sm text-zinc-400" role="status">
      <span class="w-4 h-4 rounded-full border-2 border-zinc-300 dark:border-zinc-600 border-t-amber-500 animate-spin" aria-hidden="true"></span>
      正在加载更多…
    </div>

    <!-- 加载失败：不再自动重试（否则哨兵会立刻重新触发，形成请求风暴），改为显式重试 -->
    <div v-if="showErrorState" class="qm-rise py-20 flex flex-col items-center text-center gap-3" role="status">
      <div class="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
        <svg class="w-8 h-8 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v4M12 16h.01" />
        </svg>
      </div>
      <p class="text-base font-medium text-zinc-700 dark:text-zinc-200">内容加载失败</p>
      <p class="text-sm text-zinc-500 dark:text-zinc-400 max-w-[36ch] leading-relaxed">网络或服务暂时不可用，请稍后重试。</p>
      <button class="mt-1 h-9 px-4 rounded-[5%] text-sm font-medium bg-amber-400/15 text-amber-600 dark:text-amber-300 hover:bg-amber-400/25 active:scale-95 transition-[background-color,transform] duration-200" type="button" @click="reload">重试</button>
    </div>

    <!-- 追加分页失败：已加载内容保留，只在底部给一个重试入口 -->
    <div v-else-if="loadError && posts.length > 0" class="py-6 flex items-center justify-center gap-3 text-sm text-zinc-400" role="status">
      <span>加载更多失败</span>
      <button class="h-8 px-3 rounded-[5%] text-sm font-medium text-amber-600 dark:text-amber-300 hover:bg-amber-400/15 active:scale-95 transition-[background-color,transform] duration-200" type="button" @click="retryMore">重试</button>
    </div>

    <!-- 空状态：图标 + 标题 + 说明 + 可执行动作，而不是一句孤立文案 -->
    <div v-if="showEmpty" class="qm-rise py-20 flex flex-col items-center text-center gap-3">
      <div class="w-16 h-16 rounded-full bg-amber-400/12 dark:bg-amber-400/10 flex items-center justify-center">
        <svg class="w-8 h-8 text-amber-400/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M7 20h10" />
          <path d="M12 20v-8" />
          <path d="M12 12c0-4-2-7-6-7 0 4 2 7 6 7z" />
          <path d="M12 12c0-3 2-5 5-5 0 3-2 5-5 5z" />
        </svg>
      </div>
      <p class="text-base font-medium text-zinc-700 dark:text-zinc-200">{{ emptyTitle }}</p>
      <p class="text-sm text-zinc-500 dark:text-zinc-400 max-w-[36ch] leading-relaxed">{{ emptyText }}</p>
      <button
        class="mt-1 h-9 px-4 rounded-[5%] text-sm font-medium bg-amber-400/15 text-amber-600 dark:text-amber-300 hover:bg-amber-400/25 active:scale-95 transition-[background-color,transform] duration-200"
        type="button"
        @click="reload"
      >刷新</button>
    </div>

    <!-- 触底加载更多哨兵：v-if 会在加载中/无更多/失败时移除，故用 watch 动态接管 observe。
         失败时一并移除，避免「失败→立即重试」的请求风暴 -->
    <div v-if="hasMore && !loading && !loadError" ref="sentinel" class="h-10"></div>
    <div v-if="!hasMore && posts.length > 0" class="py-8 text-center text-sm text-zinc-400">— 已经到底啦 —</div>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onActivated, onMounted, onUnmounted, ref, watch } from 'vue'
import { animate, stagger } from 'animejs'
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
  emptyTitle?: string
}
const props = withDefaults(defineProps<Props>(), {
  emptyText: '还没有内容，快来发布第一条吧～',
  emptyTitle: '这里还很安静'
})

const posts = ref<unknown[]>([])
const loading = ref(false)
const page = ref(0)
const size = 9
const hasMore = ref(true)
// 加载失败标记：失败后不自动重试（哨兵移除），由用户点「重试」显式恢复
const loadError = ref(false)
// 卡片退场动画进行中：此时 posts 尚未清空，需挡掉「正在加载更多」指示，避免切换时闪一下
const outPhasing = ref(false)
const sentinel = ref<HTMLElement | null>(null)
const gridEl = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null

// 在途请求代次：Tab 切换/重载会让旧请求作废，避免过期响应覆盖新数据
let generation = 0

/** 首个真实数据到达前才铺满骨架；已有内容时用轻量指示（防止页面高度突增引起滚动跳位） */
const showSkeleton = computed<boolean>(() => loading.value && posts.value.length === 0 && !outPhasing.value)
const showMoreIndicator = computed<boolean>(() => loading.value && posts.value.length > 0 && !outPhasing.value)
const showErrorState = computed<boolean>(() => !loading.value && loadError.value && posts.value.length === 0)
const showEmpty = computed<boolean>(() => !loading.value && !loadError.value && posts.value.length === 0)

function keyOf(post: unknown, index: number): string {
  const guid = getTweetGuid(post)
  // guid 缺失时回退到下标，避免空 key 造成列表复用错乱
  return guid || `post-${index}`
}

function getTweetGuid(post: unknown): string {
  if (typeof post === 'object' && post !== null && 'tweetGuid' in post) {
    return String((post as { tweetGuid: unknown }).tweetGuid)
  }
  return ''
}

// ==================== 卡片动效（anime.js） ====================
let anims: { cancel: () => void }[] = []

const reduceMotion = (): boolean =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

const gridChildren = (): HTMLElement[] =>
  gridEl.value ? (Array.from(gridEl.value.children) as HTMLElement[]) : []

function cancelAnims(): void {
  anims.forEach((a) => a.cancel())
  anims = []
}

/** 兜底显露：动画不可用/出错时必须让内容可见，绝不把卡片留在 opacity 0 */
function revealAll(items: HTMLElement[]): void {
  items.forEach((n) => {
    n.style.opacity = '1'
    n.style.transform = 'none'
  })
}

/**
 * 卡片入场：自下而上错峰浮现，只动本次新增的卡片（追加加载时不重播已有卡片）。
 * @param fromIndex 本次新增卡片在栅格子节点中的起始下标
 */
function playCardsIn(fromIndex: number): void {
  const items = gridChildren().slice(fromIndex)
  if (!items.length) return
  if (reduceMotion()) {
    revealAll(items)
    return
  }
  cancelAnims()
  try {
    // 先同步压到透明：anime.js 的 from 值要到补间开始才写入，
    // 否则会先以完整不透明度绘制一帧再跳回（登录页三屏动画踩过同一个坑）
    items.forEach((n) => {
      n.style.opacity = '0'
    })
    anims = [animate(items, {
      opacity: [0, 1],
      translateY: [16, 0],
      duration: 460,
      delay: stagger(55),
      ease: 'outQuart'
    })]
  } catch (e) {
    console.error('卡片入场动画失败，直接显示内容:', e)
    revealAll(items)
  }
}

/** 卡片退场：Tab 切换时先平滑收起旧内容，避免瞬间清空的生硬跳变（退场比入场快） */
function playCardsOut(): Promise<void> {
  const items = gridChildren()
  if (!items.length || reduceMotion()) return Promise.resolve()
  cancelAnims()
  return new Promise((resolve) => {
    let settled = false
    const settle = (): void => {
      if (settled) return
      settled = true
      resolve()
    }
    try {
      anims = [animate(items, {
        opacity: [1, 0],
        translateY: [0, -8],
        duration: 150,
        delay: stagger(18),
        ease: 'inQuad',
        onComplete: settle
      })]
    } catch (e) {
      settle()
      return
    }
    // 兜底：动画被 cancel 时 onComplete 不再触发，避免切换流程悬挂
    setTimeout(settle, 420)
  })
}

// ==================== 数据加载 ====================
async function loadMore(reset = false): Promise<void> {
  // 追加加载进行中就不再重复触发；reset（Tab 切换/重载）总是放行并作废在途请求
  if (loading.value && !reset) return

  const gen = reset ? ++generation : generation
  loading.value = true
  try {
    if (reset) {
      // 先让旧内容退场（此时 posts 仍在，不会闪出骨架屏），再清空重新拉取
      outPhasing.value = true
      await playCardsOut()
      outPhasing.value = false
      if (gen !== generation) return
      cancelAnims()
      posts.value = []
      page.value = 0
      hasMore.value = true
    }
    if (!hasMore.value) return

    const startIndex = reset ? 0 : posts.value.length
    const res: unknown = await props.loader({ page: page.value + 1, pageSize: size })
    // 期间用户已切到别的 Tab：丢弃过期响应，不覆盖新数据
    if (gen !== generation) return

    const data = (res && (res as { data?: FeedData }).data) ? (res as { data: FeedData }).data : (res as FeedData)
    const list = data.list || data.items || []
    posts.value = reset ? list : [...posts.value, ...list]
    page.value = data.page || page.value + 1
    hasMore.value = list.length >= size && (posts.value.length < (data.total || Infinity))
    loadError.value = false

    // 等新卡片挂到 DOM 后再播入场（与元素创建同一微任务批次，避免闪一帧完整内容）
    await nextTick()
    if (gen === generation) playCardsIn(startIndex)
  } catch (e) {
    if (gen === generation) {
      console.error('加载信息流失败:', e)
      loadError.value = true
    }
  } finally {
    outPhasing.value = false
    if (gen === generation) loading.value = false
  }
}

/** 整页重载（空状态 / 首屏失败）：清空后重新拉第 1 页 */
function reload(): void {
  loadError.value = false
  void loadMore(true)
}

/** 分页重试：保留已加载内容，只重发失败的那一页（loadMore(false) 会接着当前 page 请求并追加） */
function retryMore(): void {
  loadError.value = false
  void loadMore(false)
}

onMounted(() => {
  void loadMore(true)
  observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) void loadMore()
  }, { rootMargin: '200px' })
})

// 哨兵随 loading/hasMore 挂载卸载，必须在其出现时接管 observe，
// 否则首次加载完成后哨兵虽已渲染却无人监听，触底加载永远不会触发
watch(sentinel, (el) => {
  if (!observer) return
  observer.disconnect()
  if (el) observer.observe(el)
})

onUnmounted(() => {
  cancelAnims()
  if (observer) observer.disconnect()
})

// keep-alive 复用时若上次是空/失败结果，补拉一次，避免回来看到空白
onActivated(() => {
  if (!posts.value.length && !loading.value) void loadMore(true)
})

// loader 变化（热门/最新切换、社区切换）时重置并重新拉取
watch(() => props.loader, () => {
  void loadMore(true)
})
</script>