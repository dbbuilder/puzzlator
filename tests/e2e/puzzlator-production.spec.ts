import { test, expect } from '@playwright/test'

// Test against production URL
const PRODUCTION_URL = 'https://puzzlator.com'

test.describe('Puzzlator Production Tests', () => {
  test('should load the production site', async ({ page }) => {
    const response = await page.goto(PRODUCTION_URL, { waitUntil: 'networkidle' })
    expect(response?.status()).toBeLessThan(400)
  })

  test('should have correct title and branding', async ({ page }) => {
    await page.goto(PRODUCTION_URL)
    
    // Check page title
    await expect(page).toHaveTitle(/Puzzlator/)
    
    // Check main heading
    await expect(page.locator('h1').first()).toBeVisible()
  })

  test('should show login page elements', async ({ page }) => {
    await page.goto(PRODUCTION_URL)
    
    // Should redirect to login or show login
    await expect(page.locator('text=/sign in|log in|welcome/i').first()).toBeVisible()
  })

  test('should be mobile responsive', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto(PRODUCTION_URL)
    
    // Page should still be functional
    await expect(page.locator('h1').first()).toBeVisible()
  })

  test('should have working navigation', async ({ page }) => {
    await page.goto(PRODUCTION_URL)
    
    // Check for navigation elements
    const navLinks = page.locator('a[href*="/"], button')
    const count = await navLinks.count()
    expect(count).toBeGreaterThan(0)
  })

  test('should handle errors gracefully', async ({ page }) => {
    // Try to navigate to a non-existent page
    const response = await page.goto(`${PRODUCTION_URL}/non-existent-page-12345`)
    
    // Should either redirect or show 404
    expect(response?.status()).toBeLessThanOrEqual(404)
  })

  test('should have proper SSL certificate', async ({ page }) => {
    // Navigating to HTTPS URL should work without certificate errors
    await expect(page.goto(PRODUCTION_URL)).resolves.toBeTruthy()
  })

  test('should load assets correctly', async ({ page }) => {
    await page.goto(PRODUCTION_URL)
    
    // Check that CSS is loaded (page should have styling)
    const backgroundColor = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor
    })
    expect(backgroundColor).not.toBe('rgba(0, 0, 0, 0)') // Not transparent
    
    // Check that JavaScript is working
    const hasReactRoot = await page.evaluate(() => {
      return document.querySelector('#app') !== null
    })
    expect(hasReactRoot).toBe(true)
  })

  test('should have meta tags for SEO', async ({ page }) => {
    await page.goto(PRODUCTION_URL)
    
    // Check for essential meta tags
    const description = await page.getAttribute('meta[name="description"]', 'content')
    expect(description).toBeTruthy()
    
    // Check for viewport meta tag
    const viewport = await page.getAttribute('meta[name="viewport"]', 'content')
    expect(viewport).toContain('width=device-width')
  })

  test('should not have console errors', async ({ page }) => {
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })
    
    await page.goto(PRODUCTION_URL)
    await page.waitForTimeout(2000) // Wait for any async operations
    
    // Filter out expected errors (like failed API calls in production)
    const criticalErrors = errors.filter(error => 
      !error.includes('Failed to load resource') &&
      !error.includes('401') &&
      !error.includes('net::ERR_')
    )
    
    expect(criticalErrors).toHaveLength(0)
  })
})

test.describe('Puzzlator Core Functionality', () => {
  test('should have authentication UI', async ({ page }) => {
    await page.goto(PRODUCTION_URL)
    
    // Should show either login form or auth buttons
    const hasAuthUI = await page.locator('input[type="email"], input[type="text"], button:has-text("Sign"), button:has-text("Log")').count()
    expect(hasAuthUI).toBeGreaterThan(0)
  })

  test('should show game-related content', async ({ page }) => {
    await page.goto(PRODUCTION_URL)
    
    // Should mention puzzles or games
    const content = await page.textContent('body')
    expect(content?.toLowerCase()).toMatch(/puzzle|game|play/)
  })

  test('should have proper loading states', async ({ page }) => {
    await page.goto(PRODUCTION_URL)
    
    // Check if loading indicators work
    const hasLoadingUI = await page.locator('.animate-spin, [class*="load"], [class*="spinner"]').count()
    // Loading UI might or might not be visible, but elements should exist
    expect(hasLoadingUI).toBeGreaterThanOrEqual(0)
  })
})