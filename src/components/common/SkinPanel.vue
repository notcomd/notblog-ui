<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <!-- 遮罩层 -->
      <div class="absolute inset-0 bg-black/40" @click="emit('close')"></div>

      <!-- 面板 -->
      <div class="relative w-[min(430px,92vw)] max-h-[86vh] overflow-y-auto glass-card p-5 space-y-4 skin-panel-in">
        <!-- 标题 -->
        <div class="flex items-center justify-between">
          <h3 class="text-base font-bold text-zinc-800 dark:text-zinc-100">皮肤设置</h3>
          <button class="w-8 h-8 rounded-[5%] flex items-center justify-center text-zinc-500 dark:text-zinc-300 hover:bg-white/60 dark:hover:bg-zinc-800/60 transition-colors" title="关闭" @click="emit('close')">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>

        <!-- Tab：颜色皮肤 / 背景设置 -->
        <div class="flex gap-1 p-1 rounded-[5%] bg-black/5 dark:bg-white/10">
          <button class="flex-1 h-9 rounded-[5%] text-sm font-medium transition-colors"
            :class="tab === 'color' ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white ' : 'text-zinc-600 dark:text-zinc-300 hover:bg-white/50 dark:hover:bg-zinc-800/50'"
            @click="tab = 'color'">颜色皮肤</button>
          <button class="flex-1 h-9 rounded-[5%] text-sm font-medium transition-colors"
            :class="tab === 'bg' ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white ' : 'text-zinc-600 dark:text-zinc-300 hover:bg-white/50 dark:hover:bg-zinc-800/50'"
            @click="tab = 'bg'">背景设置</button>
        </div>

        <!-- ── 颜色皮肤 Tab ── -->
        <div v-if="tab === 'color'" class="grid grid-cols-2 gap-3">
          <button class="h-24 rounded-[5%] relative overflow-hidden border-2 transition-all"
            :class="!theme.isDark ? 'border-amber-400 ring-2 ring-amber-400/30' : 'border-transparent hover:border-white/40'"
            style="background: linear-gradient(135deg, #fdfaf3 0%, #f0faf6 100%)"
            @click="setDark(false)">
            <span class="absolute bottom-2 left-3 text-xs font-medium text-zinc-700">浅色 · 轻芒白</span>
            <span v-if="!theme.isDark" class="absolute top-2 right-2 w-5 h-5 rounded-full bg-amber-400 text-white flex items-center justify-center">
              <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
            </span>
          </button>
          <button class="h-24 rounded-[5%] relative overflow-hidden border-2 transition-all"
            :class="theme.isDark ? 'border-amber-400 ring-2 ring-amber-400/30' : 'border-transparent hover:border-white/40'"
            style="background: linear-gradient(135deg, #18181b 0%, #101f1b 100%)"
            @click="setDark(true)">
            <span class="absolute bottom-2 left-3 text-xs font-medium text-zinc-100">深色 · 暮色深蓝</span>
            <span v-if="theme.isDark" class="absolute top-2 right-2 w-5 h-5 rounded-full bg-amber-400 text-white flex items-center justify-center">
              <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
            </span>
          </button>
        </div>

        <!-- ── 背景设置 Tab ── -->
        <div v-else class="space-y-4">
          <!-- 顶部预览窗：所见即所得 -->
          <div class="h-32 rounded-[5%] relative overflow-hidden border border-white/30">
            <div v-if="skin.wallpaper" class="absolute inset-0" :style="img"></div>
            <div v-if="skin.wallpaper" class="absolute inset-0" :style="vignette"></div>
            <div v-if="skin.wallpaper" class="absolute inset-0" :style="mask"></div>
            <div class="absolute inset-0 flex items-center justify-center">
              <div class="px-4 py-2 rounded-[5%] glass shadow">
                <span class="text-sm font-medium text-zinc-700 dark:text-zinc-100">标题文字在这里</span>
              </div>
            </div>
            <div v-if="!skin.wallpaper" class="absolute inset-0 flex items-center justify-center text-xs text-zinc-400 dark:text-zinc-500">纯色模式</div>
          </div>

          <!-- 官方预设壁纸 -->
          <div class="space-y-3">
            <div v-for="cat in WALLPAPER_CATS" :key="cat.key">
              <p class="text-xs text-zinc-500 dark:text-zinc-400 mb-1.5">{{ cat.label }}</p>
              <div class="flex gap-2 overflow-x-auto pb-1">
                <button
                  v-for="w in wallpapersOf(cat.key)"
                  :key="w.id"
                  :title="w.name"
                  class="w-20 h-14 shrink-0 rounded-[5%] bg-cover bg-center border-2 transition-all"
                  :class="!skin.useCustom && skin.wallpaperId === w.id ? 'border-amber-400 ring-2 ring-amber-400/30' : 'border-transparent hover:border-white/50'"
                  :style="thumbStyle(w)"
                  @click="skin.setWallpaper(w.id)"
                ></button>
              </div>
            </div>
          </div>

          <!-- 自定义：上传（压缩 ≤1920px / WebP 转码 / 5MB 配额；上传失败本地兜底） -->
          <div class="space-y-2">
            <p class="text-xs text-zinc-500 dark:text-zinc-400">自定义</p>
            <div class="flex gap-2">
              <input ref="fileInput" type="file" accept="image/jpeg,image/png,image/webp" class="hidden" @change="onPickFile" />
              <button class="flex-1 h-9 rounded-[5%] text-sm font-medium bg-gradient-to-r from-amber-400 to-orange-500 text-white hover: active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed" :disabled="uploading" @click="pickFile">
                <span v-if="!uploading" class="inline-flex items-center gap-1"><svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>上传自定义图片</span><span v-else>上传中…</span>
              </button>
              <button v-if="skin.customUrl" class="h-9 px-3 rounded-[5%] text-sm font-medium text-red-500 border border-red-300 dark:border-red-500/40 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors" @click="skin.removeWallpaper()"><svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> 移除背景</button>
            </div>
            <!-- 我的壁纸：点击切换回自定义背景 -->
            <div v-if="skin.customUrl" class="flex items-center gap-2.5">
              <button class="w-16 h-10 shrink-0 rounded-[5%] bg-cover bg-center border-2 transition-all" :class="skin.useCustom ? 'border-amber-400 ring-2 ring-amber-400/30' : 'border-transparent hover:border-white/50'" :style="customThumbStyle" title="我的壁纸" @click="skin.selectCustom()"></button>
              <span class="text-xs text-zinc-400 dark:text-zinc-500">已上传（上传新图自动覆盖旧图，仅保留最新一张）</span>
            </div>
          </div>

          <!-- 遮罩控制 -->
          <div class="space-y-3 pt-1">
            <div>
              <div class="flex items-center justify-between mb-1">
                <span class="text-xs text-zinc-500 dark:text-zinc-400">背景虚化 / 模糊度</span>
                <span class="text-xs font-medium text-zinc-700 dark:text-zinc-200">{{ skin.blur }}px</span>
              </div>
              <input type="range" min="0" max="12" step="1" class="w-full accent-amber-500" :value="skin.blur" @input="skin.setBlur(Number($event.target.value))" />
              <div class="flex justify-between text-[10px] text-zinc-400 dark:text-zinc-500"><span>柔和</span><span>清晰</span></div>
            </div>
            <div>
              <div class="flex items-center justify-between mb-1">
                <span class="text-xs text-zinc-500 dark:text-zinc-400">蒙层深浅</span>
                <span class="text-xs font-medium text-zinc-700 dark:text-zinc-200">{{ skin.mask }}%</span>
              </div>
              <input type="range" :min="skin.MIN_MASK" :max="skin.MAX_MASK" step="1" class="w-full accent-amber-500" :value="skin.mask" @input="skin.setMask(Number($event.target.value))" />
              <div class="flex justify-between text-[10px] text-zinc-400 dark:text-zinc-500"><span>浅（不低于 {{ skin.MIN_MASK }}%，保证可读性）</span><span>深</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useSkinStore } from '@/stores/skin'
