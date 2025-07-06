/**
 * Custom Phaser Build Configuration
 * 
 * This configuration creates a smaller Phaser bundle by excluding
 * features we don't use in our puzzle games.
 */

module.exports = {
  // Core systems we need
  banner: false,
  gameobjects: [
    'container',
    'graphics',
    'image',
    'sprite',
    'text',
    'rectangle',
    'group'
  ],
  
  // We don't use these systems
  audio: false,
  physics: false,
  tilemaps: false,
  particles: false,
  
  // Limit input methods
  input: {
    mouse: true,
    touch: true,
    keyboard: false,  // We don't use keyboard in puzzles
    gamepad: false
  },
  
  // Renderer options
  renderer: {
    webgl: true,     // Keep WebGL for better performance
    canvas: true     // Fallback for older devices
  },
  
  // Exclude unused plugins
  plugins: [
    'clock',
    'data',
    'gameobjectfactory',
    'gameobjectcreator',
    'loader',
    'tweenmanager',
    'lightsmanager'
  ],
  
  // Exclude unused features
  scale: true,
  scene: true,
  events: true,
  tweens: true,
  animations: false,  // We don't use sprite animations
  
  // Math utilities we use
  math: [
    'Between',
    'Distance',
    'Vector2',
    'Clamp',
    'Wrap'
  ]
}