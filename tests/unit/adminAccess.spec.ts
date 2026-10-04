// ============================================================
// 单元测试：后台管理访问门禁
//   1) hasAdminRole —— 纯函数：多角色 claim 拆分、大小写、子串误判
//   2) /admin 路由门禁 —— 使用真实 router 与真实守卫，仅替换 store 边界
// ============================================================
import router from '@/router'
import { TOKEN_KEY, hasAdminRole } from '@/utils/auth'

// store 边界用 mock 顶替：
// - 守卫真正依仗的是「isAdmin 为假就拦截」，把它做成可控开关即可精确验证守卫本身
// - 真实 auth store 依赖 pinia 4（ESM-only，Jest 默认不转译），引入它会牵连整条依赖链，
//   而那条链（JWT 解析 → 角色判定）已由下面的 hasAdminRole 纯函数测试单独覆盖
let mockIsAdmin = false
jest.mock('@/stores/auth', () => ({
  useAuthStore: () => ({ isAdmin: mockIsAdmin })
}))

const mockToastPush = jest.fn()
jest.mock('@/stores/toast', () => ({
  useToastStore: () => ({ push: mockToastPush })
}))

/** 导航到目标地址并返回最终落点（重复导航会 reject，不影响落点断言） */
async function go(path: string): Promise<string> {
  await router.push(path).catch(() => undefined)
  return router.currentRoute.value.path
}

beforeEach(() => {
  mockIsAdmin = false
  mockToastPush.mockClear()
  localStorage.clear()
})

describe('hasAdminRole（角色判定纯函数）', () => {
  test.each([
    ['Root', true],
    ['Administrator', true],
    ['Administrator,User', true], // 多角色以逗号拼接在同一个 claim 里
    ['root', true], // 大小写不敏感
    [' Root , Admin ', true], // 前后空白需被裁掉
    ['User', false],
    ['Guest', false],
    ['SuperAdmin', false], // 子串匹配不得误放行
    ['Adminn', false],
    ['', false],
    [null, false],
    [undefined, false]
  ] as Array<[string | null | undefined, boolean]>)('role=%p → %p', (role, expected) => {
    expect(hasAdminRole(role)).toBe(expected)
  })
})

describe('/admin 路由门禁（真实路由表 + 真实守卫）', () => {
  test('普通账号访问 /admin 被挡回首页，并给出提示', async () => {
    mockIsAdmin = false
    localStorage.setItem(TOKEN_KEY, 'any-token') // 已登录（requiresAuth 通过）

    expect(await go('/admin')).toBe('/home')
    expect(mockToastPush).toHaveBeenCalledWith('无权访问管理后台', 'warning')
  })

  test('普通账号访问子路由 /admin/users 同样被拦截', async () => {
    mockIsAdmin = false
    localStorage.setItem(TOKEN_KEY, 'any-token')

    expect(await go('/admin/users')).toBe('/home')
  })

  test('管理员账号可正常进入 /admin', async () => {
    mockIsAdmin = true
    localStorage.setItem(TOKEN_KEY, 'any-token')

    expect(await go('/admin')).toBe('/admin')
  })

  test('管理员账号可进入子路由 /admin/content', async () => {
    mockIsAdmin = true
    localStorage.setItem(TOKEN_KEY, 'any-token')

    expect(await go('/admin/content')).toBe('/admin/content')
  })

  test('未登录访问 /admin 跳登录页（requiresAuth 先生效）', async () => {
    mockIsAdmin = true // 即使角色判定为管理员，无 token 也必须先登录
    localStorage.removeItem(TOKEN_KEY)

    expect(await go('/admin')).toBe('/login')
  })
})
