<template>
  <div class="max-w-[1400px] mx-auto">
    <!-- ===== 页头 ===== -->
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div class="min-w-0">
        <h1 class="font-display text-2xl font-bold text-zinc-800 dark:text-zinc-100">角色组管理</h1>
        <p class="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
          维护角色组及其权限分配；授权目录码即放行其全部子孙权限
        </p>
      </div>
      <button
        class="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-[5%] bg-gradient-to-r from-amber-400 to-orange-500 px-4 text-sm font-medium text-white transition-all hover:opacity-90 active:scale-95"
        @click="openCreate()"
      >
        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
        新建角色组
      </button>
    </header>

    <div class="mt-7 grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
      <!-- ===== 左：角色组列表 ===== -->
      <section class="min-w-0">
        <label class="relative block">
          <span class="sr-only">搜索角色组名称或编码</span>
          <svg class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
          <input
            v-model="keyword"
            type="search"
            name="groupKeyword"
            autocomplete="off"
            placeholder="搜索角色组名称 / 编码"
            class="h-10 w-full rounded-[5%] bg-transparent pl-9 pr-3 text-sm text-zinc-700 outline-none ring-1 ring-inset ring-zinc-200/70 transition-all placeholder:text-zinc-400 focus:ring-2 focus:ring-amber-400/60 dark:text-zinc-200 dark:ring-zinc-800"
          />
        </label>

        <div class="mt-3 border-t border-black/[0.06] dark:border-white/[0.08]">
          <!-- 骨架 -->
          <div v-if="loadingGroups" class="divide-y divide-black/[0.06] dark:divide-white/[0.08]">
            <div v-for="i in 4" :key="i" class="px-3 py-3.5">
              <div class="h-3.5 w-1/2 animate-pulse rounded bg-black/[0.06] dark:bg-white/[0.08]"></div>
              <div class="mt-2 h-3 w-1/3 animate-pulse rounded bg-black/[0.05] dark:bg-white/[0.06]"></div>
            </div>
          </div>
          <!-- 列表 -->
          <div v-else-if="filteredGroups.length" class="divide-y divide-black/[0.06] dark:divide-white/[0.08]">
            <button
              v-for="g in filteredGroups"
              :key="g.roleGroupGuid"
              type="button"
              class="block w-full px-3 py-3 text-left transition-colors"
              :class="g.roleGroupGuid === selectedId ? 'bg-amber-400/10' : 'hover:bg-black/[0.04] dark:hover:bg-white/[0.06]'"
              @click="selectGroup(g.roleGroupGuid)"
            >
              <div class="flex items-center gap-2">
                <span
                  class="truncate text-sm"
                  :class="g.roleGroupGuid === selectedId ? 'font-semibold text-zinc-900 dark:text-zinc-50' : 'font-medium text-zinc-700 dark:text-zinc-200'"
                >{{ g.roleGroupName }}</span>
                <span class="ml-auto shrink-0 text-[11px] font-numeric text-zinc-400">{{ g.permissionCount }} 权限 · {{ g.roleCount }} 角色</span>
              </div>
              <div class="mt-0.5 truncate font-mono text-xs text-zinc-400">{{ g.roleGroupCode }}</div>
            </button>
          </div>
          <!-- 空态 -->
          <div v-else class="px-3 py-14 text-center text-sm text-zinc-400">
            {{ keyword.trim() ? '没有匹配的角色组' : '暂无角色组' }}
          </div>
        </div>
      </section>

      <!-- ===== 右：基础信息 + 权限树 ===== -->
      <section class="min-w-0">
        <div v-if="!selectedGroup" class="py-20 text-center text-sm text-zinc-400">
          请从左侧选择一个角色组
        </div>

        <template v-else>
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div class="min-w-0">
              <h2 class="font-display text-xl font-bold text-zinc-800 dark:text-zinc-100">{{ selectedGroup.roleGroupName }}</h2>
              <p class="mt-1 font-mono text-xs text-zinc-400">{{ selectedGroup.roleGroupCode }}</p>
              <p class="mt-1 text-xs text-zinc-400">
                关联 <span class="font-numeric font-medium text-zinc-600 dark:text-zinc-300">{{ selectedGroup.roleCount }}</span> 个角色 ·
                已授权 <span class="font-numeric font-medium text-zinc-600 dark:text-zinc-300">{{ selectedGroup.permissionCount }}</span> 个权限
              </p>
            </div>
            <div class="flex items-center gap-1">
              <button class="h-8 rounded-[5%] px-2.5 text-xs text-amber-600 transition-colors hover:bg-amber-500/10 dark:text-amber-400" @click="openEdit(selectedGroup)">编辑</button>
              <button class="h-8 rounded-[5%] px-2.5 text-xs text-red-500 transition-colors hover:bg-red-500/10" @click="deleteTarget = selectedGroup">删除</button>
            </div>
          </div>

          <!-- 权限分配 -->
          <div class="mt-6 border-t border-black/[0.06] pt-4 dark:border-white/[0.08]">
            <div class="flex flex-wrap items-center gap-2">
              <h3 class="text-[11px] text-zinc-500 dark:text-zinc-400">权限分配</h3>
              <span class="text-[11px] text-zinc-400">
                已选 <span class="font-numeric font-medium text-zinc-600 dark:text-zinc-300">{{ checkedIds.size }}</span> 项
              </span>
              <div class="ml-auto flex items-center gap-1">
                <button
                  class="h-8 rounded-[5%] px-2.5 text-xs text-zinc-500 transition-colors hover:bg-black/[0.04] hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-white/[0.06] dark:hover:text-zinc-200"
                  @click="toggleAllExpand"
                >{{ allExpanded ? '全部收起' : '全部展开' }}</button>
                <button
                  class="h-8 rounded-[5%] px-2.5 text-xs text-zinc-500 transition-colors hover:bg-black/[0.04] hover:text-zinc-700 disabled:opacity-40 dark:text-zinc-400 dark:hover:bg-white/[0.06] dark:hover:text-zinc-200"
                  :disabled="checkedIds.size === 0"
                  @click="clearChecked"
                >清空已选</button>
              </div>
            </div>
            <p class="mt-1 text-[11px] text-zinc-400">
              勾选父级目录即放行其全部子孙权限；「保存权限」为全量覆盖，将提交所有已勾选节点（不只叶子）。
            </p>

            <label class="relative mt-3 block">
              <span class="sr-only">搜索权限名称或权限码</span>
              <svg class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
              <input
                v-model="permKeyword"
                type="search"
                name="permKeyword"
                autocomplete="off"
                placeholder="搜索权限名称 / 权限码"
                class="h-10 w-full rounded-[5%] bg-transparent pl-9 pr-3 text-sm text-zinc-700 outline-none ring-1 ring-inset ring-zinc-200/70 transition-all placeholder:text-zinc-400 focus:ring-2 focus:ring-amber-400/60 dark:text-zinc-200 dark:ring-zinc-800"
              />
            </label>

            <div class="mt-3 max-h-[440px] overflow-y-auto overscroll-contain border-t border-black/[0.06] dark:border-white/[0.08]">
              <!-- 骨架 -->
              <div v-if="permLoading" class="divide-y divide-black/[0.06] dark:divide-white/[0.08]">
                <div v-for="i in 6" :key="i" class="px-2 py-3">
                  <div class="h-3.5 w-2/3 animate-pulse rounded bg-black/[0.06] dark:bg-white/[0.08]"></div>
                </div>
              </div>
              <!-- 权限树 -->
              <div v-else-if="permRows.length" class="divide-y divide-black/[0.06] dark:divide-white/[0.08]">
                <div
                  v-for="row in permRows"
                  :key="row.permissionId"
                  class="flex items-center gap-2 py-2 pr-2 hover:bg-black/[0.03] dark:hover:bg-white/[0.045]"
                  :style="{ paddingLeft: row.depth * 18 + 2 + 'px' }"
                >
                  <button
                    v-if="hasChildren(row)"
                    type="button"
                    class="shrink-0 rounded-[5%] p-0.5 text-zinc-400 transition-colors hover:bg-black/[0.05] hover:text-zinc-600 dark:hover:bg-white/[0.08] dark:hover:text-zinc-200"
                    :aria-expanded="isExpanded(row.permissionId)"
                    :aria-label="isExpanded(row.permissionId) ? '收起子权限' : '展开子权限'"
                    @click="toggleNode(row.permissionId)"
                  >
                    <svg class="h-3.5 w-3.5 transition-transform duration-200" :class="isExpanded(row.permissionId) ? 'rotate-90' : ''" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6" /></svg>
                  </button>
                  <span v-else class="w-[18px] shrink-0"></span>
                  <input
                    type="checkbox"
                    class="shrink-0 accent-amber-500"
                    :checked="checkedIds.has(row.permissionId)"
                    :indeterminate="isIndeterminate(row)"
                    :aria-label="'勾选权限 ' + row.permissionName"
                    @change="toggleCheck(row)"
                  />
                  <span class="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium" :class="typeClass(row.permissionType)">{{ permissionTypeText(row.permissionType) }}</span>
                  <span class="truncate text-sm text-zinc-700 dark:text-zinc-200">{{ row.permissionName }}</span>
                  <code class="ml-auto shrink-0 text-[11px] text-zinc-400">{{ row.permissionCode }}</code>
                </div>
              </div>
              <!-- 空态 -->
              <div v-else class="px-2 py-14 text-center text-sm text-zinc-400">没有匹配的权限节点</div>
            </div>

            <div class="mt-4 flex items-center gap-3">
              <button
                class="h-10 rounded-[5%] bg-gradient-to-r from-amber-400 to-orange-500 px-4 text-sm font-medium text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
                :disabled="savingPerm || !permDirty"
                @click="savePermissions"
              >{{ savingPerm ? '保存中…' : '保存权限' }}</button>
              <span v-if="permDirty" class="text-xs text-amber-600 dark:text-amber-400">有未保存的更改</span>
              <span v-else class="text-xs text-zinc-400">权限与已保存一致</span>
            </div>
          </div>
        </template>
      </section>
    </div>

    <!-- ===== 新建 / 编辑角色组 ===== -->
    <AdminModal v-if="editOpen" :title="editing ? '编辑角色组' : '新建角色组'" width="w-[560px]" @close="editOpen = false">
      <div class="grid grid-cols-1 gap-y-4">
        <label class="block">
          <span class="mb-1.5 block text-[11px] text-zinc-500 dark:text-zinc-400">组名称</span>
          <input v-model="form.roleGroupName" name="roleGroupName" aria-label="组名称" class="h-10 w-full rounded-[5%] bg-transparent px-3 text-sm text-zinc-700 outline-none ring-1 ring-inset ring-zinc-200/70 transition-all focus:ring-2 focus:ring-amber-400/60 dark:text-zinc-200 dark:ring-zinc-800" placeholder="如：内容运营组" />
        </label>

        <label class="block">
          <span class="mb-1.5 block text-[11px] text-zinc-500 dark:text-zinc-400">组编码</span>
          <input
            v-model="form.roleGroupCode"
            name="roleGroupCode"
            aria-label="组编码"
            class="h-10 w-full rounded-[5%] bg-transparent px-3 font-mono text-xs text-zinc-700 outline-none ring-1 ring-inset ring-zinc-200/70 transition-all focus:ring-2 focus:ring-amber-400/60 dark:text-zinc-200 dark:ring-zinc-800"
            placeholder="如：CONTENT_OPS"
          />
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
      title="删除角色组（软删除）"
      :message="'确定删除角色组「' + (deleteTarget?.roleGroupName ?? '') + '」吗？删除后其关联角色将不再继承该组权限。'"
      confirm-text="删除"
      @close="deleteTarget = null"
      @confirm="doDelete"
    />
  </div>
