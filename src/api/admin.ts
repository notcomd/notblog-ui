import service from '@/axios'
import { unwrap } from '@/utils/response'

// ═══════════════════════════════════════════════════════════════════════
// 管理端 API（全部对接真实后端端点）
//
// 拓扑（统一经 YARP 网关，勿直连服务端口）：
//   Message   /api/audit/*                      统一信封（拦截器已解包 → unwrap 取数据本体）
//   Message   /api/announcements/*              统一信封
//   Identity  /api/identity/manger/user-manager/* 裸响应（Identity 未启用响应包装中间件）
//   FileDev   /api/filestorage/admin/*          裸响应（FileDev 未启用响应包装中间件）
//
// 本模块承担「防腐层」职责：把各服务不一致的字段名/外层结构归一化成视图直接可用的形状，
// 视图侧沿用既有 `res && res.data ? res.data : res` 兜底写法即可消费。
// ═══════════════════════════════════════════════════════════════════════

/** 分页查询参数 */
interface PageParams {
  page?: number
  pageSize?: number
}

/** 裸响应错误体（Identity / FileDev）：{ ok:false, error } */
function toError(e: unknown, fallback: string): Error {
  const err = e as { response?: { data?: { error?: string; message?: string } }; message?: string }
  const body = err?.response?.data
  const msg = body?.error || body?.message || err?.message
  return new Error(msg && msg !== 'Error' ? msg : fallback)
}

/** 数字字段取值：缺失/类型不符返回 null（不编造 0，交由视图显示「暂无数据源」） */
function pickNumber(src: unknown, key: string): number | null {
  const v = (src as Record<string, unknown> | null | undefined)?.[key]
  return typeof v === 'number' ? v : null
}

/** 从分页结果里取列表（兼容 items / list / 裸数组） */
function pickItems(src: unknown): any[] {
  if (Array.isArray(src)) return src
  const d = src as { items?: any[]; list?: any[] } | null | undefined
  return d?.items || d?.list || []
}

// ==================== 工作台 ====================
/**
 * 运营统计：Message `/api/audit/stats`（推文/举报/圈子/在线）+ Identity 用户侧（总用户/近 30 天新增）。
 * 各源独立降级：不可用时对应字段为 null，绝不填 0 冒充「计数为零」。
 *
 * 总用户数有两个来源（同一事实源，互为回退）：
 *   1. 专用统计 `GET /api/identity/manger/user-manager/stats`（新端点，额外提供近 30 天新增）
 *   2. 用户列表 `GET /api/identity/manger/user-manager/users?pageSize=1` 的 totalCount（老端点，始终可用）
 * 专用端点不可用时（例如后端尚未部署该版本）自动回退到列表口径，保证卡片不空转。
 */
export async function getAdminStats() {
  const [auditResult, statsResult, listResult] = await Promise.allSettled([
    service.get('/api/audit/stats'),
    service.get('/api/identity/manger/user-manager/stats'),
    service.get('/api/identity/manger/user-manager/users', { params: { page: 1, pageSize: 1 } })
  ])

  const audit = sourceOf(auditResult)
  const userStats = sourceOf(statsResult)
  const userList = sourceOf(listResult)

  return {
    totalUsers: pickNumber(userStats, 'totalUsers') ?? pickNumber(userList, 'totalCount'),
    newUsersLast30Days: pickNumber(userStats, 'newUsersLast30Days'),
    onlineUsers: pickNumber(audit, 'onlineUsers'),
    pendingTweets: pickNumber(audit, 'pendingTweets'),
    pendingReports: pickNumber(audit, 'pendingReports')
  }
}

/** 取 Promise.allSettled 中已成功来源的数据本体；失败返回 null */
function sourceOf(result: PromiseSettledResult<unknown>): any {
  return result.status === 'fulfilled' ? unwrap(result.value) : null
}

/** 操作日志：Message `GET /api/audit/activity-logs` → 归一化为视图用的 type/actor/target/time */
export async function getAdminActivityLog(params: PageParams = {}) {
  const res = await service.get('/api/audit/activity-logs', { params })
  const d: any = unwrap(res) || {}

  return pickItems(d).map((l: any) => ({
    id: l.auditGuid,
    type: l.action === 'Approve' ? '审核通过' : '审核驳回',
    action: l.action,
    reason: l.reason,
    // 后端仅存 GUID（无昵称/标题），截断展示避免撑破行宽
    actor: String(l.auditorGuid || '').slice(0, 8) || '未知',
    target: String(l.tweetGuid || '').slice(0, 8) || '未知',
    time: l.auditTime
  }))
}

/** 在线用户：Message `GET /api/audit/online-users` → [{ userGuid, nickName, avatarUrl }] */
export async function getAdminOnlineUsers() {
  const res = await service.get('/api/audit/online-users')
  const list = unwrap(res)
  return { available: true, items: Array.isArray(list) ? list : [] }
}

