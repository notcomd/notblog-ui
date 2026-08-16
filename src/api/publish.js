import service from '@/axios'

// 发布图文/视频博客：POST /api/tweets { content, fileIds?, linkUrl?, visibility? } -> ApiResponse<Guid>
export function createTweet(payload) {
  return service.post('/api/tweets', {
    content: payload.content,
    fileIds: payload.fileIds || [],
    linkUrl: payload.linkUrl || null,
    visibility: payload.visibility || 'Public'
  })
}

// 发布到频道：POST /api/tweets/circle { circleGuid, content, fileIds?, linkUrl?, topicGuids? }
export function createCirclePost(payload) {
  return service.post('/api/tweets/circle', {
    circleGuid: payload.circleGuid,
    content: payload.content,
    fileIds: payload.fileIds || [],
    linkUrl: payload.linkUrl || null,
    topicGuids: payload.topicGuids || []
  })
}

// 上传图片：POST /api/files/upload-image (multipart: file, description) -> ApiResponse<FileRef>
export function uploadImage(file, description = '') {
  const form = new FormData()
  form.append('file', file)
  form.append('description', description)
  return service.post('/api/files/upload-image', form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

// 上传视频：≤10MB 直传 /api/files/upload，>10MB 走分片通道 /api/files/chunk/*
// 返回统一 { fileId, fileUri }，失败时抛出错误
const VIDEO_SMALL_FILE_LIMIT = 10 * 1024 * 1024
const VIDEO_UPLOAD_TIMEOUT = 60000

export async function uploadVideo(file, onProgress) {
  const form = new FormData()
  form.append('file', file)
  form.append('description', 'tweet-video')
  form.append('isPublic', 'true')
  if (file.size <= VIDEO_SMALL_FILE_LIMIT) {
    const res = await service.post('/api/files/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: VIDEO_UPLOAD_TIMEOUT
    })
    const data = res && res.data ? res.data : res
    return data && data.data ? data.data : data
  }
  return uploadVideoByChunks(file, onProgress)
}

async function uploadVideoByChunks(file, onProgress) {
  const buf = await file.arrayBuffer()
  const init = await service.post('/api/files/chunk/init', {
    fileName: file.name,
    totalSize: file.size,
    fileMd5: null,
    description: 'tweet-video',
    isPublic: true
  }, { timeout: VIDEO_UPLOAD_TIMEOUT })
  const meta = init && init.data ? init.data : init
  const { fileKey, totalChunks, chunkSize, uploadedChunks = [] } = meta || {}
  if (!fileKey || !totalChunks) throw new Error('分片初始化失败')
  const uploaded = new Set(uploadedChunks)
  for (let i = 0; i < totalChunks; i++) {
    if (uploaded.has(i)) continue
    const start = i * chunkSize
    const chunk = new Blob([buf.slice(start, Math.min(start + chunkSize, file.size))])
    const chunkForm = new FormData()
    chunkForm.append('fileKey', fileKey)
    chunkForm.append('chunkIndex', String(i))
    chunkForm.append('file', chunk, `chunk-${i}`)
    await service.post('/api/files/chunk/upload', chunkForm, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: VIDEO_UPLOAD_TIMEOUT
    })
    if (onProgress) onProgress(Math.round(((i + 1) / totalChunks) * 90))
  }
  const merge = await service.post('/api/files/chunk/merge', {
    fileKey,
    fileName: file.name,
    description: 'tweet-video'
  }, { timeout: VIDEO_UPLOAD_TIMEOUT })
  if (onProgress) onProgress(100)
  const data = merge && merge.data ? merge.data : merge
  return data && data.data ? data.data : data
}


// 创建频道：POST /api/circles { name, description?, avatarUrl?, maxMembers? }
export function createCircle(payload) {
  return service.post('/api/circles', payload)
}
