<template>
  <!-- 会话页容器：桌面化，「左列表 + 右会话」并排常显 -->
  <div class="max-w-[1400px] mx-auto flex flex-row gap-5 h-[calc(100vh-7.5rem)]">
    <!-- 会话列表：常显 -->
    <ChatSidebar class="flex" />
    <!-- 会话主视窗：与列表并排 -->
    <ChatConversation class="flex-1" />
  </div>
</template>

<script lang="ts">
export default { name: 'ChatPage' }
</script>

<script setup lang="ts">
// 会话页：将原 ChatView 拆分为侧边栏与主视窗两个功能组件（桌面布局，去移动端单栏切换）
import ChatSidebar from '@/components/chat/ChatSidebar.vue'
import ChatConversation from '@/components/chat/ChatConversation.vue'
</script>