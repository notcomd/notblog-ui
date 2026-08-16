<template>
  <div class="max-w-[1400px] mx-auto">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-zinc-800 dark:text-zinc-100">探索</h1>
        <p class="text-sm text-zinc-400 mt-1">发现全网热门，看看大家都在关注什么</p>
      </div>
      <div class="flex gap-2 glass-card p-1">
        <button class="px-4 py-1.5 rounded-[5%] text-sm font-medium transition-all" :class="tab === 'hot' ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-white' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 dark:text-zinc-200'" @click="tab = 'hot'">🔥 热门</button>
        <button class="px-4 py-1.5 rounded-[5%] text-sm font-medium transition-all" :class="tab === 'follow' ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-white' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 dark:text-zinc-200'" @click="tab = 'follow'">✨ 关注动态</button>
        <button class="px-4 py-1.5 rounded-[5%] text-sm font-medium transition-all" :class="tab === 'circles' ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-white' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 dark:text-zinc-200'" @click="tab = 'circles'">🏕️ 频道</button>
      </div>
    </div>

    <!-- 热门 / 关注：信息流 -->
    <PostGrid v-if="tab !== 'circles'" :loader="tab === 'hot' ? getTrending : getTimeline" :key="tab" empty-text="暂时没有热门内容" />

    <!-- 频道发现（GET /api/circles，后端「圈子发现列表」） -->
    <div v-else>
      <!-- 未登录引导 -->
      <div v-if="!auth.isLoggedIn()" class="glass-card p-4 flex items-center justify-between mb-4">
        <span class="text-sm text-zinc-500 dark:text-zinc-400">🔒 登录后可发现并加入频道</span>
        <button class="px-4 h-9 rounded-[5%] text-sm font-medium bg-gradient-to-r from-amber-400 to-orange-500 text-white hover: active:scale-95 transition-all" @click="router.push('/login')">立即登录</button>
      </div>

      <!-- 搜索框 -->
      <div class="relative max-w-md mb-4">
        <svg class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.35-4.35" /></svg>
        <input
          v-model="circleKeyword"
          class="w-full h-10 pl-9 pr-3 rounded-[5%] bg-white/70 dark:bg-zinc-800/70 border border-white/60 dark:border-white/10 text-sm outline-none focus:ring-2 focus:ring-amber-400/50 transition-all"
          placeholder="搜索频道名称"
          @keyup.enter="loadCircles"
        />
      </div>

      <div v-if="circleLoading" class="py-16 text-center text-sm text-zinc-400">加载中...</div>
      <div v-else-if="circles.length === 0" class="py-16 flex flex-col items-center gap-3 text-zinc-400">
        <div class="text-5xl">🏕️</div>
        <p class="text-sm">暂无频道，去创建第一个吧</p>
      </div>
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <div v-for="c in circles" :key="c.circleGuid" class="glass-card p-4 flex items-start gap-3">
          <img :src="c.avatarUrl || circleFallback" alt="" class="w-12 h-12 rounded-[5%] object-cover border border-white/60 dark:border-white/10 shrink-0" @error="hideImg" />
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-1.5">
              <span class="text-sm font-semibold text-zinc-800 dark:text-zinc-100 truncate">{{ c.name }}</span>
              <span v-if="c.isMember" class="text-[10px] leading-none px-1.5 py-0.5 rounded-[5%] bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 shrink-0">已加入</span>
            </div>
            <p class="text-xs text-zinc-400 mt-0.5 line-clamp-2 min-h-[2rem]">{{ c.description || '暂无简介' }}</p>
            <div class="mt-2 flex items-center justify-between">
              <span class="text-[11px] text-zinc-400">👥 {{ c.memberCount }} 成员</span>
              <button
                v-if="!c.isMember"
                class="h-7 px-3 rounded-[5%] text-[11px] font-medium bg-gradient-to-r from-amber-400 to-orange-500 text-white hover: active:scale-95 transition-all shrink-0"
                @click="openJoin(c)"
              >加入</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ===== 加入频道弹窗（发现频道处，邀请制需输邀请码；轻量输入场景） ===== -->
    <div v-if="joinTarget" class="fixed inset-0 z-[70] flex items-center justify-center bg-black/30" @click.self="joinTarget = null">
      <div class="glass-card p-6 w-96">
        <h3 class="text-lg font-bold text-zinc-800 dark:text-zinc-100 mb-1">加入「{{ joinTarget.name }}」</h3>
        <p class="text-xs text-zinc-400 mb-4">该频道为邀请制，输入成员分享的邀请码即可加入</p>
        <input
          v-model="joinInput"
          class="w-full h-11 px-4 rounded-[5%] bg-white/70 dark:bg-zinc-800/70 border border-white/60 dark:border-white/10 text-sm outline-none focus:ring-2 focus:ring-amber-400/50 transition-all"
          placeholder="请输入频道邀请码"
          @keyup.enter="doJoin"
        />
        <div class="flex justify-end gap-2 mt-4">
          <button class="px-4 h-10 rounded-[5%] text-sm text-zinc-500 dark:text-zinc-400 hover:bg-white/60 dark:hover:bg-zinc-800/60 transition-all" @click="joinTarget = null">取消</button>
          <button class="px-4 h-10 rounded-[5%] text-sm font-medium bg-gradient-to-r from-amber-400 to-orange-500 text-white hover: active:scale-95 transition-all disabled:opacity-50" :disabled="!joinInput.trim() || joining" @click="doJoin">
            {{ joining ? '加入中...' : '加入频道' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default { name: 'ExploreView' }
</script>

<script setup>
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import PostGrid from '@/components/post/PostGrid.vue'
import { getTimeline, getTrending } from '@/api/tweet'
import { getDiscoverCircles, joinCircle } from '@/api/circle'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'

const tab = ref('hot')
const router = useRouter()
const auth = useAuthStore()
const toast = useToastStore()

// ===== 频道发现（GET /api/circles?keyword=&page=&pageSize=） =====
const circles = ref([])
const circleLoading = ref(false)
const circleKeyword = ref('')

const circleFallback = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="24" fill="#fbbf24"/><text x="50" y="64" font-size="36" text-anchor="middle" fill="white">🏕</text></svg>')
function hideImg(e) { e.target.style.display = 'none' }

async function loadCircles() {
  if (!auth.isLoggedIn()) {
    circles.value = []
    return
  }
  circleLoading.value = true
  try {
    const res = await getDiscoverCircles({ keyword: circleKeyword.value.trim() || undefined, page: 1, pageSize: 24 })
    const data = res && res.data ? res.data : res
    circles.value = data.items || data.list || data || []
  } catch (e) {
    console.error('加载频道发现失败:', e)
    circles.value = []
  } finally {
    circleLoading.value = false
  }
}

// 进入频道 Tab / 登录状态变化时加载
watch(tab, t => {
  if (t === 'circles') loadCircles()
})
watch(() => auth.isLoggedIn(), logged => {
  if (logged && tab.value === 'circles') loadCircles()
})

// ===== 加入频道（邀请码；POST /api/circles/join { code }） =====
const joinTarget = ref(null)
const joinInput = ref('')
const joining = ref(false)

function openJoin(c) {
  if (!auth.isLoggedIn()) {
    toast.push('请先登录后再加入频道', 'info')
    router.push('/login')
    return
  }
  joinTarget.value = c
  joinInput.value = ''
}

async function doJoin() {
  const code = joinInput.value.trim()
  if (!code || !joinTarget.value) return
  joining.value = true
  try {
    await joinCircle({ code })
    toast.push(`已加入「${joinTarget.value.name}」`, 'success')
    joinTarget.value = null
    joinInput.value = ''
    loadCircles()
  } catch (e) {
    // 后端业务错误经拦截器 reject(new Error(message))；HTTP 错误 body 可能为字符串
    const m = e && e.message && e.message !== 'Error' ? e.message : ''
    const d = e && e.response && typeof e.response.data === 'string' ? e.response.data : ''
    toast.push(m || d || '加入失败，请检查邀请码是否正确', 'error')
  } finally {
    joining.value = false
  }
}
</script>
