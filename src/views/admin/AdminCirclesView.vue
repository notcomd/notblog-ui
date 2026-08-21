<template>
  <div class="max-w-[1400px] mx-auto space-y-5">
    <div>
      <h1 class="text-2xl font-bold text-zinc-800 dark:text-zinc-100">社区管理</h1>
      <p class="text-sm text-zinc-400 mt-1">全平台社区管控（全量列表后端缺口，操作用真实端点：解散/转让/成员）</p>
    </div>

    <div class="flex gap-5">
      <!-- 左：社区列表 -->
      <div class="w-72 shrink-0 glass-card p-3 flex flex-col h-[calc(100vh-10rem)]">
        <input v-model="keyword" class="h-10 px-4 rounded-[5%] bg-white/60 dark:bg-zinc-800/60 border border-white/50 dark:border-white/10 text-sm outline-none focus:ring-2 focus:ring-amber-400/50 transition-all mb-3" placeholder="按社区名称检索..." @input="filterCircles" />
        <div class="flex-1 overflow-y-auto space-y-1 min-h-0">
          <button v-for="c in filtered" :key="c.circleGuid" class="w-full flex items-center gap-3 px-3 py-2.5 rounded-[5%] transition-all text-left"
            :class="current && current.circleGuid === c.circleGuid ? 'bg-gradient-to-r from-amber-400/15 to-orange-500/10 ' : 'hover:bg-white/60 dark:hover:bg-zinc-800/60'"
            @click="select(c)">
            <img :src="c.avatarUrl" alt="" class="w-10 h-10 rounded-[5%] object-cover border border-white/60 dark:border-white/10" @error="hideImg" />
            <span class="flex-1 min-w-0">
              <span class="block text-sm font-medium text-zinc-700 dark:text-zinc-200 truncate">{{ c.name }}</span>
              <span class="block text-xs text-zinc-400">{{ c.memberCount }} 成员 · {{ relativeTime(c.createTime) }}</span>
            </span>
            <span v-if="c.status === 'Banned'" class="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-500 shrink-0">已封禁</span>
          </button>
          <div v-if="filtered.length === 0" class="py-10 text-center text-sm text-zinc-400">暂无社区</div>
        </div>
      </div>

      <!-- 右：社区详情 -->
      <div class="flex-1 min-w-0 space-y-4">
        <div v-if="current" class="glass-card overflow-hidden">
          <div class="h-32 relative bg-gradient-to-r from-amber-400/40 via-indigo-400/30 to-purple-400/40 dark:from-amber-400/20 dark:via-indigo-500/15 dark:to-purple-500/20">
            <div class="absolute bottom-4 left-5 flex items-center gap-3">
              <img :src="current.avatarUrl" alt="" class="w-14 h-14 rounded-[5%] object-cover border-2 border-white/70" @error="hideImg" />
              <div>
                <div class="text-xl font-bold text-white drop-shadow">{{ current.name }}</div>
                <div class="text-xs text-white/85 mt-0.5">{{ current.description }}</div>
                <div class="text-[11px] text-white/70 mt-1">创建者：{{ current.ownerName }} · {{ current.memberCount }} 成员 · {{ current.postCount }} 帖子</div>
              </div>
              <span v-if="current.status === 'Banned'" class="ml-3 text-xs px-2.5 py-1 rounded-full bg-red-500/90 text-white inline-flex items-center gap-1"><svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>已封禁</span>
            </div>
          </div>
          <!-- 操作按钮 -->
          <div class="px-5 py-3 flex gap-2 border-t border-zinc-200/60 dark:border-zinc-700/60">
            <button v-if="current.status !== 'Banned'" class="px-3.5 h-9 rounded-[5%] text-xs font-medium bg-amber-400/15 text-amber-600 dark:text-amber-400 hover:bg-amber-400/25 active:scale-95 transition-all inline-flex items-center gap-1" @click="banCircleOpen = true"><svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg> 封禁社区</button>
            <button class="px-3.5 h-9 rounded-[5%] text-xs font-medium bg-red-500/10 text-red-500 hover:bg-red-500/20 active:scale-95 transition-all inline-flex items-center gap-1" @click="dissolveOpen = true"><svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg> 解散社区</button>
            <button class="px-3.5 h-9 rounded-[5%] text-xs font-medium bg-amber-500/10 text-amber-600 hover:bg-amber-1000/20 active:scale-95 transition-all inline-flex items-center gap-1" @click="transferOpen = true"><svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg> 转让社区</button>
          </div>
          <!-- Tab：成员 / 会话 -->
          <div class="px-5 pb-4">
            <div class="flex gap-1 glass p-1 rounded-[5%] w-fit mb-3">
              <button class="px-4 py-1.5 rounded-[5%] text-sm font-medium transition-all" :class="tab === 'members' ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 dark:text-zinc-200'" @click="tab = 'members'">成员列表</button>
              <button class="px-4 py-1.5 rounded-[5%] text-sm font-medium transition-all" :class="tab === 'sessions' ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 dark:text-zinc-200'" @click="tab = 'sessions'">会话列表</button>
            </div>
            <!-- 成员 -->
            <div v-if="tab === 'members'" class="space-y-2">
              <div v-for="m in members" :key="m.userGuid" class="flex items-center gap-3 px-3 py-2 rounded-[5%] bg-white/50 dark:bg-zinc-800/50">
                <span class="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs">{{ (m.userName || '?').slice(0, 1) }}</span>
                <span class="text-sm font-medium text-zinc-700 dark:text-zinc-200 flex-1">{{ m.userName }}</span>
                <span class="text-xs px-2 py-0.5 rounded-full" :class="roleClass(m.role)">{{ roleText(m.role) }}</span>
                <span class="text-xs text-zinc-400">{{ relativeTime(m.joinTime) }}加入</span>
                <button v-if="m.role !== 'Owner'" class="px-2.5 h-7 rounded-[5%] text-xs text-red-500 hover:bg-red-500/10 transition-colors" @click="removeMember(m)">移除</button>
              </div>
            </div>
            <!-- 会话 -->
            <div v-else class="py-10 text-center text-sm text-zinc-400">该社区下的会话列表（后端缺口，演示数据）</div>
          </div>
        </div>
        <div v-else class="py-24 flex flex-col items-center gap-4 text-zinc-400">
          <div class="text-6xl"><svg class="w-14 h-14 text-zinc-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg></div>
          <p>从左侧选择一个社区</p>
        </div>
      </div>
    </div>

    <!-- 封禁社区 -->
    <AdminModal v-if="banCircleOpen" title="封禁社区" @close="banCircleOpen = false">
      <p class="text-sm text-zinc-500 dark:text-zinc-400 mb-3">封禁后「{{ current.name }}」全站不可见，所有成员将收到系统通知。确定封禁？</p>
      <input v-model="banReason" placeholder="封禁原因（必填）" class="w-full h-10 px-3.5 rounded-[5%] bg-white/70 dark:bg-zinc-800/70 border border-white/60 dark:border-white/10 text-sm outline-none focus:ring-2 focus:ring-amber-400/50 transition-all" />
      <template #footer>
        <button class="px-4 h-10 rounded-[5%] text-sm text-zinc-500 hover:bg-white/60 dark:hover:bg-zinc-800/60 transition-all dark:text-zinc-400" @click="banCircleOpen = false">取消</button>
        <button class="px-4 h-10 rounded-[5%] text-sm font-medium bg-gradient-to-r from-amber-400 to-orange-500 text-white active:scale-95 transition-all disabled:opacity-50" :disabled="!banReason.trim()" @click="doBanCircle">确认封禁</button>
      </template>
    </AdminModal>

    <!-- 解散社区 -->
    <ConfirmDialog
      v-if="dissolveOpen"
      danger
      title="解散社区（不可恢复）"
      :message="'确定解散「' + (current ? current.name : '') + '」吗？社区及所有内容将被彻底删除，不可恢复！'"
      confirm-text="彻底解散"
      require-reason
      reason-placeholder="解散原因（必填）"
      @close="dissolveOpen = false"
      @confirm="(reason) => doDissolve(reason)"
    />

    <!-- 转让社区 -->
    <AdminModal v-if="transferOpen" title="转让社区" @close="transferOpen = false">
      <p class="text-sm text-zinc-500 dark:text-zinc-400 mb-3">将「{{ current ? current.name : '' }}」转让给新创建者（仅限现有成员）：</p>
      <select v-model="newOwner" class="w-full h-10 px-3 rounded-[5%] bg-white/70 dark:bg-zinc-800/70 border border-white/60 dark:border-white/10 text-sm outline-none">
        <option value="">选择新创建者...</option>
        <option v-for="m in members" :key="m.userGuid" :value="m.userGuid">{{ m.userName }}（{{ roleText(m.role) }}）</option>
      </select>
      <template #footer>
        <button class="px-4 h-10 rounded-[5%] text-sm text-zinc-500 hover:bg-white/60 dark:hover:bg-zinc-800/60 transition-all dark:text-zinc-400" @click="transferOpen = false">取消</button>
        <button class="px-4 h-10 rounded-[5%] text-sm font-medium bg-gradient-to-r from-amber-400 to-orange-500 text-white active:scale-95 transition-all disabled:opacity-50" :disabled="!newOwner" @click="doTransfer">确认转让</button>
      </template>
    </AdminModal>
  </div>
