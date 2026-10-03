<template>
  <article class="group relative glass-card overflow-hidden card-lift qm-glow">
    <!-- 更多操作：绝对定位在封面之上。
         放在链接外层——<a> 内不允许嵌套 <button>（可点击元素嵌套是无效 HTML） -->
    <div class="absolute top-2 right-2 z-10">
      <button
        class="w-8 h-8 rounded-full bg-black/55 text-white flex items-center justify-center opacity-70 hover:opacity-100 focus-visible:opacity-100 transition-opacity"
        type="button"
        aria-label="更多操作"
        @click="openMore"
      >
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>
      </button>
    </div>

    <!-- 导航链接：封面 + 作者 + 正文。
         用真正的 <a>（router-link custom 把 href 交给我们），支持 Cmd/中键新开标签；
         互动按钮留在链接之外，既不嵌套可点击元素，点击也不会误触跳转 -->
    <router-link :to="detailPath" custom v-slot="{ href, navigate }">
      <a
        :href="href"
        class="block scroll-mt-20"
        @click="navigate"
      >
        <!-- 封面区：图文 9:16 竖图 / 视频 1:1 -->
        <div class="relative w-full overflow-hidden" :class="isVideo ? 'aspect-square' : 'aspect-[9/16]'">
          <img
            v-if="cover"
            :src="cover"
            alt=""
            width="720"
            height="1280"
            class="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
            loading="lazy"
            @error="onCoverError"
          />
          <!-- 无封面或加载失败：柔和占位 -->
          <div v-if="!cover || coverFailed" class="absolute inset-0 bg-gradient-to-br from-amber-100 to-emerald-100 dark:from-zinc-800 dark:to-zinc-800 flex items-center justify-center">
            <svg class="w-10 h-10 text-amber-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="4" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>
          </div>
          <!-- 底部压暗：让角标/播放按钮在亮色图片上也能读清 -->
          <div class="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" aria-hidden="true"></div>
          <!-- 视频播放标识：跳转由整张卡片的链接承担，此处仅装饰 -->
          <div v-if="isVideo" class="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true">
            <div class="w-14 h-14 rounded-full bg-white/95 shadow-lg flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
              <svg class="w-6 h-6 text-zinc-800 ml-1" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
            </div>
          </div>
          <!-- 私密徽标（仅自己可见） -->
          <span v-if="post.visibility === 'Private'" class="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/60 text-white text-[10px] flex items-center gap-1" title="仅自己可见">
            <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
            私密
          </span>
        </div>

        <div class="px-4 pt-3.5">
          <!-- 用户信息栏：次级信息压到 12px 级，把视觉权重让给正文 -->
          <div class="flex items-center gap-2">
            <img
              :src="avatarSrc"
              alt=""
              width="32"
              height="32"
              class="w-8 h-8 shrink-0 rounded-full object-cover border border-white/60 dark:border-white/10"
              @error="avatarBroken = true"
            />
            <span class="text-[12.5px] font-medium text-zinc-500 dark:text-zinc-400 truncate min-w-0 flex-1">{{ authorName }}</span>
            <time class="text-[11.5px] text-zinc-400 shrink-0 font-numeric">{{ timeText }}</time>
          </div>
          <!-- 正文：卡片的主信息，字号/字重高于作者行，最多 2 行 -->
          <p class="mt-2.5 text-[15px] font-medium text-zinc-800 dark:text-zinc-100 text-2lines leading-relaxed">{{ post.content }}</p>
        </div>
      </a>
    </router-link>

    <!-- 互动栏：独立于链接，与正文用细分隔线分层 -->
    <div class="mx-4 mt-3 border-t border-zinc-200/60 dark:border-zinc-700/50 pt-3 pb-3.5 flex items-center justify-between">
      <button
        class="flex items-center gap-1.5 text-[13px] font-numeric transition-[color,transform] duration-200 active:scale-90"
        :class="post.isLiked ? 'text-red-500' : 'text-zinc-500 dark:text-zinc-400 hover:text-red-500'"
        type="button"
        :aria-label="post.isLiked ? '取消点赞' : '点赞'"
        :aria-pressed="!!post.isLiked"
        @click="onLike"
      >
        <span ref="likeIcon" class="inline-flex">
          <svg class="w-[18px] h-[18px]" :class="post.isLiked ? 'fill-current' : ''" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21.2l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z" />
          </svg>
        </span>
        {{ compactNumber(post.likeCount) }}
      </button>
      <button
        class="flex items-center gap-1.5 text-[13px] font-numeric transition-[color,transform] duration-200 active:scale-90"
        :class="post.isFavorited ? 'text-amber-500' : 'text-zinc-500 dark:text-zinc-400 hover:text-amber-500'"
        type="button"
        :aria-label="post.isFavorited ? '取消收藏' : '收藏'"
        :aria-pressed="!!post.isFavorited"
        @click="onFavorite"
      >
        <svg class="w-[18px] h-[18px]" :class="post.isFavorited ? 'fill-current' : ''" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true">
          <path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z" />
        </svg>
        {{ compactNumber(post.favoriteCount) }}
      </button>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { animate } from 'animejs'
