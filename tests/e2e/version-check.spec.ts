import { test, expect } from '@playwright/test'

test.describe('Version Check', () => {
  test('should display current version on login page', async ({ page }) => {
    // Visit production site
    await page.goto('https://puzzlator.com')
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle')
    
    // Look for version info
    const versionElement = await page.locator('text=/v\\d+\\.\\d+\\.\\d+/')
    await expect(versionElement).toBeVisible({ timeout: 10000 })
    
    // Get the version text
    const versionText = await versionElement.textContent()
    console.log('Production version:', versionText)
    
    // Check for build number
    const buildElement = await page.locator('text=/#\\d+/')
    if (await buildElement.isVisible()) {
      const buildText = await buildElement.textContent()
      console.log('Build info:', buildText)
    }
    
    // Verify it's the expected version
    expect(versionText).toContain('v0.3.1')
    
    // Take screenshot for verification
    await page.screenshot({ 
      path: 'production-version-check.png', 
      fullPage: true 
    })
  })
  
  test('should have working Supabase auth UI', async ({ page }) => {
    await page.goto('https://puzzlator.com')
    
    // Check for Supabase auth elements
    await expect(page.locator('text=Welcome to Puzzlator')).toBeVisible()
    await expect(page.locator('button:has-text("Sign In")')).toBeVisible()
    await expect(page.locator('button:has-text("Sign Up")')).toBeVisible()
    
    // Check for OAuth providers
    await expect(page.locator('button:has-text("Google")')).toBeVisible()
    await expect(page.locator('button:has-text("GitHub")')).toBeVisible()
    
    // Check for guest login
    await expect(page.locator('text=Continue as guest')).toBeVisible()
  })
})