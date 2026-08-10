<template>
  <!-- 路由视图 - 仅在路由匹配时显示 -->
  <router-view class="min-h-screen" />
  <ToastHost />
</template>

<script>
import ToastHost from '@/components/common/ToastHost.vue'

export default {
  name: 'App',
  components: { ToastHost }
}
</script>
