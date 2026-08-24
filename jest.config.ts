// ============================================================
// Jest 单元测试配置
// - 将 JS/TS 测试统一交由 babel-jest 转译，使用 @vue/vue3-jest 处理 .vue
// - 提供 @ 路径别名映射（对应 tsconfig 的 baseUrl）
// ============================================================
import type { Config } from '@jest/types'

const config: Config.InitialOptions = {
  testEnvironment: 'jsdom',
  transform: { '^.+\\.(js|ts)$': 'babel-jest', '^.+\\.vue$': '@vue/vue3-jest' },
  moduleFileExtensions: ['ts', 'js', 'json', 'vue'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' }
}

export default config