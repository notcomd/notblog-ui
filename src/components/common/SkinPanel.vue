<template>
  <BaseModal title="皮肤设置" width="w-[430px]" body-class="p-5 space-y-5" @close="emit('close')">
    <!-- ── 主题 ── -->
    <div class="space-y-2">
      <p class="text-xs text-zinc-500 dark:text-zinc-400">主题</p>
      <div class="grid grid-cols-2 gap-3">
        <button class="h-24 rounded-[5%] relative overflow-hidden border-2 transition-all"
          :class="!theme.isDark ? 'border-amber-400 ring-2 ring-amber-400/30' : 'border-transparent hover:border-black/10 dark:hover:border-white/25'"
          style="background: linear-gradient(135deg, #fdfaf3 0%, #f0faf6 100%)"
          @click="setDark(false)">
          <span class="absolute bottom-2 left-3 text-xs font-medium text-zinc-700">浅色 · 纸张白</span>
          <span v-if="!theme.isDark" class="absolute top-2 right-2 w-5 h-5 rounded-full bg-amber-400 text-white flex items-center justify-center">
            <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5" /></svg>
          </span>
        </button>
        <button class="h-24 rounded-[5%] relative overflow-hidden border-2 transition-all"
          :class="theme.isDark ? 'border-amber-400 ring-2 ring-amber-400/30' : 'border-transparent hover:border-black/10 dark:hover:border-white/25'"
          style="background: linear-gradient(135deg, #18181b 0%, #101f1b 100%)"
          @click="setDark(true)">
          <span class="absolute bottom-2 left-3 text-xs font-medium text-zinc-100">深色 · 暮色深蓝</span>
          <span v-if="theme.isDark" class="absolute top-2 right-2 w-5 h-5 rounded-full bg-amber-400 text-white flex items-center justify-center">
            <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5" /></svg>
          </span>
        </button>
      </div>
    </div>

    <!-- ── 背景图（仅自定义上传） ── -->
    <div class="space-y-3">
      <p class="text-xs text-zinc-500 dark:text-zinc-400">背景图</p>

      <!-- 预览窗：所见即所得 -->
      <div class="h-28 rounded-[5%] relative overflow-hidden border border-black/10 dark:border-white/10">
        <div v-if="skin.hasWallpaper" class="absolute inset-0" :style="img"></div>
        <div v-if="skin.hasWallpaper" class="absolute inset-0" :style="vignette"></div>
        <div v-if="skin.hasWallpaper" class="absolute inset-0" :style="mask"></div>
        <div class="absolute inset-0 flex items-center justify-center">
          <div v-if="skin.hasWallpaper" class="px-4 py-2 rounded-[5%] glass shadow">
            <span class="text-sm font-medium text-zinc-700 dark:text-zinc-100">标题文字在这里</span>
          </div>
          <span v-else class="text-xs text-zinc-400 dark:text-zinc-500">纯色模式</span>
        </div>
      </div>

      <div class="flex gap-2">
        <input ref="fileInput" type="file" accept="image/jpeg,image/png,image/webp" class="hidden" @change="onPickFile" />
        <button class="flex-1 h-9 rounded-[5%] text-sm font-medium bg-gradient-to-r from-amber-400 to-orange-500 text-white active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed" :disabled="uploading" @click="pickFile">
          <span v-if="!uploading" class="inline-flex items-center gap-1"><svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>上传自定义图片</span><span v-else>上传中…</span>
        </button>
        <button v-if="skin.hasWallpaper" class="h-9 px-3 rounded-[5%] text-sm font-medium text-red-500 border border-red-300 dark:border-red-500/40 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors" type="button" @click="skin.removeWallpaper()"><svg class="w-3.5 h-3.5 inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> 移除背景</button>
      </div>
      <p class="text-[11px] text-zinc-400 dark:text-zinc-500 leading-relaxed">上传新图自动覆盖旧图，仅保留最新一张；背景图上会自动叠加蒙层以保证正文可读。</p>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import BaseModal from '@/components/common/BaseModal.vue'
import { useSkinStore } from '@/stores/skin'
import { useThemeStore } from '@/stores/theme'
import { bgImageStyle, vignetteStyle, maskStyle } from '@/utils/skinStyle'

const emit = defineEmits<{ (e: 'close'): void }>()
const skin = useSkinStore()
const theme = useThemeStore()

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

const img = computed(() => bgImageStyle(skin.wallpaperUrl))
const vignette = computed(() => vignetteStyle())
const mask = computed(() => maskStyle(skin.maskPercent, theme.isDark))

function setDark(v: boolean) {
  if (theme.isDark !== v) theme.toggle()
}
</script>
