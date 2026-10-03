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

// 时间戳归一为毫秒：后端 ISO 字符串与本地乐观消息的 Date.now() 数字都兼容。
// 聊天消息排序、分组、日期分隔共用（原先 store 内另有一份等价的 messageTime）。
export function toMillis(input: DateInput | null | undefined): number {
  if (input == null) return 0;
  if (typeof input === 'number') return input;
  if (input instanceof Date) return input.getTime();
  const ts = Date.parse(input);
  return Number.isNaN(ts) ? 0 : ts;
}

// 是否同一天（按本地日历日比较）
export function isSameDay(a: DateInput, b: DateInput): boolean {
  const da = new Date(a);
  const db = new Date(b);
  if (Number.isNaN(da.getTime()) || Number.isNaN(db.getTime())) return false;
  return da.toDateString() === db.toDateString();
}

// 短时钟：当天 -> 14:30；跨天 -> 10/03 14:30
// 会话列表与消息气泡共用（原在 ChatSidebar / ChatConversation 各写一份完全相同的实现）
export function clockTime(input: DateInput | null | undefined): string {
  if (!input) return '';
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return '';
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return isSameDay(d, new Date()) ? `${hh}:${mm}` : `${d.getMonth() + 1}/${d.getDate()} ${hh}:${mm}`;
}

// 聊天日期分隔标：今天 / 昨天 / 10月3日（跨年补年份）
export function chatDayLabel(input: DateInput | null | undefined): string {
  if (!input) return '';
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return '';
  const now = new Date();
  if (isSameDay(d, now)) return '今天';
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameDay(d, yesterday)) return '昨天';
  // 用 Intl 而非手工拼接，避免写死日期格式
  return d.getFullYear() === now.getFullYear()
    ? new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric' }).format(d)
    : new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }).format(d);
}

// 数字缩写：1234 -> 1.2k；12345 -> 1.2万
export function compactNumber(n: number | string | null | undefined): string {
  const v = Number(n) || 0;
  if (v >= 100_000_000) return `${(v / 100_000_000).toFixed(1).replace(/\.0$/, '')}亿`;
  if (v >= 10_000) return `${(v / 10_000).toFixed(1).replace(/\.0$/, '')}万`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1).replace(/\.0$/, '')}k`;
  return String(v);
}

// 文件体积：1536 -> 1.5 KB
export function formatSize(bytes: number | null | undefined): string {
  const b = Number(bytes) || 0;
  if (b <= 0) return '0 B';
  if (b < 1024) return b + ' B';
  if (b < 1024 * 1024) return (b / 1024).toFixed(1) + ' KB';
  return (b / 1024 / 1024).toFixed(1) + ' MB';
}
