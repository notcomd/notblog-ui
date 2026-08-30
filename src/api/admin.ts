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

/** 从后端响应中解出业务数据（兼容 ApiResponse 包装与裸对象） */
function unwrap(res: any): any {
  if (!res) return null;
  const d = res && res.data !== undefined ? res.data : res;
  return d && d.data !== undefined ? d.data : d;
}

/** 短 ID 展示（8 位） */
function shortId(id: any): string {
  return String(id || '').slice(0, 8);
}

// ==================== 工作台（/api/audit/*） ====================
// 运营统计：消息域统计 + 用户总数（借道用户管理 API 的 totalCount）
export async function getAdminStats() {
  const [s, u] = await Promise.all([
    service.get('/api/audit/stats').catch(() => null),
    service.get('/api/identity/manger/users', { params: { page: 1, pageSize: 1 } }).catch(() => null)
  ]);
  const sd: any = unwrap(s) || {};
  const ud: any = unwrap(u) || {};
  return {
    data: {
      totalUsers: ud.totalCount || 0,
      userGrowth: 0,
      onlineUsers: sd.onlineUsers || 0,
      pendingTweets: sd.pendingTweets || 0,
      pendingReports: sd.pendingReports || 0
    }
  };
}

// 操作日志：GET /api/audit/activity-logs（来自 TweetAuditLog 审核记录）
export async function getAdminActivityLog(params: PageParams = {}) {
  const res = await service.get('/api/audit/activity-logs', { params });
  const d: any = unwrap(res) || {};
  const items = (d.items || []).map((l: any) => ({
    id: l.auditGuid,
    type: l.action === 'Approve' ? '审核通过' : l.action === 'Reject' ? '审核驳回' : (l.action || '操作'),
    actor: shortId(l.auditorGuid),
    target: shortId(l.tweetGuid),
    time: l.auditTime
  }));
  return { data: items };
}

// 在线用户：GET /api/audit/online-users（Redis 在线集合）
export async function getAdminOnlineUsers() {
  const res = await service.get('/api/audit/online-users');
  const d: any = unwrap(res) || [];
  const ids: string[] = Array.isArray(d) ? d : [];
  return {
    data: ids.map((id) => ({
      userGuid: id,
      userName: shortId(id),
      page: '在线',
      lastActive: Date.now()
    }))
  };
}

// ==================== 用户管理（/api/identity/manger，AdminOnly） ====================
export async function getAdminUsers(params: { page?: number; pageSize?: number; keyword?: string } = {}) {
  const res = await service.get('/api/identity/manger/users', {
    params: { page: params.page || 1, pageSize: params.pageSize || 10, keyword: params.keyword || '' }
  });
  const d: any = unwrap(res) || {};
  const rows = (d.items || []).map((u: any) => ({
    userGuid: u.userGuid,
    userName: u.userName || u.userEmail,
    userEmail: u.userEmail,
    imageCover: u.avatarUrl,
    phone: u.phone,
    status: u.isLockedOut ? 'Banned' : 'Normal',
    createDatetime: u.createDatetime,
    lastOnline: null
  }));
  return { data: { items: rows, totalCount: d.totalCount || 0, page: d.page || 1, pageSize: d.pageSize || 10 } };
}

// 添加用户：POST /api/identity/manger/users { email, password }
export function addAdminUser(payload: { userName?: string; email: string; password: string }) {
  return service.post('/api/identity/manger/users', { email: payload.email, password: payload.password });
}

// 封禁用户：POST /api/identity/manger/users/{userGuid}/ban
export function banAdminUser(userGuid: string, reason = '', duration = 'forever') {
  return service.post(`/api/identity/manger/users/${userGuid}/ban`, { reason, duration });
}

// 删除（停用）用户：DELETE /api/identity/manger/users/{userGuid}
export function deleteAdminUser(userGuid: string, reason = '') {
  return service.delete(`/api/identity/manger/users/${userGuid}`, { data: { reason } });
}

// ==================== 内容审核（后端完整：AuditApi） ====================
// GET /api/audit/tweets/pending?page&pageSize（PagedResult 字段是 TotalCount！）
export function getPendingTweets(params: PageParams & { [k: string]: unknown } = {}) {
  return service.get('/api/audit/tweets/pending', { params });
}

export function approveTweet(tweetGuid: string) {
  return service.post(`/api/audit/tweets/${tweetGuid}/approve`);
}

export function rejectTweet(tweetGuid: string, reason: string) {
  return service.post(`/api/audit/tweets/${tweetGuid}/reject`, { reason });
}

// 屏蔽内容：POST /api/audit/tweets/{tweetGuid}/block（置驳回 + 审计日志）
export function blockTweet(tweetGuid: string, reason = '') {
  return service.post(`/api/audit/tweets/${tweetGuid}/block`, { reason });
}

