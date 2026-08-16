<template>
  <div class="max-w-[1400px] mx-auto space-y-5">
    <div>
      <h1 class="text-2xl font-bold text-zinc-800 dark:text-zinc-100">文件管理</h1>
      <p class="text-sm text-zinc-400 mt-1">文件资源库（后端缺口：管理列表/删除端点，当前为演示数据）</p>
    </div>

    <!-- 存储统计 -->
    <div class="glass-card p-4">
      <div class="flex items-center justify-between text-sm mb-2">
        <span class="text-zinc-600 dark:text-zinc-300 font-medium">总存储用量</span>
        <span class="text-xs text-zinc-400">已用 42.6 GB / 100 GB</span>
      </div>
      <div class="h-2.5 rounded-full bg-zinc-200/70 dark:bg-zinc-800/70 overflow-hidden">
        <div class="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-500" :style="{ width: '42.6%' }"></div>
      </div>
      <div class="text-[11px] text-amber-500 mt-1.5">⚠️ 剩余空间低于 60%，建议清理过期文件</div>
    </div>

    <!-- 筛选 -->
    <div class="flex flex-wrap items-center gap-3">
      <div class="flex gap-1 glass p-1 rounded-[5%]">
        <button v-for="t in fileTypes" :key="t.key" class="px-4 py-1.5 rounded-[5%] text-sm font-medium transition-all" :class="type === t.key ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 dark:text-zinc-200'" @click="switchType(t.key)">{{ t.label }}</button>
      </div>
      <input v-model="keyword" class="h-10 w-64 px-4 rounded-[5%] bg-white/60 dark:bg-zinc-800/60 border border-white/50 dark:border-white/10 text-sm outline-none focus:ring-2 focus:ring-amber-400/50 transition-all" placeholder="按文件名 / 上传者检索" @keyup.enter="load" />
      <button class="px-4 h-9 rounded-[5%] text-sm bg-white/60 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-300 hover: transition-all" @click="load">搜索</button>
    </div>

    <!-- 文件网格（4列） -->
    <div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
      <div v-for="f in files" :key="f.fileId" class="glass-card overflow-hidden card-lift group">
        <div class="aspect-video bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center overflow-hidden relative">
          <img v-if="f.type === 'image'" :src="f.url" alt="" class="w-full h-full object-cover" @error="hideImg" />
          <video v-else-if="f.type === 'video'" :src="f.url" class="w-full h-full object-cover" muted></video>
          <div v-else class="text-5xl">📄</div>
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
        <div class="text-5xl">{{ type === 'wallpaper' ? '🖼️' : '📁' }}</div>
        <p class="text-sm">{{ type === 'wallpaper' ? '暂无用户壁纸（⚠️ 后端缺口：用户壁纸列表/删除端点待实现，删除后该用户端背景图自动回退纯色）' : '该分类下暂无文件' }}</p>
      </div>
    </div>

    <!-- 预览弹窗 -->
    <AdminModal v-if="previewing" :title="previewing.name" width="w-[720px]" @close="previewing = null">
      <div class="flex items-center justify-center min-h-[300px] bg-zinc-100 dark:bg-zinc-900 rounded-[5%] overflow-hidden">
        <img v-if="previewing.type === 'image'" :src="previewing.url" alt="" class="max-h-[400px] object-contain" />
        <video v-else-if="previewing.type === 'video'" :src="previewing.url" controls class="w-full max-h-[400px]"></video>
        <div v-else class="text-center py-10 text-zinc-400">
          <div class="text-6xl mb-3">📄</div>文档在线预览开发中
        </div>
      </div>
    </AdminModal>

    <!-- 文件详情弹窗 -->
    <AdminModal v-if="inspecting" :title="'文件详情：' + inspecting.name" @close="inspecting = null">
      <div class="space-y-2.5 text-sm">
        <div class="flex justify-between px-4 py-2.5 rounded-[5%] bg-white/60 dark:bg-zinc-800/60"><span class="text-zinc-400">MD5</span><span class="text-zinc-700 dark:text-zinc-200 font-mono text-xs">{{ inspecting.md5 }}</span></div>
        <div class="flex justify-between px-4 py-2.5 rounded-[5%] bg-white/60 dark:bg-zinc-800/60"><span class="text-zinc-400">存储路径</span><span class="text-zinc-700 dark:text-zinc-200 font-mono text-xs">{{ inspecting.path }}</span></div>
        <div class="flex justify-between px-4 py-2.5 rounded-[5%] bg-white/60 dark:bg-zinc-800/60"><span class="text-zinc-400">上传 IP</span><span class="text-zinc-700 dark:text-zinc-200">{{ inspecting.uploadIp }}</span></div>
        <div class="flex justify-between px-4 py-2.5 rounded-[5%] bg-white/60 dark:bg-zinc-800/60"><span class="text-zinc-400">关联内容</span><span class="text-zinc-700 dark:text-zinc-200">{{ inspecting.refTweetId || '无' }}</span></div>
        <div class="flex justify-between px-4 py-2.5 rounded-[5%] bg-white/60 dark:bg-zinc-800/60"><span class="text-zinc-400">上传者</span><span class="text-zinc-700 dark:text-zinc-200">{{ inspecting.uploader }}</span></div>
      </div>
    </AdminModal>

    <!-- 删除确认 -->
    <ConfirmDialog
      v-if="deleteTarget"
      danger
      title="永久删除文件"
      :message="'确定永久删除「' + deleteTarget.name + '」吗？将同时清除所有关联引用，不可恢复！'"
      confirm-text="永久删除"
      require-reason
      reason-placeholder="删除原因（必填）"
      @close="deleteTarget = null"
      @confirm="(reason) => doDelete(reason)"
    />
  </div>
