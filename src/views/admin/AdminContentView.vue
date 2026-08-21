<template>
  <div class="max-w-[1400px] mx-auto space-y-5">
    <div>
      <h1 class="text-2xl font-bold text-zinc-800 dark:text-zinc-100">内容管理</h1>
      <p class="text-sm text-zinc-400 mt-1">图文 / 视频 / 博客审核（后端 AuditApi：待审核队列 + 通过/驳回）</p>
    </div>

    <!-- Tab：图文 | 视频 | 博客 -->
    <div class="flex gap-1 glass p-1 rounded-[5%] w-fit">
      <button v-for="t in tabs" :key="t.key" class="px-5 py-2 rounded-[5%] text-sm font-medium transition-all" :class="tab === t.key ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 dark:text-zinc-200'" @click="switchTab(t.key)">{{ t.label }}</button>
    </div>

    <!-- 筛选栏 -->
    <div class="flex flex-wrap items-center gap-3">
      <select v-model="status" class="h-10 px-3 rounded-[5%] bg-white/60 dark:bg-zinc-800/60 border border-white/50 dark:border-white/10 text-sm outline-none">
        <option value="Pending">待审核</option>
        <option value="All">全部</option>
        <option value="Approved">已通过</option>
        <option value="Rejected">已驳回</option>
      </select>
      <select v-model="sortBy" class="h-10 px-3 rounded-[5%] bg-white/60 dark:bg-zinc-800/60 border border-white/50 dark:border-white/10 text-sm outline-none">
        <option value="latest">最新发布</option>
        <option value="reports">最多举报</option>
      </select>
      <input v-model="keyword" class="h-10 w-64 px-4 rounded-[5%] bg-white/60 dark:bg-zinc-800/60 border border-white/50 dark:border-white/10 text-sm outline-none focus:ring-2 focus:ring-amber-400/50 transition-all" placeholder="按内容标题 / 作者昵称检索" @keyup.enter="load(1)" />
      <button class="h-10 px-4 rounded-[5%] text-sm bg-white/60 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-300 hover: transition-all" @click="load(1)">筛选</button>
      <span class="text-xs text-zinc-400 ml-auto">高举报内容自动置顶（红色警示边框）</span>
    </div>

    <!-- 内容列表 -->
    <div class="space-y-3">
      <div v-for="t in items" :key="t.tweetGuid" class="glass-card p-4 flex items-center gap-4 transition-all hover:"
        :class="(t.reportCount || 0) > 0 ? 'ring-2 ring-red-400/40' : ''">
        <!-- 封面缩略图 -->
        <div class="w-20 h-24 rounded-[5%] overflow-hidden shrink-0 bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
          <img v-if="t.mediaUrls && t.mediaUrls[0]" :src="t.mediaUrls[0]" alt="" class="w-full h-full object-cover" @error="hideImg" />
          <span v-if="t.isVideo" class="text-2xl"><svg class="w-6 h-6 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/></svg></span><span v-else class="text-2xl"><svg class="w-6 h-6 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg></span>
        </div>
        <!-- 信息 -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <span class="text-sm font-medium text-zinc-700 dark:text-zinc-200 truncate">{{ t.content }}</span>
            <span v-if="(t.reportCount || 0) > 0" class="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-500 shrink-0"><svg class="w-3 h-3 inline-block align-[-1px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg> {{ t.reportCount }} 举报</span>
          </div>
          <div class="text-xs text-zinc-400 mt-1 flex items-center gap-3">
            <span>作者：{{ t.authorName }}</span>
            <span>{{ relativeTime(t.createTime) }}</span>
            <span>浏览 {{ t.viewCount }} · 赞 {{ t.likeCount }} · 评 {{ t.commentCount }}</span>
          </div>
        </div>
        <!-- 状态 -->
        <span class="text-xs px-2.5 py-1 rounded-full font-medium shrink-0" :class="statusClass(t.tweetStatus)">{{ statusText(t.tweetStatus) }}</span>
        <!-- 操作 -->
        <div class="flex gap-1.5 shrink-0">
          <button class="px-3 h-9 rounded-[5%] text-xs font-medium bg-gradient-to-r from-amber-400 to-orange-500 text-white hover: active:scale-95 transition-all" @click="openAudit(t)">审核</button>
          <button class="px-3 h-9 rounded-[5%] text-xs bg-white/60 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-300 hover: active:scale-95 transition-all" @click="openBlock(t)">屏蔽</button>
          <button class="px-3 h-9 rounded-[5%] text-xs bg-red-500/10 text-red-500 hover:bg-red-500/20 active:scale-95 transition-all" @click="openDelete(t)">删除</button>
        </div>
      </div>
      <div v-if="loading" class="py-10 text-center text-sm text-zinc-400">加载中...</div>
      <div v-else-if="items.length === 0" class="py-16 text-center text-zinc-400">
        <div class="text-5xl mb-3"><svg class="w-12 h-12 text-zinc-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg></div>暂无符合条件的内容
      </div>
      <div class="flex items-center justify-center gap-2 pt-2">
        <button class="px-4 h-9 rounded-[5%] text-sm bg-white/60 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-300 disabled:opacity-30 transition-all" :disabled="page <= 1" @click="load(page - 1)">上一页</button>
        <span class="text-xs text-zinc-400">{{ page }} / {{ totalPages }}（共 {{ total }} 条）</span>
        <button class="px-4 h-9 rounded-[5%] text-sm bg-white/60 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-300 disabled:opacity-30 transition-all" :disabled="page >= totalPages" @click="load(page + 1)">下一页</button>
      </div>
    </div>

    <!-- 审核弹窗 -->
    <AdminModal v-if="auditTarget" :title="'内容审核：' + auditTarget.content.slice(0, 30)" width="w-[720px]" @close="auditTarget = null">
      <div class="space-y-4">
        <div class="flex gap-4">
          <img v-if="auditTarget.mediaUrls && auditTarget.mediaUrls[0]" :src="auditTarget.mediaUrls[0]" alt="" class="w-44 h-56 rounded-[5%] object-cover" @error="hideImg" />
          <div class="flex-1 space-y-2">
            <div class="text-base font-semibold text-zinc-800 dark:text-zinc-100">{{ auditTarget.content }}</div>
            <div class="text-xs text-zinc-400">作者：{{ auditTarget.authorName }} · 发布时间：{{ relativeTime(auditTarget.createTime) }}</div>
            <div class="flex gap-2 pt-1">
              <span class="text-xs px-2 py-1 rounded-full bg-zinc-400/15 text-zinc-500 dark:text-zinc-400"><svg class="w-3 h-3 inline-block align-[-1px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> {{ auditTarget.viewCount }}</span>
              <span class="text-xs px-2 py-1 rounded-full bg-red-400/15 text-red-500"><svg class="w-3 h-3 inline-block align-[-1px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> {{ auditTarget.likeCount }}</span>
              <span class="text-xs px-2 py-1 rounded-full bg-blue-400/15 text-amber-600"><svg class="w-3 h-3 inline-block align-[-1px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> {{ auditTarget.commentCount }}</span>
              <span v-if="(auditTarget.reportCount || 0) > 0" class="text-xs px-2 py-1 rounded-full bg-red-500/15 text-red-500"><svg class="w-3 h-3 inline-block align-[-1px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg> {{ auditTarget.reportCount }} 次举报</span>
            </div>
            <!-- 驳回理由 -->
            <input v-model="rejectReason" class="w-full h-10 px-3.5 rounded-[5%] bg-white/70 dark:bg-zinc-800/70 border border-white/60 dark:border-white/10 text-sm outline-none focus:ring-2 focus:ring-amber-400/50 transition-all" placeholder="驳回理由（选填，将反馈给发布者）" />
          </div>
        </div>
      </div>
      <template #footer>
        <button class="px-4 h-10 rounded-[5%] text-sm text-zinc-500 hover:bg-white/60 dark:hover:bg-zinc-800/60 transition-all dark:text-zinc-400" @click="auditTarget = null">取消</button>
        <button class="px-4 h-10 rounded-[5%] text-sm font-medium bg-gradient-to-r from-amber-400 to-orange-500 text-white active:scale-95 transition-all" @click="doReject">驳回</button>
        <button class="px-4 h-10 rounded-[5%] text-sm font-medium bg-gradient-to-r from-emerald-500 to-teal-500 text-white active:scale-95 transition-all" @click="doApprove"><svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> 通过</button>
      </template>
    </AdminModal>

    <!-- 屏蔽确认 -->
    <AdminModal v-if="blockTarget" title="屏蔽内容" @close="blockTarget = null">
      <p class="text-sm text-zinc-500 dark:text-zinc-400 mb-3">屏蔽后该内容全站不可见（不删除），确定屏蔽「{{ blockTarget.content.slice(0, 30) }}」？</p>
      <input v-model="blockReason" placeholder="屏蔽原因（必填）" class="w-full h-10 px-3.5 rounded-[5%] bg-white/70 dark:bg-zinc-800/70 border border-white/60 dark:border-white/10 text-sm outline-none focus:ring-2 focus:ring-amber-400/50 transition-all" />
      <template #footer>
        <button class="px-4 h-10 rounded-[5%] text-sm text-zinc-500 hover:bg-white/60 dark:hover:bg-zinc-800/60 transition-all dark:text-zinc-400" @click="blockTarget = null">取消</button>
        <button class="px-4 h-10 rounded-[5%] text-sm font-medium bg-gradient-to-r from-amber-400 to-orange-500 text-white active:scale-95 transition-all disabled:opacity-50" :disabled="!blockReason.trim()" @click="doBlock">确认屏蔽</button>
      </template>
    </AdminModal>

    <!-- 删除确认 -->
    <ConfirmDialog
      v-if="deleteTarget"
      danger
      title="永久删除内容"
      :message="'确定永久删除「' + deleteTarget.content.slice(0, 30) + '」吗？所有收藏/点赞数据将清除，不可恢复！'"
      confirm-text="永久删除"
      require-reason
      reason-placeholder="删除原因（必填）"
      @close="deleteTarget = null"
      @confirm="(reason) => doDelete(reason)"
    />
  </div>
