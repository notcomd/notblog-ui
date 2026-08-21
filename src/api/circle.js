import service from '@/axios'

// 社区发现列表：GET /api/circles?keyword=&page=&pageSize= -> ApiResponse<PagedResult<CircleDto>>
// ⚠️ 2026-08-13 新增对接（后端「圈子发现列表」，原推荐广场缺口已补）
export function getDiscoverCircles(params = {}) {
  return service.get('/api/circles', { params })
}

// 我的社区列表：GET /api/circles/my -> ApiResponse<List<CircleDto>>
export function getMyCircles() {
  return service.get('/api/circles/my')
}

// 社区详情：GET /api/circles/{circleGuid} -> ApiResponse<CircleDto>
export function getCircle(circleGuid) {
  return service.get(`/api/circles/${circleGuid}`)
}

// 社区动态流：GET /api/circles/{circleGuid}/posts -> ApiResponse<PagedResult<CommunityPostDto>>
// CommunityPostDto 缺作者信息，转换为 PostCard 兼容结构
export function getCirclePosts(circleGuid, params = {}) {
  const req = service.get(`/api/circles/${circleGuid}/posts`, { params })
  return req.then(res => {
    const data = res && res.data ? res.data : res
    const items = (data.items || data.list || []).map(mapCommunityPost)
    return { ...res, data: { ...data, items } }
  })
}

function mapCommunityPost(p) {
  return {
    ...p,
    isVideo: false,
    author: {
      userGuid: p.authorGuid,
      userName: '社区成员',
      avatar: ''
    },
    content: p.content,
    publishTime: p.publishTime || p.createTime
  }
}

// 加入社区（邀请码/链接）：POST /api/circles/join { code? | token? }
export function joinCircle(payload) {
  return service.post('/api/circles/join', payload)
}

// 退出社区：DELETE /api/circles/{circleGuid}/members/{userGuid}
export function leaveCircle(circleGuid, userGuid) {
  return service.delete(`/api/circles/${circleGuid}/members/${userGuid}`)
}

// 社区成员列表：GET /api/circles/{circleGuid}/members -> ApiResponse<PagedResult<CircleMemberDto{userGuid,role,nickname,joinTime}>>
export function getCircleMembers(circleGuid, params = {}) {
  return service.get(`/api/circles/${circleGuid}/members`, { params })
}

// 设置/取消管理员：POST /api/circles/{circleGuid}/members/{userGuid}/role { role: 'Admin' | 'Member' }（仅圈主）
export function setCircleMemberRole(circleGuid, userGuid, role) {
  return service.post(`/api/circles/${circleGuid}/members/${userGuid}/role`, { role })
}

// 生成邀请：POST /api/circles/{circleGuid}/invitations { type: 'code'|'link'|'direct', inviteeGuid?, ttlHours? }
// -> CircleInvitationResult{inviteGuid, code, token}；direct 必须带 inviteeGuid；默认 7 天
export function generateCircleInvitation(circleGuid, payload = {}) {
  return service.post(`/api/circles/${circleGuid}/invitations`, { type: 'code', ...payload })
}

// 邀请码列表：GET /api/circles/{circleGuid}/invitations -> PagedResult<CircleInvitationDto{inviteGuid, code, status, expireTime}>
export function getCircleInvitations(circleGuid, params = {}) {
  return service.get(`/api/circles/${circleGuid}/invitations`, { params })
}

// 作废邀请码：DELETE /api/circles/{circleGuid}/invitations/{inviteGuid}
export function revokeCircleInvitation(circleGuid, inviteGuid) {
  return service.delete(`/api/circles/${circleGuid}/invitations/${inviteGuid}`)
}

// 我收到的直邀列表：GET /api/circles/invitations/my -> PagedResult<CircleInvitationDto>
// CircleInvitationDto{inviteGuid, circleGuid, circleName, inviterGuid, inviteeGuid, code, token, type, status, expireTime, createTime}
export function getMyCircleInvitations(params = {}) {
  return service.get('/api/circles/invitations/my', { params })
}

