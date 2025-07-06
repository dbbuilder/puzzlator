#!/usr/bin/env node

/**
 * Generate version.json file with build information
 */

import { writeFileSync } from 'fs'
import { execSync } from 'child_process'
import { readFileSync } from 'fs'

const packageJson = JSON.parse(readFileSync('./package.json', 'utf8'))

// Get git information
let gitCommit = 'unknown'
let gitBranch = 'unknown'

try {
  gitCommit = execSync('git rev-parse --short HEAD').toString().trim()
  gitBranch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim()
} catch (e) {
  console.warn('Git information not available')
}

const versionInfo = {
  version: packageJson.version,
  name: packageJson.name,
  buildDate: new Date().toISOString(),
  commit: process.env.VITE_COMMIT_SHA || gitCommit,
  branch: gitBranch,
  environment: process.env.NODE_ENV || 'development',
  nodejs: process.version
}

// Write to public directory so it's served as static file
writeFileSync('./public/version.json', JSON.stringify(versionInfo, null, 2))

console.log('✅ Generated version.json:')
console.log(JSON.stringify(versionInfo, null, 2))