<template>
  <div class="max-w-[1200px] mx-auto">
    <!-- ===== 内容区（工具栏由全局 SideNav 提供：作品/收藏/我的仓库/安全） ===== -->
    <div class="space-y-5">
      <!-- 头部信息 -->
      <div class="glass-card overflow-hidden">
        <div class="h-36 relative bg-gradient-to-r from-amber-300/70 via-orange-300/50 to-emerald-300/60 dark:from-amber-500/25 dark:via-orange-500/20 dark:to-emerald-500/25">
          <div class="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(255,255,255,0.5),transparent_50%)]"></div>
        </div>
        <div class="px-6 pb-5 -mt-10">
          <div class="flex items-end gap-4">
            <div class="relative group">
              <img :src="user.avatar" alt="" class="w-20 h-20 rounded-2xl object-cover border-4 border-white dark:border-zinc-800" @error="hideImg" />
              <button v-if="isSelf" class="absolute inset-0 rounded-2xl bg-black/45 text-white text-[10px] font-medium flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" title="更换头像" @click="avatarInput && avatarInput.click()">更换头像</button>
              <input ref="avatarInput" type="file" accept="image/*" class="hidden" @change="onAvatarChange" />
            </div>
            <div class="flex-1 min-w-0 pb-1">
              <div class="text-xl font-bold text-zinc-800 dark:text-zinc-100">{{ user.nickname || user.name || '未命名用户' }}</div>
              <div class="text-sm text-zinc-400 truncate mt-0.5">{{ user.bio || '这个人很懒，什么都没有写' }}</div>
            </div>
            <!-- 统计卡片 -->
            <div class="flex gap-5 pb-1">
              <div class="text-center">
                <div class="text-lg font-bold text-zinc-800 dark:text-zinc-100">{{ compactNumber(user.followingCount || 0) }}</div>
                <div class="text-[11px] text-zinc-400">关注</div>
              </div>
              <div class="text-center">
                <div class="text-lg font-bold text-zinc-800 dark:text-zinc-100">{{ compactNumber(user.followerCount || 0) }}</div>
                <div class="text-[11px] text-zinc-400">粉丝</div>
              </div>
              <div class="text-center">
                <div class="text-lg font-bold text-zinc-800 dark:text-zinc-100">{{ compactNumber(user.likeTotal || 0) }}</div>
                <div class="text-[11px] text-zinc-400">获赞</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab 内容 -->
      <!-- 作品：3列网格 -->
      <div v-if="activeTab === 'works'">
        <PostGrid :loader="worksLoader" :key="userId" empty-text="还没有发布过内容" />
      </div>

      <!-- 收藏 -->
      <div v-else-if="activeTab === 'favorites'">
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
          <span class="text-xs text-zinc-400">我的仓库端点后端缺口，当前为演示数据</span>
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

      <!-- 账号与安全 -->
      <div v-else-if="activeTab === 'security'" class="grid lg:grid-cols-2 gap-5">
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
import { useRoute } from 'vue-router'
import PostGrid from '@/components/post/PostGrid.vue'
import { getUserPosts } from '@/api/tweet'
import { getUserFavorites, getUserFiles, getLinkedAccounts, unlinkAccount, changePassword } from '@/api/space'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import { uploadAvatar } from '@/api/auth'
import { compactNumber, relativeTime } from '@/utils/format'

const route = useRoute()
const auth = useAuthStore()
const toast = useToastStore()

const userId = computed(() => route.params.id)
const isSelf = computed(() => !!auth.user && String(auth.user.NameIdentifier) === String(userId.value))

// 头像上传（Identity：POST /api/avatar/upload）
const avatarInput = ref(null)

async function onAvatarChange(e) {
  const file = e.target.files && e.target.files[0]
  e.target.value = ''
  if (!file) return
  if (file.size > 10 * 1024 * 1024) {
    toast.push('图片不能超过 10MB', 'error')
    return
  }
  try {
    const res = await uploadAvatar(file)
    const data = res && res.data ? res.data : res
    const url = data.fileUri || data.url || data.path
    if (url && user.value) user.value.avatar = url
    toast.push('头像已更新', 'success')
  } catch (err) {
    toast.push('上传失败（后端未就绪）', 'error')
  }
}

// 工具栏由全局 SideNav 提供（?tab=works|favorites|files|security），此处只消费 query
const activeTab = ref(route.query.tab || 'works')
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
  // 真实用户信息：自己的从 JWT；他人信息后端缺 /api/users/{guid} 端点（缺口清单），先展示 mock + JWT 混合
  if (isSelf.value) {
    user.value = {
      nickname: auth.user.name,
      bio: '我的个人空间',
      avatar: 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="50" fill="#fbbf24"/><text x="50" y="62" font-size="40" text-anchor="middle" fill="white">芒</text></svg>'),
      followingCount: 6,
      followerCount: 12,
      likeTotal: 128
    }
  } else {
    user.value = {
      nickname: '用户 ' + String(userId.value).slice(0, 8),
      bio: '这个人很懒，什么都没有写',
      avatar: 'https://api.dicebear.com/9.x/thumbs/svg?seed=' + userId.value,
      followingCount: 42,
      followerCount: 128,
      likeTotal: 356
    }
  }
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

watch(() => route.params.id, loadUser)

onMounted(() => {
  loadUser()
  loadFiles()
  loadLinked()
})
</script>
