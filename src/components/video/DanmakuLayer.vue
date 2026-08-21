<template>
  <div ref="stage" class="absolute inset-0 overflow-hidden pointer-events-none select-none">
    <!-- 活跃弹幕 -->
    <div
      v-for="d in active"
      :key="d.id"
      class="danmaku-item absolute whitespace-nowrap cursor-pointer pointer-events-auto"
      :class="{ 'hot-danmaku': isHot(d), 'own-danmaku': d.isOwn, 'dimmed': controlsVisible }"
      :style="itemStyle(d)"
      @click.stop="likeDanmaku(d)"
      @contextmenu.prevent.stop="openMenu($event, d)"
      @touchstart.passive="touchStart($event, d)"
      @touchend="touchEnd($event, d)"
    >{{ d.body }}</div>
    <!-- 右键/长按菜单 -->
    <div v-if="menu" class="danmaku-menu pointer-events-auto" :style="{ left: menu.x + 'px', top: menu.y + 'px' }">
      <button @click="blockUser(menu.d)" class="inline-flex items-center gap-1"><svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>屏蔽该用户弹幕</button>
      <button @click="report(menu.d)" class="inline-flex items-center gap-1"><svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>举报</button>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps({
  // 弹幕数据源：{ barrageGuid, userGuid, userName, body, timeOffset, likeCount }[]
  barrages: { type: Array, default: () => [] },
  enabled: { type: Boolean, default: true },
  // 透明度 50-100
  opacity: { type: Number, default: 70 },
  // 速率：slow | medium | fast
  speed: { type: String, default: 'medium' },
  isPlaying: { type: Boolean, default: true },
  controlsVisible: { type: Boolean, default: false }
})

const emit = defineEmits(['count', 'blocked'])

const MAX_ACTIVE = 16          // 同屏最多弹幕数
const LINE_HEIGHT = 30         // 轨迹行高
const stage = ref(null)
const active = ref([])         // 当前屏幕上的弹幕
const queue = ref([])          // 等待队列
const blockedUsers = ref(new Set())  // 屏蔽用户
const likeMap = ref({})        // 弹幕点赞数
const menu = ref(null)         // 右键菜单
let timer = null
let touchTimer = null
let touchDanmaku = null
let seq = 0

// 8 种预设色 + 随机
const COLORS = ['#ffffff', '#ff6b6b', '#feca57', '#48dbfb', '#1dd1a1', '#f368e0', '#ff9f43', '#54a0ff']
const HOT_THRESHOLD = 10

const isDark = () => document.documentElement.getAttribute('data-theme') === 'dark'

// 动画时长（横穿时间）
const DURATION = { slow: 45, medium: 30, fast: 18 }

const opacityStyle = computed(() => (props.opacity / 100).toFixed(2))

function pickColor(d) {
  if (d.color) return d.color
  const r = Math.random()
  // 默认白色带半透明描边；暗色模式浅灰
  if (r < 0.6) return isDark() ? '#E0E0E0' : '#ffffff'
  return COLORS[Math.floor(Math.random() * COLORS.length)]
}

function isHot(d) {
  return (likeMap.value[d.barrageGuid] || d.likeCount || 0) >= HOT_THRESHOLD
}

function itemStyle(d) {
  return {
    top: d.top + 'px',
    color: pickColor(d),
    opacity: opacityStyle.value,
    fontSize: isHot(d) ? '18px' : '16px',
    textShadow: '0 1px 3px rgba(0,0,0,0.8), 0 0 2px rgba(0,0,0,0.6), 0 0 1px #000',
    animationDuration: DURATION[props.speed] + 's',
    animationDelay: '0s',
    animationPlayState: 'running',
    zIndex: d.isOwn ? 10 : 1
  }
}

// 选行：行空闲度（最近活跃时间最早的行）
function pickLine() {
  const h = stage.value ? stage.value.clientHeight : 400
  const lineCount = Math.max(1, Math.floor((h - 20) / LINE_HEIGHT))
  const now = Date.now()
  let best = 0
  let bestScore = Infinity
  for (let i = 0; i < lineCount; i++) {
    const last = lineLastActive[i] || 0
    if (now - last > bestScore) {
      best = i
      bestScore = now - last
    }
  }
  lineLastActive[best] = now
  return Math.min(best * LINE_HEIGHT, h - 30)
}

const lineLastActive = {}

// 弹出一条弹幕（队列 -> 屏幕）
function spawn(d) {
  const top = pickLine()
  const item = {
    ...d,
    id: ++seq,
    top,
    color: d.color || null
  }
  // 弹幕结束时从 active 移除
  setTimeout(() => {
    active.value = active.value.filter(x => x.id !== item.id)
  }, DURATION[props.speed] * 1000 + 500)
  active.value.push(item)
}

