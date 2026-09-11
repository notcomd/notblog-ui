<template>
  <div class="max-w-[1400px] mx-auto">
    <!-- ===== 顶部：标题 + 草稿说明 ===== -->
    <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
      <div class="min-w-0">
        <h1 class="text-2xl font-bold text-zinc-800 dark:text-zinc-100 font-display">发布工作台</h1>
        <p class="text-sm text-zinc-400 mt-1">选择内容类型开始创作，未发布的作品会按类型整理在下方</p>
      </div>
      <button class="px-4 h-10 shrink-0 rounded-2xl text-sm backdrop-blur-xl bg-white/60 dark:bg-zinc-800/60 border border-white/50 dark:border-white/10 text-zinc-600 dark:text-zinc-300 hover:opacity-90 transition-all" type="button" @click="toast.push('草稿保存在本机浏览器中', 'info')">
        <svg class="w-3.5 h-3.5 inline-block align-[-2px] mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>草稿自动保存到本机
      </button>
    </div>

    <!-- ===== 创作类型卡片：SVG 主题 + 毛玻璃 ===== -->
    <div class="grid grid-cols-3 gap-4">
      <div
        v-for="(t, ti) in types"
        :key="t.type"
        class="relative flex flex-col overflow-hidden rounded-3xl backdrop-blur-2xl bg-white/60 dark:bg-zinc-900/55 border border-white/50 dark:border-white/10 shadow-lg shadow-black/[0.04] group cursor-pointer transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-black/10"
        role="link"
        tabindex="0"
        @click="createNew(t.type)"
        @keydown.enter.prevent="createNew(t.type)"
        @keydown.space.prevent="createNew(t.type)"
      >
        <!-- SVG 顶部波带（类型渐变） -->
        <svg class="absolute top-0 left-0 w-full h-8 pointer-events-none" viewBox="0 0 400 30" preserveAspectRatio="none" aria-hidden="true">
          <path :d="t.ribbonPath" :fill="'url(#' + t.gradId + ')'" opacity="0.9" />
        </svg>
        <!-- SVG 主题装饰：右上角大线稿（hover 微动） -->
        <div
          class="absolute -top-3 -right-7 opacity-[0.14] transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 pointer-events-none select-none"
          aria-hidden="true"
          v-html="t.deco"
        ></div>

        <div class="relative px-6 pt-9 pb-5 flex-1 flex flex-col">
          <!-- 信笺编号（SVG 文本） -->
          <svg class="absolute top-4 right-5 select-none" width="44" height="40" viewBox="0 0 44 40" fill="none" aria-hidden="true">
            <text x="40" y="34" text-anchor="end" font-family="Fraunces, Songti SC, serif" font-size="30" font-weight="700" opacity="0.12" fill="currentColor">{{ String(ti + 1).padStart(2, '0') }}</text>
          </svg>

          <!-- 印章式类型图标 -->
          <div
            class="w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-black/10 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3"
            :class="t.seal"
            v-html="t.icon"
          ></div>

          <h3 class="mt-4 text-xl font-bold text-zinc-800 dark:text-zinc-100 font-display">{{ t.label }}</h3>
          <p class="text-xs text-zinc-400 mt-1">{{ t.desc }}</p>

          <!-- 底部 CTA（mt-auto 贴底，三卡底部对齐） -->
          <div class="mt-auto pt-4 border-t border-white/40 dark:border-white/10 flex items-center justify-between">
            <span class="text-[11px] text-zinc-400">点击卡片开始创作</span>
            <span
              class="inline-flex items-center gap-1.5 text-xs font-semibold rounded-full px-3.5 py-1.5 backdrop-blur bg-white/50 dark:bg-zinc-800/50 border border-white/50 dark:border-white/10 transition-all duration-300 group-hover:gap-2.5"
              :class="t.cta"
            >
              {{ t.label }}
              <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- ===== 未发布作品：从卡片分离，按类型分类 ===== -->
    <section class="mt-8">
      <div class="flex flex-wrap items-center gap-4 justify-between mb-5">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl flex items-center justify-center text-white bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-lg shadow-black/10">
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 8v13H3V8" /><path d="M1 3h22v5H1z" /><path d="M10 12h4" /></svg>
          </div>
          <div>
            <h2 class="font-display text-lg font-bold text-zinc-800 dark:text-zinc-100">未发布作品</h2>
            <p class="text-xs text-zinc-400 mt-0.5">{{ drafts.length ? '共 ' + drafts.length + ' 份草稿，保存在本机' : '草稿自动保存在本机' }}</p>
          </div>
        </div>

        <!-- 分类筛选（毛玻璃胶囊） -->
        <div class="inline-flex items-center gap-1 p-1 rounded-full backdrop-blur-xl bg-white/60 dark:bg-zinc-800/60 border border-white/50 dark:border-white/10">
          <button
            v-for="f in filters"
            :key="f.key"
            type="button"
            class="h-8 px-3.5 rounded-full text-xs font-medium transition-all inline-flex items-center gap-1.5"
            :class="activeFilter === f.key ? 'bg-white dark:bg-zinc-700 text-amber-600 dark:text-amber-300 shadow' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200'"
            :aria-pressed="activeFilter === f.key"
            @click="activeFilter = f.key"
          >
            <span class="w-1.5 h-1.5 rounded-full" :class="f.dot" aria-hidden="true"></span>
            {{ f.label }}
            <span class="font-numeric text-[10px] opacity-60">{{ countOf(f.key) }}</span>
          </button>
        </div>
      </div>

      <!-- 草稿容器：毛玻璃 -->
      <div class="rounded-3xl backdrop-blur-2xl bg-white/60 dark:bg-zinc-900/55 border border-white/50 dark:border-white/10 p-5">
        <!-- 空态：SVG 空文档 -->
        <div v-if="!draftGroups.length" class="py-14 flex flex-col items-center gap-3 text-zinc-400">
          <svg class="w-16 h-16 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M9 13h6M9 17h6" /></svg>
          <p class="text-sm">{{ emptyText }}</p>
          <p class="text-xs opacity-80">在上方选择一种类型，开始你的第一份创作</p>
        </div>

        <!-- 按类型分组的草稿列表 -->
        <div v-else>
          <div v-for="g in draftGroups" :key="g.type" class="mb-6 last:mb-0">
            <!-- 分组标题 -->
            <div class="flex items-center gap-2 mb-2.5 px-0.5">
              <span class="w-2 h-2 rounded-full" :class="g.dot" aria-hidden="true"></span>
              <span class="text-xs font-semibold text-zinc-500 dark:text-zinc-300">{{ g.label }}</span>
              <span class="font-numeric text-[10px] text-zinc-400">{{ g.items.length }}</span>
            </div>

            <div class="grid grid-cols-3 gap-3">
              <div
                v-for="d in g.items"
                :key="d.id"
                class="group flex items-center gap-3 p-3 rounded-2xl bg-white/50 dark:bg-zinc-800/50 border border-white/40 dark:border-white/5 transition-colors hover:bg-white/80 dark:hover:bg-zinc-800/80"
              >
                <!-- 缩略图 / 类型徽标 -->
                <div class="w-11 h-11 rounded-xl overflow-hidden shrink-0 flex items-center justify-center text-white" :class="g.seal">
                  <img v-if="thumbOf(d)" :src="thumbOf(d)" alt="" class="w-full h-full object-cover" @error="hideImg" />
                  <span v-else v-html="g.iconSm"></span>
                </div>

                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-1.5 min-w-0">
                    <span class="text-xs font-medium text-zinc-700 dark:text-zinc-200 truncate">{{ d.title || d.content || '未命名草稿' }}</span>
                    <span class="shrink-0 text-[9px] px-1.5 py-px rounded-full" :class="g.tag">{{ g.label }}</span>
                  </div>
                  <div class="text-[10px] text-zinc-400 mt-0.5">{{ relativeTime(d.updatedAt) }}</div>
                </div>

                <!-- 操作：继续编辑 / 删除 -->
                <div class="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button class="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:bg-amber-400/15 hover:text-amber-500 transition-colors" type="button" title="继续编辑" aria-label="继续编辑草稿" @click="editDraft(d)">
                    <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z" /></svg>
                  </button>
                  <button class="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:bg-red-500/15 hover:text-red-500 transition-colors" type="button" title="删除" aria-label="删除草稿" @click="confirmDelete(d)">
                    <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 删除确认 -->
    <ConfirmDialog
      v-if="deleteTarget"
      danger
      title="删除未发布作品"
      :message="'确定删除「' + (deleteTarget.title || deleteTarget.content || '未命名草稿') + '」吗？删除后不可恢复。'"
      confirm-text="删除"
      @close="deleteTarget = null"
      @confirm="doDelete"
    />
  </div>
