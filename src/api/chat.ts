import service from '@/axios';

/** 分页查询参数 */
interface PageParams {
  page?: number;
  pageSize?: number;
}

/** 通用查询参数 */
interface QueryParams {
  [key: string]: unknown;
}

// ==================== 会话 ====================

// 会话列表：GET /api/sessions
export function getSessions() {
  return service.get('/api/sessions');
}

// 会话详情：GET /api/sessions/{id}
export function getSession(sessionId: string) {
  return service.get(`/api/sessions/${sessionId}`);
}

// 会话消息：GET /api/messages/sessions/{sessionId}/messages?page&pageSize
// ⚠️ 2026-08-13 契约核对：挂 MessagesApi（/api/messages 前缀），旧 /api/sessions/{id}/messages 已不存在
export function getMessages(sessionId: string, params: PageParams = {}) {
  return service.get(`/api/messages/sessions/${sessionId}/messages`, { params });
}

// 创建单聊会话：POST /api/sessions { sessionType: 'Private', friendId } -> ApiResponse<Guid>
// ⚠️ 后端契约是 sessionType+friendId（前端旧版 participantId 字段后端不识别，已修正）；
//    私聊幂等：两人会话已存在时直接返回现有 sessionId
export function createSession(friendId: string) {
  return service.post('/api/sessions', { sessionType: 'Private', friendId });
}

// 创建群聊会话：POST /api/sessions { sessionType: 'Group', groupId, sessionName } -> ApiResponse<Guid>
// 建群后调用（后端建群不自动创建会话），返回群会话 ID
export function createGroupSession(groupId: string, sessionName: string) {
  return service.post('/api/sessions', { sessionType: 'Group', groupId, sessionName });
}

// 已读：PUT /api/messages/{id}/read（⚠️ 后端是 PUT，曾误写 POST 会 405）
export function markRead(messageId: string) {
  return service.put(`/api/messages/${messageId}/read`);
}

// 未读总数：GET /api/sessions/unread-count
export function getUnreadCount() {
  return service.get('/api/sessions/unread-count');
}

// ==================== 好友 / 群 ====================

// 好友列表：GET /api/friends
export function getFriends() {
  return service.get('/api/friends');
}

// 群列表：GET /api/groups
export function getGroups() {
  return service.get('/api/groups');
}

// ==================== 会话管理 ====================

// 置顶/取消置顶：PUT /api/sessions/{id}/pin?pin=true|false（query 参数，后端 SetPinStatusAsync）
export function pinSession(sessionId: string) {
  return service.put(`/api/sessions/${sessionId}/pin`, null, { params: { pin: true } });
}

export function unpinSession(sessionId: string) {
  return service.put(`/api/sessions/${sessionId}/pin`, null, { params: { pin: false } });
}

// 免打扰/恢复：PUT /api/sessions/{id}/mute?mute=true|false（query 参数，后端 SetMuteStatusAsync）
export function muteSession(sessionId: string) {
  return service.put(`/api/sessions/${sessionId}/mute`, null, { params: { mute: true } });
}

export function unmuteSession(sessionId: string) {
  return service.put(`/api/sessions/${sessionId}/mute`, null, { params: { mute: false } });
}

// 置顶会话列表：GET /api/sessions/pinned
export function getPinnedSessions() {
  return service.get('/api/sessions/pinned');
}

// 删除会话：DELETE /api/sessions/{id}
export function deleteSession(sessionId: string) {
  return service.delete(`/api/sessions/${sessionId}`);
}

// 会话成员：GET /api/sessions/{id}/participants
export function getSessionParticipants(sessionId: string) {
  return service.get(`/api/sessions/${sessionId}/participants`);
}

// ==================== 消息操作 ====================

// 搜索消息：GET /api/messages/search
export function searchMessages(params: QueryParams = {}) {
  return service.get('/api/messages/search', { params });
}

// 未读消息列表：GET /api/messages/unread
export function getUnreadMessages() {
  return service.get('/api/messages/unread');
}

// 转发消息：POST /api/messages/{id}/forward
export function forwardMessage(messageId: string, payload: QueryParams) {
  return service.post(`/api/messages/${messageId}/forward`, payload);
}

// 删除消息：DELETE /api/messages/{id}
export function deleteMessage(messageId: string) {
  return service.delete(`/api/messages/${messageId}`);
}

// ==================== 好友操作 ====================

// 发送好友请求：POST /api/friends/request
export function sendFriendRequest(payload: QueryParams) {
  return service.post('/api/friends/request', payload);
}

// 处理好友请求：PUT /api/friends/request/{friendId}
export function handleFriendRequest(friendId: string, payload: QueryParams) {
  return service.put(`/api/friends/request/${friendId}`, payload);
}

