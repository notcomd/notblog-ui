import service from '@/axios'

// ==================== 会话 ====================

// 会话列表：GET /api/sessions
export function getSessions() {
  return service.get('/api/sessions')
}

// 会话详情：GET /api/sessions/{id}
export function getSession(sessionId) {
  return service.get(`/api/sessions/${sessionId}`)
}

// 会话消息：GET /api/sessions/{sessionId}/messages?page&pageSize
export function getMessages(sessionId, params = {}) {
  return service.get(`/api/sessions/${sessionId}/messages`, { params })
}

// 创建会话（单聊）：POST /api/sessions { participantId }
export function createSession(participantId) {
  return service.post('/api/sessions', { participantId })
}

// 已读：POST /api/messages/{id}/read
export function markRead(messageId) {
  return service.post(`/api/messages/${messageId}/read`)
}

// 未读总数：GET /api/sessions/unread-count
export function getUnreadCount() {
  return service.get('/api/sessions/unread-count')
}

// ==================== 好友 / 群 ====================

// 好友列表：GET /api/friends
export function getFriends() {
  return service.get('/api/friends')
}

// 群列表：GET /api/groups
export function getGroups() {
  return service.get('/api/groups')
}

// ==================== 会话管理 ====================

// 置顶/取消置顶：PUT /api/sessions/{id}/pin
export function pinSession(sessionId) {
  return service.put(`/api/sessions/${sessionId}/pin`)
}

export function unpinSession(sessionId) {
  return service.delete(`/api/sessions/${sessionId}/pin`)
}

// 免打扰/恢复：PUT /api/sessions/{id}/mute
export function muteSession(sessionId) {
  return service.put(`/api/sessions/${sessionId}/mute`)
}

export function unmuteSession(sessionId) {
  return service.delete(`/api/sessions/${sessionId}/mute`)
}

// 删除会话：DELETE /api/sessions/{id}
export function deleteSession(sessionId) {
  return service.delete(`/api/sessions/${sessionId}`)
}

// 会话成员：GET /api/sessions/{id}/participants
export function getSessionParticipants(sessionId) {
  return service.get(`/api/sessions/${sessionId}/participants`)
}

// ==================== 消息操作 ====================

// 搜索消息：GET /api/messages/search
export function searchMessages(params = {}) {
  return service.get('/api/messages/search', { params })
}

// 未读消息列表：GET /api/messages/unread
export function getUnreadMessages() {
  return service.get('/api/messages/unread')
}

// 转发消息：POST /api/messages/{id}/forward
export function forwardMessage(messageId, payload) {
  return service.post(`/api/messages/${messageId}/forward`, payload)
}

// 删除消息：DELETE /api/messages/{id}
export function deleteMessage(messageId) {
  return service.delete(`/api/messages/${messageId}`)
}

// ==================== 好友操作 ====================

// 发送好友请求：POST /api/friends/request
export function sendFriendRequest(payload) {
  return service.post('/api/friends/request', payload)
}

// 处理好友请求：PUT /api/friends/request/{friendId}
export function handleFriendRequest(friendId, payload) {
  return service.put(`/api/friends/request/${friendId}`, payload)
}

// 好友请求列表：GET /api/friends/requests
export function getFriendRequests() {
  return service.get('/api/friends/requests')
}

// 已发送请求：GET /api/friends/sent-requests
export function getSentFriendRequests() {
  return service.get('/api/friends/sent-requests')
}

// 删除好友：DELETE /api/friends/{friendId}
export function deleteFriend(friendId) {
  return service.delete(`/api/friends/${friendId}`)
}

// 拉黑/取消：PUT /api/friends/{friendId}/block
export function blockFriend(friendId) {
  return service.put(`/api/friends/${friendId}/block`)
}

// 好友搜索：GET /api/friends/search
export function searchFriends(params = {}) {
  return service.get('/api/friends/search', { params })
}

// ==================== 群组操作 ====================

// 创建群组：POST /api/groups
export function createGroup(payload) {
  return service.post('/api/groups', payload)
}

// 群成员列表：GET /api/groups/{id}/members
export function getGroupMembers(id) {
  return service.get(`/api/groups/${id}/members`)
}

// 群搜索：GET /api/groups/search
export function searchGroups(params = {}) {
  return service.get('/api/groups/search', { params })
}

// ==================== 常量 ====================

// 与后端 MessageType 枚举一致（数字序列化）
export const MessageType = {
  Text: 0,
  Image: 1,
  Video: 2,
  Audio: 3,
  File: 4,
  Push: 5,
  Location: 6,
  Link: 7,
  Expression: 8,
  Other: 9
}
