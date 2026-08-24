<template>
  <div class="glass-card overflow-hidden">
    <!-- 工具栏 -->
    <div v-if="$slots.toolbar" class="px-4 py-3 border-b border-zinc-200/60 dark:border-zinc-700/60 flex flex-wrap items-center gap-3">
      <slot name="toolbar"></slot>
    </div>
    <!-- 表格 -->
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="text-left text-xs text-zinc-500 dark:text-zinc-400 border-b border-zinc-200/60 dark:border-zinc-700/60">
            <th v-if="selectable" class="px-4 py-3 w-10">
              <input type="checkbox" class="accent-amber-500" :checked="allSelected" @change="toggleAll" />
            </th>
            <th v-for="col in columns" :key="col.key" class="px-4 py-3 font-medium whitespace-nowrap" :class="col.className || ''">
              {{ col.label }}
            </th>
            <th v-if="$slots.actions" class="px-4 py-3 font-medium text-right">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, ri) in rows" :key="rowKey(row, ri)" class="border-b border-zinc-100/80 dark:border-zinc-800/60 hover:bg-white/50 dark:hover:bg-zinc-800/40 transition-colors">
            <td v-if="selectable" class="px-4 py-3">
              <input type="checkbox" class="accent-amber-500" :checked="isSelected(rowKey(row, ri))" @change="toggleRow(rowKey(row, ri))" />
            </td>
            <td v-for="col in columns" :key="col.key" class="px-4 py-3 align-middle" :class="col.cellClass || ''">
              <slot :name="'cell-' + col.key" :row="row" :value="row[col.key]">{{ row[col.key] }}</slot>
            </td>
            <td v-if="$slots.actions" class="px-4 py-3 text-right whitespace-nowrap">
              <slot name="actions" :row="row"></slot>
            </td>
          </tr>
          <tr v-if="loading">
            <td :colspan="colspan" class="px-4 py-10">
              <div class="flex justify-center">
                <div class="flex items-center gap-2 text-zinc-400 text-sm">
                  <span class="w-5 h-5 border-2 border-zinc-300 dark:border-zinc-600 border-t-amber-500 rounded-full animate-spin"></span>
                  加载中...
                </div>
              </div>
            </td>
          </tr>
          <tr v-else-if="rows.length === 0">
            <td :colspan="colspan" class="px-4 py-14 text-center text-zinc-400 text-sm">
              <div class="text-4xl mb-2"><svg class="w-12 h-12 mx-auto text-zinc-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg></div>{{ emptyText }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <!-- 分页 -->
    <div v-if="total > pageSize" class="px-4 py-3 border-t border-zinc-200/60 dark:border-zinc-700/60 flex items-center justify-between text-sm">
      <span class="text-xs text-zinc-400">共 {{ total }} 条</span>
      <div class="flex items-center gap-1">
        <button class="w-8 h-8 rounded-[5%] text-zinc-500 hover:bg-white/60 dark:hover:bg-zinc-800/60 transition-colors disabled:opacity-30 dark:text-zinc-400" :disabled="page <= 1" @click="go(page - 1)">‹</button>
        <span class="px-2 text-xs text-zinc-500 dark:text-zinc-400">{{ page }} / {{ totalPages }}</span>
        <button class="w-8 h-8 rounded-[5%] text-zinc-500 hover:bg-white/60 dark:hover:bg-zinc-800/60 transition-colors disabled:opacity-30 dark:text-zinc-400" :disabled="page >= totalPages" @click="go(page + 1)">›</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Col {
  key: string
  label: string
  className?: string
  cellClass?: string
}

interface Props {
  columns: Col[]
  rows?: Array<Record<string, unknown>>
  rowKeyField?: string
  loading?: boolean
  emptyText?: string
  selectable?: boolean
  selected?: unknown[]
  page?: number
  pageSize?: number
  total?: number
}
const props = withDefaults(defineProps<Props>(), {
  rows: () => [],
  rowKeyField: 'id',
  loading: false,
  emptyText: '暂无数据',
  selectable: false,
  selected: () => [] as unknown[],
  page: 1,
  pageSize: 10,
  total: 0
})

const emit = defineEmits<{
  (e: 'update:selected', keys: unknown[]): void
  (e: 'page-change', page: number): void
}>()

const totalPages = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)))
const colspan = computed(() => props.columns.length + (props.selectable ? 1 : 0) + 1)

function rowKey(row: Record<string, unknown>, index: number): unknown {
  return row[props.rowKeyField] !== undefined ? row[props.rowKeyField] : index
}

const allSelected = computed(() => props.rows.length > 0 && props.rows.every(r => props.selected.includes(r[props.rowKeyField])))

function toggleAll() {
  const keys = props.rows.map(r => r[props.rowKeyField])
  const next = allSelected.value ? props.selected.filter(k => !keys.includes(k)) : [...new Set([...props.selected, ...keys])]
  emit('update:selected', next)
}

function isSelected(key: unknown): boolean {
  return props.selected.includes(key)
}

function toggleRow(key: unknown) {
  const next = props.selected.includes(key)
    ? props.selected.filter(k => k !== key)
    : [...props.selected, key]
  emit('update:selected', next)
}

function go(p: number) {
  emit('page-change', p)
}
</script>
