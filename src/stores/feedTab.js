// 广场页信息流 Tab 状态（热门/最新）——由全局 TopBar 切换、HomeView 消费
// 放 store 而非组件内：切换 UI 在 TopBar，数据展示在 HomeView，跨组件共享
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'

export const useFeedTabStore = defineStore('feedTab', () => {
  const auth = useAuthStore()
  // 默认 Tab：已登录 → 最新（关注流），未登录 → 热门（公开内容）
  const tab = ref(auth.isLoggedIn() ? 'latest' : 'hot')

  function switchTab(t) {
    if (tab.value !== t) tab.value = t
  }

  return { tab, switchTab }
})
