<template>
  <BaseModal :open="open" :title="title" :width="width" @close="emit('close')" @closed="emit('closed')">
    <slot></slot>
    <template v-if="$slots.footer" #footer>
      <slot name="footer"></slot>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
// 管理端弹窗：基于全站统一弹窗基座 BaseModal（对外 props/事件保持一致，新增 open 为可选受控项）
import BaseModal from '@/components/common/BaseModal.vue'

interface Props {
  title: string
  /** 形如 w-[720px]；未传时用默认宽度 */
  width?: string
  /** 受控显隐：不传默认 true（父级 v-if 旧用法无退场动画，行为不变）；传 false 播退场后 emit('closed') */
  open?: boolean
}
withDefaults(defineProps<Props>(), { open: true })

const emit = defineEmits<{ (e: 'close'): void; (e: 'closed'): void }>()
</script>
