<template>
  <div class="max-w-[1400px] mx-auto space-y-5">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold text-zinc-800 dark:text-zinc-100">举报管理</h1>
        <p class="text-sm text-zinc-400 mt-1">举报工单处理（后端 AuditApi：待处理队列 + resolve）</p>
      </div>
      <div class="flex flex-wrap items-center gap-2 sm:gap-3 text-sm">
        <span class="px-3 py-1.5 rounded-full bg-red-500/10 text-red-500 font-medium">待处理 {{ pendingCount }} 条</span>
        <span class="px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-500 font-medium">已处理 {{ resolvedCount }} 条</span>
        <button v-if="selected.length" class="px-3 h-9 rounded-[5%] text-xs bg-amber-500/10 text-amber-600 hover:bg-amber-1000/20 transition-colors" @click="batchResolve"><svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> 批量标记已处理（{{ selected.length }}）</button>
      </div>
    </div>

    <AdminTable
      :columns="columns"
      :rows="reports"
      row-key-field="reportGuid"
      :loading="loading"
      :selected="selected"
      :page="page"
      :page-size="pageSize"
      :total="total"
      selectable
      empty-text="暂无举报工单"
      @update:selected="selected = $event"
      @page-change="load($event)"
    >
      <template #cell-category="{ row }">
        <span class="text-xs px-2 py-1 rounded-full font-medium" :class="categoryClass(row.category)">{{ categoryText(row.category) }}</span>
      </template>
      <template #cell-createTime="{ row }">
        <span class="text-xs text-zinc-500 dark:text-zinc-400">{{ relativeTime(row.createTime) }}</span>
      </template>
      <template #cell-status="{ row }">
        <span class="text-xs px-2 py-1 rounded-full font-medium" :class="row.status === 'Pending' ? 'bg-amber-400/15 text-amber-600 dark:text-amber-400' : 'bg-emerald-400/15 text-emerald-500'">
          {{ row.status === 'Pending' ? '待处理' : '已处理' }}
        </span>
      </template>
      <template #actions="{ row }">
        <button class="px-2.5 h-8 rounded-[5%] text-xs text-amber-600 hover:bg-amber-500/10 transition-colors" @click="viewDetail(row)">查看详情</button>
        <button v-if="row.status === 'Pending'" class="px-2.5 h-8 rounded-[5%] text-xs text-emerald-500 hover:bg-emerald-500/10 transition-colors" @click="openResolve(row)">标记处理</button>
      </template>
    </AdminTable>

    <!-- 详情侧滑面板 -->
    <div v-if="viewing" class="fixed inset-0 z-[75] bg-black/40" @click="viewing = null">
      <div class="absolute right-0 top-0 bottom-0 w-[480px] glass-card rounded-l-[5%] rounded-r-none flex flex-col">
        <div class="flex items-center justify-between px-5 py-4 border-b border-zinc-200/60 dark:border-zinc-700/60">
          <h3 class="text-base font-bold text-zinc-800 dark:text-zinc-100">举报详情 #{{ viewing.reportGuid }}</h3>
          <button class="w-8 h-8 rounded-[5%] flex items-center justify-center text-zinc-400 hover:bg-white/60 dark:hover:bg-zinc-800/60 transition-colors" @click="viewing = null"><svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        </div>
        <div class="flex-1 overflow-y-auto p-5 space-y-4">
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div class="rounded-[5%] bg-white/60 dark:bg-zinc-800/60 p-3">
              <div class="text-[11px] text-zinc-400">举报目标</div>
              <div class="font-medium text-zinc-700 dark:text-zinc-200 mt-1">{{ viewing.targetTitle }}</div>
            </div>
            <div class="rounded-[5%] bg-white/60 dark:bg-zinc-800/60 p-3">
              <div class="text-[11px] text-zinc-400">目标类型</div>
              <div class="font-medium text-zinc-700 dark:text-zinc-200 mt-1">{{ viewing.targetType === 'User' ? '用户' : '内容' }}</div>
            </div>
            <div class="rounded-[5%] bg-white/60 dark:bg-zinc-800/60 p-3">
              <div class="text-[11px] text-zinc-400">举报类型</div>
              <div class="font-medium text-zinc-700 dark:text-zinc-200 mt-1">{{ categoryText(viewing.category) }}</div>
            </div>
            <div class="rounded-[5%] bg-white/60 dark:bg-zinc-800/60 p-3">
              <div class="text-[11px] text-zinc-400">举报人</div>
              <div class="font-medium text-zinc-700 dark:text-zinc-200 mt-1">匿名用户</div>
            </div>
            <div class="rounded-[5%] bg-white/60 dark:bg-zinc-800/60 p-3 col-span-2">
              <div class="text-[11px] text-zinc-400">举报原因</div>
              <div class="text-zinc-700 dark:text-zinc-200 mt-1">{{ viewing.reportReason }}</div>
            </div>
            <div class="rounded-[5%] bg-white/60 dark:bg-zinc-800/60 p-3 col-span-2">
              <div class="text-[11px] text-zinc-400">提交时间</div>
              <div class="text-zinc-700 dark:text-zinc-200 mt-1">{{ relativeTime(viewing.createTime) }}</div>
            </div>
          </div>
          <div v-if="viewing.reviewNote" class="px-4 py-3 rounded-[5%] bg-emerald-500/10 text-sm text-emerald-600 dark:text-emerald-400">
            处理备注：{{ viewing.reviewNote }}
          </div>
        </div>
      </div>
    </div>

    <!-- 标记处理弹窗 -->
    <AdminModal v-if="resolveTarget" title="标记处理" @close="resolveTarget = null">
      <div class="space-y-3">
        <p class="text-sm text-zinc-500 dark:text-zinc-400">选择对「{{ resolveTarget.targetTitle }}」的处理结果：</p>
        <div class="grid grid-cols-3 gap-2">
          <button v-for="opt in resolveOptions" :key="opt.value" class="py-2.5 rounded-[5%] text-sm font-medium transition-all"
            :class="resolveAction === opt.value ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow' : 'bg-white/60 dark:bg-zinc-800/60 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 dark:text-zinc-200'"
            @click="resolveAction = opt.value">
            {{ opt.label }}
          </button>
        </div>
        <textarea v-model="resolveNote" rows="2" class="w-full resize-none rounded-[5%] bg-white/70 dark:bg-zinc-800/70 border border-white/60 dark:border-white/10 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-400/50 transition-all" placeholder="处理备注（选填）"></textarea>
      </div>
      <template #footer>
        <button class="px-4 h-10 rounded-[5%] text-sm text-zinc-500 hover:bg-white/60 dark:hover:bg-zinc-800/60 transition-all dark:text-zinc-400" @click="resolveTarget = null">取消</button>
        <button class="px-4 h-10 rounded-[5%] text-sm font-medium bg-gradient-to-r from-amber-400 to-orange-500 text-white active:scale-95 transition-all" @click="doResolve">确认处理</button>
      </template>
    </AdminModal>
  </div>
