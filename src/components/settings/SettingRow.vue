<template>
  <div 
    class="setting-row"
    :class="{ 'opacity-50 pointer-events-none': disabled }"
  >
    <label class="setting-label">
      {{ label }}
      <span v-if="description" class="setting-description">
        {{ description }}
      </span>
    </label>
    <div class="setting-control">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label: string
  description?: string
  disabled?: boolean
}>()
</script>

<style scoped>
.setting-row {
  @apply flex items-center justify-between py-2;
}

.setting-label {
  @apply flex-1 text-gray-700;
}

.setting-description {
  @apply block text-sm text-gray-500 font-normal mt-1;
}

.setting-control {
  @apply flex-shrink-0 ml-4;
}
</style>