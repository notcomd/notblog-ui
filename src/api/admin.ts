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

// ==================== 工作台 ====================
export function getAdminStats() {
  // 后端暂未提供该端点，先返回空态
  return Promise.resolve({ data: {} });
}

export function getAdminActivityLog() {
  // 后端暂未提供该端点，先返回空态
  return Promise.resolve({ data: [] });
}

// ==================== 用户管理 ====================
// ⚠️ 原实现调用无鉴权 Identity GetUserAllAsync，会泄露完整 User 实体（含 PasswordHash）。
// 已从前端移除；需后端提供安全的鉴权管理接口后再恢复。
export function getAdminUsers() {
  return Promise.resolve({ data: { items: [], totalCount: 0, page: 1, pageSize: 10 } });
}

// 用户新增/封禁/删除后端暂未提供端点
export function addAdminUser() {
  // 后端暂未提供该端点；严禁将此操作伪装为成功，避免误操作
  return Promise.reject(new Error('添加用户功能尚未接入后端，操作未执行'));
}

export function banAdminUser() {
  // 后端暂未提供该端点；严禁将此操作伪装为成功，避免误操作
  return Promise.reject(new Error('封禁用户功能尚未接入后端，操作未执行'));
}

export function deleteAdminUser() {
  // 后端暂未提供该端点；严禁将此操作伪装为成功，避免误操作
  return Promise.reject(new Error('删除用户功能尚未接入后端，操作未执行'));
}

export function getAdminOnlineUsers() {
  // 后端暂未提供该端点，先返回空态
  return Promise.resolve({ data: [] });
}

// ==================== 内容审核（后端完整：AuditApi） ====================
// GET /api/audit/tweets/pending?page&pageSize（PagedResult 字段是 TotalCount！）
export function getPendingTweets(params: PageParams = {}) {
  return service.get('/api/audit/tweets/pending', { params });
}

export function approveTweet(tweetGuid: string) {
  return service.post(`/api/audit/tweets/${tweetGuid}/approve`);
}

export function rejectTweet(tweetGuid: string, reason: string) {
  return service.post(`/api/audit/tweets/${tweetGuid}/reject`, { reason });
}

// 屏蔽/删除内容后端暂无管理端点
export function blockTweet() {
  // 后端暂未提供该端点；严禁将此操作伪装为成功，避免误操作
  return Promise.reject(new Error('屏蔽内容功能尚未接入后端，操作未执行'));
}

export function deleteTweet() {
  // 后端暂未提供该端点；严禁将此操作伪装为成功，避免误操作
  return Promise.reject(new Error('删除内容功能尚未接入后端，操作未执行'));
}

// ==================== 举报管理（后端完整：AuditApi） ====================
export function getReports(params: PageParams = {}) {
  return service.get('/api/audit/reports/pending', { params });
}

// resolve: action === 'removed' 时删除内容，其他值仅标记处理
export function resolveReport(reportGuid: string, payload: QueryParams) {
  return service.post(`/api/audit/reports/${reportGuid}/resolve`, payload);
}

// ==================== 社区管理 ====================
// 全量社区列表后端暂无端点；操作（解散/转让/成员）使用真实端点
export function getAdminCircles() {
  // 后端暂未提供该端点，先返回空态
  return Promise.resolve({ data: [] });
}

export function getAdminCircleMembers(circleGuid: string) {
  return service.get(`/api/circles/${circleGuid}/members`);
}

export function banCircle() {
  // 后端暂未提供该端点；严禁将此操作伪装为成功，避免误操作
  return Promise.reject(new Error('封禁社区功能尚未接入后端，操作未执行'));
}

export function dissolveCircle(circleGuid: string) {
  return service.delete(`/api/circles/${circleGuid}`);
}

export function transferCircle(circleGuid: string, newOwnerGuid: string) {
  return service.post(`/api/circles/${circleGuid}/transfer`, { newOwnerGuid });
}

export function removeCircleMember(circleGuid: string, userGuid: string) {
  return service.delete(`/api/circles/${circleGuid}/members/${userGuid}`);
}

// ==================== 文件管理（后端暂未提供端点，空态） ====================
export function getAdminFiles() {
  // 后端暂未提供该端点，先返回空态
  return Promise.resolve({ data: { items: [], totalCount: 0 } });
}

export function deleteAdminFile() {
  // 后端暂未提供该端点；严禁将此操作伪装为成功，避免误操作
  return Promise.reject(new Error('删除文件功能尚未接入后端，操作未执行'));
}

// ==================== 公报（后端暂未提供端点，空态） ====================
export function getAnnouncements() {
  // 后端暂未提供该端点，先返回空态
  return Promise.resolve({ data: [] });
}

export function sendAnnouncement() {
  // 后端暂未提供该端点；严禁将此操作伪装为成功，避免误操作
  return Promise.reject(new Error('公报发送功能尚未接入后端，操作未执行'));
}

export function recallAnnouncement() {
  // 后端暂未提供该端点；严禁将此操作伪装为成功，避免误操作
  return Promise.reject(new Error('公报撤回功能尚未接入后端，操作未执行'));
}
