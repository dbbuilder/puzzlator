import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 14000,
    host: true, // Listen on all interfaces
    open: true,
  },
  build: {
    target: 'esnext',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue', 'vue-router', 'pinia'],
          // supabase: ['@supabase/supabase-js'], // Disabled - using custom auth
          phaser: ['phaser'],
          ai: ['openai'],
        },
      },
    },
  },
  optimizeDeps: {
    include: ['phaser'],
  },
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  },
})
