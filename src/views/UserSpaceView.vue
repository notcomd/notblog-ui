<template>
  <div class="max-w-[1200px] mx-auto">
    <!-- ===== 内容区（工具栏由全局 SideNav 提供：作品/收藏/我的仓库/安全） ===== -->
    <div class="space-y-5">
      <!-- ===== 主页：基本信息卡片 + 分类概览（仅本 tab 显示卡片） ===== -->
      <div v-if="activeTab === 'home'" class="space-y-5">
        <!-- 基本信息卡片（封面/头像/用户名/等级/签名/统计，仅主页 tab 显示） -->
        <UserCard
          :user="user"
          :is-self="isSelf"
          :user-info="userInfo"
          :following="following"
          @avatar-changed="onAvatarChanged"
          @cover-changed="onCoverChanged"
          @bio-changed="onBioChanged"
          @chat="onChat"
          @toggle-follow="toggleFollow"
        />

        <!-- 等级与硬币（仅自己：Message /api/user-info/me；他人无该端点） -->
        <div v-if="isSelf && userInfo" class="glass-card p-5">
          <div class="flex items-center gap-3">
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
              <span class="font-medium">{{ userInfo.coins }}</span>
              <span class="text-xs text-zinc-400">硬币</span>
            </div>
          </div>
        </div>

        <!-- ===== 作品：最近 4 个（他人主页同样显示公开作品） ===== -->
        <section class="glass-card overflow-hidden">
          <header class="flex items-center justify-between px-4 pt-3 pb-2">
            <h3 class="text-sm font-bold text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
              <svg class="w-4 h-4 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z" /></svg>
              作品
              <span class="text-[10px] font-normal text-zinc-400">{{ overview.posts }}</span>
            </h3>
            <button class="text-xs text-amber-500 hover:text-amber-600 transition-colors" @click="goTab('works')">全部 →</button>
          </header>
          <div class="px-4 pb-4">
            <div v-if="recentPosts.length" class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div v-for="p in recentPosts" :key="p.tweetGuid" class="group cursor-pointer" @click="router.push('/posts/' + p.tweetGuid)">
                <div class="relative aspect-video rounded-[5%] overflow-hidden bg-zinc-100 dark:bg-zinc-900">
                  <img v-if="postThumb(p)" :src="postThumb(p)" alt="" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" @error="hideImg" />
                  <div v-else class="w-full h-full flex items-center justify-center text-xl">🖼️</div>
                  <span v-if="postIsVideo(p)" class="absolute bottom-1.5 right-1.5 w-6 h-6 rounded-full bg-black/55 text-white flex items-center justify-center">
                    <svg class="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                  </span>
                </div>
                <div class="text-xs text-zinc-500 dark:text-zinc-300 truncate mt-1.5">{{ postTitle(p) }}</div>
              </div>
            </div>
            <div v-else class="py-10 text-center text-sm text-zinc-400">还没有发布过作品</div>
          </div>
        </section>

        <!-- ===== 收藏：最近 4 个（仅自己，收藏为私有内容；他人隐藏） ===== -->
        <section v-if="isSelf" class="glass-card overflow-hidden">
          <header class="flex items-center justify-between px-4 pt-3 pb-2">
            <h3 class="text-sm font-bold text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
              <svg class="w-4 h-4 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
              收藏
              <span class="text-[10px] font-normal text-zinc-400">{{ recentFavorites.length }}</span>
            </h3>
            <button class="text-xs text-amber-500 hover:text-amber-600 transition-colors" @click="goTab('favorites')">全部 →</button>
          </header>
          <div class="px-4 pb-4">
            <div v-if="recentFavorites.length" class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div v-for="p in recentFavorites" :key="p.tweetGuid" class="group cursor-pointer" @click="router.push('/posts/' + p.tweetGuid)">
                <div class="relative aspect-video rounded-[5%] overflow-hidden bg-zinc-100 dark:bg-zinc-900">
                  <img v-if="postThumb(p)" :src="postThumb(p)" alt="" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" @error="hideImg" />
                  <div v-else class="w-full h-full flex items-center justify-center text-xl">🖼️</div>
                  <span v-if="postIsVideo(p)" class="absolute bottom-1.5 right-1.5 w-6 h-6 rounded-full bg-black/55 text-white flex items-center justify-center">
                    <svg class="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                  </span>
                </div>
                <div class="text-xs text-zinc-500 dark:text-zinc-300 truncate mt-1.5">{{ postTitle(p) }}</div>
              </div>
            </div>
            <div v-else class="py-10 text-center text-sm text-zinc-400">还没有收藏任何内容</div>
          </div>
        </section>

        <!-- ===== 仓库：最近 4 个（自己：我的仓库；他人：公开仓库） ===== -->
        <section class="glass-card overflow-hidden">
          <header class="flex items-center justify-between px-4 pt-3 pb-2">
            <h3 class="text-sm font-bold text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
              <svg class="w-4 h-4 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>
              {{ isSelf ? '我的仓库' : '公开仓库' }}
              <span class="text-[10px] font-normal text-zinc-400">{{ recentFiles.length }}</span>
            </h3>
            <button class="text-xs text-amber-500 hover:text-amber-600 transition-colors" @click="goTab('files')">全部 →</button>
          </header>
          <div class="px-4 pb-4">
            <div v-if="recentFiles.length" class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div v-for="f in recentFiles" :key="f.fileId" class="group cursor-pointer" @click="previewFile(f)">
                <div class="relative aspect-video rounded-[5%] overflow-hidden bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
                  <img v-if="f.type === 'image'" :src="f.url" alt="" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" @error="hideImg" />
                  <video v-else-if="f.type === 'video'" :src="f.url" class="w-full h-full object-cover" muted></video>
                  <div v-else class="text-2xl">📄</div>
                </div>
                <div class="text-xs text-zinc-500 dark:text-zinc-300 truncate mt-1.5">{{ f.name }}</div>
              </div>
            </div>
            <div v-else class="py-10 text-center text-sm text-zinc-400">{{ isSelf ? '仓库为空，去上传一些文件吧' : '暂无公开仓库' }}</div>
          </div>
        </section>
      </div>

      <!-- Tab 内容 -->
      <!-- 作品：3列网格 -->
      <div v-if="activeTab === 'works'">
        <PostGrid :loader="worksLoader" :key="userId" empty-text="还没有发布过内容" />
      </div>

      <!-- 收藏（仅自己，私密内容） -->
      <div v-else-if="activeTab === 'favorites' && isSelf">
        <div class="flex items-center justify-between mb-4">
          <span class="text-sm text-zinc-400">收藏的内容（后端缺口：待补 GET /api/tweets/favorites/my，当前为演示数据）</span>
        </div>
        <PostGrid :loader="favoritesLoader" :key="'fav'" empty-text="还没有收藏任何内容" />
      </div>

      <!-- 文件库 -->
      <div v-else-if="activeTab === 'files'">
        <div class="flex items-center justify-between mb-4">
          <div class="flex gap-2">
            <button v-for="t in fileTypes" :key="t.key" class="px-3 py-1.5 rounded-[5%] text-xs font-medium transition-all" :class="fileType === t.key ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow' : 'bg-white/60 dark:bg-zinc-800/60 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 dark:text-zinc-200'" @click="fileType = t.key">{{ t.label }}</button>
          </div>
          <span class="text-xs text-zinc-400">{{ isSelf ? '我的仓库端点后端缺口，当前为演示数据' : '公开文件端点后端缺口，当前为空' }}</span>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div v-for="f in filteredFiles" :key="f.fileId" class="glass-card overflow-hidden card-lift group">
            <div class="aspect-video bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center overflow-hidden">
              <img v-if="f.type === 'image'" :src="f.url" alt="" class="w-full h-full object-cover" @error="hideImg" />
              <video v-else-if="f.type === 'video'" :src="f.url" class="w-full h-full object-cover" muted></video>
              <div v-else class="text-4xl">📄</div>
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
            <div class="text-5xl">🗂️</div>
            <p class="text-sm">该分类下暂无文件</p>
          </div>
        </div>
      </div>

      <!-- 账号与安全（仅自己，私密功能） -->
      <div v-else-if="activeTab === 'security' && isSelf" class="grid lg:grid-cols-2 gap-5">
        <!-- 修改密码 -->
        <div class="glass-card p-5">
          <h3 class="text-base font-bold text-zinc-800 dark:text-zinc-100 mb-4 flex items-center gap-2">
            <svg class="w-4 h-4 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
            修改密码
          </h3>
          <form @submit.prevent="submitPassword" class="space-y-3">
            <input v-model="pwd.oldPassword" type="password" placeholder="旧密码" class="w-full h-11 px-4 rounded-[5%] bg-white/70 dark:bg-zinc-800/70 border border-white/60 dark:border-white/10 text-sm outline-none focus:ring-2 focus:ring-amber-400/50 transition-all" />
            <input v-model="pwd.newPassword" type="password" placeholder="新密码（至少 8 位）" class="w-full h-11 px-4 rounded-[5%] bg-white/70 dark:bg-zinc-800/70 border border-white/60 dark:border-white/10 text-sm outline-none focus:ring-2 focus:ring-amber-400/50 transition-all" />
            <input v-model="pwd.confirmPassword" type="password" placeholder="确认新密码" class="w-full h-11 px-4 rounded-[5%] bg-white/70 dark:bg-zinc-800/70 border border-white/60 dark:border-white/10 text-sm outline-none focus:ring-2 focus:ring-amber-400/50 transition-all" />
            <p v-if="pwdError" class="text-xs text-red-500">{{ pwdError }}</p>
            <button class="w-full h-11 rounded-[5%] bg-gradient-to-r from-amber-400 to-orange-500 text-white text-sm font-medium hover: active:scale-[0.98] transition-all disabled:opacity-50" :disabled="pwdSaving" @click="submitPassword">
              {{ pwdSaving ? '提交中...' : '修改密码' }}
            </button>
          </form>
        </div>

        <!-- OAuth 绑定 -->
        <div class="glass-card p-5">
          <h3 class="text-base font-bold text-zinc-800 dark:text-zinc-100 mb-4 flex items-center gap-2">
            <svg class="w-4 h-4 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M19 8v6M22 11h-6" /></svg>
            第三方账号绑定
          </h3>
          <div class="space-y-2.5">
            <div v-for="a in linkedAccounts" :key="a.provider" class="flex items-center justify-between px-3.5 py-2.5 rounded-[5%] bg-white/60 dark:bg-zinc-800/60">
              <div class="flex items-center gap-2.5">
                <span class="w-8 h-8 rounded-[5%] bg-zinc-100 dark:bg-zinc-700 flex items-center justify-center text-sm">{{ providerIcon(a.provider) }}</span>
                <div>
                  <div class="text-sm font-medium text-zinc-700 dark:text-zinc-200">{{ a.displayName }}</div>
                  <div class="text-[10px] text-zinc-400">{{ relativeTime(a.linkedAt) }} 绑定</div>
                </div>
              </div>
              <button class="px-2.5 h-8 rounded-[5%] text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors" @click="unlink(a)">解绑</button>
            </div>
            <div v-if="linkedAccounts.length === 0" class="py-8 text-center text-sm text-zinc-400">还没有绑定第三方账号</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default { name: 'UserSpaceView' }
