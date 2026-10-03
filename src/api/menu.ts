import service from '@/axios';

/** 菜单节点（后端 /api/identity/menu 返回，camelCase） */
export interface MenuNode {
  menuId: string;
  parentId: string | null;
  menuName: string;
  /** 1=目录 2=菜单项 */
  menuType: number;
  url: string | null;
  icon: string | null;
  sortOrder: number;
  isEnabled: boolean;
  requiredPermissionCode: string | null;
  requiredRole: string | null;
  children?: MenuNode[];
}

/** 新建/更新菜单请求体（更新时字段可选；可空字段传空串表示清除） */
export interface MenuInput {
  menuName: string;
  menuType: number;
  parentId?: string | null;
  url?: string | null;
  icon?: string | null;
  sortOrder?: number;
  isEnabled?: boolean;
  requiredPermissionCode?: string | null;
  requiredRole?: string | null;
}

/** 管理端完整菜单树：GET /api/identity/menu/tree（AdminOnly） */
export function getAdminMenuTree() {
  return service.get('/api/identity/menu/tree');
}

/** 当前用户可见菜单树（管理端侧栏）：GET /api/identity/menu/my */
export function getMyMenus() {
  return service.get('/api/identity/menu/my');
}

/** 创建菜单：POST /api/identity/menu（AdminOnly） */
export function createMenu(payload: MenuInput) {
  return service.post('/api/identity/menu', payload);
}

/** 更新菜单：PUT /api/identity/menu/{menuId}（AdminOnly，字段可选） */
export function updateMenu(menuId: string, payload: Partial<MenuInput>) {
  return service.put(`/api/identity/menu/${menuId}`, payload);
}

/** 删除菜单（软删除）：DELETE /api/identity/menu/{menuId}（AdminOnly） */
export function deleteMenu(menuId: string) {
  return service.delete(`/api/identity/menu/${menuId}`);
}