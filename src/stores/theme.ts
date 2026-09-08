import { ref, watch } from 'vue';
import { defineStore } from 'pinia';

const THEME_KEY = 'qingmang_theme';

// 全局主题：浅色/深色，带平滑颜色过渡（data-theme 由 input.css 自定义选择器接管）
export const useThemeStore = defineStore('theme', () => {
  const isDark = ref(localStorage.getItem(THEME_KEY) === 'dark');

  function apply() {
    document.documentElement.setAttribute('data-theme', isDark.value ? 'dark' : 'light');
    // 浏览器 UI（地址栏/状态栏）主题色与页面背景一致
    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (meta) meta.content = isDark.value ? '#18181b' : '#fdfaf3';
    // 深色模式：滚动条/表单控件等原生组件跟随暗色
    document.documentElement.style.colorScheme = isDark.value ? 'dark' : 'light';
    // 主题切换时临时加过渡类，让颜色渐变过渡
    document.documentElement.classList.add('theme-transition');
    setTimeout(() => document.documentElement.classList.remove('theme-transition'), 400);
  }

  function toggle() {
    isDark.value = !isDark.value;
  }

  // 初始化
  apply();
  watch(isDark, (v: boolean) => {
    localStorage.setItem(THEME_KEY, v ? 'dark' : 'light');
    apply();
  });

  return { isDark, toggle };
});