import { useThemeStore } from '@/stores/theme'
import { WALLPAPER_CATS, WALLPAPERS, wallpaperDataUri } from '@/assets/wallpapers'
import { bgImageStyle, vignetteStyle, maskStyle } from '@/utils/skinStyle'

const emit = defineEmits<{ (e: 'close'): void }>()
const skin = useSkinStore()
const theme = useThemeStore()

const tab = ref<'color' | 'bg'>('color')
const fileInput = ref<HTMLInputElement | null>(null)
const uploading = ref(false)

function pickFile() {
  if (fileInput.value) fileInput.value.click()
}

async function onPickFile(e: Event) {
  const el = e.target as HTMLInputElement
  const file = el.files && el.files[0]
  el.value = '' // 允许重复选择同一文件
  if (!file || uploading.value) return
  uploading.value = true
  try {
    await skin.setCustomWallpaper(file)
  } finally {
    uploading.value = false
  }
}

const customThumbStyle = computed(() => (skin.customUrl ? { backgroundImage: `url("${skin.customUrl}")` } : {}))
type WallpaperStyle = Record<string, string>

const img = computed(() => bgImageStyle(skin.wallpaperUrl, skin.blur))
const vignette = computed(() => vignetteStyle())
const mask = computed(() => maskStyle(skin.effectiveMask, theme.isDark))

function wallpapersOf(catKey: string): Array<{ id: string; name: string; cat: string; svg: string }> {
  return WALLPAPERS.filter(w => w.cat === catKey)
}

function thumbStyle(w: { id: string; name: string; cat: string; svg: string }): WallpaperStyle {
  return { backgroundImage: `url("${wallpaperDataUri(w)}")` }
}

function setDark(v: boolean) {
  if (theme.isDark !== v) theme.toggle()
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<style scoped>
.skin-panel-in {
  animation: skin-panel-in 0.25s ease both;
}

@keyframes skin-panel-in {
  from {
    opacity: 0;
    transform: scale(0.96) translateY(8px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
</style>
