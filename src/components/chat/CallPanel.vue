<template>
  <!-- 语音/视频通话面板（全局挂载于 AppLayout，来电/通话覆盖任意页面） -->
  <div v-if="call.status !== 'idle'" class="fixed inset-0 z-[80] flex items-center justify-center bg-zinc-950/90">
    <!-- ===== 来电（被叫） ===== -->
    <div v-if="call.status === 'incoming'" class="flex flex-col items-center gap-6 px-8">
      <div class="w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-3xl font-bold">
        {{ nameChar }}
      </div>
      <div class="text-center">
        <p class="text-xl font-semibold text-white">{{ peerName }}</p>
        <p class="mt-1 text-sm text-zinc-400">{{ typeLabel }}通话邀请…</p>
      </div>
      <div class="flex gap-6">
        <button class="w-16 h-16 rounded-full bg-red-500/90 text-white flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-transform" @click="call.rejectCall()">
          <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
          <span class="text-[10px]">拒绝</span>
        </button>
        <button class="w-16 h-16 rounded-full bg-emerald-500/90 text-white flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-transform" @click="call.acceptCall()">
          <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
          <span class="text-[10px]">接听</span>
        </button>
      </div>
    </div>

    <!-- ===== 呼叫中（呼叫方等待） ===== -->
    <div v-else-if="call.status === 'ringing'" class="flex flex-col items-center gap-6 px-8">
      <div class="w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-3xl font-bold animate-pulse">
        {{ nameChar }}
      </div>
      <div class="text-center">
        <p class="text-xl font-semibold text-white">正在呼叫 {{ peerName }}…</p>
        <p class="mt-1 text-sm text-zinc-400">{{ typeLabel }}通话</p>
      </div>
      <button class="w-16 h-16 rounded-full bg-red-500/90 text-white flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-transform" @click="call.cancelCall()">
        <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        <span class="text-[10px]">取消</span>
      </button>
    </div>

    <!-- ===== 通话中 ===== -->
    <div v-else-if="call.status === 'active'" class="w-full h-full relative flex items-center justify-center">
      <!-- 远端视频（视频通话） -->
      <div v-if="hasVideo && remoteVideos.length" class="w-full h-full p-6 grid gap-3" :class="remoteVideos.length === 1 ? 'grid-cols-1' : 'grid-cols-2'">
        <video
          v-for="(stream, uid) in remoteVideos"
          :key="uid"
          autoplay
          playsinline
          class="w-full h-full object-cover rounded-xl bg-zinc-900"
          :srcObject="stream"
        ></video>
      </div>
      <!-- 语音通话 / 无远端视频：居中头像 + 计时 -->
      <div v-else class="flex flex-col items-center gap-5">
        <div class="w-28 h-28 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-4xl font-bold">
          {{ nameChar }}
        </div>
        <div class="text-center">
          <p class="text-xl font-semibold text-white">{{ peerName }}</p>
          <p class="mt-1 text-sm text-zinc-400 tabular-nums">{{ durationText }}</p>
        </div>
      </div>

      <!-- 本地视频小窗 -->
      <video
        v-if="hasVideo && call.localStream"
        autoplay
        playsinline
        muted
        class="absolute bottom-28 right-5 w-44 aspect-video object-cover rounded-xl bg-zinc-900 border border-white/10"
        :srcObject="call.localStream"
      ></video>

      <!-- 控制条 -->
      <div class="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4">
        <button
          class="p-3.5 rounded-full text-white transition-colors"
          :class="muted ? 'bg-amber-500' : 'bg-white/15 hover:bg-white/25'"
          :title="muted ? '取消静音' : '静音'"
          :aria-label="muted ? '取消静音' : '静音'"
          @click="toggleMute"
        >
          <svg v-if="!muted" class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
          <svg v-else class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
        </button>
        <button
          v-if="hasVideo"
          class="p-3.5 rounded-full text-white transition-colors"
          :class="cameraOff ? 'bg-amber-500' : 'bg-white/15 hover:bg-white/25'"
          :title="cameraOff ? '开启摄像头' : '关闭摄像头'"
          :aria-label="cameraOff ? '开启摄像头' : '关闭摄像头'"
          @click="toggleCamera"
        >
          <svg v-if="!cameraOff" class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
          <svg v-else class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
        </button>
        <button class="w-14 h-14 rounded-full bg-red-500 text-white flex items-center justify-center active:scale-95 transition-transform" title="挂断" aria-label="挂断" @click="call.hangUp()">
          <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
        </button>
      </div>
    </div>

    <!-- ===== 通话结束 ===== -->
    <div v-else-if="call.status === 'ended'" class="flex flex-col items-center gap-4 px-8">
      <p class="text-lg text-white font-medium">{{ endReasonText }}</p>
      <button class="px-6 h-10 rounded-[10px] bg-white/10 text-white text-sm hover:bg-white/20 transition-colors" @click="call.reset()">关闭</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { useCallStore } from '@/stores/call'
