<template>
  <div class="max-w-[1400px] mx-auto grid grid-cols-2 gap-5">
    <!-- 左：新建公报表单（后端仅支持标题 + 内容） -->
    <div class="glass-card p-5 space-y-4 h-fit">
      <h3 class="text-base font-bold text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
        <span class="text-lg"><svg class="w-5 h-5 inline-block align-[-3px] text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 11l18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg></span> 新建公报
      </h3>
      <!-- 消息标题 -->
      <div>
        <label for="ann-title" class="text-xs text-zinc-400 block mb-1.5">消息标题</label>
        <input id="ann-title" v-model="form.title" maxlength="30" class="w-full h-10 px-3.5 rounded-[5%] bg-transparent ring-1 ring-inset ring-zinc-200/70 dark:ring-zinc-800 text-sm outline-none focus:ring-2 focus:ring-amber-400/50 transition-all" placeholder="请输入标题" />
      </div>
      <!-- 消息内容 -->
      <div>
        <label for="ann-content" class="text-xs text-zinc-400 block mb-1.5">消息内容</label>
        <textarea id="ann-content" v-model="form.content" rows="5" class="w-full resize-none rounded-[5%] bg-transparent ring-1 ring-inset ring-zinc-200/70 dark:ring-zinc-800 px-3.5 py-3 text-sm outline-none focus:ring-2 focus:ring-amber-400/50 transition-all" placeholder="输入消息内容"></textarea>
      </div>
      <p class="text-xs leading-relaxed text-zinc-400">公报发布后对全部已登录用户可见；发送范围与消息类型后端暂不支持，发布后可在右侧撤回。</p>
      <button class="w-full h-11 rounded-[5%] bg-gradient-to-r from-amber-400 to-orange-500 text-white text-sm font-medium hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50" :disabled="!form.title.trim() || !form.content.trim() || sending" @click="send">
        {{ sending ? '发送中...' : '发送公报' }}
      </button>
    </div>

    <!-- 右：历史记录（后端仅返回未撤回的公报） -->
    <div class="glass-card p-5">
      <h3 class="text-base font-bold text-zinc-800 dark:text-zinc-100 mb-4">发送历史</h3>
      <div class="space-y-2.5">
        <div v-for="a in announcements" :key="a.announcementGuid" class="px-4 py-3 rounded-[5%] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors">
          <div class="flex items-center gap-2">
            <span class="text-sm font-medium text-zinc-700 dark:text-zinc-200 flex-1 truncate">{{ a.title }}</span>
            <button class="shrink-0 text-xs text-red-500 hover:underline" @click="recall(a)">撤回</button>
          </div>
          <p class="text-xs text-zinc-500 dark:text-zinc-300 mt-1.5 whitespace-pre-wrap break-words">{{ a.content }}</p>
          <div class="text-xs text-zinc-400 mt-1.5 flex items-center gap-3">
            <span>发布者 {{ shortGuid(a.creatorUserId) }}</span>
            <span>{{ relativeTime(a.createdAt) }}</span>
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

const form = ref({ title: '', content: '' })
const sending = ref(false)
const announcements = ref<any[]>([])

/** 发布者为用户 GUID：按前 8 位展示 */
function shortGuid(v: string): string {
  return String(v || '').split('-')[0] || '未知'
}

async function send(): Promise<void> {
  sending.value = true
  try {
    await sendAnnouncement({ title: form.value.title.trim(), content: form.value.content.trim() })
    toast.push('公报已发布', 'success')
    form.value = { title: '', content: '' }
    load()
  } catch (e: any) {
    toast.push(e?.message || '发送失败', 'error')
  } finally {
    sending.value = false
  }
}

async function recall(a: any): Promise<void> {
  try {
    await recallAnnouncement(a.announcementGuid)
    toast.push('公报已撤回', 'success')
    load()
  } catch (e: any) {
    toast.push(e?.message || '撤回失败', 'error')
  }
}

async function load(): Promise<void> {
  try {
    const data: any = await getAnnouncements()
    announcements.value = data.items || data.list || []
  } catch (e) {
    announcements.value = []
  }
}

onMounted(load)
</script>
