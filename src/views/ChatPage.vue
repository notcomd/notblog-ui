<template>
  <!-- 会话页容器：桌面化，「左列表 + 右会话/功能面板」并排常显 -->
  <div class="max-w-[1400px] mx-auto flex flex-row gap-5 h-[calc(100vh-7.5rem)]">
    <!-- 会话列表：常显 -->
    <ChatSidebar class="flex" />
    <!-- 右侧主视窗：默认是会话，也可切换为群聊/好友的功能面板（由本页按路由 query 决定） -->
    <ChatConversation class="flex-1" :panel-mode="panelMode" @close-panel="closePanel" />
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

/**
 * 右侧主视窗的模式：空串 = 会话；其余为功能面板。
 * 四种查询参数归一为前缀化的模式标识（群聊与好友各有一个 search，需可区分），
 * 面板组件只认模式标识，不再关心 URL 长什么样。
 */
const PANEL_MODES: Record<string, string> = {
  createGroup: 'group-create',
  searchGroup: 'group-search',
  addFriend: 'friend-add',
  searchFriend: 'friend-search'
}

const panelMode = computed<string>(() => {
  const a = route.query.action
  return (typeof a === 'string' && PANEL_MODES[a]) || ''
})

// 唯一的「路由 → 会话」入口。
// ⚠️ immediate 会在本页 setup 期同步执行，早于子组件挂载与 ensureLoaded，
//    此刻 sessions/friends 均为空——activateSession 必须不依赖它们（已在 store 内保证）。
watch(() => route.params.sessionId, (id) => {
  if (typeof id === 'string' && id) void chat.activateSession(id)
}, { immediate: true })

/** 关闭功能面板：清掉 action，回到普通会话视图 */
function closePanel(): void {
  router.replace({ path: '/chat' })
}
</script>