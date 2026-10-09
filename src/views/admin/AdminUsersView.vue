<template>
  <div class="max-w-[1400px] mx-auto space-y-5">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-zinc-800 dark:text-zinc-100">用户管理</h1>
        <p class="text-sm text-zinc-400 mt-1">用户列表与管控</p>
      </div>
      <button class="px-4 h-10 rounded-[5%] text-sm font-medium bg-gradient-to-r from-amber-400 to-orange-500 text-white hover:opacity-90 active:scale-95 transition-all" @click="showAdd = true">＋ 添加用户</button>
    </div>

    <AdminTable
      :columns="columns"
      :rows="users"
      row-key-field="userGuid"
      :loading="loading"
      :selected="selected"
      :page="page"
      :page-size="pageSize"
      :total="total"
      selectable
      empty-text="没有找到匹配的用户"
      @update:selected="selected = $event"
      @page-change="load($event)"
    >
      <template #toolbar>
        <input v-model="keyword" name="keyword" aria-label="搜索用户名、ID或邮箱" class="h-10 w-64 px-4 rounded-[5%] bg-transparent ring-1 ring-inset ring-zinc-200/70 dark:ring-zinc-800 text-sm outline-none focus:ring-2 focus:ring-amber-400/50 transition-all" placeholder="搜索用户名 / 邮箱 / 手机号" @keyup.enter="load(1)" />
        <button class="h-10 px-3 rounded-[5%] bg-transparent text-sm text-zinc-600 transition-colors hover:bg-black/[0.04] ring-1 ring-inset ring-zinc-200/70 dark:text-zinc-300 dark:hover:bg-white/[0.06] dark:ring-zinc-800" @click="load(1)">搜索</button>
        <div v-if="selected.length" class="flex items-center gap-2 ml-2">
          <span class="text-xs text-zinc-400">已选 {{ selected.length }} 项</span>
          <button disabled title="功能暂不可用" class="h-8 px-3 rounded-[5%] text-xs bg-red-500/10 text-red-500/50 cursor-not-allowed transition-colors" @click="batchBan">批量封禁</button>
          <button disabled title="功能暂不可用" class="h-8 px-3 rounded-[5%] text-xs bg-red-500/10 text-red-500/50 cursor-not-allowed transition-colors" @click="batchDelete">批量删除</button>
        </div>
      </template>

      <template #cell-userName="{ row }">
        <div class="flex items-center gap-2.5">
          <img v-if="row.imageCover" :src="row.imageCover" alt="" class="w-9 h-9 rounded-full object-cover ring-1 ring-black/10 dark:ring-white/10" @error="hideImg" />
          <span v-else class="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs">{{ (row.userName || '?').slice(0, 1) }}</span>
          <div>
            <div class="font-medium text-zinc-700 dark:text-zinc-200">{{ row.userName }}</div>
            <div class="text-[11px] text-zinc-400">{{ row.userEmail }}</div>
          </div>
        </div>
      </template>

      <template #cell-status="{ row }">
        <span class="text-xs px-2 py-1 rounded-full font-medium" :class="statusClass(row.status)">{{ statusText(row.status) }}</span>
      </template>

      <template #cell-createDatetime="{ row }">
        <span class="text-xs text-zinc-500 dark:text-zinc-400">{{ relativeTime(row.createDatetime) }}</span>
      </template>

      <template #actions="{ row }">
        <button class="px-2.5 h-8 rounded-[5%] text-xs text-amber-600 hover:bg-amber-500/10 transition-colors" @click="viewUser(row)">查看</button>
        <button v-if="row.status !== 'Banned'" class="px-2.5 h-8 rounded-[5%] text-xs text-red-500 hover:bg-red-500/10 transition-colors" @click="banUser(row)">封禁</button>
        <button class="px-2.5 h-8 rounded-[5%] text-xs text-red-500 hover:bg-red-500/10 transition-colors" @click="deleteUser(row)">删除</button>
      </template>
    </AdminTable>

    <!-- 添加用户（后端仅接受邮箱 + 初始密码，角色固定 User） -->
    <AdminModal :open="showAdd" title="添加用户" @close="showAdd = false">
      <div class="space-y-3">
        <input v-model="addForm.userEmail" name="email" autocomplete="email" aria-label="邮箱（必填）" placeholder="邮箱（必填）" class="w-full h-10 px-3.5 rounded-[5%] bg-transparent ring-1 ring-inset ring-zinc-200/70 dark:ring-zinc-800 text-sm outline-none focus:ring-2 focus:ring-amber-400/50 transition-all" />
        <input v-model="addForm.password" type="password" name="password" autocomplete="new-password" aria-label="初始密码（必填，至少 8 位）" placeholder="初始密码（必填，至少 8 位）" class="w-full h-10 px-3.5 rounded-[5%] bg-transparent ring-1 ring-inset ring-zinc-200/70 dark:ring-zinc-800 text-sm outline-none focus:ring-2 focus:ring-amber-400/50 transition-all" />
        <p class="text-xs leading-relaxed text-zinc-400">新账号默认角色为「普通用户」，用户名默认与邮箱一致；如需提权请在角色管理中调整。</p>
      </div>
      <template #footer>
        <button class="px-4 h-10 rounded-[5%] text-sm text-zinc-500 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-all dark:text-zinc-400" @click="showAdd = false">取消</button>
        <button class="px-4 h-10 rounded-[5%] text-sm font-medium bg-gradient-to-r from-amber-400 to-orange-500 text-white active:scale-95 transition-all disabled:opacity-50" :disabled="!addForm.userEmail || addForm.password.length < 8" @click="submitAdd">创建</button>
      </template>
    </AdminModal>

    <!-- 用户详情 -->
    <AdminModal v-if="viewing" :title="'用户详情：' + viewing.userName" @close="viewing = null">
      <div class="space-y-4">
        <div class="flex items-center gap-4">
          <img v-if="viewing.imageCover" :src="viewing.imageCover" alt="" class="w-16 h-16 rounded-[5%] object-cover" @error="hideImg" />
          <div>
            <div class="text-lg font-bold text-zinc-800 dark:text-zinc-100">{{ viewing.userName }}</div>
            <div class="text-sm text-zinc-400">{{ viewing.userEmail }}</div>
            <div class="text-xs text-zinc-400 mt-1">ID：{{ viewing.userGuid }}</div>
          </div>
          <span class="ml-auto text-xs px-2 py-1 rounded-full font-medium" :class="statusClass(viewing.status)">{{ statusText(viewing.status) }}</span>
        </div>
        <div class="grid grid-cols-2 gap-3 text-center">
          <div class="rounded-[5%] py-3">
            <div class="text-sm font-medium text-zinc-800 dark:text-zinc-100">{{ relativeTime(viewing.createDatetime) }}</div>
            <div class="text-[11px] text-zinc-400 mt-0.5">注册时间</div>
          </div>
          <div class="rounded-[5%] py-3">
            <div class="text-sm font-medium text-zinc-800 dark:text-zinc-100">{{ viewing.phone || '未绑定' }}</div>
            <div class="text-[11px] text-zinc-400 mt-0.5">手机号</div>
          </div>
        </div>
      </div>
    </AdminModal>

    <!-- 封禁（二次确认；后端为锁定至远期，不接受原因/时长） -->
    <AdminModal v-if="banTarget" title="封禁用户" @close="banTarget = null">
      <p class="text-sm text-zinc-500 dark:text-zinc-400">确定封禁 <b>{{ banTarget.userName }}</b> 吗？封禁后该用户将无法登录，已发布内容不再对外可见。</p>
      <template #footer>
        <button class="px-4 h-10 rounded-[5%] text-sm text-zinc-500 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-all dark:text-zinc-400" @click="banTarget = null">取消</button>
        <button class="px-4 h-10 rounded-[5%] text-sm font-medium bg-gradient-to-r from-red-500 to-rose-500 text-white active:scale-95 transition-all" @click="submitBan">确认封禁</button>
      </template>
    </AdminModal>

    <!-- 删除确认（后端为永久停用，逻辑同封禁；删除原因后端不接收） -->
    <ConfirmDialog
      v-if="deleteTarget"
      danger
      title="永久停用用户"
      :message="'确定永久停用 ' + deleteTarget.userName + ' 吗？该账号将被锁定并无法再登录，不可恢复！'"
      confirm-text="永久停用"
      @close="deleteTarget = null"
      @confirm="submitDelete"
    />
  </div>