</template>

<script>
export default { name: 'AdminContentView' }
</script>

<script setup>
import { computed, onMounted, ref } from 'vue'
import AdminModal from '@/components/admin/AdminModal.vue'
import ConfirmDialog from '@/components/admin/ConfirmDialog.vue'
import { getPendingTweets, approveTweet, rejectTweet, blockTweet, deleteTweet } from '@/api/admin'
import { getMarkdownDocs, approveMarkdown, rejectMarkdown } from '@/api/markdown'

import { useToastStore } from '@/stores/toast'
import { relativeTime } from '@/utils/format'

const toast = useToastStore()

const tabs = [
  { key: 'image', label: '图文' },
  { key: 'video', label: '视频' },
  { key: 'blog', label: '博客' }
]
const tab = ref('image')
const status = ref('Pending')
const sortBy = ref('latest')
const keyword = ref('')

const items = ref([])
const loading = ref(false)
const page = ref(1)
const pageSize = 10
const total = ref(0)

const auditTarget = ref(null)
const rejectReason = ref('')
const blockTarget = ref(null)
const blockReason = ref('')
const deleteTarget = ref(null)

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize)))

function statusClass(s) {
  return {
    Pending: 'bg-amber-400/15 text-amber-600 dark:text-amber-400',
    Approved: 'bg-emerald-400/15 text-emerald-500',
    Rejected: 'bg-red-400/15 text-red-500'
  }[s] || 'bg-zinc-400/15 text-zinc-500 dark:text-zinc-400'
}

