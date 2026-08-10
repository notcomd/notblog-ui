import { unwrap } from '@/utils/response'

describe('unwrap response helper', () => {
  test('mock 一层包装 { data: 业务 }', () => {
    const res = { data: { fileId: 'f1', fileUri: 'http://x/1.jpg' } }
    expect(unwrap(res)).toEqual({ fileId: 'f1', fileUri: 'http://x/1.jpg' })
  })

  test('真实 ApiResponse { success, code, message, data }', () => {
    const res = { success: true, code: 200, message: 'ok', data: { tweetGuid: 't1' } }
    expect(unwrap(res)).toEqual({ tweetGuid: 't1' })
  })

  test('业务数据本身是字符串（mock 发布返回 id）', () => {
    expect(unwrap({ data: 'mock-new-tweet' })).toBe('mock-new-tweet')
  })

  test('旧式双层包装兼容', () => {
    const res = { data: { data: { fileId: 'f2' }, code: 200 } }
    expect(unwrap(res)).toEqual({ fileId: 'f2' })
  })

  test('null / undefined 原样返回', () => {
    expect(unwrap(null)).toBe(null)
    expect(unwrap(undefined)).toBe(undefined)
  })
})
