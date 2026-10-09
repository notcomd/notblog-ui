<template>
  <div class="max-w-[1400px] mx-auto space-y-5">
    <div>
      <h1 class="font-display text-2xl font-bold text-zinc-800 dark:text-zinc-100">内容管理</h1>
      <p class="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">图文 / 视频 / 博客审核（后端 AuditApi：待审核队列 + 通过/驳回）</p>
    </div>

    <!-- Tab：图文 | 视频 | 博客 -->
    <div class="flex gap-1 glass p-1 rounded-[5%] w-fit">
      <button v-for="t in tabs" :key="t.key" class="px-5 py-2 rounded-[5%] text-sm font-medium transition-all" :class="tab === t.key ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow' : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-300 dark:hover:text-white'" @click="switchTab(t.key)">{{ t.label }}</button>
    </div>

    <!-- 筛选栏 -->
    <div class="flex flex-wrap items-center gap-3">
      <select v-model="status" name="status" aria-label="按状态筛选内容" class="h-10 px-3 rounded-[5%] bg-transparent ring-1 ring-inset ring-zinc-200/70 dark:ring-zinc-800 text-sm outline-none">
        <option value="Pending">待审核</option>
        <option value="All">全部</option>
        <option value="Approved">已通过</option>
        <option value="Rejected">已驳回</option>
      </select>
      <select v-model="sortBy" name="sortBy" aria-label="排序方式" class="h-10 px-3 rounded-[5%] bg-transparent ring-1 ring-inset ring-zinc-200/70 dark:ring-zinc-800 text-sm outline-none">
        <option value="latest">最新发布</option>
        <option value="reports">最多举报</option>
      </select>
      <input v-model="keyword" class="h-10 w-64 px-4 rounded-[5%] bg-transparent ring-1 ring-inset ring-zinc-200/70 dark:ring-zinc-800 text-sm outline-none focus:ring-2 focus:ring-amber-400/50 transition-all" placeholder="按内容标题 / 作者昵称检索" @keyup.enter="load(1)" />
      <button class="h-10 px-4 rounded-[5%] bg-transparent text-sm text-zinc-600 transition-colors hover:bg-black/[0.04] ring-1 ring-inset ring-zinc-200/70 dark:text-zinc-300 dark:hover:bg-white/[0.06] dark:ring-zinc-800" @click="load(1)">筛选</button>
      <span class="text-xs text-zinc-400 ml-auto">高举报内容自动置顶（红色警示边框）</span>
    </div>

    <!-- 内容列表 -->
    <div>
      <div
        v-for="t in items"
        :key="t.tweetGuid"
        class="flex flex-wrap items-center gap-4 border-b border-black/[0.06] p-4 transition-colors hover:bg-black/[0.03] dark:border-white/[0.08] dark:hover:bg-white/[0.045]"
        :class="(t.reportCount || 0) > 0 ? 'ring-1 ring-inset ring-red-400/50' : ''"
      >
        <!-- 封面缩略图 -->
        <div class="flex h-24 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[5%] bg-zinc-100 dark:bg-zinc-900">
          <img v-if="thumbOf(t)" :src="thumbOf(t)" alt="" class="h-full w-full object-cover" @error="onThumbError(t)" />
          <template v-else>
            <svg v-if="t.isVideo" class="w-6 h-6 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/></svg>
            <svg v-else class="w-6 h-6 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          </template>
        </div>
        <!-- 信息 -->
        <div class="flex-1 min-w-0">
          <div class="flex min-w-0 items-center gap-2">
            <span class="min-w-0 truncate text-sm font-medium text-zinc-700 dark:text-zinc-200">{{ t.content }}</span>
            <span v-if="(t.reportCount || 0) > 0" class="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-500 shrink-0"><svg class="w-3 h-3 inline-block align-[-1px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg> {{ t.reportCount }} 举报</span>
          </div>
          <div class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-400">
            <span>作者：{{ t.authorName }}</span>
            <span>{{ relativeTime(t.createTime) }}</span>
            <span>浏览 {{ t.viewCount }} · 赞 {{ t.likeCount }} · 评 {{ t.commentCount }}</span>
          </div>
        </div>
        <!-- 状态 -->
        <span class="text-xs px-2.5 py-1 rounded-full font-medium shrink-0" :class="statusClass(t.tweetStatus)">{{ statusText(t.tweetStatus) }}</span>
        <!-- 操作 -->
        <div class="flex gap-1.5 shrink-0">
          <button class="h-9 rounded-[5%] bg-gradient-to-r from-amber-400 to-orange-500 px-3 text-xs font-medium text-white transition-all hover:opacity-90 active:scale-95" @click="openAudit(t)">审核</button>
          <!-- 屏蔽/删除仅图文有对应端点（Message /api/audit/tweets/*），视频/博文仅提供通过/驳回 -->
          <button v-if="tab === 'image'" class="h-9 rounded-[5%] px-3 text-xs text-zinc-600 transition-colors hover:bg-black/[0.04] active:scale-95 dark:text-zinc-300 dark:hover:bg-white/[0.06]" @click="openBlock(t)">屏蔽</button>
          <button v-if="tab === 'image'" class="h-9 rounded-[5%] bg-red-500/10 px-3 text-xs text-red-500 transition-colors hover:bg-red-500/20 active:scale-95" @click="openDelete(t)">删除</button>
        </div>
      </div>
      <div v-if="loading" class="py-10 text-center text-sm text-zinc-400">加载中…</div>
      <div v-else-if="items.length === 0" class="py-16 text-center text-zinc-400">
        <svg class="mx-auto mb-3 w-12 h-12 text-zinc-300 dark:text-zinc-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
        暂无符合条件的内容
      </div>
      <div class="flex items-center justify-center gap-2 pt-2">
        <button class="px-4 h-9 rounded-[5%] text-sm text-zinc-600 dark:text-zinc-300 disabled:opacity-30 transition-all" :disabled="page <= 1" @click="load(page - 1)">上一页</button>
        <span class="text-xs text-zinc-400">{{ page }} / {{ totalPages }}（共 {{ total }} 条）</span>
        <button class="px-4 h-9 rounded-[5%] text-sm text-zinc-600 dark:text-zinc-300 disabled:opacity-30 transition-all" :disabled="page >= totalPages" @click="load(page + 1)">下一页</button>
      </div>
    </div>

    <!-- 审核弹窗 -->
    <AdminModal v-if="auditTarget" :title="'内容审核：' + auditTarget.content.slice(0, 30)" width="w-[720px]" @close="auditTarget = null">
      <div class="space-y-4">
        <div class="flex flex-row gap-4">
          <img v-if="thumbOf(auditTarget)" :src="thumbOf(auditTarget)" alt="" class="w-44 h-56 shrink-0 rounded-[5%] object-cover" @error="onThumbError(auditTarget)" />
          <div class="flex-1 space-y-2">
            <div class="text-base font-semibold text-zinc-800 dark:text-zinc-100">{{ auditTarget.content }}</div>
            <div class="text-xs text-zinc-400">作者：{{ auditTarget.authorName }} · 发布时间：{{ relativeTime(auditTarget.createTime) }}</div>
            <div class="flex gap-2 pt-1">
              <span class="text-xs px-2 py-1 rounded-full bg-zinc-400/15 text-zinc-500 dark:text-zinc-400"><svg class="w-3 h-3 inline-block align-[-1px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> {{ auditTarget.viewCount }}</span>
              <span class="text-xs px-2 py-1 rounded-full bg-red-400/15 text-red-500"><svg class="w-3 h-3 inline-block align-[-1px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> {{ auditTarget.likeCount }}</span>
              <span class="text-xs px-2 py-1 rounded-full bg-amber-400/15 text-amber-600 dark:text-amber-400"><svg class="w-3 h-3 inline-block align-[-1px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> {{ auditTarget.commentCount }}</span>
              <span v-if="(auditTarget.reportCount || 0) > 0" class="text-xs px-2 py-1 rounded-full bg-red-500/15 text-red-500"><svg class="w-3 h-3 inline-block align-[-1px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg> {{ auditTarget.reportCount }} 次举报</span>
            </div>
            <!-- 驳回理由 -->
            <input v-model="rejectReason" name="rejectReason" aria-label="驳回理由（选填，将反馈给发布者）" class="w-full h-10 px-3.5 rounded-[5%] bg-transparent ring-1 ring-inset ring-zinc-200/70 dark:ring-zinc-800 text-sm outline-none focus:ring-2 focus:ring-amber-400/50 transition-all" placeholder="驳回理由（选填，将反馈给发布者）" />
          </div>
        </div>
      </div>
      <template #footer>
        <button class="px-4 h-10 rounded-[5%] text-sm text-zinc-500 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-all dark:text-zinc-400" @click="auditTarget = null">取消</button>
        <button class="px-4 h-10 rounded-[5%] text-sm font-medium bg-gradient-to-r from-amber-400 to-orange-500 text-white active:scale-95 transition-all" @click="doReject">驳回</button>
        <button class="px-4 h-10 rounded-[5%] text-sm font-medium bg-gradient-to-r from-emerald-500 to-teal-500 text-white active:scale-95 transition-all" @click="doApprove"><svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg> 通过</button>
      </template>
    </AdminModal>

    <!-- 屏蔽确认（后端置为驳回并写审计日志，不接受原因） -->
    <AdminModal v-if="blockTarget" title="屏蔽内容" @close="blockTarget = null">
      <p class="text-sm text-zinc-500 dark:text-zinc-400">屏蔽后该内容全站不可见（不删除），确定屏蔽「{{ blockTarget.content.slice(0, 30) }}」？</p>
      <template #footer>
        <button class="px-4 h-10 rounded-[5%] text-sm text-zinc-500 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-all dark:text-zinc-400" @click="blockTarget = null">取消</button>
        <button class="px-4 h-10 rounded-[5%] text-sm font-medium bg-gradient-to-r from-amber-400 to-orange-500 text-white active:scale-95 transition-all" @click="doBlock">确认屏蔽</button>
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

<script lang="ts">
export default { name: 'AdminContentView' }
</script>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import AdminModal from '@/components/admin/AdminModal.vue'
import ConfirmDialog from '@/components/admin/ConfirmDialog.vue'
import { getPendingTweets, approveTweet, rejectTweet, blockTweet, deleteTweet, getVideoAuditList, approveVideo, rejectVideo } from '@/api/admin'
import { getPendingMarkdownDocs, approveMarkdown, rejectMarkdown } from '@/api/markdown'

import { useToastStore } from '@/stores/toast'
import { relativeTime } from '@/utils/format'
import { pickCoverUrl } from '@/utils/media'

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

const items = ref<any[]>([])
const loading = ref(false)
const page = ref(1)
const pageSize = 10
const total = ref(0)

const auditTarget = ref<any>(null)
const rejectReason = ref('')
const blockTarget = ref<any>(null)
const deleteTarget = ref<any>(null)

const totalPages = computed<number>(() => Math.max(1, Math.ceil(total.value / pageSize)))

/** 各服务状态枚举 → 图文口径（Pending/Approved/Rejected/Draft）；Markdown 带 Mark 前缀，Video 与图文同形 */
const STATUS_ALIAS: Record<string, string> = {
  Pending: 'Pending',
  MarkPendingReview: 'Pending',
  Approved: 'Approved',
  MarkApproved: 'Approved',
  Rejected: 'Rejected',
  MarkRejected: 'Rejected',
  Draft: 'Draft',
  MarkDraft: 'Draft'
}
const STATUS_TEXT: Record<string, string> = { Pending: '待审核', Approved: '已通过', Rejected: '已驳回', Draft: '草稿' }
const STATUS_CLASS: Record<string, string> = {
  Pending: 'bg-amber-400/15 text-amber-600 dark:text-amber-400',
  Approved: 'bg-emerald-400/15 text-emerald-500',
  Rejected: 'bg-red-400/15 text-red-500',
  Draft: 'bg-zinc-400/15 text-zinc-500 dark:text-zinc-400'
}
const STATUS_FALLBACK_CLASS = 'bg-zinc-400/15 text-zinc-500 dark:text-zinc-400'

