// 本地草稿箱：工作台未发布内容管理
// 存储结构：{ id, type: 'post'|'video'|'markdown'|'circle', title, content, images[], cover, circleGuid, circleName, createdAt, updatedAt }
const KEY = 'qingmang_drafts'

export function getDrafts() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]')
  } catch (e) {
    return []
  }
}

export function getDraft(id) {
  return getDrafts().find(d => d.id === id) || null
}

export function saveDraft(draft) {
  const list = getDrafts()
  const idx = list.findIndex(d => d.id === draft.id)
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...draft, updatedAt: Date.now() }
  } else {
    list.unshift({ ...draft, id: draft.id || 'd_' + Date.now(), createdAt: Date.now(), updatedAt: Date.now() })
  }
  localStorage.setItem(KEY, JSON.stringify(list))
  return list[0]
}

export function removeDraft(id) {
  const list = getDrafts().filter(d => d.id !== id)
  localStorage.setItem(KEY, JSON.stringify(list))
  return list
}

export function getDraftsByType(type) {
  return getDrafts().filter(d => d.type === type)
}
