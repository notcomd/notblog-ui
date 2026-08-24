<template>
  <!-- 社区主视窗：创建面板 / 管理面板 / 社区详情（Banner + 四分类 tab） -->
  <div class="flex-1 min-w-0 flex flex-col min-h-0">
    <!-- 创建社区面板（复用主视窗） -->
    <CircleCreatePanel v-if="createMode" class="glass-card flex-1" @close="$emit('close-create')" @created="guid => $emit('created', guid)" />

    <!-- 管理面板 -->
    <CircleManagePanel v-else-if="manageMode" :current="current" :my-role="myRole" @close="manageMode = false" @saved="onManaged" />

    <!-- 社区详情 -->
    <template v-else-if="current">
      <div ref="scrollBox" data-scroll-container class="flex-1 min-h-0 overflow-y-auto">
        <CircleBanner
          :current="current"
          :circle-tab="circleTab"
          :my-role="myRole"
          :join-mode="circleJoinMode"
          @manage="manageMode = true"
          @leave="$emit('leave')"
          @switch-tab="switchCircleTab"
        />

        <!-- 主页：社区动态流 -->
        <div v-if="circleTab === 'home'" class="mt-4">
          <div class="flex items-center gap-2 mb-4">
            <span class="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-400/15 text-amber-600 dark:text-amber-400">当前所在社区：{{ current.name }}</span>
          </div>
          <PostGrid :loader="circleLoader" :key="current.circleGuid + '-' + gridKey" empty-text="社区里还没有内容，快来发布第一条动态吧" />
        </div>

        <!-- 公告 -->
        <CircleAnnounceTab v-else-if="circleTab === 'announce'" :current="current" :can-manage="canManageUsers" />

        <!-- 资源 -->
        <CircleResourceTab v-else-if="circleTab === 'resources'" :current="current" />

        <!-- 成员 -->
        <CircleMemberTab v-else-if="circleTab === 'members'" :current="current" :my-role="myRole" @set-role="onSetRole" @remove-member="onRemoveMember" />
      </div>
    </template>

    <!-- 未选择社区 -->
    <div v-else class="flex-1 min-h-0 flex items-center justify-center text-zinc-400">
      <div class="text-center">
        <div class="mb-3 flex justify-center"><svg class="w-16 h-16 text-zinc-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 21l8.5-17 8.5 17"/><path d="M7 21l5-10 5 10"/><line x1="2" y1="21" x2="22" y2="21"/></svg></div>
        <p>选择一个社区，或创建一个新社区</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 社区主视窗：创建面板 / 管理面板 / 社区详情编排（Banner + 公告·主页·资源·成员 tab）
import { computed, ref } from 'vue'
import PostGrid from '@/components/post/PostGrid.vue'
import CircleCreatePanel from '@/components/circle/CircleCreatePanel.vue'
import CircleBanner from '@/components/circle/CircleBanner.vue'
import CircleManagePanel from '@/components/circle/CircleManagePanel.vue'
import CircleAnnounceTab from '@/components/circle/CircleAnnounceTab.vue'
import CircleResourceTab from '@/components/circle/CircleResourceTab.vue'
import CircleMemberTab from '@/components/circle/CircleMemberTab.vue'
import { getCirclePosts, setCircleMemberRole, leaveCircle } from '@/api/circle'
import { useToastStore } from '@/stores/toast'

interface CircleData {
  [key: string]: any
}

const props = defineProps<{
  current: CircleData | null
  createMode?: boolean
  gridKey?: number
  myRole?: string
}>()
defineEmits<{
  'close-create': []
  created: [guid: string]
  leave: []
}>()

const toast = useToastStore()
const manageMode = ref(false)
const circleTab = ref('home')

const canManageUsers = computed(() => props.myRole === 'Owner' || props.myRole === 'Admin')

// 社区加入方式（localStorage 本地持久化，后端暂无字段）
const circleJoinMode = computed(() => {
  if (!props.current) return 'invite'
  try {
    return localStorage.getItem('notblog-circle-joinmode-' + props.current.circleGuid) || 'invite'
  } catch (e) {
    return 'invite'
  }
})

function switchCircleTab(t: string) {
  circleTab.value = t
}

// 社区动态流加载器（PostGrid 消费）
function circleLoader(params: any): Promise<any> {
  if (!props.current) return Promise.resolve({ data: { items: [], total: 0 } })
  return getCirclePosts(props.current.circleGuid, params).catch(() => ({ data: { items: [], total: 0 } }))
}

// 管理面板保存后回写社区信息
function onManaged(patch: any) {
  manageMode.value = false
  const c = props.current
  if (c && patch) {
    c.name = patch.name || c.name
    c.description = patch.description ?? c.description
    if (patch.avatarUrl) c.avatarUrl = patch.avatarUrl
    if (patch.coverUrl) c.coverUrl = patch.coverUrl
  }
  toast.push('社区信息已更新', 'success')
}

// 成员角色/移除（真实端点；示例社区本地处理）
async function onSetRole(m: any, role: string) {
  if (!props.current) return
  try {
    if (!props.current.isSample) {
      await setCircleMemberRole(props.current.circleGuid, m.userGuid, { role })
    }
    m.role = role
    toast.push(role === 'Admin' ? '已设为管理员' : '已取消管理员', 'success')
  } catch (e) {
    toast.push('操作失败：' + (e.message || '请重试'), 'error')
  }
}

async function onRemoveMember(m: any) {
  if (!props.current) return
  try {
    if (!props.current.isSample) {
      await leaveCircle(props.current.circleGuid, m.userGuid)
    }
    toast.push('已移除成员 ' + (m.nickname || m.userName || ''), 'success')
  } catch (e) {
    toast.push('操作失败：' + (e.message || '请重试'), 'error')
  }
}
</script>
