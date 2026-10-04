<template>
  <!-- 全屏 Markdown 编辑器：顶部工具栏承载「格式 / 插入 / 文稿操作」全部操作（含保存与发布），
       编辑区撑满剩余高度并各自内部滚动，避免整页滚动 -->
  <div class="flex flex-col h-full min-h-0">
    <!-- ==================== 顶部工具栏 ==================== -->
    <div class="shrink-0 flex items-center gap-2 px-3 py-2 border-b border-zinc-200/70 dark:border-white/10">
      <!-- 左：文稿标题 + 可滚动的工具组 -->
      <div class="flex-1 min-w-0 flex items-center gap-1 overflow-x-auto">
        <span class="shrink-0 max-w-[160px] truncate text-xs font-semibold text-zinc-500 dark:text-zinc-300 mr-1" :title="docTitle">{{ docTitle }}</span>
        <span class="shrink-0 w-px h-5 bg-zinc-200/80 dark:bg-zinc-700/70 mx-1" aria-hidden="true"></span>

        <!-- 格式工具 -->
        <button
          v-for="t in formatTools"
          :key="t.key"
          type="button"
          class="shrink-0 w-8 h-8 rounded-[5%] flex items-center justify-center text-[13px] font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-amber-400/15 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
          :title="t.tip"
          :aria-label="t.tip"
          @click="t.run()"
        >
          <span v-html="t.html"></span>
        </button>

        <span class="shrink-0 w-px h-5 bg-zinc-200/80 dark:bg-zinc-700/70 mx-1" aria-hidden="true"></span>

        <!-- 插入工具（链接 / 图片 / 表格 / 流程图 / 视频 / 代码块 / 公式 / 折叠块） -->
        <button
          v-for="t in insertTools"
          :key="t.key"
          type="button"
          class="shrink-0 w-8 h-8 rounded-[5%] flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:bg-amber-400/15 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
          :title="t.tip"
          :aria-label="t.tip"
          :disabled="uploading || videoUploading"
          @click="t.run()"
        >
          <span v-html="t.html"></span>
        </button>
      </div>

      <!-- 右：文稿操作（修改封面/标题由父级插槽注入 + 段落大纲 + 专注 + 预览开关 + 存草稿 + 发布） -->
      <div class="shrink-0 flex items-center gap-2">
        <slot name="toolbar-extra" />

        <!-- 段落大纲开关：解析文档标题段落，点击可快速定位（默认不显示） -->
        <button
          type="button"
          class="h-8 px-3 rounded-[5%] text-xs font-medium transition-colors inline-flex items-center gap-1.5"
          :class="outlineOpen ? 'bg-amber-400/15 text-amber-600 dark:text-amber-400' : 'text-zinc-500 hover:bg-black/[0.04] hover:text-zinc-700 dark:hover:bg-white/[0.06] dark:hover:text-zinc-200'"
          :aria-pressed="outlineOpen"
          :title="outlineOpen ? '隐藏段落大纲' : '显示段落大纲'"
          @click="outlineOpen = !outlineOpen"
        >
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M4 6h4M4 12h4M4 18h4" /><path d="M12 6h8M12 12h8M12 18h8" />
          </svg>
          段落<span class="font-numeric opacity-70">{{ outline.length }}</span>
        </button>

        <!-- 专注模式开关：隐藏左侧功能栏与顶部栏，编辑器独占整屏 -->
        <button
          type="button"
          class="h-8 px-3 rounded-[5%] text-xs font-medium transition-colors inline-flex items-center gap-1.5"
          :class="focus.focusMode ? 'bg-amber-400/15 text-amber-600 dark:text-amber-400' : 'text-zinc-500 hover:bg-black/[0.04] hover:text-zinc-700 dark:hover:bg-white/[0.06] dark:hover:text-zinc-200'"
          :aria-pressed="focus.focusMode"
          :title="focus.focusMode ? '退出专注模式（恢复功能栏）' : '进入专注模式（隐藏功能栏与顶栏）'"
          @click="focus.setFocusMode(!focus.focusMode)"
        >
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path v-if="focus.focusMode" d="M9 3H5a2 2 0 0 0-2 2v4M15 21h4a2 2 0 0 0 2-2v-4M3 15v4a2 2 0 0 0 2 2h4M21 9V5a2 2 0 0 0-2-2h-4" />
            <path v-else d="M4 9V5a1 1 0 0 1 1-1h4M20 15v4a1 1 0 0 1-1 1h-4M20 9V5a1 1 0 0 0-1-1h-4M4 15v4a1 1 0 0 0 1 1h4" />
          </svg>
          {{ focus.focusMode ? '专注中' : '专注写' }}
        </button>

        <!-- 预览开关：关闭后编辑区铺满整行 -->
        <button
          type="button"
          class="h-8 px-3 rounded-[5%] text-xs font-medium transition-colors inline-flex items-center gap-1.5"
          :class="showPreview ? 'bg-amber-400/15 text-amber-600 dark:text-amber-400' : 'text-zinc-500 hover:bg-black/[0.04] hover:text-zinc-700 dark:hover:bg-white/[0.06] dark:hover:text-zinc-200'"
          :aria-pressed="showPreview"
          :title="showPreview ? '关闭预览' : '开启预览'"
          @click="showPreview = !showPreview"
        >
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path v-if="showPreview" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path v-if="showPreview" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            <template v-else>
              <path d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243" />
              <path d="M3 3l18 18" />
            </template>
          </svg>
          {{ showPreview ? '预览中' : '预览已关' }}
        </button>

        <!-- 存草稿 -->
        <button
          type="button"
          class="h-8 px-3 rounded-[5%] text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
          :disabled="saving"
          @click="emit('save-draft')"
        >
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
          {{ saving ? '保存中…' : '存草稿' }}
        </button>

        <!-- 发布 -->
        <button
          type="button"
          class="btn-sheen h-8 px-4 rounded-[5%] text-xs font-semibold bg-gradient-to-r from-amber-400 to-orange-500 text-white hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="publishing || !canPublish"
          @click="emit('publish')"
        >
          {{ publishing ? '发布中…' : '发布文章' }}
        </button>
      </div>
    </div>

    <!-- 表格行列选择浮层（点击工具栏「表格」按钮展开） -->
    <div v-if="tableOpen" class="relative shrink-0">
      <div class="absolute left-3 top-0 z-30 p-2.5 qm-surface" @mouseleave="tableOpen = false">
        <div class="text-[10px] text-zinc-400 mb-1.5 font-numeric">{{ tableRows }} × {{ tableCols }}</div>
        <div class="grid grid-cols-8 gap-0.5">
          <button
            v-for="c in 64"
            :key="c"
            type="button"
            class="w-4 h-4 rounded-[3px] border transition-colors"
            :class="isPicked(c) ? 'bg-amber-400/70 border-amber-500' : 'bg-white/50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700'"
            :aria-label="`${Math.ceil(c / 8)} 行 ${((c - 1) % 8) + 1} 列`"
            @mouseenter="pickTable(c)"
            @click="insertTable()"
          ></button>
        </div>
      </div>
    </div>

    <!-- ==================== 编辑区（撑满剩余高度） ==================== -->
    <div class="flex-1 min-h-0 flex">
      <!-- 段落大纲：解析文档中的 # 标题，点击定位到对应段落（默认隐藏） -->
      <div
        v-if="outlineOpen"
        class="w-[212px] shrink-0 h-full overflow-y-auto border-r border-zinc-200/70 dark:border-white/10 py-3 px-2"
      >
        <div class="flex items-center justify-between px-1.5 mb-2">
          <span class="text-xs font-semibold text-zinc-500 dark:text-zinc-300">段落大纲</span>
          <button
            type="button"
            class="w-6 h-6 rounded-[5%] flex items-center justify-center text-zinc-400 hover:bg-black/[0.05] dark:hover:bg-white/[0.08] hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
            title="收起段落大纲"
            aria-label="收起段落大纲"
            @click="outlineOpen = false"
          >
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>

        <p v-if="!outline.length" class="px-1.5 py-2 text-[11px] leading-relaxed text-zinc-400">
          暂无标题段落<br>用 <code class="px-1 rounded bg-zinc-200/70 dark:bg-zinc-700/60">#</code> 标记标题后会自动生成
        </p>

        <ul v-else class="space-y-0.5">
          <li v-for="(o, i) in outline" :key="i">
            <button
              type="button"
              class="w-full text-left rounded-[5%] py-1 pr-1.5 text-xs truncate transition-colors"
              :class="o.level <= 2
                ? 'text-zinc-700 dark:text-zinc-200 hover:bg-amber-400/10 hover:text-amber-600 dark:hover:text-amber-400'
                : 'text-zinc-500 dark:text-zinc-400 hover:bg-amber-400/10 hover:text-amber-600 dark:hover:text-amber-400'"
              :style="{ paddingLeft: 6 + (o.level - 1) * 10 + 'px' }"
              :title="o.text"
              @click="jumpTo(o, i)"
            >
              <span class="font-numeric text-[10px] opacity-50 mr-1">H{{ o.level }}</span>{{ o.text }}
            </button>
          </li>
        </ul>
      </div>

      <textarea
        ref="taRef"
        :value="modelValue"
        name="markdownContent"
        aria-label="Markdown 编辑器"
        class="h-full resize-none outline-none p-5 text-sm leading-relaxed bg-transparent font-mono text-zinc-700 dark:text-zinc-200 transition-all"
        :class="showPreview ? 'flex-1 min-w-0 border-r border-zinc-200/70 dark:border-white/10' : 'w-full'"
        :placeholder="placeholderText"
        spellcheck="false"
        @input="onInput"
        @keydown.tab.prevent="insertTab"
      ></textarea>

      <!-- 预览区：可由工具栏按钮关闭 -->
      <div
        v-if="showPreview"
        ref="previewRef"
        class="flex-1 min-w-0 h-full overflow-y-auto p-5"
      >
        <div v-if="modelValue.trim()" class="markdown-body" v-html="rendered"></div>
        <div v-else class="h-full flex flex-col items-center justify-center gap-2 text-zinc-400">
          <svg class="w-12 h-12 text-zinc-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
          <p class="text-sm">在左侧开始书写，此处实时预览</p>
          <p class="text-[11px] opacity-80">支持表格、流程图（mermaid）、视频、公式与折叠块</p>
        </div>
      </div>
    </div>

    <!-- ==================== 底部状态栏 ==================== -->
    <div class="shrink-0 flex items-center justify-between px-4 py-1.5 border-t border-zinc-200/70 dark:border-white/10 text-[11px] text-zinc-400">
      <span class="font-numeric">{{ modelValue.length }} 字 · {{ wordCount }} 词</span>
      <span class="flex items-center gap-3">
        <span v-if="uploading || videoUploading" class="text-amber-500">{{ videoUploading ? '视频上传中…' : '图片上传中…' }}</span>
        <span class="flex items-center gap-1">
          <span class="w-1.5 h-1.5 rounded-full" :class="modelValue.trim() ? 'bg-amber-400' : 'bg-zinc-300 dark:bg-zinc-600'"></span>
          {{ modelValue.trim() ? '内容就绪' : '等待输入' }}
        </span>
      </span>
    </div>

    <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="onPickImage" />
    <input ref="videoInput" type="file" accept="video/*" class="hidden" @change="onPickVideo" />
  </div>
