// 本地草稿箱：工作台未发布内容管理
// 存储结构：{ id, type: 'post'|'video'|'markdown', title, content, images[], cover, circleGuid, circleName, createdAt, updatedAt }

interface Draft {
  id: string;
  type: 'post' | 'video' | 'markdown';
  title: string;
  content: string;
  images?: string[];
  cover?: string;
  circleGuid?: string;
  circleName?: string;
  createdAt?: number;
  updatedAt?: number;
}

const KEY = 'qingmang_drafts';

export function getDrafts(): Draft[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]') as Draft[];
  } catch (e) {
    return [];
  }
}

export function getDraft(id: string): Draft | null {
  return getDrafts().find((d) => d.id === id) || null;
}

export function saveDraft(draft: Draft): Draft {
  const list = getDrafts();
  let saved: Draft;
  const idx = list.findIndex((d) => d.id === draft.id);
  if (idx >= 0) {
    saved = { ...list[idx], ...draft, updatedAt: Date.now() };
    list[idx] = saved;
  } else {
    // ⚠️ id 必须防同毫秒冲突：Date.now() 毫秒级 + Math.random 后缀（曾因纯时间戳
    // 同毫秒连续保存生成相同 id → 后保存覆盖前者 → 工作台返回/显示错误草稿）
    const newId = draft.id || 'd_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
    saved = { ...draft, id: newId, createdAt: Date.now(), updatedAt: Date.now() };
    list.unshift(saved);
  }
  localStorage.setItem(KEY, JSON.stringify(list));
  return saved;
}

export function removeDraft(id: string): Draft[] {
  const list = getDrafts().filter((d) => d.id !== id);
  localStorage.setItem(KEY, JSON.stringify(list));
  return list;
}

export function getDraftsByType(type: string): Draft[] {
  return getDrafts().filter((d) => d.type === type);
}
