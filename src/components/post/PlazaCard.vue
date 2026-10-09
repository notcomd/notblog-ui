<template>
  <article class="group">
    <router-link :to="detailPath" custom v-slot="{ href, navigate }">
      <a
        :href="href"
        class="block scroll-mt-20 rounded-[5%] p-1.5 card-lift"
        @click="navigate"
      >
        <!-- 封面：三类内容统一 4:3 比例（上一轮 1:1 在 3 列栅格下封面仍高约 450px、整卡约 540px，
             仍显突兀；收敛到 4:3 后封面约 340px、整卡约 430px） -->
        <div class="relative w-full aspect-[4/3] overflow-hidden rounded-[5%] bg-zinc-100 dark:bg-zinc-800">
          <img
            v-if="coverUrl && !coverFailed"
            :src="coverUrl"
            alt=""
            width="720"
            height="540"
            class="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
            loading="lazy"
            @error="coverFailed = true"
          />
          <!-- 无封面 / 加载失败：柔和占位 -->
          <div v-else class="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-amber-100 to-emerald-100 dark:from-zinc-800 dark:to-zinc-800" aria-hidden="true">
            <svg class="h-9 w-9 text-amber-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="4" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
          </div>
          <!-- 底部压暗：角标在亮色图片上也能读清 -->
          <div class="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/30 to-transparent" aria-hidden="true"></div>
          <!-- 内容类型角标：混排时用于区分图文 / 视频 / 博客 -->
          <span class="absolute left-2 top-2 rounded-[5%] bg-black/55 px-1.5 py-0.5 text-[10px] text-white">{{ typeLabel }}</span>
          <!-- 视频播放标识（装饰，跳转由整块链接承担） -->
          <div v-if="item.type === 'video'" class="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden="true">
            <div class="flex h-11 w-11 items-center justify-center rounded-full bg-white/95 transition-transform duration-300 group-hover:scale-110">
              <svg class="ml-0.5 h-5 w-5 text-zinc-800" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
            </div>
          </div>
        </div>

        <!-- 信息区：作者头像 + 名称 + 时间 + 标题（最多 2 行，保留可读性） -->
        <div class="px-1 pt-2.5">
          <div class="flex items-center gap-2">
            <img
              :src="avatarSrc"
              alt=""
              width="24"
              height="24"
              class="h-6 w-6 shrink-0 rounded-full object-cover"
              @error="avatarBroken = true"
            />
            <span class="min-w-0 flex-1 truncate text-[12px] text-zinc-500 dark:text-zinc-400">{{ authorName }}</span>
            <time class="shrink-0 font-numeric text-[11px] text-zinc-400">{{ timeText }}</time>
          </div>
          <p class="text-2lines mt-1.5 text-[14px] font-medium leading-snug text-zinc-800 dark:text-zinc-100">{{ item.title }}</p>
        </div>
      </a>
    </router-link>
  </article>
</template>

<script lang="ts">
/** 广场混合瀑布流条目：三类内容（图文推文 / 视频 / Markdown 博客）归一化后的统一模型 */
export interface PlazaItem {
  /** 列表 key（PostGrid 复用 tweetGuid 字段作为唯一键） */
  tweetGuid: string
  /** 内容原始 GUID（用于拼详情路由 / 解析作者） */
  id: string
  type: 'post' | 'video' | 'markdown'
  title: string
  cover: string
  /** 同步可得的作者 GUID（推文 / 视频有；Markdown 需异步补取） */
  authorGuid: string
  /** 同步可得的作者名（仅推文有真实 userName，其余为空靠异步补取） */
  authorName: string
  /** 同步可得的头像（仅推文有，其余为空靠按 GUID 解析） */
  authorAvatar: string
  time?: string | number
}

export default { name: 'PlazaCard' }
</script>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { authorAvatarOf, markdownAuthorGuidOf } from '@/utils/author'
import { themeAvatar } from '@/utils/avatar'
import { relativeTime } from '@/utils/format'
import { useAuthStore } from '@/stores/auth'

const props = defineProps<{ post: PlazaItem }>()
const item = computed(() => props.post)

const auth = useAuthStore()
const coverFailed = ref(false)
const avatarBroken = ref(false)

const detailPath = computed<string>(() => {
  if (item.value.type === 'video') return `/videos/${item.value.id}`
  if (item.value.type === 'markdown') return `/markdown/${item.value.id}`
  return `/posts/${item.value.id}`
})

const typeLabel = computed<string>(() =>
  item.value.type === 'video' ? '视频' : item.value.type === 'markdown' ? '博客' : '图文'
)

const coverUrl = computed<string>(() => item.value.cover || '')
const timeText = computed(() => relativeTime(item.value.time))

/** 作者 GUID：推文/视频直接有；Markdown 列表无作者字段，按文档 GUID 异步补取（响应式，取到即重渲染） */
const authorGuid = computed<string>(() => {
  if (item.value.authorGuid) return item.value.authorGuid
  if (item.value.type === 'markdown') return markdownAuthorGuidOf(item.value.id)
  return ''
})

/** 作者名：自己 → 本地 me；后端给真实昵称 → 直接用；只有 GUID → 按 GUID 异步解析（复用 auth store） */
const authorName = computed<string>(() =>
  auth.resolveDisplayName({ userGuid: authorGuid.value, userName: item.value.authorName || undefined })
)

/** 头像：同步地址 → 本地 me（自己）→ 按 GUID 解析 → 首字头像兜底（失败不留空白方块） */
const avatarSrc = computed<string>(() => {
  if (!avatarBroken.value) {
    if (item.value.authorAvatar) return item.value.authorAvatar
    const guid = authorGuid.value
    if (guid) {
      const selfId = auth.user?.id ? String(auth.user.id).toLowerCase() : ''
      if (selfId && selfId === guid.toLowerCase() && auth.user?.avatar) return auth.user.avatar
      const resolved = authorAvatarOf(guid)
      if (resolved) return resolved
    }
  }
  return themeAvatar(authorName.value.charAt(0) || '用')
})
</script>
