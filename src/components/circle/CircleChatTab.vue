<template>
  <!-- 社区聊天 tab：拉取社区 Channel 会话并激活，内嵌通用聊天组件 -->
  <div class="mt-4 flex-1 min-h-0 flex flex-col">
    <div v-if="loading" class="py-12 text-center text-xs text-zinc-400">加载社区聊天...</div>
    <div v-else-if="error" class="py-12 text-center text-xs text-zinc-400">{{ error }}</div>
    <ChatConversation v-else-if="ready" class="flex-1 min-h-0" />
  </div>
</template>

<script setup lang="ts">
// 社区聊天：GET /api/circles/{id}/session 获取 Channel 会话 → 注入 chat store 并激活 → 复用 ChatConversation
import { onBeforeUnmount, ref, watch } from 'vue'
import ChatConversation from '@/components/chat/ChatConversation.vue'
import { getCircleSession } from '@/api/circle'
import { useChatStore } from '@/stores/chat'

const props = defineProps<{
  current: { circleGuid?: string } | null
}>()

const chat = useChatStore()
const loading = ref(false)
const error = ref('')
const ready = ref(false)
let activatedId = ''

async function activate() {
  const circleGuid = props.current?.circleGuid
  if (!circleGuid) return
  loading.value = true
  error.value = ''
  ready.value = false
  try {
    const res = await getCircleSession(circleGuid)
    const data = res && res.data ? res.data : res
    const body = data && data.data ? data.data : data
    const session = body || {}
    if (!session.sessionId) throw new Error('社区聊天会话不存在')

    // 注入会话列表（不存在则追加），避免 ChatConversation 找不到会话
    if (!chat.sessions.some((s) => s.sessionId === session.sessionId)) {
      chat.sessions.push(session)
    }
    activatedId = session.sessionId
    await chat.openSession(activatedId)
    ready.value = true
  } catch (e: any) {
    error.value = (e && e.message) || '社区聊天加载失败'
  } finally {
    loading.value = false
  }
}

// 切换社区（不同 circleGuid）时重新激活对应会话
watch(() => props.current?.circleGuid, activate, { immediate: true })

onBeforeUnmount(() => {
  // 离开聊天 tab 时复位激活会话，避免影响消息页
  if (activatedId && chat.activeSessionId === activatedId) {
    chat.activeSessionId = ''
  }
})
</script>
