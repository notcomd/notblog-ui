<template>
  <!-- 社区页容器：左侧社区列表 + 右侧主视窗（数据加载与状态协调） -->
  <div class="max-w-[1400px] mx-auto flex flex-col lg:flex-row gap-5 h-auto lg:h-[calc(100vh-7.5rem)]">
    <CircleSidebar
      :circles="circles"
      :current="current"
      :loading="loading"
      @select="select"
      @create="createMode = true"
      @join="joinOpen = true"
    />
    <CircleWorkspace
      :current="current"
      :create-mode="createMode"
      :grid-key="gridKey"
      :my-role="myRole"
      @close-create="createMode = false"
      @created="onCreated"
      @leave="doLeave"
    />

    <!-- 加入社区弹窗（邀请码/收到的直邀） -->
    <CircleJoinDialog
    v-if="joinOpen"
    :my-invites="myInvites"
    :busy="inviteBusy"
    :joining="joining"
    @close="joinOpen = false"
    @join-submit="doJoin"
      @accept="onAcceptInvite"
      @reject="onRejectInvite"
    />
  </div>
</template>

<script lang="ts">
export default { name: 'CirclePage' }
</script>

<script setup lang="ts">
// 社区页容器：负责社区数据加载、选择、加入/退出、直邀接收
import { computed, onMounted, ref } from 'vue'
import CircleSidebar from '@/components/circle/CircleSidebar.vue'
import CircleWorkspace from '@/components/circle/CircleWorkspace.vue'
import CircleJoinDialog from '@/components/circle/CircleJoinDialog.vue'
import { getMyCircles, getCircle, joinCircle, leaveCircle, getMyCircleInvitations, acceptCircleInvitation, rejectCircleInvitation } from '@/api/circle'
import { useToastStore } from '@/stores/toast'

const toast = useToastStore()

const circles = ref<any[]>([])
const current = ref<any>(null)
const loading = ref(false)
const createMode = ref(false)
const joinOpen = ref(false)
const joining = ref(false)
const gridKey = ref(0)
const myInvites = ref<any[]>([])
const inviteBusy = ref<string>('')

const myRole = computed(() => (current.value ? (current.value.myRole || 'Member') : 'Member'))

async function loadCircles(): Promise<void> {
  loading.value = true
  try {
    const res = await getMyCircles()
    const data: any = res && res.data ? res.data : res
    circles.value = data.items || data.list || data || []
  } catch (e) {
    circles.value = []
  } finally {
    loading.value = false
  }
  if (circles.value.length && !current.value) select(circles.value[0])
}

async function select(c: any): Promise<void> {
  current.value = c
  gridKey.value++
  try {
    const res = await getCircle(c.circleGuid)
    const d: any = res && res.data ? res.data : res
    if (d && d.circleGuid) current.value = { ...c, ...d }
  } catch (e) { /* 使用列表数据兜底 */ }
}

async function onCreated(guid: string): Promise<void> {
  createMode.value = false
  await loadCircles()
  if (guid) {
    const found = circles.value.find(c => String(c.circleGuid) === String(guid))
    if (found) select(found)
  }
}

async function doLeave(): Promise<void> {
  if (!current.value) return
  try {
    await leaveCircle(current.value.circleGuid)
    toast.push('已退出社区', 'success')
    await loadCircles()
  } catch (e) {
    toast.push('退出失败：' + (e.message || '请重试'), 'error')
  }
}

async function doJoin(input: string): Promise<void> {
  const text = (input || '').trim()
  if (!text) return
  joining.value = true
  try {
    const tokenMatch = text.match(/[?&]token=([0-9a-f-]+)/i) || text.match(/\/([0-9a-f-]{36})/i)
    const payload: any = tokenMatch ? { token: tokenMatch[1] } : { code: text }
    await joinCircle(payload)
    toast.push('已加入社区', 'success')
    joinOpen.value = false
    await loadCircles()
  } catch (e) {
    const m = e && e.message && e.message !== 'Error' ? e.message : ''
    const d = e && e.response && typeof e.response.data === 'string' ? e.response.data : ''
    toast.push(m || d || '加入失败，请检查邀请码', 'error')
  } finally {
    joining.value = false
  }
}

// ===== 收到的直邀（真实端点） =====
async function loadMyInvites(): Promise<void> {
  try {
    const res = await getMyCircleInvitations()
    const data: any = res && res.data ? res.data : res
    myInvites.value = (data && (data.items || data.list)) || data || []
  } catch (e) {
    myInvites.value = []
  }
}
async function onAcceptInvite(inv: any): Promise<void> {
  inviteBusy.value = inv.inviteGuid
  try {
    await acceptCircleInvitation(inv.inviteGuid)
    inv.status = 'Accepted'
    toast.push('已接受邀请', 'success')
    await loadCircles()
  } catch (e) {
    toast.push('接受失败：' + (e.message || '请重试'), 'error')
  } finally {
    inviteBusy.value = ''
  }
}
async function onRejectInvite(inv: any): Promise<void> {
  inviteBusy.value = inv.inviteGuid
  try {
    await rejectCircleInvitation(inv.inviteGuid)
    inv.status = 'Revoked'
    toast.push('已拒绝邀请', 'info')
  } catch (e) {
    toast.push('拒绝失败：' + (e.message || '请重试'), 'error')
  } finally {
    inviteBusy.value = ''
  }
}

onMounted(async () => {
  await loadCircles()
  loadMyInvites()
})
</script>