// 删除内容（管理员）：POST /api/audit/tweets/{tweetGuid}/delete
export function deleteTweet(tweetGuid: string, reason = '') {
  return service.post(`/api/audit/tweets/${tweetGuid}/delete`, { reason });
}

// ==================== 举报管理（后端完整：AuditApi） ====================
export function getReports(params: PageParams = {}) {
  return service.get('/api/audit/reports/pending', { params });
}

// resolve: action === 'removed' 时删除内容，其他值仅标记处理
export function resolveReport(reportGuid: string, payload: QueryParams) {
  return service.post(`/api/audit/reports/${reportGuid}/resolve`, payload);
}

// ==================== 社区管理（/api/audit/circles + /api/circles） ====================
// 全量社区列表：GET /api/audit/circles（含已解散/封禁状态，分页）
export async function getAdminCircles(params: PageParams & { keyword?: string } = {}) {
  const res = await service.get('/api/audit/circles', {
    params: { page: params.page || 1, pageSize: params.pageSize || 50, keyword: params.keyword || '' }
  });
  const d: any = unwrap(res) || {};
  const rows = (d.items || []).map((c: any) => ({
    circleGuid: c.circleGuid,
    name: c.name,
    description: c.description || c.name,
    avatarUrl: c.avatarUrl || '',
    coverUrl: c.coverUrl || '',
    ownerGuid: c.ownerGuid,
    ownerName: shortId(c.ownerGuid),
    memberCount: c.memberCount || 0,
    postCount: c.postCount || 0,
    status: c.status === 'Dissolved' || c.isDismissed ? 'Banned' : 'Normal',
    createTime: c.createTime
  }));
  return { data: { items: rows, list: rows, totalCount: d.totalCount || 0 } };
}

export function getAdminCircleMembers(circleGuid: string) {
  return service.get(`/api/circles/${circleGuid}/members`);
}

// 封禁社区：POST /api/audit/circles/{circleGuid}/ban（管理员解散）
export function banCircle(circleGuid: string, reason = '') {
  return service.post(`/api/audit/circles/${circleGuid}/ban`, { reason });
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

// ==================== 文件管理（/api/filestorage/admin/*） ====================
// 文件列表：GET /api/filestorage/admin/files?page&pageSize&keyword
export async function getAdminFiles(params: { page?: number; pageSize?: number; keyword?: string } = {}) {
  const res = await service.get('/api/filestorage/admin/files', {
    params: { page: params.page || 1, pageSize: params.pageSize || 50, keyword: params.keyword || '' }
  });
  const d: any = res && res.data ? res.data : {};
  const rows = (d.data || []).map((f: any) => {
    const isVideo = /\.(mp4|webm|mkv|mov|avi|flv)$/i.test(f.fileName || '');
    const isImage = f.source === 'Image' || (f.fileUri || '').includes('image');
    return {
      fileId: f.fileId,
      name: f.fileName,
      size: f.fileSize,
      url: f.fileUri,
      type: isImage ? 'image' : isVideo ? 'video' : 'doc',
      uploader: shortId(f.userId),
      userId: f.userId,
      uploadTime: f.uploadTime,
      md5: f.fileMd5 || '—',
      path: f.fileUri + (f.userId ? '' : '')
    };
  });
  return { data: { items: rows, list: rows, totalCount: d.totalCount || rows.length } };
}

// 删除文件：DELETE /api/filestorage/admin/files/{fileId}
export function deleteAdminFile(fileId: string, reason = '') {
  return service.delete(`/api/filestorage/admin/files/${fileId}`, { data: { reason } });
}

// ==================== 公报（/api/announcements） ====================
// 公报列表：GET /api/announcements（未撤回，分页）
export async function getAnnouncements(params: QueryParams = {}) {
  const res = await service.get('/api/announcements', { params });
  const d: any = unwrap(res) || {};
  const rows = (d.items || []).map((a: any) => ({
    id: a.announcementGuid,
    announcementGuid: a.announcementGuid,
    title: a.title,
    content: a.content,
    recalled: a.isRecalled,
    type: '公告',
    scopeLabel: '全体用户',
    sender: shortId(a.creatorUserId),
    sentTime: a.createdAt,
    delivered: '—'
  }));
  return { data: { items: rows, list: rows, totalCount: d.totalCount || rows.length } };
}

// 发送公报：POST /api/announcements { title, content }
export function sendAnnouncement(payload: { title: string; content: string }) {
  return service.post('/api/announcements', payload);
}

// 撤回公报：POST /api/announcements/{announcementGuid}/recall
export function recallAnnouncement(announcementGuid: string) {
  return service.post(`/api/announcements/${announcementGuid}/recall`);
}