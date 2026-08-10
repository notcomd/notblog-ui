import service from '@/axios'

// ==================== Video 服务（Video.Web.API） ====================

// ---------- 视频本体 ----------
export function getVideos(params = {}) {
  return service.get('/api/video', { params })
}

export function getVideoPage(index, pageSize) {
  return service.get(`/api/video/${index}/${pageSize}`)
}

export function findVideoByName(name) {
  return service.get(`/api/video/findname/${encodeURIComponent(name)}`)
}

export function searchVideo(name) {
  return service.get(`/api/video/blurred/${encodeURIComponent(name)}`)
}

export function updateVideo(payload) {
  return service.put('/api/video', payload)
}

export function deleteVideo(videoGuid) {
  return service.delete(`/api/video/${videoGuid}`)
}

export function likeVideo(videoGuid) {
  return service.post(`/api/video/${videoGuid}/like`)
}

export function addVideo(payload) {
  return service.post('/api/addvideo', payload)
}

// ---------- 视频评论（videoreview） ----------
export function addVideoReview(payload) {
  return service.post('/api/videoreview', payload)
}

export function getVideoReviews(videoGuid, params = {}) {
  return service.get(`/api/videoreview/${videoGuid}`, { params })
}

export function getVideoReviewReplies(reviewGuid) {
  return service.get(`/api/videoreview/replies/${reviewGuid}`)
}

export function getVideoReviewInteraction(reviewGuid) {
  return service.get(`/api/videoreview/${reviewGuid}/interaction`)
}

export function likeVideoReview(reviewGuid) {
  return service.post(`/api/videoreview/${reviewGuid}/like`)
}

// ---------- 观看进度（videowatch） ----------
export function reportWatchProgress(videoGuid, payload) {
  return service.post(`/api/videowatch/${videoGuid}/progress`, payload)
}

export function reportWatchEnd(videoGuid) {
  return service.post(`/api/videowatch/${videoGuid}/end`)
}

export function getVideoWatchStats(videoGuid) {
  return service.get(`/api/videowatch/${videoGuid}/stats`)
}

// ---------- 合集（videocollection） ----------
export function getVideoCollections() {
  return service.get('/api/videocollection')
}

export function getVideoCollection(collectionGuid) {
  return service.get(`/api/videocollection/${collectionGuid}`)
}

export function addVideoToCollection(collectionGuid, payload) {
  return service.post(`/api/videocollection/${collectionGuid}/videos`, payload)
}

export function removeVideoFromCollection(collectionGuid, videoGuid) {
  return service.delete(`/api/videocollection/${collectionGuid}/videos/${videoGuid}`)
}

// ---------- 播放流 ----------
export function getVideoStream(videoGuid) {
  return service.get(`/api/videostream/${videoGuid}`)
}
