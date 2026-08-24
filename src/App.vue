<template>
  <!-- 路由视图 - 仅在路由匹配时显示 -->
  <router-view class="min-h-screen" />
  <!-- 全局通知弹窗（顶部堆叠：图标 + 名称 + 消息 + 时间，已统一替代旧纯文本 toast） -->
  <ToastHost />
</template>

<script lang="ts">
import ToastHost from '@/components/common/ToastHost.vue'

export default {
  name: 'App',
  components: { ToastHost }
}
</script>
