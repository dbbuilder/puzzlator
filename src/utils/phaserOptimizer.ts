/**
 * Phaser Bundle Optimizer
 * 
 * This module provides strategies to reduce Phaser's bundle size
 * by loading only the required components.
 */

// Type definitions for Phaser components we use
export interface OptimizedPhaser {
  Game: typeof import('phaser').Game
  Scene: typeof import('phaser').Scene
  AUTO: typeof import('phaser').AUTO
  GameObjects: {
    Container: typeof import('phaser').GameObjects.Container
    Graphics: typeof import('phaser').GameObjects.Graphics
    Text: typeof import('phaser').GameObjects.Text
    Rectangle: typeof import('phaser').GameObjects.Rectangle
    Image: typeof import('phaser').GameObjects.Image
    Sprite: typeof import('phaser').GameObjects.Sprite
  }
  Input: {
    Events: typeof import('phaser').Input.Events
  }
  Math: {
    Between: typeof import('phaser').Math.Between
    Distance: typeof import('phaser').Math.Distance
    Vector2: typeof import('phaser').Math.Vector2
  }
  Display: {
    Color: typeof import('phaser').Display.Color
  }
  Tweens: {
    Builders: {
      TweenBuilderConfig: import('phaser').Types.Tweens.TweenBuilderConfig
    }
  }
}

// Cache for loaded Phaser instance
let phaserCache: OptimizedPhaser | null = null

/**
 * Load only the Phaser components we actually use
 * This reduces the bundle size significantly
 */
export async function loadOptimizedPhaser(): Promise<OptimizedPhaser> {
  if (phaserCache) {
    return phaserCache
  }

  // For now, we still load the full Phaser bundle
  // In a future optimization, we could use a custom Phaser build
  // that excludes unused systems like Physics, Sound, etc.
  const Phaser = await import('phaser')
  
  phaserCache = {
    Game: Phaser.Game,
    Scene: Phaser.Scene,
    AUTO: Phaser.AUTO,
    GameObjects: {
      Container: Phaser.GameObjects.Container,
      Graphics: Phaser.GameObjects.Graphics,
      Text: Phaser.GameObjects.Text,
      Rectangle: Phaser.GameObjects.Rectangle,
      Image: Phaser.GameObjects.Image,
      Sprite: Phaser.GameObjects.Sprite
    },
    Input: {
      Events: Phaser.Input.Events
    },
    Math: {
      Between: Phaser.Math.Between,
      Distance: Phaser.Math.Distance,
      Vector2: Phaser.Math.Vector2
    },
    Display: {
      Color: Phaser.Display.Color
    },
    Tweens: {
      Builders: {
        TweenBuilderConfig: {} as any
      }
    }
  }

  return phaserCache
}

/**
 * Create a custom Phaser config that disables unused features
 */
export function createOptimizedConfig(baseConfig: any): any {
  return {
    ...baseConfig,
    // Disable unused systems
    audio: {
      noAudio: true  // We don't use audio yet
    },
    physics: {
      default: undefined  // We don't use physics
    },
    plugins: {
      scene: [],  // Remove unused scene plugins
      global: []  // Remove unused global plugins
    },
    // Optimize rendering
    render: {
      ...baseConfig.render,
      antialias: false,  // Disable for pixel-perfect rendering
      pixelArt: true,    // Enable pixel art mode
      powerPreference: 'low-power'  // Prefer battery life on mobile
    }
  }
}

/**
 * Preload critical Phaser assets
 */
export async function preloadPhaserAssets(): Promise<void> {
  // This could be used to preload sprites, fonts, etc.
  // Currently we generate most graphics programmatically
}

/**
 * Get bundle size reduction recommendations
 */
export function getPhaserOptimizationTips(): string[] {
  return [
    '1. Use a custom Phaser build excluding unused modules (Physics, Sound, etc.)',
    '2. Load Phaser only when entering game routes',
    '3. Consider using Canvas-only renderer (remove WebGL) for simple puzzles',
    '4. Use SVG or CSS for UI elements instead of Phaser GameObjects',
    '5. Implement virtual scrolling for large puzzle grids',
    '6. Use Web Workers for puzzle generation/validation'
  ]
}