</template>

<script setup lang="ts">
// Markdown 编辑器（全屏面板）
// 结构：工具栏（格式 / 插入 / 文稿操作）+ 编辑区（编辑 + 可关闭预览）+ 状态栏
// 保存与发布由父级处理，通过 save-draft / publish 事件回传，工具栏只负责触发
import { computed, nextTick, ref } from 'vue'
import { renderMarkdown } from '@/utils/markdown'
import { uploadImage, uploadVideo } from '@/api/publish'
import { unwrap } from '@/utils/response'
import { useFocusStore } from '@/stores/focus'

interface Props {
  /** 正文内容（v-model） */
  modelValue?: string
  /** 工具栏左侧展示的文稿标题 */
  docTitle?: string
  /** 草稿保存中 */
  saving?: boolean
  /** 发布中 */
  publishing?: boolean
  /** 是否满足发布条件（标题/正文/封面齐备） */
  canPublish?: boolean
}
const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  docTitle: '未命名文档',
  saving: false,
  publishing: false,
  canPublish: false
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'images-changed', images: Array<{ fileId: string; url: string }>): void
  (e: 'save-draft'): void
  (e: 'publish'): void
}>()

/** 工具栏按钮定义 */
interface EditorTool {
  key: string
  tip: string
  /** 按钮内联 HTML（图标或文字） */
  html: string
  run: () => void
}

