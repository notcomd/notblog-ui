<template>
  <div class="min-h-screen">
    <!-- 背景图系统：图片层 + 渐变压暗层 + 蒙层（无背景图时不渲染；管理端布局不含此组件） -->
    <BackgroundLayer />
    <!-- 内容层：relative z-10 抬升到背景图层（z-0）之上（负 z-index 会被 body 背景 canvas 盖住，不可用） -->
    <div class="relative z-10">
      <!-- 顶栏（全局固定）；详情页时置灰/模糊化但保持可见 -->
      <TopBar :blurred="isDetail" />
      <!-- 左导航 + 右内容 双栏（个人主页与主页面公用同一布局，SideNav 导航项随路由切换） -->
      <div class="flex pt-16">
        <SideNav :blurred="isDetail" />
        <main class="flex-1 min-w-0 px-6 py-6 overflow-y-auto h-[calc(100vh-4rem)]">
          <router-view v-slot="{ Component }">
            <transition name="page-fade" mode="out-in">
              <keep-alive :include="cachedViews">
                <component :is="Component" />
              </keep-alive>
            </transition>
          </router-view>
        </main>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import TopBar from '@/layout/TopBar.vue'
import SideNav from '@/layout/SideNav.vue'
import BackgroundLayer from '@/components/common/BackgroundLayer.vue'

const route = useRoute()

// 详情页覆盖模式：主框架置灰/模糊
const isDetail = computed(() => route.path.startsWith('/posts/'))

// keep-alive 缓存的信息流视图（返回时保留浏览位置）
const cachedViews = ['HomeView', 'CirclesView', 'ChatView', 'ExploreView', 'UserSpaceView']
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
