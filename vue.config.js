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
      // SignalR 实时通道（MessageHub + CallHub 语音/视频通话信令）
      '/MessageHub': {
        target: 'https://localhost:5000',
        changeOrigin: true,
        ws: true
      },
      '/CallHub': {
        target: 'https://localhost:5000',
        changeOrigin: true,
        ws: true
      }
    }
  }
}
