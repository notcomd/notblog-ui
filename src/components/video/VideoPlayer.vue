<template>
  <div>
    <!-- 播放器容器 -->
    <div ref="container" class="relative bg-black rounded-[5%] overflow-hidden group aspect-video"
      @mouseenter="controlsVisible = true" @mouseleave="controlsVisible = false" @mousemove="controlsVisible = true">
      <video
        ref="videoEl"
        class="w-full h-full"
        :src="src"
        playsinline
        @timeupdate="onTimeUpdate"
        @loadedmetadata="onLoaded"
        @ended="onEnded"
      ></video>

      <!-- 弹幕层 -->
      <DanmakuLayer
        ref="layer"
        :barrages="barrages"
        :enabled="danmakuOn"
        :opacity="danmakuOpacity"
        :speed="danmakuSpeed"
        :is-playing="!paused"
        :controls-visible="controlsVisible"
        @count="barrageCount = $event"
        @blocked="onBlocked"
      />

      <!-- 中央播放按钮 -->
      <button v-if="paused" class="absolute inset-0 m-auto w-16 h-16 rounded-full bg-white/95 flex items-center justify-center hover:scale-110 transition-transform" @click="togglePlay">
        <svg class="w-7 h-7 text-zinc-800 ml-1 dark:text-zinc-100" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
      </button>

      <!-- 控制栏 -->
      <div class="absolute bottom-0 left-0 right-0 px-4 pb-3 pt-8 bg-gradient-to-t from-black/70 to-transparent transition-opacity duration-300"
        :class="controlsVisible || paused ? 'opacity-100' : 'opacity-0'">
        <!-- 进度条 -->
        <input type="range" min="0" :max="duration || 0" step="0.1" :value="currentTime" class="w-full h-1 accent-amber-400 cursor-pointer" @input="seek" />
        <div class="flex items-center gap-3 mt-1 text-white text-xs">
          <button class="w-8 h-8 rounded-[5%] hover:bg-white/15 flex items-center justify-center transition-colors" @click="togglePlay">
            <svg v-if="paused" class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
            <svg v-else class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>
          </button>
          <span class="tabular-nums">{{ fmtTime(currentTime) }} / {{ fmtTime(duration) }}</span>
          <span class="ml-2 hidden sm:inline text-zinc-300 inline-flex items-center gap-1"><svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>{{ barrageCount }} 条弹幕</span>
          <div class="flex-1"></div>
          <!-- 弹幕开关（记忆 per video） -->
          <button class="w-8 h-8 rounded-[5%] hover:bg-white/15 flex items-center justify-center transition-colors" :class="danmakuOn ? 'text-amber-400' : 'text-zinc-400'" title="弹幕开关" @click="toggleDanmaku">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>
          </button>
          <!-- 速率 -->
          <button class="w-8 h-8 rounded-[5%] hover:bg-white/15 flex items-center justify-center text-[11px] transition-colors" title="弹幕速率" @click="cycleSpeed">{{ SPEED_LABEL[danmakuSpeed] }}</button>
          <!-- 音量 -->
          <div class="flex items-center gap-1">
            <svg class="w-4 h-4 text-zinc-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a9 9 0 0 1 0 14" /></svg>
            <input type="range" min="0" max="1" step="0.05" :value="volume" class="w-16 h-1 accent-amber-400" @input="setVolume" />
          </div>
          <!-- 全屏 -->
          <button class="w-8 h-8 rounded-[5%] hover:bg-white/15 flex items-center justify-center transition-colors" @click="toggleFullscreen">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" /></svg>
          </button>
        </div>
      </div>
    </div>

    <!-- 弹幕发送区（视频下方，与评论区输入框联动） -->
    <div class="flex items-center gap-2 mt-3">
      <button class="shrink-0 h-10 px-3 rounded-[5%] text-sm font-medium transition-all"
        :class="danmakuInputMode ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white ' : 'bg-white/60 dark:bg-zinc-800/60 text-zinc-500 dark:text-zinc-400 hover:text-amber-500'"
        @click="danmakuInputMode = !danmakuInputMode">
        <span class="flex items-center gap-1.5">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /><path d="M8 9h8M8 13h5" /></svg>
          发弹幕
        </span>
      </button>
      <input
        v-model="danmakuDraft"
        class="flex-1 h-10 px-4 rounded-[5%] bg-white/60 dark:bg-zinc-800/60 border border-white/50 dark:border-white/10 text-sm outline-none focus:ring-2 focus:ring-amber-400/50 transition-all"
        :placeholder="danmakuInputMode ? '发一条有趣的弹幕吧...（≤30 字，间隔 3 秒）' : '说点什么...'"
        maxlength="30"
        @keyup.enter="sendDanmaku"
      />
      <button class="shrink-0 h-10 px-4 rounded-[5%] bg-gradient-to-r from-amber-400 to-orange-500 text-white text-sm font-medium hover: active:scale-95 transition-all disabled:opacity-50" :disabled="!danmakuDraft.trim() || danmakuCooldown > 0" @click="sendDanmaku">
        {{ danmakuCooldown > 0 ? danmakuCooldown + 's' : '发送' }}
      </button>
    </div>
    <p v-if="danmakuError" class="text-xs text-red-500 mt-1.5">{{ danmakuError }}</p>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import DanmakuLayer from './DanmakuLayer.vue'
