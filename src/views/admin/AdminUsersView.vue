<template>
  <div class="max-w-[1400px] mx-auto space-y-5">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-zinc-800 dark:text-zinc-100">用户管理</h1>
        <p class="text-sm text-zinc-400 mt-1">用户列表与管控（列表/封禁/删除已接入；批量封禁/删除后端未实现）</p>
      </div>
      <button class="px-4 h-10 rounded-[5%] text-sm font-medium bg-gradient-to-r from-amber-400 to-orange-500 text-white hover: active:scale-95 transition-all" @click="showAdd = true">＋ 添加用户</button>
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
        <input v-model="keyword" class="h-10 w-64 px-4 rounded-[5%] bg-white/60 dark:bg-zinc-800/60 border border-white/50 dark:border-white/10 text-sm outline-none focus:ring-2 focus:ring-amber-400/50 transition-all" placeholder="搜索用户名 / ID / 邮箱" @keyup.enter="load(1)" />
        <select v-model="status" class="h-10 px-3 rounded-[5%] bg-white/60 dark:bg-zinc-800/60 border border-white/50 dark:border-white/10 text-sm outline-none" @change="load(1)">
          <option value="all">全部状态</option>
          <option value="Normal">正常</option>
          <option value="Banned">已封禁</option>
          <option value="Online">在线中</option>
        </select>
        <button class="h-10 px-3 rounded-[5%] text-sm bg-white/60 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-300 hover: transition-all" @click="load(1)">搜索</button>
        <div v-if="selected.length" class="flex items-center gap-2 ml-2">
          <span class="text-xs text-zinc-400">已选 {{ selected.length }} 项</span>
          <button disabled title="后端缺口，暂不可用" class="h-8 px-3 rounded-[5%] text-xs bg-red-500/10 text-red-500/50 cursor-not-allowed transition-colors" @click="batchBan">批量封禁</button>
          <button disabled title="后端缺口，暂不可用" class="h-8 px-3 rounded-[5%] text-xs bg-red-500/10 text-red-500/50 cursor-not-allowed transition-colors" @click="batchDelete">批量删除</button>
        </div>
      </template>

      <template #cell-userName="{ row }">
        <div class="flex items-center gap-2.5">
          <img v-if="row.imageCover" :src="row.imageCover as string" alt="" class="w-9 h-9 rounded-full object-cover border border-white/60 dark:border-white/10" @error="hideImg" />
          <span v-else class="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs">{{ String(row.userName || '?').slice(0, 1) }}</span>
          <div>
            <div class="font-medium text-zinc-700 dark:text-zinc-200">{{ row.userName }}</div>
            <div class="text-[11px] text-zinc-400">{{ row.userEmail }}</div>
          </div>
        </div>
      </template>

      <template #cell-status="{ row }">
        <span class="text-xs px-2 py-1 rounded-full font-medium" :class="statusClass(row.status as string)">{{ statusText(row.status as string) }}</span>
      </template>

      <template #cell-createDatetime="{ row }">
        <span class="text-xs text-zinc-500 dark:text-zinc-400">{{ relativeTime(row.createDatetime as string | number | Date) }}</span>
      </template>

      <template #cell-lastOnline="{ row }">
        <span class="text-xs text-zinc-500 dark:text-zinc-400">{{ row.lastOnline ? relativeTime(row.lastOnline as string | number | Date) : '离线' }}</span>
      </template>

      <template #actions="{ row }">
        <button class="px-2.5 h-8 rounded-[5%] text-xs text-amber-600 hover:bg-amber-500/10 transition-colors" @click="viewUser(row)">查看</button>
        <button v-if="row.status !== 'Banned'" class="px-2.5 h-8 rounded-[5%] text-xs text-red-500 hover:bg-red-500/10 transition-colors" @click="banUser(row)">封禁</button>
        <button class="px-2.5 h-8 rounded-[5%] text-xs text-red-500 hover:bg-red-500/10 transition-colors" @click="deleteUser(row)">删除</button>
      </template>
    </AdminTable>

    <!-- 添加用户 -->
    <AdminModal v-if="showAdd" title="添加用户" @close="showAdd = false">
      <div class="space-y-3">
        <input v-model="addForm.userName" placeholder="用户名（必填）" class="w-full h-10 px-3.5 rounded-[5%] bg-white/70 dark:bg-zinc-800/70 border border-white/60 dark:border-white/10 text-sm outline-none focus:ring-2 focus:ring-amber-400/50 transition-all" />
        <input v-model="addForm.userEmail" placeholder="邮箱（必填）" class="w-full h-10 px-3.5 rounded-[5%] bg-white/70 dark:bg-zinc-800/70 border border-white/60 dark:border-white/10 text-sm outline-none focus:ring-2 focus:ring-amber-400/50 transition-all" />
        <input v-model="addForm.password" type="password" placeholder="初始密码（必填）" class="w-full h-10 px-3.5 rounded-[5%] bg-white/70 dark:bg-zinc-800/70 border border-white/60 dark:border-white/10 text-sm outline-none focus:ring-2 focus:ring-amber-400/50 transition-all" />
        <select v-model="addForm.role" class="w-full h-10 px-3 rounded-[5%] bg-white/70 dark:bg-zinc-800/70 border border-white/60 dark:border-white/10 text-sm outline-none">
          <option value="Member">普通用户</option>
          <option value="Admin">管理员</option>
        </select>
      </div>
      <template #footer>
        <button class="px-4 h-10 rounded-[5%] text-sm text-zinc-500 hover:bg-white/60 dark:hover:bg-zinc-800/60 transition-all dark:text-zinc-400" @click="showAdd = false">取消</button>
        <button class="px-4 h-10 rounded-[5%] text-sm font-medium bg-gradient-to-r from-amber-400 to-orange-500 text-white active:scale-95 transition-all" :disabled="!addForm.userName || !addForm.userEmail || !addForm.password" @click="submitAdd">创建</button>
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
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
          <div class="rounded-[5%] bg-white/60 dark:bg-zinc-800/60 py-3">
            <div class="text-lg font-bold text-zinc-800 dark:text-zinc-100">{{ viewing.postCount || 0 }}</div>
            <div class="text-[11px] text-zinc-400">发布内容</div>
          </div>
          <div class="rounded-[5%] bg-white/60 dark:bg-zinc-800/60 py-3">
            <div class="text-lg font-bold text-zinc-800 dark:text-zinc-100">{{ viewing.commentCount || 0 }}</div>
            <div class="text-[11px] text-zinc-400">评论</div>
          </div>
          <div class="rounded-[5%] bg-white/60 dark:bg-zinc-800/60 py-3">
            <div class="text-lg font-bold text-zinc-800 dark:text-zinc-100">{{ relativeTime(viewing.createDatetime) }}</div>
            <div class="text-[11px] text-zinc-400">注册时间</div>
          </div>
        </div>
        <div v-if="viewing.banReason" class="px-4 py-3 rounded-[5%] bg-red-500/10 text-sm text-red-500">
          <svg class="w-3.5 h-3.5 inline-block align-[-2px] mr-1 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>封禁原因：{{ viewing.banReason }}
        </div>
      </div>
    </AdminModal>

    <!-- 封禁（二次确认 + 原因 + 时长） -->
    <AdminModal v-if="banTarget" title="封禁用户" @close="banTarget = null">
      <div class="space-y-3">
        <p class="text-sm text-zinc-500 dark:text-zinc-400">确定封禁 <b>{{ banTarget.userName }}</b> 吗？封禁后该用户无法登录，已发布内容全部隐藏。</p>
        <select v-model="banDuration" class="w-full h-10 px-3 rounded-[5%] bg-white/70 dark:bg-zinc-800/70 border border-white/60 dark:border-white/10 text-sm outline-none">
          <option value="7d">7 天</option>
          <option value="30d">30 天</option>
          <option value="forever">永久</option>
        </select>
        <input v-model="banReason" placeholder="封禁原因（必填）" class="w-full h-10 px-3.5 rounded-[5%] bg-white/70 dark:bg-zinc-800/70 border border-white/60 dark:border-white/10 text-sm outline-none focus:ring-2 focus:ring-red-500/50 transition-all" />
      </div>
      <template #footer>
        <button class="px-4 h-10 rounded-[5%] text-sm text-zinc-500 hover:bg-white/60 dark:hover:bg-zinc-800/60 transition-all dark:text-zinc-400" @click="banTarget = null">取消</button>
        <button class="px-4 h-10 rounded-[5%] text-sm font-medium bg-gradient-to-r from-red-500 to-rose-500 text-white active:scale-95 transition-all disabled:opacity-50" :disabled="!banReason.trim()" @click="submitBan(banReason)">确认封禁</button>
      </template>
    </AdminModal>

    <!-- 删除确认 -->
    <ConfirmDialog
      v-if="deleteTarget"
      danger
      title="彻底删除用户"
      :message="'确定彻底删除 ' + deleteTarget.userName + ' 吗？将删除该用户所有数据（含内容、评论、文件），不可恢复！'"
      confirm-text="永久删除"
      require-reason
      reason-placeholder="删除原因（必填）"
      @close="deleteTarget = null"
      @confirm="(reason) => submitDelete(reason)"
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
  { key: 'lastOnline', label: '最后在线' },
  { key: 'status', label: '状态' }
]

