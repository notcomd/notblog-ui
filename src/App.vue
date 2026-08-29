<template>
  <!-- 路由视图 - 仅在路由匹配时显示 -->
  <router-view class="min-h-screen" />
  <!-- 全局通知弹窗（顶部堆叠：图标 + 名称 + 消息 + 时间，已统一替代旧纯文本 toast） -->
  <ToastHost />
</template>

<script lang="ts">
import ToastHost from '@/components/common/ToastHost.vue'
import { useNotificationStore } from '@/stores/notification'
import { getToken } from '@/utils/auth'

export default {
  name: 'App',
  components: { ToastHost },
  mounted() {
    // 登录态下初始化站内通知实时通道（SignalR PushNotification + 未读数）
    if (getToken()) {
      useNotificationStore().initNotifications()
    }
  }
}
</script>
