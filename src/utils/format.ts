type DateInput = number | string | Date;

function toTime(input: DateInput): number | null {
  const d = new Date(input);
  const t = d.getTime();
  return Number.isNaN(t) ? null : t;
}

// 相对时间：刚刚 / x分钟前 / x小时前 / 昨天 / x天前 / 日期
export function relativeTime(input: DateInput | null | undefined): string {
  if (!input) return '';
  const t = toTime(input);
  if (t == null) return '';
  const diff = Date.now() - t;
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diff < minute) return '刚刚';
  if (diff < hour) return `${Math.floor(diff / minute)}分钟前`;
  if (diff < day) return `${Math.floor(diff / hour)}小时前`;
  if (diff < 2 * day) return '昨天';
  if (diff < 30 * day) return `${Math.floor(diff / day)}天前`;
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// 格式化日期时间：YYYY-MM-DD HH:mm
export function formatTime(input: DateInput | null | undefined): string {
  if (!input) return '';
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// 数字缩写：1234 -> 1.2k；12345 -> 1.2万
export function compactNumber(n: number | string | null | undefined): string {
  const v = Number(n) || 0;
  if (v >= 100_000_000) return `${(v / 100_000_000).toFixed(1).replace(/\.0$/, '')}亿`;
  if (v >= 10_000) return `${(v / 10_000).toFixed(1).replace(/\.0$/, '')}万`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1).replace(/\.0$/, '')}k`;
  return String(v);
}