</template>

<script lang="ts">
export default { name: 'WorkspaceView' }
</script>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import ConfirmDialog from '@/components/admin/ConfirmDialog.vue'
import { getDrafts, removeDraft } from '@/utils/drafts'
import { useToastStore } from '@/stores/toast'
import { relativeTime } from '@/utils/format'

const router = useRouter()
const toast = useToastStore()
const deleteTarget = ref<any>(null)

type DraftType = 'post' | 'video' | 'markdown'
type FilterKey = 'all' | DraftType

// ===== 三种创作类型（卡片：SVG 主题装饰 + 渐变 id 供顶部波带复用） =====
const types = [
  {
    type: 'post' as DraftType,
    label: '图文博客',
    desc: '图片 + 文字记录',
    gradId: 'wGradPost',
    ribbonPath: 'M0 0 H400 V10 C 330 22, 268 2, 200 12 C 132 22, 66 3, 0 14 Z',
    seal: 'bg-gradient-to-br from-amber-400 to-orange-500',
    cta: 'text-amber-600 dark:text-amber-400',
    icon: '<svg class="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>',
    iconSm: '<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>',
    tag: 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300',
    dot: 'bg-amber-500',
    deco: '<svg width="220" height="220" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="wGradPost" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fbbf24"/><stop offset="1" stop-color="#f97316"/></linearGradient></defs><rect x="22" y="30" width="66" height="58" rx="7" stroke="url(#wGradPost)" stroke-width="2"/><circle cx="38" cy="46" r="4.5" stroke="url(#wGradPost)" stroke-width="2"/><path d="M30 78 L50 60 L66 72 L78 62" stroke="url(#wGradPost)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M56 30 v58" stroke="url(#wGradPost)" stroke-width="2" stroke-linecap="round" opacity="0.35"/><path d="M96 34 q14 12 14 26 q0 14 -14 24" stroke="url(#wGradPost)" stroke-width="2" stroke-linecap="round" opacity="0.55"/></svg>'
  },
  {
    type: 'video' as DraftType,
    label: '视频',
    desc: '视频 + 封面 + 弹幕',
    gradId: 'wGradVideo',
    ribbonPath: 'M0 0 H400 V12 C 332 24, 270 4, 202 14 C 132 24, 64 5, 0 16 Z',
    seal: 'bg-gradient-to-br from-blue-500 to-indigo-600',
    cta: 'text-blue-600 dark:text-blue-400',
    icon: '<svg class="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/></svg>',
    iconSm: '<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/></svg>',
    tag: 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300',
    dot: 'bg-blue-500',
    deco: '<svg width="220" height="220" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="wGradVideo" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#60a5fa"/><stop offset="1" stop-color="#6366f1"/></linearGradient></defs><rect x="20" y="32" width="72" height="50" rx="9" stroke="url(#wGradVideo)" stroke-width="2"/><path d="M47 45 l22 12 -22 12 z" fill="url(#wGradVideo)"/><path d="M20 46 q-10 4 -10 11 q0 7 10 11" stroke="url(#wGradVideo)" stroke-width="2" stroke-linecap="round" opacity="0.7"/><path d="M92 40 q13 8 13 17 q0 9 -13 17" stroke="url(#wGradVideo)" stroke-width="2" stroke-linecap="round" opacity="0.7"/><path d="M98 62 q6 16 -4 28" stroke="url(#wGradVideo)" stroke-width="2" stroke-linecap="round" opacity="0.45"/></svg>'
  },
  {
    type: 'markdown' as DraftType,
    label: 'Markdown',
    desc: '长文写作 · 需要封面',
    gradId: 'wGradMarkdown',
    ribbonPath: 'M0 0 H400 V9 C 330 20, 268 1, 200 11 C 132 21, 66 2, 0 13 Z',
    seal: 'bg-gradient-to-br from-emerald-400 to-teal-600',
    cta: 'text-emerald-600 dark:text-emerald-400',
    icon: '<svg class="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
    iconSm: '<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
    tag: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300',
    dot: 'bg-emerald-500',
    deco: '<svg width="220" height="220" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="wGradMarkdown" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#34d399"/><stop offset="1" stop-color="#14b8a6"/></linearGradient></defs><path d="M26 16 h48 a8 8 0 0 1 8 8 v64 a8 8 0 0 1 -8 8 h-48 a8 8 0 0 1 -8 -8 v-64 a8 8 0 0 1 8 -8z" stroke="url(#wGradMarkdown)" stroke-width="2"/><path d="M30 40 h34 M30 52 h34 M30 64 h20" stroke="url(#wGradMarkdown)" stroke-width="2" stroke-linecap="round" opacity="0.8"/><path d="M78 38 q12 8 12 18 q0 10 -12 17" stroke="url(#wGradMarkdown)" stroke-width="2" stroke-linecap="round" opacity="0.5"/><path d="M82 14 q-10 6 -10 16" stroke="url(#wGradMarkdown)" stroke-width="2" stroke-linecap="round" opacity="0.35"/></svg>'
  }
]

