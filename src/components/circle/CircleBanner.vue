<template>
  <!-- 社区头部：通栏出血封面（无边框/圆角/投影）+ 浮于封面之上的身份信息。
       分类 tab 由 CircleWorkspace 负责（它必须是滚动容器的直接子节点才能吸顶）。 -->
  <div>
    <!-- 封面层：图片/视频铺满；无封面时回退渐变 + SVG 山形装饰 -->
    <div class="relative h-64 bg-gradient-to-br from-amber-300 via-orange-300 to-emerald-300 dark:from-amber-600/40 dark:via-orange-600/35 dark:to-emerald-600/35">
      <img v-if="coverUrl && !coverIsVideo" :src="coverUrl" alt="" class="absolute inset-0 w-full h-full object-cover" @error="hideImg" />
      <video v-else-if="coverUrl" :src="coverUrl" autoplay muted loop playsinline class="absolute inset-0 w-full h-full object-cover"></video>
      <svg v-else class="absolute inset-0 w-full h-full" viewBox="0 0 1200 320" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 246 L210 118 L356 208 L556 68 L756 198 L938 108 L1200 246 L1200 320 L0 320 Z" fill="rgba(255,255,255,0.26)" />
        <path d="M0 284 L178 198 L378 262 L600 172 L820 258 L1002 188 L1200 284 L1200 320 L0 320 Z" fill="rgba(255,255,255,0.2)" />
      </svg>

      <!-- 底部渐变压暗：保证白色文字在任意封面上可读 -->
      <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/5"></div>

      <!-- 右上操作区：实心深色浮层（不用毛玻璃，保证任意封面上都清晰） -->
      <div class="absolute top-4 right-4 flex items-center gap-2">
        <button v-if="canManageUsers && !confirmingLeave" class="h-9 px-3 rounded-full text-xs font-medium text-white bg-black/40 border border-white/15 hover:bg-black/55 transition-colors inline-flex items-center gap-1.5" @click="$emit('manage')"><svg aria-hidden="true" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg> 社区管理</button>
        <button v-if="!canManageUsers && !confirmingLeave && joinMode !== 'private'" class="h-9 px-3 rounded-full text-xs font-medium text-white bg-black/40 border border-white/15 hover:bg-black/55 transition-colors inline-flex items-center gap-1.5" @click="genMemberInvite"><svg aria-hidden="true" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg> 邀请</button>
        <button v-if="!canManageUsers && !confirmingLeave" class="h-9 px-3 rounded-full text-xs font-medium text-white/85 hover:text-white hover:bg-black/30 transition-colors" @click="confirmingLeave = true">退出社区</button>
        <div v-else-if="!canManageUsers && confirmingLeave" class="h-9 px-3 rounded-full flex items-center gap-2 bg-black/50 border border-white/20">
          <span class="text-xs text-white/85">确定退出？</span>
          <button class="h-6 px-2.5 rounded-full text-[11px] font-medium bg-red-500 text-white hover:bg-red-600 active:scale-95 transition-all" @click="$emit('leave')">确定</button>
          <button class="h-6 px-2.5 rounded-full text-[11px] font-medium text-white/85 hover:bg-white/15 transition-colors" @click="confirmingLeave = false">取消</button>
        </div>
      </div>

      <!-- 身份信息：头像 + 名称 + 简介 + 成员/角色胶囊 -->
      <div class="absolute inset-x-0 bottom-0 px-6 pb-6 pt-14 flex items-end gap-4">
        <img :src="avatarUrl || fallback" alt="" class="w-20 h-20 rounded-[5%] object-cover ring-2 ring-white/70 bg-white/20 shrink-0" @error="hideImg" />
        <div class="flex-1 min-w-0 pb-1">
          <h1 class="font-display text-2xl font-bold text-white truncate">{{ name }}</h1>
          <p class="text-xs text-white/80 truncate mt-1">{{ description }}</p>
          <div class="mt-2 flex items-center gap-2">
            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] text-white bg-black/35">
              <svg aria-hidden="true" class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>{{ memberCount }} 成员
            </span>
            <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] text-white bg-black/35">{{ roleText }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 邀请码弹窗（普通成员生成邀请码后展示） -->
    <Teleport to="body">
      <div v-if="inviteCodeOpen" class="fixed inset-0 z-[70] flex items-center justify-center bg-black/30" @click.self="inviteCodeOpen = false">
        <div class="qm-surface p-6 w-[400px] max-w-[calc(100vw-2rem)]">
          <div class="flex items-start justify-between mb-1">
            <h3 class="text-lg font-bold text-zinc-800 dark:text-zinc-100">社区邀请码</h3>
            <button aria-label="关闭" class="w-8 h-8 rounded-[5%] flex items-center justify-center text-zinc-400 hover:bg-black/[0.04] dark:hover:bg-white/[0.06]" @click="inviteCodeOpen = false">
              <svg aria-hidden="true" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>
          </div>
          <p class="text-xs text-zinc-400 mb-4">邀请好友加入「{{ name }}」，输入邀请码即可加入</p>
          <div class="rounded-[5%] border border-dashed border-amber-400/50 py-6 px-4 mb-4 text-center">
            <code class="text-2xl font-mono font-bold tracking-[0.3em] text-amber-600 dark:text-amber-300">{{ latestInviteCode }}</code>
            <div class="text-[10px] text-zinc-400 mt-1">有效期 7 天</div>
          </div>
          <div class="flex justify-end gap-2">
            <button class="px-4 h-10 rounded-[5%] text-sm text-zinc-500 dark:text-zinc-400 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors" @click="inviteCodeOpen = false">关闭</button>
            <button class="px-4 h-10 rounded-[5%] text-sm font-medium bg-gradient-to-r from-amber-400 to-orange-500 text-white hover:opacity-90 active:scale-95 transition-all" @click="copyInviteCode">复制邀请码</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
// 社区头部：通栏出血封面（图片/视频/渐变兜底）+ 悬浮身份信息与操作
// 分类 tab 已移交 CircleWorkspace（吸顶需要它是滚动容器的直接子节点）
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
}

const props = defineProps<{
  current: CircleData | null
  myRole?: string
  joinMode?: string
}>()
defineEmits<{
  manage: []
  leave: []
}>()

const toast = useToastStore()
const confirmingLeave = ref(false)
const inviteCodeOpen = ref(false)
const latestInviteCode = ref('')

const coverUrl = computed(() => props.current?.coverUrl || '')
const avatarUrl = computed(() => props.current?.avatarUrl || '')
const name = computed(() => props.current?.name || '')
const description = computed(() => props.current?.description || '暂无简介')
const memberCount = computed(() => props.current?.memberCount || 0)
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
