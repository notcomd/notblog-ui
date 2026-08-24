<template>
  <div class="max-w-[1400px] mx-auto">
    <div class="flex flex-wrap items-center justify-between gap-2 sm:gap-3 mb-6">
      <div class="min-w-0">
        <h1 class="text-xl sm:text-2xl font-bold text-zinc-800 dark:text-zinc-100">发布工作台</h1>
        <p class="text-sm text-zinc-400 mt-1">选择内容类型开始创作，未发布的作品会保存在这里</p>
      </div>
      <button class="px-4 h-10 shrink-0 rounded-2xl text-sm bg-white/60 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-300 hover: transition-all" @click="toast.push('草稿保存在本机浏览器中', 'info')">
        <svg class="w-3.5 h-3.5 inline-block align-[-2px] mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>草稿自动保存到本机
      </button>
    </div>

    <!-- 四个方形类型选项 -->
    <div class="grid grid-cols-2 xl:grid-cols-3 gap-5">
      <div v-for="t in types" :key="t.type" class="glass-card overflow-hidden group cursor-pointer transition-all hover:-translate-y-1 hover:" @click="createNew(t.type)">
        <!-- 方形选项头 -->
        <div class="aspect-square relative flex flex-col items-center justify-center gap-3 transition-all group-hover:scale-[1.02]"
          :class="t.gradient">
          <div class="text-6xl transition-transform duration-300 group-hover:scale-110" v-html="t.icon"></div>
          <div class="text-xl font-bold text-white drop-shadow">{{ t.label }}</div>
          <div class="text-xs text-white/80">{{ t.desc }}</div>
          <div class="absolute top-3 right-3 w-8 h-8 rounded-xl bg-black/40 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 5v14M5 12h14" /></svg>
          </div>
        </div>
        <!-- 该类型未发布作品列表 -->
        <div class="px-3 py-2.5 border-t border-zinc-200/50 dark:border-zinc-700/50">
          <div class="flex items-center justify-between mb-1.5">
            <span class="text-xs text-zinc-400">未发布作品 <span class="text-amber-500 font-medium">{{ draftsByType(t.type).length }}</span></span>
            <button class="text-[11px] text-blue-500 hover:text-blue-600 transition-colors" @click.stop="createNew(t.type)">＋ 新建</button>
          </div>
          <div class="space-y-1.5 max-h-44 overflow-y-auto">
            <div v-for="d in draftsByType(t.type)" :key="d.id" class="group/draft flex items-center gap-2.5 px-2.5 py-2 rounded-xl bg-white/50 dark:bg-zinc-800/50 hover:bg-white/80 dark:hover:bg-zinc-800/80 transition-colors">
              <!-- 缩略图 -->
              <div class="w-9 h-9 rounded-lg overflow-hidden shrink-0 bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
                <img v-if="d.cover || (d.images && d.images[0])" :src="d.cover || d.images[0].preview || d.images[0].url" alt="" class="w-full h-full object-cover" @error="hideImg" />
                <span v-else class="text-base" v-html="t.icon"></span>
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-xs font-medium text-zinc-700 dark:text-zinc-200 truncate">{{ d.title || d.content || '未命名草稿' }}</div>
                <div class="text-[10px] text-zinc-400">{{ relativeTime(d.updatedAt) }}</div>
              </div>
              <button class="w-6 h-6 rounded-lg flex items-center justify-center text-zinc-400 hover:bg-amber-400/15 hover:text-amber-500 transition-colors opacity-0 group-hover/draft:opacity-100" title="编辑" @click.stop="editDraft(d)">
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z" /></svg>
              </button>
              <button class="w-6 h-6 rounded-lg flex items-center justify-center text-zinc-400 hover:bg-red-500/15 hover:text-red-500 transition-colors opacity-0 group-hover/draft:opacity-100" title="删除" @click.stop="confirmDelete(d)">
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /></svg>
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
  { type: 'post', label: '图文博客', icon: '<svg class="w-9 h-9 mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>', desc: '图片 + 文字记录', gradient: 'bg-gradient-to-br from-amber-400 to-orange-500', target: '/publish?type=post' },
  { type: 'video', label: '视频', icon: '<svg class="w-9 h-9 mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/></svg>', desc: '视频 + 封面 + 弹幕', gradient: 'bg-gradient-to-br from-blue-500 to-indigo-600', target: '/publish?type=video' },
  { type: 'markdown', label: 'Markdown', icon: '<svg class="w-9 h-9 mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>', desc: '长文写作 · 需要封面', gradient: 'bg-gradient-to-br from-emerald-400 to-teal-600', target: '/publish?type=workspace' },
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
