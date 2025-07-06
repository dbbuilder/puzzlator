<template>
  <div class="range-slider">
    <input
      type="range"
      :value="modelValue"
      :min="min"
      :max="max"
      :step="step"
      @input="handleInput"
      class="slider"
    />
    <span class="value">{{ modelValue }}%</span>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: number
  min?: number
  max?: number
  step?: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', Number(target.value))
}
</script>

<style scoped>
.range-slider {
  @apply flex items-center gap-3;
}

.slider {
  @apply flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer;
}

.slider::-webkit-slider-thumb {
  @apply appearance-none w-4 h-4 bg-purple-600 rounded-full cursor-pointer hover:bg-purple-700 transition-colors;
}

.slider::-moz-range-thumb {
  @apply w-4 h-4 bg-purple-600 rounded-full cursor-pointer hover:bg-purple-700 transition-colors border-0;
}

.slider:focus {
  @apply outline-none;
}

.slider:focus::-webkit-slider-thumb {
  @apply ring-2 ring-purple-500 ring-offset-2;
}

.value {
  @apply text-sm text-gray-600 font-mono w-12 text-right;
}
</style>