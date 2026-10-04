<template>
  <!-- 社区主视窗：创建面板 / 管理面板 / 社区详情（通栏封面 + 吸顶 tab + 无框内容区） -->
  <div class="flex-1 min-w-0 flex flex-col min-h-0">
    <!-- 创建社区面板（复用主视窗） -->
    <CircleCreatePanel v-if="createMode" class="flex-1 min-h-0" @close="$emit('close-create')" @created="guid => $emit('created', guid)" />

    <!-- 管理面板 -->
    <CircleManagePanel v-else-if="manageMode" class="flex-1 min-h-0" :current="current" :my-role="myRole" @close="manageMode = false" @saved="onManaged" />

    <!-- 社区详情 -->
    <template v-else-if="current">
      <div ref="scrollBox" data-scroll-container class="flex-1 min-h-0 overflow-y-auto overscroll-contain">
        <CircleBanner
          :current="current"
          :my-role="myRole"
          :join-mode="circleJoinMode"
          @manage="manageMode = true"
          @leave="$emit('leave')"
        />

        <!-- 分类 tab：吸顶 + 琥珀下划线（与顶栏「热门/最新」同构）。
             必须是滚动容器的直接子节点，吸顶才能覆盖下方全部内容；
             底色用高不透明度实色（不做毛玻璃），滚动时内容不会透上来。 -->
        <nav
          class="sticky top-0 z-20 border-b border-zinc-200/70 bg-white/95 dark:border-zinc-800 dark:bg-zinc-900/95"
          aria-label="社区导航"
        >
          <div class="flex items-center gap-1 px-4">
            <button
              v-for="t in CIRCLE_TABS"
              :key="t.key"
              type="button"
              class="relative inline-flex h-12 items-center gap-1.5 px-3.5 text-sm transition-colors"
              :class="circleTab === t.key
                ? 'text-amber-600 dark:text-amber-400 font-medium'
                : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100'"
              :aria-current="circleTab === t.key ? 'true' : undefined"
              @click="switchCircleTab(t.key)"
            >
              <svg aria-hidden="true" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" v-html="t.icon"></svg>{{ t.label }}
              <span v-if="circleTab === t.key" class="absolute inset-x-3.5 bottom-0 h-0.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500"></span>
            </button>
          </div>
        </nav>

        <!-- 主页：社区动态流（tab 已标明位置，不再重复标题） -->
        <div v-if="circleTab === 'home'" class="px-6 py-5">
          <PostGrid :loader="circleLoader" :key="current.circleGuid + '-' + gridKey" empty-text="社区里还没有内容，快来发布第一条动态吧" />
        </div>

        <!-- 公告 -->
        <div v-else-if="circleTab === 'announce'" class="px-6 py-5">
          <CircleAnnounceTab :current="current" :can-manage="canManageUsers" />
        </div>

        <!-- 资源 -->
        <div v-else-if="circleTab === 'resources'" class="px-6 py-5">
          <CircleResourceTab :current="current" />
        </div>

        <!-- 成员 -->
        <div v-else-if="circleTab === 'members'" class="px-6 py-5">
          <CircleMemberTab :current="current" :my-role="myRole" @set-role="onSetRole" @remove-member="onRemoveMember" />
        </div>

        <!-- 聊天：内嵌会话需要确定高度（滚动容器不是 flex，flex-1 在此不生效） -->
        <div v-else-if="circleTab === 'chat'" class="flex h-[calc(100vh-29rem)] min-h-[380px] flex-col px-6 py-5">
          <CircleChatTab :current="current" />
        </div>
      </div>
    </template>

    <!-- 未选择社区 -->
    <div v-else class="flex-1 min-h-0 flex items-center justify-center text-zinc-400">
      <div class="text-center">
        <div class="mb-3 flex justify-center"><svg aria-hidden="true" class="w-16 h-16 text-zinc-300 dark:text-zinc-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 21l8.5-17 8.5 17"/><path d="M7 21l5-10 5 10"/><line x1="2" y1="21" x2="22" y2="21"/></svg></div>
        <p>选择一个社区，或创建一个新社区</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 社区主视窗：创建面板 / 管理面板 / 社区详情编排（通栏 Banner + 吸顶 tab + 无框内容面板）
import { computed, ref } from 'vue'
import PostGrid from '@/components/post/PostGrid.vue'
import CircleCreatePanel from '@/components/circle/CircleCreatePanel.vue'
import CircleBanner from '@/components/circle/CircleBanner.vue'
import CircleManagePanel from '@/components/circle/CircleManagePanel.vue'
import CircleAnnounceTab from '@/components/circle/CircleAnnounceTab.vue'
import CircleResourceTab from '@/components/circle/CircleResourceTab.vue'
import CircleMemberTab from '@/components/circle/CircleMemberTab.vue'
import CircleChatTab from '@/components/circle/CircleChatTab.vue'
import { getCirclePosts, setCircleMemberRole, leaveCircle } from '@/api/circle'
import { useToastStore } from '@/stores/toast'

interface CircleData {
  [key: string]: any
}

interface CircleTab {
  key: string
  label: string
  icon: string
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

// 分类导航（社区内视图切换）：图标取自内联 SVG path，与 Community 其他图标同源
const CIRCLE_TABS: CircleTab[] = [
  { key: 'announce', label: '公告', icon: '<path d="M3 11l18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>' },
  { key: 'home', label: '主页', icon: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>' },
  { key: 'resources', label: '资源', icon: '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>' },
  { key: 'members', label: '成员', icon: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>' },
  { key: 'chat', label: '聊天', icon: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>' }
]

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

// 成员角色/移除（真实端点）
async function onSetRole(m: any, role: string) {
  if (!props.current) return
  try {
    await setCircleMemberRole(props.current.circleGuid, m.userGuid, role)
    m.role = role
    toast.push(role === 'Admin' ? '已设为管理员' : '已取消管理员', 'success')
  } catch (e) {
    toast.push('操作失败：' + (e.message || '请重试'), 'error')
  }
}

async function onRemoveMember(m: any) {
  if (!props.current) return
  try {
    await leaveCircle(props.current.circleGuid, m.userGuid)
    toast.push('已移除成员 ' + (m.nickname || m.userName || ''), 'success')
  } catch (e) {
    toast.push('操作失败：' + (e.message || '请重试'), 'error')
  }
}
</script>
