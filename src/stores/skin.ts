import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import { wallpaperById, wallpaperDataUri } from '@/assets/wallpapers';
import { useThemeStore } from '@/stores/theme';
import { useToastStore } from '@/stores/toast';
import { uploadBackground } from '@/api/background';
import { validateImageFile, compressImage, blobToDataUri } from '@/utils/image';

const SKIN_KEY = 'qingmang_skin';
export const MIN_MASK = 20;
export const MAX_MASK = 80;
const DEFAULT_BLUR = 4;
const DEFAULT_MASK = 40;
const LOAD_TIMEOUT = 3000;

interface Wallpaper {
  id: string;
  name: string;
  cat: string;
  svg: string;
}

interface WallpaperView {
  id: string;
  name: string;
  url: string;
}

interface PersistedSkin {
  wallpaperId: string | null;
  customUrl: string | null;
  customFileId: string | null;
  useCustom: boolean;
  blur: number;
  mask: number;
}

interface RawPersistedSkin {
  wallpaperId?: string | null;
  presetId?: string | null;
  customUrl?: unknown;
  customFileId?: string | null;
  useCustom?: boolean;
  blur?: unknown;
  mask?: unknown;
}

function defaults(): PersistedSkin {
  return {
    wallpaperId: null,
    customUrl: null,
    customFileId: null,
    useCustom: false,
    blur: DEFAULT_BLUR,
    mask: DEFAULT_MASK
  };
}

// v1 格式 { wallpaperId, blur, mask } → v2 兼容迁移（wallpaperId 即预设壁纸 id）
function loadPersisted(): PersistedSkin {
  try {
    const raw = JSON.parse(localStorage.getItem(SKIN_KEY) || '{}') as RawPersistedSkin;
    const d = defaults();
    const presetId = raw.wallpaperId ?? raw.presetId;
    return {
      // 持久化恢复时校验壁纸 id 仍存在（官方壁纸下线 → 自动回退纯色）
      wallpaperId: presetId && wallpaperById(presetId) ? presetId : d.wallpaperId,
      customUrl: typeof raw.customUrl === 'string' && raw.customUrl ? raw.customUrl : d.customUrl,
      customFileId: raw.customFileId || d.customFileId,
      useCustom: !!raw.useCustom,
      blur: typeof raw.blur === 'number' ? Math.min(Math.max(raw.blur, 0), 12) : d.blur,
      mask: typeof raw.mask === 'number' ? Math.min(Math.max(raw.mask, MIN_MASK), MAX_MASK) : d.mask
    };
  } catch (e) {
    return defaults();
  }
}

export const useSkinStore = defineStore('skin', () => {
  const theme = useThemeStore();
  const toast = useToastStore();
  const saved = loadPersisted();

  const wallpaperId = ref<string | null>(saved.wallpaperId); // 官方预设壁纸 id
  const customUrl = ref<string | null>(saved.customUrl); // 自定义背景图 URL（fileUri 或本地 dataURI 兜底）
  const customFileId = ref<string | null>(saved.customFileId); // 后端 FileRef.FileId（审核/删除用）
  const useCustom = ref<boolean>(saved.useCustom && !!saved.customUrl); // 当前是否应用自定义图
  const blur = ref<number>(saved.blur);
  const mask = ref<number>(saved.mask);

  // 当前激活的背景：自定义优先，否则预设
  const wallpaper = computed<WallpaperView | null>(() => {
    if (useCustom.value && customUrl.value) {
      return { id: 'custom', name: '我的壁纸', url: customUrl.value };
    }
    const w = wallpaperId.value ? (wallpaperById(wallpaperId.value) as Wallpaper | null) : null;
    return w ? { id: w.id, name: w.name, url: wallpaperDataUri(w) } : null;
  });
  const wallpaperUrl = computed<string>(() => (wallpaper.value ? wallpaper.value.url : ''));

  // 深/浅模式联动：深色 +12 压暗、浅色 -8 柔光；vignette 渐变压暗层兜底可读性
  const effectiveMask = computed<number>(() => {
    const v = mask.value + (theme.isDark ? 12 : -8);
    return Math.min(Math.max(v, 12), 85);
  });

  function persist(): void {
    localStorage.setItem(
      SKIN_KEY,
      JSON.stringify({
        wallpaperId: wallpaperId.value,
        customUrl: customUrl.value,
        customFileId: customFileId.value,
        useCustom: useCustom.value,
        blur: blur.value,
        mask: mask.value
      })
    );
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

  async function setWallpaper(id: string | null): Promise<void> {
    if (!id) {
      wallpaperId.value = null;
      persist();
      return;
    }
    const w = wallpaperById(id) as Wallpaper | null;
    if (!w) return;
    const ok = await preloadUrl(wallpaperDataUri(w));
    if (!ok) {
      toast.push('背景图加载失败，已切换纯色模式', 'info');
      wallpaperId.value = null;
      persist();
      return;
    }
    wallpaperId.value = id;
    useCustom.value = false;
    persist();
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
    let url = null;
    let fileId = null;
    let localOnly = false;
    try {
      const res = await uploadBackground(new File([result.blob], 'wallpaper.webp', { type: 'image/webp' }));
      const data = res?.data?.data ?? res?.data ?? res;
      if (data && data.fileUri) {
        url = data.fileUri;
        fileId = data.fileId || null;
      }
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
    const ok = await preloadUrl(url as string);
    if (!ok) {
      toast.push('背景图加载失败，请重试', 'error');
      return false;
    }
    customUrl.value = url as string;
    customFileId.value = fileId;
    useCustom.value = true;
    persist();
    toast.push(
      localOnly ? '已应用（本地预览，未登录或后端不可用时仅本机可见）' : '自定义背景已应用',
      'success'
    );
    return true;
  }

  function selectCustom(): void {
    if (!customUrl.value) return;
    useCustom.value = true;
    persist();
  }

  function setBlur(v: number): void {
    blur.value = Math.min(Math.max(v, 0), 12);
    persist();
  }

  function setMask(v: number): void {
    // 自动安全阈值：滑块不允许低于 MIN_MASK
    mask.value = Math.min(Math.max(v, MIN_MASK), MAX_MASK);
    persist();
  }

  function removeWallpaper(): void {
    wallpaperId.value = null;
    customUrl.value = null;
    customFileId.value = null;
    useCustom.value = false;
    persist();
  }

  return {
    wallpaperId,
    customUrl,
    customFileId,
    useCustom,
    wallpaper,
    wallpaperUrl,
    blur,
    mask,
    effectiveMask,
    setWallpaper,
    setCustomWallpaper,
    selectCustom,
    setBlur,
    setMask,
    removeWallpaper,
    MIN_MASK,
    MAX_MASK
  };
});
