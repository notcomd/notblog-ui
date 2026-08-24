// 官方预设壁纸（一期）：本地 SVG 生成，离线可用、零网络请求、data-URI 缓存友好。
// 分类：fresh 清新 / deep 深邃 / warm 暖阳 / minimal 极简；二期可替换为 WebP 真图资源。

interface Wallpaper {
  id: string;
  name: string;
  cat: string;
  svg: string;
}

const svg = (body: string): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">${body}</svg>`;
const grad = (id: string, stops: [string, string][]): string =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">${stops.map((s) => `<stop offset="${s[0]}" stop-color="${s[1]}"/>`).join('')}</linearGradient>`;
const blurFilter = (id: string, std: number): string =>
  `<filter id="${id}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${std}"/></filter>`;
const stars = (pts: [number, number, number][], r: number = 3): string =>
  pts
    .map(([x, y, o]) => `<circle cx="${x}" cy="${y}" r="${r * o}" fill="#ffffff" opacity="${o}"/>`)
    .join('');

export const WALLPAPERS: Wallpaper[] = [
  // ── 清新 ─────────────────────────────
  {
    id: 'fresh-1',
    name: '晨雾青岚',
    cat: 'fresh',
    svg: svg(
      `<defs>${grad('g', [
        ['0', '#eafaf3'],
        ['0.5', '#d8f3ef'],
        ['1', '#c3e8ee']
      ])}${blurFilter('b', 50)}</defs><rect width="1600" height="900" fill="url(#g)"/><ellipse cx="420" cy="260" rx="340" ry="120" fill="#ffffff" opacity="0.55" filter="url(#b)"/><ellipse cx="1180" cy="360" rx="420" ry="150" fill="#ffffff" opacity="0.45" filter="url(#b)"/><ellipse cx="820" cy="700" rx="480" ry="130" fill="#ffffff" opacity="0.35" filter="url(#b)"/>`
    )
  },
  {
    id: 'fresh-2',
    name: '薄荷气泡',
    cat: 'fresh',
    svg: svg(
      `<defs>${grad('g', [
        ['0', '#e7fbf4'],
        ['1', '#a8e6cf']
      ])}${blurFilter('b', 60)}</defs><rect width="1600" height="900" fill="url(#g)"/><circle cx="300" cy="240" r="180" fill="#ffffff" opacity="0.35" filter="url(#b)"/><circle cx="1250" cy="620" r="230" fill="#7fd4b0" opacity="0.3" filter="url(#b)"/><circle cx="500" cy="680" r="90" fill="none" stroke="#ffffff" stroke-width="3" opacity="0.55"/><circle cx="1150" cy="240" r="56" fill="none" stroke="#ffffff" stroke-width="3" opacity="0.5"/><circle cx="1350" cy="150" r="26" fill="#ffffff" opacity="0.6"/>`
    )
  },
  {
    id: 'fresh-3',
    name: '晴空微光',
    cat: 'fresh',
    svg: svg(
      `<defs>${grad('g', [
        ['0', '#f0f7ff'],
        ['1', '#c3e2ff']
      ])}<radialGradient id="s" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#ffffff" stop-opacity="0.9"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></radialGradient>${blurFilter('b', 40)}</defs><rect width="1600" height="900" fill="url(#g)"/><circle cx="1300" cy="230" r="330" fill="url(#s)"/><ellipse cx="600" cy="180" rx="300" ry="60" fill="#ffffff" opacity="0.5" filter="url(#b)"/><ellipse cx="950" cy="250" rx="260" ry="50" fill="#ffffff" opacity="0.4" filter="url(#b)"/><ellipse cx="300" cy="760" rx="420" ry="70" fill="#ffffff" opacity="0.35" filter="url(#b)"/>`
    )
  },
  // ── 深邃 ─────────────────────────────
  {
    id: 'deep-1',
    name: '星夜藏青',
    cat: 'deep',
    svg: svg(
      `<defs>${grad('g', [
        ['0', '#0d1636'],
        ['1', '#1d2a5e']
      ])}${blurFilter('b', 40)}</defs><rect width="1600" height="900" fill="url(#g)"/>${stars([
        [200, 150, 0.8],
        [420, 90, 0.5],
        [700, 180, 0.9],
        [980, 80, 0.6],
        [1240, 140, 0.8],
        [1480, 220, 0.5],
        [320, 420, 0.6],
        [620, 520, 0.7],
        [900, 430, 0.5],
        [1180, 560, 0.6],
        [1420, 460, 0.7],
        [150, 640, 0.5],
        [560, 760, 0.6],
        [1050, 780, 0.5],
        [1380, 700, 0.6]
      ])}<circle cx="1340" cy="180" r="70" fill="#f7f2d8" opacity="0.9"/><circle cx="1312" cy="156" r="62" fill="#1d2a5e"/><circle cx="160" cy="500" r="160" fill="#2c3d78" opacity="0.25" filter="url(#b)"/>`
    )
  },
  {
    id: 'deep-2',
    name: '极光之海',
    cat: 'deep',
    svg: svg(
      `<defs>${grad('g', [
        ['0', '#07242e'],
        ['1', '#140d38']
      ])}${blurFilter('b', 80)}</defs><rect width="1600" height="900" fill="url(#g)"/>${stars([
        [300, 150, 0.7],
        [680, 90, 0.5],
        [1050, 160, 0.6],
        [1420, 110, 0.5],
        [500, 420, 0.4],
        [1250, 480, 0.5],
        [880, 640, 0.4],
        [170, 760, 0.5]
      ])}<ellipse cx="800" cy="430" rx="760" ry="200" fill="#38e8c8" opacity="0.16" filter="url(#b)"/><ellipse cx="620" cy="480" rx="700" ry="170" fill="#6c5ce7" opacity="0.2" filter="url(#b)" transform="rotate(-14 620 480)"/><ellipse cx="1050" cy="520" rx="560" ry="140" fill="#ff9ff3" opacity="0.1" filter="url(#b)" transform="rotate(10 1050 520)"/>`
    )
  },
  {
    id: 'deep-3',
    name: '暮色深蓝',
    cat: 'deep',
    svg: svg(
      `<defs>${grad('g', [
        ['0', '#101c3c'],
        ['1', '#28336b']
      ])}</defs><rect width="1600" height="900" fill="url(#g)"/><path d="M0 620 L260 430 L480 610 L720 380 L980 640 L1240 420 L1600 620 L1600 900 L0 900 Z" fill="#0b1230" opacity="0.9"/><path d="M0 720 L340 540 L640 700 L900 500 L1260 720 L1600 560 L1600 900 L0 900 Z" fill="#1a2450" opacity="0.85"/><circle cx="1250" cy="200" r="54" fill="#f7f2d8" opacity="0.85"/><circle cx="1225" cy="182" r="46" fill="#28336b"/>`
    )
  },
  // ── 暖阳 ─────────────────────────────
  {
    id: 'warm-1',
    name: '落日暖橘',
    cat: 'warm',
    svg: svg(
      `<defs>${grad('g', [
        ['0', '#ffc98a'],
        ['1', '#ff8a5c']
      ])}${blurFilter('b', 30)}</defs><rect width="1600" height="900" fill="url(#g)"/><circle cx="800" cy="500" r="220" fill="#fff3d6" opacity="0.9"/><rect y="560" width="1600" height="30" fill="#ffffff" opacity="0.16"/><rect y="612" width="1600" height="22" fill="#ffffff" opacity="0.12"/><rect y="654" width="1600" height="16" fill="#ffffff" opacity="0.09"/><ellipse cx="300" cy="300" rx="300" ry="110" fill="#ffd9a8" opacity="0.35" filter="url(#b)"/>`
    )
  },
  {
    id: 'warm-2',
    name: '蜜糖黄昏',
    cat: 'warm',
    svg: svg(
      `<defs>${grad('g', [
        ['0', '#ffe0a8'],
        ['1', '#ff9e76']
      ])}<radialGradient id="s" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#fff7e0" stop-opacity="0.95"/><stop offset="1" stop-color="#fff7e0" stop-opacity="0"/></radialGradient>${blurFilter('b', 50)}</defs><rect width="1600" height="900" fill="url(#g)"/><circle cx="1250" cy="300" r="360" fill="url(#s)"/><ellipse cx="420" cy="620" rx="420" ry="130" fill="#ffffff" opacity="0.22" filter="url(#b)"/><ellipse cx="1150" cy="700" rx="380" ry="110" fill="#ffffff" opacity="0.16" filter="url(#b)"/>`
    )
  },
  {
    id: 'warm-3',
    name: '沙漠暖阳',
    cat: 'warm',
    svg: svg(
      `<defs>${grad('g', [
        ['0', '#f7cf8e'],
        ['1', '#e8a15c']
      ])}</defs><rect width="1600" height="900" fill="url(#g)"/><circle cx="800" cy="330" r="150" fill="#fff3d6" opacity="0.85"/><path d="M0 520 Q400 380 800 520 T1600 520 L1600 900 L0 900 Z" fill="#d98e4a" opacity="0.55"/><path d="M0 640 Q500 500 1050 660 T1600 620 L1600 900 L0 900 Z" fill="#c97f3d" opacity="0.6"/>`
    )
  },
  // ── 极简 ─────────────────────────────
  {
    id: 'minimal-1',
    name: '奶白之境',
    cat: 'minimal',
    svg: svg(
      `<defs>${grad('g', [
        ['0', '#fdfbf5'],
        ['1', '#f1ece1']
      ])}</defs><rect width="1600" height="900" fill="url(#g)"/><circle cx="800" cy="450" r="180" fill="none" stroke="#d8cfbe" stroke-width="2" opacity="0.6"/><circle cx="800" cy="450" r="5" fill="#d8cfbe" opacity="0.7"/><circle cx="520" cy="240" r="3" fill="#d8cfbe" opacity="0.5"/>`
    )
  },
  {
    id: 'minimal-2',
    name: '雾灰极简',
    cat: 'minimal',
    svg: svg(
      `<defs>${grad('g', [
        ['0', '#f4f4f2'],
        ['1', '#e3e3e1']
      ])}</defs><rect width="1600" height="900" fill="url(#g)"/><line x1="0" y1="720" x2="1600" y2="680" stroke="#cfcfca" stroke-width="2" opacity="0.8"/><line x1="120" y1="0" x2="420" y2="900" stroke="#d9d9d4" stroke-width="2" opacity="0.7"/>`
    )
  },
  {
    id: 'minimal-3',
    name: '燕麦柔光',
    cat: 'minimal',
    svg: svg(
      `<defs>${grad('g', [
        ['0', '#f8f2e6'],
        ['1', '#efe4d0']
      ])}${blurFilter('b', 90)}</defs><rect width="1600" height="900" fill="url(#g)"/><ellipse cx="600" cy="380" rx="420" ry="260" fill="#e6d6b8" opacity="0.5" filter="url(#b)"/><ellipse cx="1150" cy="620" rx="380" ry="220" fill="#fdf8ee" opacity="0.6" filter="url(#b)"/>`
    )
  }
];

export const WALLPAPER_CATS: { key: string; label: string }[] = [
  { key: 'fresh', label: '清新' },
  { key: 'deep', label: '深邃' },
  { key: 'warm', label: '暖阳' },
  { key: 'minimal', label: '极简' }
];

export function wallpaperById(id: string): Wallpaper | null {
  return WALLPAPERS.find((w) => w.id === id) || null;
}

// SVG → data URI（runtime 编码，避免 source 里的引号转义问题）
export function wallpaperDataUri(w: Wallpaper): string {
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(w.svg);
}