/** 段落大纲条目 */
interface OutlineItem {
  /** 标题层级 1-6 */
  level: number
  text: string
  /** 该标题在正文中的字符偏移（用于光标定位） */
  index: number
  /** 行号（从 0 开始，用于滚动估算） */
  line: number
}

const focus = useFocusStore()
const showPreview = ref(true)
const outlineOpen = ref(false)
const uploading = ref(false)
const videoUploading = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const videoInput = ref<HTMLInputElement | null>(null)
const taRef = ref<HTMLTextAreaElement | null>(null)
const previewRef = ref<HTMLElement | null>(null)
const uploadedImages = ref<Array<{ fileId: string; url: string }>>([])

const tableOpen = ref(false)
const tableRows = ref(3)
const tableCols = ref(3)

const rendered = computed(() => renderMarkdown(props.modelValue))

/** 解析正文标题段落（跳过代码块内的 # 行），供大纲展示与定位 */
const outline = computed<OutlineItem[]>(() => {
  const items: OutlineItem[] = []
  let offset = 0
  let inFence = false
  props.modelValue.split('\n').forEach((line, lineNo) => {
    if (/^```/.test(line.trim())) {
      inFence = !inFence
    } else if (!inFence) {
      const m = line.match(/^(#{1,6})\s+(.*)$/)
      if (m) items.push({ level: m[1].length, text: m[2].trim() || '未命名标题', index: offset, line: lineNo })
    }
    offset += line.length + 1
  })
  return items
})

const placeholderText = `# 开始书写你的 Markdown 故事…

支持：**加粗** *斜体* ~~删除线~~ ==高亮== \`代码\`
> 引用 / - 列表 / 1. 有序列表 / - [ ] 任务
| 表格 | 流程图 | 视频 | 公式 | 折叠块 等语法`

const wordCount = computed(() => {
  const t = (props.modelValue || '').trim()
  if (!t) return 0
  const cjk = (t.match(/[一-龥]/g) || []).length
  const words = t.replace(/[一-龥]/g, ' ').trim().split(/\s+/).filter(Boolean).length
  return cjk + words
})

// ==================== 文本操作 ====================

/** 输入同步到 v-model */
function onInput(e: Event): void {
  emit('update:modelValue', (e.target as HTMLTextAreaElement).value)
}

/** 在光标处插入行内片段（保留选区内容参与包裹） */
function insert(syntax: string): void {
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
  nextTick(() => {
    ta.focus()
    ta.selectionStart = ta.selectionEnd = start + wrapped.length
  })
}

/** 插入独立块（表格/流程图/视频等），自动与上下文空行分隔 */
function insertBlock(snippet: string): void {
  const ta = taRef.value
  if (!ta) {
    emit('update:modelValue', `${props.modelValue}\n\n${snippet}\n`)
    return
  }
  const val = props.modelValue
  const start = ta.selectionStart
  const end = ta.selectionEnd
  const before = val.slice(0, start)
  const prefix = before && !before.endsWith('\n') ? '\n\n' : ''
  emit('update:modelValue', before + prefix + snippet + '\n' + val.slice(end))
  nextTick(() => ta.focus())
}

/** Tab 键插入两个空格（不跳出编辑区） */
function insertTab(): void {
  const ta = taRef.value
  if (!ta) return
  const val = props.modelValue
  const start = ta.selectionStart
  const end = ta.selectionEnd
  emit('update:modelValue', val.slice(0, start) + '  ' + val.slice(end))
  nextTick(() => {
    ta.focus()
    ta.selectionStart = ta.selectionEnd = start + 2
  })
}

// ==================== 段落大纲定位 ====================

/**
 * 点击大纲条目：把编辑区光标移到该标题行，并让预览区滚动到同一标题。
 * @param item 大纲条目（含字符偏移与行号）
 * @param nth 该条目的序号（预览区标题节点与大纲顺序一致，据此定位）
 */
function jumpTo(item: OutlineItem, nth: number): void {
  const ta = taRef.value
  if (ta) {
    ta.focus()
    ta.setSelectionRange(item.index, item.index)
    // 按实际行高估算滚动位置，把目标行置于编辑区中部
    const lineHeight = parseFloat(window.getComputedStyle(ta).lineHeight) || 22
    const target = item.line * lineHeight - ta.clientHeight / 2 + lineHeight
    ta.scrollTop = Math.max(0, target)
  }
  const headings = previewRef.value?.querySelectorAll('h1, h2, h3, h4, h5, h6')
  const el = headings && headings[nth]
  if (el) el.scrollIntoView({ block: 'start', behavior: 'smooth' })
}

// ==================== 工具栏定义 ====================
const ICON = 'w-4 h-4'

/** 格式工具 */
const formatTools: EditorTool[] = [
  { key: 'bold', tip: '加粗 **文本**', html: 'B', run: () => insert('**加粗文字**') },
  { key: 'italic', tip: '斜体 *文本*', html: 'I', run: () => insert('*斜体文字*') },
  { key: 'strike', tip: '删除线 ~~文本~~', html: 'S', run: () => insert('~~删除线~~') },
  { key: 'mark', tip: '高亮 ==文本==', html: '==', run: () => insert('==高亮文字==') },
  { key: 'code', tip: '行内代码 `代码`', html: '</>', run: () => insert('`代码`') },
  { key: 'h1', tip: '一级标题', html: 'H1', run: () => insertBlock('# 一级标题') },
  { key: 'h2', tip: '二级标题', html: 'H2', run: () => insertBlock('## 二级标题') },
  { key: 'h3', tip: '三级标题', html: 'H3', run: () => insertBlock('### 三级标题') },
  { key: 'quote', tip: '引用 > 内容', html: '❝', run: () => insertBlock('> 引用内容') },
  { key: 'ul', tip: '无序列表 - 项目', html: '•', run: () => insertBlock('- 列表项目\n- 列表项目') },
  { key: 'ol', tip: '有序列表 1. 项目', html: '1.', run: () => insertBlock('1. 列表项目\n2. 列表项目') },
  { key: 'task', tip: '任务列表 - [ ] 待办', html: '☑', run: () => insertBlock('- [ ] 待办事项\n- [x] 已完成事项') },
  { key: 'hr', tip: '分隔线', html: '—', run: () => insertBlock('---') }
]

/** 插入工具 */
const insertTools: EditorTool[] = [
  {
    key: 'link',
    tip: '链接 [文字](url)',
    html: `<svg class="${ICON}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`,
    run: () => insert('[链接文字](https://)')
  },
  {
    key: 'image',
    tip: '上传图片（≤10MB，自动插入 Markdown）',
    html: `<svg class="${ICON}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`,
    run: () => pickImage()
  },
  {
    key: 'table',
    tip: '插入表格（选择行列）',
    html: `<svg class="${ICON}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/></svg>`,
    run: () => { tableRows.value = 3; tableCols.value = 3; tableOpen.value = !tableOpen.value }
  },
  {
    key: 'flow',
    tip: '插入流程图（mermaid）',
    html: `<svg class="${ICON}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="5" rx="1"/><rect x="14" y="16" width="7" height="5" rx="1"/><path d="M6.5 8v4a3 3 0 0 0 3 3h4"/><path d="M13.5 13l3 3-3 3"/></svg>`,
    run: () => insertFlowchart()
  },
  {
    key: 'video',
    tip: '上传视频（≤500MB，自动插入视频块）',
    html: `<svg class="${ICON}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="14" height="14" rx="2"/><polygon points="22 7 16 11 22 15 22 7"/></svg>`,
    run: () => pickVideo()
  },
  {
    key: 'codeblock',
    tip: '插入代码块',
    html: `<svg class="${ICON}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
    run: () => insertBlock('```js\nconsole.log("hello")\n```')
  },
  {
    key: 'formula',
    tip: '插入公式块 $$',
    html: `<svg class="${ICON}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 4H6l6 8-6 8h12"/></svg>`,
    run: () => insertBlock('$$\nE = mc^2\n$$')
  },
  {
    key: 'details',
    tip: '插入折叠块',
    html: `<svg class="${ICON}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h16M4 12h10M4 18h7"/><circle cx="19" cy="12" r="2"/></svg>`,
    run: () => insertBlock(':::details 点击展开\n折叠的补充说明内容\n:::')
  }
]

/** 插入流程图骨架 */
function insertFlowchart(): void {
  insertBlock('```mermaid\ngraph TD\n  A[开始] --> B{判断条件}\n  B -->|是| C[执行步骤]\n  B -->|否| D[结束]\n```')
}

// ==================== 表格行列选择 ====================
/** 单元格序号 → 是否处于当前选中区域 */
function isPicked(cell: number): boolean {
  const r = Math.ceil(cell / 8)
  const c = ((cell - 1) % 8) + 1
  return r <= tableRows.value && c <= tableCols.value
}

/** 悬停单元格时更新行列预览 */
function pickTable(cell: number): void {
  tableRows.value = Math.ceil(cell / 8)
  tableCols.value = ((cell - 1) % 8) + 1
}

/** 按选中行列插入表格（首行为表头） */
function insertTable(): void {
  const rows = Math.max(1, tableRows.value)
  const cols = Math.max(1, tableCols.value)
  const header = '| ' + Array.from({ length: cols }, (_, c) => `列${c + 1}`).join(' | ') + ' |'
  const sep = '| ' + Array.from({ length: cols }, () => '---').join(' | ') + ' |'
  const body = Array.from({ length: Math.max(0, rows - 1) }, () =>
    '| ' + Array.from({ length: cols }, () => ' ').join(' | ') + ' |'
  )
  insertBlock([header, sep, ...body].join('\n'))
  tableOpen.value = false
}

// ==================== 图片上传 ====================
function pickImage(): void {
  if (!uploading.value) fileInput.value?.click()
}

async function onPickImage(e: Event): Promise<void> {
  const el = e.target as HTMLInputElement
  const file = el.files && el.files[0]
  el.value = ''
  if (!file) return
  if (file.size > 10 * 1024 * 1024) {
    window.alert('图片不能超过 10MB')
    return
  }
  uploading.value = true
  try {
    const res = await uploadImage(file)
    const data = unwrap(res) || {}
    const fileId = data.fileId || data.file_id
    const url = data.fileUri || data.file_url || ''
    if (!fileId) throw new Error('上传未返回 fileId')
    uploadedImages.value.push({ fileId, url })
    emit('images-changed', [...uploadedImages.value])
    const name = file.name.replace(/\.[^.]+$/, '')
    insert(url ? `![${name}](${url})` : `![${file.name}](${fileId})`)
  } catch (err) {
    window.alert('图片上传失败：' + (err && (err as Error).message ? (err as Error).message : '未知错误'))
  } finally {
    uploading.value = false
  }
}

// ==================== 视频上传 ====================
function pickVideo(): void {
  if (!videoUploading.value) videoInput.value?.click()
}

async function onPickVideo(e: Event): Promise<void> {
  const el = e.target as HTMLInputElement
  const file = el.files && el.files[0]
  el.value = ''
  if (!file) return
  if (file.size > 500 * 1024 * 1024) {
    window.alert('视频不能超过 500MB')
    return
  }
  videoUploading.value = true
  try {
    const data = await uploadVideo(file, () => { /* 进度可扩展 */ })
    const url = (data && (data.fileUri || data.file_url || data.url)) || ''
    if (!url) throw new Error('上传未返回视频地址')
    insertBlock(`![video](${url})`)
  } catch (err) {
    window.alert('视频上传失败：' + (err && (err as Error).message ? (err as Error).message : '未知错误'))
  } finally {
    videoUploading.value = false
  }
}
</script>
