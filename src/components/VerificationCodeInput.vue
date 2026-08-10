<template>
  <div class="relative w-full select-none" @click="focusInput">
    <!-- 9 个格子展示（真实输入在透明 input 里） -->
    <div class="flex gap-1.5 justify-center">
      <div
        v-for="i in length"
        :key="i"
        class="w-9 h-12 sm:w-10 sm:h-13 sm:h-[52px] rounded-[5%] border-2 flex items-center justify-center text-lg font-bold transition-all duration-150"
        :class="cellClass(i - 1)"
      >
        <span class="font-mono">{{ displayChars[i - 1] || '' }}</span>
        <!-- 光标 -->
        <span
          v-if="focused && i - 1 === displayChars.length"
          class="absolute w-0.5 h-6 bg-amber-500 rounded-full animate-pulse"
        ></span>
      </div>
    </div>
    <!-- 透明真实输入框：接收键盘/粘贴，支持光标定位 -->
    <input
      ref="inputEl"
      :value="displayChars.join('')"
      type="text"
      inputmode="text"
      autocomplete="one-time-code"
      :disabled="disabled"
      spellcheck="false"
      class="absolute inset-0 w-full h-full opacity-0 cursor-text outline-none"
      @input="onInput"
      @keydown="onKeydown"
      @focus="focused = true"
      @blur="focused = false"
      @paste="onPaste"
    />
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  length: { type: Number, default: 9 },
  disabled: { type: Boolean, default: false },
  autoFocus: { type: Boolean, default: true },
  error: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue', 'complete'])

const inputEl = ref(null)
const focused = ref(false)

// 只允许数字 + 英文字母（大小写保留，后端 Ordinal 区分大小写）
const VALID = /^[A-Za-z0-9]$/

const displayChars = computed(() => (props.modelValue || '').split('').slice(0, props.length))

function cellClass(index) {
  const base = 'bg-amber-50/60 dark:bg-zinc-800/60 border-amber-200 dark:border-zinc-700 text-amber-900 dark:text-zinc-100'
  if (props.error) return 'border-red-400 bg-red-50/50 dark:bg-red-500/10 text-red-500'
  if (displayChars.value[index]) return 'border-amber-400 dark:border-amber-500/60 ' + base
  if (focused.value && index === displayChars.value.length) return 'border-amber-500 ring-2 ring-amber-300/50 ' + base
  return 'border-amber-200 dark:border-zinc-700 ' + base
}

function onInput(e) {
  // 过滤：只保留字母数字，截断到 length
  const raw = e.target.value.replace(/[^A-Za-z0-9]/g, '').slice(0, props.length)
  emit('update:modelValue', raw)
  if (raw.length === props.length) {
    emit('complete', raw)
  }
}

function onKeydown(e) {
  // 退格：删除最后一位（input 原生也会删，这里确保格子联动）
  if (e.key === 'Backspace') {
    // 让原生处理（value 联动），无需额外逻辑
    return
  }
  // 只允许单个字母数字键输入（其余交给 input 过滤）
  if (e.key.length === 1 && !VALID.test(e.key)) {
    e.preventDefault()
  }
}

function onPaste(e) {
  e.preventDefault()
  const text = (e.clipboardData || window.clipboardData).getData('text')
  const cleaned = text.replace(/[^A-Za-z0-9]/g, '').slice(0, props.length)
  emit('update:modelValue', cleaned)
  if (cleaned.length === props.length) {
    emit('complete', cleaned)
  }
}

function focusInput() {
  if (props.disabled) return
  if (inputEl.value) inputEl.value.focus()
}

onMounted(() => {
  if (props.autoFocus && !props.disabled) {
    setTimeout(() => focusInput(), 100)
  }
})

defineExpose({ focus: focusInput })
</script>
