<template>
  <!-- 首页视频区块：数据源 GET /api/video（返回原始 Videos 实体数组，经统一信封解包）。
       独立拉取 + 独立静默降级：加载失败或结果为空时整块隐藏，绝不影响下方时间线。
       空/失败不留突兀空框；加载态沿用信息流的 qm-shimmer 微光骨架。 -->
  <section
    v-if="loading || items.length"
    class="mt-10 border-t border-black/[0.06] pt-6 dark:border-white/[0.08]"
    :aria-busy="loading"
  >
    <!-- 区块标题 -->
    <!-- <div class="mb-5 flex items-center gap-3">
      <div class="flex h-10 w-10 items-center justify-center rounded-[5%] bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
        <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
          <path d="M10 8.5l6 3.5-6 3.5z" fill="currentColor" stroke="none" />
        </svg>
      </div>
      <div class="min-w-0">
        <h2 class="font-display text-lg font-bold text-zinc-800 dark:text-zinc-100">视频</h2>
        <p class="mt-0.5 text-xs text-zinc-400">最新发布的视频作品</p>
      </div>
    </div> -->

    <!-- 加载中：骨架 -->
    <div v-if="loading" class="grid grid-cols-2 gap-5 sm:grid-cols-3" role="status">
      <span class="sr-only">正在加载视频…</span>
      <div
        v-for="i in 3"
        :key="i"
        class="qm-shimmer overflow-hidden rounded-[5%]"
        :style="{ '--qm-shimmer-delay': `${(i - 1) * 0.12}s` }"
        aria-hidden="true"
      >
        <div class="aspect-video bg-zinc-200/70 dark:bg-zinc-800/70"></div>
        <div class="space-y-2 pt-3">
          <div class="h-3.5 w-4/5 rounded bg-zinc-200/70 dark:bg-zinc-800/70"></div>
          <div class="h-3 w-3/5 rounded bg-zinc-200/70 dark:bg-zinc-800/70"></div>
        </div>
      </div>
    </div>

    <!-- 列表：无框网格（发丝线区隔 + 中性悬浮，无描边/阴影） -->
    <div v-else class="grid grid-cols-2 gap-5 sm:grid-cols-3">
      <router-link
        v-for="v in items"
        :key="v.videoGuid"
        :to="`/videos/${v.videoGuid}`"
        class="group -m-1.5 block rounded-[5%] p-1.5 transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
      >
        <div class="relative aspect-video overflow-hidden rounded-[5%] bg-zinc-100 dark:bg-zinc-800">
          <img
            v-if="showCover(v)"
            :src="v.videoCover || ''"
            alt=""
            class="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
            loading="lazy"
            @error="onCoverError(v.videoGuid)"
          />
          <!-- 无封面 / 加载失败：柔和占位 -->
          <div
            v-else
            class="absolute inset-0 flex items-center justify-center text-zinc-300 dark:text-zinc-600"
            aria-hidden="true"
          >
            <svg class="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="M10 9.5l5 2.5-5 2.5z" fill="currentColor" stroke="none" />
            </svg>
          </div>
          <!-- 播放标识（装饰；跳转由整块链接承担） -->
          <div
            v-if="showCover(v)"
            class="pointer-events-none absolute inset-0 flex items-center justify-center"
            aria-hidden="true"
          >
            <div class="flex h-11 w-11 items-center justify-center rounded-full bg-black/45 text-white">
              <svg class="ml-0.5 h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
            </div>
          </div>
        </div>
        <div class="pt-3">
          <p class="truncate text-sm font-medium text-zinc-800 dark:text-zinc-100">{{ v.videoName || '未命名视频' }}</p>
          <p
            v-if="v.briefIntroduction"
            class="text-2lines mt-1 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400"
          >{{ v.briefIntroduction }}</p>
          <p v-if="v.timeSpace?.createAt" class="mt-1.5 text-[11px] font-numeric text-zinc-400">{{ relativeTime(v.timeSpace.createAt) }}</p>
        </div>
      </router-link>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onActivated, onMounted, ref } from 'vue'
import { getVideos } from '@/api/video'
import { unwrap } from '@/utils/response'
import { relativeTime, toMillis } from '@/utils/format'

// GET /api/video 返回的是原始 Videos 领域实体（非 DTO），此处只声明本区块展示所需的真实字段
interface HomeVideoItem {
  videoGuid: string
  videoName?: string
  briefIntroduction?: string
  videoCover?: string | null
  timeSpace?: { createAt?: string } | null
}

// 首页推荐位：只取少量最新条目
const MAX_ITEMS = 6

const items = ref<HomeVideoItem[]>([])
const loading = ref(false)
// 封面加载失败的视频 guid（失败即回退占位，不留破图空洞）
const brokenCovers = ref<Set<string>>(new Set())

function showCover(v: HomeVideoItem): boolean {
  return !!v.videoCover && !brokenCovers.value.has(v.videoGuid)
}

function onCoverError(guid: string): void {
  const next = new Set(brokenCovers.value)
  next.add(guid)
  brokenCovers.value = next
}

async function load(): Promise<void> {
  loading.value = true
  try {
    const raw = unwrap(await getVideos())
    const list: HomeVideoItem[] = Array.isArray(raw) ? (raw as HomeVideoItem[]) : []
    items.value = list
      .filter((v) => v && v.videoGuid)
      .sort((a, b) => toMillis(b.timeSpace?.createAt) - toMillis(a.timeSpace?.createAt))
      .slice(0, MAX_ITEMS)
  } catch {
    // 首页推荐位静默降级：失败即整块隐藏，不打断其它区块、不弹 toast
    items.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  void load()
})

// keep-alive 复用回来时，若上次为空/失败则补拉一次
onActivated(() => {
  if (!items.value.length && !loading.value) void load()
})
</script>