// ==================== 用户管理（Identity） ====================
/** 用户分页列表：`GET /api/identity/manger/user-manager/users`（后端仅支持 keyword 过滤） */
export async function getAdminUsers(params: PageParams & { keyword?: string } = {}) {
  const res = await service.get('/api/identity/manger/user-manager/users', {
    params: {
      keyword: params.keyword || undefined,
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 10
    }
  })
  const d: any = unwrap(res) || {}
  const items = pickItems(d)
  return {
    items: items.map((u: any) => ({
      userGuid: u.userGuid,
      userName: u.userName || u.userEmail,
      userEmail: u.userEmail,
      // 视图沿用 imageCover 字段名（原 User 实体字段）
      imageCover: u.avatarUrl || '',
      phone: u.phone || '',
      createDatetime: u.createDatetime,
      status: u.isLockedOut ? 'Banned' : 'Normal'
    })),
    totalCount: typeof d.totalCount === 'number' ? d.totalCount : items.length
  }
}

/** 创建用户：`POST /api/identity/manger/user-manager/users`（仅邮箱 + 初始密码，角色固定为 User） */
export async function addAdminUser(payload: { userEmail?: string; password?: string } = {}) {
  try {
    const res = await service.post('/api/identity/manger/user-manager/users', {
      email: payload.userEmail,
      password: payload.password
    })
    return unwrap(res)
  } catch (e) {
    throw toError(e, '创建用户失败')
  }
}

/** 封禁用户：`POST /api/identity/manger/user-manager/users/{userGuid}/ban`（后端锁至远期，不接受原因/时长） */
export async function banAdminUser(userGuid: string) {
  try {
    const res = await service.post(`/api/identity/manger/user-manager/users/${userGuid}/ban`)
    return unwrap(res)
  } catch (e) {
    throw toError(e, '封禁用户失败')
  }
}

/** 删除（永久停用）用户：`DELETE /api/identity/manger/user-manager/users/{userGuid}` */
export async function deleteAdminUser(userGuid: string) {
  try {
    const res = await service.delete(`/api/identity/manger/user-manager/users/${userGuid}`)
    return unwrap(res)
  } catch (e) {
    throw toError(e, '删除用户失败')
  }
}

// ==================== 内容审核（Message /api/audit） ====================
export async function getPendingTweets(params: PageParams = {}) {
  const res = await service.get('/api/audit/tweets/pending', { params })
  const d: any = unwrap(res) || {}
  return { items: pickItems(d), totalCount: d.totalCount ?? 0 }
}

export function approveTweet(tweetGuid: string) {
  return service.post(`/api/audit/tweets/${tweetGuid}/approve`).then(unwrap)
}

export function rejectTweet(tweetGuid: string, reason: string) {
  return service.post(`/api/audit/tweets/${tweetGuid}/reject`, { reason }).then(unwrap)
}

/** 屏蔽内容：`POST /api/audit/tweets/{tweetGuid}/block`（后端置为驳回并写审计日志） */
export function blockTweet(tweetGuid: string) {
  return service.post(`/api/audit/tweets/${tweetGuid}/block`).then(unwrap)
}

/** 管理员删除内容：`POST /api/audit/tweets/{tweetGuid}/delete` */
export function deleteTweet(tweetGuid: string) {
  return service.post(`/api/audit/tweets/${tweetGuid}/delete`).then(unwrap)
}

// ==================== 视频审核（Video /api/video/audit） ====================
/**
 * 管理端视频审核列表：Video `GET /api/video/audit/list`（仅管理员）。
 * status 省略 = 全部状态；取值 Draft/Pending/Approved/Rejected（不区分大小写，不接受 All）。
 */
export async function getVideoAuditList(params: PageParams & { status?: string } = {}) {
  const res = await service.get('/api/video/audit/list', {
    params: {
      status: params.status || undefined,
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 10
    }
  })
  const d: any = unwrap(res) || {}
  return { items: pickItems(d), totalCount: d.totalCount ?? 0 }
}

/** 通过视频审核：Video `POST /api/video/audit/{videoGuid}/approve`（Pending → Approved） */
export function approveVideo(videoGuid: string) {
  return service.post(`/api/video/audit/${videoGuid}/approve`).then(unwrap)
}

/** 驳回视频：Video `POST /api/video/audit/{videoGuid}/reject`（body.reason 写入驳回原因） */
export function rejectVideo(videoGuid: string, reason: string) {
  return service.post(`/api/video/audit/${videoGuid}/reject`, { reason }).then(unwrap)
}

// ==================== 举报管理（Message /api/audit） ====================
export async function getReports(params: PageParams = {}) {
  const res = await service.get('/api/audit/reports/pending', { params })
  const d: any = unwrap(res) || {}
  return { items: pickItems(d), totalCount: d.totalCount ?? 0 }
}

