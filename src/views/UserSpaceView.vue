<template>
  <div>
    <!-- ===== 主页：通栏 Hero + 纯留白分组（无框设计，工具栏由全局 SideNav 提供） ===== -->
    <div v-if="activeTab === 'home'">
      <!-- 通栏 Hero：封面铺满内容区，身份区与页面容器对齐 -->
      <UserCard
        :user="user"
        :is-self="isSelf"
        :user-info="userInfo"
        :following="following"
        bleed
        @avatar-changed="onAvatarChanged"
        @cover-changed="onCoverChanged"
        @bio-changed="onBioChanged"
        @chat="onChat"
        @toggle-follow="toggleFollow"
        @open-security="onOpenSecurity"
      />

      <div class="max-w-[1200px] mx-auto">
        <!-- 等级与硬币（仅自己：Message /api/user-info/me；他人无该端点） -->
        <div v-if="isSelf && userInfo" class="mt-7 pt-5 border-t border-zinc-200/70 dark:border-zinc-800/70 flex items-center gap-3">
          <span class="px-2 py-1 rounded-[5%] bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold">Lv.{{ userInfo.level }}</span>
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 mb-1">
              <span>经验</span>
              <span v-if="isMaxLevel">已满级 · 累计 {{ userInfo.experience }} 经验</span>
              <span v-else>{{ userInfo.experience }} / {{ levelThreshold }}</span>
            </div>
            <div class="h-1.5 rounded-full bg-zinc-200/70 dark:bg-zinc-700/60 overflow-hidden">
              <div class="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-300" :style="{ width: expPercent + '%' }"></div>
            </div>
          </div>
          <div class="flex items-center gap-1.5 text-sm text-zinc-700 dark:text-zinc-200 shrink-0">
            <svg class="w-4 h-4 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v10M9.5 9.5c.5-.7 1.4-1 2.5-1s2 .3 2.5 1c.6.8.2 1.8-1.2 2.3-1.8.6-2.4 1.5-1.8 2.4.5.8 1.5 1.1 2.5 1s2-.4 2.5-1.2" /></svg>
            <span class="font-numeric font-medium">{{ userInfo.coins }}</span>
            <span class="text-xs text-zinc-400">硬币</span>
          </div>
        </div>

        <!-- ===== 签到记录：GitHub 贡献图风格热力图（仅自己；Message /api/user-info/me/sign-in-dates） ===== -->
        <section v-if="isSelf" class="mt-10 pt-8 border-t border-zinc-200/70 dark:border-zinc-800/70">
          <SignInHeatmap />
        </section>

        <!-- ===== 作品：最近 4 个（他人主页同样显示公开作品） ===== -->
        <section class="mt-10 pt-8 border-t border-zinc-200/70 dark:border-zinc-800/70">
          <header class="flex items-baseline justify-between mb-5">
            <h3 class="font-display text-lg font-bold text-zinc-800 dark:text-zinc-100">
              作品
              <span class="ml-1.5 font-numeric text-xs font-normal text-zinc-400">{{ overview.posts }}</span>
            </h3>
            <button class="text-xs text-zinc-500 dark:text-zinc-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors" @click="goTab('works')">全部 →</button>
          </header>
          <div v-if="recentPosts.length" class="grid grid-cols-4 gap-4">
            <div v-for="p in recentPosts" :key="p.tweetGuid" class="group cursor-pointer" @click="router.push('/posts/' + p.tweetGuid)">
              <div class="relative aspect-video rounded-[5%] overflow-hidden bg-zinc-100 dark:bg-zinc-900">
                <img v-if="postThumb(p)" :src="postThumb(p)" alt="" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" @error="hideImg" />
                <div v-else class="w-full h-full flex items-center justify-center"><svg class="w-7 h-7 text-zinc-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></div>
                <span v-if="postIsVideo(p)" class="absolute bottom-1.5 right-1.5 w-6 h-6 rounded-full bg-black/55 text-white flex items-center justify-center">
                  <svg class="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                </span>
              </div>
              <div class="text-xs text-zinc-500 dark:text-zinc-300 truncate mt-2">{{ postTitle(p) }}</div>
            </div>
          </div>
          <p v-else class="py-10 text-center text-sm text-zinc-400">还没有发布过作品</p>
        </section>

        <!-- ===== 收藏：最近 4 个（仅自己，收藏为私有内容；他人隐藏） ===== -->
        <section v-if="isSelf" class="mt-10 pt-8 border-t border-zinc-200/70 dark:border-zinc-800/70">
          <header class="flex items-baseline justify-between mb-5">
            <h3 class="font-display text-lg font-bold text-zinc-800 dark:text-zinc-100">
              收藏
              <span class="ml-1.5 font-numeric text-xs font-normal text-zinc-400">{{ recentFavorites.length }}</span>
            </h3>
            <button class="text-xs text-zinc-500 dark:text-zinc-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors" @click="goTab('favorites')">全部 →</button>
          </header>
          <div v-if="recentFavorites.length" class="grid grid-cols-4 gap-4">
            <div v-for="p in recentFavorites" :key="p.tweetGuid" class="group cursor-pointer" @click="router.push('/posts/' + p.tweetGuid)">
              <div class="relative aspect-video rounded-[5%] overflow-hidden bg-zinc-100 dark:bg-zinc-900">
                <img v-if="postThumb(p)" :src="postThumb(p)" alt="" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" @error="hideImg" />
                <div v-else class="w-full h-full flex items-center justify-center"><svg class="w-7 h-7 text-zinc-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></div>
                <span v-if="postIsVideo(p)" class="absolute bottom-1.5 right-1.5 w-6 h-6 rounded-full bg-black/55 text-white flex items-center justify-center">
                  <svg class="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                </span>
              </div>
              <div class="text-xs text-zinc-500 dark:text-zinc-300 truncate mt-2">{{ postTitle(p) }}</div>
            </div>
          </div>
          <p v-else class="py-10 text-center text-sm text-zinc-400">还没有收藏任何内容</p>
        </section>

        <!-- ===== 仓库：最近 4 个（自己：我的仓库；他人：公开仓库） ===== -->
        <section class="mt-10 pt-8 border-t border-zinc-200/70 dark:border-zinc-800/70">
          <header class="flex items-baseline justify-between mb-5">
            <h3 class="font-display text-lg font-bold text-zinc-800 dark:text-zinc-100">
              {{ isSelf ? '我的仓库' : '公开仓库' }}
              <span class="ml-1.5 font-numeric text-xs font-normal text-zinc-400">{{ recentFiles.length }}</span>
            </h3>
            <button class="text-xs text-zinc-500 dark:text-zinc-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors" @click="goTab('files')">全部 →</button>
          </header>
          <div v-if="recentFiles.length" class="grid grid-cols-4 gap-4">
            <div v-for="f in recentFiles" :key="f.fileId" class="group cursor-pointer" @click="previewFile(f)">
              <div class="relative aspect-video rounded-[5%] overflow-hidden bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
                <img v-if="f.type === 'image'" :src="f.url" alt="" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" @error="hideImg" />
                <video v-else-if="f.type === 'video'" :src="f.url" class="w-full h-full object-cover" muted></video>
                <div v-else class="text-2xl"><svg class="w-7 h-7 text-zinc-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg></div>
              </div>
              <div class="text-xs text-zinc-500 dark:text-zinc-300 truncate mt-2">{{ f.name }}</div>
            </div>
          </div>
          <p v-else class="py-10 text-center text-sm text-zinc-400">{{ isSelf ? '仓库为空，去上传一些文件吧' : '暂无公开仓库' }}</p>
        </section>
      </div>
    </div>

    <!-- ===== 其余 tab（保持居中容器） ===== -->
    <div v-else class="max-w-[1200px] mx-auto">
      <!-- 作品：3列网格 -->
      <div v-if="activeTab === 'works'">
        <PostGrid :loader="worksLoader" :key="userId" empty-text="还没有发布过内容" />
      </div>

      <!-- 收藏（仅自己，私密内容） -->
      <div v-else-if="activeTab === 'favorites' && isSelf">
        <div class="flex items-center justify-between mb-4">
          <span class="text-sm text-zinc-400">收藏的内容</span>
        </div>
        <PostGrid :loader="favoritesLoader" :key="'fav'" empty-text="还没有收藏任何内容" />
      </div>

      <!-- 文件库 -->
      <div v-else-if="activeTab === 'files'">
        <div class="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div class="flex flex-wrap gap-2">
            <button v-for="t in fileTypes" :key="t.key" class="px-3 py-1.5 rounded-[5%] text-xs font-medium transition-all" :class="fileType === t.key ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow' : 'bg-white/60 dark:bg-zinc-800/60 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 dark:text-zinc-200'" @click="fileType = t.key">{{ t.label }}</button>
          </div>
          <span class="text-xs text-zinc-400">{{ isSelf ? '暂无文件' : '暂无公开文件' }}</span>
        </div>
        <div class="grid grid-cols-3 gap-4">
          <div v-for="f in filteredFiles" :key="f.fileId" class="glass-card overflow-hidden card-lift group">
            <div class="aspect-video bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center overflow-hidden">
              <img v-if="f.type === 'image'" :src="f.url" alt="" class="w-full h-full object-cover" @error="hideImg" />
              <video v-else-if="f.type === 'video'" :src="f.url" class="w-full h-full object-cover" muted></video>
              <div v-else class="text-4xl"><svg class="w-10 h-10 text-zinc-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg></div>
              <div class="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                <button class="px-3 py-1.5 rounded-[5%] bg-white/90 text-xs font-medium text-zinc-700 shadow dark:text-zinc-200" @click="previewFile(f)">预览</button>
              </div>
            </div>
            <div class="p-3">
              <div class="text-sm font-medium text-zinc-700 dark:text-zinc-200 truncate">{{ f.name }}</div>
              <div class="text-xs text-zinc-400 mt-0.5">{{ formatSize(f.size) }} · {{ relativeTime(f.createdAt) }}</div>
            </div>
          </div>
          <div v-if="filteredFiles.length === 0" class="col-span-full py-16 flex flex-col items-center gap-3 text-zinc-400">
            <div class="text-5xl"><svg class="w-12 h-12 text-zinc-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg></div>
            <p class="text-sm">该分类下暂无文件</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
