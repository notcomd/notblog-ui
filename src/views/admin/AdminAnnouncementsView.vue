<template>
  <div class="max-w-[1400px] mx-auto grid lg:grid-cols-2 gap-5">
    <!-- 左：新建公报表单 -->
    <div class="glass-card p-5 space-y-4 h-fit">
      <h3 class="text-base font-bold text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
        <span class="text-lg"><svg class="w-5 h-5 inline-block align-[-3px] text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg></span> 新建公报 <span class="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-400/20 text-amber-600 font-normal">功能暂不可用</span>
      </h3>
      <!-- 发送范围 -->
      <div>
        <label class="text-xs text-zinc-400 block mb-1.5">发送范围</label>
        <div class="grid grid-cols-3 gap-2">
          <button v-for="s in scopes" :key="s.value" class="py-2.5 rounded-[5%] text-sm font-medium transition-all"
            :class="scope === s.value ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow' : 'bg-white/60 dark:bg-zinc-800/60 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 dark:text-zinc-200'"
            @click="scope = s.value">{{ s.label }}</button>
        </div>
      </div>
      <!-- 消息标题 -->
      <div>
        <label class="text-xs text-zinc-400 block mb-1.5">消息标题（最多 30 字）</label>
        <input v-model="form.title" maxlength="30" class="w-full h-10 px-3.5 rounded-[5%] bg-white/70 dark:bg-zinc-800/70 border border-white/60 dark:border-white/10 text-sm outline-none focus:ring-2 focus:ring-amber-400/50 transition-all" placeholder="请输入标题" />
      </div>
      <!-- 消息内容 -->
      <div>
        <label class="text-xs text-zinc-400 block mb-1.5">消息内容</label>
        <textarea v-model="form.content" rows="5" class="w-full resize-none rounded-[5%] bg-white/70 dark:bg-zinc-800/70 border border-white/60 dark:border-white/10 px-3.5 py-3 text-sm outline-none focus:ring-2 focus:ring-amber-400/50 transition-all" placeholder="输入消息内容，支持链接和图片（富文本开发中）"></textarea>
      </div>
      <!-- 消息类型 -->
      <div>
        <label class="text-xs text-zinc-400 block mb-1.5">消息类型</label>
        <div class="flex flex-wrap gap-2">
          <button v-for="t in msgTypes" :key="t.value" class="px-3.5 py-2 rounded-[5%] text-sm transition-all"
            :class="form.type === t.value ? t.active : 'bg-white/60 dark:bg-zinc-800/60 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 dark:text-zinc-200'"
            @click="form.type = t.value">{{ t.label }}</button>
        </div>
      </div>
      <button class="w-full h-11 rounded-[5%] bg-gradient-to-r from-amber-400 to-orange-500 text-white text-sm font-medium hover: active:scale-[0.98] transition-all disabled:opacity-50" :disabled="!form.title.trim() || !form.content.trim() || sending" @click="send">
        {{ sending ? '发送中...' : '发送公报' }}
      </button>
    </div>

    <!-- 右：历史记录 -->
    <div class="glass-card p-5">
      <h3 class="text-base font-bold text-zinc-800 dark:text-zinc-100 mb-4">发送历史</h3>
      <div class="space-y-2.5">
        <div v-for="a in announcements" :key="a.id" class="px-4 py-3 rounded-[5%] bg-white/50 dark:bg-zinc-800/50 hover:bg-white/70 dark:hover:bg-zinc-800/70 transition-colors">
          <div class="flex items-center gap-2">
            <span class="text-xs px-2 py-0.5 rounded-full font-medium" :class="typeClass(a.type)">{{ a.type }}</span>
            <span class="text-sm font-medium text-zinc-700 dark:text-zinc-200 flex-1 truncate">{{ a.title }}</span>
            <span v-if="a.recalled" class="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-400/15 text-zinc-500 dark:text-zinc-400">已撤回</span>
          </div>
          <div class="text-xs text-zinc-400 mt-1.5 flex items-center gap-3">
            <span>{{ a.scopeLabel }}</span>
            <span>{{ a.sender }}</span>
            <span>{{ relativeTime(a.sentTime) }}</span>
            <span class="text-emerald-500 inline-flex items-center gap-1"><svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>已送达 {{ a.delivered }} 人</span>
            <button v-if="!a.recalled && Date.now() - a.sentTime < 5 * 60000" class="ml-auto text-xs text-red-500 hover:underline" @click="recall(a)">撤回</button>
          </div>
        </div>
        <div v-if="announcements.length === 0" class="py-10 text-center text-sm text-zinc-400">暂无发送记录</div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
export default { name: 'AdminAnnouncementsView' }
</script>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { getAnnouncements, sendAnnouncement, recallAnnouncement } from '@/api/admin'
import { useToastStore } from '@/stores/toast'
import { relativeTime } from '@/utils/format'

const toast = useToastStore()

const scopes = [
  { value: 'all', label: '全体用户' },
  { value: 'user', label: '指定用户' },
  { value: 'circle', label: '指定社区' }
]
const msgTypes = [
  { value: '公告', label: '公告', active: 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow' },
  { value: '警告', label: '警告', active: 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow' },
  { value: '活动推广', label: '活动推广', active: 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow' }
]

const scope = ref('all')
const form = ref({ title: '', content: '', type: '公告' })
const sending = ref(false)
const announcements = ref<any[]>([])

function typeClass(t: string): string {
  return {
    '公告': 'bg-blue-400/15 text-amber-600',
    '警告': 'bg-amber-400/15 text-amber-600 dark:text-amber-400',
    '活动推广': 'bg-emerald-400/15 text-emerald-500'
  }[t] || 'bg-zinc-400/15 text-zinc-500 dark:text-zinc-400'
}

async function send(): Promise<void> {
  sending.value = true
  try {
    await sendAnnouncement({
      scope: scope.value,
      title: form.value.title.trim(),
      content: form.value.content.trim(),
      type: form.value.type
    })
    toast.push('公报已发送，在线用户将即时收到', 'success')
    form.value = { title: '', content: '', type: '公告' }
    load()
  } catch (e) {
    toast.push('发送失败', 'error')
  } finally {
    sending.value = false
  }
}

async function recall(a: any): Promise<void> {
  try {
    await recallAnnouncement(a.id)
    a.recalled = true
    toast.push('消息已撤回，用户端将显示"该消息已被撤回"', 'success')
  } catch (e) {
    toast.push('撤回失败', 'error')
  }
}

async function load(): Promise<void> {
  try {
    const res = await getAnnouncements()
    const data: any = res && res.data ? res.data : res
    announcements.value = data.items || data.list || data || []
  } catch (e) {
    announcements.value = []
  }
}

onMounted(load)
</script>
