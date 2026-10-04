<template>
  <div>
    <!-- 头部：标题 + 累计天数 / 连续记录 -->
    <header class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 mb-4">
      <h3 class="font-display text-lg font-bold text-zinc-800 dark:text-zinc-100">
        签到记录
        <span class="ml-1.5 font-numeric text-xs font-normal text-zinc-400">累计 {{ totalDays }} 天</span>
      </h3>
      <p class="text-xs text-zinc-500 dark:text-zinc-400">
        当前连续
        <span class="font-numeric font-medium text-zinc-700 dark:text-zinc-200">{{ currentStreak }}</span> 天
        <span class="mx-1.5 text-zinc-300 dark:text-zinc-600">·</span>
        最长
        <span class="font-numeric font-medium text-zinc-700 dark:text-zinc-200">{{ longestStreak }}</span> 天
      </p>
    </header>

    <!-- 加载骨架（避免空态闪烁） -->
    <div v-if="loading" class="h-[104px] rounded-[5%] bg-zinc-100/60 dark:bg-zinc-800/40 animate-pulse"></div>

    <!-- 热力图：列 = 周，行 = 周日~周六（与 GitHub 贡献图一致） -->
    <div v-else class="overflow-x-auto">
      <div
        class="inline-grid gap-[3px]"
        role="img"
        :aria-label="ariaLabel"
        :style="gridStyle"
      >
        <!-- 月份标签（仅在该列首日所在月份变化时显示） -->
        <span
          v-for="(w, i) in weeks"
          v-show="w.monthLabel"
          :key="'m' + i"
          class="whitespace-nowrap text-[10px] leading-[14px] text-zinc-400 dark:text-zinc-500"
          :style="{ gridColumn: i + 2, gridRow: 1 }"
        >{{ w.monthLabel }}</span>

        <!-- 星期标签（一 / 三 / 五） -->
        <span
          v-for="(label, r) in DAY_LABELS"
          v-show="label"
          :key="'d' + r"
          class="pr-1.5 text-right text-[10px] leading-[10px] text-zinc-400 dark:text-zinc-500"
          :style="{ gridColumn: 1, gridRow: r + 2 }"
        >{{ label }}</span>

        <!-- 日期方块 -->
        <span
          v-for="c in cells"
          :key="c.key"
          class="rounded-[2px] transition-transform duration-150 hover:scale-[1.35] motion-reduce:transition-none"
          :class="c.className"
          :style="{ gridColumn: c.col + 2, gridRow: c.row + 2 }"
          :title="c.title"
        ></span>
      </div>
    </div>

    <!-- 图例 -->
    <div
      v-if="!loading"
      class="mt-2.5 flex items-center justify-end gap-1.5 text-[10px] text-zinc-400 dark:text-zinc-500"
    >
      <span>少</span>
      <span v-for="(cls, i) in LEVEL_CLASSES" :key="i" class="h-[10px] w-[10px] rounded-[2px]" :class="cls"></span>
      <span>多</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onActivated, onMounted, ref } from 'vue'
import { getMySignInDates } from '@/api/userinfo'

/** 展示周数（53 列 ≈ 近一年，与 GitHub 贡献图一致） */
const TOTAL_WEEKS = 53
/** 行标签：索引 0~6 对应周日~周六，仅标注一/三/五 */
const DAY_LABELS = ['', '一', '', '三', '', '五', '']
/** 强度配色：索引 0 = 未签到，1~4 随连续天数加深（GitHub 贡献图绿） */
const LEVEL_CLASSES = [
  'bg-zinc-200/70 dark:bg-zinc-800',
  'bg-green-200 dark:bg-green-900',
  'bg-green-400 dark:bg-green-700',
  'bg-green-600 dark:bg-green-500',
  'bg-green-800 dark:bg-green-400'
]
const DAY_MS = 24 * 60 * 60 * 1000

interface Cell {
  key: string
  col: number
  row: number
  className: string
  title: string
}

/** 本地自然日零点（避免 UTC 偏移导致日期错位） */
function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

