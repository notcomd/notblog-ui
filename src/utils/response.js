// 统一 API 响应解构
// 兼容三种形态：
//   - mock 一层：{ data: 业务数据 }
//   - 真实 ApiResponse<T>：{ success, code, message, data }（axios 拦截器返回 body，业务数据在 res.data）
//   - 旧式双层（历史 mock）：{ data: { data: 业务 } }
// 用法：const payload = unwrap(res) ?? res
export function unwrap(res) {
  if (res == null) return res
  if (res.data && typeof res.data === 'object' && 'data' in res.data) return res.data.data
  if (res.data !== undefined) return res.data
  return res
}