/** resolve: action === 'removed' 时删除内容，其他值仅标记处理 */
export function resolveReport(reportGuid: string, payload: Record<string, unknown>) {
  return service.post(`/api/audit/reports/${reportGuid}/resolve`, payload).then(unwrap)
}

// ==================== 社区管理 ====================
/** 全量社区列表：Message `GET /api/audit/circles`（含已解散/封禁） */
export async function getAdminCircles(params: PageParams & { keyword?: string } = {}) {
  const res = await service.get('/api/audit/circles', {
    params: {
      keyword: params.keyword || undefined,
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 50
    }
  })
  const d: any = unwrap(res) || {}
  return { items: pickItems(d), totalCount: d.totalCount ?? 0 }
}

export function getAdminCircleMembers(circleGuid: string) {
  return service.get(`/api/circles/${circleGuid}/members`).then(unwrap)
}

/** 封禁（解散）社区：`POST /api/audit/circles/{circleGuid}/ban`（不限圈主） */
export function banCircle(circleGuid: string) {
  return service.post(`/api/audit/circles/${circleGuid}/ban`).then(unwrap)
}

export function transferCircle(circleGuid: string, newOwnerGuid: string) {
  return service.post(`/api/circles/${circleGuid}/transfer`, { newOwnerGuid }).then(unwrap)
}

export function removeCircleMember(circleGuid: string, userGuid: string) {
  return service.delete(`/api/circles/${circleGuid}/members/${userGuid}`).then(unwrap)
}

// ==================== 文件管理（FileDev /api/filestorage/admin） ====================
const IMAGE_EXT = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg', 'avif']
const VIDEO_EXT = ['mp4', 'webm', 'mov', 'avi', 'mkv', 'm4v']

/** 依据扩展名推断展示类别（后端不返回 MIME/类别字段） */
function kindOf(fileName: string): 'image' | 'video' | 'doc' {
  const ext = (fileName || '').split('.').pop()?.toLowerCase() || ''
  if (IMAGE_EXT.includes(ext)) return 'image'
  if (VIDEO_EXT.includes(ext)) return 'video'
  return 'doc'
}

/**
 * 文件列表：`GET /api/filestorage/admin/files`。
 * 后端仅支持 keyword / userId 过滤，「全部/图片/视频/文档」在本地按扩展名筛选（管理端仅取首页，量级可控）。
 */
export async function getAdminFiles(params: { type?: string; keyword?: string } = {}) {
  const res = await service.get('/api/filestorage/admin/files', {
    params: { keyword: params.keyword || undefined, page: 1, pageSize: 100 }
  })
  const d: any = unwrap(res) || {}
  const raw: any[] = Array.isArray(d.data) ? d.data : pickItems(d)

  const mapped = raw.map((f: any) => ({
    fileId: f.fileId,
    name: f.fileName,
    size: f.fileSize,
    url: f.fileUri,
    type: kindOf(f.fileName),
    isPublic: f.isPublic,
    source: f.source,
    // 上传者为用户 GUID：列表按前 8 位展示，详情弹窗同样以此标记归属
    uploader: String(f.userId || '').split('-')[0],
    uploadTime: f.uploadTime
  }))

  const type = params.type || 'all'
  const items = type === 'all' ? mapped : mapped.filter(f => f.type === type)
  return { items, totalCount: items.length }
}

/** 删除文件：`DELETE /api/filestorage/admin/files/{fileId}`（软删 + 级联清理 + 释放额度） */
export async function deleteAdminFile(fileId: string) {
  try {
    const res = await service.delete(`/api/filestorage/admin/files/${fileId}`)
    return unwrap(res)
  } catch (e) {
    throw toError(e, '删除文件失败')
  }
}

// ==================== 公报（Message /api/announcements） ====================
export async function getAnnouncements(params: PageParams = {}) {
  const res = await service.get('/api/announcements/', { params })
  const d: any = unwrap(res) || {}
  return { items: pickItems(d), totalCount: d.totalCount ?? 0 }
}

/** 发布公报：`POST /api/announcements/`（后端仅支持标题 + 内容） */
export async function sendAnnouncement(payload: { title?: string; content?: string } = {}) {
  try {
    const res = await service.post('/api/announcements/', {
      title: payload.title,
      content: payload.content
    })
    return unwrap(res)
  } catch (e) {
    throw toError(e, '公报发送失败')
  }
}

/** 撤回公报：`POST /api/announcements/{announcementGuid}/recall` */
export async function recallAnnouncement(announcementGuid: string) {
  try {
    const res = await service.post(`/api/announcements/${announcementGuid}/recall`)
    return unwrap(res)
  } catch (e) {
    throw toError(e, '公报撤回失败')
  }
}
