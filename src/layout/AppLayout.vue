<template>
  <div class="min-h-screen">
    <!-- 背景图系统：图片层 + 渐变压暗层 + 蒙层（无背景图时不渲染；管理端布局不含此组件） -->
    <BackgroundLayer />
    <!-- 内容层：relative z-10 抬升到背景图层（z-0）之上（负 z-index 会被 body 背景 canvas 盖住，不可用） -->
    <div class="relative z-10 flex">
      <!-- 左侧功能栏：专注模式下隐藏（Markdown 长文写作让出整屏） -->
      <SideNav v-if="!focus.focusMode" class="flex" />
      <!-- 右侧：顶栏 + 内容区（顶栏不再横跨全屏，Logo 已移至左侧功能栏） -->
      <div class="flex-1 min-w-0 flex flex-col">
        <TopBar v-if="!focus.focusMode" />
        <main
          ref="mainBox"
          class="flex-1 min-h-0 overflow-y-auto scroll-native"
          :class="focus.focusMode ? 'p-3' : 'px-6 py-6'"
        >
          <router-view v-slot="{ Component }">
            <transition name="page-fade">
              <keep-alive :include="cachedViews">
                <component :is="Component" />
              </keep-alive>
            </transition>
          </router-view>
        </main>
      </div>
    </div>

    <!-- 回到顶部（专注模式下隐藏，避免遮挡编辑器） -->
    <button
      v-if="showTopBtn && !focus.focusMode"
      class="fixed bottom-6 right-6 z-50 w-11 h-11 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200/70 dark:border-zinc-700/60 flex items-center justify-center text-zinc-500 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700/60 active:scale-95 transition-all"
      title="回到顶部"
      aria-label="回到顶部"
      type="button"
      @click="scrollToTop"
    >
      <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5" /><polyline points="5 12 12 5 19 12" /></svg>
    </button>

    <!-- 语音/视频通话面板（全局，来电/通话覆盖任意页面） -->
    <CallPanel />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import TopBar from '@/layout/TopBar.vue'
import SideNav from '@/layout/SideNav.vue'
import BackgroundLayer from '@/components/common/BackgroundLayer.vue'
import CallPanel from '@/components/chat/CallPanel.vue'
import { useFocusStore } from '@/stores/focus'

const route = useRoute()
const focus = useFocusStore()

// 兜底：离开发布页时确保退出专注模式（防止组件异常卸载后框架长期隐藏）
watch(() => route.path, (p) => {
  if (p !== '/publish') focus.exit()
})

// keep-alive 缓存的信息流视图（返回时保留浏览位置）
const cachedViews: string[] = ['HomeView', 'CirclePage', 'ChatPage', 'UserSpaceView']

// ===== 回到顶部（全局；页面内部滚动容器用 data-scroll-container 标记，如 CirclesView） =====
const mainBox = ref<HTMLElement | null>(null)
const showTopBtn = ref(false)
const TOP_BTN_THRESHOLD = 400

function currentScrollTop(): number {
  // 内容撑高页面时滚动发生在 window；社区页等内部容器独立滚动
  const inner = document.querySelector('[data-scroll-container]')
  return Math.max(
    window.scrollY || 0,
    mainBox.value ? mainBox.value.scrollTop : 0,
    inner ? inner.scrollTop : 0
  )
}

function onMainScroll(): void {
  showTopBtn.value = currentScrollTop() > TOP_BTN_THRESHOLD
}

function scrollToTop(): void {
  if ((window.scrollY || 0) > 0) {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    return
  }
  const inner = document.querySelector('[data-scroll-container]')
  const target = (inner && inner.scrollTop > 0) ? inner : mainBox.value
  if (target) target.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(() => {
  // capture 阶段监听：window 滚动与页面内部滚动容器（CirclesView 等）都能触发
  window.addEventListener('scroll', onMainScroll, true)
})
onUnmounted(() => {
  window.removeEventListener('scroll', onMainScroll, true)
})
</script>

<style scoped>
.page-fade-enter-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.page-fade-leave-active {
  transition: opacity 0.15s ease;
}

.page-fade-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.page-fade-leave-to {
  opacity: 0;
}
</style>
