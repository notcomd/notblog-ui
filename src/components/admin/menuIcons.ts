// 管理端菜单图标注册表：键 → 内联 SVG（与 AdminLayout 的 v-html 渲染方式一致）
// 后端 Menu.Icon 存短图标键，UI 表现完全由前端决定；管理表单从此注册表提供下拉选择。

export interface AdminNavItem {
  path: string;
  label: string;
  icon: string;
  match?: string;
  badge?: string;
}

const SVG_OPEN = '<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">';

/** 图标键 → 内联 SVG 字符串 */
export const MENU_ICONS: Record<string, string> = {
  dashboard: `${SVG_OPEN}<line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>`,
  users: `${SVG_OPEN}<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  content: `${SVG_OPEN}<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`,
  reports: `${SVG_OPEN}<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>`,
  circles: `${SVG_OPEN}<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  files: `${SVG_OPEN}<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`,
  announcements: `${SVG_OPEN}<path d="M3 11l18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg>`,
  menus: `${SVG_OPEN}<line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>`
};

/** 未知/空键的兜底图标（圆点） */
export const DEFAULT_MENU_ICON = `${SVG_OPEN}<circle cx="12" cy="12" r="9"/></svg>`;

/** 取图标 SVG；键不存在时回退默认图标 */
export function resolveMenuIcon(key?: string | null): string {
  if (key && MENU_ICONS[key]) return MENU_ICONS[key];
  return DEFAULT_MENU_ICON;
}

/** 管理端侧栏兜底导航（接口失败或返回为空时使用，保证侧栏不为空） */
export const DEFAULT_ADMIN_NAV: AdminNavItem[] = [
  { path: '/admin', label: '工作台', icon: MENU_ICONS.dashboard, match: '/admin' },
  { path: '/admin/users', label: '用户管理', icon: MENU_ICONS.users },
  { path: '/admin/content', label: '内容管理', icon: MENU_ICONS.content },
  { path: '/admin/reports', label: '举报管理', icon: MENU_ICONS.reports },
  { path: '/admin/circles', label: '社区管理', icon: MENU_ICONS.circles },
  { path: '/admin/files', label: '文件管理', icon: MENU_ICONS.files },
  { path: '/admin/announcements', label: '公报', icon: MENU_ICONS.announcements, badge: 'NEW' },
  { path: '/admin/menus', label: '菜单管理', icon: MENU_ICONS.menus }
];