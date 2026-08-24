<template>
  <!-- 社区 Banner 卡片：封面/头像/信息/操作按钮 + 分类 tab（公告·主页·资源·成员） -->
  <div>
    <div class="glass-card overflow-hidden">
      <!-- Banner 头图 -->
      <div class="h-40 relative bg-gradient-to-r from-amber-200/70 via-orange-200/60 to-emerald-200/70 dark:from-amber-500/20 dark:via-orange-500/15 dark:to-emerald-500/20">
        <img v-if="coverUrl && !coverIsVideo" :src="coverUrl" alt="" class="absolute inset-0 w-full h-full object-cover opacity-25" @error="hideImg" />
        <video v-else-if="coverUrl" :src="coverUrl" autoplay muted loop playsinline class="absolute inset-0 w-full h-full object-cover opacity-25"></video>
        <img v-else-if="avatarUrl" :src="avatarUrl" alt="" class="absolute inset-0 w-full h-full object-cover opacity-25" @error="hideImg" />
        <div class="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
      </div>

      <!-- 信息行 -->
      <div class="flex items-center gap-3 px-4 py-3">
        <img :src="avatarUrl || fallback" alt="" class="w-12 h-12 rounded-[5%] object-cover border border-white/60 dark:border-white/10 shrink-0" @error="hideImg" />
        <div class="flex-1 min-w-0">
          <div class="text-lg font-bold text-zinc-800 dark:text-zinc-100 truncate">
            {{ name }}
            <span v-if="isSample" class="align-middle text-[10px] leading-none px-1 py-0.5 rounded-[5%] bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 ml-1">示例</span>
          </div>
          <div class="text-xs text-zinc-500 dark:text-zinc-300 truncate mt-0.5">{{ description }}</div>
          <div class="text-[11px] text-zinc-400 mt-1 flex items-center gap-3">
            <span class="inline-flex items-center gap-1"><svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>{{ memberCount }} 成员</span>
            <span>{{ roleText }}</span>
          </div>
        </div>
        <!-- 右上操作：创建者/管理者=社区管理（改信息仅创建者）；普通成员=邀请（邀请码）+ 退出；私密模式仅创建者可邀请 -->
        <button v-if="canManageUsers && !confirmingLeave" class="px-3 h-8 rounded-[5%] text-xs font-medium bg-gradient-to-r from-amber-400 to-orange-500 text-white hover:brightness-110 active:scale-95 transition-all inline-flex items-center gap-1" @click="$emit('manage')"><svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg> 社区管理</button>
        <button v-if="!canManageUsers && !confirmingLeave && joinMode !== 'private'" class="px-3 h-8 rounded-[5%] text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-colors inline-flex items-center gap-1" @click="genMemberInvite"><svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg> 邀请</button>
        <button v-if="!canManageUsers && !confirmingLeave" class="px-3 h-8 rounded-[5%] text-xs font-medium text-zinc-500 dark:text-zinc-300 hover:bg-white/60 dark:hover:bg-zinc-800/60 transition-colors" @click="confirmingLeave = true">退出社区</button>
        <div v-else-if="!canManageUsers && confirmingLeave" class="flex items-center gap-2 shrink-0">
          <span class="text-xs text-zinc-500 dark:text-zinc-400">确定退出？</span>
          <button class="px-3 h-8 rounded-[5%] text-xs font-medium bg-red-500 text-white hover:bg-red-600 active:scale-95 transition-all" @click="$emit('leave')">确定</button>
          <button class="px-3 h-8 rounded-[5%] text-xs font-medium text-zinc-500 dark:text-zinc-300 hover:bg-white/60 dark:hover:bg-zinc-800/60 transition-colors" @click="confirmingLeave = false">取消</button>
        </div>
      </div>

      <!-- 社区分类 tab（卡片内底部） -->
      <div class="flex items-center border-t border-zinc-200/60 dark:border-zinc-700/60 px-2">
        <button
          v-for="t in CIRCLE_TABS"
          :key="t.key"
          class="relative px-3 py-2 text-sm transition-colors inline-flex items-center gap-1"
          :class="circleTab === t.key ? 'text-amber-600 dark:text-amber-400 font-medium' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'"
          @click="$emit('switch-tab', t.key)"
        >
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" v-html="t.icon"></svg>{{ t.label }}
          <span v-if="circleTab === t.key" class="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-amber-500"></span>
        </button>
      </div>
    </div>

    <!-- 邀请码弹窗（普通成员生成邀请码后展示） -->
    <Teleport to="body">
      <div v-if="inviteCodeOpen" class="fixed inset-0 z-[70] flex items-center justify-center bg-black/30" @click.self="inviteCodeOpen = false">
        <div class="glass-card p-6 w-[400px] max-w-[calc(100vw-2rem)]">
          <div class="flex items-start justify-between mb-1">
            <h3 class="text-lg font-bold text-zinc-800 dark:text-zinc-100">社区邀请码</h3>
            <button class="w-8 h-8 rounded-[5%] flex items-center justify-center text-zinc-400 hover:bg-white/60 dark:hover:bg-zinc-800/60" @click="inviteCodeOpen = false">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>
          </div>
          <p class="text-xs text-zinc-400 mb-4">邀请好友加入「{{ name }}」，输入邀请码即可加入</p>
          <div class="bg-white/60 dark:bg-zinc-800/60 border border-dashed border-amber-400/50 rounded-[5%] py-6 px-4 mb-4 text-center">
            <code class="text-2xl font-mono font-bold tracking-[0.3em] text-amber-600 dark:text-amber-300">{{ latestInviteCode }}</code>
            <div class="text-[10px] text-zinc-400 mt-1">有效期 7 天</div>
          </div>
          <div class="flex justify-end gap-2">
            <button class="px-4 h-10 rounded-[5%] text-sm text-zinc-500 dark:text-zinc-400 hover:bg-white/60 dark:hover:bg-zinc-800/60 transition-colors" @click="inviteCodeOpen = false">关闭</button>
            <button class="px-4 h-10 rounded-[5%] text-sm font-medium bg-gradient-to-r from-amber-400 to-orange-500 text-white hover:brightness-110 active:scale-95 transition-all" @click="copyInviteCode">复制邀请码</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
