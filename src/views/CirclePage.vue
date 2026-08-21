<template>
  <!-- 社区页容器：左侧社区列表 + 右侧主视窗（数据加载与状态协调） -->
  <div class="max-w-[1400px] mx-auto flex gap-5 h-[calc(100vh-7.5rem)]">
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

    <!-- 加入社区弹窗（邀请码/申请/收到的直邀） -->
    <CircleJoinDialog
    v-if="joinOpen"
    :my-invites="myInvites"
    :busy="inviteBusy"
    :joining="joining"
    @close="joinOpen = false"
    @join-submit="doJoin"
    @apply-join="doApplyJoin"
    @accept="onAcceptInvite"
      @reject="onRejectInvite"
    />
  </div>
</template>

<script>
export default { name: 'CirclePage' }
</script>

<script setup>
// 社区页容器：负责社区数据加载、选择、加入/退出、直邀接收与示例数据兜底
import { computed, onMounted, ref } from 'vue'
import { charAvatar as demoAvatar } from '@/utils/avatar'
import CircleSidebar from '@/components/circle/CircleSidebar.vue'
import CircleWorkspace from '@/components/circle/CircleWorkspace.vue'
import CircleJoinDialog from '@/components/circle/CircleJoinDialog.vue'
import { getMyCircles, getCircle, joinCircle, leaveCircle, getMyCircleInvitations, acceptCircleInvitation, rejectCircleInvitation } from '@/api/circle'
import { useToastStore } from '@/stores/toast'

const toast = useToastStore()

const circles = ref([])
const current = ref(null)
const loading = ref(false)
const createMode = ref(false)
const joinOpen = ref(false)
const joining = ref(false)
const gridKey = ref(0)
const myInvites = ref([])
const inviteBusy = ref('')

const myRole = computed(() => (current.value ? (current.value.myRole || 'Member') : 'Member'))

// ===== 示例社区数据（后端离线/未加入社区时展示；isSample 标记「示例」徽标） =====
const DEMO_CIRCLES = [
  { circleGuid: 'demo-circle-photo', name: '轻芒摄影部落', description: '用镜头记录生活，分享光影之美', avatarUrl: demoAvatar('摄', '#6366f1'), coverUrl: '', memberCount: 128, myRole: 'Owner', unread: 3, isSample: true },
  { circleGuid: 'demo-circle-outdoor', name: '周末户外俱乐部', description: '徒步 · 露营 · 骑行，周末一起出发', avatarUrl: demoAvatar('户', '#10b981'), coverUrl: '', memberCount: 86, myRole: 'Admin', unread: 0, isSample: true },
  { circleGuid: 'demo-circle-coffee', name: '咖啡研究所', description: '手冲、拉花、烘焙，重度咖啡爱好者聚集地', avatarUrl: demoAvatar('咖', '#f59e0b'), coverUrl: '', memberCount: 210, myRole: 'Member', unread: 1, isSample: true },
  { circleGuid: 'demo-circle-frontend', name: '前端开发圈', description: 'Vue / React / 工程化，一起卷技术', avatarUrl: demoAvatar('前', '#ec4899'), coverUrl: '', memberCount: 342, myRole: 'Member', unread: 0, isSample: true }
]

// ===== 示例数据兜底（后端离线/未加入社区时展示；isSample 标记「示例」徽标） =====

async function loadCircles() {
  loading.value = true
  try {
    const res = await getMyCircles()
    const data = res && res.data ? res.data : res
    circles.value = data.items || data.list || data || []
    if (!circles.value.length) circles.value = DEMO_CIRCLES
  } catch (e) {
    circles.value = DEMO_CIRCLES
  } finally {
    loading.value = false
  }
  if (circles.value.length && !current.value) select(circles.value[0])
}

async function select(c) {
  current.value = c
  gridKey.value++
  try {
    const res = await getCircle(c.circleGuid)
    const d = res && res.data ? res.data : res
    if (d && d.circleGuid) current.value = { ...c, ...d }
  } catch (e) { /* 使用列表数据兜底 */ }
}

async function onCreated(guid) {
  createMode.value = false
  await loadCircles()
  if (guid) {
    const found = circles.value.find(c => String(c.circleGuid) === String(guid))
    if (found) select(found)
  }
}

async function doLeave() {
  if (!current.value) return
  if (current.value.isSample) {
    circles.value = circles.value.filter(c => String(c.circleGuid) !== String(current.value.circleGuid))
    current.value = circles.value[0] || null
    toast.push('已退出示例社区（本地）', 'info')
    return
  }
  try {
    await leaveCircle(current.value.circleGuid)
    toast.push('已退出社区', 'success')
    await loadCircles()
  } catch (e) {
    toast.push('退出失败：' + (e.message || '请重试'), 'error')
  }
}

async function doJoin(input) {
  const text = (input || '').trim()
  if (!text) return
  joining.value = true
  try {
    const tokenMatch = text.match(/[?&]token=([0-9a-f-]+)/i) || text.match(/\/([0-9a-f-]{36})/i)
    const payload = tokenMatch ? { token: tokenMatch[1] } : { code: text }
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

// 审核制社区申请加入（示例社区本地入队；真实社区后端暂无审核端点）
function doApplyJoin(input) {
  const name = (input || '').trim()
  if (!name) return
  const target = DEMO_CIRCLES.find(c => c.name === name && c.joinMode === 'review')
  if (!target) {
    toast.push('未找到可申请的审核制社区', 'error')
    return
  }
  try {
    const key = 'notblog-circle-joinreq-' + target.circleGuid
    const list = JSON.parse(localStorage.getItem(key) || '[]')
    if (list.some(r => r.userName === '我')) {
      toast.push('已提交过申请，请等待审核', 'info')
      return
    }
    list.push({ userGuid: 'me', userName: '我', time: Date.now() })
    localStorage.setItem(key, JSON.stringify(list))
    toast.push('已提交加入申请，等待社区审核', 'success')
  } catch (e) {
    toast.push('申请提交失败', 'error')
  }
}

// ===== 收到的直邀（真实端点） =====
async function loadMyInvites() {
  try {
    const res = await getMyCircleInvitations()
    const data = res && res.data ? res.data : res
    myInvites.value = (data && (data.items || data.list)) || data || []
  } catch (e) {
    myInvites.value = []
  }
}
async function onAcceptInvite(inv) {
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
async function onRejectInvite(inv) {
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
