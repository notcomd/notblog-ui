<template>
  <div class="max-w-[1400px] mx-auto space-y-5">
    <div>
      <h1 class="text-2xl font-bold text-zinc-800 dark:text-zinc-100">文件管理</h1>
      <p class="text-sm text-zinc-400 mt-1">文件资源库</p>
    </div>

    <!-- 筛选 -->
    <div class="flex flex-wrap items-center gap-3">
      <div class="flex flex-wrap gap-1 glass p-1 rounded-[5%]">
        <button v-for="t in fileTypes" :key="t.key" class="px-4 py-1.5 rounded-[5%] text-sm font-medium transition-all" :class="type === t.key ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 dark:text-zinc-200'" @click="switchType(t.key)">{{ t.label }}</button>
      </div>
      <input v-model="keyword" name="keyword" aria-label="按文件名或上传者检索" class="h-10 w-64 px-4 rounded-[5%] bg-transparent ring-1 ring-inset ring-zinc-200/70 dark:ring-zinc-800 text-sm outline-none focus:ring-2 focus:ring-amber-400/50 transition-all" placeholder="按文件名 / 上传者检索" @keyup.enter="load" />
      <button class="h-10 px-4 rounded-[5%] bg-transparent text-sm text-zinc-600 transition-colors hover:bg-black/[0.04] ring-1 ring-inset ring-zinc-200/70 dark:text-zinc-300 dark:hover:bg-white/[0.06] dark:ring-zinc-800" @click="load">搜索</button>
    </div>

    <!-- 文件网格（4列） -->
    <div class="grid grid-cols-4 gap-4">
      <div v-for="f in files" :key="f.fileId" class="glass-card overflow-hidden card-lift group">
        <div class="aspect-video bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center overflow-hidden relative">
          <img v-if="f.type === 'image'" :src="f.url" alt="" class="w-full h-full object-cover" @error="hideImg" />
          <video v-else-if="f.type === 'video'" :src="f.url" class="w-full h-full object-cover" muted></video>
          <div v-else class="text-5xl"><svg class="w-12 h-12 text-zinc-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg></div>
          <!-- 悬停操作 -->
          <div class="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
            <button class="px-3 py-1.5 rounded-[5%] bg-white/90 text-xs font-medium text-zinc-700 shadow dark:text-zinc-200" @click="preview(f)">预览</button>
            <button class="px-3 py-1.5 rounded-[5%] bg-white/90 text-xs font-medium text-zinc-700 shadow dark:text-zinc-200" @click="inspect(f)">查询</button>
            <button class="px-3 py-1.5 rounded-[5%] bg-red-500 text-xs font-medium text-white shadow" @click="openDelete(f)">删除</button>
          </div>
        </div>
        <div class="p-3">
          <div class="text-sm font-medium text-zinc-700 dark:text-zinc-200 truncate">{{ f.name }}</div>
          <div class="text-xs text-zinc-400 mt-0.5">{{ formatSize(f.size) }} · {{ f.uploader }} · {{ relativeTime(f.uploadTime) }}</div>
        </div>
      </div>
      <div v-if="files.length === 0" class="col-span-full py-16 flex flex-col items-center gap-3 text-zinc-400">
        <div class="text-5xl"><svg class="w-12 h-12 text-zinc-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg></div>
        <p class="text-sm">该分类下暂无文件</p>
      </div>
    </div>

    <!-- 预览弹窗 -->
    <AdminModal v-if="previewing" :title="previewing.name" width="w-[720px]" @close="previewing = null">
      <div class="flex items-center justify-center min-h-[300px] bg-zinc-100 dark:bg-zinc-900 rounded-[5%] overflow-hidden">
        <img v-if="previewing.type === 'image'" :src="previewing.url" alt="" class="max-h-[400px] object-contain" />
        <video v-else-if="previewing.type === 'video'" :src="previewing.url" controls class="w-full max-h-[400px]"></video>
        <div v-else class="text-center py-10 text-zinc-400">
          <div class="text-6xl mb-3"><svg class="w-14 h-14 text-zinc-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg></div>文档在线预览开发中
        </div>
      </div>
    </AdminModal>

    <!-- 文件详情弹窗（仅展示后端下发的字段；物理路径等存储细节由后端有意不外发） -->
    <AdminModal v-if="inspecting" :title="'文件详情：' + inspecting.name" @close="inspecting = null">
      <div class="space-y-2.5 text-sm">
        <div class="flex justify-between gap-2 px-4 py-2.5 rounded-[5%]"><span class="text-zinc-400 shrink-0">文件 ID</span><span class="text-zinc-700 dark:text-zinc-200 font-mono text-xs min-w-0 break-all text-right">{{ inspecting.fileId }}</span></div>
        <div class="flex justify-between gap-2 px-4 py-2.5 rounded-[5%]"><span class="text-zinc-400 shrink-0">大小</span><span class="text-zinc-700 dark:text-zinc-200 min-w-0 break-all text-right">{{ formatSize(inspecting.size) }}</span></div>
        <div class="flex justify-between gap-2 px-4 py-2.5 rounded-[5%]"><span class="text-zinc-400 shrink-0">可见性</span><span class="text-zinc-700 dark:text-zinc-200 min-w-0 break-all text-right">{{ inspecting.isPublic ? '公开' : '私有' }}</span></div>
        <div class="flex justify-between gap-2 px-4 py-2.5 rounded-[5%]"><span class="text-zinc-400 shrink-0">来源</span><span class="text-zinc-700 dark:text-zinc-200 min-w-0 break-all text-right">{{ inspecting.source === 'ContentAttachment' ? '内容附件' : '用户文件仓库' }}</span></div>
        <div class="flex justify-between gap-2 px-4 py-2.5 rounded-[5%]"><span class="text-zinc-400 shrink-0">上传者</span><span class="text-zinc-700 dark:text-zinc-200 font-mono text-xs min-w-0 break-all text-right">{{ inspecting.uploader }}</span></div>
        <div class="flex justify-between gap-2 px-4 py-2.5 rounded-[5%]"><span class="text-zinc-400 shrink-0">上传时间</span><span class="text-zinc-700 dark:text-zinc-200 min-w-0 break-all text-right">{{ relativeTime(inspecting.uploadTime) }}</span></div>
      </div>
    </AdminModal>

    <!-- 删除确认（后端为软删除 + 级联物理清理；删除原因后端不接收） -->
    <ConfirmDialog
      v-if="deleteTarget"
      danger
      title="永久删除文件"
      :message="'确定永久删除「' + deleteTarget.name + '」吗？将同时清除所有关联引用，不可恢复！'"
      confirm-text="永久删除"
      @close="deleteTarget = null"
      @confirm="doDelete"
    />
  </div>
