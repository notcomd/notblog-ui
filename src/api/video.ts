import service from '@/axios';

/** 分页查询参数 */
interface PageParams {
  page?: number;
  pageSize?: number;
  [key: string]: unknown;
}

/** 视频创建/更新请求体 */
interface VideoData {
  [key: string]: unknown;
}

/** 视频评论请求体 */
interface VideoReviewData {
  [key: string]: unknown;
}

// ==================== Video 服务（Video.Web.API） ====================

// ---------- 视频本体 ----------
export function getVideos(params: PageParams = {}) {
  return service.get('/api/video', { params });
}

export function getVideoPage(index: number, pageSize: number) {
  return service.get(`/api/video/${index}/${pageSize}`);
}

export function findVideoByName(name: string) {
  return service.get(`/api/video/findname/${encodeURIComponent(name)}`);
}

export function searchVideo(name: string) {
  return service.get(`/api/video/blurred/${encodeURIComponent(name)}`);
}

export function updateVideo(payload: VideoData) {
  return service.put('/api/video', payload);
}

export function deleteVideo(videoGuid: string) {
  return service.delete(`/api/video/${videoGuid}`);
}

export function likeVideo(videoGuid: string) {
  return service.post(`/api/video/${videoGuid}/like`);
}

export function addVideo(payload: VideoData) {
  return service.post('/api/addvideo', payload);
}

// ---------- 视频评论（videoreview） ----------
export function addVideoReview(payload: VideoReviewData) {
  return service.post('/api/videoreview', payload);
}

export function getVideoReviews(videoGuid: string, params: PageParams = {}) {
  return service.get(`/api/videoreview/${videoGuid}`, { params });
}

export function getVideoReviewReplies(reviewGuid: string) {
  return service.get(`/api/videoreview/replies/${reviewGuid}`);
}

export function getVideoReviewInteraction(reviewGuid: string) {
  return service.get(`/api/videoreview/${reviewGuid}/interaction`);
}

export function likeVideoReview(reviewGuid: string) {
  return service.post(`/api/videoreview/${reviewGuid}/like`);
}

// ---------- 观看进度（videowatch） ----------
export function reportWatchProgress(videoGuid: string, payload: Record<string, unknown>) {
  return service.post(`/api/videowatch/${videoGuid}/progress`, payload);
}

export function reportWatchEnd(videoGuid: string) {
  return service.post(`/api/videowatch/${videoGuid}/end`);
}

export function getVideoWatchStats(videoGuid: string) {
  return service.get(`/api/videowatch/${videoGuid}/stats`);
}

// ---------- 合集（videocollection） ----------
export function getVideoCollections() {
  return service.get('/api/videocollection');
}

export function getVideoCollection(collectionGuid: string) {
  return service.get(`/api/videocollection/${collectionGuid}`);
}

export function addVideoToCollection(collectionGuid: string, payload: Record<string, unknown>) {
  return service.post(`/api/videocollection/${collectionGuid}/videos`, payload);
}

export function removeVideoFromCollection(collectionGuid: string, videoGuid: string) {
  return service.delete(`/api/videocollection/${collectionGuid}/videos/${videoGuid}`);
}

// ---------- 播放流 ----------
export function getVideoStream(videoGuid: string) {
  return service.get(`/api/videostream/${videoGuid}`);
}