// 调度器：每 300ms 尝试从队列补弹幕（暂停时弹幕仍流动，与主流弹幕播放器一致）
function tick() {
  if (!props.enabled) return
  while (active.value.length < MAX_ACTIVE && queue.value.length > 0) {
    const next = queue.value.shift()
    spawn(next)
    if (active.value.length >= MAX_ACTIVE) break
  }
}

function enqueue(d) {
  if (!props.enabled) return
  if (blockedUsers.value.has(String(d.userGuid))) return
  queue.value.push(d)
}

// 外部调用：立即显示一条弹幕（发送后高亮）
function pushImmediate(d) {
  if (blockedUsers.value.has(String(d.userGuid))) return
  spawn({ ...d, isOwn: true })
}

// 点赞：>=10 升热门
function likeDanmaku(d) {
  likeMap.value[d.barrageGuid] = (likeMap.value[d.barrageGuid] || d.likeCount || 0) + 1
  // 热门弹幕停留时间延长（重新设置移除计时器由 CSS 动画控制，这里仅更新样式）
}

function openMenu(e, d) {
  menu.value = { x: Math.min(e.clientX, window.innerWidth - 140), y: e.clientY, d }
}

function blockUser(d) {
  blockedUsers.value.add(String(d.userGuid))
  // 立即移除该用户屏幕上的弹幕
  active.value = active.value.filter(x => String(x.userGuid) !== String(d.userGuid))
  queue.value = queue.value.filter(x => String(x.userGuid) !== String(d.userGuid))
  menu.value = null
  emit('blocked', d.userGuid)
}

function report(d) {
  menu.value = null
  emit('blocked', d.userGuid) // 复用事件通道上报
}

function touchStart(e, d) {
  touchDanmaku = d
  touchTimer = setTimeout(() => {
    if (touchDanmaku) {
      openMenu(e.changedTouches[0], d)
    }
  }, 600)
}

function touchEnd() {
  clearTimeout(touchTimer)
  touchTimer = null
  touchDanmaku = null
}

// 接收外部新弹幕
function addBarrage(d) {
  if (d.isOwn) pushImmediate(d)
  else enqueue(d)
}

// 已入队弹幕集合（去重）
const queuedIds = new Set()

function syncBarrages(list) {
  const sorted = [...list].sort((a, b) => (a.timeOffset || 0) - (b.timeOffset || 0))
  const fresh = sorted.filter(d => !queuedIds.has(d.barrageGuid))
  fresh.forEach(d => { queuedIds.add(d.barrageGuid) })
  queue.value.push(...fresh)
  fresh.forEach(d => { likeMap.value[d.barrageGuid] = d.likeCount || 0 })
  emit('count', queuedIds.size)
}

onMounted(() => {
  // 初始调度（props.barrages 可能异步到达，先同步一次）
  syncBarrages(props.barrages)
  timer = setInterval(tick, 300)
})

// 弹幕数据异步加载完成后补入队列（后端拉取/轮询增量）
watch(() => props.barrages, (list) => {
  if (list && list.length) syncBarrages(list)
}, { deep: true })

onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
  if (touchTimer) clearTimeout(touchTimer)
})

defineExpose({ addBarrage, likeMap, blockedUsers })
</script>

<style scoped>
.danmaku-item {
  left: 100%;
  font-weight: 500;
  line-height: 1.4;
  transition: opacity 0.3s ease;
  animation-name: danmaku-scroll;
  animation-timing-function: linear;
  animation-fill-mode: forwards;
}

.hot-danmaku::before {
  content: '⭐ ';
}

.own-danmaku {
  font-weight: 700;
}

/* 品牌色高亮（发送者识别，2 秒后由 CSS 动画淡出——用类名切换实现） */
.own-danmaku {
  color: #ffb020 !important;
  text-shadow: 0 0 8px rgba(255, 176, 32, 0.8), 0 1px 3px rgba(0,0,0,0.8) !important;
}

.dimmed {
  opacity: 0.25 !important;
}

@keyframes danmaku-scroll {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(calc(-100vw - 100%));
  }
}

.danmaku-menu {
  position: fixed;
  z-index: 999;
  background: rgba(30, 30, 35, 0.95);
  border-radius: 12px;
  padding: 4px;
}

.danmaku-menu button {
  display: block;
  width: 100%;
  text-align: left;
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 13px;
  color: #e4e4e7;
  white-space: nowrap;
}

.danmaku-menu button:hover {
  background: rgba(255, 255, 255, 0.1);
}
</style>
