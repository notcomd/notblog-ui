module.exports = {
  testEnvironment: 'jsdom',
  transform: { '^.+\\.js$': 'babel-jest', '^.+\\.vue$': '@vue/vue3-jest' },
  moduleFileExtensions: ['js', 'json', 'vue'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' }
}