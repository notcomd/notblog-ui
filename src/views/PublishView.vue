<template>
  <div class="max-w-[1400px] mx-auto">
    <div class="glass-card p-6 min-h-[calc(100vh-20rem)] flex flex-col">
      <!-- 头部：标题 + 返回工作台（类型选择已移至工作台，此处不再提供 Tab 切换） -->
      <div class="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 class="text-2xl font-bold text-zinc-800 dark:text-zinc-100 mb-1">{{ title }}</h1>
          <p class="text-sm text-zinc-400">{{ subtitle }}</p>
        </div>
        <router-link to="/workspace" class="shrink-0 flex items-center gap-1.5 px-3.5 h-9 rounded-xl text-xs font-medium bg-white/60 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-300 hover: active:scale-95 transition-all">
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
          工作台
        </router-link>
      </div>

      <!-- 按路由类型渲染对应编辑器 -->
      <PostEditor v-if="mode === 'post'" :my-circles="myCircles" :draft="currentDraft" />
      <VideoEditor v-else-if="mode === 'video'" :my-circles="myCircles" :draft="currentDraft" />
      <MarkdownEditorPage v-else-if="mode === 'workspace'" :my-circles="myCircles" :draft="currentDraft" />
      <CircleEditor v-else :draft="currentDraft" />
    </div>
  </div>
</template>

<script>
export default { name: 'PublishView' }
</script>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import PostEditor from '@/components/publish/PostEditor.vue'
import VideoEditor from '@/components/publish/VideoEditor.vue'
import MarkdownEditorPage from '@/components/publish/MarkdownEditorPage.vue'
import CircleEditor from '@/components/publish/CircleEditor.vue'
import { getMyCircles } from '@/api/circle'
import { getDraft } from '@/utils/drafts'
import { useToastStore } from '@/stores/toast'

const route = useRoute()
const toast = useToastStore()

const mode = ref('post')
const myCircles = ref([])
const draftId = ref('')

const title = computed(() => ({
  post: '发图文博客',
  video: '发视频',
  workspace: 'Markdown 长文',
  circle: '创建新社区'
}[mode.value] || '发布'))

const subtitle = computed(() => ({
  post: '分享你的精彩瞬间',
  video: '上传视频内容，支持弹幕互动',
  workspace: '用 Markdown 书写长文与图文混排内容',
  circle: '创建一个属于你的兴趣频道'
}[mode.value]))

const currentDraft = computed(() => (draftId.value ? getDraft(draftId.value) : null))

// 类型完全由路由决定（工作台选择入口），切换类型请返回工作台
watch(() => route.query.type, (t) => {
  if (t === 'video') mode.value = 'video'
  else if (t === 'circle') mode.value = 'circle'
  else if (t === 'workspace') mode.value = 'workspace'
  else mode.value = 'post'
}, { immediate: true })

watch(() => route.query.draft, (d) => {
  draftId.value = d || ''
  if (d) toast.push('已载入草稿', 'info')
}, { immediate: true })

onMounted(async () => {
  try {
    const res = await getMyCircles()
    const data = res && res.data ? res.data : res
    myCircles.value = data.items || data.list || data || []
  } catch (e) {
    myCircles.value = []
  }
})
</script>
