<template>
  <div class="setting-section">
    <h3 class="text-lg font-semibold text-gray-800 mb-4">{{ title }}</h3>
    <div class="space-y-3">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
}>()
</script>

<style scoped>
.setting-section {
  @apply pb-6 border-b border-gray-200 last:border-0 last:pb-0;
}
</style>