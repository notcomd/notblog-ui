<template>
  <div class="flex flex-col h-full">
    <!-- 顶部：全部评论 + 排序 -->
    <div class="flex items-center justify-between px-1 pb-3 border-b border-zinc-200/60 dark:border-zinc-700/60">
      <span class="text-sm font-semibold text-zinc-700 dark:text-zinc-200">全部评论 ({{ total }})</span>
      <div v-if="cfg.sortable" class="flex gap-1 text-xs">
        <button class="px-2 py-1 rounded-[5%] transition-colors" :class="sort === 'new' ? 'bg-amber-400/15 text-amber-600 dark:text-amber-400' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 dark:text-zinc-300'" @click="setSort('new')">最新</button>
        <button class="px-2 py-1 rounded-[5%] transition-colors" :class="sort === 'hot' ? 'bg-amber-400/15 text-amber-600 dark:text-amber-400' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 dark:text-zinc-300'" @click="setSort('hot')">热门</button>
      </div>
    </div>

    <!-- 评论列表（独立滚动） -->
    <div class="flex-1 overflow-y-auto py-2 px-1 space-y-1 min-h-0">
      <div v-if="!loading && items.length === 0" class="py-16 flex flex-col items-center gap-3">
        <div class="text-5xl"><svg class="w-12 h-12 mx-auto text-zinc-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></div>
        <p class="text-sm text-zinc-400">还没有评论，快来抢沙发吧～</p>
      </div>
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
        :key="idOf(c)"
        :comment="c"
        :cfg="cfg"
        @reply="startReply"
        @remove="removeComment"
        @like="toggleLike"
      />
      <div v-if="hasMore && !loading" ref="sentinel" class="h-8"></div>
    </div>

    <!-- 底部固定输入框 -->
    <div class="pt-3 border-t border-zinc-200/60 dark:border-zinc-700/60">
      <div v-if="replyingTo" class="flex items-center justify-between mb-1.5 px-1">
        <span class="text-xs text-amber-600 dark:text-amber-400">回复 @{{ replyName }}</span>
        <button class="text-xs text-zinc-400 hover:text-zinc-600 dark:text-zinc-300" @click="replyingTo = null">取消</button>
      </div>
      <div class="flex items-end gap-2">
        <div class="relative flex-1">
          <textarea
            v-model="draft"
            rows="2"
            class="w-full resize-none rounded-[5%] bg-white/60 dark:bg-zinc-800/60 border border-white/50 dark:border-white/10 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-400/50 transition-all"
            :placeholder="replyingTo ? '回复 ' + replyName + '...' : '说点什么... (支持 Enter 发送)'"
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
      <!-- 图片选择与预览（图片评论特性） -->
      <div v-if="cfg.images" class="mt-2 flex items-start gap-2 px-1">
        <button
          class="h-8 px-3 rounded-lg bg-white/60 dark:bg-zinc-800/60 text-zinc-500 dark:text-zinc-400 text-xs hover:text-amber-500 transition-colors inline-flex items-center gap-1.5"
          :disabled="images.length >= 9 || uploading"
          @click="pickImages"
        >
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          {{ uploading ? '上传中...' : '图片（最多 9 张）' }}
        </button>
        <input ref="imageInput" type="file" accept="image/*" multiple class="hidden" @change="onImagesPick" />
        <div v-if="images.length" class="flex flex-wrap gap-1.5">
          <div v-for="(img, idx) in images" :key="idx" class="relative">
            <img :src="img" class="w-14 h-14 object-cover rounded-lg" @error="hideImg" />
            <button class="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center" @click="images.splice(idx, 1)">✕</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import CommentItem from './CommentItem.vue'
import { useToastStore } from '@/stores/toast'
import { uploadImage } from '@/api/publish'
import { unwrap } from '@/utils/response'

// ============================================================
// 通用评论组件：适配 tweets 评论与 Markdown 评论两套后端。
// 通过 cfg 注入 API 函数与字段映射，避免复制模板代码。
//   - tweets（PostDetailView）：分页 + 排序 + 回复折叠（parentGuid/replyToGuid）
//   - markdown（MarkdownDetailView）：全量 + 图片评论 + 子评论接口
// ============================================================
const props = defineProps({
  // cfg：评论配置（见下方 buildCfg 注释，父组件构造传入）
  cfg: { type: Object, required: true }
})

const toast = useToastStore()

const EMOJIS = ['😀', '😄', '😂', '🤣', '😊', '😍', '😘', '🥰', '😎', '🤔', '👍', '👏', '🙏', '💪', '🔥', '🎉', '❤️', '💔', '⭐', '🌹', '🌻', '🍻', '☕', '🎂', '🚀', '🌈', '🌊', '🏔️', '🐱', '🐶', '🍀', '✨']

// ---------- 字段映射（读原始对象，兼容两套 DTO；条目级读取在 CommentItem 内） ----------
const idOf = (c) => c[props.cfg.idField]
const likeCountOf = (c) => (c[props.cfg.likeCountField] ?? (c.quote && c.quote.loveCount) ?? 0)

