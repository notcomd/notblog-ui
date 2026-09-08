<template>
  <!-- 会话页容器：桌面端（≥lg）「左列表 + 右会话」并排；
       移动端单栏切换：无会话ID时显示列表（全宽），进入某会话后全屏显示会话并隐藏列表 -->
  <div class="max-w-[1400px] mx-auto flex flex-col lg:flex-row gap-5 h-[calc(100dvh-9.5rem)] lg:h-[calc(100vh-7.5rem)]">
    <!-- 会话列表：有会话时移动端隐藏（lg:flex 桌面常显）；无会话时始终显示（移动全宽由 ChatSidebar 内部 w-full lg:w-80 控制） -->
    <ChatSidebar :class="hasSessionId ? 'hidden lg:flex' : 'flex'" />
    <!-- 会话主视窗：无会话时移动端隐藏（桌面与列表并排）；有会话时始终显示 -->
    <ChatConversation :class="hasSessionId ? 'flex-1' : 'hidden lg:flex flex-1'" />
  </div>
</template>

<script lang="ts">
export default { name: 'ChatPage' }
</script>

<script setup lang="ts">
// 会话页：将原 ChatView 拆分为侧边栏与主视窗两个功能组件；
// 响应式适配（2026-08）：移动端按 route.params.sessionId 单栏切换列表/会话
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import ChatSidebar from '@/components/chat/ChatSidebar.vue'
import ChatConversation from '@/components/chat/ChatConversation.vue'

const route = useRoute()
// 移动端是否进入「占屏」态（隐藏列表）：已打开某会话，或处于群聊创建/搜索面板
const hasSessionId = computed(() => !!route.params.sessionId || !!route.query.action)
</script>