</template>

<script lang="ts">
export default { name: 'AdminReportsView' }
</script>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AdminTable from '@/components/admin/AdminTable.vue'
import AdminModal from '@/components/admin/AdminModal.vue'
import { getReports, resolveReport } from '@/api/admin'
import { useToastStore } from '@/stores/toast'
import { relativeTime } from '@/utils/format'

const toast = useToastStore()

const columns = [
  { key: 'reportGuid', label: '举报编号' },
  { key: 'targetTitle', label: '举报目标' },
  { key: 'category', label: '举报类型' },
  { key: 'reportReason', label: '举报原因' },
  { key: 'createTime', label: '提交时间', cellClass: 'text-xs text-zinc-500 dark:text-zinc-400' },
  { key: 'status', label: '状态' }
]

const reports = ref<any[]>([])
const loading = ref(false)
const page = ref(1)
const pageSize = 10
const total = ref(0)
const selected = ref<any[]>([])
const viewing = ref<any>(null)
const resolveTarget = ref<any>(null)
const resolveAction = ref('dismiss')
const resolveNote = ref('')

const resolveOptions = [
  { value: 'dismiss', label: '驳回举报（内容正常）' },
  { value: 'removed', label: '删除内容' },
  { value: 'ban', label: '封禁用户' }
]

const pendingCount = computed(() => reports.value.filter(r => r.status === 'Pending').length)
const resolvedCount = computed(() => reports.value.filter(r => r.status !== 'Pending').length)

function categoryClass(c: number): string {
  const map = ['bg-red-400/15 text-red-500', 'bg-orange-400/15 text-orange-500', 'bg-amber-400/15 text-amber-600', 'bg-blue-400/15 text-amber-600', 'bg-zinc-400/15 text-zinc-500 dark:text-zinc-400']
  return map[c] || map[4]
}

function categoryText(c: number): string {
  return ['色情', '暴力', '政治', '广告', '其他'][c] || '其他'
}

async function load(p?: number): Promise<void> {
  loading.value = true
  page.value = p || 1
  try {
    const res = await getReports({ page: page.value, pageSize })
    const data: any = res && res.data ? res.data : res
    reports.value = data.items || data.list || []
    total.value = data.totalCount !== undefined ? data.totalCount : (data.total || reports.value.length)
  } catch (e) {
    console.error('加载举报失败:', e)
  } finally {
    loading.value = false
  }
}

function viewDetail(row: any): void {
  viewing.value = row
}

function openResolve(row: any): void {
  resolveTarget.value = row
  resolveAction.value = 'dismiss'
  resolveNote.value = ''
}

async function doResolve(): Promise<void> {
  try {
    await resolveReport(resolveTarget.value.reportGuid, { action: resolveAction.value, note: resolveNote.value })
    toast.push('举报已处理', 'success')
    resolveTarget.value = null
    load(page.value)
  } catch (e) {
    toast.push('处理失败', 'error')
  }
}

function batchResolve(): void {
  toast.push('批量处理举报尚未接入后端，操作未执行', 'error')
  selected.value = []
  load(page.value)
}

onMounted(() => load(1))
</script>
