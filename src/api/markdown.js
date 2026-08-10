import service from '@/axios'

// ==================== Markdown 文档服务（Markdown.Web.API） ====================

// ---------- 基础 CRUD：/api/markdown ----------
export function createMarkdownDoc(payload) {
  return service.post('/api/markdown', payload)
}

export function getMarkdownDocs(params = {}) {
  return service.get('/api/markdown', { params })
}

export function getMarkdownDoc(guid) {
  return service.get(`/api/markdown/${guid}`)
}

export function updateMarkdownDoc(guid, payload) {
  return service.put(`/api/markdown/${guid}`, payload)
}

export function deleteMarkdownDoc(guid) {
  return service.delete(`/api/markdown/${guid}`)
}

export function listMarkdownDocs(params = {}) {
  return service.get('/api/markdown/list', { params })
}

export function searchMarkdownDocs(params = {}) {
  return service.get('/api/markdown/search', { params })
}

// ---------- 审核流 ----------
export function submitMarkdownForReview(guid) {
  return service.post(`/api/markdown/${guid}/submit`)
}

export function approveMarkdown(guid) {
  return service.post(`/api/markdown/${guid}/approve`)
}

export function rejectMarkdown(guid, reason) {
  return service.post(`/api/markdown/${guid}/reject`, { reason })
}

// ---------- 历史版本 ----------
export function getMarkdownHistory(guid) {
  return service.get(`/api/markdown/${guid}/history`)
}

export function getMarkdownHistoryDoc(guid, oldGuid) {
  return service.get(`/api/markdown/${guid}/history/${oldGuid}`)
}

export function deleteMarkdownHistory(guid, oldGuid) {
  return service.delete(`/api/markdown/${guid}/history/${oldGuid}`)
}

export function restoreMarkdownHistory(guid, oldGuid) {
  return service.post(`/api/markdown/${guid}/history/${oldGuid}/restore`)
}

// ---------- 文档评论（reviews） ----------
export function addMarkdownReview(guid, payload) {
  return service.post(`/api/markdown/${guid}/reviews`, payload)
}

export function getMarkdownReviews(guid, params = {}) {
  return service.get(`/api/markdown/${guid}/reviews`, { params })
}

export function getMarkdownReview(guid, reviewGuid) {
  return service.get(`/api/markdown/${guid}/reviews/${reviewGuid}`)
}

export function getMarkdownReviewChildren(guid, reviewGuid) {
  return service.get(`/api/markdown/${guid}/reviews/${reviewGuid}/children`)
}

export function updateMarkdownReview(guid, reviewGuid, payload) {
  return service.put(`/api/markdown/${guid}/reviews/${reviewGuid}`, payload)
}

export function deleteMarkdownReview(guid, reviewGuid) {
  return service.delete(`/api/markdown/${guid}/reviews/${reviewGuid}`)
}

export function replyMarkdownReview(guid, reviewGuid, payload) {
  return service.post(`/api/markdown/${guid}/reviews/${reviewGuid}/children`, payload)
}

export function likeMarkdownReview(guid, reviewGuid) {
  return service.post(`/api/markdown/${guid}/reviews/${reviewGuid}/like`)
}

export function unlikeMarkdownReview(guid, reviewGuid) {
  return service.post(`/api/markdown/${guid}/reviews/${reviewGuid}/unlike`)
}

// ---------- 收藏（/api/favorites） ----------
export function favoriteMarkdown(markDownGuid) {
  return service.post('/api/favorites', { markDownGuid })
}

export function unfavoriteMarkdown(guid) {
  return service.delete(`/api/favorites/${guid}`)
}

export function updateFavoriteTags(guid, payload) {
  return service.put(`/api/favorites/${guid}/tags`, payload)
}

export function getFavoriteTags() {
  return service.get('/api/favorites/tags')
}

export function getMyFavorites(params = {}) {
  return service.get('/api/favorites', { params })
}
