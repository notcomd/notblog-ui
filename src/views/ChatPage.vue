<template>
  <!-- 会话页容器：左侧会话列表 + 右侧聊天主视窗 -->
  <div class="max-w-[1400px] mx-auto flex gap-5 h-[calc(100vh-7.5rem)]">
    <ChatSidebar />
    <ChatConversation />
  </div>
</template>

<script lang="ts">
export default { name: 'ChatPage' }
</script>

<script setup lang="ts">
// 会话页：将原 ChatView 拆分为侧边栏与主视窗两个功能组件
import ChatSidebar from '@/components/chat/ChatSidebar.vue'
import ChatConversation from '@/components/chat/ChatConversation.vue'
</script>
