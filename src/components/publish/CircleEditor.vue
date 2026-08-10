<template>
  <div>
    <input v-model="form.name" placeholder="社区名称（必填）" class="w-full h-11 px-4 rounded-2xl bg-white/70 dark:bg-zinc-800/70 border border-white/60 dark:border-white/10 text-sm outline-none focus:ring-2 focus:ring-purple-400/50 transition-all mb-3" />
    <textarea v-model="form.description" rows="3" placeholder="社区简介" class="w-full resize-none rounded-2xl bg-white/70 dark:bg-zinc-800/70 border border-white/60 dark:border-white/10 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-purple-400/50 transition-all mb-3"></textarea>
    <input v-model="form.avatarUrl" placeholder="头像 URL（可选）" class="w-full h-11 px-4 rounded-2xl bg-white/70 dark:bg-zinc-800/70 border border-white/60 dark:border-white/10 text-sm outline-none focus:ring-2 focus:ring-purple-400/50 transition-all mb-3" />
    <input v-model.number="form.maxMembers" type="number" placeholder="成员上限（默认 500）" class="w-full h-11 px-4 rounded-2xl bg-white/70 dark:bg-zinc-800/70 border border-white/60 dark:border-white/10 text-sm outline-none focus:ring-2 focus:ring-purple-400/50 transition-all mb-5" />
    <button class="w-full h-11 rounded-2xl bg-gradient-to-r from-purple-400 to-fuchsia-600 text-white text-sm font-medium hover: active:scale-[0.98] transition-all disabled:opacity-50" :disabled="creating || !form.name.trim()" @click="create">
      {{ creating ? '创建中...' : '创建社区' }}
    </button>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { createCircle } from '@/api/publish'
import { removeDraft } from '@/utils/drafts'
import { useToastStore } from '@/stores/toast'

const props = defineProps({
  draft: { type: Object, default: null }
})

const router = useRouter()
const toast = useToastStore()

const form = ref({ name: '', description: '', avatarUrl: '', maxMembers: null })
const creating = ref(false)
const draftId = ref('')

watch(() => props.draft, (d) => {
  if (!d) return
  draftId.value = d.id
  if (d.form) form.value = { ...form.value, ...d.form }
}, { immediate: true })

async function create() {
  if (creating.value) return
  creating.value = true
  try {
    await createCircle({
      name: form.value.name.trim(),
      description: form.value.description.trim(),
      avatarUrl: form.value.avatarUrl.trim() || undefined,
      maxMembers: form.value.maxMembers || 500
    })
    toast.push('社区创建成功', 'success')
    if (draftId.value) { removeDraft(draftId.value); draftId.value = '' }
    router.push('/circles')
  } catch (e) {
    toast.push('创建失败，请稍后重试', 'error')
  } finally {
    creating.value = false
  }
}
</script>
