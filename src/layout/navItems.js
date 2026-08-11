// 功能栏导航项定义（单一事实源）：SideNav 渲染导航、TopBar 左上角显示当前功能标题
// 改导航 label/图标/路由只需动这里；个人空间项依赖路由参数与登录态，用 buildSpaceNavItems 构建

export const MAIN_NAV_ITEMS = [
  { to: { path: '/home' }, label: '广场', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 0 0 1 1h3m10-11l2 2m-2-2v10a1 1 0 0 1-1 1h-3m-6 0a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1m-6 0h6' },
  { to: { path: '/circles' }, label: '频道', icon: 'M3 21v-4m0 0V5a2 2 0 0 1 2-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 0 0-2 2zm9-13.5V9m0 4.5V19' },
  { to: { path: '/chat' }, label: '会话', icon: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' },
  { to: { path: '/explore' }, label: '探索', icon: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zm0-7a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm7-2h2m-2-6l-1.4 1.4M5 5l1.4 1.4M3 12h2' }
]

// 个人空间导航：收藏/安全仅自己可见（他人只保留：主页/作品/公开仓库）
export function buildSpaceNavItems(userId, isSelf) {
  const tabItems = [
    { key: 'home', label: '主页', icon: 'M3 12l9-9 9 9M5 10v10a1 1 0 0 0 1 1h3m10-11v10a1 1 0 0 1-1 1h-3m-6 0a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1m-6 0h6' },
    { key: 'works', label: '作品', icon: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z' },
    { key: 'favorites', label: '收藏', icon: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' },
    { key: 'files', label: isSelf ? '我的仓库' : '公开仓库', icon: 'M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z' },
    { key: 'security', label: '安全', icon: 'M12 17v2M7 11V7a5 5 0 0 1 10 0v4M5 11h14a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1z' }
  ]
  return (isSelf ? tabItems : tabItems.filter(t => !['favorites', 'security'].includes(t.key)))
    .map(t => ({ to: { path: `/users/${userId}`, query: { tab: t.key } }, label: t.label, icon: t.icon }))
}
