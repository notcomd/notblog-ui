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
  parserOptions: {
    parser: '@babel/eslint-parser',
    requireConfigFile: false
  },
  globals: {
    defineProps: 'readonly',
    defineEmits: 'readonly',
    defineExpose: 'readonly',
    withDefaults: 'readonly'
  },
  rules: {
    // 后端缺口函数保留空响应但参数未使用（_ 前缀参数）
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
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