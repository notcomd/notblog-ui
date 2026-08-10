import { ref, watch } from 'vue'
import { defineStore } from 'pinia'

const THEME_KEY = 'qingmang_theme'

// 全局主题：浅色/深色，带平滑颜色过渡（daisyUI light/dark）
export const useThemeStore = defineStore('theme', () => {
  const isDark = ref(localStorage.getItem(THEME_KEY) === 'dark')

  function apply() {
    document.documentElement.setAttribute('data-theme', isDark.value ? 'dark' : 'light')
    // 主题切换时临时加过渡类，让颜色渐变过渡
    document.documentElement.classList.add('theme-transition')
    setTimeout(() => document.documentElement.classList.remove('theme-transition'), 400)
  }

  function toggle() {
    isDark.value = !isDark.value
  }

  // 初始化
  apply()
  watch(isDark, (v) => {
    localStorage.setItem(THEME_KEY, v ? 'dark' : 'light')
    apply()
  })

  return { isDark, toggle }
})