export default { name: 'UserSpaceView' }
</script>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PostGrid from '@/components/post/PostGrid.vue'
import UserCard from '@/components/user/UserCard.vue'
import SignInHeatmap from '@/components/user/SignInHeatmap.vue'
import { getUserPosts } from '@/api/tweet'
import { getUserFavorites, getUserFiles } from '@/api/space'
import { getFollowing, follow, unfollow } from '@/api/follow'
import { getMyUserInfo, updateBio } from '@/api/userinfo'
import { createSession, getUserProfile } from '@/api/chat'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import { formatSize, relativeTime } from '@/utils/format'
import { isVideoPost, pickCoverUrl } from '@/utils/media'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const toast = useToastStore()

const userId = computed(() => route.params.id)
// auth store 已把 JWT claims 归一化为 user.id（NameIdentifier→id），必须用 id 比较
const isSelf = computed(() => !!auth.user && String(auth.user.id) === String(userId.value))

// 他人主页：关注状态（拉取「我关注的人」比对，后端暂无 is-following 端点，与详情页同法）
const following = ref(false)

// 工具栏由全局 SideNav 提供（?tab=home|works|favorites|files），此处只消费 query
const activeTab = ref((route.query.tab as string) || 'home')

// 安全设置已迁到独立页面：把旧的 ?tab=security 重定向过去（避免渲染空 tab）
function normalizeTab(raw: string | undefined): void {
  if (raw === 'security') {
    activeTab.value = 'home'
    router.replace('/settings/security')
    return
  }
  if (raw) activeTab.value = raw
}
normalizeTab(route.query.tab as string | undefined)
watch(() => route.query.tab, (v) => normalizeTab(v as string | undefined))
const fileType = ref('all')
const fileTypes = [
  { key: 'all', label: '全部' },
  { key: 'image', label: '图片' },
  { key: 'video', label: '视频' },
  { key: 'doc', label: '文档' }
]