</template>

<script>
export default { name: 'AdminFilesView' }
</script>

<script setup>
import { onMounted, ref } from 'vue'
import AdminModal from '@/components/admin/AdminModal.vue'
import ConfirmDialog from '@/components/admin/ConfirmDialog.vue'
import { getAdminFiles, deleteAdminFile } from '@/api/admin'
import { useToastStore } from '@/stores/toast'
import { relativeTime } from '@/utils/format'

const toast = useToastStore()

const fileTypes = [
  { key: 'all', label: '全部' },
  { key: 'image', label: '图片' },
  { key: 'video', label: '视频' },
  { key: 'doc', label: '文档' },
  { key: 'wallpaper', label: '用户壁纸' } // 二期：用户上传的自定义背景图（审核/删除/封禁）
]
const type = ref('all')
const keyword = ref('')
const files = ref([])
const previewing = ref(null)
const inspecting = ref(null)
const deleteTarget = ref(null)

function switchType(t) {
  type.value = t
  load()
}

async function load() {
  try {
    const res = await getAdminFiles({ type: type.value, keyword: keyword.value })
    const data = res && res.data ? res.data : res
    files.value = data.items || data.list || []
  } catch (e) {
    files.value = []
  }
}

function preview(f) {
  previewing.value = f
}

function inspect(f) {
  inspecting.value = f
}

function openDelete(f) {
  deleteTarget.value = f
}

async function doDelete(reason) {
  try {
    await deleteAdminFile(deleteTarget.value.fileId)
    files.value = files.value.filter(f => f.fileId !== deleteTarget.value.fileId)
    toast.push('文件已永久删除', 'success')
    deleteTarget.value = null
  } catch (e) {
    toast.push('删除失败', 'error')
  }
}

function formatSize(bytes) {
  if (!bytes) return '0 B'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1024 / 1024).toFixed(1) + ' MB'
}

function hideImg(e) {
  e.target.style.visibility = 'hidden'
}

onMounted(load)
</script>
