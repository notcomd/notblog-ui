import { createRouter, createWebHistory } from 'vue-router'

import { getToken } from '@/utils/auth'

// 部落主应用（轻芒·兴趣部落）
import AppLayout from '@/layout/AppLayout.vue'
import HomeView from '@/views/HomeView.vue'
import CirclePage from '@/views/CirclePage.vue'
import ChatPage from '@/views/ChatPage.vue'
import UserSpaceView from '@/views/UserSpaceView.vue'
import PostDetailView from '@/views/PostDetailView.vue'
import MarkdownDetailView from '@/views/MarkdownDetailView.vue'
import PublishView from '@/views/PublishView.vue'
import WorkspaceView from '@/views/WorkspaceView.vue'

// 管理后台
import AdminLayout from '@/layout/AdminLayout.vue'
import AdminDashboardView from '@/views/admin/AdminDashboardView.vue'
import AdminUsersView from '@/views/admin/AdminUsersView.vue'
import AdminContentView from '@/views/admin/AdminContentView.vue'
import AdminReportsView from '@/views/admin/AdminReportsView.vue'
import AdminCirclesView from '@/views/admin/AdminCirclesView.vue'
import AdminFilesView from '@/views/admin/AdminFilesView.vue'
import AdminAnnouncementsView from '@/views/admin/AdminAnnouncementsView.vue'

// 旧版页面（保留但退出主导航）
import LoginPage from '@/views/LoginPage.vue'
import VerificationCodePage from '@/views/VerificationCodePage.vue'

const routes = [
  {
    path: '/',
    redirect: '/home'
  },
  // ===== 部落主应用 =====
  {
    path: '/',
    component: AppLayout,
    children: [
      { path: 'home', name: 'Home', component: HomeView },
      { path: 'circles', name: 'Circles', component: CirclePage, meta: { requiresAuth: true } },
      { path: 'chat', name: 'Chat', component: ChatPage, meta: { requiresAuth: true } },
      { path: 'chat/:sessionId', name: 'ChatSession', component: ChatPage, meta: { requiresAuth: true } },
      { path: 'users/:id', name: 'UserSpace', component: UserSpaceView, meta: { requiresAuth: true } },
      { path: 'posts/:id', name: 'PostDetail', component: PostDetailView, meta: { requiresAuth: true } },
      { path: 'markdown/:guid', name: 'MarkdownDetail', component: MarkdownDetailView, meta: { requiresAuth: true } },
      { path: 'publish', name: 'Publish', component: PublishView, meta: { requiresAuth: true } },
      { path: 'workspace', name: 'Workspace', component: WorkspaceView, meta: { requiresAuth: true } }
    ]
  },
  // ===== 管理后台（运营版） =====
  {
    path: '/admin',
    component: AdminLayout,
    meta: { requiresAuth: true },
    children: [
      { path: '', name: 'AdminDashboard', component: AdminDashboardView },
      { path: 'users', name: 'AdminUsers', component: AdminUsersView },
      { path: 'content', name: 'AdminContent', component: AdminContentView },
      { path: 'reports', name: 'AdminReports', component: AdminReportsView },
      { path: 'circles', name: 'AdminCircles', component: AdminCirclesView },
      { path: 'files', name: 'AdminFiles', component: AdminFilesView },
      { path: 'announcements', name: 'AdminAnnouncements', component: AdminAnnouncementsView }
    ]
  },
  // ===== 认证 =====
  {
    path: '/login',
    name: 'LoginPage',
    component: LoginPage
  },
  {
    path: '/verify-code',
    name: 'VerificationCodePage',
    component: VerificationCodePage
  },
  // ===== 旧版页面（保留路由，不进主导航） =====
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  if (to.meta && to.meta.requiresAuth && !getToken()) {
    next('/login')
  } else {
    next()
  }
})

export default router