</template>

<script lang="ts">
export default { name: 'AdminRoleGroupsView' }
</script>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AdminModal from '@/components/admin/AdminModal.vue'
import ConfirmDialog from '@/components/admin/ConfirmDialog.vue'
import {
  getRoleGroups,
  createRoleGroup,
  updateRoleGroup,
  deleteRoleGroup,
  getRoleGroupPermissions,
  setRoleGroupPermissions
} from '@/api/rolegroup'
import type { RoleGroupListItem } from '@/api/rolegroup'
import { getPermissionTree, permissionTypeText } from '@/api/permission'
import type { PermissionNode } from '@/api/permission'
import { useToastStore } from '@/stores/toast'
import { unwrap } from '@/utils/response'

const toast = useToastStore()

// ── 角色组列表 ──
const groups = ref<RoleGroupListItem[]>([])
const loadingGroups = ref(false)
const keyword = ref('')
const selectedId = ref('')

// ── 权限树 ──
const tree = ref<PermissionNode[]>([])
const allPermRows = ref<any[]>([])
const permLoading = ref(false)
const permKeyword = ref('')
const checkedIds = ref<Set<string>>(new Set())
const savedIds = ref<Set<string>>(new Set())
const collapsed = ref<Set<string>>(new Set())
const allExpanded = ref(true)
const savingPerm = ref(false)

