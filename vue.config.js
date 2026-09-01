module.exports = {
  transpileDependencies: [],
  // 修复 Tailwind v4（@tailwindcss/postcss）在 vue-cli 5（webpack 5 + postcss-loader 6）下不生效的问题：
  // postcss-loader 的配置文件发现流程在 webpack 内部未能命中 postcss.config.js，
  // 导致 input.css 原样透传（无任何工具类输出），页面样式错乱。
  // 通过 vue-cli 官方 loaderOptions 通道显式注入插件并禁用文件配置发现，
  // 确保所有 CSS（input.css 与 .vue <style>）都经过 Tailwind 处理。
  css: {
    loaderOptions: {
      postcss: {
        postcssOptions: {
          config: false,
          plugins: [require('@tailwindcss/postcss')(), require('autoprefixer')()]
        }
      }
    }
  },
  devServer: {
    historyApiFallback: true,
    proxy: {
      // YARP 网关实测监听 5000（Aspire 编排）；9091 是 dcp proxy 端口不可用（ECONNRESET）
      '/api': {
        target: 'https://localhost:5000',
        changeOrigin: true,
        ws: true,
        pathRewrite: { '^/api': '/api' }
      },
      // 文件访问通道（/files/{userId}/{guid}.ext —— FileDev 下载端点，经网关转发）
      '/files': {
        target: 'https://localhost:5000',
        changeOrigin: true
      },
      // SignalR 实时通道（MessageHub）
      '/MessageHub': {
        target: 'https://localhost:5000',
        changeOrigin: true,
        ws: true
      }
    }
  }
}
