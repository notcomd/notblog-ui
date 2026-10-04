<template>
  <!-- 根路由过渡：布局之间（用户端 / 管理端 / 登入页）切换时淡入淡出。
       不用 mode="out-in"（会闩死主内容区，详见 input.css 的说明） -->
  <router-view v-slot="{ Component }">
    <Transition
      enter-active-class="qm-page-enter-active"
      enter-from-class="qm-page-enter-from"
      leave-active-class="qm-page-leave-active"
      leave-to-class="qm-page-leave-to"
    >
      <component :is="Component" class="min-h-screen" />
    </Transition>
  </router-view>
  <ToastHost />
</template>

<script setup lang="ts">
import ToastHost from '@/components/common/ToastHost.vue'
</script>
