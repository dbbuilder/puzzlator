/**
 * Lazy load Phaser to reduce initial bundle size
 * 
 * This module acts as a lightweight wrapper that:
 * 1. Loads Phaser only when needed
 * 2. Shows loading progress
 * 3. Caches the loaded module
 */

let phaserModule: typeof import('phaser') | null = null
let loadingPromise: Promise<typeof import('phaser')> | null = null

export async function loadPhaser(onProgress?: (percent: number) => void) {
  if (phaserModule) {
    return phaserModule
  }

  if (loadingPromise) {
    return loadingPromise
  }

  loadingPromise = new Promise(async (resolve, reject) => {
    try {
      // Simulate progress for better UX
      if (onProgress) {
        onProgress(10)
        setTimeout(() => onProgress && onProgress(40), 50)
        setTimeout(() => onProgress && onProgress(70), 100)
      }

      // Dynamic import with webpack hints
      const module = await import(
        /* webpackChunkName: "phaser" */
        /* webpackPrefetch: true */
        'phaser'
      )
      
      phaserModule = module.default || module
      
      if (onProgress) {
        onProgress(100)
      }
      
      resolve(phaserModule)
    } catch (error) {
      loadingPromise = null
      reject(error)
    }
  })

  return loadingPromise
}

// Pre-load Phaser when user is likely to play a game
export function preloadPhaser() {
  if (typeof window === 'undefined' || phaserModule) {
    return
  }

  // Use requestIdleCallback for non-blocking preload
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(() => {
      loadPhaser().catch(() => {
        // Silent fail - will load when needed
      })
    }, { timeout: 2000 })
  } else {
    // Fallback
    setTimeout(() => {
      loadPhaser().catch(() => {
        // Silent fail - will load when needed
      })
    }, 500)
  }
}