/** 状态徽标样式：先按别名归一化，再取配色（未知值走中性色） */
function statusClass(s: string): string {
  return STATUS_CLASS[STATUS_ALIAS[s] || s] || STATUS_FALLBACK_CLASS
}

/** 状态徽标文案：先按别名归一化，未知值原样回显 */
function statusText(s: string): string {
  return STATUS_TEXT[STATUS_ALIAS[s] || s] || s
}

function switchTab(t: string): void {
  tab.value = t
  load(1)
}

async function load(p: number): Promise<void> {
  loading.value = true
  page.value = p || 1
  try {
    // 各 Tab 各自查询对应服务的「待审核」队列（与图文口径一致）：
    //   图文 → Message  GET /api/audit/tweets/pending（PagedResult{tweetStatus}）
    //   视频 → Video    GET /api/video/audit/list?status=Pending（PagedResult{status}）
    //   博客 → Markdown GET /api/markdown/pending（裸数组，状态 MarkPendingReview）
    // 状态/排序/类型为本地展示控制，不参与服务端查询（图文端点仅接收 page/pageSize）
    let res: any
    if (tab.value === 'video') {
      res = await getVideoAuditList({ status: 'Pending', page: page.value, pageSize })
    } else if (tab.value === 'blog') {
      res = await getPendingMarkdownDocs({ page: page.value, pageSize })
    } else {
      res = await getPendingTweets({ page: page.value, pageSize })
    }
    const data: any = res && res.data ? res.data : res
    // 博客返回裸数组（List<MarkdownSummaryResponse>）；图文/视频返回 PagedResult{items,totalCount}
    let list: any[] = Array.isArray(data) ? data : (data.items || data.list || [])
    if (tab.value === 'blog') {
      // 博客 DTO 字段名与推文不同，统一映射为列表/审核弹窗使用的字段名
      list = list.map((m: any) => ({
        tweetGuid: m.markDownGuid,
        content: m.name,
        createTime: m.createAt,
        tweetStatus: m.status,
        mediaUrls: m.coverUrl ? [m.coverUrl] : []
      }))
    } else if (tab.value === 'video') {
      // 视频 DTO（MyVideoDto）：videoGuid/videoName/videoCover/status
      list = list.map((v: any) => ({
        tweetGuid: v.videoGuid,
        content: v.videoName,
        createTime: v.createTime,
        tweetStatus: v.status,
        mediaUrls: v.videoCover ? [v.videoCover] : [],
        isVideo: true
      }))
    }
    if (sortBy.value === 'reports') list = [...list].sort((a, b) => (b.reportCount || 0) - (a.reportCount || 0))
    items.value = list
    total.value = data.totalCount !== undefined ? data.totalCount : (data.total || items.value.length)
  } catch (e: any) {
    toast.push(e?.message || '加载内容失败', 'error')
  } finally {
    loading.value = false
  }
}

