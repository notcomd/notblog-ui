// 内容审核状态归一化（三种后端枚举 → 统一前端模型）
//
// 各服务状态枚举互不相同，统一映射为：
//   Message 推文（图文 / 视频）：Draft | Pending | Approved | Rejected
//   Markdown 文档：MarkDraft | MarkPendingReview | MarkApproved | MarkRejected
//   Video 服务：Draft | Pending | Approved | Rejected（与 Message 同名）
// 驳回原因字段亦不同：Message = auditReason，Markdown / Video = rejectReason

export type ContentStatus = 'draft' | 'pending' | 'approved' | 'rejected'

const RAW_TO_STATUS: Record<string, ContentStatus> = {
  draft: 'draft',
  markdraft: 'draft',
  pending: 'pending',
  markpendingreview: 'pending',
  approved: 'approved',
  markapproved: 'approved',
  rejected: 'rejected',
  markrejected: 'rejected'
}

const MESSAGE_STATUS: Record<ContentStatus, string> = {
  draft: 'Draft',
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected'
}

const MARKDOWN_STATUS: Record<ContentStatus, string> = {
  draft: 'MarkDraft',
  pending: 'MarkPendingReview',
  approved: 'MarkApproved',
  rejected: 'MarkRejected'
}

/** 把后端原始状态串归一化为前端模型；无法识别时返回空串 */
export function normalizeStatus(raw?: string | null): ContentStatus | '' {
  if (!raw) return ''
  return RAW_TO_STATUS[String(raw).toLowerCase()] || ''
}

/** 中文文案：草稿 / 审核中 / 已发布 / 已驳回 */
export const STATUS_LABELS: Record<ContentStatus, string> = {
  draft: '草稿',
  pending: '审核中',
  approved: '已发布',
  rejected: '已驳回'
}

export function statusLabel(raw?: string | null): string {
  const s = normalizeStatus(raw)
  return s ? STATUS_LABELS[s] : raw || ''
}

/** 状态标签样式（无框设计：半透明染底 + 圆角） */
export function statusClass(raw?: string | null): string {
  const map: Record<ContentStatus, string> = {
    draft: 'bg-zinc-400/15 text-zinc-500 dark:text-zinc-400',
    pending: 'bg-amber-400/15 text-amber-600 dark:text-amber-400',
    approved: 'bg-emerald-400/15 text-emerald-500',
    rejected: 'bg-red-400/15 text-red-500'
  }
  const s = normalizeStatus(raw)
  return (s && map[s]) || 'bg-zinc-400/15 text-zinc-500 dark:text-zinc-400'
}

/** 是否可编辑（仅草稿 / 被驳回可改；服务端已强制） */
export function canEdit(raw?: string | null): boolean {
  const s = normalizeStatus(raw)
  return s === 'draft' || s === 'rejected'
}

/** 是否不可编辑（审核中 / 已发布） */
export function isLocked(raw?: string | null): boolean {
  const s = normalizeStatus(raw)
  return s === 'pending' || s === 'approved'
}

/** 不可编辑的原因文案（用于 toast / 提示） */
export function lockedReason(raw?: string | null): string {
  const s = normalizeStatus(raw)
  if (s === 'pending') return '审核中的内容不可修改，请等待审核结果'
  if (s === 'approved') return '已发布的内容不可修改'
  return '当前内容不可修改'
}

/** 驳回原因（兼容 Message 的 auditReason 与 Markdown / Video 的 rejectReason） */
export function rejectReasonOf(item: unknown): string {
  if (!item || typeof item !== 'object') return ''
  const o = item as Record<string, unknown>
  return String(o.rejectReason || o.auditReason || '')
}

/** 归一化状态 → Message / Video 服务的查询状态串（省略映射时返回 undefined） */
export function toMessageStatus(s?: ContentStatus | ''): string | undefined {
  return s ? MESSAGE_STATUS[s] : undefined
}

/** 归一化状态 → Markdown 服务的查询状态串 */
export function toMarkdownStatus(s?: ContentStatus | ''): string | undefined {
  return s ? MARKDOWN_STATUS[s] : undefined
}

/** 状态筛选选项（工作台使用） */
export const STATUS_FILTERS: { key: ContentStatus | ''; label: string }[] = [
  { key: '', label: '全部' },
  { key: 'draft', label: '草稿' },
  { key: 'pending', label: '审核中' },
  { key: 'approved', label: '已发布' },
  { key: 'rejected', label: '已驳回' }
]
