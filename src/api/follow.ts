import service from '@/axios';

/** 分页查询参数 */
interface PageParams {
  page?: number;
  pageSize?: number;
}

// 我关注的人：GET /api/follows/following -> ApiResponse<PagedResult<UserFollowDto>>
export function getFollowing(params: PageParams = {}) {
  return service.get('/api/follows/following', { params });
}

// 关注/取关
export function follow(userGuid: string) {
  return service.post(`/api/follows/${userGuid}`);
}

export function unfollow(userGuid: string) {
  return service.delete(`/api/follows/${userGuid}`);
}