function openAudit(t: any): void {
  auditTarget.value = t
  rejectReason.value = ''
}

async function doApprove(): Promise<void> {
  try {
    if (tab.value === 'video') {
      await approveVideo(auditTarget.value.tweetGuid)
    } else if (tab.value === 'blog') {
      await approveMarkdown(auditTarget.value.tweetGuid)
    } else {
      await approveTweet(auditTarget.value.tweetGuid)
    }
    toast.push('已通过审核', 'success')
    auditTarget.value = null
    load(page.value)
  } catch (e: any) {
    toast.push(e?.message || '操作失败', 'error')
  }
}

async function doReject(): Promise<void> {
  try {
    if (tab.value === 'video') {
      await rejectVideo(auditTarget.value.tweetGuid, rejectReason.value)
    } else if (tab.value === 'blog') {
      await rejectMarkdown(auditTarget.value.tweetGuid, rejectReason.value)
    } else {
      await rejectTweet(auditTarget.value.tweetGuid, rejectReason.value)
    }
    toast.push('已驳回（理由已反馈发布者）', 'success')
    auditTarget.value = null
    load(page.value)
  } catch (e: any) {
    toast.push(e?.message || '操作失败', 'error')
  }
}

function openBlock(t: any): void {
  blockTarget.value = t
}

