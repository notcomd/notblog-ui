import service from '@/axios';

/** 分页/关键字查询参数 */
interface QueryParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  [key: string]: unknown;
}

/** 创建话题请求体 */
interface CreateTopicData {
  name: string;
  description?: string;
  [key: string]: unknown;
}

// ==================== 话题（Message：/api/topics） ====================

// GET /api/topics 话题列表
export function getTopics(params: QueryParams = {}) {
  return service.get('/api/topics', { params });
}

// POST /api/topics 创建话题
export function createTopic(payload: CreateTopicData) {
  return service.post('/api/topics', payload);
}

// GET /api/topics/{topicGuid}/posts 话题下的帖子
export function getTopicPosts(topicGuid: string, params: QueryParams = {}) {
  return service.get(`/api/topics/${topicGuid}/posts`, { params });
}
