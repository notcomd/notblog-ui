// 背景图系统样式工具：BackgroundLayer 与 SkinPanel 预览窗共用，保证所见即所得。
// 深色皮肤蒙层偏向深色吸光；浅色皮肤叠加柔光（白 + 黑微压）。
import type { CSSProperties } from 'vue'

export function bgImageStyle(url: string, blur: number): CSSProperties {
  if (!url) return {};
  return {
    backgroundImage: `url("${url}")`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    filter: `blur(${blur}px)`
  };
}

// 渐变压暗层：四周/底部向中心渐变，保证白色文字在任意背景下清晰（自动叠加，不可关闭）
export function vignetteStyle(): CSSProperties {
  return {
    backgroundImage: 'radial-gradient(120% 120% at 50% 38%, transparent 42%, rgba(0,0,0,0.42) 100%)'
  };
}

export function maskStyle(maskPercent: number, isDark: boolean): CSSProperties {
  return {
    backgroundColor: `rgba(0,0,0,${maskPercent / 100})`,
    backgroundImage: isDark
      ? 'none'
      : 'linear-gradient(rgba(255,255,255,0.10), rgba(255,255,255,0.04))'
  };
}