/** 日期加减（按自然日，规避夏令时误差） */
function addDays(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)
}

/** yyyy-MM-dd（与后端 DateOnly 序列化格式一致） */
function toKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** 解析 yyyy-MM-dd 为本地日期 */
function parseKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** 连续签到天数 → 强度等级（1 / 2-3 / 4-6 / 7+） */
function levelOf(streak: number): number {
  if (streak <= 0) return 0
  if (streak === 1) return 1
  if (streak <= 3) return 2
  if (streak <= 6) return 3
  return 4
}

const loading = ref(true)
const dateSet = ref<Set<string>>(new Set())
const totalDays = ref(0)

/** 组件挂载的当天（本地自然日） */
const today = startOfDay(new Date())
const todayKey = toKey(today)

/** 列模型：每列一周，列首日所在月份变化时给出月份标签 */
const weeks = computed(() => {
  const end = addDays(today, 6 - today.getDay()) // 对齐到本周周六，保证最后一列为完整一周
  const start = addDays(end, -(TOTAL_WEEKS * 7 - 1))
  const result: Array<{ monthLabel: string; days: Cell[] }> = []
  let streak = 0
  let cursor = start
  let prevMonth = -1

  for (let col = 0; col < TOTAL_WEEKS; col++) {
    const month = cursor.getMonth()
    const days: Cell[] = []
    for (let row = 0; row < 7; row++) {
      const key = toKey(cursor)
      const signed = dateSet.value.has(key)
      streak = signed ? streak + 1 : 0
      const future = key > todayKey
      days.push({
        key,
        col,
        row,
        className: future ? 'bg-transparent' : LEVEL_CLASSES[levelOf(streak)],
        title: future ? '' : `${key} ${signed ? '已签到' : '未签到'}`
      })
      cursor = addDays(cursor, 1)
    }
    result.push({ monthLabel: month !== prevMonth ? `${month + 1}月` : '', days })
    prevMonth = month
  }
  return result
})

/** 扁平化方块列表，供 CSS Grid 以 gridColumn/gridRow 显式定位 */
const cells = computed<Cell[]>(() => {
  const list: Cell[] = []
  for (const w of weeks.value) list.push(...w.days)
  return list
})

const gridStyle = computed(() => ({
  gridTemplateColumns: `auto repeat(${TOTAL_WEEKS}, 10px)`,
  gridTemplateRows: '14px repeat(7, 10px)'
}))

/** 当前连续 / 最长连续（窗口内统计） */
const currentStreak = computed(() => {
  let cursor = dateSet.value.has(todayKey) ? today : addDays(today, -1)
  let count = 0
  while (dateSet.value.has(toKey(cursor))) {
    count += 1
    cursor = addDays(cursor, -1)
  }
  return count
})

const longestStreak = computed(() => {
  const keys = [...dateSet.value].sort()
  let longest = 0
  let run = 0
  let prev: Date | null = null
  for (const key of keys) {
    const d = parseKey(key)
    run = prev && Math.round((d.getTime() - prev.getTime()) / DAY_MS) === 1 ? run + 1 : 1
    if (run > longest) longest = run
    prev = d
  }
  return longest
})

const ariaLabel = computed(
  () => `近一年签到记录：累计签到 ${totalDays.value} 天，当前连续 ${currentStreak.value} 天`
)

async function load(): Promise<void> {
  try {
    const res: any = await getMySignInDates()
    const d = res && res.data ? res.data : res
    const dates: string[] = (d && d.dates) || []
    dateSet.value = new Set(dates)
    totalDays.value = (d && d.totalDays) || 0
  } catch (e) {
    dateSet.value = new Set()
    totalDays.value = 0
  } finally {
    loading.value = false
  }
}

onMounted(load)

// keep-alive 页面重新激活时刷新（例如在顶栏签到后回到个人主页）；首次挂载不重复请求
let activated = false
onActivated(() => {
  if (activated) load()
  activated = true
})
</script>
