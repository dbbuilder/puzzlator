import { test, expect } from '@playwright/test'

test.describe('Puzzlator.com Production Check', () => {
  test('production site is accessible', async ({ page }) => {
    // Visit the production site
    const response = await page.goto('https://puzzlator.com', { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    })
    
    // Check that we got a successful response
    expect(response?.status()).toBeLessThan(400)
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'production-check.png', fullPage: true })
    
    // Check that some content is visible
    const bodyText = await page.textContent('body')
    expect(bodyText).toBeTruthy()
    
    console.log('Production site status:', response?.status())
    console.log('Page title:', await page.title())
    console.log('Page URL:', page.url())
  })
})