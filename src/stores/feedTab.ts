// 广场页信息流 Tab 状态（热门/最新）——由全局 TopBar 切换、HomeView 消费
//
// 真源是 URL 的 ?tab= 查询参数：这样 Tab 可分享、浏览器前进/后退可用
// （TopBar 负责写 URL，HomeView 负责把 URL 读回本 store）。
// 放 store 而非组件内：切换 UI 在 TopBar，数据展示在 HomeView，跨组件共享。
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useAuthStore } from '@/stores/auth';

export type FeedTab = 'hot' | 'latest';

/** 校验任意值是否为合法 Tab（URL 参数来自外部，必须先收窄类型） */
export function isFeedTab(v: unknown): v is FeedTab {
  return v === 'hot' || v === 'latest';
}

export const useFeedTabStore = defineStore('feedTab', () => {
  const auth = useAuthStore();
  // 默认 Tab：已登录 → 最新（关注流），未登录 → 热门（公开内容）
  const tab = ref<FeedTab>(auth.isLoggedIn() ? 'latest' : 'hot');

  function switchTab(t: FeedTab): void {
    if (tab.value !== t) tab.value = t;
  }

  /**
   * 用 URL 查询参数对齐 Tab（首次进入与浏览器前进/后退都走这里）。
   * 参数缺失或非法时保持当前值，不清空为默认——避免「后退到无 query 的地址」把登录用户的默认关注流冲掉。
   */
  function syncFromQuery(raw: unknown): void {
    if (isFeedTab(raw)) tab.value = raw;
  }

  return { tab, switchTab, syncFromQuery };
});