import { useChatStore } from '@/stores/chat'

const call = useCallStore()
const chat = useChatStore()

const muted = ref(false)
const cameraOff = ref(false)
const startTime = ref(Date.now())
const durationText = ref('00:00')
let timer: ReturnType<typeof setInterval> | null = null

const END_REASON_TEXT: Record<number, string> = {
  0: '呼叫已取消',
  1: '对方拒绝了通话',
  2: '无人接听，通话已结束',
  3: '所有成员已离开',
  4: '对方已挂断',
  5: '通话异常结束'
}

const session = computed(() =>
  chat.sessions.find((s) => String(s.sessionId) === String(call.sessionId)) || null
)

// 1 对 1：对端昵称；群组：会话名
const peerName = computed(() => {
  if (!session.value) return '对方'
  if (session.value.groupId) return session.value.sessionName || '群聊'
  const pid = chat.peerIdOf(session.value.sessionId)
  const f = chat.friends.find((x) => String(x.friendId) === String(pid))
  return (f && f.friendName) || session.value.sessionName || '对方'
})

const nameChar = computed(() => (peerName.value || '?').slice(0, 1))
const typeLabel = computed(() => (call.type === 'Video' ? '视频' : '语音'))
const hasVideo = computed(() => call.type === 'Video')
const remoteVideos = computed(() => call.remoteStreams)
const endReasonText = computed(() => END_REASON_TEXT[call.endReason] || '通话已结束')

function toggleMute() {
  muted.value = !muted.value
  if (call.localStream) {
    call.localStream.getAudioTracks().forEach((t) => { t.enabled = !muted.value })
  }
}

function toggleCamera() {
  cameraOff.value = !cameraOff.value
  if (call.localStream) {
    call.localStream.getVideoTracks().forEach((t) => { t.enabled = !cameraOff.value })
  }
}

function tick() {
  const s = Math.max(0, Math.floor((Date.now() - startTime.value) / 1000))
  const mm = String(Math.floor(s / 60)).padStart(2, '0')
  const ss = String(s % 60).padStart(2, '0')
  durationText.value = `${mm}:${ss}`
}

// 通话开始计时
const stopTimer = (() => {
  let lastStatus = 'idle'
  return () => {
    if (call.status === 'active' && lastStatus !== 'active') {
      startTime.value = Date.now()
      tick()
      timer = setInterval(tick, 1000)
    }
    if (call.status !== 'active' && lastStatus === 'active') {
      if (timer) { clearInterval(timer); timer = null }
    }
    lastStatus = call.status
  }
})()

// 状态变化时启停计时（轮询状态，简单可靠）
const statusPoll = setInterval(stopTimer, 500)

onBeforeUnmount(() => {
  clearInterval(statusPoll)
  if (timer) clearInterval(timer)
})
</script>
