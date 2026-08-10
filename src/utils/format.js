// 相对时间：刚刚 / x分钟前 / x小时前 / 昨天 / x天前 / 日期
export function relativeTime(input) {
  if (!input) return ''
  const t = typeof input === 'number' || typeof input === 'string'
    ? new Date(input).getTime()
    : input instanceof Date ? input.getTime() : Date.parse(input)
  if (Number.isNaN(t)) return ''
  const diff = Date.now() - t
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour
  if (diff < minute) return '刚刚'
  if (diff < hour) return Math.floor(diff / minute) + '分钟前'
  if (diff < day) return Math.floor(diff / hour) + '小时前'
  if (diff < 2 * day) return '昨天'
  if (diff < 30 * day) return Math.floor(diff / day) + '天前'
  const d = new Date(t)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// 数字缩写：1234 -> 1.2k；12345 -> 1.2万
export function compactNumber(n) {
  const v = Number(n) || 0
  if (v >= 100000000) return (v / 100000000).toFixed(1).replace(/\.0$/, '') + '亿'
  if (v >= 10000) return (v / 10000).toFixed(1).replace(/\.0$/, '') + '万'
  if (v >= 1000) return (v / 1000).toFixed(1).replace(/\.0$/, '') + 'k'
  return String(v)
}