</template>

<script>
export default { name: 'AdminCirclesView' }
</script>

<script setup>
import { onMounted, ref } from 'vue'
import AdminModal from '@/components/admin/AdminModal.vue'
import ConfirmDialog from '@/components/admin/ConfirmDialog.vue'
import { getAdminCircles, getAdminCircleMembers, banCircle, dissolveCircle, transferCircle, removeCircleMember } from '@/api/admin'
import { useToastStore } from '@/stores/toast'
import { relativeTime } from '@/utils/format'

const toast = useToastStore()

const circles = ref([])
const filtered = ref([])
const current = ref(null)
const members = ref([])
const keyword = ref('')
const tab = ref('members')

const banCircleOpen = ref(false)
const banReason = ref('')
const dissolveOpen = ref(false)
const transferOpen = ref(false)
const newOwner = ref('')

function roleClass(r) {
  return { Owner: 'bg-amber-400/15 text-amber-600 dark:text-amber-400', Admin: 'bg-blue-400/15 text-amber-600', Member: 'bg-zinc-400/15 text-zinc-500 dark:text-zinc-400' }[r] || 'bg-zinc-400/15 text-zinc-500 dark:text-zinc-400'
}

function roleText(r) {
  return { Owner: '创建者', Admin: '管理员', Member: '成员' }[r] || r
}