</template>

<script lang="ts">
export default { name: 'AdminUsersView' }
</script>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import AdminTable from '@/components/admin/AdminTable.vue'
import AdminModal from '@/components/admin/AdminModal.vue'
import ConfirmDialog from '@/components/admin/ConfirmDialog.vue'
import { getAdminUsers, addAdminUser, banAdminUser, deleteAdminUser } from '@/api/admin'
import { useToastStore } from '@/stores/toast'
import { relativeTime } from '@/utils/format'

const toast = useToastStore()

const columns = [
  { key: 'userGuid', label: '用户 ID' },
  { key: 'userName', label: '头像 / 昵称' },
  { key: 'createDatetime', label: '注册时间', cellClass: 'text-xs text-zinc-500 dark:text-zinc-400' },
  { key: 'status', label: '状态' }
]

const users = ref<any[]>([])
const loading = ref(false)
const page = ref(1)
const pageSize = 10
const total = ref(0)
const keyword = ref('')
const selected = ref<any[]>([])

const showAdd = ref(false)
const addForm = ref({ userEmail: '', password: '' })
const viewing = ref<any>(null)
const banTarget = ref<any>(null)
const deleteTarget = ref<any>(null)

function statusClass(s: string): string {
  return {
    Normal: 'bg-emerald-400/15 text-emerald-500',
    Banned: 'bg-red-400/15 text-red-500'
  }[s] || 'bg-zinc-400/15 text-zinc-500 dark:text-zinc-400'
}

