import { ref, watch } from 'vue';
import { defineStore } from 'pinia';

// 主题偏好持久化键与主题色。
// ⚠️ THEME_KEY 被 index.html 的首帧预置脚本同步读取，改名需两处同改。
const THEME_KEY = 'qingmang_theme';
const DARK_THEME_COLOR = '#18181b';
const LIGHT_THEME_COLOR = '#fdfaf3';

// 全局主题：浅色/深色。
// data-theme 是 CSS 判定主题的唯一开关，本 store 是它的唯一真源：
// 状态变更写属性（apply），属性被外部改写则拉回（lockAttr）。
// 若只单向写，外部脚本改写属性后会出现「CSS 已跟随属性变色、JS 仍按 isDark 渲染」的
// 半深半浅页面（遮罩、切换图标等由 isDark 驱动的元素不跟随）。
//
// 主题全局唯一：管理端不强制深色，与用户端共用同一个用户偏好，
// 因此不存在「路由级覆盖」层。任何地方都不得旁路本 store 直接改 data-theme。
export const useThemeStore = defineStore('theme', () => {
  const isDark = ref(localStorage.getItem(THEME_KEY) === 'dark');

  /** 把状态投射到 DOM；withTransition=false 用于首帧与纠正外部改写（避免多余的渐变动画） */
  function apply(withTransition = true) {
    const dark = isDark.value;
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    // 浏览器 UI（地址栏/状态栏）主题色与页面背景一致
    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (meta) meta.content = dark ? DARK_THEME_COLOR : LIGHT_THEME_COLOR;
    // 深色模式：滚动条/表单控件等原生组件跟随暗色
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
    if (withTransition) {
      // 主题切换时临时加过渡类，让颜色渐变过渡
      document.documentElement.classList.add('theme-transition');
      setTimeout(() => document.documentElement.classList.remove('theme-transition'), 400);
    }
  }

  /** data-theme 被外部脚本/扩展改写时拉回本 store 的值（用户显式选择的主题优先） */
  function lockAttr() {
    const want = isDark.value ? 'dark' : 'light';
    if (document.documentElement.getAttribute('data-theme') === want) return;
    apply(false);
  }

  function toggle() {
    isDark.value = !isDark.value;
  }

  // 首帧主题已由 index.html 的预置脚本按同一 localStorage 键设好，这里不再播放过渡动画
  apply(false);
  new MutationObserver(lockAttr).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme']
  });
  watch(isDark, (v: boolean) => {
    localStorage.setItem(THEME_KEY, v ? 'dark' : 'light');
    apply();
  });

  return { isDark, toggle };
});
