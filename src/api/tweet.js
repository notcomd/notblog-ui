import service from '@/axios'

// ==================== 信息流 ====================

// 关注流（主页）
export function getTimeline(params = {}) {
  return service.get('/api/tweets/timeline', { params })
}

// 热门（广场页）
export function getTrending(params = {}) {
  return service.get('/api/tweets/trending', { params })
}

// 某用户的作品（个人空间）
export function getUserPosts(userGuid, params = {}) {
  return service.get(`/api/tweets/user/${userGuid}`, { params })
}

// 详情：GET /api/tweets/{guid} -> TweetDetailResult { tweet, isLiked, isFavorited, isCoined }
export function getTweetDetail(tweetGuid) {
  return service.get(`/api/tweets/${tweetGuid}`)
}

// ==================== 互动 ====================

// 点赞/取消点赞
export function toggleLike(tweetGuid, liked) {
  return liked
    ? service.delete(`/api/tweets/${tweetGuid}/like`)
    : service.post(`/api/tweets/${tweetGuid}/like`)
}

// 收藏/取消收藏
export function toggleFavorite(tweetGuid, favorited) {
  return favorited
    ? service.delete(`/api/tweets/${tweetGuid}/favorite`)
    : service.post(`/api/tweets/${tweetGuid}/favorite`)
}

// 记录浏览（进入详情时上报）
export function recordView(tweetGuid) {
  return service.post(`/api/tweets/${tweetGuid}/view`)
}

// 分享
export function shareTweet(tweetGuid) {
  return service.post(`/api/tweets/${tweetGuid}/share`)
}

// ==================== 草稿 / 更新 / 删除 ====================

// 保存草稿：POST /api/tweets/draft
export function saveDraft(payload) {
  return service.post('/api/tweets/draft', payload)
}

// 更新推文：PUT /api/tweets/{tweetGuid}
export function updateTweet(tweetGuid, payload) {
  return service.put(`/api/tweets/${tweetGuid}`, payload)
}

// 删除推文：DELETE /api/tweets/{tweetGuid}
export function deleteTweet(tweetGuid) {
  return service.delete(`/api/tweets/${tweetGuid}`)
}

// ==================== 置顶 / 打赏 ====================

// 置顶/取消置顶：POST /api/tweets/{tweetGuid}/pin|unpin
export function pinTweet(tweetGuid) {
  return service.post(`/api/tweets/${tweetGuid}/pin`)
}

export function unpinTweet(tweetGuid) {
  return service.post(`/api/tweets/${tweetGuid}/unpin`)
}

// 打赏：POST /api/tweets/{tweetGuid}/coin（无请求体，投币数由后端决定）
export function coinTweet(tweetGuid, _amount) {
  return service.post(`/api/tweets/${tweetGuid}/coin`)
}
