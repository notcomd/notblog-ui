<template>
  <router-view class="min-h-screen" />
  <ToastHost />
</template>

<script lang="ts">
import ToastHost from '@/components/common/ToastHost.vue'

export default {
  name: 'App',
  components: { ToastHost }
}
</script>
