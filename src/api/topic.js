import service from '@/axios'

// ==================== 话题（Message：/api/topics） ====================

// GET /api/topics 话题列表
export function getTopics(params = {}) {
  return service.get('/api/topics', { params })
}

// POST /api/topics 创建话题
export function createTopic(payload) {
  return service.post('/api/topics', payload)
}

// GET /api/topics/{topicGuid}/posts 话题下的帖子
export function getTopicPosts(topicGuid, params = {}) {
  return service.get(`/api/topics/${topicGuid}/posts`, { params })
}
