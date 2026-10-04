import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import { useThemeStore } from '@/stores/theme';
import { useToastStore } from '@/stores/toast';
import { uploadBackground } from '@/api/background';
import { validateImageFile, compressImage, blobToDataUri } from '@/utils/image';

const SKIN_KEY = 'qingmang_skin';
const LOAD_TIMEOUT = 3000;

// 自动蒙层：背景图之上压一层暗色 + 渐晕，保证正文在任何图上都可读（已取消手动滑块）
const MASK_LIGHT = 26;
const MASK_DARK = 38;

interface PersistedSkin {
  customUrl: string | null;
}

function loadPersisted(): PersistedSkin {
  try {
    const raw = JSON.parse(localStorage.getItem(SKIN_KEY) || '{}') as { customUrl?: unknown };
    return { customUrl: typeof raw.customUrl === 'string' && raw.customUrl ? raw.customUrl : null };
  } catch (e) {
    return { customUrl: null };
  }
}

/**
 * 皮肤：只保留「上传自定义背景图」（+ 跟随主题的自动蒙层）。
 * 已移除官方预设壁纸库、虚化与蒙层滑块 —— 单一背景来源，逻辑最简。
 */
export const useSkinStore = defineStore('skin', () => {
  const theme = useThemeStore();
  const toast = useToastStore();
  const saved = loadPersisted();

  // 自定义背景图 URL（后端 fileUri 或本地 dataURI 兜底，仅本机可见）；有值即应用
  const customUrl = ref<string | null>(saved.customUrl);

  const hasWallpaper = computed<boolean>(() => !!customUrl.value);
  const wallpaperUrl = computed<string>(() => customUrl.value || '');
  const maskPercent = computed<number>(() => (theme.isDark ? MASK_DARK : MASK_LIGHT));

  function persist(): void {
    localStorage.setItem(SKIN_KEY, JSON.stringify({ customUrl: customUrl.value }));
  }

  function preloadUrl(url: string): Promise<boolean> {
    return new Promise((resolve) => {
      if (!url) return resolve(false);
      const img = new Image();
      let done = false;
      const finish = (ok: boolean) => {
        if (!done) {
          done = true;
          clearTimeout(timer);
          resolve(ok);
        }
      };
      const timer = setTimeout(() => finish(false), LOAD_TIMEOUT);
      img.onload = () => finish(true);
      img.onerror = () => finish(false);
      img.src = url;
    });
  }

  // 自定义背景：压缩 → 上传后端（失败时本地 dataURI 兜底，仅本机可见）→ 应用
  async function setCustomWallpaper(file: File): Promise<boolean> {
    const v = validateImageFile(file) as { ok: boolean; error: string };
    if (!v.ok) {
      toast.push(v.error, 'error');
      return false;
    }
    let result: { blob: Blob; width: number; height: number; quality: number };
    try {
      result = await compressImage(file);
    } catch (e) {
      toast.push('图片处理失败，请换一张图片试试', 'error');
      return false;
    }
    let url: string | null = null;
    let localOnly = false;
    try {
      const res = await uploadBackground(result.blob);
      const data = res?.data?.data ?? res?.data ?? res;
      if (data && data.fileUri) url = data.fileUri;
    } catch (e) {
      // 后端不可用 → 本地兜底
    }
    if (!url) {
      try {
        url = await blobToDataUri(result.blob);
        localOnly = true;
      } catch (e) {
        toast.push('图片保存失败，请重试', 'error');
        return false;
      }
    }
    const ok = await preloadUrl(url);
    if (!ok) {
      toast.push('背景图加载失败，请重试', 'error');
      return false;
    }
    customUrl.value = url;
    persist();
    toast.push(
      localOnly ? '已应用（本地预览，未登录或后端不可用时仅本机可见）' : '自定义背景已应用',
      'success'
    );
    return true;
  }

  function removeWallpaper(): void {
    customUrl.value = null;
    persist();
  }

  return { customUrl, hasWallpaper, wallpaperUrl, maskPercent, setCustomWallpaper, removeWallpaper };
});
