// 统一 API 响应解构
// axios 拦截器已把 response.data 原地替换为 responseData（业务数据本体），
// 此处仅兼容两种调用形态：
//   - 入参为 AxiosResponse（含 data 字段）→ 取出 data
//   - 入参已是业务数据 → 原样返回
// 用法：const payload = unwrap(res) ?? res
// 返回 any：解构结果以宽松类型使用，避免笼统的 unknown 属性访问报错。
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function unwrap<T = any>(res: T | null | undefined): any {
  if (res == null) return res
  const data = (res as { data?: unknown }).data
  // 注意：业务数据为 null（如无数据响应）时返回 null，不回退整个 response
  return data === undefined ? res : data
}
