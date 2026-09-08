<template>
  <div class="max-w-[1100px] mx-auto">
    <!-- ===== 顶部：搜索手账标题 + 大搜索框 ===== -->
    <div class="text-center pt-4 pb-8">
      <h1 class="text-2xl sm:text-3xl font-bold text-zinc-800 dark:text-zinc-100 font-display">搜索部落</h1>
      <p class="text-sm text-zinc-400 mt-1.5">搜文章、社区、好友与视频，从一段关键词开始探索</p>

      <div class="mt-6 max-w-xl mx-auto">
        <div class="relative">
          <svg class="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
          <input
            v-model="keyword"
            name="globalSearch"
            aria-label="输入关键词搜索"
            autocomplete="off"
            spellcheck="false"
            class="w-full h-12 pl-12 pr-32 rounded-2xl bg-white/80 dark:bg-zinc-800/80 border border-zinc-200/70 dark:border-zinc-700/60 text-sm outline-none focus:ring-2 focus:ring-amber-400/50 transition-all shadow-sm"
            placeholder="搜文章、社区、好友或视频…"
            @keyup.enter="onSearch"
          />
          <button
            type="button"
            class="btn-sheen absolute right-2 top-1/2 -translate-y-1/2 h-9 px-5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-white text-sm font-medium transition-all active:scale-95 disabled:opacity-50"
            :disabled="!keyword.trim() || loading"
            @click="onSearch"
          >搜索</button>
        </div>
        <p class="text-[11px] text-zinc-400 mt-2">图文博客暂不支持搜索，敬请期待</p>
      </div>
    </div>

    <!-- ===== 关键词未输入：引导态 ===== -->
    <div v-if="!searched" class="py-20 flex flex-col items-center gap-4 text-zinc-400">
      <div class="text-6xl"><svg class="w-16 h-16 text-zinc-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/><path d="M8 11h6"/><path d="M11 8v6"/></svg></div>
      <p class="text-sm">输入关键词，探索部落里的文章与社区</p>
    </div>

    <template v-else>
      <!-- ===== Tab：全部 / 文章 / 社区 / 好友 / 视频 ===== -->
      <div class="flex flex-wrap items-center gap-2 mb-6">
        <button
          v-for="tab in TABS"
          :key="tab.key"
          type="button"
          class="h-9 px-4 rounded-full text-xs font-medium transition-all inline-flex items-center gap-1.5"
          :class="activeTab === tab.key ? 'bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow' : 'bg-white/60 dark:bg-zinc-800/60 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 border border-zinc-200/60 dark:border-zinc-700/60'"
          :aria-pressed="activeTab === tab.key"
          @click="switchTab(tab.key)"
        >
          <span class="w-1.5 h-1.5 rounded-full" :class="tab.dot" aria-hidden="true"></span>
          {{ tab.label }}
          <span class="font-numeric text-[10px] opacity-60" v-if="searched">{{ typeCount(tab.key) }}</span>
        </button>
      </div>

      <!-- ===== 加载中：骨架 ===== -->
      <div v-if="loading" class="space-y-3" role="status">
        <div v-for="i in 4" :key="i" class="glass-card p-4 flex items-center gap-4 animate-pulse">
          <div class="w-12 h-12 rounded-xl bg-zinc-200/70 dark:bg-zinc-800/70"></div>
          <div class="flex-1 space-y-2">
            <div class="h-4 w-1/3 rounded bg-zinc-200/70 dark:bg-zinc-800/70"></div>
            <div class="h-3 w-1/2 rounded bg-zinc-200/70 dark:bg-zinc-800/70"></div>
          </div>
        </div>
      </div>

      <!-- ===== 结果 ===== -->
      <div v-else-if="visibleItems.length" class="qm-stagger space-y-3">
        <template v-for="(item, i) in visibleItems" :key="item.type + '-' + item.id + '-' + i">
          <button
            type="button"
            class="w-full text-left glass-card p-4 flex items-center gap-4 card-lift qm-nudge rounded-2xl"
            :style="{ animationDelay: (i * 60) + 'ms' }"
            @click="openItem(item)"
          >
            <!-- 封面/头像 -->
            <div class="w-12 h-12 rounded-xl overflow-hidden shrink-0 flex items-center justify-center text-white" :class="typeStyle(item.type).seal">
              <img v-if="item.cover" :src="item.cover" :alt="item.title" class="w-full h-full object-cover" loading="lazy" @error="hideImg" />
              <svg v-else class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" v-html="typeStyle(item.type).icon"></svg>
            </div>

            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 min-w-0">
                <span class="text-sm font-medium text-zinc-800 dark:text-zinc-100 truncate">{{ item.title }}</span>
                <span class="shrink-0 text-[10px] px-1.5 py-0.5 rounded-full" :class="typeStyle(item.type).badge">{{ typeStyle(item.type).label }}</span>
              </div>
              <div class="text-xs text-zinc-400 mt-0.5 truncate">{{ item.subtitle }}{{ item.meta ? ' · ' + item.meta : '' }}</div>
            </div>

            <svg class="w-4 h-4 shrink-0 text-zinc-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18l6-6-6-6" /></svg>
          </button>
        </template>
      </div>

      <!-- ===== 诚实空态 ===== -->
      <div v-else class="py-20 flex flex-col items-center gap-4 text-zinc-400">
        <div class="text-6xl"><svg class="w-16 h-16 text-zinc-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/><path d="M8 11h6"/></svg></div>
        <p class="text-sm">没有找到与「{{ keyword }}」相关的结果</p>
        <p class="text-xs text-zinc-400/80">换个关键词，或试试文章与社区</p>
      </div>
    </template>
  </div>
