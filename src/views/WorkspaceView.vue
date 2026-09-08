<template>
  <div class="max-w-[1400px] mx-auto">
    <div class="flex flex-wrap items-center justify-between gap-2 sm:gap-3 mb-6">
      <div class="min-w-0">
        <h1 class="text-xl sm:text-2xl font-bold text-zinc-800 dark:text-zinc-100">发布工作台</h1>
        <p class="text-sm text-zinc-400 mt-1">选择内容类型开始创作，未发布的作品会保存在这里</p>
      </div>
      <button class="px-4 h-10 shrink-0 rounded-2xl text-sm bg-white/60 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-300 hover:opacity-90 transition-all" type="button" @click="toast.push('草稿保存在本机浏览器中', 'info')">
        <svg class="w-3.5 h-3.5 inline-block align-[-2px] mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>草稿自动保存到本机
      </button>
    </div>

    <!-- 三种创作类型：创作邀请函（类型饰带 + 印章图标 + 信笺编号） -->
    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
      <div
        v-for="(t, ti) in types"
        :key="t.type"
        class="glass-card overflow-hidden group cursor-pointer transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl"
        role="link"
        tabindex="0"
        @click="createNew(t.type)"
        @keydown.enter.prevent="createNew(t.type)"
        @keydown.space.prevent="createNew(t.type)"
      >
        <!-- 顶部类型饰带 -->
        <div class="h-1.5 rounded-t-[10px] bg-gradient-to-r transition-all duration-300 group-hover:h-2" :class="t.ribbon"></div>

        <!-- 头部：信笺区（印章图标 + 编号 + 标题 + 悬浮创作入口） -->
        <div class="relative pt-6 pb-5 px-6">
          <span class="font-display absolute top-4 right-5 text-[42px] font-bold leading-none opacity-10 select-none" aria-hidden="true">0{{ ti + 1 }}</span>

          <!-- 印章式类型图标 -->
          <div
            class="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-black/10 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3"
            :class="t.seal"
          >
            <span class="text-2xl leading-none" v-html="t.icon"></span>
          </div>

          <h3 class="mt-4 text-lg font-bold text-zinc-800 dark:text-zinc-100 font-display">{{ t.label }}</h3>
          <p class="text-xs text-zinc-400 mt-1">{{ t.desc }}</p>

          <span
            class="absolute bottom-5 right-5 inline-flex items-center gap-1 text-xs font-medium opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300"
            :class="t.cta"
          >开始创作 <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7" /></svg></span>
        </div>

        <!-- 该类型未发布作品列表 -->
        <div class="px-4 py-3 border-t border-zinc-200/60 dark:border-zinc-700/60 bg-zinc-50/50 dark:bg-zinc-900/40">
          <div class="flex items-center justify-between mb-1.5">
            <span class="text-xs text-zinc-400">未发布作品 <span class="font-numeric font-semibold" :class="t.accent">{{ draftsByType(t.type).length }}</span></span>
            <button type="button" class="text-[11px] text-blue-500 hover:text-blue-600 transition-colors" @click.stop="createNew(t.type)">＋ 新建</button>
          </div>
          <div class="space-y-1.5 max-h-44 overflow-y-auto">
            <div v-for="d in draftsByType(t.type)" :key="d.id" class="group/draft flex items-center gap-2.5 px-2.5 py-2 rounded-xl bg-white/50 dark:bg-zinc-800/50 hover:bg-white/80 dark:hover:bg-zinc-800/80 transition-colors">
              <!-- 缩略图（缺省用类型印章色） -->
              <div class="w-9 h-9 rounded-lg overflow-hidden shrink-0 flex items-center justify-center text-white" :class="t.seal">
                <img v-if="d.cover || (d.images && d.images[0])" :src="d.cover || d.images[0].preview || d.images[0].url" alt="" class="w-full h-full object-cover" @error="hideImg" />
                <span v-else class="text-base" v-html="t.icon"></span>
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-xs font-medium text-zinc-700 dark:text-zinc-200 truncate">{{ d.title || d.content || '未命名草稿' }}</div>
                <div class="text-[10px] text-zinc-400">{{ relativeTime(d.updatedAt) }}</div>
              </div>
              <button class="w-6 h-6 rounded-lg flex items-center justify-center text-zinc-400 hover:bg-amber-400/15 hover:text-amber-500 transition-colors opacity-0 group-hover/draft:opacity-100" type="button" title="编辑" aria-label="编辑草稿" @click.stop="editDraft(d)">
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z" /></svg>
              </button>
              <button class="w-6 h-6 rounded-lg flex items-center justify-center text-zinc-400 hover:bg-red-500/15 hover:text-red-500 transition-colors opacity-0 group-hover/draft:opacity-100" type="button" title="删除" aria-label="删除草稿" @click.stop="confirmDelete(d)">
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /></svg>
              </button>
            </div>
            <div v-if="draftsByType(t.type).length === 0" class="py-4 text-center text-[11px] text-zinc-400">暂无未发布作品</div>
          </div>
        </div>
      </div>
    </div>

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
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import ConfirmDialog from '@/components/admin/ConfirmDialog.vue'
import { getDraftsByType, removeDraft } from '@/utils/drafts'
import { useToastStore } from '@/stores/toast'
import { relativeTime } from '@/utils/format'

const router = useRouter()
const toast = useToastStore()
const deleteTarget = ref<any>(null)

const types: any[] = [
  { type: 'post', label: '图文博客', icon: '<svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>', desc: '图片 + 文字记录', seal: 'bg-gradient-to-br from-amber-400 to-orange-500', ribbon: 'from-amber-400 to-orange-500', cta: 'text-amber-600 dark:text-amber-400', accent: 'text-amber-500', target: '/publish?type=post' },
  { type: 'video', label: '视频', icon: '<svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/></svg>', desc: '视频 + 封面 + 弹幕', seal: 'bg-gradient-to-br from-blue-500 to-indigo-600', ribbon: 'from-blue-500 to-indigo-600', cta: 'text-blue-600 dark:text-blue-400', accent: 'text-blue-500', target: '/publish?type=video' },
  { type: 'markdown', label: 'Markdown', icon: '<svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>', desc: '长文写作 · 需要封面', seal: 'bg-gradient-to-br from-emerald-400 to-teal-600', ribbon: 'from-emerald-400 to-teal-600', cta: 'text-emerald-600 dark:text-emerald-400', accent: 'text-emerald-500', target: '/publish?type=markdown' },
]

function draftsByType(t: string) {
  return getDraftsByType(t)
}

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
  removeDraft(deleteTarget.value.id)
  toast.push('草稿已删除', 'success')
  deleteTarget.value = null
}

function hideImg(e: Event) {
  (e.target as HTMLElement).style.visibility = 'hidden'
}
</script>
