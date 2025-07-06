import { test, expect } from '@playwright/test'

test.describe('Supabase Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should redirect to login page when not authenticated', async ({ page }) => {
    await expect(page).toHaveURL('/login')
    await expect(page.locator('h1')).toContainText('Welcome to Puzzlator')
  })

  test('should show sign in and sign up tabs', async ({ page }) => {
    await expect(page.locator('button:has-text("Sign In")')).toBeVisible()
    await expect(page.locator('button:has-text("Sign Up")')).toBeVisible()
  })

  test('should switch between sign in and sign up modes', async ({ page }) => {
    // Initially in sign in mode
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('input[placeholder="coolpuzzler123"]')).not.toBeVisible()

    // Switch to sign up mode
    await page.click('button:has-text("Sign Up")')
    await expect(page.locator('input[placeholder="coolpuzzler123"]')).toBeVisible()
  })

  test('should show OAuth login options', async ({ page }) => {
    await expect(page.locator('button:has-text("Google")')).toBeVisible()
    await expect(page.locator('button:has-text("GitHub")')).toBeVisible()
  })

  test('should show guest login option', async ({ page }) => {
    await expect(page.locator('button:has-text("Continue as guest")')).toBeVisible()
  })

  test('should validate required fields', async ({ page }) => {
    // Try to submit without filling fields
    await page.click('button:has-text("Sign In")')
    
    // Check HTML5 validation
    const emailInput = page.locator('input[type="email"]')
    const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid)
    expect(isInvalid).toBe(true)
  })

  test('should show forgot password modal', async ({ page }) => {
    await page.click('button:has-text("Forgot password?")')
    await expect(page.locator('h3:has-text("Reset Password")')).toBeVisible()
    await expect(page.locator('text=Enter your email and we\'ll send you a link')).toBeVisible()
    
    // Close modal
    await page.click('button:has-text("Cancel")')
    await expect(page.locator('h3:has-text("Reset Password")')).not.toBeVisible()
  })

  test('should show magic link modal', async ({ page }) => {
    await page.click('button:has-text("Send me a link")')
    await expect(page.locator('h3:has-text("Sign in with Magic Link")')).toBeVisible()
    await expect(page.locator('text=We\'ll send you a link to sign in')).toBeVisible()
    
    // Close modal
    await page.click('button:has-text("Cancel")')
    await expect(page.locator('h3:has-text("Sign in with Magic Link")')).not.toBeVisible()
  })

  test('should handle demo login', async ({ page }) => {
    // Click continue as guest
    await page.click('button:has-text("Continue as guest")')
    
    // Should show loading state
    await expect(page.locator('text=Processing...')).toBeVisible()
    
    // Note: Actual navigation would depend on Supabase being configured
    // In a real test environment, we'd mock the Supabase responses
  })

  test('should show proper branding', async ({ page }) => {
    // Check logo
    await expect(page.locator('.inline-flex.items-center.justify-center span:has-text("P")')).toBeVisible()
    
    // Check title
    await expect(page.locator('h1:has-text("Welcome to Puzzlator")')).toBeVisible()
    
    // Check subtitle
    await expect(page.locator('text=Sign in to continue your puzzle journey')).toBeVisible()
  })

  test('should have responsive design', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await expect(page.locator('h1:has-text("Welcome to Puzzlator")')).toBeVisible()
    await expect(page.locator('button:has-text("Sign In")')).toBeVisible()
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 })
    await expect(page.locator('h1:has-text("Welcome to Puzzlator")')).toBeVisible()
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 })
    await expect(page.locator('h1:has-text("Welcome to Puzzlator")')).toBeVisible()
  })
})

test.describe('Authenticated User Flow', () => {
  // Mock authenticated state
  test.use({
    storageState: {
      cookies: [],
      origins: [{
        origin: 'http://localhost:3000',
        localStorage: [{
          name: 'supabase.auth.token',
          value: JSON.stringify({
            access_token: 'mock-token',
            refresh_token: 'mock-refresh',
            expires_at: Date.now() + 3600000
          })
        }]
      }]
    }
  })

  test.skip('should show navigation for authenticated users', async ({ page }) => {
    // Skip this test as it requires actual Supabase setup
    await page.goto('/')
    await expect(page.locator('nav')).toBeVisible()
    await expect(page.locator('a:has-text("Play")')).toBeVisible()
    await expect(page.locator('a:has-text("Leaderboard")')).toBeVisible()
    await expect(page.locator('button:has-text("Sign Out")')).toBeVisible()
  })
})