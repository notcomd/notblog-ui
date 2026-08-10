// 通知类型 → 展示元数据（头像位图标 + 底色 + 来源名称）
// 后端 NotificationDto 无通知者头像/名称字段：系统类显示「轻芒系统」，
// 用户互动类显示「互动通知」，示例数据用模拟昵称展示效果
const TYPE_META = {
  // —— 系统类 ——
  TweetApproved: { name: '轻芒系统', icon: '<path d="M20 6L9 17l-5-5" />', bg: 'bg-emerald-100 dark:bg-emerald-500/20', fg: 'text-emerald-600 dark:text-emerald-300' },
  TweetRejected: { name: '轻芒系统', icon: '<path d="M18 6L6 18M6 6l12 12" />', bg: 'bg-red-100 dark:bg-red-500/20', fg: 'text-red-600 dark:text-red-300' },
  ReportResolved_Removed: { name: '轻芒系统', icon: '<path d="M4 21V4a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H8l-4 4z" /><path d="M20 4v13" />', bg: 'bg-red-100 dark:bg-red-500/20', fg: 'text-red-600 dark:text-red-300' },
  ReportResolved_Rejected: { name: '轻芒系统', icon: '<path d="M4 21V4a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H8l-4 4z" /><path d="M20 4v13" />', bg: 'bg-zinc-100 dark:bg-zinc-500/20', fg: 'text-zinc-500 dark:text-zinc-300' },
  // —— 用户互动类 ——
  CommentReplied: { name: '互动通知', icon: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />', bg: 'bg-sky-100 dark:bg-sky-500/20', fg: 'text-sky-600 dark:text-sky-300' },
  TweetLiked: { name: '互动通知', icon: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />', bg: 'bg-pink-100 dark:bg-pink-500/20', fg: 'text-pink-600 dark:text-pink-300' },
  TweetFavorited: { name: '互动通知', icon: '<path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z" />', bg: 'bg-amber-100 dark:bg-amber-500/20', fg: 'text-amber-600 dark:text-amber-300' },
  TweetCoined: { name: '互动通知', icon: '<circle cx="12" cy="12" r="9" /><path d="M12 7v10M9.5 9.5c.5-.7 1.4-1 2.5-1s2 .3 2.5 1c.6.8.2 1.8-1.2 2.3-1.8.6-2.4 1.5-1.8 2.4.5.8 1.5 1.1 2.5 1s2-.4 2.5-1.2" />', bg: 'bg-amber-100 dark:bg-amber-500/20', fg: 'text-amber-600 dark:text-amber-300' },
  TweetShared: { name: '互动通知', icon: '<path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><path d="M16 6l-4-4-4 4" /><path d="M12 2v13" />', bg: 'bg-emerald-100 dark:bg-emerald-500/20', fg: 'text-emerald-600 dark:text-emerald-300' },
  NewFollower: { name: '互动通知', icon: '<circle cx="9" cy="8" r="3.5" /><path d="M3 20v-1a6 6 0 0 1 6-6 6 6 0 0 1 6 6v1" /><path d="M18 8v6M15 11h6" />', bg: 'bg-sky-100 dark:bg-sky-500/20', fg: 'text-sky-600 dark:text-sky-300' },
  // —— 圈子 / 群组类 ——
  CircleInvited: { name: '圈子通知', icon: '<path d="M12 3l9 18H3z" /><path d="M8 14l4-5 4 5" />', bg: 'bg-indigo-100 dark:bg-indigo-500/20', fg: 'text-indigo-600 dark:text-indigo-300' },
  CircleJoined: { name: '圈子通知', icon: '<path d="M12 3l9 18H3z" /><path d="M8 14l4-5 4 5" />', bg: 'bg-indigo-100 dark:bg-indigo-500/20', fg: 'text-indigo-600 dark:text-indigo-300' },
  CirclePostPublished: { name: '圈子通知', icon: '<path d="M12 3l9 18H3z" /><path d="M8 14l4-5 4 5" />', bg: 'bg-indigo-100 dark:bg-indigo-500/20', fg: 'text-indigo-600 dark:text-indigo-300' },
  GroupDissolved: { name: '群组通知', icon: '<path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" /><circle cx="10" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />', bg: 'bg-red-100 dark:bg-red-500/20', fg: 'text-red-600 dark:text-red-300' },
  GroupMemberRemoved: { name: '群组通知', icon: '<path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" /><circle cx="10" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />', bg: 'bg-zinc-100 dark:bg-zinc-500/20', fg: 'text-zinc-500 dark:text-zinc-300' }
}

// 兜底（未知类型）
const FALLBACK_META = { name: '轻芒系统', icon: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" />', bg: 'bg-amber-100 dark:bg-amber-500/20', fg: 'text-amber-600 dark:text-amber-300' }

export function notificationMeta(type) {
  return TYPE_META[type] || FALLBACK_META
}

// 示例通知（⚠️ 后端离线/列表为空时用于展示；isSample 标记，UI 显示「示例」徽标）
export const SAMPLE_NOTIFICATIONS = [
  {
    notifyGuid: 'sample-1',
    type: 'TweetApproved',
    title: '内容审核通过',
    content: '你的作品《夏日轻芒》已通过审核，现已公开发布，快去看看吧！',
    isRead: false,
    createTime: Date.now() - 3 * 60 * 1000,
    isSample: true
  },
  {
    notifyGuid: 'sample-2',
    type: 'TweetLiked',
    title: '小明点赞了你的推文',
    content: '《一个人的周末露营指南——从装备清单到星空拍摄的完整攻略》：包含帐篷搭建步骤、生火技巧、星空延时摄影参数、夜间安全注意事项与应急药品清单，全文共 8000 余字，收藏这篇超长干货，下次露营直接照着做。',
    isRead: false,
    createTime: Date.now() - 1 * 60 * 60 * 1000,
    isSample: true
  },
  {
    notifyGuid: 'sample-3',
    type: 'CommentReplied',
    title: '小红回复了你的评论',
    content: '写得真好！下次我也试试这个方法，期待更多分享～',
    isRead: false,
    createTime: Date.now() - 3 * 60 * 60 * 1000,
    isSample: true
  },
  {
    notifyGuid: 'sample-4',
    type: 'NewFollower',
    title: '林小满关注了你',
    content: '快去她的主页看看吧，说不定有你们共同感兴趣的话题。',
    isRead: true,
    createTime: Date.now() - 26 * 60 * 60 * 1000,
    isSample: true
  }
]
