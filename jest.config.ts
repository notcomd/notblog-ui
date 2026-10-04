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
  moduleNameMapper: {
    // ⚠️ 顺序敏感：moduleNameMapper 按声明顺序取第一个命中项，
    // 故 .vue 必须排在 ^@/ 之前，否则 "@/xxx.vue" 会先被别名规则匹配走、永远轮不到本条。
    //
    // 把 .vue 一律替换为轻量替身：路由/守卫类测试只需路由表与导航结果，不渲染组件。
    // 若将来要写「真实渲染组件」的测试，请在测试文件内对该组件 jest.unmock / jest.requireActual。
    '\\.vue$': '<rootDir>/tests/vueComponentStub.js',
    '^@/(.*)$': '<rootDir>/src/$1'
  }
}

export default config