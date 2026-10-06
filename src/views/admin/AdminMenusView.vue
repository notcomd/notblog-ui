<template>
  <div class="max-w-[1400px] mx-auto space-y-5">
    <div class="flex flex-row items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold text-zinc-800 dark:text-zinc-100">菜单管理</h1>
        <p class="text-sm text-zinc-400 mt-1">管理端侧栏导航配置（层级 / 排序 / 图标 / 启用 / 权限与角色可见性）</p>
      </div>
      <button class="px-4 h-10 rounded-[5%] text-sm font-medium bg-gradient-to-r from-amber-400 to-orange-500 text-white active:scale-95 transition-all inline-flex items-center gap-1.5" @click="openCreate()">
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
        新建菜单
      </button>
    </div>

    <AdminTable :columns="columns" :rows="rows" row-key-field="menuId" :loading="loading" empty-text="暂无菜单">
      <template #cell-menuName="{ row }">
        <div class="flex items-center gap-2" :style="{ paddingLeft: rowDepth(row) + 'px' }">
          <span class="shrink-0 text-zinc-500 dark:text-zinc-400" v-html="rowIcon(row)"></span>
          <span class="text-sm font-medium text-zinc-700 dark:text-zinc-200">{{ row.menuName }}</span>
        </div>
      </template>
      <template #cell-menuType="{ row }">
        <span class="text-xs px-2 py-1 rounded-full font-medium" :class="row.menuType === 1 ? 'bg-blue-400/15 text-amber-600' : 'bg-zinc-400/15 text-zinc-500 dark:text-zinc-400'">
          {{ row.menuType === 1 ? '目录' : '菜单项' }}
        </span>
      </template>
      <template #cell-url="{ row }">
        <span class="text-xs font-mono text-zinc-500 dark:text-zinc-400">{{ row.url || '—' }}</span>
      </template>
      <template #cell-isEnabled="{ row }">
        <span class="text-xs px-2 py-1 rounded-full font-medium" :class="row.isEnabled ? 'bg-emerald-400/15 text-emerald-500' : 'bg-red-500/15 text-red-500'">
          {{ row.isEnabled ? '启用' : '停用' }}
        </span>
      </template>
      <template #actions="{ row }">
        <button class="px-2.5 h-8 rounded-[5%] text-xs text-amber-600 hover:bg-amber-500/10 transition-colors" @click="openEdit(row)">编辑</button>
        <button class="px-2.5 h-8 rounded-[5%] text-xs transition-colors" :class="row.isEnabled ? 'text-zinc-500 hover:bg-zinc-500/10 dark:text-zinc-400' : 'text-emerald-500 hover:bg-emerald-500/10'" @click="toggleEnabled(row)">{{ row.isEnabled ? '停用' : '启用' }}</button>
        <button class="px-2.5 h-8 rounded-[5%] text-xs text-red-500 hover:bg-red-500/10 transition-colors" @click="deleteTarget = row">删除</button>
      </template>
    </AdminTable>

    <!-- 新建 / 编辑菜单 -->
    <AdminModal v-if="editOpen" :title="editing ? '编辑菜单' : '新建菜单'" width="w-[720px]" @close="editOpen = false">
      <div class="grid grid-cols-2 gap-4">
        <label class="block">
          <span class="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">菜单名称</span>
          <input v-model="form.menuName" name="menuName" aria-label="菜单名称" class="w-full h-10 px-3.5 rounded-[5%] bg-transparent ring-1 ring-inset ring-zinc-200/70 dark:ring-zinc-800 text-sm outline-none focus:ring-2 focus:ring-amber-400/50 transition-all" placeholder="如：用户管理" />
        </label>
        <label class="block">
          <span class="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">类型</span>
          <select v-model.number="form.menuType" name="menuType" aria-label="菜单类型" class="w-full h-10 px-3 rounded-[5%] bg-transparent ring-1 ring-inset ring-zinc-200/70 dark:ring-zinc-800 text-sm outline-none focus:ring-2 focus:ring-amber-400/50 transition-all">
            <option :value="1">目录</option>
            <option :value="2">菜单项</option>
          </select>
        </label>
        <label class="block">
          <span class="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">父级</span>
          <select v-model="form.parentId" name="parentId" aria-label="父级菜单" class="w-full h-10 px-3 rounded-[5%] bg-transparent ring-1 ring-inset ring-zinc-200/70 dark:ring-zinc-800 text-sm outline-none focus:ring-2 focus:ring-amber-400/50 transition-all">
            <option value="">无（根菜单）</option>
            <option v-for="p in parentOptions" :key="p.menuId" :value="p.menuId">{{ '— '.repeat(p.depth) + p.menuName }}</option>
          </select>
        </label>
        <label class="block">
          <span class="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">图标</span>
          <select v-model="form.icon" name="icon" aria-label="菜单图标" class="w-full h-10 px-3 rounded-[5%] bg-transparent ring-1 ring-inset ring-zinc-200/70 dark:ring-zinc-800 text-sm outline-none focus:ring-2 focus:ring-amber-400/50 transition-all">
            <option value="">默认</option>
            <option v-for="key in iconKeys" :key="key" :value="key">{{ key }}</option>
          </select>
        </label>
        <label class="block">
          <span class="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">路由路径</span>
          <input v-model="form.url" name="url" aria-label="路由路径" class="w-full h-10 px-3.5 rounded-[5%] bg-transparent ring-1 ring-inset ring-zinc-200/70 dark:ring-zinc-800 text-sm outline-none focus:ring-2 focus:ring-amber-400/50 transition-all" placeholder="如 /admin/users（目录可留空）" />
        </label>
        <label class="block">
          <span class="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">排序号（同级升序）</span>
          <input v-model.number="form.sortOrder" type="number" name="sortOrder" aria-label="排序号" class="w-full h-10 px-3.5 rounded-[5%] bg-transparent ring-1 ring-inset ring-zinc-200/70 dark:ring-zinc-800 text-sm outline-none focus:ring-2 focus:ring-amber-400/50 transition-all" />
        </label>
        <label class="block">
          <span class="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">可见所需权限码（可空）</span>
          <input v-model="form.requiredPermissionCode" name="requiredPermissionCode" aria-label="可见所需权限码" class="w-full h-10 px-3.5 rounded-[5%] bg-transparent ring-1 ring-inset ring-zinc-200/70 dark:ring-zinc-800 text-sm outline-none focus:ring-2 focus:ring-amber-400/50 transition-all" placeholder="如 api:identity:manage" />
        </label>
        <label class="block">
          <span class="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">可见所需角色（逗号分隔，可空）</span>
          <input v-model="form.requiredRole" name="requiredRole" aria-label="可见所需角色" class="w-full h-10 px-3.5 rounded-[5%] bg-transparent ring-1 ring-inset ring-zinc-200/70 dark:ring-zinc-800 text-sm outline-none focus:ring-2 focus:ring-amber-400/50 transition-all" placeholder="如 Root,Administrator" />
        </label>
        <!-- 启用开关仅编辑态可控：CreateMenuCommand 无 IsEnabled 字段，新建恒为「启用」 -->
        <label v-if="editing" class="flex items-center gap-2 col-span-2">
          <input v-model="form.isEnabled" type="checkbox" class="accent-amber-500" name="isEnabled" aria-label="启用菜单" />
          <span class="text-sm text-zinc-600 dark:text-zinc-300">启用（停用后不参与侧栏渲染）</span>
        </label>
        <p v-else class="col-span-2 text-xs text-zinc-400">新建菜单默认为「启用」；如需停用，请创建后在列表中关闭。</p>
      </div>
      <template #footer>
        <button class="px-4 h-10 rounded-[5%] text-sm text-zinc-500 dark:text-zinc-400 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-all" @click="editOpen = false">取消</button>
        <button class="px-4 h-10 rounded-[5%] text-sm font-medium bg-gradient-to-r from-amber-400 to-orange-500 text-white active:scale-95 transition-all" @click="save">{{ editing ? '保存' : '创建' }}</button>
      </template>
    </AdminModal>

    <!-- 删除确认 -->
    <ConfirmDialog
      v-if="deleteTarget"
      danger
      title="删除菜单（软删除）"
      :message="'确定删除菜单「' + deleteTarget.menuName + '」吗？删除前请确保其下无子菜单。'"
      confirm-text="删除"
      @close="deleteTarget = null"
      @confirm="doDelete"
    />
  </div>
