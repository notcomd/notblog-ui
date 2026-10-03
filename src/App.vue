<template>
  <!-- 根路由过渡：布局之间（用户端 / 管理端 / 登入页）切换时淡入淡出 -->
  <router-view v-slot="{ Component }">
    <Transition :css="false" mode="out-in" @enter="pageEnter" @leave="pageLeave">
      <component :is="Component" class="min-h-screen" />
    </Transition>
  </router-view>
  <ToastHost />
</template>

<script setup lang="ts">
import ToastHost from '@/components/common/ToastHost.vue'
import { pageEnter, pageLeave } from '@/utils/pageTransition'
</script>
