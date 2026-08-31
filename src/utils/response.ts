// 统一 API 响应解构
// 兼容三种形态：
//   - 单层：{ data: 业务数据 }
//   - 真实 ApiResponse<T>：{ success, code, message, data }（axios 拦截器返回 body，业务数据在 res.data）
//   - 双层：{ data: { data: 业务 } }
// 用法：const payload = unwrap(res) ?? res
// 返回 any：解构结果以宽松类型使用，避免笼统的 unknown 属性访问报错。
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function unwrap<T = any>(res: T | null | undefined) {
  if (res == null) return res
  const obj = res as Record<string, any>
  if (obj.data && typeof obj.data === 'object' && 'data' in obj.data) {
    return obj.data.data as any
  }
  if (obj.data !== undefined) return obj.data
  return res
}