</template>

<script lang="ts">
export default { name: 'AdminMenusView' }
</script>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AdminTable from '@/components/admin/AdminTable.vue'
import AdminModal from '@/components/admin/AdminModal.vue'
import ConfirmDialog from '@/components/admin/ConfirmDialog.vue'
import { getAdminMenuTree, createMenu, updateMenu, deleteMenu } from '@/api/menu'
import type { MenuInput, MenuNode } from '@/api/menu'
import { MENU_ICONS, resolveMenuIcon } from '@/components/admin/menuIcons'
import { useToastStore } from '@/stores/toast'

const toast = useToastStore()

const columns = [
  { key: 'menuName', label: '菜单名称' },
  { key: 'menuType', label: '类型' },
  { key: 'url', label: '路由路径' },
  { key: 'sortOrder', label: '排序' },
  { key: 'isEnabled', label: '状态' }
]

const iconKeys = Object.keys(MENU_ICONS)

// 表格插槽内 row 为 Record<string, unknown>，用 any 形参承接避免模板类型报错
function rowDepth(row: any): number {
  return (row.depth || 0) * 18
}

function rowIcon(row: any): string {
  return resolveMenuIcon(row.icon)
}

const tree = ref<MenuNode[]>([])
const rows = ref<any[]>([])
const loading = ref(false)