const users = ref<any[]>([])
const loading = ref(false)
const page = ref(1)
const pageSize = 10
const total = ref(0)
const keyword = ref('')
const status = ref('all')
const selected = ref<any[]>([])

const showAdd = ref(false)
const addForm = ref({ userName: '', userEmail: '', password: '', role: 'Member' })
const viewing = ref<any>(null)
const banTarget = ref<any>(null)
const banDuration = ref('7d')
const banReason = ref('')
const deleteTarget = ref<any>(null)

function statusClass(s: string): string {
  return {
    Normal: 'bg-emerald-400/15 text-emerald-500',
    Banned: 'bg-red-400/15 text-red-500',
    Online: 'bg-blue-400/15 text-amber-600'
  }[s] || 'bg-zinc-400/15 text-zinc-500 dark:text-zinc-400'
}

function statusText(s: string): string {
  return { Normal: '正常', Banned: '已封禁', Online: '在线中' }[s] || s
}

async function load(p?: number): Promise<void> {
  loading.value = true
  page.value = p || 1
  try {
    const res = await getAdminUsers({ page: page.value, pageSize, keyword: keyword.value })
    const data: any = res && res.data ? res.data : res
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
  banReason.value = ''
}

async function submitBan(reason: string): Promise<void> {
  try {
    await banAdminUser(banTarget.value.userGuid, reason, banDuration.value)
    toast.push(`已封禁 ${banTarget.value.userName}`, 'success')
    banTarget.value = null
    load(page.value)
  } catch (e) {
    toast.push('封禁失败，请重试', 'error')
  }
}

function deleteUser(row: any): void {
  deleteTarget.value = row
}

async function submitDelete(reason: string): Promise<void> {
  try {
    await deleteAdminUser(deleteTarget.value.userGuid, reason)
    toast.push(`已删除（停用）${deleteTarget.value.userName}`, 'success')
    deleteTarget.value = null
    load(page.value)
  } catch (e) {
    toast.push('删除失败', 'error')
  }
}

async function submitAdd(): Promise<void> {
  try {
    await addAdminUser({ email: addForm.value.userEmail, password: addForm.value.password })
    toast.push('用户创建成功', 'success')
    showAdd.value = false
    addForm.value = { userName: '', userEmail: '', password: '', role: 'Member' }
    load(1)
  } catch (e) {
    toast.push('创建失败', 'error')
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
