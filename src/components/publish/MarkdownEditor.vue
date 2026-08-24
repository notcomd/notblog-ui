<template>
  <div class="glass-card overflow-hidden">
    <!-- 工具栏 -->
    <div class="flex flex-wrap items-center gap-1 px-3 py-2 border-b border-zinc-200/60 dark:border-zinc-700/60">
      <button v-for="btn in toolButtons" :key="btn.label" class="w-8 h-8 rounded-lg flex items-center justify-center text-sm text-zinc-600 dark:text-zinc-300 hover:bg-amber-400/15 hover:text-amber-500 transition-colors" :title="btn.tip" @click="insert(btn.syntax)">
        <span v-if="btn.svg" v-html="btn.svg"></span><span v-else>{{ btn.icon }}</span>
      </button>
      <div class="w-px h-5 bg-zinc-200 dark:bg-zinc-700 mx-1"></div>
      <button class="h-8 px-2.5 rounded-lg text-xs text-zinc-600 dark:text-zinc-300 hover:bg-amber-400/15 hover:text-amber-500 transition-colors" title="上传图片（≤10MB，自动插入 Markdown）" :disabled="uploading" @click="pickImage">
        <span v-if="!uploading" class="inline-flex items-center gap-1"><svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>上传图片</span><span v-else>上传中...</span>
      </button>
      <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="onPickImage" />
      <div class="flex-1"></div>
      <div class="flex gap-0.5 glass p-0.5 rounded-xl">
        <button class="px-3 h-7 rounded-lg text-xs font-medium transition-all" :class="view === 'edit' ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow' : 'text-zinc-500'" @click="view = 'edit'">编辑</button>
        <button class="px-3 h-7 rounded-lg text-xs font-medium transition-all" :class="view === 'preview' ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow' : 'text-zinc-500'" @click="view = 'preview'">预览</button>
        <button class="px-3 h-7 rounded-lg text-xs font-medium transition-all" :class="view === 'split' ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow' : 'text-zinc-500'" @click="view = 'split'">分栏</button>
      </div>
    </div>

    <div class="flex min-h-[420px]">
      <textarea
        v-if="view !== 'preview'"
        ref="taRef"
        :value="modelValue"
        rows="16"
        class="resize-none outline-none p-4 text-sm leading-relaxed bg-white/40 dark:bg-zinc-900/40 font-mono text-zinc-700 dark:text-zinc-200 transition-all"
        :class="view === 'split' ? 'w-1/2 border-r border-zinc-200/60 dark:border-zinc-700/60' : 'flex-1 w-full'"
        :placeholder="placeholderText"
        spellcheck="false"
        @input="onInput"
        @keydown.tab.prevent="insertTab"
      ></textarea>
      <div v-if="view !== 'edit'" class="overflow-y-auto p-5 prose-sm w-1/2 flex-1 bg-white/20 dark:bg-zinc-900/20" :class="view === 'split' ? '' : 'w-full'">
        <div v-if="modelValue.trim()" class="markdown-body" v-html="rendered"></div>
        <div v-else class="h-full min-h-[380px] flex flex-col items-center justify-center gap-2 text-zinc-400">
          <div class="text-5xl"><svg class="w-12 h-12 mx-auto text-zinc-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg></div>
          <p class="text-sm">在左侧开始书写，右侧实时预览</p>
        </div>
      </div>
    </div>

    <!-- 底部状态栏 -->
    <div class="flex items-center justify-between px-4 py-2 border-t border-zinc-200/60 dark:border-zinc-700/60 text-[11px] text-zinc-400">
      <span>{{ (modelValue || '').length }} 字 · {{ wordCount }} 词</span>
      <span class="flex items-center gap-1">
        <span class="w-1.5 h-1.5 rounded-full" :class="(modelValue || '').trim() ? 'bg-emerald-400' : 'bg-zinc-300 dark:bg-zinc-600'"></span>
        {{ (modelValue || '').trim() ? '内容就绪' : '等待输入' }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { renderMarkdown } from '@/utils/markdown'
import { uploadImage } from '@/api/publish'
import { unwrap } from '@/utils/response'

interface Props {
  modelValue?: string
}
const props = withDefaults(defineProps<Props>(), {
  modelValue: ''
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'images-changed', images: Array<{ fileId: string; url: string }>): void
}>()

const view = ref<'edit' | 'preview' | 'split'>('split')
const uploading = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const taRef = ref<HTMLTextAreaElement | null>(null)
const uploadedImages = ref<Array<{ fileId: string; url: string }>>([])

const rendered = computed(() => renderMarkdown(props.modelValue))

const placeholderText = `# 开始书写你的 Markdown 故事...

支持：**加粗** *斜体* ~~删除线~~ \`代码\`
> 引用
- 列表
1. 有序列表
![图片描述](图片URL) 等语法`

const wordCount = computed(() => {
  const t = (props.modelValue || '').trim()
  if (!t) return 0
  const cjk = (t.match(/[一-龥]/g) || []).length
  const words = t.replace(/[一-龥]/g, ' ').trim().split(/\s+/).filter(Boolean).length
  return cjk + words
})

const toolButtons = [
  { icon: '𝐁', tip: '加粗 **文本**', syntax: '**加粗文字**' },
  { icon: '𝐼', tip: '斜体 *文本*', syntax: '*斜体文字*' },
  { icon: 'S̶', tip: '删除线 ~~文本~~', syntax: '~~删除线~~' },
  { icon: 'H', tip: '标题 ## 二级标题', syntax: '## 标题' },
  { icon: '❝', tip: '引用 > 引用内容', syntax: '> 引用内容' },
  { icon: '•', tip: '无序列表 - 项目', syntax: '- 列表项目' },
  { icon: '1.', tip: '有序列表 1. 项目', syntax: '1. 列表项目' },
  { icon: '</>', tip: '代码块 ```js', syntax: '```js\nconsole.log("hello")\n```' },
  { icon: '🔗', svg: '<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>', tip: '链接 [文字](url)', syntax: '[链接文字](https://)' },
  { icon: '☰', tip: '表格', syntax: '| 列1 | 列2 |\n| --- | --- |\n| 内容 | 内容 |' },
  { icon: '—', tip: '分隔线 ---', syntax: '\n---\n' }
]

// ---------- 文本操作（使用组件内 ref，不依赖全局 DOM 查询） ----------
function onInput(e: Event) {
  emit('update:modelValue', (e.target as HTMLTextAreaElement).value)
}

function insert(syntax: string) {
  const ta = taRef.value
  if (!ta) {
    emit('update:modelValue', props.modelValue + syntax)
    return
  }
  const val = props.modelValue
  const start = ta.selectionStart
  const end = ta.selectionEnd
  const selected = val.slice(start, end)
  const wrapped = selected ? syntax.replace('文本', selected).replace('文字', selected) : syntax
  const next = val.slice(0, start) + wrapped + val.slice(end)
  emit('update:modelValue', next)
  // 恢复光标（内容更新后 textarea 值会同步，用 nextTick 定位）
  nextTick(() => {
    ta.focus()
    ta.selectionStart = ta.selectionEnd = start + wrapped.length
  })
}

function insertTab() {
  const ta = taRef.value
  if (!ta) return
  const val = props.modelValue
  const start = ta.selectionStart
  const end = ta.selectionEnd
  const next = val.slice(0, start) + '  ' + val.slice(end)
  emit('update:modelValue', next)
  nextTick(() => {
    ta.focus()
    ta.selectionStart = ta.selectionEnd = start + 2
  })
}

// ---------- 图片上传 ----------
function pickImage() {
  fileInput.value && fileInput.value.click()
}

async function onPickImage(e: Event) {
  const el = e.target as HTMLInputElement
  const file = el.files && el.files[0]
  el.value = ''
  if (!file) return
  if (file.size > 10 * 1024 * 1024) {
    alert('图片不能超过 10MB')
    return
  }
  uploading.value = true
  try {
    const res = await uploadImage(file)
    const data = unwrap(res) || {}
    const fileId = data.fileId || data.file_id || 'mock-' + Date.now()
    const url = data.fileUri || data.file_url || ''
    uploadedImages.value.push({ fileId, url })
    emit('images-changed', [...uploadedImages.value])
    const md = url ? `![${file.name.replace(/\.[^.]+$/, '')}](${url})` : `![${file.name}](${fileId})`
    insert(md)
  } catch (err) {
    alert('图片上传失败：' + (err && err.message ? err.message : '未知错误'))
  } finally {
    uploading.value = false
  }
}
</script>
