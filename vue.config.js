module.exports = {
  transpileDependencies: [],
  lintOnSave: false,
  // 修复 Tailwind v4（@tailwindcss/postcss）在 vue-cli 5（webpack 5 + postcss-loader 6）下不生效的问题：
  // postcss-loader 的 cosmiconfig 查找流程在 webpack 内部未能命中 postcss.config.js，
  // 导致 input.css 原样透传（无任何工具类输出）。这里通过 vue-cli 官方 loaderOptions 通道
  // 显式注入插件并禁用文件配置发现，确保所有 CSS（input.css 与 .vue <style>）都经过 Tailwind 处理。
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
  configureWebpack: {
    resolve: {
      extensions: ['.js', '.ts', '.tsx', '.mjs', '.vue', '.json']
    }
  },
  chainWebpack: config => {
    // 构建仅做转译（ts-loader transpileOnly），不做类型检查：
    // 类型检查统一交给 tsc / vue-tsc 单独执行，避免既有类型债务阻塞构建。
    config.module.rule('ts').use('ts-loader').tap(opts => ({ ...(opts || {}), transpileOnly: true }))
    config.module.rule('tsx').use('ts-loader').tap(opts => ({ ...(opts || {}), transpileOnly: true }))
    if (config.plugins.has('fork-ts-checker')) {
      config.plugins.delete('fork-ts-checker')
    }
  },
  devServer: {
    historyApiFallback: true,
    proxy: {
      // YARP 网关实测监听 5000（Aspire 编排），仅 http（appsettings.json Urls: http://0.0.0.0:5000，无 HTTPS）；
      // 9091 是 dcp proxy 端口不可用（ECONNRESET）
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        ws: true,
        pathRewrite: { '^/api': '/api' }
      },
      // 文件访问通道（/files/{userId}/{guid}.ext —— FileDev 下载端点，经网关转发）
      '/files': {
        target: 'http://localhost:5000',
        changeOrigin: true
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
  }
}
