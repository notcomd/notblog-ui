// ============================================================
// Cypress E2E 测试配置
// - baseUrl 指向本地 YARP 网关（端口 5000）
// - supportFile 关闭（未使用自定义 support）
// ============================================================
import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5000',
    supportFile: false
  }
})