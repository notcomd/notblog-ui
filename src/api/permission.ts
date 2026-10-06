import service from '@/axios';

// 权限管理（Identity 服务，AdminOnly）
// 注意：Identity 未启用统一响应包装中间件，返回的是裸 JSON（非 ApiResponseResult 信封），
// 错误体形如 { error: "..." }，调用方需从 e.response.data.error 取消息。

/** 权限节点（GET /api/identity/permission/tree，children 递归嵌套） */
export interface PermissionNode {
  permissionId: string;
  parentId: string | null;
  /** 权限码，形如 api:tweet:read（创建后不可修改） */
  permissionCode: string;
  permissionName: string;
  /** 1=目录 2=按钮 3=接口 */
  permissionType: number;
  url: string | null;
  icon: string | null;
  sortOrder: number;
  children: PermissionNode[];
}

/** 新建权限请求体 */
export interface PermissionInput {
  permissionCode?: string;
  permissionName?: string;
  permissionType?: number;
  parentId?: string | null;
  url?: string | null;
  icon?: string | null;
  sortOrder?: number;
}

/** 权限树：GET /api/identity/permission/tree（AdminOnly）→ 根节点数组 */
export function getPermissionTree() {
  return service.get('/api/identity/permission/tree');
}

/** 创建权限：POST /api/identity/permission（AdminOnly） */
export function createPermission(payload: PermissionInput) {
  return service.post('/api/identity/permission', payload);
}

/**
 * 更新权限：PUT /api/identity/permission/{permissionId}（AdminOnly）
 * 语义：字段传 null/undefined = 不修改；Url/Icon 传空串 = 清除；ParentId 传全零 GUID = 移至根。
 * PermissionCode 不可修改。
 */
export function updatePermission(permissionId: string, payload: PermissionInput) {
  return service.put(`/api/identity/permission/${permissionId}`, payload);
}

/** 删除权限（软删除）：DELETE /api/identity/permission/{permissionId}（AdminOnly） */
export function deletePermission(permissionId: string) {
  return service.delete(`/api/identity/permission/${permissionId}`);
}

/** 权限类型 1/2/3 → 中文标签 */
export function permissionTypeText(t: number): string {
  return { 1: '目录', 2: '按钮', 3: '接口' }[t] || `类型 ${t}`;
}
