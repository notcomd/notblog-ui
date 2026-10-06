import service from '@/axios';

// 角色组管理（Identity 服务，AdminOnly）
// Identity 未启用统一响应信封，返回裸 JSON；错误消息由 axios 拦截器提取到 e.message。

/** 角色组列表条目（GET /api/identity/rolegroup） */
export interface RoleGroupListItem {
  roleGroupGuid: string;
  roleGroupName: string;
  roleGroupCode: string;
  permissionCount: number;
  roleCount: number;
}

/** 新建 / 更新角色组请求体 */
export interface RoleGroupInput {
  roleGroupName: string;
  roleGroupCode: string;
}

/** 全部未删除角色组：GET /api/identity/rolegroup（AdminOnly）→ 裸数组 */
export function getRoleGroups() {
  return service.get('/api/identity/rolegroup');
}

/** 创建角色组：POST /api/identity/rolegroup（AdminOnly，成功 201） */
export function createRoleGroup(payload: RoleGroupInput) {
  return service.post('/api/identity/rolegroup', payload);
}

/** 更新角色组：PUT /api/identity/rolegroup/{groupId}（AdminOnly） */
export function updateRoleGroup(groupId: string, payload: RoleGroupInput) {
  return service.put(`/api/identity/rolegroup/${groupId}`, payload);
}

/** 删除角色组（软删除）：DELETE /api/identity/rolegroup/{groupId}（AdminOnly） */
export function deleteRoleGroup(groupId: string) {
  return service.delete(`/api/identity/rolegroup/${groupId}`);
}

/** 角色组已授权权限：GET /api/identity/rolegroup/{groupId}/permissions（AdminOnly）→ 裸数组 */
export function getRoleGroupPermissions(groupId: string) {
  return service.get(`/api/identity/rolegroup/${groupId}/permissions`);
}

/** 全量覆盖角色组权限：PUT /api/identity/rolegroup/{groupId}/permissions（AdminOnly，空数组 = 清空） */
export function setRoleGroupPermissions(groupId: string, permissionIds: string[]) {
  return service.put(`/api/identity/rolegroup/${groupId}/permissions`, { permissionIds });
}
