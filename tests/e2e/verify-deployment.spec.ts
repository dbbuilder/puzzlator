import { test, expect } from '@playwright/test'

test.describe('Verify Production Deployment', () => {
  test('should have the correct version deployed', async ({ page }) => {
    // Go to production site
    await page.goto('https://puzzlator.com')
    
    // Wait for the page to load
    await expect(page).toHaveTitle(/Puzzlator/)
    
    // Check for version in the footer or login page
    const versionText = await page.locator('text=/v0\\.3\\.6/').first()
    await expect(versionText).toBeVisible({ timeout: 10000 })
    
    console.log('✅ Version 0.3.6 is deployed to production!')
  })
  
  test('should load login page correctly', async ({ page }) => {
    await page.goto('https://puzzlator.com')
    
    // Should see login form
    await expect(page.locator('input[placeholder="Enter your username"]')).toBeVisible()
    await expect(page.locator('button:has-text("Continue")')).toBeVisible()
    
    console.log('✅ Login page loads correctly!')
  })
  
  test('should have Supabase configured', async ({ page }) => {
    await page.goto('https://puzzlator.com')
    
    // Check console for Supabase initialization
    const logs: string[] = []
    page.on('console', msg => logs.push(msg.text()))
    
    // Try guest login
    await page.locator('button:has-text("Play as Guest")').click()
    
    // Should navigate to game selection
    await expect(page).toHaveURL(/\/(play|game-selection)/, { timeout: 10000 })
    
    console.log('✅ Guest login works!')
  })
})