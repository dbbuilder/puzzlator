<template>
  <div class="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
    <div class="text-center">
      <h1 class="text-6xl font-bold text-gray-800 mb-4">404</h1>
      <p class="text-xl text-gray-600 mb-8">Page not found</p>
      <button
        @click="$router.push('/')"
        class="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
      >
        Go Home
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
</script>