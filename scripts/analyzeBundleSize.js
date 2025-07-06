#!/usr/bin/env node

/**
 * Bundle Size Analyzer
 * Analyzes the production bundle and provides optimization recommendations
 */

import { readFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'
import { gzipSync } from 'zlib'

const DIST_DIR = './dist'
const SIZE_THRESHOLD = 100 * 1024 // 100KB

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function analyzeFile(filePath) {
  const stats = statSync(filePath)
  const content = readFileSync(filePath)
  const gzipped = gzipSync(content)
  
  return {
    path: filePath,
    size: stats.size,
    gzipSize: gzipped.length,
    ratio: (gzipped.length / stats.size * 100).toFixed(1) + '%'
  }
}

function getAllFiles(dir, files = []) {
  const items = readdirSync(dir)
  
  for (const item of items) {
    const fullPath = join(dir, item)
    const stat = statSync(fullPath)
    
    if (stat.isDirectory()) {
      getAllFiles(fullPath, files)
    } else if (item.endsWith('.js') || item.endsWith('.css')) {
      files.push(fullPath)
    }
  }
  
  return files
}

function analyzeBundle() {
  console.log('🔍 Analyzing bundle size...\n')
  
  const files = getAllFiles(DIST_DIR)
  const analysis = files.map(analyzeFile)
    .sort((a, b) => b.size - a.size)
  
  // Group by type
  const jsFiles = analysis.filter(f => f.path.endsWith('.js'))
  const cssFiles = analysis.filter(f => f.path.endsWith('.css'))
  
  // Calculate totals
  const totalSize = analysis.reduce((sum, f) => sum + f.size, 0)
  const totalGzip = analysis.reduce((sum, f) => sum + f.gzipSize, 0)
  
  // Large files
  const largeFiles = analysis.filter(f => f.size > SIZE_THRESHOLD)
  
  console.log('📊 Bundle Analysis Report')
  console.log('========================\n')
  
  console.log(`Total Size: ${formatBytes(totalSize)}`)
  console.log(`Total Gzip: ${formatBytes(totalGzip)} (${(totalGzip / totalSize * 100).toFixed(1)}%)\n`)
  
  console.log('📦 Largest Files:')
  console.log('-----------------')
  largeFiles.slice(0, 10).forEach(file => {
    const name = file.path.replace(DIST_DIR + '/', '')
    console.log(`${name}`)
    console.log(`  Size: ${formatBytes(file.size)} | Gzip: ${formatBytes(file.gzipSize)} (${file.ratio})`)
  })
  
  console.log('\n🎯 Optimization Opportunities:')
  console.log('-----------------------------')
  
  // Check for Phaser
  const phaserFile = analysis.find(f => f.path.includes('phaser'))
  if (phaserFile) {
    console.log(`\n1. Phaser.js Bundle (${formatBytes(phaserFile.size)})`)
    console.log('   - Consider creating a custom Phaser build')
    console.log('   - Exclude unused modules: Physics, Sound, Tilemap')
    console.log('   - Use Canvas renderer only (remove WebGL)')
    console.log('   - Potential savings: ~40-50% of current size')
  }
  
  // Check for large vendor chunks
  const vendorFiles = analysis.filter(f => f.path.includes('vendor'))
  if (vendorFiles.length > 0) {
    console.log('\n2. Vendor Chunks')
    vendorFiles.forEach(v => {
      const name = v.path.split('/').pop()
      console.log(`   - ${name}: ${formatBytes(v.size)}`)
    })
    console.log('   - Consider code splitting for large libraries')
    console.log('   - Use dynamic imports for route-specific code')
  }
  
  // Check CSS
  const totalCss = cssFiles.reduce((sum, f) => sum + f.size, 0)
  if (totalCss > 50 * 1024) {
    console.log(`\n3. CSS Bundle (${formatBytes(totalCss)})`)
    console.log('   - Enable CSS purging in production')
    console.log('   - Remove unused Tailwind utilities')
    console.log('   - Consider critical CSS extraction')
  }
  
  // Recommendations based on total size
  console.log('\n💡 General Recommendations:')
  console.log('-------------------------')
  
  if (totalSize > 2 * 1024 * 1024) {
    console.log('- Total bundle exceeds 2MB (uncompressed)')
    console.log('- Consider lazy loading more routes')
    console.log('- Implement progressive enhancement')
  }
  
  console.log('- Enable Brotli compression on server (better than gzip)')
  console.log('- Use HTTP/2 push for critical resources')
  console.log('- Implement resource hints (preload, prefetch)')
  console.log('- Consider using a CDN for static assets')
  
  // Module-specific recommendations
  console.log('\n🔧 Module-Specific Optimizations:')
  console.log('--------------------------------')
  console.log('- Replace Lucide icons with custom SVG sprites')
  console.log('- Tree-shake Supabase client (import only used methods)')
  console.log('- Lazy load Vue components with defineAsyncComponent')
  console.log('- Use Web Workers for puzzle generation')
  
  console.log('\n✅ Bundle analysis complete!')
}

// Run analysis
analyzeBundle()