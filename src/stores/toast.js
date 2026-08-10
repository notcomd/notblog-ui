import { ref } from 'vue'
import { defineStore } from 'pinia'

let seq = 0

// 全局轻提示：从顶部导航栏下方滑出，3 秒自动消失
export const useToastStore = defineStore('toast', () => {
  const messages = ref([])

  function push(text, type = 'info') {
    const id = ++seq
    messages.value.push({ id, text, type })
    setTimeout(() => dismiss(id), 3000)
  }

  function dismiss(id) {
    messages.value = messages.value.filter(m => m.id !== id)
  }

  return { messages, push, dismiss }
})