// ===== 未发布作品：分类筛选 =====
const filters: { key: FilterKey; label: string; dot: string }[] = [
  { key: 'all', label: '全部', dot: 'bg-zinc-400' },
  { key: 'post', label: '图文', dot: 'bg-amber-500' },
  { key: 'video', label: '视频', dot: 'bg-blue-500' },
  { key: 'markdown', label: 'Markdown', dot: 'bg-emerald-500' }
]

const drafts = ref(getDrafts())
const activeFilter = ref<FilterKey>('all')

/** 按类型分组（默认全部：三类各为一组；选中 tab：仅该类型一组；空组剔除） */
const draftGroups = computed(() =>
  types
    .filter((t) => activeFilter.value === 'all' || t.type === activeFilter.value)
    .map((t) => ({ ...t, items: drafts.value.filter((d) => d.type === t.type) }))
    .filter((g) => g.items.length > 0)
)

const emptyText = computed(() => {
  if (activeFilter.value === 'all') return '暂无未发布作品'
  const t = types.find((x) => x.type === activeFilter.value)
  return `暂无${t ? t.label : ''}草稿`
})

function countOf(k: FilterKey): number {
  if (k === 'all') return drafts.value.length
  return drafts.value.filter((d) => d.type === k).length
}

// ===== 操作 =====
function createNew(type: string): void {
  router.push({ path: '/publish', query: { type } })
}

function editDraft(d: any): void {
  router.push({ path: '/publish', query: { type: d.type, draft: d.id } })
}

function confirmDelete(d: any): void {
  deleteTarget.value = d
}

function doDelete(): void {
  drafts.value = removeDraft(deleteTarget.value.id)
  toast.push('草稿已删除', 'success')
  deleteTarget.value = null
}

function hideImg(e: Event) {
  (e.target as HTMLElement).style.visibility = 'hidden'
}

/** 草稿缩略图：封面优先，其次首图（兼容 images 里存的 { preview, url } 与纯 url 字符串两种形态） */
function thumbOf(d: any): string {
  const first = Array.isArray(d.images) ? d.images[0] : undefined
  if (typeof first === 'string') return d.cover || first
  return d.cover || (first && (first.preview || first.url))
}
</script>