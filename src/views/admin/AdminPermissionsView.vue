<template>
  <div class="max-w-[1400px] mx-auto">
    <!-- ===== 页头 ===== -->
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div class="min-w-0">
        <h1 class="font-display text-2xl font-bold text-zinc-800 dark:text-zinc-100">权限管理</h1>
        <p class="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
          维护权限节点与接口权限码（网关按权限码匹配放行）；权限码创建后不可修改
        </p>
      </div>
      <button
        class="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-[5%] bg-gradient-to-r from-amber-400 to-orange-500 px-4 text-sm font-medium text-white transition-all hover:opacity-90 active:scale-95"
        @click="openCreate()"
      >
        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
        新建权限
      </button>
    </header>

    <!-- ===== 工具条：搜索 + 折叠控制 + 统计 ===== -->
    <div class="mt-7 flex flex-wrap items-center gap-2 border-b border-black/[0.06] pb-3 dark:border-white/[0.08]">
      <label class="relative min-w-[16rem] flex-1 sm:flex-none">
        <span class="sr-only">搜索权限名称或权限码</span>
        <svg class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
        <input
          v-model="keyword"
          type="search"
          name="keyword"
          autocomplete="off"
          placeholder="搜索权限名称 / 权限码"
          class="h-10 w-full rounded-[5%] bg-transparent pl-9 pr-3 text-sm text-zinc-700 outline-none ring-1 ring-inset ring-zinc-200/70 transition-all placeholder:text-zinc-400 focus:ring-2 focus:ring-amber-400/60 dark:text-zinc-200 dark:ring-zinc-800"
        />
      </label>
      <button
        class="h-10 rounded-[5%] px-3 text-xs text-zinc-500 transition-colors hover:bg-black/[0.04] hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-white/[0.06] dark:hover:text-zinc-200"
        @click="toggleAll"
      >{{ allExpanded ? '全部收起' : '全部展开' }}</button>
      <span class="ml-auto text-xs text-zinc-400">
        共 <span class="font-numeric font-medium text-zinc-600 dark:text-zinc-300">{{ rows.length }}</span> 个节点
        <template v-if="keyword.trim()">（已过滤）</template>
      </span>
    </div>

    <!-- ===== 权限树 ===== -->
    <AdminTable
      :columns="columns"
      :rows="rows"
      row-key-field="permissionId"
      :loading="loading"
      empty-text="没有匹配的权限节点"
    >
      <template #cell-permissionName="{ row }">
        <div class="flex min-w-0 items-center gap-1.5" :style="{ paddingLeft: rowDepth(row) + 'px' }">
          <button
            v-if="hasChildren(row)"
            type="button"
            class="shrink-0 rounded-[5%] p-0.5 text-zinc-400 transition-colors hover:bg-black/[0.05] hover:text-zinc-600 dark:hover:bg-white/[0.08] dark:hover:text-zinc-200"
            :aria-expanded="isExpanded(row)"
            :aria-label="isExpanded(row) ? '收起子节点' : '展开子节点'"
            @click="toggle(row)"
          >
            <svg class="h-3.5 w-3.5 transition-transform duration-200" :class="isExpanded(row) ? 'rotate-90' : ''" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6" /></svg>
          </button>
          <span v-else class="w-4 shrink-0"></span>
          <span class="truncate text-sm font-medium text-zinc-700 dark:text-zinc-200">{{ row.permissionName }}</span>
        </div>
      </template>

      <template #cell-permissionCode="{ row }">
        <code class="text-xs text-zinc-500 dark:text-zinc-400">{{ row.permissionCode }}</code>
      </template>

      <template #cell-permissionType="{ row }">
        <span class="rounded-full px-2 py-0.5 text-xs font-medium" :class="typeClass(row.permissionType)">{{ permissionTypeText(row.permissionType) }}</span>
      </template>

      <template #cell-url="{ row }">
        <span class="text-xs text-zinc-500 dark:text-zinc-400">{{ row.url || '—' }}</span>
      </template>

      <template #actions="{ row }">
        <button class="h-8 rounded-[5%] px-2.5 text-xs text-amber-600 transition-colors hover:bg-amber-500/10 dark:text-amber-400" @click="openCreate(row)">新建子级</button>
        <button class="h-8 rounded-[5%] px-2.5 text-xs text-zinc-500 transition-colors hover:bg-black/[0.04] hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-white/[0.06] dark:hover:text-zinc-200" @click="openEdit(row)">编辑</button>
        <button class="h-8 rounded-[5%] px-2.5 text-xs text-red-500 transition-colors hover:bg-red-500/10" @click="deleteTarget = row">删除</button>
      </template>
    </AdminTable>

    <!-- ===== 新建 / 编辑 ===== -->
    <AdminModal :open="editOpen" :title="editing ? '编辑权限' : '新建权限'" width="w-[680px]" @close="editOpen = false">
      <div class="grid grid-cols-2 gap-x-5 gap-y-4">
        <label class="col-span-2 block sm:col-span-1">
          <span class="mb-1.5 block text-[11px] text-zinc-500 dark:text-zinc-400">权限名称</span>
          <input v-model="form.permissionName" name="permissionName" aria-label="权限名称" class="w-full h-10 rounded-[5%] bg-transparent px-3 text-sm text-zinc-700 outline-none ring-1 ring-inset ring-zinc-200/70 transition-all focus:ring-2 focus:ring-amber-400/60 dark:text-zinc-200 dark:ring-zinc-800" placeholder="如：读取待审核内容" />
        </label>

        <label class="col-span-2 block sm:col-span-1">
          <span class="mb-1.5 block text-[11px] text-zinc-500 dark:text-zinc-400">
            权限码 <template v-if="editing">（不可修改）</template>
          </span>
          <input
            v-model="form.permissionCode"
            name="permissionCode"
            aria-label="权限码"
            :readonly="!!editing"
            :class="editing ? 'cursor-not-allowed text-zinc-400 dark:text-zinc-500' : ''"
            class="w-full h-10 rounded-[5%] bg-transparent px-3 font-mono text-xs text-zinc-700 outline-none ring-1 ring-inset ring-zinc-200/70 transition-all focus:ring-2 focus:ring-amber-400/60 dark:text-zinc-200 dark:ring-zinc-800"
            placeholder="如 api:audit:read"
          />
        </label>

        <label class="col-span-2 block sm:col-span-1">
          <span class="mb-1.5 block text-[11px] text-zinc-500 dark:text-zinc-400">类型</span>
          <select v-model.number="form.permissionType" name="permissionType" aria-label="权限类型" class="h-10 w-full rounded-[5%] bg-transparent px-3 text-sm text-zinc-700 outline-none ring-1 ring-inset ring-zinc-200/70 transition-all focus:ring-2 focus:ring-amber-400/60 dark:text-zinc-200 dark:ring-zinc-800">
            <option :value="1">目录（可含子节点，授权即放行全部子孙）</option>
            <option :value="2">按钮（页面内操作点）</option>
            <option :value="3">接口（网关按权限码匹配）</option>
          </select>
        </label>

        <label class="col-span-2 block sm:col-span-1">
          <span class="mb-1.5 block text-[11px] text-zinc-500 dark:text-zinc-400">父级</span>
          <select v-model="form.parentId" name="parentId" aria-label="父级权限" class="h-10 w-full rounded-[5%] bg-transparent px-3 text-sm text-zinc-700 outline-none ring-1 ring-inset ring-zinc-200/70 transition-all focus:ring-2 focus:ring-amber-400/60 dark:text-zinc-200 dark:ring-zinc-800">
            <option value="">无（根节点）</option>
            <option v-for="p in parentOptions" :key="p.permissionId" :value="p.permissionId">{{ '— '.repeat(p.depth) + p.permissionName }}</option>
          </select>
        </label>

        <label class="col-span-2 block sm:col-span-1">
          <span class="mb-1.5 block text-[11px] text-zinc-500 dark:text-zinc-400">接口地址（可空）</span>
          <input v-model="form.url" name="url" aria-label="接口地址" class="h-10 w-full rounded-[5%] bg-transparent px-3 font-mono text-xs text-zinc-700 outline-none ring-1 ring-inset ring-zinc-200/70 transition-all focus:ring-2 focus:ring-amber-400/60 dark:text-zinc-200 dark:ring-zinc-800" placeholder="如 /api/audit/{**catch-all}" />
        </label>

        <label class="col-span-2 block sm:col-span-1">
          <span class="mb-1.5 block text-[11px] text-zinc-500 dark:text-zinc-400">图标键（可空）</span>
          <input v-model="form.icon" name="icon" aria-label="图标键" class="h-10 w-full rounded-[5%] bg-transparent px-3 text-sm text-zinc-700 outline-none ring-1 ring-inset ring-zinc-200/70 transition-all focus:ring-2 focus:ring-amber-400/60 dark:text-zinc-200 dark:ring-zinc-800" placeholder="仅侧栏目录使用" />
        </label>

        <label class="col-span-2 block sm:col-span-1">
          <span class="mb-1.5 block text-[11px] text-zinc-500 dark:text-zinc-400">排序号（同级升序）</span>
          <input v-model.number="form.sortOrder" type="number" name="sortOrder" aria-label="排序号" class="h-10 w-full rounded-[5%] bg-transparent px-3 text-sm text-zinc-700 outline-none ring-1 ring-inset ring-zinc-200/70 transition-all focus:ring-2 focus:ring-amber-400/60 dark:text-zinc-200 dark:ring-zinc-800" />
        </label>
      </div>

      <template #footer>
        <button class="h-10 rounded-[5%] px-4 text-sm text-zinc-500 transition-colors hover:bg-black/[0.04] dark:text-zinc-400 dark:hover:bg-white/[0.06]" @click="editOpen = false">取消</button>
        <button class="h-10 rounded-[5%] bg-gradient-to-r from-amber-400 to-orange-500 px-4 text-sm font-medium text-white transition-all active:scale-95 disabled:opacity-50" :disabled="saving" @click="save">{{ saving ? '提交中…' : (editing ? '保存' : '创建') }}</button>
      </template>
    </AdminModal>

    <!-- ===== 删除确认 ===== -->
    <ConfirmDialog
      v-if="deleteTarget"
      danger
      title="删除权限（软删除）"
      :message="'确定删除权限「' + deleteTarget.permissionName + '」吗？删除前请确保其下无子节点，且没有角色正在引用该权限码。'"
      confirm-text="删除"
      @close="deleteTarget = null"
      @confirm="doDelete"
    />
  </div>
