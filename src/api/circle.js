import service from '@/axios'

// 我的频道列表：GET /api/circles/my -> ApiResponse<List<CircleDto>>
export function getMyCircles() {
  return service.get('/api/circles/my')
}

// 频道详情：GET /api/circles/{circleGuid} -> ApiResponse<CircleDto>
export function getCircle(circleGuid) {
  return service.get(`/api/circles/${circleGuid}`)
}

// 频道动态流：GET /api/circles/{circleGuid}/posts -> ApiResponse<PagedResult<CommunityPostDto>>
// CommunityPostDto 缺作者信息，转换为 PostCard 兼容结构
export function getCirclePosts(circleGuid, params = {}) {
  const req = service.get(`/api/circles/${circleGuid}/posts`, { params })
  return req.then(res => {
    const data = res && res.data ? res.data : res
    const items = (data.items || data.list || []).map(mapCommunityPost)
    return { ...res, data: { ...data, items } }
  })
}

function mapCommunityPost(p) {
  return {
    ...p,
    isVideo: false,
    author: {
      userGuid: p.authorGuid,
      userName: '社区成员',
      avatar: ''
    },
    content: p.content,
    publishTime: p.publishTime || p.createTime
  }
}

// 加入频道（邀请码/链接）：POST /api/circles/join { code? | token? }
export function joinCircle(payload) {
  return service.post('/api/circles/join', payload)
}

// 退出频道：DELETE /api/circles/{circleGuid}/members/{userGuid}
export function leaveCircle(circleGuid, userGuid) {
  return service.delete(`/api/circles/${circleGuid}/members/${userGuid}`)
}

// 创建频道：POST /api/circles { name, description?, avatarUrl?, maxMembers? }
export function createCircle(payload) {
  return service.post('/api/circles', payload)
}
