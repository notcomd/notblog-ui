import service from '@/axios';

/** 文档创建/更新请求体 */
interface MarkdownDocData {
  title: string;
  content?: string;
  description?: string;
  [key: string]: unknown;
}

/** 分页/查询参数 */
interface QueryParams {
  page?: number;
  pageSize?: number;
  [key: string]: unknown;
}

// ==================== Markdown 文档服务（Markdown.Web.API） ====================

// ---------- 基础 CRUD：/api/markdown ----------
export function createMarkdownDoc(payload: MarkdownDocData) {
  return service.post('/api/markdown', payload);
}

export function getMarkdownDocs(params: QueryParams = {}) {
  return service.get('/api/markdown', { params });
}

export function getMarkdownDoc(guid: string) {
  return service.get(`/api/markdown/${guid}`);
}

export function getMarkdownContent(guid: string) {
  return service.get(`/api/markdown/${guid}/content`);
}

// ---------- 文档交互（计数） ----------
export function viewMarkdown(guid: string) {
  return service.post(`/api/markdown/${guid}/view`);
}

export function likeMarkdown(guid: string) {
  return service.post(`/api/markdown/${guid}/like`);
}

export function unlikeMarkdown(guid: string) {
  return service.post(`/api/markdown/${guid}/unlike`);
}

export function updateMarkdownDoc(guid: string, payload: Partial<MarkdownDocData>) {
  return service.put(`/api/markdown/${guid}`, payload);
}

export function deleteMarkdownDoc(guid: string) {
  return service.delete(`/api/markdown/${guid}`);
}

export function listMarkdownDocs(params: QueryParams = {}) {
  return service.get('/api/markdown/list', { params });
}

export function searchMarkdownDocs(params: QueryParams = {}) {
  return service.get('/api/markdown/search', { params });
}

// ---------- 审核流 ----------
export function submitMarkdownForReview(guid: string) {
  return service.post(`/api/markdown/${guid}/submit`);
}

export function approveMarkdown(guid: string) {
  return service.post(`/api/markdown/${guid}/approve`);
}

export function rejectMarkdown(guid: string, reason: string) {
  return service.post(`/api/markdown/${guid}/reject`, { reason });
}

// ---------- 历史版本 ----------
export function getMarkdownHistory(guid: string) {
  return service.get(`/api/markdown/${guid}/history`);
}

export function getMarkdownHistoryDoc(guid: string, oldGuid: string) {
  return service.get(`/api/markdown/${guid}/history/${oldGuid}`);
}

export function deleteMarkdownHistory(guid: string, oldGuid: string) {
  return service.delete(`/api/markdown/${guid}/history/${oldGuid}`);
}

export function restoreMarkdownHistory(guid: string, oldGuid: string) {
  return service.post(`/api/markdown/${guid}/history/${oldGuid}/restore`);
}

// ---------- 文档评论（reviews） ----------
export function addMarkdownReview(guid: string, payload: Record<string, unknown>) {
  return service.post(`/api/markdown/${guid}/reviews`, payload);
}

export function getMarkdownReviews(guid: string, params: QueryParams = {}) {
  return service.get(`/api/markdown/${guid}/reviews`, { params });
}

export function getMarkdownReview(guid: string, reviewGuid: string) {
  return service.get(`/api/markdown/${guid}/reviews/detail/${reviewGuid}`);
}

export function getMarkdownReviewChildren(guid: string, reviewGuid: string) {
  return service.get(`/api/markdown/${guid}/reviews/${reviewGuid}/children`);
}

export function updateMarkdownReview(
  guid: string,
  reviewGuid: string,
  payload: Record<string, unknown>
) {
  return service.put(`/api/markdown/${guid}/reviews/${reviewGuid}`, payload);
}

export function deleteMarkdownReview(guid: string, reviewGuid: string) {
  return service.delete(`/api/markdown/${guid}/reviews/${reviewGuid}`);
}

export function replyMarkdownReview(
  guid: string,
  reviewGuid: string,
  payload: Record<string, unknown>
) {
  return service.post(`/api/markdown/${guid}/reviews/${reviewGuid}/children`, payload);
}

export function likeMarkdownReview(guid: string, reviewGuid: string) {
  return service.post(`/api/markdown/${guid}/reviews/${reviewGuid}/like`);
}

export function unlikeMarkdownReview(guid: string, reviewGuid: string) {
  return service.post(`/api/markdown/${guid}/reviews/${reviewGuid}/unlike`);
}

// ---------- 收藏（/api/favorites） ----------
export function favoriteMarkdown(markDownGuid: string) {
  return service.post('/api/favorites', { markDownGuid });
}

export function unfavoriteMarkdown(guid: string) {
  return service.delete(`/api/favorites/${guid}`);
}

export function updateFavoriteTags(guid: string, payload: Record<string, unknown>) {
  return service.put(`/api/favorites/${guid}/tags`, payload);
}

export function getFavoriteTags() {
  return service.get('/api/favorites/tags');
}

export function getMyFavorites(params: QueryParams = {}) {
  return service.get('/api/favorites', { params });
}
