import { ref } from 'vue'
import { defineStore } from 'pinia'
import {
  getSessions, getMessages, getFriends, getGroups, getUnreadCount, MessageType
} from '@/api/chat'
import { connectSignalR, isConnected } from '@/socket/signalr'

export const useChatStore = defineStore('chat', () => {
  // ===== 状态 =====
  const sessions = ref([])              // 会话列表（未读置顶 + 最近活跃排序）
  const friends = ref([])               // 好友列表
  const groups = ref([])                // 群列表
  const messages = ref({})              // { sessionId: [MessageDto] }
  const activeSessionId = ref('')
  const unreadTotal = ref(0)            // 铃铛未读数
  const onlineUsers = ref({})           // { userId: true/false } 在线状态（SignalR 事件驱动）
  const typing = ref({})                // { sessionId: userId } 正在输入
  const connected = ref(false)
  const messageLoading = ref({})       // { sessionId: bool } 消息加载锁（按会话粒度，曾为全局 bool 锁）
  const hasMoreMessages = ref({})       // { sessionId: bool }

  // ===== 会话 =====
  async function loadSessions() {
    try {
      const res = await getSessions()
      const data = res && res.data ? res.data : res
      const list = data.items || data.list || data || []
      sessions.value = sortSessions(list)
    } catch (e) {
      console.error('加载会话失败:', e)
    }
  }

  function sortSessions(list) {
    return [...list].sort((a, b) => {
      // 置顶优先
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1
      // 未读其次
      if ((a.unreadCount || 0) > 0 !== (b.unreadCount || 0) > 0) return (a.unreadCount || 0) > 0 ? -1 : 1
      // 最近活跃
      return (b.lastMessageTime || b.createdTime || 0) - (a.lastMessageTime || a.createdTime || 0)
    })
  }

  async function loadFriends() {
    try {
      const res = await getFriends()
      const data = res && res.data ? res.data : res
      friends.value = data.items || data.list || data || []
    } catch (e) {
      console.error('加载好友失败:', e)
    }
  }

  async function loadGroups() {
    try {
      const res = await getGroups()
      const data = res && res.data ? res.data : res
      groups.value = data.items || data.list || data || []
    } catch (e) {
      console.error('加载群组失败:', e)
    }
  }

  async function loadUnread() {
    try {
      const res = await getUnreadCount()
      const data = res && res.data ? res.data : res
      unreadTotal.value = (data && (data.total !== undefined ? data.total : data.unreadCount)) || 0
    } catch (e) { /* 静默 */ }
  }

  // ===== 消息 =====
  async function openSession(sessionId) {
    if (activeSessionId.value === sessionId) {
      // ⚠️ 已激活但消息为空（首次加载失败/被并发锁吞掉）→ 补加载；
      //    否则该会话永远打不开，必须刷新重置 store 才能重试（用户反馈「点击会话要刷新才出现内容」）
      if (!messages.value[sessionId] || !messages.value[sessionId].length) {
        await loadMessages(sessionId, true)
      }
      return
    }
    activeSessionId.value = sessionId
    if (!messages.value[sessionId]) {
      await loadMessages(sessionId, true)
    }
    // 打开会话即通知服务端已读（SignalR MarkAsRead 逐条），并清零本会话未读角标
    await markSessionRead(sessionId)
  }

  async function loadMessages(sessionId, reset = false) {
    // 按会话粒度锁（曾为全局锁：会话 A 加载中点击会话 B 会被静默吞掉 → B 永远空白）
    if (messageLoading.value[sessionId]) return
    messageLoading.value[sessionId] = true
    try {
      const page = reset ? 1 : (Math.floor((messages.value[sessionId] || []).length / 30) + 1)
      const res = await getMessages(sessionId, { page, pageSize: 30 })
      const data = res && res.data ? res.data : res
      const list = data.items || data.list || []
      if (reset) {
        messages.value[sessionId] = list
      } else if (list.length) {
        messages.value[sessionId] = [...list.reverse(), ...(messages.value[sessionId] || [])]
      }
      hasMoreMessages.value[sessionId] = list.length >= 30
    } catch (e) {
      console.error('加载消息失败:', e)
    } finally {
      messageLoading.value[sessionId] = false
    }
  }

    // 发送文本消息；retryMessageId 存在时表示重发失败消息（复用原 messageId，避免重复插入）
    // 状态约定：0=发送中, 1=已发送, -1=发送失败
    async function sendText(sessionId, content, retryMessageId = null) {
      const me = currentUserId()
      const messageId = retryMessageId || 'local-' + Date.now()
      const msg = {
        messageId,
        sessionId,
        senderId: me,
        receiverId: null,
        messageType: MessageType.Text,
        status: 0,
        content,
        sentTime: Date.now()
      }

      const list = messages.value[sessionId] || []
      const existing = list.find(m => m.messageId === messageId)
      if (existing) {
        Object.assign(existing, msg)
      } else {
        pushMessage(msg)
      }
      bumpSession(sessionId, content)

      try {
        const conn = await connectSignalR()
        await conn.invoke('SendMessage', sessionId, {
          sessionId,
          messageType: MessageType.Text,
          content,
          fileId: null,
          thumbnailFileId: null,
          duration: null,
          caption: null,
          latitude: null,
          longitude: null,
          locationName: null,
          linkUrl: null,
          linkTitle: null,
          linkDescription: null,
          expressionCode: null,
          replyToMessageId: null
        })
        const sent = (messages.value[sessionId] || []).find(m => m.messageId === messageId)
        if (sent) sent.status = 1
      } catch (e) {
        console.error('发送消息失败:', e)
        const failed = (messages.value[sessionId] || []).find(m => m.messageId === messageId)
        if (failed) failed.status = -1
        throw e
      }
      return msg
    }

    // 重发失败消息
    async function retryMessage(sessionId, messageId) {
      const list = messages.value[sessionId] || []
      const target = list.find(m => m.messageId === messageId)
      if (!target || target.status !== -1) return false
      await sendText(sessionId, target.content, target.messageId)
      return true
    }


  async function sendTyping(sessionId) {
    if (!isConnected()) return
    try {
      const conn = await connectSignalR()
      await conn.invoke('SendTypingIndicator', sessionId)
    } catch (e) { /* 静默 */ }
  }

  async function markSessionRead(sessionId) {
    const list = messages.value[sessionId] || []
    if (!list.length) return
    try {
      const conn = await connectSignalR()
      for (const m of list) {
        if (m.senderId !== currentUserId()) {
          await conn.invoke('MarkAsRead', m.messageId)
          m.isRead = true
        }
      }
    } catch (e) { /* 静默 */ }
  }

  // ===== 内部工具 =====
  function currentUserId() {
    // 当前用户 ID 从 JWT payload 解析
    // ⚠️ Identity 签发的 JWT claim 名是完整 URI（.NET 10 不压缩），payload 无 sub
    const t = localStorage.getItem('token')
    try {
      const payload = JSON.parse(decodeURIComponent(escape(atob(t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))))
      return payload.sub || payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || ''
    } catch (e) {
      return ''
    }
  }

  function peerIdOf(sessionId) {
    const s = sessions.value.find(x => x.sessionId === sessionId)
    const me = currentUserId()
    if (!s || !s.participants) return 'u-002'
    return s.participants.find(p => p !== me) || 'u-002'
  }

  function sessionName(sessionId) {
    const s = sessions.value.find(x => x.sessionId === sessionId)
    if (s && s.sessionName) return s.sessionName
    // 单聊：从好友列表找
    const peerId = peerIdOf(sessionId)
    const f = friends.value.find(x => String(x.friendId) === String(peerId))
    return f ? f.friendName : '会话'
  }

  function pushMessage(msg) {
    const list = messages.value[msg.sessionId] || []
    // 去重（本地乐观消息与服务器回执）
    if (list.some(m => m.messageId === msg.messageId)) return
    messages.value[msg.sessionId] = [...list, msg]
  }

  function bumpSession(sessionId, content) {
    const s = sessions.value.find(x => x.sessionId === sessionId)
    if (s) {
      s.lastMessageContent = content
      s.lastMessageTime = Date.now()
      sessions.value = sortSessions(sessions.value)
    }
  }

  function clearUnread(sessionId) {
    const s = sessions.value.find(x => x.sessionId === sessionId)
    if (s && s.unreadCount) {
      s.unreadCount = 0
      sessions.value = sortSessions(sessions.value)
      loadUnread()
    }
  }

  // ===== SignalR 事件绑定 =====
  async function initRealtime() {
    if (connected.value) return
    try {
      const conn = await connectSignalR()

      conn.on('ReceiveMessage', (message) => {
        pushMessage(message)
        bumpSession(message.sessionId, message.content || '[附件消息]')
        if (message.sessionId !== activeSessionId.value) {
          const s = sessions.value.find(x => x.sessionId === message.sessionId)
          if (s) {
            s.unreadCount = (s.unreadCount || 0) + 1
            sessions.value = sortSessions(sessions.value)
          }
          loadUnread()
        }
      })

      conn.on('MessageRecalled', (messageId) => {
        for (const sessionId of Object.keys(messages.value)) {
          const list = messages.value[sessionId]
          const m = list.find(x => x.messageId === messageId)
          if (m) m.isRecalled = true
        }
      })

      conn.on('UserOnline', (userId) => {
        onlineUsers.value[String(userId)] = true
      })

      conn.on('UserOffline', (userId) => {
        onlineUsers.value[String(userId)] = false
      })

      conn.on('TypingIndicator', (sessionId, userId) => {
        typing.value[sessionId] = String(userId)
        // 3 秒后清除
        setTimeout(() => {
          if (typing.value[sessionId] === String(userId)) delete typing.value[sessionId]
        }, 3000)
      })

      conn.on('UnreadCountUpdated', (sessionId, count) => {
        const s = sessions.value.find(x => x.sessionId === sessionId)
        if (s) s.unreadCount = count
        loadUnread()
      })

      connected.value = true
      console.log('SignalR 已连接')
    } catch (e) {
      console.error('SignalR 初始化失败:', e)
    }
  }

  function removeSession(sessionId) {
    sessions.value = sessions.value.filter(s => s.sessionId !== sessionId)
    delete messages.value[sessionId]
    if (activeSessionId.value === sessionId) activeSessionId.value = null
  }

  return {
    sessions, friends, groups, messages, activeSessionId, unreadTotal,
    onlineUsers, typing, connected, messageLoading, hasMoreMessages,
    loadSessions, loadFriends, loadGroups, loadUnread, openSession,
      loadMessages, retryMessage, sendText, sendTyping, markSessionRead, clearUnread,
    sessionName, peerIdOf, currentUserId, initRealtime, removeSession
  }
})
