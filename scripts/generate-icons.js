#!/usr/bin/env node

/**
 * Generate PWA icons from SVG source
 * This creates placeholder icons for development
 * For production, use proper design tools to create optimized icons
 */

import { writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const sizes = [72, 96, 128, 144, 152, 192, 384, 512]

// Simple SVG template with size parameter
function generateSVG(size) {
  const borderRadius = Math.round(size * 0.22) // 22% border radius
  const innerSize = Math.round(size * 0.25) // 25% for inner squares
  const innerGap = Math.round(size * 0.06) // 6% gap
  const innerStart = Math.round(size * 0.19) // 19% from edge
  const fontSize = Math.round(size * 0.35) // 35% font size
  const textY = Math.round(size * 0.57) // 57% vertical position
  
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${borderRadius}" fill="#7C3AED"/>
  <g opacity="0.9">
    <rect x="${innerStart}" y="${innerStart}" width="${innerSize}" height="${innerSize}" rx="${size * 0.03}" fill="white"/>
    <rect x="${innerStart + innerSize + innerGap}" y="${innerStart}" width="${innerSize}" height="${innerSize}" rx="${size * 0.03}" fill="white" opacity="0.8"/>
    <rect x="${innerStart}" y="${innerStart + innerSize + innerGap}" width="${innerSize}" height="${innerSize}" rx="${size * 0.03}" fill="white" opacity="0.8"/>
    <rect x="${innerStart + innerSize + innerGap}" y="${innerStart + innerSize + innerGap}" width="${innerSize}" height="${innerSize}" rx="${size * 0.03}" fill="white" opacity="0.6"/>
  </g>
  <text x="${size / 2}" y="${textY}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="bold" fill="#7C3AED">P</text>
</svg>`
}

// Generate icons
console.log('Generating PWA icons...')

sizes.forEach(size => {
  const svg = generateSVG(size)
  const outputPath = join(__dirname, '..', 'public', 'assets', 'images', `icon-${size}.png`)
  
  // For now, we'll save as SVG files
  // In production, you'd use a library like sharp or svg2png to convert to PNG
  const svgPath = outputPath.replace('.png', '.svg')
  writeFileSync(svgPath, svg)
  
  console.log(`Created icon-${size}.svg`)
})

// Also create special iOS icons
const iosIcon = generateSVG(180)
writeFileSync(join(__dirname, '..', 'public', 'assets', 'images', 'apple-touch-icon.svg'), iosIcon)
console.log('Created apple-touch-icon.svg')

// Create maskable icon (with safe area padding)
function generateMaskableSVG(size) {
  const safeArea = size * 0.8 // 80% safe area
  const padding = (size - safeArea) / 2
  const borderRadius = Math.round(safeArea * 0.22)
  
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#7C3AED"/>
  <rect x="${padding}" y="${padding}" width="${safeArea}" height="${safeArea}" rx="${borderRadius}" fill="#6D28D9"/>
  <text x="${size / 2}" y="${size * 0.57}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${size * 0.28}" font-weight="bold" fill="white">P</text>
</svg>`
}

const maskableSVG = generateMaskableSVG(512)
writeFileSync(join(__dirname, '..', 'public', 'assets', 'images', 'icon-maskable.svg'), maskableSVG)
console.log('Created icon-maskable.svg')

console.log('\nNote: These are placeholder SVG icons.')
console.log('For production, convert these to PNG format using a tool like:')
console.log('- ImageMagick: convert icon-512.svg icon-512.png')
console.log('- Online tool: https://cloudconvert.com/svg-to-png')
console.log('- Node library: npm install sharp')