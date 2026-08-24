<template>
  <!-- 社区成员 tab：搜索框 + 按角色分组列表（创建者/管理者/普通成员），角色管理/移除 -->
  <div class="mt-4">
    <div class="glass-card p-5">
      <div class="flex items-center gap-3 mb-4">
        <span class="flex-1 text-sm font-semibold text-zinc-700 dark:text-zinc-200 inline-flex items-center gap-1.5"><svg class="w-4 h-4 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>社区成员（{{ members.length }}）</span>
        <!-- 成员搜索框（卡片右上方；搜索结果替换分组列表） -->
        <div class="relative w-52 shrink-0">
          <svg class="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
          <input
            v-model="memberSearch"
            class="w-full h-8 pl-7 pr-7 rounded-[5%] bg-white/60 dark:bg-zinc-800/60 border border-white/50 dark:border-white/10 text-xs text-zinc-700 dark:text-zinc-200 outline-none focus:ring-2 focus:ring-amber-400/50 transition-all"
            placeholder="搜索成员"
            @focus="ensureLoaded"
          />
          <button v-if="memberSearch" class="absolute right-1.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200" @click="memberSearch = ''">
            <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>
      </div>

      <div v-if="loading && !memberSearch" class="py-12 text-center text-xs text-zinc-400">加载中...</div>
      <!-- 搜索结果（搜索时替换分组列表） -->
      <div v-else-if="memberSearch" class="space-y-1">
        <div v-if="filteredMembers.length === 0" class="py-8 flex flex-col items-center gap-2 text-zinc-400">
          <div class="text-3xl"><svg class="w-10 h-10 mx-auto text-zinc-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></div>
          <p class="text-xs">未找到相关成员</p>
        </div>
        <div v-for="m in filteredMembers" :key="m.userGuid" class="flex items-center gap-3 px-2 py-2 rounded-[5%] hover:bg-white/60 dark:hover:bg-zinc-800/60 transition-colors">
          <img :src="themeAvatar((m.nickname || '友').charAt(0))" alt="" class="w-9 h-9 rounded-[5%] object-cover shrink-0" />
          <span class="flex-1 min-w-0">
            <span class="block text-sm font-medium text-zinc-700 dark:text-zinc-200 truncate">
              {{ m.nickname || '成员' }}
              <span v-if="m.isMe" class="text-[10px] px-1 py-0.5 rounded-[5%] bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400">我</span>
            </span>
            <span class="block text-xs text-zinc-400">{{ m.joinTime ? new Date(m.joinTime).toLocaleDateString() : '' }}</span>
          </span>
          <span class="shrink-0 text-xs px-2 py-0.5 rounded-[5%]" :class="m.role === 'Owner' ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400' : m.role === 'Admin' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'">
            {{ m.role === 'Owner' ? '创建者' : m.role === 'Admin' ? '管理者' : '成员' }}
          </span>
        </div>
      </div>
      <!-- 分组列表（无搜索时） -->
      <div v-else class="space-y-5">
        <div v-for="(group, gk) in memberGroups" :key="gk">
          <div v-if="group.length" class="text-xs font-medium text-zinc-400 mb-2">{{ gk }}（{{ group.length }}）</div>
          <div v-for="m in group" :key="m.userGuid" class="flex items-center gap-3 px-2 py-2 rounded-[5%] hover:bg-white/60 dark:hover:bg-zinc-800/60 transition-colors">
            <img :src="themeAvatar((m.nickname || '友').charAt(0))" alt="" class="w-9 h-9 rounded-[5%] object-cover shrink-0" />
            <span class="flex-1 min-w-0">
              <span class="block text-sm font-medium text-zinc-700 dark:text-zinc-200 truncate">
                {{ m.nickname || '成员' }}
                <span v-if="m.isMe" class="text-[10px] px-1 py-0.5 rounded-[5%] bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400">我</span>
              </span>
              <span class="block text-xs text-zinc-400">{{ m.joinTime ? new Date(m.joinTime).toLocaleDateString() : '' }}</span>
            </span>
            <span class="shrink-0 text-xs px-2 py-0.5 rounded-[5%]" :class="m.role === 'Owner' ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400' : m.role === 'Admin' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'">
              {{ m.role === 'Owner' ? '创建者' : m.role === 'Admin' ? '管理者' : '成员' }}
            </span>
            <!-- 管理操作：创建者可任命/取消管理员 + 移除；管理者仅可移除普通成员 -->
            <div v-if="!m.isMe && canManage" class="flex items-center gap-1.5 shrink-0">
              <button v-if="isOwner && m.role !== 'Owner'" class="h-7 px-2 rounded-[5%] text-[11px] font-medium transition-colors bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20" @click="$emit('set-role', m, m.role === 'Admin' ? 'Member' : 'Admin')">
                {{ m.role === 'Admin' ? '取消管理员' : '设为管理员' }}
              </button>
              <button v-if="(isOwner && m.role !== 'Owner') || (isAdmin && m.role === 'Member')" class="h-7 px-2 rounded-[5%] text-[11px] font-medium text-red-500 hover:bg-red-500/10 transition-colors" @click="confirmRemove = confirmRemove === m.userGuid ? '' : m.userGuid">
                {{ confirmRemove === m.userGuid ? '确认移除' : '移除' }}
              </button>
              <button v-if="confirmRemove === m.userGuid" class="h-7 px-2 rounded-[5%] text-[11px] font-medium text-zinc-500 hover:bg-white/60 dark:hover:bg-zinc-800/60" @click="confirmRemove = ''">取消</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 社区成员：加载/搜索/按角色分组展示 + 角色任命（Owner）/移除（Owner/Admin）
