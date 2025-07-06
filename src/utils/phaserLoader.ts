/**
 * Optimized Phaser Loader
 * 
 * This module provides a wrapper around Phaser that:
 * 1. Loads Phaser only when needed
 * 2. Provides a smaller API surface
 * 3. Enables better tree-shaking
 */

// Type definitions for our minimal Phaser usage
export interface PhaserConfig {
  type: number
  parent: string | HTMLElement
  width: number
  height: number
  backgroundColor?: string
  scene?: any[]
  scale?: any
  render?: any
}

export interface PhaserGame {
  scene: {
    add: (key: string, scene: any) => void
    start: (key: string, data?: any) => void
  }
  destroy: (removeCanvas?: boolean) => void
}

export interface PhaserScene {
  add: any
  input: any
  tweens: any
  events: any
  game: any
  scene: any
  cameras: any
  sys: any
}

// Lazy-loaded Phaser reference
let PhaserModule: any = null
let loadingPromise: Promise<any> | null = null

/**
 * Load Phaser dynamically with progress tracking
 */
export async function loadPhaser(onProgress?: (percent: number) => void): Promise<typeof import('phaser')> {
  if (PhaserModule) {
    return PhaserModule
  }

  if (loadingPromise) {
    return loadingPromise
  }

  loadingPromise = new Promise(async (resolve, reject) => {
    try {
      // Simulate progress (in reality, we can't track dynamic import progress)
      if (onProgress) {
        onProgress(0)
        setTimeout(() => onProgress(30), 50)
        setTimeout(() => onProgress(60), 100)
      }

      // Dynamic import with webpack magic comments for better caching
      PhaserModule = await import(
        /* webpackChunkName: "phaser" */
        /* webpackPreload: true */
        'phaser'
      )

      if (onProgress) {
        onProgress(100)
      }

      resolve(PhaserModule)
    } catch (error) {
      reject(error)
    }
  })

  return loadingPromise
}

/**
 * Create a minimal Phaser game instance
 */
export async function createPhaserGame(config: PhaserConfig): Promise<PhaserGame> {
  const Phaser = await loadPhaser()
  
  // Apply optimizations to config
  const optimizedConfig = {
    ...config,
    type: config.type || Phaser.AUTO,
    
    // Disable unused features
    audio: {
      noAudio: true
    },
    
    // Optimize rendering
    render: {
      antialias: false,
      pixelArt: true,
      powerPreference: 'low-power',
      ...config.render
    },
    
    // Disable physics by default
    physics: {
      default: undefined
    },
    
    // Scale configuration for responsive design
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      ...config.scale
    }
  }

  return new Phaser.Game(optimizedConfig)
}

/**
 * Create a Phaser scene class
 */
export async function createScene(name: string, methods: any): Promise<any> {
  const Phaser = await loadPhaser()
  
  return class extends Phaser.Scene {
    constructor() {
      super({ key: name })
      Object.assign(this, methods)
    }
  }
}

/**
 * Preload Phaser in the background for faster game loading
 */
export function preloadPhaserAsync(): void {
  if (typeof window === 'undefined' || PhaserModule) {
    return
  }

  // Use requestIdleCallback for non-blocking preload
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(() => {
      loadPhaser().catch(console.error)
    }, { timeout: 3000 })
  } else {
    // Fallback for browsers without requestIdleCallback
    setTimeout(() => {
      loadPhaser().catch(console.error)
    }, 1000)
  }
}

/**
 * Get commonly used Phaser constants without loading the full library
 */
export const PhaserConstants = {
  AUTO: 0,
  CANVAS: 1,
  WEBGL: 2,
  HEADLESS: 3,
  
  // Common blend modes
  BlendModes: {
    NORMAL: 0,
    ADD: 1,
    MULTIPLY: 2,
    SCREEN: 3
  },
  
  // Common scale modes
  ScaleModes: {
    DEFAULT: 0,
    LINEAR: 0,
    NEAREST: 1
  }
}

/**
 * Utility to check if Phaser is loaded
 */
export function isPhaserLoaded(): boolean {
  return PhaserModule !== null
}

/**
 * Unload Phaser to free memory (useful for SPAs)
 */
export function unloadPhaser(): void {
  PhaserModule = null
  loadingPromise = null
  
  // Clear module from webpack cache if possible
  if (typeof module !== 'undefined' && module.hot) {
    module.hot.dispose(() => {
      PhaserModule = null
    })
  }
}