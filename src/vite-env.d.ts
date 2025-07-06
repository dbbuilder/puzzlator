/// <reference types="vite/client" />

declare const __APP_VERSION__: string
declare const __OPTIMIZE_PHASER__: boolean

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_SENTRY_DSN: string
  readonly VITE_SENTRY_DEBUG: string
  readonly VITE_OPENAI_API_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}