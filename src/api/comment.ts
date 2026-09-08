import service from '@/axios';

/** 分页查询参数 */
interface PageParams {
  page?: number;
  pageSize?: number;
}

/** 发布评论/回复请求体 */
interface AddCommentData {
  tweetGuid?: string;
  content: string;
  parentGuid?: string;
  replyToGuid?: string;
  commentGuid?: string;
}

// 评论列表：GET /api/comments/tweet/{tweetGuid} -> ApiResponse<PagedResult<CommentDto>>
export function getComments(tweetGuid: string, params: PageParams = {}) {
  return service.get(`/api/comments/tweet/${tweetGuid}`, { params });
}

// 回复列表：GET /api/comments/{commentGuid}/replies
export function getReplies(commentGuid: string, params: PageParams = {}) {
  return service.get(`/api/comments/${commentGuid}/replies`, { params });
}

// 发布评论/回复：POST /api/comments { tweetGuid, content, parentGuid?, replyToGuid? }
export function addComment(payload: AddCommentData) {
  return service.post('/api/comments', payload);
}

// 删除评论：DELETE /api/comments/{commentGuid}
export function deleteComment(commentGuid: string) {
  return service.delete(`/api/comments/${commentGuid}`);
}
