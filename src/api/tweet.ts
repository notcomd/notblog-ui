import service from '@/axios';

/** 信息流查询参数 */
interface QueryParams {
  page?: number;
  pageSize?: number;
  [key: string]: unknown;
}

/** 保存草稿/更新推文请求体 */
interface DraftData {
  content: string;
  fileIds?: string[];
  [key: string]: unknown;
}

// ==================== 信息流 ====================

// 关注流（主页）
export function getTimeline(params: QueryParams = {}) {
  return service.get('/api/tweets/timeline', { params });
}

// 热门（广场页）
export function getTrending(params: QueryParams = {}) {
  return service.get('/api/tweets/trending', { params });
}

// 某用户的作品（个人空间）
export function getUserPosts(userGuid: string, params: QueryParams = {}) {
  return service.get(`/api/tweets/user/${userGuid}`, { params });
}

// 详情：GET /api/tweets/{guid} -> TweetDetailResult { tweet, isLiked, isFavorited, isCoined }
export function getTweetDetail(tweetGuid: string) {
  return service.get(`/api/tweets/${tweetGuid}`);
}

// ==================== 互动 ====================

// 点赞/取消点赞
export function toggleLike(tweetGuid: string, liked: boolean) {
  return liked
    ? service.delete(`/api/tweets/${tweetGuid}/like`)
    : service.post(`/api/tweets/${tweetGuid}/like`);
}

// 收藏/取消收藏
export function toggleFavorite(tweetGuid: string, favorited: boolean) {
  return favorited
    ? service.delete(`/api/tweets/${tweetGuid}/favorite`)
    : service.post(`/api/tweets/${tweetGuid}/favorite`);
}

// 记录浏览（进入详情时上报）
export function recordView(tweetGuid: string) {
  return service.post(`/api/tweets/${tweetGuid}/view`);
}

// 分享
export function shareTweet(tweetGuid: string) {
  return service.post(`/api/tweets/${tweetGuid}/share`);
}

// ==================== 草稿 / 更新 / 删除 ====================

// 保存草稿：POST /api/tweets/draft
export function saveDraft(payload: DraftData) {
  return service.post('/api/tweets/draft', payload);
}

// 更新推文：PUT /api/tweets/{tweetGuid}
export function updateTweet(tweetGuid: string, payload: DraftData) {
  return service.put(`/api/tweets/${tweetGuid}`, payload);
}

// 删除推文：DELETE /api/tweets/{tweetGuid}
export function deleteTweet(tweetGuid: string) {
  return service.delete(`/api/tweets/${tweetGuid}`);
}

// ==================== 置顶 / 打赏 ====================

// 置顶/取消置顶：POST /api/tweets/{tweetGuid}/pin|unpin
export function pinTweet(tweetGuid: string) {
  return service.post(`/api/tweets/${tweetGuid}/pin`);
}

export function unpinTweet(tweetGuid: string) {
  return service.post(`/api/tweets/${tweetGuid}/unpin`);
}

// 打赏：POST /api/tweets/{tweetGuid}/coin（无请求体，投币数由后端决定）
export function coinTweet(tweetGuid: string, _amount: number) {
  return service.post(`/api/tweets/${tweetGuid}/coin`);
}