</template>

<script lang="ts">
export default { name: 'AdminPermissionsView' }
</script>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AdminTable from '@/components/admin/AdminTable.vue'
import AdminModal from '@/components/admin/AdminModal.vue'
import ConfirmDialog from '@/components/admin/ConfirmDialog.vue'
import { getPermissionTree, createPermission, updatePermission, deletePermission, permissionTypeText } from '@/api/permission'
import type { PermissionNode } from '@/api/permission'
import { useToastStore } from '@/stores/toast'
import { unwrap } from '@/utils/response'

const toast = useToastStore()

const columns = [
  { key: 'permissionName', label: '权限名称' },
  { key: 'permissionCode', label: '权限码' },
  { key: 'permissionType', label: '类型' },
  { key: 'url', label: '接口地址' }
]

const tree = ref<PermissionNode[]>([])
const allRows = ref<any[]>([])
const loading = ref(false)
const keyword = ref('')
const saving = ref(false)

const collapsed = ref<Set<string>>(new Set())
const allExpanded = ref(true)

const editOpen = ref(false)
const editing = ref<any>(null)
const deleteTarget = ref<any>(null)

const form = ref({
  permissionCode: '',
  permissionName: '',
  permissionType: 3,
  parentId: '',
  url: '',
  icon: '',
  sortOrder: 0
})