</script>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PostGrid from '@/components/post/PostGrid.vue'
import UserCard from '@/components/user/UserCard.vue'
import { getUserPosts } from '@/api/tweet'
import { getUserFavorites, getUserFiles, getLinkedAccounts, unlinkAccount, changePassword } from '@/api/space'
import { getFollowing, follow, unfollow } from '@/api/follow'
import { getMyUserInfo } from '@/api/userinfo'
import { createSession } from '@/api/chat'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import { relativeTime } from '@/utils/format'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const toast = useToastStore()

const userId = computed(() => route.params.id)
// auth store 已把 JWT claims 归一化为 user.id（NameIdentifier→id），必须用 id 比较
const isSelf = computed(() => !!auth.user && String(auth.user.id) === String(userId.value))

// 他人主页：关注状态（拉取「我关注的人」比对，后端暂无 is-following 端点，与详情页同法）
const following = ref(false)

// 工具栏由全局 SideNav 提供（?tab=home|works|favorites|files|security），此处只消费 query
const activeTab = ref(route.query.tab || 'home')
watch(() => route.query.tab, (v) => { if (v) activeTab.value = v })
const fileType = ref('all')
const fileTypes = [
  { key: 'all', label: '全部' },
  { key: 'image', label: '图片' },
  { key: 'video', label: '视频' },
  { key: 'doc', label: '文档' }
]