function filterCircles() {
  const kw = keyword.value.toLowerCase()
  filtered.value = kw ? circles.value.filter(c => c.name.toLowerCase().includes(kw)) : circles.value
}

async function load() {
  try {
    const res = await getAdminCircles()
    const data = res && res.data ? res.data : res
    circles.value = data.items || data.list || data || []
    filterCircles()
    if (filtered.value.length && !current.value) select(filtered.value[0])
  } catch (e) {
    console.error('加载社区失败:', e)
  }
}

async function select(c) {
  current.value = c
  try {
    const res = await getAdminCircleMembers(c.circleGuid)
    const data = res && res.data ? res.data : res
    members.value = data.items || data.list || data || []
  } catch (e) {
    members.value = []
  }
}

async function doBanCircle() {
  try {
    await banCircle(current.value.circleGuid, banReason.value)
    toast.push(`已封禁社区「${current.value.name}」`, 'success')
    current.value.status = 'Banned'
    banCircleOpen.value = false
  } catch (e) {
    toast.push('操作失败', 'error')
  }
}

async function doDissolve(reason) {
  try {
    await dissolveCircle(current.value.circleGuid)
    toast.push('社区已解散', 'success')
    circles.value = circles.value.filter(c => c.circleGuid !== current.value.circleGuid)
    filterCircles()
    current.value = filtered.value[0] || null
    dissolveOpen.value = false
  } catch (e) {
    toast.push('操作失败', 'error')
  }
}

async function doTransfer() {
  try {
    await transferCircle(current.value.circleGuid, newOwner.value)
    toast.push('社区已转让', 'success')
    transferOpen.value = false
    load()
  } catch (e) {
    toast.push('操作失败', 'error')
  }
}

async function removeMember(m) {
  try {
    await removeCircleMember(current.value.circleGuid, m.userGuid)
    members.value = members.value.filter(x => x.userGuid !== m.userGuid)
    toast.push(`已移除成员 ${m.userName}`, 'success')
  } catch (e) {
    toast.push('操作失败', 'error')
  }
}

function hideImg(e) {
  e.target.style.visibility = 'hidden'
}

onMounted(load)
</script>
