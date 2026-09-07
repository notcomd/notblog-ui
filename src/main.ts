import './input.css';
// 特色字体（fontsource 离线打包，避免 Google Fonts 在境内不可用）：
// Fraunces 可变衬线 —— 品牌/标题展示字（软衬线、烘焙暖感、横画有性格）；Outfit 可变几何 —— 数字/英文数据字
import '@fontsource-variable/fraunces';
import '@fontsource-variable/outfit';
import App from './App.vue';
import router from './router';
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { useAuthStore } from '@/stores/auth';
import { useToastStore } from '@/stores/toast';
import { onSessionExpired } from '@/axios/session';

const app = createApp(App);
const pinia = createPinia();
app.use(pinia);
app.use(router);

// ═══ 会话失效装配（axios 401 自动刷新失败时广播，统一在此清理并跳登录）═══
// axios 层不直接依赖 router/store（防循环依赖），经 window 事件通知本装配点。
// 短时去重：并发多个请求同时 401 时只处理一次。
let handlingSessionExpiry = false;
onSessionExpired(reason => {
  if (handlingSessionExpiry) return;
  handlingSessionExpiry = true;
  setTimeout(() => {
    handlingSessionExpiry = false;
  }, 600);

  const auth = useAuthStore(pinia);
  const toast = useToastStore(pinia);
  const current = router.currentRoute.value;

  // 清本地凭证与用户态（localStorage token/refresh_token + store）
  auth.logout();

  // 已在登录页：仅清理凭证，不重复跳转/提示
  if (current.path === '/login') return;

  toast.push(reason || '登录状态已过期，请重新登录', 'warning');
  // 携带当前地址，登录成功后回跳（LoginFrom 消费 query.redirect）
  const redirect = current.fullPath && current.fullPath !== '/' ? current.fullPath : undefined;
  router.replace({ path: '/login', query: redirect ? { redirect } : {} });
});

app.mount('#app');
