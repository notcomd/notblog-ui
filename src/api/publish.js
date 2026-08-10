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

// 创建频道：POST /api/circles { name, description?, avatarUrl?, maxMembers? }
export function createCircle(payload) {
  return service.post('/api/circles', payload)
}