// ── 弹窗 ──
const editOpen = ref(false)
const editing = ref<RoleGroupListItem | null>(null)
const saving = ref(false)
const deleteTarget = ref<RoleGroupListItem | null>(null)

const form = ref({ roleGroupName: '', roleGroupCode: '' })

const selectedGroup = computed(() => groups.value.find((g) => g.roleGroupGuid === selectedId.value) || null)

const filteredGroups = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  if (!kw) return groups.value
  return groups.value.filter(
    (g) => g.roleGroupName.toLowerCase().includes(kw) || g.roleGroupCode.toLowerCase().includes(kw)
  )
})

const rowsById = computed(() => {
  const map = new Map<string, any>()
  for (const r of allPermRows.value) map.set(r.permissionId, r)
  return map
})

function hasChildren(row: any): boolean {
  return Array.isArray(row.children) && row.children.length > 0
}

function isExpanded(id: string): boolean {
  return !collapsed.value.has(id)
}

function toggleNode(id: string): void {
  const next = new Set(collapsed.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  collapsed.value = next
}

function toggleAllExpand(): void {
  if (allExpanded.value) {
    collapsed.value = new Set(allPermRows.value.filter(hasChildren).map((r) => r.permissionId))
  } else {
    collapsed.value = new Set()
  }
  allExpanded.value = !allExpanded.value
}

/** 命中关键词的节点及其全部祖先（搜索时保留层级上下文） */
function matchedIds(): Set<string> | null {
  const kw = permKeyword.value.trim().toLowerCase()
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
const permRows = computed(() => {
  const matched = matchedIds()
  return allPermRows.value.filter((r) => {
    if (matched && !matched.has(r.permissionId)) return false
    let parentId = r.parentId
    while (parentId) {
      if (collapsed.value.has(parentId)) return false
      parentId = rowsById.value.get(parentId)?.parentId ?? null
    }
    return true
  })
})

/** 是否存在被勾选的子孙（用于半选态） */
const checkedDesc = computed(() => {
  const map = new Map<string, boolean>()
  const walk = (n: PermissionNode): boolean => {
    let has = false
    for (const c of n.children || []) {
      const childHas = walk(c)
      if (checkedIds.value.has(c.permissionId) || childHas) has = true
    }
    map.set(n.permissionId, has)
    return has
  }
  for (const n of tree.value) walk(n)
  return map
})

function isIndeterminate(row: any): boolean {
  return !checkedIds.value.has(row.permissionId) && !!checkedDesc.value.get(row.permissionId)
}

/** 收集节点自身 + 全部子孙 ID */
function collectIds(n: any, out: string[] = []): string[] {
  out.push(n.permissionId)
  for (const c of n.children || []) collectIds(c, out)
  return out
}

/** 勾选父级 → 子孙联动勾选；取消父级 → 子孙联动取消 */
function toggleCheck(row: any): void {
  const next = new Set(checkedIds.value)
  const on = !next.has(row.permissionId)
  for (const id of collectIds(row)) {
    if (on) next.add(id)
    else next.delete(id)
  }
  checkedIds.value = next
}

function clearChecked(): void {
  checkedIds.value = new Set()
}

const permDirty = computed(() => {
  if (checkedIds.value.size !== savedIds.value.size) return true
  for (const id of checkedIds.value) if (!savedIds.value.has(id)) return true
  return false
})

function typeClass(t: number): string {
  return {
    1: 'bg-amber-400/15 text-amber-600 dark:text-amber-400',
    2: 'bg-blue-400/15 text-blue-600 dark:text-blue-400',
    3: 'bg-zinc-400/15 text-zinc-500 dark:text-zinc-400'
  }[t] || 'bg-zinc-400/15 text-zinc-500 dark:text-zinc-400'
}

/** 树 → 带 depth 的扁平行（父先于子） */
function flatten(nodes: PermissionNode[], depth = 0, out: any[] = []): any[] {
  for (const n of nodes) {
    out.push({ ...n, depth })
    if (n.children && n.children.length) flatten(n.children, depth + 1, out)
  }
  return out
}

async function loadGroups(): Promise<void> {
  loadingGroups.value = true
  try {
    const data: any = unwrap(await getRoleGroups())
    groups.value = Array.isArray(data) ? (data as RoleGroupListItem[]) : []
    if (!groups.value.some((g) => g.roleGroupGuid === selectedId.value)) {
      selectedId.value = groups.value[0]?.roleGroupGuid ?? ''
    }
  } catch (e: any) {
    groups.value = []
    selectedId.value = ''
    toast.push(e?.message || '加载角色组列表失败', 'error')
  } finally {
    loadingGroups.value = false
  }
}

async function loadTree(): Promise<void> {
  try {
    const data: any = unwrap(await getPermissionTree())
    tree.value = Array.isArray(data) ? data : []
    allPermRows.value = flatten(tree.value)
  } catch (e: any) {
    tree.value = []
    allPermRows.value = []
    toast.push(e?.message || '加载权限树失败', 'error')
  }
}

async function loadPermissions(id: string): Promise<void> {
  permLoading.value = true
  try {
    const data: any = unwrap(await getRoleGroupPermissions(id))
    const ids: string[] = Array.isArray(data) ? data.map((p: any) => p.permissionId) : []
    checkedIds.value = new Set(ids)
    savedIds.value = new Set(ids)
  } catch (e: any) {
    checkedIds.value = new Set()
    savedIds.value = new Set()
    toast.push(e?.message || '加载角色组权限失败', 'error')
  } finally {
    permLoading.value = false
  }
}

function selectGroup(id: string): void {
  if (id === selectedId.value) return
  selectedId.value = id
  permKeyword.value = ''
  loadPermissions(id)
}

function resetForm(): void {
  form.value = { roleGroupName: '', roleGroupCode: '' }
}

function openCreate(): void {
  editing.value = null
  resetForm()
  editOpen.value = true
}

function openEdit(row: RoleGroupListItem): void {
  editing.value = row
  form.value = { roleGroupName: row.roleGroupName, roleGroupCode: row.roleGroupCode }
  editOpen.value = true
}

async function save(): Promise<void> {
  if (!form.value.roleGroupName.trim()) {
    toast.push('请填写组名称', 'error')
    return
  }
  if (!form.value.roleGroupCode.trim()) {
    toast.push('请填写组编码', 'error')
    return
  }

  saving.value = true
  try {
    const payload = {
      roleGroupName: form.value.roleGroupName.trim(),
      roleGroupCode: form.value.roleGroupCode.trim()
    }
    if (editing.value) {
      await updateRoleGroup(editing.value.roleGroupGuid, payload)
      toast.push('角色组已更新', 'success')
    } else {
      await createRoleGroup(payload)
      toast.push('角色组已创建', 'success')
    }
    editOpen.value = false
    await loadGroups()
  } catch (e: any) {
    toast.push(e?.message || '保存失败', 'error')
  } finally {
    saving.value = false
  }
}

async function savePermissions(): Promise<void> {
  if (!selectedGroup.value) return
  savingPerm.value = true
  try {
    // 全量覆盖：提交所有已勾选节点（含目录），空数组即清空
    await setRoleGroupPermissions(selectedGroup.value.roleGroupGuid, [...checkedIds.value])
    savedIds.value = new Set(checkedIds.value)
    toast.push('权限已保存', 'success')
    await loadGroups()
  } catch (e: any) {
    toast.push(e?.message || '保存权限失败', 'error')
  } finally {
    savingPerm.value = false
  }
}

async function doDelete(): Promise<void> {
  if (!deleteTarget.value) return
  const id = deleteTarget.value.roleGroupGuid
  try {
    await deleteRoleGroup(id)
    toast.push('角色组已删除', 'success')
    deleteTarget.value = null
    if (selectedId.value === id) {
      selectedId.value = ''
      checkedIds.value = new Set()
      savedIds.value = new Set()
    }
    await loadGroups()
    if (selectedGroup.value) await loadPermissions(selectedGroup.value.roleGroupGuid)
  } catch (e: any) {
    toast.push(e?.message || '删除失败', 'error')
  }
}

onMounted(async () => {
  await Promise.all([loadGroups(), loadTree()])
  if (selectedId.value) await loadPermissions(selectedId.value)
})
</script>