</template>

<script lang="ts">
export default { name: 'SearchView' }
</script>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToastStore } from '@/stores/toast'
import { searchAll, searchArticles, searchCircles, searchFriendsBy, searchVideos, type SearchItem } from '@/api/search'

type TabKey = 'all' | 'article' | 'circle' | 'friend' | 'video'

const TABS: { key: TabKey; label: string; dot: string }[] = [
  { key: 'all', label: '全部', dot: 'bg-zinc-400' },
  { key: 'article', label: '文章', dot: 'bg-emerald-500' },
  { key: 'circle', label: '社区', dot: 'bg-indigo-500' },
  { key: 'friend', label: '好友', dot: 'bg-amber-500' },
  { key: 'video', label: '视频', dot: 'bg-blue-500' }
]

const route = useRoute()
const router = useRouter()
const toast = useToastStore()

const keyword = ref('')
const activeTab = ref<TabKey>('all')
const loading = ref(false)
const searched = ref(false)
const items = ref<SearchItem[]>([])
const counts = ref<Record<Exclude<TabKey, 'all'>, number>>({ article: 0, circle: 0, friend: 0, video: 0 })

// 类型展示样式
const typeStyle = (t: SearchItem['type']): { label: string; seal: string; badge: string; icon: string } => ({
  article: { label: '文章', seal: 'bg-gradient-to-br from-emerald-400 to-teal-600', badge: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300', icon: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>' },
  circle: { label: '社区', seal: 'bg-gradient-to-br from-indigo-500 to-purple-600', badge: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300', icon: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>' },
  friend: { label: '好友', seal: 'bg-gradient-to-br from-amber-400 to-orange-500', badge: 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300', icon: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>' },
  video: { label: '视频', seal: 'bg-gradient-to-br from-blue-500 to-indigo-600', badge: 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300', icon: '<rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/>' }
}[t])

const visibleItems = computed<SearchItem[]>(() => {
  if (activeTab.value === 'all') return items.value
  return items.value.filter((it) => it.type === activeTab.value)
})

function typeCount(t: TabKey): number {
  if (t === 'all') return items.value.length
  return counts.value[t]
}

function switchTab(t: TabKey): void {
  activeTab.value = t
  router.replace({ query: { ...route.query, type: t === 'all' ? undefined : t } })
}

async function runSearch(kw: string): Promise<void> {
  const q = kw.trim()
  if (!q) return
  loading.value = true
  searched.value = true
  try {
    if (activeTab.value === 'all') {
      const r = await searchAll(q)
      items.value = r.items
      counts.value = r.counts
    } else {
      const tab = activeTab.value as Exclude<TabKey, 'all'>
      const loader: Record<Exclude<TabKey, 'all'>, (k: string) => Promise<SearchItem[]>> = {
        article: searchArticles,
        circle: searchCircles,
        friend: searchFriendsBy,
        video: searchVideos
      }
      const list = await loader[tab](q)
      items.value = list
      counts.value = { ...counts.value, [tab]: list.length }
    }
  } finally {
    loading.value = false
  }
}

function onSearch(): void {
  const q = keyword.value.trim()
  if (!q) return
  router.push({ query: { ...route.query, q } })
}

function openItem(item: SearchItem): void {
  if (item.type === 'article') router.push(`/markdown/${item.id}`)
  else if (item.type === 'circle') router.push('/circles')
  else if (item.type === 'friend') router.push(`/users/${item.id}`)
  else toast.push('视频详情页开发中', 'info')
}

function hideImg(e: Event) { (e.target as HTMLElement).style.visibility = 'hidden' }

// 深链：/search?q=xx&type=article
watch(() => route.query.q, (q) => {
  const v = (q as string) || ''
  keyword.value = v
  if (v.trim()) runSearch(v)
}, { immediate: true })

watch(() => route.query.type, (t) => {
  activeTab.value = (['all', 'article', 'circle', 'friend', 'video'].includes(t as string) ? t as TabKey : 'all')
  // 切换 Tab 后按新分类重新搜索（关键词已存在时）
  if (searched.value && keyword.value.trim()) runSearch(keyword.value)
})

onMounted(() => {
  // 首次挂载已由 immediate watcher 处理（若 URL 带 q）
  if (!route.query.q) searched.value = false
})
</script>