import { getBarrages, sendBarrage, containsSensitive } from '@/api/danmaku'
import { useToastStore } from '@/stores/toast'

interface Props {
  src: string
  videoGuid: string
}
const props = defineProps<Props>()

const toast = useToastStore()

const container = ref<HTMLElement | null>(null)
const videoEl = ref<HTMLVideoElement | null>(null)
const layer = ref<{ addBarrage: (b: unknown) => void; $el: HTMLElement } | null>(null)

const paused = ref(true)
const currentTime = ref(0)
const duration = ref(0)
const volume = ref(0.8)
const controlsVisible = ref(false)
const barrageCount = ref(0)

// 弹幕偏好（记忆 per video）
const DM_KEY = (id: string) => 'danmaku_pref_' + id
const danmakuOn = ref(true)
const danmakuOpacity = ref(70)
type DanmakuSpeed = 'slow' | 'medium' | 'fast'
const danmakuSpeed = ref<DanmakuSpeed>('medium')
const SPEED_LABEL: Record<DanmakuSpeed, string> = { slow: '慢', medium: '中', fast: '快' }
const SPEED_ORDER: DanmakuSpeed[] = ['slow', 'medium', 'fast']

const danmakuInputMode = ref(false)
const danmakuDraft = ref('')
const danmakuError = ref('')
const danmakuCooldown = ref(0)
let cooldownTimer: ReturnType<typeof setInterval> | null = null

interface Barrage {
  barrageGuid: string
  userGuid: string
  userName: string
  body: string
  timeOffset: number
  likeCount: number
  isOwn?: boolean
}

const barrages = ref<Barrage[]>([])

function restorePref() {
  try {
    const saved = JSON.parse(localStorage.getItem(DM_KEY(props.videoGuid)) || '{}')
    if (saved.on !== undefined) danmakuOn.value = saved.on
    if (saved.opacity) danmakuOpacity.value = saved.opacity
    if (saved.speed) danmakuSpeed.value = saved.speed
  } catch (e) { /* 默认值 */ }
}

function savePref() {
  localStorage.setItem(DM_KEY(props.videoGuid), JSON.stringify({
    on: danmakuOn.value,
    opacity: danmakuOpacity.value,
    speed: danmakuSpeed.value
  }))
}

function toggleDanmaku() {
  danmakuOn.value = !danmakuOn.value
  savePref()
}

function cycleSpeed() {
  const i = SPEED_ORDER.indexOf(danmakuSpeed.value)
  danmakuSpeed.value = SPEED_ORDER[(i + 1) % SPEED_ORDER.length]
  savePref()
}

