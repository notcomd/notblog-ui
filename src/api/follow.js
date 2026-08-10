import service from '@/axios'

// 我关注的人：GET /api/follows/following -> ApiResponse<PagedResult<UserFollowDto>>
export function getFollowing(params = {}) {
  return service.get('/api/follows/following', { params })
}

// 关注/取关
export function follow(userGuid) {
  return service.post(`/api/follows/${userGuid}`)
}

export function unfollow(userGuid) {
  return service.delete(`/api/follows/${userGuid}`)
}
