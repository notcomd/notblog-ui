import service from '@/axios'

// 我的频道列表：GET /api/circles/my -> ApiResponse<List<CircleDto>>
export function getMyCircles() {
  return service.get('/api/circles/my')
}

// 频道详情：GET /api/circles/{circleGuid} -> ApiResponse<CircleDto>
export function getCircle(circleGuid) {
  return service.get(`/api/circles/${circleGuid}`)
}

// 频道动态流：GET /api/circles/{circleGuid}/posts -> ApiResponse<PagedResult<CommunityPostDto>>
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

// 加入频道（邀请码/链接）：POST /api/circles/join { code? | token? }
export function joinCircle(payload) {
  return service.post('/api/circles/join', payload)
}

// 退出频道：DELETE /api/circles/{circleGuid}/members/{userGuid}
export function leaveCircle(circleGuid, userGuid) {
  return service.delete(`/api/circles/${circleGuid}/members/${userGuid}`)
}

// 创建频道：POST /api/circles { name, description?, avatarUrl?, coverUrl?, maxMembers? }
export function createCircle(payload) {
  return service.post('/api/circles', payload)
}

// 更新频道信息：PUT /api/circles/{circleGuid} { name, description?, avatarUrl?, coverUrl? }
export function updateCircle(circleGuid, payload) {
  return service.put(`/api/circles/${circleGuid}`, payload)
}

// ===== 频道媒体上传（头像/封面：图片/动图/视频 ≤20MB） =====
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
