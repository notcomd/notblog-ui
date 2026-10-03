<template>
  <div class="bg-container">
    <img v-if="imageUrl" :src="imageUrl" alt="" aria-hidden="true" class="bg-image" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// 登录页背景：使用 public 目录下的静态资源，以根路径引用（构建后原样拷贝，无需打包处理）
const imageUrl = ref('/favicon.png')
</script>

<style scoped>
/* ⚠️ 不能用负 z-index：Chrome 把 body 渐变背景作为 canvas 层绘制，
   负 z-index 的 fixed 层会被 body 背景盖住（曾因此壁纸不可见）。
   用 z-index: 0 + 内容容器 relative z-10（LoginPage 已按此结构） */
.bg-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  z-index: 0;
}

.bg-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  /* 柔化：降低对比度把黑线压成浅灰，再提亮还原白底，整体观感更柔和 */
  filter: contrast(0.42) brightness(1.28);
}
</style>
