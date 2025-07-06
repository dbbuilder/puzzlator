#!/usr/bin/env node

/**
 * Check Vercel Deployment Status
 * 
 * This script checks the current deployment status and version
 * by making a request to the deployed application.
 */

import https from 'https'
import { readFileSync } from 'fs'

const DEPLOYMENT_URL = process.env.DEPLOYMENT_URL || 'https://puzzlator.vercel.app'
const LOCAL_VERSION = JSON.parse(readFileSync('./package.json', 'utf8')).version

console.log('🔍 Checking deployment status...\n')
console.log(`Local version: ${LOCAL_VERSION}`)
console.log(`Checking URL: ${DEPLOYMENT_URL}\n`)

// Function to make HTTPS request
function checkDeployment(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = ''
      
      res.on('data', (chunk) => {
        data += chunk
      })
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data
        })
      })
    }).on('error', reject)
  })
}

// Check main page
async function checkMainPage() {
  try {
    const response = await checkDeployment(DEPLOYMENT_URL)
    
    console.log('📊 Deployment Status:')
    console.log(`- Status Code: ${response.statusCode}`)
    console.log(`- Server: ${response.headers.server || 'Unknown'}`)
    console.log(`- Cache Status: ${response.headers['x-vercel-cache'] || 'N/A'}`)
    
    // Try to extract version from HTML
    const versionMatch = response.data.match(/v(\d+\.\d+\.\d+)/)
    if (versionMatch) {
      const deployedVersion = versionMatch[1]
      console.log(`- Deployed Version: ${deployedVersion}`)
      
      if (deployedVersion === LOCAL_VERSION) {
        console.log('\n✅ Deployment is up to date!')
      } else {
        console.log(`\n⚠️  Version mismatch! Deployed: ${deployedVersion}, Local: ${LOCAL_VERSION}`)
      }
    } else {
      console.log('- Deployed Version: Could not extract from HTML')
    }
    
  } catch (error) {
    console.error('❌ Failed to check deployment:', error.message)
  }
}

// Check API health (if available)
async function checkAPIHealth() {
  try {
    const apiUrl = `${DEPLOYMENT_URL}/api/health`
    const response = await checkDeployment(apiUrl)
    
    if (response.statusCode === 200) {
      console.log('\n🟢 API Health Check: OK')
      try {
        const health = JSON.parse(response.data)
        console.log(`- API Version: ${health.version || 'Unknown'}`)
        console.log(`- Status: ${health.status || 'Unknown'}`)
      } catch (e) {
        // Not JSON response
      }
    } else {
      console.log(`\n🟡 API Health Check: ${response.statusCode}`)
    }
  } catch (error) {
    console.log('\n🔶 API Health Check: Not available')
  }
}

// Check version endpoint (if implemented)
async function checkVersionEndpoint() {
  try {
    const versionUrl = `${DEPLOYMENT_URL}/version.json`
    const response = await checkDeployment(versionUrl)
    
    if (response.statusCode === 200) {
      const versionInfo = JSON.parse(response.data)
      console.log('\n📋 Version Endpoint:')
      console.log(`- Version: ${versionInfo.version}`)
      console.log(`- Build Date: ${versionInfo.buildDate}`)
      console.log(`- Commit: ${versionInfo.commit}`)
    }
  } catch (error) {
    // Version endpoint not available
  }
}

// Run all checks
async function runChecks() {
  await checkMainPage()
  await checkAPIHealth()
  await checkVersionEndpoint()
  
  console.log('\n📌 To see version info in the app, visit:')
  console.log(`   ${DEPLOYMENT_URL}?version`)
}

runChecks()