function statusText(s: string): string {
  return { Normal: '正常', Banned: '已封禁' }[s] || s
}

async function load(p?: number): Promise<void> {
  loading.value = true
  page.value = p || 1
  try {
    const data: any = await getAdminUsers({ page: page.value, pageSize, keyword: keyword.value })
    users.value = data.items || data.list || []
    total.value = data.totalCount !== undefined ? data.totalCount : (data.total || users.value.length)
  } catch (e) {
    console.error('加载用户失败:', e)
  } finally {
    loading.value = false
  }
}

function viewUser(row: any): void {
  viewing.value = row
}

function banUser(row: any): void {
  banTarget.value = row
}

async function submitBan(): Promise<void> {
  try {
    await banAdminUser(banTarget.value.userGuid)
    toast.push(`已封禁 ${banTarget.value.userName}`, 'success')
    banTarget.value = null
    load(page.value)
  } catch (e: any) {
    toast.push(e?.message || '封禁失败', 'error')
  }
}

function deleteUser(row: any): void {
  deleteTarget.value = row
}

async function submitDelete(): Promise<void> {
  try {
    await deleteAdminUser(deleteTarget.value.userGuid)
    toast.push(`已永久停用 ${deleteTarget.value.userName}`, 'success')
    deleteTarget.value = null
    load(page.value)
  } catch (e: any) {
    toast.push(e?.message || '停用失败', 'error')
  }
}

async function submitAdd(): Promise<void> {
  try {
    await addAdminUser(addForm.value)
    toast.push('用户创建成功', 'success')
    showAdd.value = false
    addForm.value = { userEmail: '', password: '' }
    load(1)
  } catch (e: any) {
    toast.push(e?.message || '创建失败', 'error')
  }
}

function batchBan(): void {
  toast.push('批量封禁尚未接入后端，操作未执行', 'error')
  selected.value = []
  load(1)
}

function batchDelete(): void {
  toast.push('批量删除尚未接入后端，操作未执行', 'error')
  selected.value = []
  load(1)
}

function hideImg(e: Event) {
  (e.target as HTMLElement).style.visibility = 'hidden'
}

onMounted(() => load(1))
</script>
