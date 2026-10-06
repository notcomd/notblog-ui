import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';

import { getToken } from '@/utils/auth';
import { useAuthStore } from '@/stores/auth';
import { useToastStore } from '@/stores/toast';

// MonoHub 主应用
import AppLayout from '@/layout/AppLayout.vue';
import HomeView from '@/views/HomeView.vue';
import CirclePage from '@/views/CirclePage.vue';
import ChatPage from '@/views/ChatPage.vue';
import UserSpaceView from '@/views/UserSpaceView.vue';
import PostDetailView from '@/views/PostDetailView.vue';
import MarkdownDetailView from '@/views/MarkdownDetailView.vue';
import PublishView from '@/views/PublishView.vue';
import WorkspaceView from '@/views/WorkspaceView.vue';
import SearchView from '@/views/SearchView.vue';
import SecuritySettingsView from '@/views/SecuritySettingsView.vue';

// 管理后台
import AdminLayout from '@/layout/AdminLayout.vue';
import AdminDashboardView from '@/views/admin/AdminDashboardView.vue';
import AdminUsersView from '@/views/admin/AdminUsersView.vue';
import AdminContentView from '@/views/admin/AdminContentView.vue';
import AdminReportsView from '@/views/admin/AdminReportsView.vue';
import AdminCirclesView from '@/views/admin/AdminCirclesView.vue';
import AdminFilesView from '@/views/admin/AdminFilesView.vue';
import AdminAnnouncementsView from '@/views/admin/AdminAnnouncementsView.vue';
import AdminMenusView from '@/views/admin/AdminMenusView.vue';
import AdminPermissionsView from '@/views/admin/AdminPermissionsView.vue';
import AdminSecurityView from '@/views/admin/AdminSecurityView.vue';

// 旧版页面（保留但退出主导航）
import LoginPage from '@/views/LoginPage.vue';

const routes: RouteRecordRaw[] = [
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
      {
        path: 'chat/:sessionId',
        name: 'ChatSession',
        component: ChatPage,
        meta: { requiresAuth: true }
      },
      {
        path: 'users/:id',
        name: 'UserSpace',
        component: UserSpaceView,
        meta: { requiresAuth: true }
      },
      {
        path: 'posts/:id',
        name: 'PostDetail',
        component: PostDetailView,
        meta: { requiresAuth: true }
      },
      {
        path: 'markdown/:guid',
        name: 'MarkdownDetail',
        component: MarkdownDetailView,
        meta: { requiresAuth: true }
      },
      { path: 'publish', name: 'Publish', component: PublishView, meta: { requiresAuth: true } },
      {
        path: 'search',
        name: 'Search',
        component: SearchView,
        meta: { requiresAuth: true }
      },
      {
        path: 'workspace',
        name: 'Workspace',
        component: WorkspaceView,
        meta: { requiresAuth: true }
      },
      {
        path: 'settings/security',
        name: 'SecuritySettings',
        component: SecuritySettingsView,
        meta: { requiresAuth: true }
      }
    ]
  },
  // ===== 管理后台（运营版） =====
  {
    path: '/admin',
    component: AdminLayout,
    // requiresAdmin：仅 Root / Administrator 可进入（前端门禁；真正的鉴权在后端权限中间件）
    meta: { requiresAuth: true, requiresAdmin: true },
    children: [
      { path: '', name: 'AdminDashboard', component: AdminDashboardView },
      { path: 'users', name: 'AdminUsers', component: AdminUsersView },
      { path: 'content', name: 'AdminContent', component: AdminContentView },
      { path: 'reports', name: 'AdminReports', component: AdminReportsView },
      { path: 'circles', name: 'AdminCircles', component: AdminCirclesView },
      { path: 'files', name: 'AdminFiles', component: AdminFilesView },
      { path: 'announcements', name: 'AdminAnnouncements', component: AdminAnnouncementsView },
      { path: 'menus', name: 'AdminMenus', component: AdminMenusView },
      { path: 'permissions', name: 'AdminPermissions', component: AdminPermissionsView },
      { path: 'security', name: 'AdminSecurity', component: AdminSecurityView }
    ]
  },
  // ===== 认证 =====
  {
    path: '/login',
    name: 'LoginPage',
    component: LoginPage
  }
  // ===== 旧版页面（保留路由，不进主导航） =====
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to, from, next) => {
  if (to.meta && to.meta.requiresAuth && !getToken()) {
    next('/login');
    return;
  }
  // 管理端角色门禁：非 Root / Administrator 挡回首页并说明原因，
  // 否则手输 /admin 会进入一个所有请求都 403 的空壳页面。
  // 注意：这只是前端门禁，真正的鉴权在后端权限中间件（前端判定可被绕过）。
  if (to.meta && to.meta.requiresAdmin && !useAuthStore().isAdmin) {
    useToastStore().push('无权访问管理后台', 'warning');
    next('/home');
    return;
  }
  next();
});

export default router;
