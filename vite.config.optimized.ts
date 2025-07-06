import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { visualizer } from 'rollup-plugin-visualizer'
import viteCompression from 'vite-plugin-compression'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    // Compress assets with gzip and brotli
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 10240 // Only compress files > 10KB
    }),
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br',
      threshold: 10240
    }),
    // Bundle visualization (only in analyze mode)
    process.env.ANALYZE && visualizer({
      open: true,
      filename: 'dist/bundle-stats.html',
      gzipSize: true,
      brotliSize: true
    })
  ].filter(Boolean),
  
  base: '/',
  
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      // Use optimized Phaser loading
      'phaser': resolve(__dirname, 'src/utils/loadPhaser.ts')
    },
  },
  
  server: {
    port: 14000,
    host: true,
    open: true,
  },
  
  build: {
    target: 'esnext',
    sourcemap: true,
    minify: 'terser',
    
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        passes: 2,
        pure_funcs: ['console.log', 'console.info', 'console.debug']
      },
      mangle: {
        safari10: true
      },
      format: {
        comments: false
      }
    },
    
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Phaser should be its own chunk
          if (id.includes('phaser')) {
            return 'phaser'
          }
          
          // Core Vue ecosystem
          if (id.includes('node_modules')) {
            if (id.includes('vue') || id.includes('vue-router') || id.includes('pinia')) {
              return 'vue-vendor'
            }
            
            // Supabase
            if (id.includes('@supabase')) {
              return 'supabase'
            }
            
            // UI libraries
            if (id.includes('lucide') || id.includes('toastification')) {
              return 'ui-vendor'
            }
            
            // Other large libraries
            if (id.includes('openai')) {
              return 'ai-vendor'
            }
          }
          
          // Game-specific code
          if (id.includes('src/game/')) {
            return 'game-engine'
          }
          
          // Store modules
          if (id.includes('src/stores/')) {
            return 'stores'
          }
        },
        
        // Better chunk naming
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop() : 'chunk'
          return `assets/js/${chunkInfo.name}-[hash].js`
        },
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
        
        // Optimize for HTTP/2
        compact: true
      },
      
      // External dependencies (if using CDN)
      external: process.env.USE_CDN ? ['phaser'] : [],
      
      // Tree shaking
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
        tryCatchDeoptimization: false
      }
    },
    
    // CSS optimizations
    cssCodeSplit: true,
    cssMinify: 'lightningcss',
    
    // Increase warning limit for Phaser
    chunkSizeWarningLimit: 1500,
    
    // Asset inlining threshold
    assetsInlineLimit: 4096, // 4KB
    
    // Report compressed size
    reportCompressedSize: true
  },
  
  optimizeDeps: {
    include: [
      'vue',
      'vue-router',
      'pinia',
      '@supabase/supabase-js'
    ],
    exclude: [
      'phaser' // Load on demand
    ],
    esbuildOptions: {
      target: 'esnext'
    }
  },
  
  // CSS optimizations
  css: {
    postcss: {
      plugins: [
        // Add postcss-import and postcss-url for better CSS handling
      ]
    },
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@/styles/variables.scss";`
      }
    }
  },
  
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    __OPTIMIZE_PHASER__: true
  },
  
  // PWA plugin would go here
  // pwa: { ... }
})