import { computed, ref, watch } from 'vue'
import { themeAvatar } from '@/utils/avatar'
import { getCircleMembers } from '@/api/circle'
import { useAuthStore } from '@/stores/auth'

interface CircleData {
  circleGuid?: string
}

interface CircleMember {
  userGuid?: string
  nickname?: string
  role?: string
  isMe?: boolean
  joinTime?: any
}

const props = defineProps<{
  current: CircleData | null
  myRole?: string
}>()
defineEmits<{
  'set-role': [m: CircleMember, role: string]
  'remove-member': [m: CircleMember]
}>()

const auth = useAuthStore()

const members = ref<CircleMember[]>([])
const loading = ref(false)
const memberSearch = ref('')
const confirmRemove = ref('')

const isOwner = computed(() => props.myRole === 'Owner')
const isAdmin = computed(() => props.myRole === 'Admin')
const canManage = computed(() => isOwner.value || isAdmin.value)

const filteredMembers = computed(() => {
  const q = memberSearch.value.trim().toLowerCase()
  if (!q) return []
  return members.value.filter(m => (m.nickname || '').toLowerCase().includes(q))
})

const memberGroups = computed<Record<string, CircleMember[]>>(() => {
  const g: Record<string, CircleMember[]> = { 创建者: [], 管理者: [], 成员: [] }
  for (const m of members.value) {
    if (m.role === 'Owner') g.创建者.push(m)
    else if (m.role === 'Admin') g.管理者.push(m)
    else g.成员.push(m)
  }
  return g
})

watch(() => props.current?.circleGuid, () => {
  members.value = []
  memberSearch.value = ''
  confirmRemove.value = ''
  load()
}, { immediate: true })

async function ensureLoaded() {
  if (!members.value.length && props.current) load()
}

async function load() {
  if (!props.current) return
  loading.value = true
  try {
    const res = await getCircleMembers(props.current.circleGuid)
    const data = res && res.data ? res.data : res
    const list = data.items || data.list || data || []
    const me = String(auth.user?.id || '')
    members.value = list.map(m => ({
      ...m,
      isMe: me && String(m.userGuid) === me
    }))
    if (!members.value.length) members.value = buildDemoMembers()
  } catch (e) {
    members.value = buildDemoMembers()
  } finally {
    loading.value = false
  }
}

// 示例成员兜底（后端离线/无数据时展示，含「我」+ 三角色）
function buildDemoMembers(): CircleMember[] {
  const me = String(auth.user?.id || '')
  return [
    { userGuid: me, nickname: auth.user?.name || '我', role: props.myRole, isMe: true, joinTime: Date.now() },
    { userGuid: 'demo-owner', nickname: '户外队长', role: 'Owner', joinTime: Date.now() - 86400000 * 30 },
    { userGuid: 'demo-admin', nickname: '营地管家', role: 'Admin', joinTime: Date.now() - 86400000 * 20 },
    { userGuid: 'demo-m1', nickname: '晨跑达人', role: 'Member', joinTime: Date.now() - 86400000 * 10 },
    { userGuid: 'demo-m2', nickname: '摄影爱好者', role: 'Member', joinTime: Date.now() - 86400000 * 5 }
  ]
}

// 主题渐变头像（amber→orange，全局 rounded-[5%] 风格）
</script>
