// ============================================================
// 通用头像工具（首字 SVG data URI）
// 统一各组件重复的 demoAvatar / themeAvatar / fallback 实现。
// SVG 为矢量，显示尺寸由 img 的 CSS 类控制。
// ============================================================

/**
 * 首字头像（纯色底，可指定颜色）
 * @param {string} char 首字符
 * @param {string} bg 背景色（默认琥珀 #f59e0b）
 */
export function charAvatar(char: string, bg: string = '#f59e0b'): string {
  return (
    'data:image/svg+xml,' +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="${bg}"/><text x="50" y="62" font-size="40" text-anchor="middle" fill="#fff" font-family="sans-serif">${char}</text></svg>`
    )
  );
}

/**
 * 主题渐变首字头像（amber→orange，rx=5，与全局 rounded-[5%]、琥珀主题一致）
 * @param {string} char 首字符
 */
export function themeAvatar(char: string): string {
  return (
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fbbf24"/><stop offset="1" stop-color="#f97316"/></linearGradient></defs><rect width="100" height="100" rx="5" fill="url(#g)"/><text x="50" y="62" font-size="40" text-anchor="middle" fill="#fff" font-family="sans-serif">${char}</text></svg>`
    )
  );
}

/**
 * 群组默认头像（帐篷意象，无文字）
 */
export function groupAvatar(): string {
  return (
    'data:image/svg+xml,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="#d6d3d1"/><path d="M30 32h40v26H47l-11 11v-11h-6z" fill="#fff"/></svg>'
    )
  );
}

/**
 * 群聊图标（人群意象）：群会话／群头像缺省与加载失败时的语义兜底
 * 与单聊「首字/对方头像」区分，避免群聊错用某个成员头像或空白破图
 */
export function groupIconAvatar(): string {
  return (
    'data:image/svg+xml,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="#e4e4e7"/><g fill="none" stroke="#71717a" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"><circle cx="37" cy="40" r="11"/><path d="M18 74v-6a16 16 0 0 1 16-16h6a16 16 0 0 1 16 16v6"/><circle cx="71" cy="44" r="8"/><path d="M62 74v-5a12 12 0 0 1 12-12h1a12 12 0 0 1 12 12v5"/></g></svg>'
    )
  );
}