const user = ref<Record<string, any>>({})
const files = ref<any[]>([])

// ===== 主页概览 =====
const overview = ref<{ posts: number }>({ posts: 0 }) // 作品总数（真实 total）
const recentPosts = ref<any[]>([]) // 最近 4 个作品
const recentFavorites = ref<any[]>([]) // 最近 4 个收藏（后端缺口，当前空态）
const recentFiles = computed(() => files.value.slice(0, 4)) // 最近 4 个文件
const userInfo = ref<any>(null) // Message /api/user-info/me（等级/经验/硬币，仅自己）
const MAX_LEVEL = 9 // 与后端 UserInfo.MaxLevel 一致
const levelThreshold = computed(() => (userInfo.value ? 2500 * userInfo.value.level : 2500))
const isMaxLevel = computed(() => !!userInfo.value && userInfo.value.level >= MAX_LEVEL)
const expPercent = computed(() => {
  if (!userInfo.value) return 0
  if (isMaxLevel.value) return 100
  const t = 2500 * userInfo.value.level
  return t > 0 ? Math.min(100, Math.round((userInfo.value.experience / t) * 100)) : 0
})
function goTab(key: string): void {
  router.push({ path: `/users/${userId.value}`, query: { tab: key } })
}
// 安全设置已移到独立页面，入口在 Hero 封面按钮旁（UserCard 的 open-security）
function onOpenSecurity(): void {
  router.push('/settings/security')
}
// 概览缩略辅助（与 PostCard 同字段约定：封面取首张非视频媒体 / isVideo 判定见 utils/media）
function postThumb(p: any): string {
  return pickCoverUrl(p.mediaUrls)
}
function postIsVideo(p: any): boolean {
  return isVideoPost(p)
}
function postTitle(p: any): string {
  const t: string = (p.content || '').replace(/[#*`>~-]/g, '').trim()
  return t ? t.split('\n')[0].slice(0, 30) : '未命名作品'
}
// 作品取最近 4 个 + 总数；收藏接真实端点（当前后端缺口返回空态）
async function loadOverview(): Promise<void> {
  try {
    const res = await getUserPosts(userId.value, { page: 1, pageSize: 4 })
    const d: any = res && res.data ? res.data : res
    let list: any[] = d.items || d.list || []
    // 他人主页只显示公开作品（私密作品仅作者可见）
    if (!isSelf.value) list = list.filter(p => p.visibility !== 'Private')
    recentPosts.value = list.slice(0, 4)
    overview.value.posts = d.total != null ? d.total : recentPosts.value.length
  } catch (e) {
    recentPosts.value = []
    overview.value.posts = 0
  }
  // 收藏为私有内容，仅自己拉取
  if (!isSelf.value) {
    recentFavorites.value = []
    return
  }
  try {
    const res = await getUserFavorites()
    const d: any = res && res.data ? res.data : res
    recentFavorites.value = (d.items || d.list || []).slice(0, 4)
  } catch (e) {
    recentFavorites.value = []
  }
}

const filteredFiles = computed(() => fileType.value === 'all' ? files.value : files.value.filter(f => f.type === fileType.value))

function worksLoader(params: any): Promise<any> {
  return getUserPosts(userId.value, params)
}

function favoritesLoader(params: any) {
  return getUserFavorites(params)
}

async function loadUser(): Promise<void> {
  following.value = false
  userInfo.value = null
  if (isSelf.value) {
    // 本人：昵称来自 JWT；头像/签名/背景封面来自 Message /api/user-info/me
    // 头像先取 store 缓存（启动预热已写入 avatarUrl），首帧即显示真实头像，接口返回后再校正
    user.value = {
      nickname: auth.user.name,
      bio: '',
      avatar: auth.user.avatar || '',
      followingCount: 6,
      followerCount: 12,
      likeTotal: 128
    }
    // 背景封面 + 等级/经验/硬币 + 签名 + 头像（失败则保持默认渐变 / 首字母头像）
    try {
      const info = await getMyUserInfo()
      const d = info && info.data ? info.data : info
      if (d) {
        userInfo.value = d
        if (d.backgroundCoverUrl) user.value.coverUrl = d.backgroundCoverUrl
        if (d.bio) user.value.bio = d.bio
        if (d.avatarUrl) user.value.avatar = d.avatarUrl
      }
    } catch (e) { /* 忽略 */ }
    // 关注数接真实值（/api/follows/following 的 total）
    try {
      const f = await getFollowing({ page: 1, pageSize: 1 })
      const d = f && f.data ? f.data : f
      if (d && d.total != null) user.value.followingCount = d.total
    } catch (e) { /* 忽略 */ }
  } else {
    // 他人：真实公开资料 GET /api/users/{userGuid}（昵称/头像/签名/统计 + 关注态）
    // 失败时回落占位（UserCard 显示首字母头像），不再使用第三方随机头像
    user.value = {
      nickname: '用户 ' + String(userId.value).slice(0, 8),
      bio: '',
      avatar: '',
      followingCount: 0,
      followerCount: 0,
      likeTotal: 0
    }
    let profileOk = false
    try {
      const res = await getUserProfile(String(userId.value))
      const d: any = res && res.data ? res.data : res
      if (d) {
        profileOk = true
        if (d.nickName) user.value.nickname = d.nickName
        if (d.bio) user.value.bio = d.bio
        if (d.avatarUrl) user.value.avatar = d.avatarUrl
        if (d.followingCount != null) user.value.followingCount = d.followingCount
        if (d.followerCount != null) user.value.followerCount = d.followerCount
        if (d.likeTotal != null) user.value.likeTotal = d.likeTotal
        following.value = !!d.isFollowing
      }
    } catch (e) { /* 忽略：保持占位 */ }
    // 资料接口未给出关注态时，用「我关注的人」列表兜底比对
    if (!profileOk) await checkFollowing()
  }
}

// 关注状态：拉取「我关注的人」列表比对（后端暂无 is-following 端点，与详情页同法）
async function checkFollowing(): Promise<void> {
  if (isSelf.value || !auth.isLoggedIn()) return
  try {
    const res = await getFollowing({ page: 1, pageSize: 200 })
    const data: any = res && res.data ? res.data : res
    const list: any[] = data.items || data.list || []
    following.value = list.some(u => String(u.userGuid || u.userId) === String(userId.value))
  } catch (e) {
    following.value = false
  }
}

// 关注 / 取关（Message：POST|DELETE /api/follows/{userGuid}）
async function toggleFollow(): Promise<void> {
  if (!auth.isLoggedIn()) {
    toast.push('请先登录后关注', 'info')
    router.push('/login')
    return
  }
  const target = !following.value
  try {
    if (target) await follow(userId.value)
    else await unfollow(userId.value)
    following.value = target
    user.value.followerCount = Math.max(0, (user.value.followerCount || 0) + (target ? 1 : -1))
    toast.push(target ? '关注成功' : '已取消关注', 'success')
  } catch (e) {
    toast.push('操作失败，请稍后重试', 'error')
  }
}

// 发起聊天：POST /api/sessions（私聊幂等，已存在返回现有会话）→ 跳 /chat/:sessionId
async function onChat(): Promise<void> {
  if (!auth.isLoggedIn()) {
    toast.push('请先登录后聊天', 'info')
    router.push('/login')
    return
  }
  try {
    const res = await createSession(userId.value)
    const d: any = res && res.data ? res.data : res
    const sessionId = (d && (d.sessionId || d.id)) || (typeof d === 'string' ? d : '')
    if (!sessionId) throw new Error('no sessionId')
    router.push('/chat/' + sessionId)
  } catch (e) {
    toast.push('无法发起会话，请稍后重试', 'error')
  }
}

// 签名持久化到后端（Message：PUT /api/user-info/me/bio，空白表示清除）
async function onBioChanged(bio: string): Promise<void> {
  if (!user.value) return
  user.value.bio = bio
  try {
    await updateBio(bio)
  } catch (e) {
    // 持久化失败：保持当前展示，不回落本地存储
  }
}

// 用户卡片事件：头像/封面更新（上传逻辑在 UserCard 组件内）
function onAvatarChanged(url: string): void {
  if (url && user.value) user.value.avatar = url
}

function onCoverChanged(url: string): void {
  if (url && user.value) user.value.coverUrl = url
}

async function loadFiles(): Promise<void> {
  try {
    const res = await getUserFiles({ type: fileType.value })
    const data: any = res && res.data ? res.data : res
    files.value = data.items || data.list || []
  } catch (e) {
    files.value = []
  }
}

function previewFile(f: any): void {
  toast.push(`预览 ${f.name} 功能开发中`, 'info')
}

function hideImg(e: Event) {
  (e.target as HTMLElement).style.visibility = 'hidden'
}

watch(() => route.params.id, (id) => {
  // keep-alive 缓存下组件未激活时路由也会变化（如切到 /chat 时本路由的 params.id 消失为 undefined）——
  // 无 id 时跳过，避免误请求 /api/tweets/user/undefined
  if (!id) return
  loadUser()
  loadOverview()
})

onMounted(() => {
  loadUser()
  loadOverview()
  loadFiles()
})
</script>