</template>

<script lang="ts">
export default { name: 'AdminFilesView' }
</script>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import AdminModal from '@/components/admin/AdminModal.vue'
import ConfirmDialog from '@/components/admin/ConfirmDialog.vue'
import { getAdminFiles, deleteAdminFile } from '@/api/admin'
import { useToastStore } from '@/stores/toast'
import { formatSize, relativeTime } from '@/utils/format'

const toast = useToastStore()

const fileTypes = [
  { key: 'all', label: '全部' },
  { key: 'image', label: '图片' },
  { key: 'video', label: '视频' },
  { key: 'doc', label: '文档' }
]
const type = ref('all')
const keyword = ref('')
const files = ref<any[]>([])
const previewing = ref<any>(null)
const inspecting = ref<any>(null)
const deleteTarget = ref<any>(null)

function switchType(t: string): void {
  type.value = t
  load()
}

async function load(): Promise<void> {
  try {
    const data: any = await getAdminFiles({ type: type.value, keyword: keyword.value })
    files.value = data.items || data.list || []
  } catch (e) {
    files.value = []
  }
}

function preview(f: any): void {
  previewing.value = f
}

function inspect(f: any): void {
  inspecting.value = f
}

function openDelete(f: any): void {
  deleteTarget.value = f
}

async function doDelete(): Promise<void> {
  try {
    await deleteAdminFile(deleteTarget.value.fileId)
    files.value = files.value.filter(f => f.fileId !== deleteTarget.value.fileId)
    toast.push('文件已永久删除', 'success')
    deleteTarget.value = null
  } catch (e) {
    toast.push('删除失败', 'error')
  }
}

function hideImg(e: any): void {
  e.target.style.visibility = 'hidden'
}

onMounted(load)
</script>
