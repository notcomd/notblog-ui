import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import path from 'path'

// ============================================================
// Vite 配置（自 Vue CLI 迁移）
// - @ 别名与 vue-cli 保持一致（指向 src）
// - dev 代理沿用原 vue.config.js：/api、/files、/MessageHub、/CallHub
//   统一转发 YARP 网关 http://localhost:5000（SignalR 两个 Hub 走 ws）
// - 环境变量沿用 VUE_APP_ 前缀（envPrefix），.env 文件无需改名
// - Tailwind v4 经 postcss.config.js（@tailwindcss/postcss）生效，
//   Vite 原生读取 postcss.config.js（含 .vue <style>）
// ============================================================
export default defineConfig({
  plugins: [vue(), vueJsx()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  // 环境变量前缀（默认 VITE_，沿用 VUE_APP_ 以兼容既有 .env 文件）
  envPrefix: 'VUE_APP_',
  server: {
    port: 8080,
    open: true,
    // 防浏览器启发式缓存旧版入口/模块（dev 无 contenthash，显式 no-cache）
    headers: {
      'Cache-Control': 'no-cache'
    },
    // 代理统一转发日志：每个经 devServer 转发到网关的请求打印一行，
    // 用于核对「前端请求是否全部经网关」（浏览器 Network 面板只能看到 8080 入口，
    // 实际转发目标在此日志确认）
    proxy: {
      // YARP 网关实测监听 5000（Aspire 编排），仅 http（appsettings.json Urls: http://0.0.0.0:5000，无 HTTPS）
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        ws: true,
        configure: (proxy, _options) => {
          proxy.on('proxyReq', proxyReq => {
            console.log(`[proxy→网关] ${proxyReq.method} ${proxyReq.path}`)
          })
        }
      },
      // 文件访问通道（/files/{userId}/{guid}.ext —— FileDev 下载端点，经网关转发）
      '/files': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        configure: (proxy, _options) => {
          proxy.on('proxyReq', proxyReq => {
            console.log(`[proxy→网关] ${proxyReq.method} ${proxyReq.path}`)
          })
        }
      },
      // SignalR 实时通道（MessageHub + CallHub 语音/视频通话信令）
      '/MessageHub': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        ws: true
      },
      '/CallHub': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        ws: true
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})
