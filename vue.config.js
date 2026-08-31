module.exports = {
  transpileDependencies: [],
  lintOnSave: false,
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
    // 绑定 0.0.0.0：本地开发与容器（Aspire AddNodeApp / docker）均可经端口转发访问
    host: '0.0.0.0',
    // 网关地址：默认本机调试（YARP 网关 5000）；容器/编排场景可由 VUE_APP_GATEWAY 覆盖
    //（如 Aspire AddNodeApp 注入 host.docker.internal:5000，nginx 模板用 GATEWAY_UPSTREAM）
    proxy: {
      // YARP 网关实测监听 5000（Aspire 编排）；9091 是 dcp proxy 端口不可用（ECONNRESET）
      '/api': {
        target: process.env.VUE_APP_GATEWAY || 'https://localhost:5000',
        changeOrigin: true,
        ws: true,
        pathRewrite: { '^/api': '/api' }
      },
      // 文件访问通道（/files/{userId}/{guid}.ext —— FileDev 下载端点，经网关转发）
      '/files': {
        target: process.env.VUE_APP_GATEWAY || 'https://localhost:5000',
        changeOrigin: true
      },
      // SignalR 实时通道（MessageHub + CallHub 语音/视频通话信令）
      '/MessageHub': {
        target: process.env.VUE_APP_GATEWAY || 'https://localhost:5000',
        changeOrigin: true,
        ws: true
      },
      '/CallHub': {
        target: process.env.VUE_APP_GATEWAY || 'https://localhost:5000',
        changeOrigin: true,
        ws: true
      },
      '/CommunityHub': {
        target: process.env.VUE_APP_GATEWAY || 'https://localhost:5000',
        changeOrigin: true,
        ws: true
      }
    }
  }
}
