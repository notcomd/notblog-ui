// 站内通知（Message 服务 NotificationsApi，R-04，需 JWT）
// GET /api/notifications?page=&pageSize=&unreadOnly= -> ApiResponse<PagedResult<NotificationDto>>
// GET /api/notifications/unread-count -> ApiResponse<int>
// PUT /api/notifications/read-all -> ApiResponse
// PUT /api/notifications/{notifyGuid}/read -> ApiResponse
// NotificationDto { notifyGuid, type, title, content, refType?, refGuid?, isRead, createTime }
//   ⚠️ 无通知者头像/名称字段；type 枚举：TweetApproved/TweetRejected/ReportResolved_* /
//      CommentReplied/TweetLiked/TweetFavorited/TweetCoined/TweetShared/CircleInvited/
//      CircleJoined/CirclePostPublished/NewFollower/GroupDissolved/GroupMemberRemoved
import service from '@/axios'

export function getNotifications({ page = 1, pageSize = 20, unreadOnly = false } = {}) {
  return service.get('/api/notifications', { params: { page, pageSize, unreadOnly } })
}

export function getNotificationUnreadCount() {
  return service.get('/api/notifications/unread-count')
}

export function markAllNotificationsRead() {
  return service.put('/api/notifications/read-all')
}

export function markNotificationRead(notifyGuid) {
  return service.put(`/api/notifications/${notifyGuid}/read`)
}
