/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

// Environment variables type definitions
interface ImportMetaEnv {
  // Supabase disabled - using custom auth
  // readonly VITE_SUPABASE_URL: string
  // readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_APP_NAME: string
  readonly VITE_APP_VERSION: string
  readonly VITE_APP_ENV: 'development' | 'staging' | 'production'
  readonly VITE_ANALYTICS_ID?: string
  readonly VITE_SENTRY_DSN?: string
  readonly VITE_GOOGLE_CLIENT_ID?: string
  readonly VITE_GITHUB_CLIENT_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Global app version
declare const __APP_VERSION__: string

// Phaser.js global types
declare global {
  namespace Phaser {
    interface Scene {
      puzzleData?: any
      gameState?: any
    }
  }
}
