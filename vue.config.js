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
      // SignalR 实时通道（MessageHub）
      '/MessageHub': {
        target: 'https://localhost:5000',
        changeOrigin: true,
        ws: true
      }
    }
  }
}