/** 树 → 带 depth 的扁平行（父先于子） */
function flatten(nodes: PermissionNode[], depth = 0, out: any[] = []): any[] {
  for (const n of nodes) {
    out.push({ ...n, depth })
    if (n.children && n.children.length) flatten(n.children, depth + 1, out)
  }
  return out
}

const rowsById = computed(() => {
  const map = new Map<string, any>()
  for (const r of allRows.value) map.set(r.permissionId, r)
  return map
})

function hasChildren(row: any): boolean {
  return Array.isArray(row.children) && row.children.length > 0
}

/** 表格插槽内 row 为 Record<string, any>，缩进按层级折算像素 */
function rowDepth(row: any): number {
  return (row.depth || 0) * 18
}

function isExpanded(row: any): boolean {
  return !collapsed.value.has(row.permissionId)
}

function toggle(row: any): void {
  const next = new Set(collapsed.value)
  if (next.has(row.permissionId)) next.delete(row.permissionId)
  else next.add(row.permissionId)
  collapsed.value = next
}

function toggleAll(): void {
  if (allExpanded.value) {
    collapsed.value = new Set(allRows.value.filter(hasChildren).map((r) => r.permissionId))
  } else {
    collapsed.value = new Set()
  }
  allExpanded.value = !allExpanded.value
}

/** 命中关键词的节点及其全部祖先（保留层级上下文） */
function matchedIds(): Set<string> | null {
  const kw = keyword.value.trim().toLowerCase()
  if (!kw) return null
  const keep = new Set<string>()
  const walk = (nodes: PermissionNode[], trail: string[]): boolean => {
    let hitAny = false
    for (const n of nodes) {
      const self = n.permissionName.toLowerCase().includes(kw) || n.permissionCode.toLowerCase().includes(kw)
      const hitChild = n.children && n.children.length ? walk(n.children, [...trail, n.permissionId]) : false
      if (self || hitChild) {
        hitAny = true
        keep.add(n.permissionId)
        trail.forEach((id) => keep.add(id))
      }
    }
    return hitAny
  }
  walk(tree.value, [])
  return keep
}

