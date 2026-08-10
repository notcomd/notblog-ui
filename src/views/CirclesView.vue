<template>
  <div class="max-w-[1400px] mx-auto flex gap-5">
    <!-- ===== 左：我的频道列表（1:2 分栏的 1） ===== -->
    <div class="w-64 shrink-0 flex flex-col glass-card p-3 h-[calc(100vh-7.5rem)]">
      <div class="px-2 pb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-200 flex items-center gap-2">
        <svg class="w-4 h-4 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21v-4m0 0V5a2 2 0 0 1 2-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 0 0-2 2z" /></svg>
        我的频道
      </div>
      <div class="flex-1 overflow-y-auto space-y-1 min-h-0">
        <button
          v-for="c in circles"
          :key="c.circleGuid"
          class="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-[5%] transition-all text-left"
          :class="current && current.circleGuid === c.circleGuid ? 'bg-gradient-to-r from-amber-400/15 to-orange-400/10 ' : 'hover:bg-white/60 dark:hover:bg-zinc-800/60'"
          @click="select(c)"
        >
          <img :src="c.avatarUrl || fallback" alt="" class="w-10 h-10 rounded-[5%] object-cover border border-white/60 dark:border-white/10" @error="hideImg" />
          <span class="flex-1 min-w-0">
            <span class="block text-sm font-medium text-zinc-700 dark:text-zinc-200 truncate">{{ c.name }}</span>
            <span class="block text-xs text-zinc-400">{{ c.memberCount }} 成员</span>
          </span>
          <span v-if="c.unread" class="w-2 h-2 rounded-full bg-red-500 shrink-0"></span>
        </button>
        <div v-if="!loading && circles.length === 0" class="py-10 flex flex-col items-center gap-2 text-zinc-400">
          <div class="text-4xl">🏕️</div>
          <p class="text-xs">还没有加入任何频道</p>
        </div>
      </div>
      <!-- 底部固定：加入频道按钮（在列表内，不随滚动） -->
      <div class="pt-2 border-t border-zinc-200/60 dark:border-zinc-700/60">
        <button class="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-[5%] text-sm font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 active:scale-[0.98] transition-all" @click="joinOpen = true">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 5v14M5 12h14" /></svg>
          加入频道
        </button>
      </div>
    </div>

    <!-- ===== 右：频道主视窗（1:2 分栏的 2） ===== -->
    <div class="flex-1 min-w-0">
      <div v-if="current" class="glass-card overflow-hidden">
        <!-- Banner 头图 -->
        <div class="h-40 relative bg-gradient-to-r from-amber-200/70 via-orange-200/60 to-emerald-200/70 dark:from-amber-500/20 dark:via-orange-500/15 dark:to-emerald-500/20">
          <img v-if="current.avatarUrl" :src="current.avatarUrl" alt="" class="absolute inset-0 w-full h-full object-cover opacity-25" @error="hideImg" />
          <div class="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
          <div class="absolute bottom-4 left-5 right-5 flex items-end justify-between">
            <div class="flex items-center gap-3">
              <img :src="current.avatarUrl || fallback" alt="" class="w-14 h-14 rounded-[5%] object-cover border-2 border-white/70" @error="hideImg" />
              <div>
                <div class="text-xl font-bold text-white drop-shadow">{{ current.name }}</div>
                <div class="text-xs text-white/85 drop-shadow mt-0.5">{{ current.description }}</div>
                <div class="text-[11px] text-white/70 mt-1 flex items-center gap-3">
                  <span>👥 {{ current.memberCount }} 成员</span>
                  <span>{{ roleText }}</span>
                </div>
              </div>
            </div>
            <!-- 退出频道（二次确认） -->
            <button v-if="!confirmingLeave" class="px-3 h-9 rounded-[5%] text-xs font-medium bg-white/30 text-white border border-white/40 hover:bg-white/40 active:scale-95 transition-all" @click="confirmingLeave = true">退出频道</button>
            <div v-else class="flex items-center gap-2">
              <span class="text-xs text-white drop-shadow">确定退出？</span>
              <button class="px-3 h-9 rounded-[5%] text-xs font-medium bg-red-500 text-white shadow hover:bg-red-600 active:scale-95 transition-all" @click="doLeave">确认</button>
              <button class="px-3 h-9 rounded-[5%] text-xs font-medium bg-white/30 text-white border border-white/40 hover:bg-white/40 active:scale-95 transition-all" @click="confirmingLeave = false">取消</button>
            </div>
          </div>
        </div>
      </div>

      <!-- 频道动态流 -->
      <div v-if="current" class="mt-5">
        <div class="flex items-center gap-2 mb-4">
          <span class="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-400/15 text-amber-600 dark:text-amber-400">当前所在频道：{{ current.name }}</span>
        </div>
        <PostGrid :loader="circleLoader" :key="current.circleGuid" empty-text="频道里还没有内容，快来发布第一条动态吧" />
      </div>
      <div v-else class="py-24 flex flex-col items-center gap-4">
        <div class="text-6xl">🏕️</div>
        <p class="text-zinc-500 dark:text-zinc-400">从左侧选择一个频道开始浏览</p>
      </div>
    </div>

    <!-- ===== 加入频道对话框（邀请码/链接） ===== -->
    <div v-if="joinOpen" class="fixed inset-0 z-[70] flex items-center justify-center bg-black/30" @click.self="joinOpen = false">
      <div class="glass-card p-6 w-96">
        <h3 class="text-lg font-bold text-zinc-800 dark:text-zinc-100 mb-4">加入频道</h3>
        <p class="text-xs text-zinc-400 mb-3">输入频道邀请码即可加入</p>
        <input
          v-model="joinInput"
          class="w-full h-11 px-4 rounded-[5%] bg-white/70 dark:bg-zinc-800/70 border border-white/60 dark:border-white/10 text-sm outline-none focus:ring-2 focus:ring-amber-400/50 transition-all"
          placeholder="请输入频道邀请码"
          @keyup.enter="doJoin"
        />
        <div class="flex justify-end gap-2 mt-4">
          <button class="px-4 h-10 rounded-[5%] text-sm text-zinc-500 dark:text-zinc-400 hover:bg-white/60 dark:hover:bg-zinc-800/60 transition-all" @click="joinOpen = false">取消</button>
          <button class="px-4 h-10 rounded-[5%] text-sm font-medium bg-gradient-to-r from-amber-400 to-orange-500 text-white hover: active:scale-95 transition-all disabled:opacity-50" :disabled="!joinInput.trim() || joining" @click="doJoin">
            {{ joining ? '加入中...' : '加入频道' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default { name: 'CirclesView' }
</script>

<script setup>
import { computed, onMounted, ref } from 'vue'
import PostGrid from '@/components/post/PostGrid.vue'
import { getMyCircles, getCircle, getCirclePosts, joinCircle, leaveCircle } from '@/api/circle'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'

const auth = useAuthStore()
const toast = useToastStore()

const circles = ref([])
const current = ref(null)
const loading = ref(false)
const confirmingLeave = ref(false)
const joinOpen = ref(false)
const joinInput = ref('')
const joining = ref(false)
const fallback = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="24" fill="#fbbf24"/><text x="50" y="64" font-size="36" text-anchor="middle" fill="white">🏕</text></svg>')

const roleText = computed(() => {
  if (!current.value) return ''
  const map = { Owner: '圈主', Admin: '管理员', Member: '成员' }
  return map[current.value.myRole] || '成员'
})

function circleLoader(params) {
  return getCirclePosts(current.value.circleGuid, params)
}

async function loadCircles() {
  loading.value = true
  try {
    const res = await getMyCircles()
    const data = res && res.data ? res.data : res
    circles.value = data.items || data.list || data || []
    // 默认选中第一个
    if (circles.value.length && !current.value) {
      select(circles.value[0])
    }
  } catch (e) {
    console.error('加载频道失败:', e)
  } finally {
    loading.value = false
  }
}

async function select(c) {
  current.value = c
  confirmingLeave.value = false
  // 刷新详情（成员数/角色可能变化）
  try {
    const res = await getCircle(c.circleGuid)
    const d = res && res.data ? res.data : res
    if (d && d.circleGuid) current.value = { ...c, ...d }
  } catch (e) { /* 使用列表数据兜底 */ }
}

async function doLeave() {
  try {
    await leaveCircle(current.value.circleGuid, auth.user ? auth.user.id : '')
    circles.value = circles.value.filter(c => c.circleGuid !== current.value.circleGuid)
    toast.push(`已退出频道「${current.value.name}」`, 'success')
    current.value = circles.value.length ? circles.value[0] : null
  } catch (e) {
    toast.push('退出失败，请稍后重试', 'error')
  } finally {
    confirmingLeave.value = false
  }
}

async function doJoin() {
  const input = joinInput.value.trim()
  if (!input || joining.value) return
  joining.value = true
  try {
    // 兼容：纯邀请码 -> { code }；含 ?token= 或 /invite/xxx 的链接 -> 提取 token
    const tokenMatch = input.match(/[?&]token=([0-9a-f-]+)/i) || input.match(/\/([0-9a-f-]{36})/i)
    const payload = tokenMatch
      ? { token: tokenMatch[1] }
      : { code: input }
    await joinCircle(payload)
    toast.push('已加入频道', 'success')
    joinOpen.value = false
    joinInput.value = ''
    loadCircles()
  } catch (e) {
    toast.push('加入失败：邀请码无效或已过期', 'error')
  } finally {
    joining.value = false
  }
}

function hideImg(e) {
  e.target.style.visibility = 'hidden'
}

onMounted(loadCircles)
</script>
