import { test, expect } from '@playwright/test'
import { login, logout } from './helpers/auth'

test.describe('Pattern Matching Basic', () => {
  test('should create a pattern puzzle', async ({ page }) => {
    // Login
    await login(page, 'test@example.com', 'password123')
    await page.waitForURL('/play')
    
    // Select pattern puzzle type
    await page.click('button:has-text("Pattern")')
    
    // Select easy difficulty
    await page.click('button:has-text("Easy")')
    
    // Generate new puzzle
    await page.click('button:has-text("Generate New Puzzle")')
    
    // Wait for game to load
    await page.waitForURL(/\/play\/.*/, { timeout: 10000 })
    
    // Verify game title
    await expect(page.locator('h1.game-title')).toHaveText('Pattern Matching', { timeout: 10000 })
    
    // Verify canvas is loaded
    await expect(page.locator('#pattern-matching-phaser canvas')).toBeVisible({ timeout: 10000 })
    
    // Logout
    await logout(page)
  })
})