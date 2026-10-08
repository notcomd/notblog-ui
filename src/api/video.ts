import service from '@/axios';

/** 分页查询参数 */
interface PageParams {
  page?: number;
  pageSize?: number;
  [key: string]: unknown;
}

/** 添加视频请求（multipart/form-data，整包上传到 Video 服务） */
export interface AddVideoPayload {
  videoFile: File;
  coverImage?: File | null;
  videoName: string;
  briefIntroduction?: string;
  tags?: string[];
  /** null/true = 草稿；false = 创建后进入待审核 */
  asDraft?: boolean | null;
}

/** 更新视频请求（局部更新：仅传入的字段生效，可只改名称/简介/标签/封面而不重传视频） */
export interface UpdateVideoPayload {
  videoGuid: string;
  videoName?: string;
  briefIntroduction?: string;
  tags?: string[];
  videoCover?: string;
  videoFileUri?: string;
}

/** 视频评论请求体 */
interface VideoReviewData {
  [key: string]: unknown;
}

// ==================== Video 服务（Video.Web.API） ====================

// 提交视频审核：POST /api/video/{videoGuid}/submit（草稿/被驳回 → 待审核，仅作者）
export function submitVideo(videoGuid: string) {
  return service.post(`/api/video/${videoGuid}/submit`);
}

// 视频详情：GET /api/video/{videoGuid}（匿名/他人仅已发布可见，作者可见自己全部状态，不可见 404）
export function getVideoDetail(videoGuid: string) {
  return service.get(`/api/video/${videoGuid}`);
}

// 播放地址：GET /api/videostream/{videoGuid}（支持 Range，可直接作为 <video> src）
export function videoStreamUrl(videoGuid: string): string {
  const base = import.meta.env.VUE_APP_API_BASE_URL || '';
  return `${base}/api/videostream/${videoGuid}`;
}

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

// 我的视频（按状态分页）：GET /api/video/mine?status=&page=&pageSize=
// status 省略 = 全部；取值 Draft/Pending/Approved/Rejected
export function getMyVideos(params: PageParams = {}) {
  return service.get('/api/video/mine', { params });
}

// 更新视频（局部更新：仅传入的非空字段生效，未传字段沿用原值；仅草稿/被驳回可改，否则后端 400）
// PUT /api/video，请求体 RequestUpdateByVideo：{ videoGuid, videoName?, videoCover?, videoFileUri?, tags?, briefIntroduction? }
export function updateVideo(payload: UpdateVideoPayload) {
  const body: Record<string, unknown> = { videoGuid: payload.videoGuid };
  if (payload.videoName !== undefined) body.videoName = payload.videoName;
  if (payload.briefIntroduction !== undefined) body.briefIntroduction = payload.briefIntroduction;
  if (payload.tags !== undefined) body.tags = payload.tags;
  // videoCover / videoFileUri 为 Uri 类型：空串会被后端判为非法 Uri，故仅在非空时传
  if (payload.videoCover) body.videoCover = payload.videoCover;
  if (payload.videoFileUri) body.videoFileUri = payload.videoFileUri;
  return service.put('/api/video', body);
}

export function deleteVideo(videoGuid: string) {
  return service.delete(`/api/video/${videoGuid}`);
}

// 视频点赞：POST /api/video/{videoGuid}/like（用户由后端从 JWT 解析；field: upvote/down/ballot/share）
export function likeVideo(videoGuid: string, field = 'upvote', isLike = true) {
  return service.post(`/api/video/${videoGuid}/like`, { field, isLike });
}

// 发布视频：POST /api/addvideo/（multipart/form-data，视频文件整包上传到 Video 服务）
// 文件字段：videoFile(必填) / coverImage(选填)；表单字段：VideoName / BriefIntroduction / Tags / AsDraft
// 返回视频标识（videoGuid）。注意：不要显式设置 Content-Type，请求拦截器会交由浏览器补 boundary
export function addVideo(payload: AddVideoPayload) {
  const form = new FormData();
  form.append('videoFile', payload.videoFile);
  if (payload.coverImage) form.append('coverImage', payload.coverImage);
  form.append('VideoName', payload.videoName);
  form.append('BriefIntroduction', payload.briefIntroduction || '');
  (payload.tags || []).forEach((t) => form.append('Tags', t));
  if (payload.asDraft !== undefined && payload.asDraft !== null) {
    form.append('AsDraft', String(payload.asDraft));
  }
  return service.post('/api/addvideo/', form);
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