function statusText(s) {
  return { Pending: '待审核', Approved: '已通过', Rejected: '已驳回' }[s] || s
}

function switchTab(t) {
  tab.value = t
  load(1)
}

async function load(p) {
  loading.value = true
  page.value = p || 1
  try {
    // 博客 Tab：Markdown 服务审核（真实端点 /api/markdown/list + approve/reject）
    const res = tab.value === 'blog'
      ? getMarkdownDocs({ page: page.value, pageSize, keyword: keyword.value })
      : getPendingTweets({ page: page.value, pageSize, status: status.value, sortBy: sortBy.value, keyword: keyword.value, type: tab.value })
    const data = res && res.data ? res.data : res
    // 客户端排序（最多举报）
    let list = data.items || data.list || []
    if (sortBy.value === 'reports') list = [...list].sort((a, b) => (b.reportCount || 0) - (a.reportCount || 0))
    items.value = list
    total.value = data.totalCount !== undefined ? data.totalCount : (data.total || items.value.length)
  } catch (e) {
    console.error('加载内容失败:', e)
  } finally {
    loading.value = false
  }
}

function openAudit(t) {
  auditTarget.value = t
  rejectReason.value = ''
}

async function doApprove() {
  try {
    if (tab.value === 'blog') {
      await approveMarkdown(auditTarget.value.tweetGuid)
    } else {
      await approveTweet(auditTarget.value.tweetGuid)
    }
    toast.push('已通过审核', 'success')
    auditTarget.value = null
    load(page.value)
  } catch (e) {
    toast.push('操作失败', 'error')
  }
}

async function doReject() {
  try {
    if (tab.value === 'blog') {
      await rejectMarkdown(auditTarget.value.tweetGuid, rejectReason.value)
    } else {
      await rejectTweet(auditTarget.value.tweetGuid, rejectReason.value)
    }
    toast.push('已驳回（理由已反馈发布者）', 'success')
    auditTarget.value = null
    load(page.value)
  } catch (e) {
    toast.push('操作失败', 'error')
  }
}

function openBlock(t) {
  blockTarget.value = t
  blockReason.value = ''
}

async function doBlock() {
  try {
    await blockTweet(blockTarget.value.tweetGuid, blockReason.value)
    toast.push('内容已屏蔽（全站不可见）', 'success')
    blockTarget.value = null
    load(page.value)
  } catch (e) {
    toast.push('操作失败', 'error')
  }
}

function openDelete(t) {
  deleteTarget.value = t
}

async function doDelete(reason) {
  try {
    await deleteTweet(deleteTarget.value.tweetGuid)
    toast.push('内容已永久删除', 'success')
    deleteTarget.value = null
    load(page.value)
  } catch (e) {
    toast.push('操作失败', 'error')
  }
}

function hideImg(e) {
  e.target.style.visibility = 'hidden'
}

onMounted(() => load(1))
</script>
