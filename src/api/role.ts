import service from '@/axios';

// 角色管理（Identity 服务，AdminOnly）
// 注意：Identity 未启用统一响应包装中间件，返回的是裸 JSON（非 ApiResponseResult 信封）；
// 错误消息已由 axios 响应拦截器统一提取到 e.message（403 亦转为中文引导），调用方直接 toast 即可。

/** 角色权限级别枚举名（后端 RoleAuthority，新建时可选择前三个） */
export type RoleAuthorityName = 'Root' | 'Admin' | 'User';

/** 角色状态枚举名 */
export type RoleStatusName = 'Normal' | 'Disabled';

/** 角色列表条目（GET /api/identity/role） */
export interface RoleListItem {
  roleGuid: string;
  roleName: string;
  roleCode: string;
  /** 后端枚举：字符串（Root/Admin/...）或数字序号（0..4），展示前请用 authorityText 归一 */
  roleAuthority: string | number;
  /** 后端枚举：字符串（Normal/Disabled/...）或数字序号（0..3），展示前请用 statusText 归一 */
  roleStatus: string | number;
  permissionCount: number;
}

/** 角色 / 角色组已授权权限条目（GET .../permissions） */
export interface RolePermissionItem {
  permissionId: string;
  permissionCode: string;
  permissionName: string;
  permissionType: number;
}

/** 枚举序号 → 名称（兼容后端按数字序列化枚举的情形） */
const AUTHORITY_SEQ = ['Root', 'Admin', 'User', 'Guest', 'Unknown'];
const STATUS_SEQ = ['Normal', 'Disabled', 'Deleted', 'Error'];

/** 归一化 roleAuthority：number → 枚举名，string → 原样，缺省 → Unknown */
export function authorityName(v: string | number | null | undefined): string {
  if (typeof v === 'number') return AUTHORITY_SEQ[v] ?? 'Unknown';
  if (typeof v === 'string' && v) return v;
  return 'Unknown';
}

/** 归一化 roleStatus：number → 枚举名，string → 原样，缺省 → Normal */
export function statusName(v: string | number | null | undefined): string {
  if (typeof v === 'number') return STATUS_SEQ[v] ?? 'Normal';
  if (typeof v === 'string' && v) return v;
  return 'Normal';
}

/** 权限级别中文标签 */
export function authorityText(v: string | number | null | undefined): string {
  const name = authorityName(v);
  return ({ Root: '根角色', Admin: '管理员', User: '普通用户', Guest: '游客', Unknown: '未知' } as Record<string, string>)[name] || name;
}

/** 状态中文标签 */
export function statusText(v: string | number | null | undefined): string {
  const name = statusName(v);
  return ({ Normal: '正常', Disabled: '禁用', Deleted: '已删除', Error: '异常' } as Record<string, string>)[name] || name;
}

/** 新建角色可选权限级别（默认 User） */
export const ROLE_AUTHORITY_OPTIONS: { name: RoleAuthorityName; label: string }[] = [
  { name: 'Root', label: '根角色（Root）' },
  { name: 'Admin', label: '管理员（Admin）' },
  { name: 'User', label: '普通用户（User）' }
];

/** 角色状态可选项 */
export const ROLE_STATUS_OPTIONS: { name: RoleStatusName; label: string }[] = [
  { name: 'Normal', label: '正常（Normal）' },
  { name: 'Disabled', label: '禁用（Disabled）' }
];

/** 枚举名 → 序号（后端 CreateRoleCommand/UpdateRoleCommand 的 RoleAuthority/RoleStatus 均为枚举） */
export function authorityToNumber(name: string): number {
  const i = AUTHORITY_SEQ.indexOf(name);
  return i < 0 ? 2 : i;
}

export function statusToNumber(name: string): number {
  const i = STATUS_SEQ.indexOf(name);
  return i < 0 ? 0 : i;
}

/** 新建角色请求体（roleAuthority 传枚举序号：Root=0 / Admin=1 / User=2） */
export interface CreateRoleInput {
  roleName: string;
  roleCode: string;
  roleAuthority: number;
  attribute: string | null;
}

/**
 * 更新角色请求体（字段可空；传 null = 不修改）。
 * 注意：后端 UpdateRoleCommand 无 RoleCode 字段，角色编码不可修改。
 */
export interface UpdateRoleInput {
  roleName?: string | null;
  attribute?: string | null;
  roleStatus?: number | null;
}

/** 全部未删除角色：GET /api/identity/role（AdminOnly）→ 裸数组 */
export function getRoles() {
  return service.get('/api/identity/role');
}

/** 创建角色：POST /api/identity/role（AdminOnly，成功 201） */
export function createRole(payload: CreateRoleInput) {
  return service.post('/api/identity/role', payload);
}

/** 更新角色：PUT /api/identity/role/{roleId}（AdminOnly） */
export function updateRole(roleId: string, payload: UpdateRoleInput) {
  return service.put(`/api/identity/role/${roleId}`, payload);
}

/** 删除角色（软删除）：DELETE /api/identity/role/{roleId}（AdminOnly） */
export function deleteRole(roleId: string) {
  return service.delete(`/api/identity/role/${roleId}`);
}

/** 角色已授权权限：GET /api/identity/role/{roleId}/permissions（AdminOnly）→ 裸数组 */
export function getRolePermissions(roleId: string) {
  return service.get(`/api/identity/role/${roleId}/permissions`);
}

/** 全量覆盖角色权限：PUT /api/identity/role/{roleId}/permissions（AdminOnly，空数组 = 清空） */
export function setRolePermissions(roleId: string, permissionIds: string[]) {
  return service.put(`/api/identity/role/${roleId}/permissions`, { permissionIds });
}