import { compactNumber, relativeTime } from '@/utils/format'
import { isVideoPost, pickCoverUrl } from '@/utils/media'
import { themeAvatar } from '@/utils/avatar'
import { toggleLike, toggleFavorite } from '@/api/tweet'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'

interface PostAuthor {
  userName?: string
  name?: string
  nickname?: string
  avatar?: string
}

interface PostItem {
  tweetGuid: string
  content?: string
  isVideo?: boolean
  isLiked?: boolean
  isFavorited?: boolean
  likeCount?: number
  favoriteCount?: number
  mediaUrls?: string[]
  publishTime?: string | number
  createTime?: string | number
  visibility?: string
  author?: PostAuthor
  [key: string]: unknown
}

interface Props {
  post: PostItem
}
const props = defineProps<Props>()

const router = useRouter()
const auth = useAuthStore()
const toast = useToastStore()
const coverFailed = ref(false)
const avatarBroken = ref(false)
const likeIcon = ref<HTMLElement | null>(null)

const detailPath = computed<string>(() => `/posts/${props.post.tweetGuid}`)

// 互动操作需要登录：未登录时提示并跳转登录页
function requireLogin(): boolean {
  if (auth.isLoggedIn()) return true
  toast.push('请先登录后再进行互动', 'info')
  router.push('/login')
  return false
}

// 封面：取第一张非视频媒体（视频作品 mediaUrls = [视频, 封面]，取 [0] 会把视频当封面而加载失败）
const cover = computed(() => pickCoverUrl(props.post.mediaUrls))
// 视频判定：优先后端字段，兜底按媒体 URL 后缀识别（后端 TweetDto 暂无 isVideo 字段）
const isVideo = computed(() => isVideoPost(props.post))
const authorName = computed(() => {
  const a = props.post.author
  return a ? (a.userName || a.name || a.nickname || '用户') : '用户'
})
// 头像：无地址或加载失败时回退到首字头像（不再用 visibility:hidden 留一个空洞）
const avatarSrc = computed<string>(() => {
  const raw = props.post.author?.avatar || ''
  if (raw && !avatarBroken.value) return raw
  return themeAvatar(authorName.value.charAt(0) || '用')
})
const timeText = computed(() => relativeTime(props.post.publishTime || props.post.createTime))

function onCoverError() {
  coverFailed.value = true
}

// 打开详情：详情页对访客公开，卡片链接直接交给 router-link 的 navigate
// （navigate 内部会放行 Cmd/Ctrl/中键等修饰点击，让浏览器按 href 新开标签）
/** 点赞成功的心跳反馈：只动 transform，走合成器 */
function popLike(): void {
  if (!likeIcon.value) return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  try {
    animate(likeIcon.value, { scale: [1, 1.35, 1], duration: 420, ease: 'outQuart' })
  } catch (e) {
    // 动画不可用不影响点赞本身
  }
}

async function onLike() {
  if (!requireLogin()) return
  const liked = !props.post.isLiked
  const prev = props.post.likeCount
  props.post.isLiked = liked
  props.post.likeCount = Math.max(0, (prev || 0) + (liked ? 1 : -1))
  if (liked) popLike()
  try {
    await toggleLike(props.post.tweetGuid, liked)
  } catch (e) {
    props.post.isLiked = !liked
    props.post.likeCount = prev
  }
}

async function onFavorite() {
  if (!requireLogin()) return
  const favorited = !props.post.isFavorited
  const prev = props.post.favoriteCount
  props.post.isFavorited = favorited
  props.post.favoriteCount = Math.max(0, (prev || 0) + (favorited ? 1 : -1))
  try {
    await toggleFavorite(props.post.tweetGuid, favorited)
  } catch (e) {
    props.post.isFavorited = !favorited
    props.post.favoriteCount = prev
  }
}

function openMore() {
  // Phase 2：举报/屏蔽菜单
}
</script>