const user = ref({})
const files = ref([])
const linkedAccounts = ref([])

// ===== 主页概览 =====
const overview = ref({ posts: 0 }) // 作品总数（真实 total）
const recentPosts = ref([]) // 最近 4 个作品
const recentFavorites = ref([]) // 最近 4 个收藏（后端缺口，当前空态）
const recentFiles = computed(() => files.value.slice(0, 4)) // 最近 4 个文件
const userInfo = ref(null) // Message /api/user-info/me（等级/经验/硬币，仅自己）
const MAX_LEVEL = 9 // 与后端 UserInfo.MaxLevel 一致
const levelThreshold = computed(() => (userInfo.value ? 2500 * userInfo.value.level : 2500))
const isMaxLevel = computed(() => !!userInfo.value && userInfo.value.level >= MAX_LEVEL)
const expPercent = computed(() => {
  if (!userInfo.value) return 0
  if (isMaxLevel.value) return 100
  const t = 2500 * userInfo.value.level
  return t > 0 ? Math.min(100, Math.round((userInfo.value.experience / t) * 100)) : 0
})
function goTab(key) {
  router.push({ path: `/users/${userId.value}`, query: { tab: key } })
}
// 概览缩略辅助（与 PostCard 同字段约定：mediaUrls[0] 封面 / isVideo 或 URL 后缀）
function postThumb(p) {
  const urls = p.mediaUrls || []
  return urls[0] || ''
}
function postIsVideo(p) {
  if (p.isVideo) return true
  return /\.(mp4|webm|ogg|mov|m4v)(\?|#|$)/i.test(postThumb(p))
}
function postTitle(p) {
  const t = (p.content || '').replace(/[#*`>~-]/g, '').trim()
  return t ? t.split('\n')[0].slice(0, 30) : '未命名作品'
}
// 作品取最近 4 个 + 总数；收藏接真实端点（当前后端缺口返回空态）
async function loadOverview() {
  try {
    const res = await getUserPosts(userId.value, { page: 1, pageSize: 4 })
    const d = res && res.data ? res.data : res
    let list = d.items || d.list || []
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
    const d = res && res.data ? res.data : res
    recentFavorites.value = (d.items || d.list || []).slice(0, 4)
  } catch (e) {
    recentFavorites.value = []
  }
}

// 修改密码
const pwd = ref({ oldPassword: '', newPassword: '', confirmPassword: '' })
const pwdError = ref('')
const pwdSaving = ref(false)

const filteredFiles = computed(() => fileType.value === 'all' ? files.value : files.value.filter(f => f.type === fileType.value))

function worksLoader(params) {
  return getUserPosts(userId.value, params)
}

function favoritesLoader(params) {
  return getUserFavorites(params)
}

async function loadUser() {
  // 真实用户信息：自己的从 JWT + /api/user-info/me；他人信息后端缺 /api/users/{guid} 端点（缺口清单），先展示 mock + JWT 混合
  following.value = false
  userInfo.value = null
  if (isSelf.value) {
    // 签名：优先取本地保存值（后端缺口：无 bio 字段/端点，本地持久化）
    let savedBio = ''
    try {
      savedBio = localStorage.getItem(bioStorageKey()) || ''
    } catch (e) { /* 忽略 */ }
    user.value = {
      nickname: auth.user.name,
      bio: savedBio || '我的个人空间',
      avatar: 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="50" fill="#fbbf24"/><text x="50" y="62" font-size="40" text-anchor="middle" fill="white">芒</text></svg>'),
      followingCount: 6,
      followerCount: 12,
      likeTotal: 128
    }
    // 背景封面 + 等级/经验/硬币（Message：/api/user-info/me，失败保持默认渐变与默认等级）
    try {
      const info = await getMyUserInfo()
      const d = info && info.data ? info.data : info
      if (d) {
        userInfo.value = d
        if (d.backgroundCoverUrl) user.value.coverUrl = d.backgroundCoverUrl
      }
    } catch (e) { /* 忽略 */ }
    // 关注数接真实值（/api/follows/following 的 total）
    try {
      const f = await getFollowing({ page: 1, pageSize: 1 })
      const d = f && f.data ? f.data : f
      if (d && d.total != null) user.value.followingCount = d.total
    } catch (e) { /* 忽略 */ }
  } else {
    user.value = {
      nickname: '用户 ' + String(userId.value).slice(0, 8),
      bio: '这个人很懒，什么都没有写',
      avatar: 'https://api.dicebear.com/9.x/thumbs/svg?seed=' + userId.value,
      followingCount: 42,
      followerCount: 128,
      likeTotal: 356
    }
    await checkFollowing()
  }
}

// 关注状态：拉取「我关注的人」列表比对（后端暂无 is-following 端点，与详情页同法）
async function checkFollowing() {
  if (isSelf.value || !auth.isLoggedIn()) return
  try {
    const res = await getFollowing({ page: 1, pageSize: 200 })
    const data = res && res.data ? res.data : res
    const list = data.items || data.list || []
    following.value = list.some(u => String(u.userGuid || u.userId) === String(userId.value))
  } catch (e) {
    following.value = false
  }
}

// 关注 / 取关（Message：POST|DELETE /api/follows/{userGuid}）
async function toggleFollow() {
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
async function onChat() {
  if (!auth.isLoggedIn()) {
    toast.push('请先登录后聊天', 'info')
    router.push('/login')
    return
  }
  try {
    const res = await createSession(userId.value)
    const d = res && res.data ? res.data : res
    const sessionId = (d && (d.sessionId || d.id)) || (typeof d === 'string' ? d : '')
    if (!sessionId) throw new Error('no sessionId')
    router.push('/chat/' + sessionId)
  } catch (e) {
    toast.push('无法发起会话，请稍后重试', 'error')
  }
}

// 签名本地持久化 key（后端暂无 bio 字段/端点；补齐后改为服务端存取）
const bioStorageKey = () => `notblog-bio-${userId.value}`

function onBioChanged(bio) {
  if (!user.value) return
  user.value.bio = bio
  try {
    localStorage.setItem(bioStorageKey(), bio)
  } catch (e) { /* 忽略 */ }
}

// 用户卡片事件：头像/封面更新（上传逻辑在 UserCard 组件内）
function onAvatarChanged(url) {
  if (url && user.value) user.value.avatar = url
}

function onCoverChanged(url) {
  if (url && user.value) user.value.coverUrl = url
}

async function loadFiles() {
  try {
    const res = await getUserFiles({ type: fileType.value })
    const data = res && res.data ? res.data : res
    files.value = data.items || data.list || []
  } catch (e) {
    files.value = []
  }
}

async function loadLinked() {
  try {
    const res = await getLinkedAccounts()
    const data = res && res.data ? res.data : res
    linkedAccounts.value = Array.isArray(data) ? data : (data.items || data.list || [])
  } catch (e) {
    linkedAccounts.value = []
  }
}

async function submitPassword() {
  pwdError.value = ''
  if (!pwd.value.oldPassword || !pwd.value.newPassword) {
    pwdError.value = '请填写旧密码和新密码'
    return
  }
  if (pwd.value.newPassword.length < 8) {
    pwdError.value = '新密码至少 8 位'
    return
  }
  if (pwd.value.newPassword !== pwd.value.confirmPassword) {
    pwdError.value = '两次输入的新密码不一致'
    return
  }
  pwdSaving.value = true
  try {
    await changePassword({ email: auth.user ? auth.user.email : '', oldPassword: pwd.value.oldPassword, newPassword: pwd.value.newPassword })
    toast.push('密码修改成功', 'success')
    pwd.value = { oldPassword: '', newPassword: '', confirmPassword: '' }
  } catch (e) {
    const data = e.response && e.response.data
    pwdError.value = (typeof data === 'string' && data) || (data && (data.error || data.message)) || '修改失败，请检查旧密码'
  } finally {
    pwdSaving.value = false
  }
}

async function unlink(a) {
  try {
    await unlinkAccount(a.provider, a.providerUserId)
    linkedAccounts.value = linkedAccounts.value.filter(x => x.provider !== a.provider || x.providerUserId !== a.providerUserId)
    toast.push(`已解绑 ${a.displayName}`, 'success')
  } catch (e) {
    toast.push('解绑失败，请稍后重试', 'error')
  }
}

function providerIcon(p) {
  const map = { github: '🐙', google: '🔴', microsoft: '🟦', wechat: '💚', qq: '🐧' }
  return map[p] || '🔗'
}

function previewFile(f) {
  toast.push(`预览 ${f.name} 功能开发中`, 'info')
}

function formatSize(bytes) {
  if (!bytes) return '0 B'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1024 / 1024).toFixed(1) + ' MB'
}

function hideImg(e) {
  e.target.style.visibility = 'hidden'
}

watch(() => route.params.id, () => {
  loadUser()
  loadOverview()
})

onMounted(() => {
  loadUser()
  loadOverview()
  loadFiles()
  loadLinked()
})
</script>