/** 折叠 + 关键词过滤后的可见行 */
const rows = computed(() => {
  const matched = matchedIds()
  const visible = allRows.value.filter((r) => {
    if (matched && !matched.has(r.permissionId)) return false
    // 任一祖先被折叠则隐藏
    let parentId = r.parentId
    while (parentId) {
      if (collapsed.value.has(parentId)) return false
      parentId = rowsById.value.get(parentId)?.parentId ?? null
    }
    return true
  })
  return visible
})

function typeClass(t: number): string {
  return {
    1: 'bg-amber-400/15 text-amber-600 dark:text-amber-400',
    2: 'bg-blue-400/15 text-blue-600 dark:text-blue-400',
    3: 'bg-zinc-400/15 text-zinc-500 dark:text-zinc-400'
  }[t] || 'bg-zinc-400/15 text-zinc-500 dark:text-zinc-400'
}

/** 编辑时父级下拉需排除自身及其子孙，避免形成环 */
const parentOptions = computed(() => {
  if (!editing.value) return allRows.value
  const excluded = new Set<string>()
  const walk = (n: PermissionNode) => {
    excluded.add(n.permissionId)
    ;(n.children || []).forEach(walk)
  }
  const find = (nodes: PermissionNode[]): PermissionNode | null => {
    for (const n of nodes) {
      if (n.permissionId === editing.value.permissionId) return n
      const hit = find(n.children || [])
      if (hit) return hit
    }
    return null
  }
  const self = find(tree.value)
  if (self) walk(self)
  return allRows.value.filter((r) => !excluded.has(r.permissionId))
})

function resetForm(): void {
  form.value = { permissionCode: '', permissionName: '', permissionType: 3, parentId: '', url: '', icon: '', sortOrder: 0 }
}

async function load(): Promise<void> {
  loading.value = true
  try {
    // Identity 为裸响应：unwrap 取出根节点数组
    const data: any = unwrap(await getPermissionTree())
    tree.value = Array.isArray(data) ? data : []
    allRows.value = flatten(tree.value)
  } catch (e) {
    tree.value = []
    allRows.value = []
    toast.push(apiError(e, '加载权限树失败'), 'error')
  } finally {
    loading.value = false
  }
}

function apiError(e: any, fallback: string): string {
  const body = e?.response?.data
  return body?.error || body?.message || (e?.message !== 'Error' ? e?.message : '') || fallback
}

function openCreate(parent?: any): void {
  editing.value = null
  resetForm()
  form.value.parentId = parent ? parent.permissionId : ''
  if (parent) form.value.permissionType = 3
  editOpen.value = true
}

function openEdit(row: any): void {
  editing.value = row
  form.value = {
    permissionCode: row.permissionCode,
    permissionName: row.permissionName,
    permissionType: row.permissionType,
    parentId: row.parentId || '',
    url: row.url || '',
    icon: row.icon || '',
    sortOrder: row.sortOrder || 0
  }
  editOpen.value = true
}

async function save(): Promise<void> {
  if (!form.value.permissionName.trim()) {
    toast.push('请填写权限名称', 'error')
    return
  }
  if (!editing.value && !form.value.permissionCode.trim()) {
    toast.push('请填写权限码', 'error')
    return
  }

  saving.value = true
  try {
    if (editing.value) {
      // 更新语义：null=不修改父级，全零 GUID=移至根；空串=清除 Url/Icon
      await updatePermission(editing.value.permissionId, {
        permissionName: form.value.permissionName.trim(),
        permissionType: Number(form.value.permissionType),
        parentId: form.value.parentId || '00000000-0000-0000-0000-000000000000',
        url: form.value.url.trim(),
        icon: form.value.icon.trim(),
        sortOrder: Number(form.value.sortOrder) || 0
      })
      toast.push('权限已更新', 'success')
    } else {
      await createPermission({
        permissionCode: form.value.permissionCode.trim(),
        permissionName: form.value.permissionName.trim(),
        permissionType: Number(form.value.permissionType),
        parentId: form.value.parentId || null,
        url: form.value.url.trim() || null,
        icon: form.value.icon.trim() || null,
        sortOrder: Number(form.value.sortOrder) || 0
      })
      toast.push('权限已创建', 'success')
    }
    editOpen.value = false
    await load()
  } catch (e: any) {
    toast.push(apiError(e, '保存失败'), 'error')
  } finally {
    saving.value = false
  }
}

async function doDelete(): Promise<void> {
  if (!deleteTarget.value) return
  try {
    await deletePermission(deleteTarget.value.permissionId)
    toast.push('权限已删除', 'success')
    deleteTarget.value = null
    await load()
  } catch (e: any) {
    toast.push(apiError(e, '删除失败'), 'error')
  }
}

onMounted(load)
</script>
