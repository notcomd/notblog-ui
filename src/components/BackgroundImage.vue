<template>
  <div class="bg-container">
    <img v-if="imageUrl" :src="imageUrl" alt="Bing 每日壁纸" class="bg-image" @error="onImageError" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
// 兜底壁纸：打包进前端，官方接口不可达时也能保证登录页有背景
import fallbackImg from '@/assets/images/120498537_p0_master1200.jpg'

const imageUrl = ref('')

// 主源：cn.bing.com 官方每日壁纸接口（中国区可达；idx 随机取最近 8 天，图片更丰富）
const fetchFromBing = async () => {
  const resp = await fetch(
    `https://cn.bing.com/HPImageArchive.aspx?format=js&idx=${Math.floor(Math.random() * 8)}&n=1&mkt=zh-CN`,
    { signal: AbortSignal.timeout(8000) }
  )
  const data = await resp.json()
  const url = data && data.images && data.images[0] && data.images[0].url
  if (!url) throw new Error('Bing 接口返回异常')
  imageUrl.value = 'https://cn.bing.com' + url
}

// 次源：第三方聚合（原实现；官方接口失败时尝试）
const fetchFromImgRun = async () => {
  imageUrl.value = 'https://bing.img.run/rand_uhd.php'
}

onMounted(async () => {
  try {
    await fetchFromBing()
  } catch (e) {
    console.warn('Bing 官方壁纸获取失败，切换备用源:', e)
    try {
      await fetchFromImgRun()
    } catch (e2) {
      // 两层都失败 → 用打包的本地图（组件加载时即设置，<img> 一定能显示）
      imageUrl.value = fallbackImg
    }
  }
})

// <img> 实际加载失败（网络抖动/图片 404）→ 本地兜底图
const onImageError = () => {
  if (imageUrl.value !== fallbackImg) {
    imageUrl.value = fallbackImg
  }
}
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
}
</style>
