<template>
  <div class="flex flex-col h-full">
    <!-- 顶部：全部评论 + 排序 -->
    <div class="flex items-center justify-between px-1 pb-3 border-b border-zinc-200/60 dark:border-zinc-700/60">
      <span class="text-sm font-semibold text-zinc-700 dark:text-zinc-200">全部评论 ({{ total }})</span>
      <div class="flex gap-1 text-xs">
        <button class="px-2 py-1 rounded-[5%] transition-colors" :class="sort === 'new' ? 'bg-amber-400/15 text-amber-600 dark:text-amber-400' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 dark:text-zinc-300'" @click="setSort('new')">最新</button>
        <button class="px-2 py-1 rounded-[5%] transition-colors" :class="sort === 'hot' ? 'bg-amber-400/15 text-amber-600 dark:text-amber-400' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 dark:text-zinc-300'" @click="setSort('hot')">热门</button>
      </div>
    </div>

    <!-- 评论列表（独立滚动） -->
    <div class="flex-1 overflow-y-auto py-2 px-1 space-y-1 min-h-0">
      <!-- 空状态 -->
      <div v-if="!loading && items.length === 0" class="py-16 flex flex-col items-center gap-3">
        <div class="text-5xl">💬</div>
        <p class="text-sm text-zinc-400">还没有评论，快来抢沙发吧～</p>
      </div>
      <!-- 加载中骨架 -->
      <div v-else-if="loading" class="space-y-4 py-4">
        <div v-for="i in 4" :key="i" class="flex gap-3 animate-pulse">
          <div class="w-9 h-9 rounded-full bg-zinc-200/70 dark:bg-zinc-800/70"></div>
          <div class="flex-1 space-y-2">
            <div class="h-3 w-24 rounded bg-zinc-200/70 dark:bg-zinc-800/70"></div>
            <div class="h-3 w-3/4 rounded bg-zinc-200/70 dark:bg-zinc-800/70"></div>
          </div>
        </div>
      </div>
      <CommentItem
        v-for="c in sortedItems"
        :key="c.commentGuid"
        :comment="c"
        @reply="startReply"
        @remove="removeComment"
      />
      <div v-if="hasMore && !loading" ref="sentinel" class="h-8"></div>
    </div>

    <!-- 底部固定输入框 -->
    <div class="pt-3 border-t border-zinc-200/60 dark:border-zinc-700/60">
      <div v-if="replyingTo" class="flex items-center justify-between mb-1.5 px-1">
        <span class="text-xs text-amber-600 dark:text-amber-400">回复 @{{ replyingTo.user.userName }}</span>
        <button class="text-xs text-zinc-400 hover:text-zinc-600 dark:text-zinc-300" @click="replyingTo = null">取消</button>
      </div>
      <div class="flex items-end gap-2">
        <div class="relative flex-1">
          <textarea
            v-model="draft"
            rows="2"
            class="w-full resize-none rounded-[5%] bg-white/60 dark:bg-zinc-800/60 border border-white/50 dark:border-white/10 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-400/50 transition-all"
            :placeholder="replyingTo ? '回复 ' + replyingTo.user.userName + '...' : '说点什么... (支持 Enter 发送)'"
            @keydown.enter.exact.prevent="submit"
          ></textarea>
          <!-- Emoji 面板 -->
          <div v-if="emojiOpen" class="absolute bottom-full left-0 mb-2 glass-card p-2 w-64 z-20">
            <div class="grid grid-cols-8 gap-1">
              <button v-for="e in EMOJIS" :key="e" class="w-7 h-7 rounded-[5%] hover:bg-amber-50 dark:hover:bg-zinc-800 text-base transition-colors" @click="insertEmoji(e)">{{ e }}</button>
            </div>
          </div>
        </div>
        <button class="w-9 h-9 rounded-[5%] flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:bg-white/60 dark:hover:bg-zinc-800/60 transition-colors" title="表情" @click="emojiOpen = !emojiOpen">
          <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" />
          </svg>
        </button>
        <button class="h-10 px-4 rounded-[5%] bg-gradient-to-r from-amber-400 to-orange-500 text-white text-sm font-medium hover: active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100" :disabled="!draft.trim() || sending" @click="submit">
          发送
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import CommentItem from './CommentItem.vue'
import { getComments, addComment, deleteComment } from '@/api/comment'

const props = defineProps({
  tweetGuid: { type: String, required: true }
})

const EMOJIS = ['😀', '😄', '😂', '🤣', '😊', '😍', '😘', '🥰', '😎', '🤔', '👍', '👏', '🙏', '💪', '🔥', '🎉', '❤️', '💔', '⭐', '🌹', '🌻', '🍻', '☕', '🎂', '🚀', '🌈', '🌊', '🏔️', '🐱', '🐶', '🍀', '✨']

const items = ref([])
const total = ref(0)
const loading = ref(false)
const sending = ref(false)
const page = ref(0)
const hasMore = ref(true)
const sort = ref('new')
const draft = ref('')
const emojiOpen = ref(false)
const replyingTo = ref(null)
const sentinel = ref(null)
let observer = null

const sortedItems = computed(() => {
  if (sort.value === 'hot') {
    return [...items.value].sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0))
  }
  return items.value
})

async function loadMore(reset = false) {
  if (loading.value) return
  if (reset) {
    items.value = []
    page.value = 0
    hasMore.value = true
  }
  if (!hasMore.value) return
  loading.value = true
  try {
    const res = await getComments(props.tweetGuid, { page: page.value + 1, pageSize: 20 })
    const data = res && res.data ? res.data : res
    const list = data.items || data.list || []
    items.value = reset ? list : [...items.value, ...list]
    total.value = data.total || items.value.length
    page.value = data.page || page.value + 1
    hasMore.value = list.length >= 20
  } catch (e) {
    console.error('加载评论失败:', e)
  } finally {
    loading.value = false
  }
}

function setSort(s) {
  sort.value = s
}

function startReply(comment) {
  replyingTo.value = comment
  emojiOpen.value = false
}

function insertEmoji(e) {
  draft.value += e
}

async function submit() {
  const content = draft.value.trim()
  if (!content || sending.value) return
  sending.value = true
  try {
    const payload = {
      tweetGuid: props.tweetGuid,
      content,
      parentGuid: replyingTo.value ? replyingTo.value.commentGuid : null,
      replyToGuid: replyingTo.value ? replyingTo.value.commentGuid : null
    }
    const res = await addComment(payload)
    const created = res && res.data && (res.data.data || res.data)
    // 乐观更新：插入到列表顶部
    if (created && created.commentGuid) {
      items.value.unshift(created)
      total.value += 1
    }
    draft.value = ''
    replyingTo.value = null
  } catch (e) {
    console.error('评论发送失败:', e)
  } finally {
    sending.value = false
  }
}

async function removeComment(comment) {
  try {
    await deleteComment(comment.commentGuid)
    items.value = items.value.filter(c => c.commentGuid !== comment.commentGuid)
    total.value = Math.max(0, total.value - 1)
  } catch (e) {
    console.error('删除评论失败:', e)
  }
}

onMounted(() => {
  loadMore(true)
  observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) loadMore()
  }, { rootMargin: '100px' })
  if (sentinel.value) observer.observe(sentinel.value)
})

onUnmounted(() => {
  if (observer) observer.disconnect()
})
</script>
