<template>
  <!-- 社区资源 tab：聚合社区动态中的媒体（图片/视频封面），去重网格 -->
  <div class="mt-4">
    <div class="glass-card p-5">
      <div class="text-sm font-semibold text-zinc-700 dark:text-zinc-200 mb-4 inline-flex items-center gap-1.5"><svg aria-hidden="true" class="w-4 h-4 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>社区资源（{{ resources.length }}）</div>
      <div v-if="loading" class="py-12 text-center text-xs text-zinc-400">加载中…</div>
      <div v-else-if="resources.length === 0" class="py-12 text-center text-xs text-zinc-400">暂无资源，快去主页发布带图动态吧</div>
      <div v-else class="grid grid-cols-3 sm:grid-cols-4 gap-2">
        <div v-for="(r, i) in resources" :key="i" class="aspect-square rounded-[5%] overflow-hidden bg-zinc-100 dark:bg-zinc-800/60 group cursor-pointer" tabindex="0" @click="preview(i)" @keydown.enter.prevent="preview(i)" @keydown.space.prevent="preview(i)">
          <img :src="r.url" :alt="'资源 ' + (i + 1)" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" @error="hideImg" />
        </div>
      </div>
      <p class="mt-4 text-[10px] text-zinc-400">资源来自社区动态中的媒体</p>
    </div>

    <!-- 大图预览 -->
    <div v-if="previewIndex >= 0" class="fixed inset-0 z-[70] flex items-center justify-center bg-black/70" @click="previewIndex = -1">
      <img :src="resources[previewIndex]?.url" alt="" class="max-w-[85vw] max-h-[85vh] rounded-[5%] object-contain" />
      <button aria-label="关闭预览" class="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/50 text-white text-lg flex items-center justify-center hover:bg-black/70" @click="previewIndex = -1"><svg aria-hidden="true" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
    </div>
  </div>
</template>

<script setup lang="ts">
// 社区资源：circleLoader 拉取社区动态，提取 mediaUrls 去重展示
import { ref, watch } from 'vue'
import { getCirclePosts } from '@/api/circle'

interface CircleData {
  circleGuid?: string
}

interface Resource {
  url: string
}

const props = defineProps<{
  current: CircleData | null
}>()

const resources = ref<Resource[]>([])
const loading = ref(false)
const previewIndex = ref(-1)

watch(() => props.current?.circleGuid, () => {
  resources.value = []
  load()
}, { immediate: true })

async function load() {
  if (!props.current) return
  loading.value = true
  try {
    const res = await getCirclePosts(props.current.circleGuid, { page: 1, pageSize: 30 })
    const data = res && res.data ? res.data : res
    const list = (data.items || data.list || [])
    const seen = new Set()
    resources.value = []
    for (const p of list) {
      const urls = [...(p.mediaUrls || []), ...(p.cover ? [p.cover] : [])] as string[]
      for (const u of urls) {
        if (u && !seen.has(u)) {
          seen.add(u)
          resources.value.push({ url: u })
        }
      }
    }
  } catch (e) {
    resources.value = []
  } finally {
    loading.value = false
  }
}

function preview(i: number) {
  if (i >= 0 && i < resources.value.length) previewIndex.value = i
}

function hideImg(e: Event) { (e.target as HTMLElement).style.visibility = 'hidden' }
</script>
