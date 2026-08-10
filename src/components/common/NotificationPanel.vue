<template>
  <div class="absolute right-0 top-full mt-2 w-80 z-50 rounded-[5%] bg-white dark:bg-zinc-800/95 border border-zinc-200/70 dark:border-zinc-700/60 flex flex-col overflow-hidden" @click.stop>
    <!-- 头部 -->
    <div class="flex items-center justify-between px-4 h-11 border-b border-zinc-200/70 dark:border-zinc-700/60">
      <span class="text-sm font-medium text-zinc-800 dark:text-zinc-100">通知</span>
      <button v-if="hasUnread" class="text-xs text-amber-600 dark:text-amber-400 hover:text-amber-700 transition-colors" @click="onReadAll">
        全部已读
      </button>
    </div>

    <!-- 列表区 -->
    <div class="max-h-[70vh] overflow-y-auto">
      <!-- 加载中 -->
      <div v-if="loading" class="py-10 flex justify-center">
        <div class="w-5 h-5 border-2 border-zinc-200 dark:border-zinc-700 border-t-amber-400 rounded-full animate-spin"></div>
      </div>

      <!-- 空态 -->
      <div v-else-if="!list.length" class="py-10 flex flex-col items-center gap-2 text-zinc-400 dark:text-zinc-300">
        <svg class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.7 21a2 2 0 0 1-3.4 0" />
        </svg>
        <p class="text-xs">暂无通知</p>
      </div>

      <!-- 通知列表 -->
      <div v-else>
        <div
          v-for="(n, i) in list"
          :key="n.notifyGuid"
          class="flex gap-3 px-4 py-3 cursor-pointer transition-colors"
          :class="n.isRead ? 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50' : 'bg-amber-50/50 dark:bg-amber-400/5 hover:bg-amber-50 dark:hover:bg-amber-400/10'"
          :ref="el => setItemRef(el, i)"
          @click="onItemClick(n, i)"
        >
          <!-- 头像位：通知类型图标（后端无通知者头像字段，系统/互动/圈子按类型区分） -->
          <div class="w-10 h-10 rounded-full flex items-center justify-center shrink-0" :class="meta(n).bg">
            <svg class="w-5 h-5" :class="meta(n).fg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" v-html="meta(n).icon"></svg>
          </div>

          <!-- 内容 -->
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-1.5">
              <span class="text-sm font-medium text-zinc-800 dark:text-zinc-100 truncate">{{ meta(n).name }}</span>
              <span v-if="n.isSample" class="shrink-0 text-[10px] leading-none px-1 py-0.5 rounded-[5%] bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-300">示例</span>
              <span v-if="!n.isRead" class="shrink-0 w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            </div>
            <!-- 正文（超两行折叠，可展开/收起） -->
            <p class="notify-body text-xs text-zinc-500 dark:text-zinc-300 mt-0.5 leading-relaxed break-words" :class="expanded[i] ? '' : 'text-2lines'">
              <span class="font-medium text-zinc-700 dark:text-zinc-100">{{ n.title }}：</span>{{ n.content }}
            </p>
            <button v-if="expanded[i] || truncatable[i]" class="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5 hover:text-amber-700 transition-colors" @click.stop="toggleExpand(i)">
              {{ expanded[i] ? '收起' : '展开' }}
            </button>
            <div class="text-[11px] text-zinc-400 dark:text-zinc-400 mt-0.5">{{ relativeTime(n.createTime) }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { getNotifications, markAllNotificationsRead, markNotificationRead } from '@/api/notification'
import { notificationMeta, SAMPLE_NOTIFICATIONS } from '@/utils/notifications'
import { relativeTime } from '@/utils/format'

const emit = defineEmits(['read-all', 'unread-changed'])

const list = ref([])
const loading = ref(false)
const sampleMode = ref(false) // 后端离线/空列表 → 示例数据展示
const expanded = ref([])
const truncatable = ref([])
const itemEls = []

const hasUnread = computed(() => list.value.some(n => !n.isRead))

function meta(n) {
  return notificationMeta(n.type)
}

function setItemRef(el, i) {
  if (el) itemEls[i] = el
}

// 测量正文是否超两行（决定是否显示「展开」）
async function measure() {
  await nextTick()
  list.value.forEach((n, i) => {
    if (expanded.value[i]) return // 已展开项保留「收起」按钮，不再测量
    const body = itemEls[i] && itemEls[i].querySelector('.notify-body')
    truncatable.value[i] = !!(body && body.scrollHeight > body.clientHeight + 2)
  })
}

function toggleExpand(i) {
  const next = !expanded.value[i]
  expanded.value[i] = next
  setTimeout(measure, 50) // 展开/收起后重新测量（expanded 项在 measure 中跳过）
}

async function load() {
  loading.value = true
  try {
    const res = await getNotifications({ pageSize: 20 })
    const items = (res && res.data && (res.data.items || res.data.list)) || []
    if (items.length) {
      list.value = items
      sampleMode.value = false
    } else {
      list.value = SAMPLE_NOTIFICATIONS
      sampleMode.value = true
    }
  } catch (e) {
    // 后端离线/未鉴权 → 示例数据兜底（仅用于展示）
    list.value = SAMPLE_NOTIFICATIONS
    sampleMode.value = true
  } finally {
    loading.value = false
    measure()
  }
}

async function onReadAll() {
  if (sampleMode.value) {
    list.value.forEach(n => { n.isRead = true })
    emit('read-all')
    return
  }
  try {
    await markAllNotificationsRead()
    list.value.forEach(n => { n.isRead = true })
    emit('read-all')
  } catch (e) {
    // 失败保持原状
  }
}

async function onItemClick(n, i) {
  if (!n.isRead) {
    n.isRead = true
    emit('unread-changed', -1)
    if (!n.isSample) {
      try { await markNotificationRead(n.notifyGuid) } catch (e) { /* 失败忽略 */ }
    }
  }
  if (!expanded.value[i]) toggleExpand(i)
}

watch(() => list.value, () => {
  expanded.value = []
  truncatable.value = []
  measure()
})

load()
</script>
