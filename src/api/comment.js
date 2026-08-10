import service from '@/axios'

// 评论列表：GET /api/comments/tweet/{tweetGuid} -> ApiResponse<PagedResult<CommentDto>>
export function getComments(tweetGuid, params = {}) {
  return service.get(`/api/comments/tweet/${tweetGuid}`, { params })
}

// 回复列表：GET /api/comments/{commentGuid}/replies
export function getReplies(commentGuid, params = {}) {
  return service.get(`/api/comments/${commentGuid}/replies`, { params })
}

// 发布评论/回复：POST /api/comments { tweetGuid, content, parentGuid?, replyToGuid? }
export function addComment(payload) {
  return service.post('/api/comments', payload)
}

// 删除评论：DELETE /api/comments/{commentGuid}
export function deleteComment(commentGuid) {
  return service.delete(`/api/comments/${commentGuid}`)
}