// 接受直邀：POST /api/circles/invitations/{inviteGuid}/accept -> ApiResponse<Guid>（返回圈子 Guid）
export function acceptCircleInvitation(inviteGuid) {
  return service.post(`/api/circles/invitations/${inviteGuid}/accept`)
}

// 拒绝直邀：POST /api/circles/invitations/{inviteGuid}/reject
export function rejectCircleInvitation(inviteGuid) {
  return service.post(`/api/circles/invitations/${inviteGuid}/reject`)
}

// 解散社区：DELETE /api/circles/{circleGuid}（仅圈主）
export function dissolveCircle(circleGuid) {
  return service.delete(`/api/circles/${circleGuid}`)
}

// 转让社区：POST /api/circles/{circleGuid}/transfer { newOwnerGuid }（仅圈主）
export function transferCircle(circleGuid, newOwnerGuid) {
  return service.post(`/api/circles/${circleGuid}/transfer`, { newOwnerGuid })
}

// 创建社区：POST /api/circles { name, description?, avatarUrl?, coverUrl?, maxMembers? }
export function createCircle(payload) {
  return service.post('/api/circles', payload)
}

// 更新社区信息：PUT /api/circles/{circleGuid} { name, description?, avatarUrl?, coverUrl? }
export function updateCircle(circleGuid, payload) {
  return service.put(`/api/circles/${circleGuid}`, payload)
}

// ===== 社区媒体上传（头像/封面：图片/动图/视频 ≤20MB） =====
// 通道选择：≤10MB 直传 /api/files/upload-image（图片）或 /api/files/upload（视频，需 isPublic）；
//          >10MB 自动走分片通道 /api/files/chunk/*（init → 逐片 upload → merge，FileMd5 后端可空不计算）
const SMALL_FILE_LIMIT = 10 * 1024 * 1024 // 与后端 SmallFileSizeLimit 一致
const UPLOAD_TIMEOUT = 60000 // 上传不走默认 5s 超时

export async function uploadCircleFile(file, description = 'circle-cover', onProgress) {
  const isImage = file.type.startsWith('image/')
  if (file.size <= SMALL_FILE_LIMIT) {
    const form = new FormData()
    form.append('file', file)
    form.append('description', description)
    if (!isImage) form.append('isPublic', 'true')
    return service.post(isImage ? '/api/files/upload-image' : '/api/files/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: UPLOAD_TIMEOUT
    })
  }
  return uploadCircleFileByChunks(file, description, onProgress)
}

async function uploadCircleFileByChunks(file, description, onProgress) {
  const buf = await file.arrayBuffer()
  const init = await service.post('/api/files/chunk/init', {
    fileName: file.name,
    totalSize: file.size,
    fileMd5: null,
    description,
    isPublic: true
  }, { timeout: UPLOAD_TIMEOUT })
  const meta = init && init.data ? init.data : init
  const { fileKey, totalChunks, chunkSize, uploadedChunks = [] } = meta || {}
  if (!fileKey || !totalChunks) throw new Error('分片初始化失败')
  const uploaded = new Set(uploadedChunks)
  for (let i = 0; i < totalChunks; i++) {
    if (uploaded.has(i)) continue
    const start = i * chunkSize
    const chunk = new Blob([buf.slice(start, Math.min(start + chunkSize, file.size))])
    const form = new FormData()
    form.append('fileKey', fileKey)
    form.append('chunkIndex', String(i))
    form.append('file', chunk, `chunk-${i}`)
    await service.post('/api/files/chunk/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: UPLOAD_TIMEOUT
    })
    if (onProgress) onProgress(Math.round(((i + 1) / totalChunks) * 90))
  }
  const merge = await service.post('/api/files/chunk/merge', {
    fileKey,
    fileName: file.name,
    description
  }, { timeout: UPLOAD_TIMEOUT })
  if (onProgress) onProgress(100)
  return merge
}