// 社区 Banner：封面（图片/视频/头像兜底）+ 信息行 + 权限操作（管理/邀请/退出）+ 分类 tab
import { computed, ref } from 'vue'
import { generateCircleInvitation } from '@/api/circle'
import { useToastStore } from '@/stores/toast'

interface CircleData {
  circleGuid?: string
  coverUrl?: string
  avatarUrl?: string
  name?: string
  description?: string
  memberCount?: number
  isSample?: boolean
}

interface CircleTab {
  key: string
  label: string
  icon: string
}

const props = defineProps<{
  current: CircleData | null
  circleTab?: string
  myRole?: string
  joinMode?: string
}>()
defineEmits<{
  manage: []
  leave: []
  'switch-tab': [key: string]
}>()

const toast = useToastStore()
const confirmingLeave = ref(false)
const inviteCodeOpen = ref(false)
const latestInviteCode = ref('')

const CIRCLE_TABS: CircleTab[] = [
  { key: 'announce', label: '公告', icon: '<path d="M3 11l18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>' },
  { key: 'home', label: '主页', icon: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>' },
  { key: 'resources', label: '资源', icon: '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>' },
  { key: 'members', label: '成员', icon: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>' }
]

const coverUrl = computed(() => props.current?.coverUrl || '')
const avatarUrl = computed(() => props.current?.avatarUrl || '')
const name = computed(() => props.current?.name || '')
const description = computed(() => props.current?.description || '暂无简介')
const memberCount = computed(() => props.current?.memberCount || 0)
const isSample = computed(() => !!props.current?.isSample)
const coverIsVideo = computed(() => /\.(mp4|webm|ogg|mov|m4v)(\?|#|$)/i.test(coverUrl.value))
const isOwner = computed(() => props.myRole === 'Owner')
const canManageUsers = computed(() => props.myRole === 'Owner' || props.myRole === 'Admin')
const roleText = computed(() => isOwner.value ? '创建者' : props.myRole === 'Admin' ? '管理者' : '成员')

// 普通成员生成邀请码（弹窗展示最新邀请码）
async function genMemberInvite() {
  if (!props.current) return
  try {
    const res = await generateCircleInvitation(props.current.circleGuid, { type: 'code' })
    const data = res && res.data ? res.data : res
    const body = data && data.data ? data.data : data
    latestInviteCode.value = (body && (body.code || body.inviteGuid)) || ''
    if (!latestInviteCode.value) throw new Error('未返回邀请码')
    inviteCodeOpen.value = true
    toast.push('邀请码已生成', 'success')
  } catch (e) {
    toast.push('生成邀请码失败：' + (e.message || '后端未就绪'), 'error')
  }
}
function copyInviteCode() {
  try {
    navigator.clipboard.writeText(latestInviteCode.value)
    toast.push('邀请码已复制', 'success')
  } catch (e) { /* 剪贴板不可用时静默 */ }
}

const fallback = 'data:image/svg+xml;utf8,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" rx="8" fill="#f59e0b"/><path d="M14 50 L40 24 L66 50 Z" fill="#fff"/><path d="M40 50v-16" stroke="#f59e0b" stroke-width="4"/></svg>'
)
function hideImg(e: Event) { (e.target as HTMLElement).style.visibility = 'hidden' }
</script>
