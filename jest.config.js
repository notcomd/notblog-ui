// ============================================================
// Jest 单元测试配置
// - 将 JS 测试也纳入 babel-jest 转译，并使用 @vue/vue3-jest 处理 .vue
// - 提供 @ 路径别名映射（对应 tsconfig 的 baseUrl）
// ============================================================
module.exports = {
  testEnvironment: 'jsdom',
  transform: { '^.+\\.(js|ts)$': 'babel-jest', '^.+\\.vue$': '@vue/vue3-jest' },
  moduleFileExtensions: ['ts', 'js', 'json', 'vue'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' }
}