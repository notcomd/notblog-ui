module.exports = {
  transpileDependencies: [],
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
