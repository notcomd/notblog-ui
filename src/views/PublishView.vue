<template>
  <!-- 专注写作时解除宽度上限，编辑器横向也铺满；平时收窄成适合书写的单栏 -->
  <div class="mx-auto" :class="focus.focusMode ? 'max-w-none' : 'max-w-[860px]'">
    <div :class="focus.focusMode ? '' : 'pb-4'">
      <!-- 页头：返回工作台 + 标题（无框，靠字重与留白分层） -->
      <header v-if="!focus.focusMode" class="mb-7">
        <router-link to="/workspace" class="inline-flex items-center gap-1.5 text-xs text-zinc-500 transition-colors hover:text-amber-600 dark:text-zinc-400 dark:hover:text-amber-400">
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
          工作台
        </router-link>
        <h1 class="mt-3 font-display text-2xl font-bold text-zinc-800 dark:text-zinc-100">{{ title }}</h1>
        <p class="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">{{ subtitle }}</p>
      </header>

      <!-- 按路由类型渲染对应编辑器 -->
      <PostEditor v-if="mode === 'post'" :my-circles="myCircles" :draft="currentDraft" />
      <VideoEditor v-else-if="mode === 'video'" :my-circles="myCircles" :draft="currentDraft" />
      <MarkdownEditorPage v-else-if="mode === 'workspace'" :my-circles="myCircles" :draft="currentDraft" />
    </div>
  </div>
</template>

<script lang="ts">
export default { name: 'PublishView' }
</script>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import PostEditor from '@/components/publish/PostEditor.vue'
import VideoEditor from '@/components/publish/VideoEditor.vue'
import MarkdownEditorPage from '@/components/publish/MarkdownEditorPage.vue'
import { getMyCircles } from '@/api/circle'
import { getDraft } from '@/utils/drafts'
import { useToastStore } from '@/stores/toast'
import { useFocusStore } from '@/stores/focus'

const route = useRoute()
const toast = useToastStore()
const focus = useFocusStore()

const mode = ref<'post' | 'video' | 'workspace'>('post')
const myCircles = ref<any[]>([])
const draftId = ref('')

const title = computed<string>(() => ({
  post: '发图文博客',
  video: '发视频',
  workspace: 'Markdown 长文'
}[mode.value] || '发布'))

const subtitle = computed<string>(() => ({
  post: '分享你的精彩瞬间',
  video: '上传视频内容，支持弹幕互动',
  workspace: '用 Markdown 书写长文与图文混排内容'
}[mode.value]))

const currentDraft = computed(() => (draftId.value ? getDraft(draftId.value) : null))

// 类型完全由路由决定（工作台选择入口），切换类型请返回工作台
watch(() => route.query.type, (t) => {
  if (t === 'video') mode.value = 'video'
  else if (t === 'workspace' || t === 'markdown') mode.value = 'workspace'
  else mode.value = 'post'
}, { immediate: true })

watch(() => route.query.draft, (d) => {
  draftId.value = (d as string) || ''
  if (d) toast.push('已载入草稿', 'info')
}, { immediate: true })

onMounted(async () => {
  try {
    const res = await getMyCircles()
    const data: any = res && res.data ? res.data : res
    myCircles.value = data.items || data.list || data || []
  } catch (e) {
    myCircles.value = []
  }
})
</script>
