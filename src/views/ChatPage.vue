<template>
  <!-- 会话页容器：桌面化，「左列表 + 右会话」并排常显 -->
  <div class="max-w-[1400px] mx-auto flex flex-row gap-5 h-[calc(100vh-7.5rem)]">
    <!-- 会话列表：常显 -->
    <ChatSidebar class="flex" />
    <!-- 会话主视窗：与列表并排（群聊面板的开关由本页按路由 query 决定） -->
    <ChatConversation class="flex-1" :group-mode="groupMode" @close-group="closeGroupMode" />
  </div>
</template>

<script lang="ts">
export default { name: 'ChatPage' }
</script>

<script setup lang="ts">
// 会话页：左侧会话列表 + 右侧主视窗。
// 路由 ⇄ store 的转换收敛在本页（ChatConversation 因此不再依赖路由，可被社区页内嵌复用）。
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ChatSidebar from '@/components/chat/ChatSidebar.vue'
import ChatConversation from '@/components/chat/ChatConversation.vue'
import { useChatStore } from '@/stores/chat'

const route = useRoute()
const router = useRouter()
const chat = useChatStore()

// 群聊创建/搜索面板由 ?action= 决定（面板渲染在 ChatConversation 内，开关由本页下发）
const groupMode = computed<string>(() => {
  const a = route.query.action
  return a === 'createGroup' ? 'create' : a === 'searchGroup' ? 'search' : ''
})

// 唯一的「路由 → 会话」入口。
// ⚠️ immediate 会在本页 setup 期同步执行，早于子组件挂载与 ensureLoaded，
//    此刻 sessions/friends 均为空——activateSession 必须不依赖它们（已在 store 内保证）。
watch(() => route.params.sessionId, (id) => {
  if (typeof id === 'string' && id) void chat.activateSession(id)
}, { immediate: true })

function closeGroupMode(): void {
  router.replace({ path: '/chat' })
}
</script>