<template>
  <div class="max-w-[1400px] mx-auto">
    <!-- ===== 顶部：标题 ===== -->
    <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
      <div class="min-w-0">
        <h1 class="font-display text-2xl font-bold text-zinc-800 dark:text-zinc-100">发布工作台</h1>
        <p class="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">选择内容类型开始创作，我的内容（图文 / 视频 / Markdown）与审核状态都汇总在下方</p>
      </div>
    </div>

    <!-- ===== 创作类型：无框卡片（顶部波带 + 线稿装饰 + 印章图标） ===== -->
    <div class="grid grid-cols-3 gap-4">
      <div
        v-for="(t, ti) in types"
        :key="t.type"
        class="group relative flex cursor-pointer flex-col overflow-hidden rounded-[5%] transition-colors hover:bg-black/[0.03] dark:hover:bg-white/[0.045]"
        role="link"
        tabindex="0"
        @click="createNew(t.type)"
        @keydown.enter.prevent="createNew(t.type)"
        @keydown.space.prevent="createNew(t.type)"
      >
        <svg class="pointer-events-none absolute left-0 top-0 h-6 w-full" viewBox="0 0 400 30" preserveAspectRatio="none" aria-hidden="true">
          <path :d="t.ribbonPath" :fill="'url(#' + t.gradId + ')'" opacity="0.85" />
        </svg>
        <div
          class="pointer-events-none absolute -right-7 -top-3 select-none opacity-[0.12] transition-transform duration-500 group-hover:rotate-3 group-hover:scale-110"
          aria-hidden="true"
          v-html="t.deco"
        ></div>

        <div class="relative px-6 pt-9 pb-5 flex-1 flex flex-col">
          <svg class="absolute top-4 right-5 select-none" width="44" height="40" viewBox="0 0 44 40" fill="none" aria-hidden="true">
            <text x="40" y="34" text-anchor="end" font-family="Fraunces, Songti SC, serif" font-size="30" font-weight="700" opacity="0.12" fill="currentColor">{{ String(ti + 1).padStart(2, '0') }}</text>
          </svg>

          <div
            class="flex h-16 w-16 items-center justify-center rounded-[5%] text-white shadow-lg shadow-black/10 transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-110"
            :class="t.seal"
            v-html="t.icon"
          ></div>

          <h3 class="mt-4 text-xl font-bold text-zinc-800 dark:text-zinc-100 font-display">{{ t.label }}</h3>
          <p class="text-xs text-zinc-400 mt-1">{{ t.desc }}</p>

          <div class="mt-auto flex items-center justify-between border-t border-zinc-200/70 pt-4 dark:border-zinc-800/70">
            <span class="text-[11px] text-zinc-400">点击卡片开始创作</span>
            <span
              class="inline-flex items-center gap-1.5 text-xs font-semibold transition-all duration-300 group-hover:gap-2.5"
              :class="t.cta"
            >
              {{ t.label }}
              <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- ===== 我的内容：后端三种类型合并 + 本地草稿兼存 ===== -->
    <section class="mt-10 border-t border-zinc-200/70 pt-6 dark:border-zinc-800/70">
      <div class="flex flex-wrap items-center gap-4 justify-between mb-5">
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-[5%] bg-gradient-to-br from-amber-400 to-orange-500 text-white">
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 8v13H3V8" /><path d="M1 3h22v5H1z" /><path d="M10 12h4" /></svg>
          </div>
          <div>
            <h2 class="font-display text-lg font-bold text-zinc-800 dark:text-zinc-100">我的内容</h2>
            <p class="text-xs text-zinc-400 mt-0.5">{{ summaryText }}</p>
          </div>
        </div>
      </div>

      <!-- 筛选：类型 + 状态（并列） -->
      <div class="flex flex-wrap items-center gap-3 mb-4">
        <div class="inline-flex items-center gap-1 rounded-[5%] bg-black/5 p-1 dark:bg-white/10" role="group" aria-label="按类型筛选">
          <button
            v-for="f in typeFilters"
            :key="f.key"
            type="button"
            class="inline-flex h-8 items-center gap-1.5 rounded-[5%] px-3.5 text-xs font-medium transition-colors"
            :class="activeType === f.key ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white' : 'text-zinc-500 hover:bg-white/60 hover:text-zinc-700 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-200'"
            :aria-pressed="activeType === f.key"
            @click="activeType = f.key"
          >
            <span class="h-1.5 w-1.5 rounded-full" :class="activeType === f.key ? 'bg-white/80' : f.dot" aria-hidden="true"></span>
            {{ f.label }}
            <span class="font-numeric text-[10px] opacity-60">{{ countOfType(f.key) }}</span>
          </button>
        </div>
        <div class="inline-flex items-center gap-1 rounded-[5%] bg-black/5 p-1 dark:bg-white/10" role="group" aria-label="按状态筛选">
          <button
            v-for="s in STATUS_FILTERS"
            :key="s.key || 'all'"
            type="button"
            class="inline-flex h-8 items-center rounded-[5%] px-3.5 text-xs font-medium transition-colors"
            :class="statusFilter === s.key ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white' : 'text-zinc-500 hover:bg-white/60 hover:text-zinc-700 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-200'"
            :aria-pressed="statusFilter === s.key"
            @click="setStatus(s.key)"
          >
            {{ s.label }}
          </button>
        </div>
      </div>

      <!-- 加载态 -->
      <div v-if="loading" class="py-14 text-center text-sm text-zinc-400">加载中…</div>

      <template v-else>
        <!-- 空态 -->
        <div v-if="!filteredItems.length && !localDrafts.length" class="py-14 flex flex-col items-center gap-3 text-zinc-400">
          <svg class="w-16 h-16 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M9 13h6M9 17h6" /></svg>
          <p class="text-sm">暂无内容</p>
          <p class="text-xs opacity-80">在上方选择一种类型，开始你的第一份创作</p>
        </div>

        <!-- 服务端内容（图文 / 视频 / Markdown 合并） -->
        <div v-else>
          <div
            v-for="it in filteredItems"
            :key="it.key"
            class="flex items-center gap-4 rounded-[5%] border-b border-black/[0.06] px-2 py-3 transition-colors hover:bg-black/[0.04] dark:border-white/[0.08] dark:hover:bg-white/[0.06]"
          >
            <!-- 缩略图 / 类型徽标 -->
            <div class="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[5%] text-white" :class="metaOf(it.type).seal">
              <img v-if="it.cover" :src="it.cover" alt="" class="h-full w-full object-cover" @error="hideImg" />
              <span v-else v-html="metaOf(it.type).iconSm"></span>
            </div>

            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-1.5 min-w-0">
                <span class="truncate text-sm font-medium text-zinc-700 dark:text-zinc-200">{{ it.title || '未命名内容' }}</span>
                <span class="shrink-0 text-[9px] px-1.5 py-px rounded-full" :class="metaOf(it.type).tag">{{ metaOf(it.type).label }}</span>
                <span class="shrink-0 text-[10px] px-2 py-0.5 rounded-full font-medium" :class="statusClass(it.statusRaw)">{{ statusLabel(it.statusRaw) }}</span>
              </div>
              <div class="text-[10px] text-zinc-400 mt-0.5 truncate">{{ relativeTime(it.time) }}</div>
              <div v-if="isRejected(it.statusRaw) && it.rejectReason" class="mt-1 text-[11px] text-red-500 truncate" :title="it.rejectReason">
                驳回原因：{{ it.rejectReason }}
              </div>
            </div>

            <!-- 操作（按状态） -->
            <div class="flex items-center gap-1 shrink-0">
              <template v-if="canEdit(it.statusRaw)">
                <button class="inline-flex h-8 items-center gap-1 rounded-[5%] px-2.5 text-[11px] text-zinc-500 transition-colors hover:bg-amber-400/15 hover:text-amber-500 dark:text-zinc-400" type="button" title="继续编辑" @click="editItem(it)">
                  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z" /></svg>
                  继续编辑
                </button>
                <button class="inline-flex h-8 items-center gap-1 rounded-[5%] px-2.5 text-[11px] text-zinc-500 transition-colors hover:bg-emerald-400/15 hover:text-emerald-500 dark:text-zinc-400" type="button" :title="isRejected(it.statusRaw) ? '重新提交审核' : '提交审核'" @click="submitItem(it)">
                  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4z" /></svg>
                  {{ isRejected(it.statusRaw) ? '重新提交' : '提交审核' }}
                </button>
              </template>
              <button v-else class="inline-flex h-8 items-center gap-1 rounded-[5%] px-2.5 text-[11px] text-zinc-500 transition-colors hover:bg-black/[0.04] dark:text-zinc-400 dark:hover:bg-white/[0.06]" type="button" title="查看" @click="viewItem(it)">
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                查看
              </button>
              <button class="inline-flex h-8 w-8 items-center justify-center rounded-[5%] text-zinc-400 transition-colors hover:bg-red-500/15 hover:text-red-500" type="button" title="删除" @click="askRemove(it)">
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /></svg>
              </button>
            </div>
          </div>
        </div>

        <!-- 本机草稿（离线兼存，与后端内容并列展示） -->
        <div v-if="localDrafts.length" class="mt-6">
          <div class="flex items-center gap-2 mb-2.5 px-0.5">
            <span class="text-xs font-semibold text-zinc-500 dark:text-zinc-300">本机草稿</span>
            <span class="font-numeric text-[10px] text-zinc-400">{{ localDrafts.length }}</span>
            <span class="text-[10px] text-zinc-400">· 保存在本机浏览器，联网保存到后端后会自动清理</span>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div
              v-for="d in localDrafts"
              :key="d.id"
              class="group flex items-center gap-3 rounded-[5%] border-b border-black/[0.06] px-2 py-2.5 transition-colors hover:bg-black/[0.04] dark:border-white/[0.08] dark:hover:bg-white/[0.06]"
            >
              <div class="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-[5%] text-white" :class="metaOf(d.type).seal">
                <img v-if="thumbOf(d)" :src="thumbOf(d)" alt="" class="h-full w-full object-cover" @error="hideImg" />
                <span v-else v-html="metaOf(d.type).iconSm"></span>
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-1.5 min-w-0">
                  <span class="truncate text-xs font-medium text-zinc-700 dark:text-zinc-200">{{ d.title || d.content || '未命名草稿' }}</span>
                  <span class="shrink-0 text-[9px] px-1.5 py-px rounded-full bg-zinc-400/15 text-zinc-500 dark:text-zinc-400">本机</span>
                </div>
                <div class="text-[10px] text-zinc-400 mt-0.5">{{ relativeTime(d.updatedAt) }}</div>
              </div>
              <div class="flex items-center gap-1 shrink-0 opacity-0 transition-opacity group-hover:opacity-100">
                <button class="flex h-7 w-7 items-center justify-center rounded-[5%] text-zinc-400 transition-colors hover:bg-amber-400/15 hover:text-amber-500" type="button" title="继续编辑" @click="editLocal(d)">
                  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z" /></svg>
                </button>
                <button class="flex h-7 w-7 items-center justify-center rounded-[5%] text-zinc-400 transition-colors hover:bg-red-500/15 hover:text-red-500" type="button" title="删除" @click="askRemoveLocal(d)">
                  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </template>
    </section>

    <!-- 删除确认 -->
    <ConfirmDialog
      v-if="deleteTarget"
      danger
      :title="deleteTarget.local ? '删除本机草稿' : '删除内容'"
      :message="'确定删除「' + deleteTitle + '」吗？删除后不可恢复。'"
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
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import ConfirmDialog from '@/components/admin/ConfirmDialog.vue'
import { getDrafts, removeDraft } from '@/utils/drafts'
import { getMyTweets, submitTweet, deleteTweet } from '@/api/tweet'
import { getMyMarkdownDocs, submitMarkdownForReview, deleteMarkdownDoc } from '@/api/markdown'
import { unwrap } from '@/utils/response'
import { relativeTime, toMillis } from '@/utils/format'
import { isVideoPost, pickCoverUrl } from '@/utils/media'
import { useToastStore } from '@/stores/toast'
import {
  STATUS_FILTERS,
  statusLabel,
  statusClass,
  normalizeStatus,
  canEdit,
  rejectReasonOf,
  toMessageStatus,
  toMarkdownStatus
} from '@/utils/contentStatus'
import type { ContentStatus } from '@/utils/contentStatus'

