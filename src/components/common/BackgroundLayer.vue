<template>
  <!-- 背景图系统：基底（body 纯色）→ 图片层 → 渐变压暗层 → 蒙层；无背景图时整体不渲染 -->
  <div v-if="skin.wallpaper" class="skin-bg-layer" aria-hidden="true">
    <div class="absolute inset-0 skin-bg-img" :style="img"></div>
    <div class="absolute inset-0" :style="vignette"></div>
    <div class="absolute inset-0" :style="mask"></div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useSkinStore } from '@/stores/skin'
import { useThemeStore } from '@/stores/theme'
import { bgImageStyle, vignetteStyle, maskStyle } from '@/utils/skinStyle'

const skin = useSkinStore()
const theme = useThemeStore()

const img = computed(() => bgImageStyle(skin.wallpaperUrl, skin.blur))
const vignette = computed(() => vignetteStyle())
const mask = computed(() => maskStyle(skin.effectiveMask, theme.isDark))
</script>

<style scoped>
.skin-bg-layer {
  position: fixed;
  inset: 0;
  /* ⚠️ 不能为负：Chrome 会把 body 背景作为 canvas 层绘制，负 z-index 的 fixed 层会被它盖住（实测 B/C 不可见）。
     改为 z-index:0，内容容器在 AppLayout 里包一层 relative z-10，保证背景垫底、内容在上。 */
  z-index: 0;
  pointer-events: none;
}

.skin-bg-layer > div {
  /* GPU 加速，防止滚动掉帧（设计规范：will-change + translateZ(0)） */
  transform: translateZ(0);
  will-change: transform, filter, background-color;
  transition: filter 0.25s ease, background-color 0.25s ease;
}
</style>