const editOpen = ref(false)
const editing = ref<any>(null)
const deleteTarget = ref<any>(null)

const form = ref({
  menuName: '',
  menuType: 2,
  parentId: '',
  url: '',
  icon: '',
  sortOrder: 0,
  isEnabled: true,
  requiredPermissionCode: '',
  requiredRole: ''
})

// 树 → 带 depth 的扁平行（父先于子，供表格缩进展示）
function flatten(nodes: MenuNode[], depth = 0, out: any[] = []): any[] {
  for (const n of nodes) {
    out.push({ ...n, depth })
    if (n.children && n.children.length) flatten(n.children, depth + 1, out)
  }
  return out
}

// 编辑时父级下拉需排除自身及其子孙，避免形成循环
const parentOptions = computed(() => {
  if (!editing.value) return rows.value
  const excluded = new Set<string>()
  const walk = (n: MenuNode) => {
    excluded.add(n.menuId)
    ;(n.children || []).forEach(walk)
  }
  const find = (nodes: MenuNode[]): MenuNode | null => {
    for (const n of nodes) {
      if (n.menuId === editing.value.menuId) return n
      const hit = find(n.children || [])
      if (hit) return hit
    }
    return null
  }
  const self = find(tree.value)
  if (self) walk(self)
  return rows.value.filter((r) => !excluded.has(r.menuId))
})

async function load(): Promise<void> {
  loading.value = true
  try {
    const res = await getAdminMenuTree()
    const data: any = res && res.data ? res.data : res
    tree.value = Array.isArray(data) ? data : []
    rows.value = flatten(tree.value)
  } catch (e) {
    console.error('加载菜单失败:', e)
    toast.push('加载菜单失败', 'error')
  } finally {
    loading.value = false
  }
}

function resetForm(): void {
  form.value = {
    menuName: '',
    menuType: 2,
    parentId: '',
    url: '',
    icon: '',
    sortOrder: 0,
    isEnabled: true,
    requiredPermissionCode: '',
    requiredRole: ''
  }
}

function openCreate(): void {
  editing.value = null
  resetForm()
  editOpen.value = true
}

function openEdit(row: any): void {
  editing.value = row
  form.value = {
    menuName: row.menuName,
    menuType: row.menuType,
    parentId: row.parentId || '',
    url: row.url || '',
    icon: row.icon || '',
    sortOrder: row.sortOrder || 0,
    isEnabled: row.isEnabled,
    requiredPermissionCode: row.requiredPermissionCode || '',
    requiredRole: row.requiredRole || ''
  }
  editOpen.value = true
}

async function save(): Promise<void> {
  if (!form.value.menuName.trim()) {
    toast.push('请填写菜单名称', 'error')
    return
  }

  const payload: MenuInput = {
    menuName: form.value.menuName.trim(),
    menuType: form.value.menuType,
    url: form.value.url.trim(),
    icon: form.value.icon,
    sortOrder: Number(form.value.sortOrder) || 0,
    requiredPermissionCode: form.value.requiredPermissionCode.trim(),
    requiredRole: form.value.requiredRole.trim()
  }
  // IsEnabled 只存在于 UpdateMenuCommand：CreateMenuCommand 无此字段（会被忽略），故创建时不发送
  if (editing.value) payload.isEnabled = form.value.isEnabled

  try {
    if (editing.value) {
      // 更新语义：null=不修改父级，Guid.Empty=移至根
      payload.parentId = form.value.parentId || '00000000-0000-0000-0000-000000000000'
      await updateMenu(editing.value.menuId, payload)
      toast.push('菜单已更新', 'success')
    } else {
      payload.parentId = form.value.parentId || null
      await createMenu(payload)
      toast.push('菜单已创建', 'success')
    }
    editOpen.value = false
    await load()
  } catch (e: any) {
    toast.push(e?.message || '保存失败', 'error')
  }
}

async function toggleEnabled(row: any): Promise<void> {
  try {
    await updateMenu(row.menuId, { isEnabled: !row.isEnabled })
    toast.push(row.isEnabled ? '菜单已停用' : '菜单已启用', 'success')
    await load()
  } catch (e: any) {
    toast.push(e?.message || '操作失败', 'error')
  }
}

async function doDelete(): Promise<void> {
  if (!deleteTarget.value) return
  try {
    await deleteMenu(deleteTarget.value.menuId)
    toast.push('菜单已删除', 'success')
    deleteTarget.value = null
    await load()
  } catch (e: any) {
    toast.push(e?.message || '删除失败', 'error')
  }
}

onMounted(load)
</script>