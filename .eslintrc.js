module.exports = {
  root: true,
  env: {
    node: true,
    browser: true,
    jest: true
  },
  extends: [
    'plugin:vue/vue3-essential',
    'eslint:recommended'
  ],
  // Vue SFC 先经 vue-eslint-parser 解析模板，<script> 部分交由其 parser 处理 TypeScript
  parser: 'vue-eslint-parser',
  parserOptions: {
    // 修复：仅用 @babel/eslint-parser（requireConfigFile:false 不加载
    // babel.config.js 的 @babel/preset-typescript）无法解析 TS 语法（interface/泛型/as 断言）。
    // 改用 @typescript-eslint/parser 才能正确解析 <script lang="ts">。
    parser: '@typescript-eslint/parser',
    sourceType: 'module',
    extraFileExtensions: ['.vue']
  },
  plugins: [
    '@typescript-eslint'
  ],
  globals: {
    defineProps: 'readonly',
    defineEmits: 'readonly',
    defineExpose: 'readonly',
    withDefaults: 'readonly'
  },
  rules: {
    // TS 项目：未定义/未使用由 TS 编译器（vue-tsc）负责；
    // eslint 核心 no-undef/no-unused-vars 不识别 TS 类型与 DOM lib（如 RTCIceServer），会误报
    'no-undef': 'off',
    'no-unused-vars': 'off',
    // 后端缺口函数保留空响应但参数未使用（_ 前缀参数），放行 _ 前缀参数
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    // 卡片乐观更新直接修改 prop 对象属性（父级持有引用），关闭该规则
    'vue/no-mutating-props': 'off'
  },
  overrides: [
    // Cypress e2e 使用 describe/it/cy 全局，与 jest env 冲突
    {
      files: ['tests/e2e/**/*.js'],
      env: { jest: false }
    }
  ]
}