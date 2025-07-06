// Lazy load Phaser to reduce initial bundle size
let phaserModule: typeof import('phaser') | null = null

export async function loadPhaser() {
  if (!phaserModule) {
    phaserModule = await import('phaser')
  }
  return phaserModule.default || phaserModule
}

// Pre-load Phaser when user is likely to play a game
export function preloadPhaser() {
  // Start loading in the background
  loadPhaser().catch(console.error)
}