// 好友请求列表：GET /api/friends/requests
export function getFriendRequests() {
  return service.get('/api/friends/requests');
}

// 已发送请求：GET /api/friends/sent-requests
export function getSentFriendRequests() {
  return service.get('/api/friends/sent-requests');
}

// 删除好友：DELETE /api/friends/{friendId}
export function deleteFriend(friendId: string) {
  return service.delete(`/api/friends/${friendId}`);
}

// 拉黑/取消：PUT /api/friends/{friendId}/block
export function blockFriend(friendId: string) {
  return service.put(`/api/friends/${friendId}/block`);
}

// 好友搜索：GET /api/friends/search
export function searchFriends(params: QueryParams = {}) {
  return service.get('/api/friends/search', { params });
}

// ==================== 群组操作 ====================

// 创建群组：POST /api/groups
export function createGroup(payload: QueryParams) {
  return service.post('/api/groups', payload);
}

// 群成员列表：GET /api/groups/{id}/members
export function getGroupMembers(id: string) {
  return service.get(`/api/groups/${id}/members`);
}

// 群搜索：GET /api/groups/search
export function searchGroups(params: QueryParams = {}) {
  return service.get('/api/groups/search', { params });
}

// ==================== 消息附件与详情 ====================

// 消息详情：GET /api/messages/{id}（含 FileName/MediaUrl/ThumbnailUrl/Attachments 等完整字段）
export function getMessageDetail(messageId: string) {
  return service.get(`/api/messages/${messageId}`);
}

// 消息附件列表：GET /api/messages/{messageId}/attachments -> ApiResponse<List<FileAttachmentDto>>
export function getMessageAttachments(messageId: string) {
  return service.get(`/api/messages/${messageId}/attachments`);
}

// 删除附件：DELETE /api/messages/attachments/{attachmentId}（软删 + 级联 FileDev 物理删除）
export function deleteMessageAttachment(attachmentId: string) {
  return service.delete(`/api/messages/attachments/${attachmentId}`);
}

// ==================== 聊天文件上传 ====================

/** 聊天小文件/图片直传上限（与后端 SmallFileSizeLimit 一致，超限按分片处理） */
const CHAT_UPLOAD_LIMIT = 10 * 1024 * 1024;
/** 上传不走默认 5s 超时（大文件耗时） */
const CHAT_UPLOAD_TIMEOUT = 60000;

export async function uploadChatImage(file: File, description = 'chat-image') {
  if (file.size > CHAT_UPLOAD_LIMIT) return uploadChatByChunks(file, description);
  const form = new FormData();
  form.append('file', file);
  form.append('description', description);
  // ⚠️ 消息附件走权限通道（isPublic=false），媒体渲染用返回的 FileRef.FileUri 直链
  return service.post('/api/files/upload-image', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: CHAT_UPLOAD_TIMEOUT
  });
}

export async function uploadChatFile(file: File, description = 'chat-file') {
  if (file.size <= CHAT_UPLOAD_LIMIT) {
    const form = new FormData();
    form.append('file', file);
    form.append('description', description);
    form.append('isPublic', 'false');
    return service.post('/api/files/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: CHAT_UPLOAD_TIMEOUT
    });
  }
  return uploadChatByChunks(file, description);
}

/** 大文件分片上传（init → 逐片 upload → merge），返回与直传一致的响应结构 */
async function uploadChatByChunks(file: File, description: string) {
  const buf = await file.arrayBuffer();
  const init = await service.post(
    '/api/files/chunk/init',
    { fileName: file.name, totalSize: file.size, fileMd5: null, description, isPublic: false },
    { timeout: CHAT_UPLOAD_TIMEOUT }
  );
  const meta = init && init.data ? init.data : init;
  const { fileKey, totalChunks, chunkSize, uploadedChunks = [] } = meta || {};
  if (!fileKey || !totalChunks) throw new Error('分片初始化失败');
  const uploaded = new Set(uploadedChunks);
  for (let i = 0; i < totalChunks; i++) {
    if (uploaded.has(i)) continue;
    const start = i * chunkSize;
    const chunk = new Blob([buf.slice(start, Math.min(start + chunkSize, file.size))]);
    const form = new FormData();
    form.append('fileKey', fileKey);
    form.append('chunkIndex', String(i));
    form.append('file', chunk, `chunk-${i}`);
    await service.post('/api/files/chunk/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: CHAT_UPLOAD_TIMEOUT
    });
  }
  return service.post(
    '/api/files/chunk/merge',
    { fileKey, fileName: file.name, description },
    { timeout: CHAT_UPLOAD_TIMEOUT }
  );
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
};