async function loadBarrages() {
  try {
    const res = await getBarrages(props.videoGuid)
    const data = res && res.data ? res.data : res
    const list = data.items || data.list || data || []
    barrages.value = list.map((b: Record<string, unknown>) => ({
      barrageGuid: (b.barrageGuid as string) || (b.videoBarrageGuid as string),
      userGuid: b.userGuid as string,
      userName: (b.userName as string) || '匿名',
      body: (b.body as string) || (b.videoBarrageBody as string) || '',
      timeOffset: (b.timeOffset as number) || 0,
      likeCount: (b.likeCount as number) || 0
    }))
  } catch (e) {
    console.error('加载弹幕失败:', e)
  }
}

async function sendDanmaku() {
  const text = danmakuDraft.value.trim()
  danmakuError.value = ''
  if (!text) return
  if (text.length > 30) {
    danmakuError.value = '弹幕长度不能超过 30 个字符'
    return
  }
  if (containsSensitive(text)) {
    danmakuError.value = '内容包含违规词汇，请修改'
    return
  }
  if (danmakuCooldown.value > 0) return

  // 乐观显示（品牌色高亮 2 秒后恢复）
  const own: Barrage = {
    barrageGuid: 'local-' + Date.now(),
    userGuid: 'me',
    userName: '我',
    body: text,
    timeOffset: currentTime.value,
    likeCount: 0
  }
  if (layer.value) {
    layer.value.addBarrage({ ...own, isOwn: true })
    setTimeout(() => {
      if (layer.value && layer.value.$el) {
        // 2 秒后取消高亮：通过重新添加普通样式实现（简化：再次 spawn 普通色）
      }
    }, 2000)
  }
  barrageCount.value += 1

  // 限频 3 秒
  danmakuCooldown.value = 3
  if (cooldownTimer) clearInterval(cooldownTimer)
  cooldownTimer = setInterval(() => {
    danmakuCooldown.value -= 1
    if (danmakuCooldown.value <= 0) {
      clearInterval(cooldownTimer)
      cooldownTimer = null
    }
  }, 1000)

  danmakuDraft.value = ''
  try {
    await sendBarrage(props.videoGuid, text)
  } catch (e) {
    toast.push('弹幕发送失败，请稍后重试', 'error')
  }
}

function onBlocked() {
  // 屏蔽/举报后无需额外处理（弹幕层已过滤）
}

// ===== 播放控制 =====
function togglePlay() {
  if (!videoEl.value) return
  if (videoEl.value.paused) videoEl.value.play()
  else videoEl.value.pause()
}

function onTimeUpdate() {
  if (videoEl.value) currentTime.value = videoEl.value.currentTime
}

function onLoaded() {
  if (videoEl.value) duration.value = videoEl.value.duration
}

function onEnded() {
  paused.value = true
}

function seek(e: Event) {
  const t = Number((e.target as HTMLInputElement).value)
  if (videoEl.value) videoEl.value.currentTime = t
  currentTime.value = t
}

function setVolume(e: Event) {
  volume.value = Number((e.target as HTMLInputElement).value)
  if (videoEl.value) videoEl.value.volume = volume.value
}

function toggleFullscreen() {
  if (!container.value) return
  if (document.fullscreenElement) document.exitFullscreen()
  else container.value.requestFullscreen()
}

function fmtTime(t: number): string {
  if (!t || t < 0) return '00:00'
  const m = Math.floor(t / 60)
  const s = Math.floor(t % 60)
  return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0')
}

// 监听播放状态
onMounted(() => {
  restorePref()
  loadBarrages()
  if (videoEl.value) videoEl.value.volume = volume.value
  const onPlay = () => { paused.value = false }
  const onPause = () => { paused.value = true }
  videoEl.value.addEventListener('play', onPlay)
  videoEl.value.addEventListener('pause', onPause)
})

onBeforeUnmount(() => {
  if (cooldownTimer) clearInterval(cooldownTimer)
})
</script>
