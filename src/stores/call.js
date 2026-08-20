import { defineStore } from 'pinia'
import { reactive } from 'vue'
import { connectCallSignalR } from '@/socket/callSignalR'
import { useToastStore } from '@/stores/toast'
import { useAuthStore } from '@/stores/auth'

// ============================================================
// 语音/视频通话 store（CallHub，WebRTC over SignalR，Mesh 全网状）
//
// 状态机：idle → ringing（呼叫方等待）｜incoming（被叫来电）→ active（通话中）→ ended/idle
//
// 拓扑约定（与后端 CallSessionStore 一致）：
//  - 通话建立/成员加入后，由「新加入成员」向每个既有成员发送 offer；
//  - 被 offer 方回 answer；双方随时互发 ice candidate；
//  - 服务端仅转发信令，媒体流为 P2P 直连。
// ============================================================

// 每个远端用户一个 RTCPeerConnection（非响应式，避免 proxy 开销）
const pcs = new Map()
let bound = false // 事件绑定只做一次

const ICE_SERVERS = [{ urls: 'stun:stun.l.google.com:19302' }]

export const useCallStore = defineStore('call', {
  state: () => ({
    status: 'idle',              // idle | ringing | incoming | active | ended
    callId: null,
    sessionId: null,
    type: null,                  // 'Audio' | 'Video'
    callerId: null,
    participants: [],
    joinedMembers: [],
    busyUsers: [],
    offlineUsers: [],
    endReason: '',               // 结束原因（展示用）
    localStream: null,
    remoteStreams: reactive({}), // userId -> MediaStream
    myId: ''
  }),

  actions: {
    // ---------- 呼叫控制 ----------

    async startCall(sessionId, type) {
      if (this.status === 'active' || this.status === 'ringing') {
        useToastStore().push('已有通话进行中', 'error')
        return
      }
      try {
        this.myId = (useAuthStore().user && useAuthStore().user.id) || ''
        const conn = await connectCallSignalR()
        this.bindEvents(conn)
        const result = await conn.invoke('StartCall', sessionId, type)
        this.status = 'ringing'
        this.callId = result.callId
        this.sessionId = sessionId
        this.type = type
        this.callerId = result.callerId
        this.participants = result.participants || []
        this.busyUsers = result.busyUsers || []
        this.offlineUsers = result.offlineUsers || []
        if (this.busyUsers.length || this.offlineUsers.length) {
          const busy = this.busyUsers.length ? ` ${this.busyUsers.length} 人忙线` : ''
          const off = this.offlineUsers.length ? ` ${this.offlineUsers.length} 人离线` : ''
          useToastStore().push(`呼叫已发起（${busy || ''}${off || ''}）`, 'info')
        }
      } catch (e) {
        useToastStore().push(`发起呼叫失败: ${e.message || '请稍后重试'}`, 'error')
      }
    },

    async acceptCall() {
      if (!this.callId) return
      try {
        const conn = await connectCallSignalR()
        const call = await conn.invoke('AcceptCall', this.callId)
        if (!call) { this.reset(); return }
        await this.enterActive(call)
      } catch (e) {
        useToastStore().push(`接听失败: ${e.message || '请稍后重试'}`, 'error')
        this.reset()
      }
    },

    async rejectCall() {
      try {
        const conn = await connectCallSignalR()
        await conn.invoke('RejectCall', this.callId)
      } catch (e) { /* 忽略 */ }
      this.reset()
    },

    async cancelCall() {
      try {
        const conn = await connectCallSignalR()
        await conn.invoke('CancelCall', this.callId)
      } catch (e) { /* 忽略 */ }
      this.cleanupMedia()
      this.reset()
    },

    async hangUp() {
      try {
        const conn = await connectCallSignalR()
        await conn.invoke('HangUp', this.callId)
      } catch (e) { /* 忽略 */ }
      this.cleanupMedia()
      this.reset()
    },

    // ---------- 事件绑定（服务端 → 客户端） ----------

    bindEvents(conn) {
      if (bound) return
      bound = true

      // 被叫收到来电
      conn.on('IncomingCall', (call) => {
        this.myId = (useAuthStore().user && useAuthStore().user.id) || ''
        if (this.status === 'active') return // 忙线由服务端判定，双保险
        this.status = 'incoming'
        this.callId = call.callId
        this.sessionId = call.sessionId
        this.type = call.type
        this.callerId = call.callerId
        this.participants = call.participants || []
        this.joinedMembers = call.joinedMembers || []
      })

      // 通话建立（呼叫方/已接通成员收到）→ 等新加入者 offer
      conn.on('CallStarted', (call) => {
        this.status = 'active'
        this.callId = call.callId
        this.sessionId = call.sessionId
        this.type = call.type
        this.callerId = call.callerId
        this.participants = call.participants || []
        this.joinedMembers = call.joinedMembers || []
        this.ensureLocalMedia()
      })

      // 通话结束
      conn.on('CallEnded', (call, reason) => {
        this.endReason = reason
        this.cleanupMedia()
        this.status = 'ended'
        // 3.5s 后自动关闭面板
        setTimeout(() => { if (this.status === 'ended') this.reset() }, 3500)
      })

      // 成员接通（群组）→ 既有成员等待其 offer
      conn.on('MemberJoined', (call, _memberId) => {
        this.joinedMembers = call.joinedMembers || []
      })

      // 成员离开（群组）
      conn.on('MemberLeft', (call, memberId) => {
        this.joinedMembers = call.joinedMembers || []
        const pc = pcs.get(String(memberId))
        if (pc) { pc.close(); pcs.delete(String(memberId)) }
        delete this.remoteStreams[String(memberId)]
      })

      // 成员拒绝（通知呼叫方）
      conn.on('MemberRejected', (_call, _memberId) => {
        useToastStore().push('对方拒绝了通话', 'info')
      })

      // WebRTC 信令转发
      conn.on('Signal', (signal) => {
        this.handleSignal(signal)
      })
    },

    // ---------- WebRTC ----------

    async enterActive(call) {
      // 新加入成员：获取本地媒体 → 向每个既有成员发 offer
      this.myId = (useAuthStore().user && useAuthStore().user.id) || ''
      this.status = 'active'
      this.callId = call.callId
      this.sessionId = call.sessionId
      this.type = call.type
      this.callerId = call.callerId
      this.participants = call.participants || []
      this.joinedMembers = call.joinedMembers || []
      const ok = await this.ensureLocalMedia()
      if (!ok) { this.cleanupMedia(); this.reset(); return }
      const others = this.joinedMembers.filter((id) => String(id) !== String(this.myId))
      for (const uid of others) {
        await this.sendOfferTo(uid)
      }
    },

    async ensureLocalMedia() {
      if (this.localStream) return true
      try {
        const constraints = this.type === 'Video'
          ? { audio: true, video: { width: { ideal: 1280 }, height: { ideal: 720 } } }
          : { audio: true }
        this.localStream = await navigator.mediaDevices.getUserMedia(constraints)
        // 已有 pc（理论上刚进入无 pc，保险处理）补加轨道
        for (const pc of pcs.values()) {
          for (const track of this.localStream.getTracks()) {
            pc.addTrack(track, this.localStream)
          }
        }
        return true
      } catch (e) {
        useToastStore().push('无法获取麦克风/摄像头权限', 'error')
        return false
      }
    },

    createPc(userId) {
      const key = String(userId)
      if (pcs.has(key)) return pcs.get(key)
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS })
      pcs.set(key, pc)

      // 本地媒体轨道（若已获取）
      if (this.localStream) {
        for (const track of this.localStream.getTracks()) {
          pc.addTrack(track, this.localStream)
        }
      }

      // 远端流
      pc.ontrack = (e) => {
        this.remoteStreams[key] = e.streams[0]
      }

      // ICE candidate 转发
      pc.onicecandidate = (e) => {
        if (!e.candidate || !this.callId) return
        this.sendSignal({
          callId: this.callId,
          toUserId: userId,
          kind: 'ice',
          candidate: e.candidate.candidate,
          sdpMid: e.candidate.sdpMid,
          sdpMLineIndex: e.candidate.sdpMLineIndex
        })
      }

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
          pc.close()
          pcs.delete(key)
          delete this.remoteStreams[key]
        }
      }
      return pc
    },

    async sendOfferTo(userId) {
      if (!this.localStream) return
      const pc = this.createPc(userId)
      try {
        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)
        this.sendSignal({
          callId: this.callId,
          toUserId: userId,
          kind: 'offer',
          sdp: offer.sdp
        })
      } catch (e) {
        console.error('发送 offer 失败:', e)
      }
    },

    async handleSignal(signal) {
      const from = String(signal.fromUserId)
      try {
        if (signal.kind === 'offer') {
          const pc = this.createPc(from)
          await pc.setRemoteDescription({ type: 'offer', sdp: signal.sdp })
          const answer = await pc.createAnswer()
          await pc.setLocalDescription(answer)
          this.sendSignal({
            callId: signal.callId,
            toUserId: signal.fromUserId,
            kind: 'answer',
            sdp: answer.sdp
          })
        } else if (signal.kind === 'answer') {
          const pc = pcs.get(from)
          if (pc) await pc.setRemoteDescription({ type: 'answer', sdp: signal.sdp })
        } else if (signal.kind === 'ice') {
          const pc = this.createPc(from)
          await pc.setRemoteDescription({
            type: 'candidate',
            candidate: {
              candidate: signal.candidate,
              sdpMid: signal.sdpMid,
              sdpMLineIndex: signal.sdpMLineIndex
            }
          })
        }
      } catch (e) {
        console.error('信令处理失败:', e)
      }
    },

    async sendSignal(signal) {
      try {
        const conn = await connectCallSignalR()
        await conn.invoke('SendSignal', signal)
      } catch (e) {
        console.error('信令发送失败:', e)
      }
    },

    // ---------- 清理 ----------

    cleanupMedia() {
      for (const pc of pcs.values()) {
        try { pc.close() } catch (e) { /* 忽略 */ }
      }
      pcs.clear()
      if (this.localStream) {
        for (const track of this.localStream.getTracks()) track.stop()
        this.localStream = null
      }
      Object.keys(this.remoteStreams).forEach((k) => delete this.remoteStreams[k])
    },

    reset() {
      this.status = 'idle'
      this.callId = null
      this.sessionId = null
      this.type = null
      this.callerId = null
      this.participants = []
      this.joinedMembers = []
      this.busyUsers = []
      this.offlineUsers = []
      this.endReason = ''
      this.localStream = null
      Object.keys(this.remoteStreams).forEach((k) => delete this.remoteStreams[k])
    }
  }
})
