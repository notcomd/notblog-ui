import { ref } from 'vue'
import { defineStore } from 'pinia'

let seq = 0

// 通知类型元数据：默认标题 + 图标（通知弹窗组件消费）
const TYPE_META = {
  success: { title: '成功', icon: '✅' },
  error: { title: '失败', icon: '❌' },
  info: { title: '提示', icon: '🔔' },
  warning: { title: '警告', icon: '⚠️' }
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
