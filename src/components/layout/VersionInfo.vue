<template>
  <div class="version-info" :class="{ expanded: isExpanded }" @click="toggleExpanded">
    <span class="version-text">v{{ version }}</span>
    <div v-if="isExpanded" class="version-details">
      <p>Build: {{ buildDate }}</p>
      <p>Environment: {{ environment }}</p>
      <p v-if="deploymentInfo.url">
        <a :href="deploymentInfo.url" target="_blank" rel="noopener">
          View on Vercel →
        </a>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const isExpanded = ref(false)

// Version from package.json (injected at build time)
const version = computed(() => __APP_VERSION__ || '0.0.0')

// Build date
const buildDate = computed(() => {
  // In production, this would be injected at build time
  return new Date().toLocaleDateString()
})

// Environment
const environment = computed(() => {
  if (import.meta.env.PROD) return 'production'
  if (import.meta.env.DEV) return 'development'
  return 'unknown'
})

// Deployment info (would be injected via env vars in production)
const deploymentInfo = computed(() => ({
  url: import.meta.env.VITE_DEPLOYMENT_URL || '',
  commit: import.meta.env.VITE_COMMIT_SHA || ''
}))

function toggleExpanded() {
  isExpanded.value = !isExpanded.value
}
</script>

<style scoped>
.version-info {
  @apply fixed bottom-4 right-4 text-xs text-gray-500 bg-white/80 backdrop-blur-sm rounded-lg px-3 py-2 shadow-sm cursor-pointer transition-all;
}

.version-info:hover {
  @apply bg-white shadow-md;
}

.version-info.expanded {
  @apply bg-white shadow-lg;
}

.version-text {
  @apply font-mono;
}

.version-details {
  @apply mt-2 pt-2 border-t border-gray-200 space-y-1;
}

.version-details p {
  @apply text-xs text-gray-600;
}

.version-details a {
  @apply text-purple-600 hover:text-purple-700 underline;
}

/* Hide in print */
@media print {
  .version-info {
    display: none;
  }
}
</style>