async function doBlock(): Promise<void> {
  try {
    await blockTweet(blockTarget.value.tweetGuid)
    toast.push('内容已屏蔽（全站不可见）', 'success')
    blockTarget.value = null
    load(page.value)
  } catch (e: any) {
    toast.push(e?.message || '操作失败', 'error')
  }
}

function openDelete(t: any): void {
  deleteTarget.value = t
}

async function doDelete(reason: string): Promise<void> {
  try {
    await deleteTweet(deleteTarget.value.tweetGuid)
    toast.push('内容已永久删除', 'success')
    deleteTarget.value = null
    load(page.value)
  } catch (e: any) {
    toast.push(e?.message || '操作失败', 'error')
  }
}

/** 缩略图加载失败的内容：记下 guid，模板据此回退到占位图标（审核弹窗则隐藏预览图） */
const brokenThumbs = reactive(new Set<string>())

function onThumbError(t: any): void {
  if (t && t.tweetGuid) brokenThumbs.add(t.tweetGuid)
}

/** 列表缩略图：取第一张非视频媒体（视频作品 mediaUrls[0] 是视频本身，不能当封面） */
function thumbOf(t: any): string {
  if (!t || !t.tweetGuid || brokenThumbs.has(t.tweetGuid)) return ''
  return pickCoverUrl(t.mediaUrls)
}

onMounted(() => load(1))
</script>
