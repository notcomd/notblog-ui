<template>
  <div class="py-3">
    <div class="flex gap-3">
      <!-- 头像（首字） -->
      <div class="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
        {{ authorName.slice(0, 1) }}
      </div>
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2">
          <span class="text-sm font-medium text-zinc-700 dark:text-zinc-200">{{ authorName }}</span>
          <span class="text-xs text-zinc-400">{{ timeText }}</span>
          <span v-if="isMine" class="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400">我</span>
        </div>
        <p class="text-sm text-zinc-700 dark:text-zinc-200 mt-1 leading-relaxed break-words">
          <span v-if="replyToName" class="text-amber-600 dark:text-amber-400">回复 @{{ replyToName }}：</span>{{ commentContent }}
        </p>

        <!-- 配图（图片评论特性） -->
        <div v-if="images.length" class="mt-2 grid gap-1.5" :class="images.length === 1 ? 'grid-cols-1 max-w-[280px]' : 'grid-cols-3 max-w-[420px]'">
          <img
            v-for="(img, idx) in images"
            :key="idx"
            :src="img"
            class="w-full aspect-square object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
            @click="openImage(img)"
            @error="hideImg"
          />
        </div>

        <!-- 操作行 -->
        <div class="flex items-center gap-4 mt-1.5">
          <button v-if="cfg.like" class="flex items-center gap-1 text-xs text-zinc-400 hover:text-red-500 transition-colors" @click="onLike">
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21.2l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z" />
            </svg>
            {{ likeCount }}
          </button>
          <button v-if="canReply" class="text-xs text-zinc-400 hover:text-amber-500 transition-colors" @click="onReply">回复</button>
          <button v-if="isMine" class="text-xs text-zinc-400 hover:text-red-500 transition-colors" @click="onRemove">删除</button>
        </div>

        <!-- 子评论（懒加载，最多 3 条展开） -->
        <div v-if="children.length" class="mt-2 pl-3 border-l-2 border-zinc-200 dark:border-zinc-700 space-y-2">
          <CommentItem
            v-for="c in visibleChildren"
            :key="idOf(c)"
            :comment="c"
            :cfg="cfg"
            :root-comment="rootComment"
            :reply-to-name="replyToNameOf(c)"
            @reply="$emit('reply', $event)"
            @remove="$emit('remove', $event)"
          />
          <button v-if="replyCount > visibleChildren.length" class="text-xs text-amber-500 hover:text-amber-600" @click="loadChildren">
            查看全部 {{ replyCount }} 条回复
          </button>
        </div>
        <div v-else-if="replyCount > 0 && !childrenLoaded" class="mt-2">
          <button class="text-xs text-amber-500 hover:text-amber-600" @click="loadChildren">查看 {{ replyCount }} 条回复</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { relativeTime } from '@/utils/format'
import { unwrap } from '@/utils/response'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

// ============================================================
// 通用评论条目：与 CommentSection 配套，递归渲染子评论。
// 字段读取经 cfg 映射，适配 tweets / markdown 两套 DTO。
// ============================================================
interface CommentConfig {
  idField: string
  likeCountField?: string
  contentField?: string
  timeField?: string
  replyCountField?: string
  imagesField?: string
  replyMode?: string
  replier?: (id: any, payload: any) => any
  creator?: (payload: any) => any
  replyLoader?: (id: any) => any
  like?: (id: any) => any
  authorName?: (c: any) => string
  authorId?: (c: any) => any
}

interface ReplyTarget {
  root: any
  target: any
}

const props = defineProps<{
  comment: any
  cfg: CommentConfig
  rootComment?: any
  replyToName?: string
}>()

const rootComment = computed(() => props.rootComment || props.comment)
const children = ref<any[]>([])
const childrenLoaded = ref(false)
const visibleChildren = computed(() => children.value.slice(0, 3))

// ---------- 字段映射 ----------
const idOf = (c: any): any => c[props.cfg.idField]
const commentContent = computed(() => props.comment[props.cfg.contentField] || '')
const timeText = computed(() => relativeTime(props.comment[props.cfg.timeField] || props.comment.createTime || props.comment.reviewTime))
const likeCount = computed(() => (props.comment[props.cfg.likeCountField] ?? (props.comment.quote && props.comment.quote.loveCount) ?? 0))
const replyCount = computed(() => (props.comment[props.cfg.replyCountField] ?? (props.comment.quote && props.comment.quote.replyCount) ?? props.comment.childReviewCount ?? 0))
const images = computed(() => (props.cfg.imagesField ? (props.comment[props.cfg.imagesField] || []) : []))
const authorName = computed(() => props.cfg.authorName ? props.cfg.authorName(props.comment) : '用户')
const authorId = computed(() => props.cfg.authorId ? props.cfg.authorId(props.comment) : '')
const isMine = computed(() => {
  const uid = authorId.value
  return !!uid && String(uid).toLowerCase() === String(auth.user && auth.user.id).toLowerCase()
})

// 子回复显示「回复 @被回复者」（无作者名映射时回退当前父评论作者名）
function replyToNameOf(c: any): string {
  const n = props.cfg.authorName ? props.cfg.authorName(c) : ''
  return n || props.replyToName || '用户'
}

// 回复能力：tweets 折叠模式（creator 带 parentGuid）/ markdown 直接回复（replier）
const canReply = computed(() => !!(props.cfg.creator && (props.cfg.replyMode === 'fold' || props.cfg.replier)))

async function loadChildren() {
  if (!props.cfg.replyLoader) return
  try {
    const res = await props.cfg.replyLoader(idOf(props.comment))
    const data = unwrap(res)
    children.value = Array.isArray(data) ? data : ((data && (data.items || data.list)) || [])
    childrenLoaded.value = true
  } catch (e) {
    console.error('加载回复失败:', e)
  }
}

function onReply() {
  emit('reply', { root: rootComment.value, target: props.comment })
}

function onRemove() {
  emit('remove', { root: rootComment.value, target: props.comment })
}

function onLike() {
  // 无点赞端点时本地 +1（tweets 评论现状）
  if (!props.cfg.like) {
    if (props.cfg.likeCountField) props.comment[props.cfg.likeCountField] = likeCount.value + 1
    else if (props.comment.quote) props.comment.quote.loveCount = likeCount.value + 1
    return
  }
  emit('like', props.comment)
}

function openImage(url: string) { window.open(url, '_blank') }
function hideImg(e: Event) { (e.target as HTMLElement).style.visibility = 'hidden' }

const emit = defineEmits<{
  reply: [payload: ReplyTarget]
  remove: [payload: ReplyTarget]
  like: [comment: any]
}>()
</script>
