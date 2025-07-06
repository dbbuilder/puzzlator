import { test, expect } from '@playwright/test'

test('check production deployment', async ({ page }) => {
  // Go to the production site
  await page.goto('https://www.puzzlator.com', { 
    waitUntil: 'domcontentloaded',
    timeout: 30000 
  })
  
  // Get page content
  const content = await page.content()
  
  // Look for version in the HTML
  const versionMatch = content.match(/v(\d+\.\d+\.\d+)/)
  const buildMatch = content.match(/#(\d+)/)
  
  console.log('Page title:', await page.title())
  console.log('Page URL:', page.url())
  console.log('Version found:', versionMatch ? versionMatch[0] : 'Not found')
  console.log('Build found:', buildMatch ? buildMatch[0] : 'Not found')
  
  // Check if we're on the login page
  const hasLoginElements = await page.locator('input[type="email"], text=/sign|login/i').count()
  console.log('Login elements found:', hasLoginElements)
  
  // Take screenshot
  await page.screenshot({ path: 'deployment-check.png', fullPage: true })
  
  // Basic assertion
  expect(await page.title()).toContain('Puzzlator')
})