const router = useRouter()
const toast = useToastStore()
const deleteTarget = ref<any>(null)

type ItemType = 'post' | 'video' | 'markdown'
type TypeFilter = 'all' | ItemType

interface ContentItem {
  key: string
  type: ItemType
  id: string
  title: string
  cover: string
  statusRaw: string
  rejectReason: string
  time: number | string | null
}

// ===== 三种创作类型（卡片：SVG 主题装饰 + 渐变 id 供顶部波带复用） =====
const types = [
  {
    type: 'post' as ItemType,
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
    type: 'video' as ItemType,
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
    type: 'markdown' as ItemType,
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

const typeFilters: { key: TypeFilter; label: string; dot: string }[] = [
  { key: 'all', label: '全部', dot: 'bg-zinc-400' },
  { key: 'post', label: '图文', dot: 'bg-amber-500' },
  { key: 'video', label: '视频', dot: 'bg-blue-500' },
  { key: 'markdown', label: 'Markdown', dot: 'bg-emerald-500' }
]

const items = ref<ContentItem[]>([])
const localDrafts = ref(getDrafts())
const loading = ref(false)
const activeType = ref<TypeFilter>('all')
const statusFilter = ref<ContentStatus | ''>('')

function metaOf(type: string) {
  return types.find((t) => t.type === type) || types[0]
}

const summaryText = computed(() => {
  const parts: string[] = [`${items.value.length} 条内容`]
  if (localDrafts.value.length) parts.push(`${localDrafts.value.length} 份本机草稿`)
  return parts.join(' · ')
})

const filteredItems = computed(() =>
  items.value.filter((i) => activeType.value === 'all' || i.type === activeType.value)
)

function countOfType(key: TypeFilter): number {
  const serverCount = items.value.filter((i) => key === 'all' || i.type === key).length
  // 状态筛选为「非草稿」时本机草稿不计入
  if (statusFilter.value && statusFilter.value !== 'draft') return serverCount
  const localCount = localDrafts.value.filter((d) => key === 'all' || d.type === key).length
  return serverCount + localCount
}

function isRejected(raw?: string | null): boolean {
  return normalizeStatus(raw) === 'rejected'
}

// ===== 数据加载：图文/视频（Message）+ Markdown 两种「我的内容」合并 =====
async function load(): Promise<void> {
  loading.value = true
  try {
    const tweetParams: Record<string, unknown> = { page: 1, pageSize: 50 }
    const msgStatus = toMessageStatus(statusFilter.value)
    if (msgStatus) tweetParams.status = msgStatus
    const mdParams: Record<string, unknown> = { page: 1, pageSize: 50 }
    const mdStatus = toMarkdownStatus(statusFilter.value)
    if (mdStatus) mdParams.status = mdStatus

    const [tweetsRes, mdRes] = await Promise.all([
      getMyTweets(tweetParams),
      getMyMarkdownDocs(mdParams)
    ])
    const tw: any = unwrap(tweetsRes)
    const tweetList: any[] = Array.isArray(tw) ? tw : (tw?.items || tw?.list || [])
    const mdRaw: any = unwrap(mdRes)
    const mdList: any[] = Array.isArray(mdRaw) ? mdRaw : (mdRaw?.items || mdRaw?.list || [])

    const mapped: ContentItem[] = [
      ...tweetList.map((t: any): ContentItem => ({
        key: 'tw-' + t.tweetGuid,
        type: isVideoPost(t) ? 'video' : 'post',
        id: String(t.tweetGuid),
        title: firstLine(t.content),
        cover: pickCoverUrl(t.mediaUrls),
        statusRaw: String(t.tweetStatus || ''),
        rejectReason: rejectReasonOf(t),
        time: t.publishTime || t.createTime
      })),
      ...mdList.map((m: any): ContentItem => ({
        key: 'md-' + m.markDownGuid,
        type: 'markdown',
        id: String(m.markDownGuid),
        title: m.name || '',
        cover: m.coverUrl || '',
        statusRaw: String(m.status || ''),
        rejectReason: rejectReasonOf(m),
        time: m.createAt
      }))
    ]
    items.value = mapped.sort((a, b) => toMillis(b.time) - toMillis(a.time))
    localDrafts.value = getDrafts()
  } catch (e: any) {
    toast.push(e?.message || '加载我的内容失败', 'error')
    items.value = []
    localDrafts.value = getDrafts()
  } finally {
    loading.value = false
  }
}

function setStatus(key: ContentStatus | ''): void {
  statusFilter.value = key
  load()
}

onMounted(load)

// ===== 操作 =====
function createNew(type: string): void {
  router.push({ path: '/publish', query: { type } })
}

function firstLine(s?: string): string {
  const t = (s || '').trim()
  return t ? t.split('\n')[0].slice(0, 60) : ''
}

function editItem(it: ContentItem): void {
  router.push({ path: '/publish', query: { type: it.type, edit: it.id } })
}

function viewItem(it: ContentItem): void {
  if (it.type === 'markdown') router.push(`/markdown/${it.id}`)
  else router.push(`/posts/${it.id}`)
}

async function submitItem(it: ContentItem): Promise<void> {
  try {
    // 图文 / 视频在本应用均为 Message 推文（视频帖 = 含视频媒体的推文）
    if (it.type === 'markdown') await submitMarkdownForReview(it.id)
    else await submitTweet(it.id)
    toast.push('已提交审核', 'success')
    load()
  } catch (e: any) {
    toast.push(e?.message || '提交审核失败，请稍后重试', 'error')
  }
}

function askRemove(it: ContentItem): void {
  deleteTarget.value = { ...it, local: false }
}

function askRemoveLocal(d: any): void {
  deleteTarget.value = { ...d, local: true }
}

const deleteTitle = computed(() => {
  const t = deleteTarget.value
  return t ? (t.title || t.content || '未命名草稿') : ''
})

async function doDelete(): Promise<void> {
  const target = deleteTarget.value
  if (!target) return
  deleteTarget.value = null
  if (target.local) {
    localDrafts.value = removeDraft(target.id)
    toast.push('本机草稿已删除', 'success')
    return
  }
  try {
    if (target.type === 'markdown') await deleteMarkdownDoc(target.id)
    else await deleteTweet(target.id)
    toast.push('内容已删除', 'success')
    load()
  } catch (e: any) {
    toast.push(e?.message || '删除失败，请稍后重试', 'error')
  }
}

function editLocal(d: any): void {
  router.push({ path: '/publish', query: { type: d.type, draft: d.id } })
}

function hideImg(e: Event) {
  ;(e.target as HTMLElement).style.visibility = 'hidden'
}

/** 本地草稿缩略图：封面优先，其次首图（兼容 { preview, url } 与纯 url 字符串） */
function thumbOf(d: any): string {
  const first = Array.isArray(d.images) ? d.images[0] : undefined
  if (typeof first === 'string') return d.cover || first
  return d.cover || (first && (first.preview || first.url))
}
</script>
