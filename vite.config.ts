import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  base: '/',
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
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          // Core Vue ecosystem
          'vue-vendor': ['vue', 'vue-router', 'pinia'],
          // Supabase client
          'supabase': ['@supabase/supabase-js'],
          // Phaser game engine (largest dependency)
          'phaser': ['phaser'],
          // UI components
          'ui-vendor': ['lucide-vue-next', 'vue-toastification'],
        },
        // Better chunk naming
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]'
      },
    },
    // Increase warning limit for Phaser
    chunkSizeWarningLimit: 1500
  },
  optimizeDeps: {
    include: ['phaser'],
  },
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  },
})
