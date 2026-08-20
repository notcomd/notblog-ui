<template>
  <div class="py-3">
    <div class="flex gap-3">
      <img :src="avatar" alt="" class="w-9 h-9 rounded-full object-cover shrink-0 border border-white/60 dark:border-white/10" @error="hideAvatar" />
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2">
          <span class="text-sm font-medium text-zinc-700 dark:text-zinc-200">{{ userName }}</span>
          <span class="text-xs text-zinc-400">{{ timeText }}</span>
          <span v-if="isMine" class="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400">我</span>
        </div>
        <p class="text-sm text-zinc-700 dark:text-zinc-200 mt-1 leading-relaxed break-words">
          <span v-if="replyToName" class="text-amber-600 dark:text-amber-400">回复 @{{ replyToName }}：</span>{{ comment.content }}
        </p>
        <div class="flex items-center gap-4 mt-1.5">
          <button class="flex items-center gap-1 text-xs text-zinc-400 hover:text-red-500 transition-colors" @click="onLike">
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21.2l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z" />
            </svg>
            {{ comment.likeCount || 0 }}
          </button>
          <button class="text-xs text-zinc-400 hover:text-amber-500 transition-colors" @click="onReply">回复</button>
          <button v-if="isMine" class="text-xs text-zinc-400 hover:text-red-500 transition-colors" @click="onRemove">删除</button>
        </div>

        <!-- 嵌套回复：最多 3 条，超出折叠 -->
        <div v-if="replies.length" class="mt-2 pl-3 border-l-2 border-zinc-200 dark:border-zinc-700 space-y-2">
          <CommentItem
            v-for="r in visibleReplies"
            :key="r.commentGuid"
            :comment="r"
            :root-comment="rootComment"
            :reply-to-name="replyToNameOf(r)"
            @reply="$emit('reply', $event)"
            @remove="$emit('remove', $event)"
          />
          <button v-if="comment.replyCount > visibleReplies.length" class="text-xs text-amber-500 hover:text-amber-600" @click="loadMoreReplies">
            查看全部 {{ comment.replyCount }} 条回复
          </button>
        </div>
        <div v-else-if="comment.replyCount > 0 && !repliesLoaded" class="mt-2">
          <button class="text-xs text-amber-500 hover:text-amber-600" @click="loadReplies">查看 {{ comment.replyCount }} 条回复</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { relativeTime } from '@/utils/format'
import { getReplies } from '@/api/comment'
import { useAuthStore } from '@/stores/auth'

const props = defineProps({
  comment: { type: Object, required: true },
  // 顶层评论对象：回复折叠到顶层（后端嵌套限制 2 层，子评论的「回复」转换为
  // parentGuid=顶层 + replyToGuid=被回复评论）。不传时自身即为顶层。
  rootComment: { type: Object, default: null },
  replyToName: { type: String, default: '' }
})

const auth = useAuthStore()

// 真实后端 user.userGuid 与当前登录用户比对（曾写死 'me' 导致删除按钮永不显示）
const isMine = computed(() => {
  const uid = props.comment.user && props.comment.user.userGuid
  return !!uid && String(uid).toLowerCase() === String(auth.user && auth.user.id).toLowerCase()
})

const rootComment = computed(() => props.rootComment || props.comment)

const replies = ref([])
const repliesLoaded = ref(false)

const visibleReplies = computed(() => replies.value.slice(0, 3))

// 子回复显示「回复 @被回复者」，被回复者 = 该子回复的 replyToGuid 指向的评论作者；
// 列表接口未返回作者名映射时回退显示当前父评论作者
function replyToNameOf(r) {
  return (r.user && r.user.userName) || (props.comment.user && props.comment.user.userName) || ''
}

async function loadReplies() {
  try {
    const res = await getReplies(props.comment.commentGuid)
    const data = res && res.data ? res.data : res
    replies.value = (data && (data.items || data.list)) || []
    repliesLoaded.value = true
  } catch (e) {
    console.error('加载回复失败:', e)
  }
}

function loadMoreReplies() {
  // 展开更多回复（当前简化：全部展开）
  repliesLoaded.value = true
}

const avatar = computed(() => props.comment.user ? (props.comment.user.avatar || '') : '')
const userName = computed(() => props.comment.user ? (props.comment.user.userName || '用户') : '用户')
const timeText = computed(() => relativeTime(props.comment.createTime))

function hideAvatar(e) {
  e.target.style.visibility = 'hidden'
}

function onLike() {
  // Phase 5：评论点赞后端无端点，本地+1
  props.comment.likeCount = (props.comment.likeCount || 0) + 1
}

// 回复：顶层评论回复自身；子评论折叠到顶层（携带 root 供父级构造 parentGuid/replyToGuid）
const emit = defineEmits(['reply', 'remove'])

function onReply() {
  emit('reply', { root: rootComment.value, target: props.comment })
}

function onRemove() {
  emit('remove', { root: rootComment.value, target: props.comment })
}
</script>
