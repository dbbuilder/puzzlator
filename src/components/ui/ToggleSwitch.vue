<template>
  <button
    @click="toggle"
    :class="[
      'toggle-switch',
      modelValue ? 'toggle-switch-on' : 'toggle-switch-off'
    ]"
    :disabled="disabled"
    role="switch"
    :aria-checked="modelValue"
  >
    <span 
      :class="[
        'toggle-thumb',
        modelValue ? 'translate-x-5' : 'translate-x-0'
      ]"
    />
  </button>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: boolean
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

function toggle() {
  emit('update:modelValue', !props.modelValue)
}

const props = defineProps<{
  modelValue: boolean
  disabled?: boolean
}>()
</script>

<style scoped>
.toggle-switch {
  @apply relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2;
}

.toggle-switch-on {
  @apply bg-purple-600;
}

.toggle-switch-off {
  @apply bg-gray-200;
}

.toggle-switch:disabled {
  @apply opacity-50 cursor-not-allowed;
}

.toggle-thumb {
  @apply inline-block h-4 w-4 transform rounded-full bg-white transition-transform;
}
</style>