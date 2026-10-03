// 专注模式：Markdown 长文写作时隐藏左侧功能栏（SideNav）与顶部栏（TopBar），
// 让编辑器独占整个视口，方便沉浸书写。
// 由 MarkdownEditorPage 在进入正文步骤时开启、离开时关闭；工具栏也提供手动开关。
import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useFocusStore = defineStore('focus', () => {
  const focusMode = ref(false)

  /** 设置专注模式（true 隐藏应用框架，仅保留编辑器） */
  function setFocusMode(value: boolean): void {
    focusMode.value = value
  }

  /** 进入专注模式 */
  function enter(): void {
    focusMode.value = true
  }

  /** 退出专注模式（恢复功能栏与顶部栏） */
  function exit(): void {
    focusMode.value = false
  }

  return { focusMode, setFocusMode, enter, exit }
})
