import { ref } from 'vue'
import { defineStore } from 'pinia'

let seq = 0

// 通知类型元数据：默认标题 + 图标（通知弹窗组件消费）
const TYPE_META = {
  success: { title: '成功', icon: '<svg class="w-5 h-5 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>' },
  error: { title: '失败', icon: '<svg class="w-5 h-5 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>' },
  info: { title: '提示', icon: '<svg class="w-5 h-5 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>' },
  warning: { title: '警告', icon: '<svg class="w-5 h-5 text-orange-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>' }
}

// 全局通知弹窗：顶部右侧堆叠显示（长方体卡片：图标 + 通知名称 + 消息 + 时间）
// 兼容两种调用形态：
//   push('文案', 'success')                       —— 简写（标题自动取类型名）
//   push({ title, text, type, icon?, duration? }) —— 完整对象（标题/图标自定义）
export const useToastStore = defineStore('toast', () => {
  const messages = ref([])

  function push(text, type = 'info') {
    const id = ++seq
    const isObj = text && typeof text === 'object'
    const t = isObj ? (text.type || 'info') : type
    const meta = TYPE_META[t] || TYPE_META.info
    const duration = isObj && text.duration != null ? text.duration : 3000
    messages.value.push({
      id,
      type: t,
      title: (isObj && text.title) || meta.title,
      text: isObj ? text.text : text,
      icon: (isObj && text.icon) || meta.icon,
      time: Date.now()
    })
    if (duration > 0) {
      setTimeout(() => dismiss(id), duration)
    }
    return id
  }

  function dismiss(id) {
    messages.value = messages.value.filter(m => m.id !== id)
  }

  return { messages, push, dismiss }
})