const items = ref([])
const total = ref(0)
const loading = ref(false)
const sending = ref(false)
const page = ref(0)
const hasMore = ref(true)
const sort = ref('new')
const draft = ref('')
const emojiOpen = ref(false)
const images = ref([])
const uploading = ref(false)
const imageInput = ref(null)
const likedMap = reactive({})   // commentId -> bool（点赞状态，组件内部维护）
// replyingTo = { root, target }：回复目标（fold 模式 root=顶层评论）
const replyingTo = ref(null)
const sentinel = ref(null)
let observer = null

const sortedItems = computed(() => {
  if (sort.value === 'hot') {
    return [...items.value].sort((a, b) => likeCountOf(b) - likeCountOf(a))
  }
  return items.value
})

const replyName = computed(() => {
  if (!replyingTo.value) return ''
  const t = replyingTo.value.target
  return props.cfg.authorName ? props.cfg.authorName(t) : '用户'
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
    const res = await props.cfg.loader({ page: page.value + 1, pageSize: props.cfg.pageSize || 20 })
    const data = unwrap(res)
    if (props.cfg.parseList) {
      const parsed = props.cfg.parseList(data)
      items.value = reset ? parsed.items : [...items.value, ...parsed.items]
      total.value = parsed.total != null ? parsed.total : items.value.length
      hasMore.value = parsed.hasMore != null ? parsed.hasMore : parsed.items.length >= (props.cfg.pageSize || 20)
      page.value += 1
    } else {
      const list = Array.isArray(data) ? data : ((data && (data.items || data.list)) || [])
      items.value = reset ? list : [...items.value, ...list]
      total.value = list.length
      hasMore.value = false
    }
  } catch (e) {
    console.error('加载评论失败:', e)
  } finally {
    loading.value = false
  }
}

function setSort(s) { sort.value = s }

function startReply(payload) {
  replyingTo.value = payload
  emojiOpen.value = false
}

function insertEmoji(e) { draft.value += e }

async function submit() {
  const content = draft.value.trim()
  if (!content || sending.value) return
  sending.value = true
  try {
    const root = replyingTo.value ? replyingTo.value.root : null
    const target = replyingTo.value ? replyingTo.value.target : null
    const payload = { content }
    if (props.cfg.images) payload.reviewImages = images.value.length ? [...images.value] : null

    if (target) {
      if (props.cfg.replyMode === 'fold') {
        // 回复折叠（tweets）：parentGuid 恒为顶层，replyToGuid=被回复对象
        payload.parentGuid = root ? root[props.cfg.idField] : target[props.cfg.idField]
        payload.replyToGuid = target[props.cfg.idField]
        await props.cfg.creator(payload)
      } else if (props.cfg.replier) {
        // 直接回复（markdown）：挂到被回复评论下
        await props.cfg.replier(target[props.cfg.idField], payload)
      }
    } else {
      await props.cfg.creator(payload)
    }
    draft.value = ''
    images.value = []
    replyingTo.value = null
    await loadMore(true)
  } catch (e) {
    console.error('评论发送失败:', e)
  } finally {
    sending.value = false
  }
}

async function removeComment(payload) {
  try {
    const comment = payload ? payload.target : null
    if (!comment) return
    await props.cfg.remove(comment[props.cfg.idField])
    await loadMore(true)
  } catch (e) {
    console.error('删除评论失败:', e)
  }
}

// 点赞/取消点赞（cfg.like/unlike 存在时走后端，否则 CommentItem 本地 +1）
async function toggleLike(comment) {
  if (!props.cfg.like || !props.cfg.unlike) return
  try {
    const id = comment[props.cfg.idField]
    const res = likedMap[id] ? await props.cfg.unlike(id) : await props.cfg.like(id)
    const v = unwrap(res)
    if (typeof v === 'number') {
      if (props.cfg.likeCountField) comment[props.cfg.likeCountField] = v
      else if (comment.quote) comment.quote.loveCount = v
    }
    likedMap[id] = !likedMap[id]
  } catch (e) {
    console.error('点赞失败:', e)
  }
}

// ---------- 图片上传（图片评论特性） ----------
function pickImages() {
  if (imageInput.value && !uploading.value) imageInput.value.click()
}

async function onImagesPick(e) {
  const files = Array.from(e.target.files || []).slice(0, 9 - images.value.length)
  e.target.value = ''
  if (!files.length) return
  uploading.value = true
  try {
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        toast.push('单张图片不能超过 10MB', 'error')
        continue
      }
      const res = await uploadImage(file)
      const data = unwrap(res) || {}
      const uri = data.fileUri || data.file_url
      if (uri) images.value.push(uri)
      else toast.push('图片上传失败（无 fileUri）', 'error')
    }
  } catch (err) {
    toast.push('图片上传失败', 'error')
  } finally {
    uploading.value = false
  }
}

function hideImg(e) { e.target.style.visibility = 'hidden' }

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
