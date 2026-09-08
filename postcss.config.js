// ============================================================
// PostCSS 配置（Vite 原生读取）
// - Tailwind v4：@tailwindcss/postcss 处理 src/input.css 与 .vue <style>
// - autoprefixer 兼容保留（Tailwind v4 lightningcss 已覆盖大部分场景）
// - 仅供 Vite dev/build 使用；Jest 单测不经过 PostCSS，无需关心本文件
// ============================================================
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {}
  }
}
