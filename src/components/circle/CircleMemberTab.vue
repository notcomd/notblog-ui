<template>
  <!-- 社区成员 tab：搜索 + 按角色分组列表（创建者/管理者/普通成员），角色管理/移除 -->
  <div>
    <!-- 面板头：标签 + 成员数 + 搜索，发丝线收口 -->
    <div class="flex items-center gap-3 pb-3 mb-4 border-b border-zinc-200/60 dark:border-zinc-800/60">
      <span class="flex-1 text-sm font-semibold text-zinc-700 dark:text-zinc-200 inline-flex items-center gap-1.5">
        <svg aria-hidden="true" class="w-4 h-4 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>社区成员
        <span class="font-numeric text-xs font-normal text-zinc-400">{{ members.length }}</span>
      </span>
      <!-- 成员搜索框（搜索结果替换分组列表） -->
      <div class="relative w-52 shrink-0">
        <svg aria-hidden="true" class="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
        <input
          v-model="memberSearch"
          class="h-8 w-full rounded-[5%] border border-zinc-200/70 bg-transparent pl-7 pr-7 text-xs text-zinc-700 outline-none transition-all focus:ring-2 focus:ring-amber-400/40 dark:border-zinc-800 dark:text-zinc-200"
          placeholder="搜索成员"
          name="memberSearch"
          aria-label="搜索成员"
          @focus="ensureLoaded"
        />
        <button v-if="memberSearch" aria-label="清空搜索" class="absolute right-1.5 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200" @click="memberSearch = ''">
          <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
        </button>
      </div>
    </div>

    <div v-if="loading && !isSearching" class="py-16 text-center text-xs text-zinc-400">加载中…</div>
    <div v-else-if="members.length === 0 && !isSearching" class="rounded-[5%] border border-dashed border-zinc-200 py-16 text-center text-xs text-zinc-400 dark:border-zinc-800">暂无成员</div>
    <!-- 搜索结果为空 / 分组为空，共用同一空态 -->
    <div v-else-if="displayGroups.length === 0" class="flex flex-col items-center gap-2 rounded-[5%] border border-dashed border-zinc-200 py-16 text-center text-zinc-400 dark:border-zinc-800">
      <svg aria-hidden="true" class="w-9 h-9 text-zinc-300 dark:text-zinc-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      <p class="text-xs">未找到相关成员</p>
    </div>

    <!-- 分组列表（搜索时只有一组「搜索结果」）：无框行 + 发丝分隔 -->
    <div v-else class="space-y-6">
      <section v-for="g in displayGroups" :key="g.label">
        <div class="mb-1 text-xs font-medium text-zinc-400">{{ g.label }}（{{ g.members.length }}）</div>
        <div class="divide-y divide-zinc-200/60 dark:divide-zinc-800/60">
          <div v-for="m in g.members" :key="m.userGuid" class="card-lift flex items-center gap-3 rounded-[5%] px-2 py-2.5">
            <img :src="themeAvatar((m.nickname || '友').charAt(0))" alt="" class="w-9 h-9 shrink-0 rounded-[5%] object-cover" />
            <span class="flex-1 min-w-0">
              <span class="block truncate text-sm font-medium text-zinc-700 dark:text-zinc-200">
                {{ m.nickname || '成员' }}
                <span v-if="m.isMe" class="ml-0.5 rounded-[5%] bg-amber-400/15 px-1 py-0.5 text-[10px] text-amber-600 dark:text-amber-400">我</span>
              </span>
              <span class="block text-xs text-zinc-400">{{ m.joinTime ? new Date(m.joinTime).toLocaleDateString() : '' }}</span>
            </span>
            <span class="shrink-0 rounded-[5%] px-2 py-0.5 text-xs" :class="roleClass(m.role)">{{ roleLabel(m.role) }}</span>
            <!-- 管理操作：创建者可任命/取消管理员 + 移除；管理者仅可移除普通成员 -->
            <div v-if="!m.isMe && canManage" class="flex shrink-0 items-center gap-1.5">
              <button v-if="isOwner && m.role !== 'Owner'" class="h-7 rounded-[5%] px-2 text-[11px] font-medium transition-colors bg-emerald-400/15 text-emerald-600 hover:bg-emerald-400/25 dark:text-emerald-400" @click="$emit('set-role', m, m.role === 'Admin' ? 'Member' : 'Admin')">
                {{ m.role === 'Admin' ? '取消管理员' : '设为管理员' }}
              </button>
              <button v-if="(isOwner && m.role !== 'Owner') || (isAdmin && m.role === 'Member')" class="h-7 rounded-[5%] px-2 text-[11px] font-medium text-red-500 transition-colors hover:bg-red-500/10" @click="confirmRemove = confirmRemove === m.userGuid ? '' : m.userGuid">
                {{ confirmRemove === m.userGuid ? '确认移除' : '移除' }}
              </button>
              <button v-if="confirmRemove === m.userGuid" class="h-7 rounded-[5%] px-2 text-[11px] font-medium text-zinc-500 transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.06]" @click="confirmRemove = ''">取消</button>
            </div>
          </div>
        </div>
      </section>
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

const isSearching = computed(() => !!memberSearch.value.trim())

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

/**
 * 渲染用的分组列表：搜索时收敛为单组「搜索结果」，否则为三个角色分组。
 * 合并成同一结构后，模板只需一个循环（此前搜索态与分组态各写了一份相同的行标记）。
 */
const displayGroups = computed<Array<{ label: string; members: CircleMember[] }>>(() => {
  if (isSearching.value) return [{ label: '搜索结果', members: filteredMembers.value }]
  const groups = memberGroups.value
  return [
    { label: '创建者', members: groups.创建者 },
    { label: '管理者', members: groups.管理者 },
    { label: '成员', members: groups.成员 }
  ].filter(g => g.members.length > 0)
})

function roleLabel(role?: string): string {
  return role === 'Owner' ? '创建者' : role === 'Admin' ? '管理者' : '成员'
}

function roleClass(role?: string): string {
  if (role === 'Owner') return 'bg-amber-400/15 text-amber-600 dark:text-amber-400'
  if (role === 'Admin') return 'bg-emerald-400/15 text-emerald-600 dark:text-emerald-400'
  return 'bg-black/5 text-zinc-500 dark:bg-white/10 dark:text-zinc-400'
}

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
  } catch (e) {
    members.value = []
  } finally {
    loading.value = false
  }
}
</script>
