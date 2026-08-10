import service from '@/axios'
// ==================== 工作台 ====================
export function getAdminStats() {
  // ⚠️ 后端缺口：无运营统计聚合端点，返回空态
  return Promise.resolve({ data: {} })
}

export function getAdminActivityLog() {
  // ⚠️ 后端缺口：无操作日志端点，返回空态
  return Promise.resolve({ data: [] })
}

// ==================== 用户管理 ====================
// 用户列表：真实用 Identity GetUserAllAsync（无鉴权，返回完整 User 实体）
export function getAdminUsers(params = {}) {
  return service.get('/api/identity/manger/user-manager/GetUserAllAsync').then(res => {
    const data = res && res.data ? res.data : res
    const list = Array.isArray(data) ? data : (data.items || data.list || [])
    // 客户端过滤/分页（后端返回全量）
    const kw = (params.keyword || '').toLowerCase()
    let filtered = list
    if (kw) filtered = filtered.filter(u => (u.userName || '').toLowerCase().includes(kw) || (u.userEmail || '').toLowerCase().includes(kw) || (u.userGuid || '').includes(kw))
    const page = params.page || 1
    const pageSize = params.pageSize || 10
    const items = filtered.slice((page - 1) * pageSize, page * pageSize)
    return { ...res, data: { items, totalCount: filtered.length, page, pageSize } }
  })
}

// ⚠️ 封禁/删除用户后端无端点（缺口 #1/#2），先用 mock
export function addAdminUser() {
  // ⚠️ 后端缺口：无添加用户端点
  return Promise.resolve({ data: {} })
}

export function banAdminUser() {
  // ⚠️ 后端缺口：无封禁用户端点
  return Promise.resolve({ data: {} })
}

export function deleteAdminUser() {
  // ⚠️ 后端缺口：无删除用户端点
  return Promise.resolve({ data: {} })
}

export function getAdminOnlineUsers() {
  // ⚠️ 后端缺口：无在线用户列表端点，返回空态
  return Promise.resolve({ data: [] })
}

// ==================== 内容审核（后端完整：AuditApi） ====================
// GET /api/audit/tweets/pending?page&pageSize（PagedResult 字段是 TotalCount！）
export function getPendingTweets(params = {}) {
  return service.get('/api/audit/tweets/pending', { params })
}

export function approveTweet(tweetGuid) {
  return service.post(`/api/audit/tweets/${tweetGuid}/approve`)
}

export function rejectTweet(tweetGuid, reason) {
  return service.post(`/api/audit/tweets/${tweetGuid}/reject`, { reason })
}

// ⚠️ 屏蔽/删除内容后端无管理端点
export function blockTweet() {
  // ⚠️ 后端缺口：无屏蔽内容端点
  return Promise.resolve({ data: {} })
}

export function deleteTweet() {
  // ⚠️ 后端缺口：无删除内容端点
  return Promise.resolve({ data: {} })
}

// ==================== 举报管理（后端完整：AuditApi） ====================
export function getReports(params = {}) {
  return service.get('/api/audit/reports/pending', { params })
}

// resolve: action === 'removed' 时删除内容，其他值仅标记处理
export function resolveReport(reportGuid, payload) {
  return service.post(`/api/audit/reports/${reportGuid}/resolve`, payload)
}

// ==================== 社区管理 ====================
// ⚠️ 全量社区列表后端无端点（缺口 #5），操作真实
export function getAdminCircles() {
  // ⚠️ 后端缺口：无全量社区列表端点，返回空态
  return Promise.resolve({ data: [] })
}

export function getAdminCircleMembers(circleGuid) {
  return service.get(`/api/circles/${circleGuid}/members`)
}

export function banCircle() {
  // ⚠️ 后端缺口：无封禁社区端点
  return Promise.resolve({ data: {} })
}

export function dissolveCircle(circleGuid) {
  return service.delete(`/api/circles/${circleGuid}`)
}

export function transferCircle(circleGuid, newOwnerGuid) {
  return service.post(`/api/circles/${circleGuid}/transfer`, { newOwnerGuid })
}

export function removeCircleMember(circleGuid, userGuid) {
  return service.delete(`/api/circles/${circleGuid}/members/${userGuid}`)
}

// ==================== 文件管理（后端缺口 #4，全 mock） ====================
export function getAdminFiles() {
  // ⚠️ 后端缺口：无文件管理列表端点，返回空态
  return Promise.resolve({ data: { items: [], totalCount: 0 } })
}

export function deleteAdminFile() {
  // ⚠️ 后端缺口：无删除文件端点
  return Promise.resolve({ data: {} })
}

// ==================== 公报（后端缺口 #3，全 mock） ====================
export function getAnnouncements() {
  // ⚠️ 后端缺口：无公报列表端点，返回空态
  return Promise.resolve({ data: [] })
}

export function sendAnnouncement() {
  // ⚠️ 后端缺口：无公报发送端点
  return Promise.resolve({ data: {} })
}

export function recallAnnouncement() {
  // ⚠️ 后端缺口：无公报撤回端点
  return Promise.resolve({ data: {} })
}
