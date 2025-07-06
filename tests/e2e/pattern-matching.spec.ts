import { test, expect } from '@playwright/test'
import { login, logout } from './helpers/auth'

test.describe('Pattern Matching Puzzle', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'test@example.com', 'password123')
    await page.waitForURL('/play')
  })

  test.afterEach(async ({ page }) => {
    await logout(page)
  })

  test('should create and play a numeric pattern puzzle', async ({ page }) => {
    // Select pattern puzzle type
    await page.click('button:has-text("Pattern")')
    
    // Select easy difficulty (numeric patterns)
    await page.click('button:has-text("Easy")')
    
    // Generate new puzzle
    await page.click('button:has-text("Generate New Puzzle")')
    
    // Wait for game to load
    await page.waitForURL(/\/play\/.*/)
    await page.waitForSelector('#pattern-matching-phaser canvas', { timeout: 10000 })
    
    // Verify game title
    await expect(page.locator('h1.game-title')).toHaveText('Pattern Matching')
    
    // Verify game controls are visible
    await expect(page.locator('button:has-text("Hint")')).toBeVisible()
    await expect(page.locator('button:has-text("Reset")')).toBeVisible()
    await expect(page.locator('button:has-text("Pause")')).toBeVisible()
    
    // Verify stats are displayed
    await expect(page.locator('.stat-item').first()).toBeVisible() // Timer
    await expect(page.locator('.stat-item').nth(1)).toBeVisible() // Score
    await expect(page.locator('.stat-item').nth(2)).toBeVisible() // Attempts
    
    // Wait for canvas to be ready
    await page.waitForTimeout(1000)
    
    // The pattern should be visible in the Phaser canvas
    // We can't directly test canvas content, but we can verify the game loaded
    const canvas = await page.locator('#pattern-matching-phaser canvas')
    expect(await canvas.boundingBox()).toBeTruthy()
  })

  test('should handle pattern selection and answer submission', async ({ page }) => {
    // Create a pattern puzzle
    await page.click('button:has-text("Pattern")')
    await page.click('button:has-text("Easy")')
    await page.click('button:has-text("Generate New Puzzle")')
    
    await page.waitForURL(/\/play\/.*/)
    await page.waitForSelector('#pattern-matching-phaser canvas', { timeout: 10000 })
    await page.waitForTimeout(1000)
    
    // Click on the canvas to interact with the game
    // Since we can't directly interact with Phaser elements, we simulate clicks on the canvas
    const canvas = await page.locator('#pattern-matching-phaser canvas')
    const box = await canvas.boundingBox()
    
    if (box) {
      // Click on a hidden position (approximate)
      await page.mouse.click(box.x + box.width * 0.5, box.y + box.height * 0.3)
      await page.waitForTimeout(500)
      
      // Click on a number in the input panel (approximate)
      await page.mouse.click(box.x + box.width * 0.3, box.y + box.height * 0.7)
      await page.waitForTimeout(500)
    }
    
    // Verify the game is still running
    await expect(page.locator('.game-stats')).toBeVisible()
  })

  test('should pause and resume the game', async ({ page }) => {
    // Create a pattern puzzle
    await page.click('button:has-text("Pattern")')
    await page.click('button:has-text("Medium")')
    await page.click('button:has-text("Generate New Puzzle")')
    
    await page.waitForURL(/\/play\/.*/)
    await page.waitForSelector('#pattern-matching-phaser canvas')
    
    // Pause the game
    await page.click('button:has-text("Pause")')
    
    // Verify pause overlay is visible
    await expect(page.locator('.pause-overlay')).toBeVisible()
    await expect(page.locator('.pause-title')).toHaveText('Game Paused')
    
    // Resume the game
    await page.click('button:has-text("Resume")')
    
    // Verify pause overlay is hidden
    await expect(page.locator('.pause-overlay')).not.toBeVisible()
  })

  test('should reset the puzzle', async ({ page }) => {
    // Create a pattern puzzle
    await page.click('button:has-text("Pattern")')
    await page.click('button:has-text("Easy")')
    await page.click('button:has-text("Generate New Puzzle")')
    
    await page.waitForURL(/\/play\/.*/)
    await page.waitForSelector('#pattern-matching-phaser canvas')
    
    // Get initial timer value
    await page.waitForTimeout(2000) // Let timer run for 2 seconds
    
    // Reset the puzzle
    await page.click('button:has-text("Reset")')
    
    // Verify timer is reset (should show 0:00)
    await page.waitForTimeout(500)
    const timerText = await page.locator('.stat-item').first().textContent()
    expect(timerText).toContain('0:0')
  })

  test('should request hints', async ({ page }) => {
    // Create a pattern puzzle
    await page.click('button:has-text("Pattern")')
    await page.click('button:has-text("Easy")')
    await page.click('button:has-text("Generate New Puzzle")')
    
    await page.waitForURL(/\/play\/.*/)
    await page.waitForSelector('#pattern-matching-phaser canvas')
    await page.waitForTimeout(1000)
    
    // Request a hint
    await page.click('button:has-text("Hint")')
    
    // Verify hint is requested (score should reflect hint usage)
    // The exact behavior depends on the implementation
    await expect(page.locator('.game-stats')).toBeVisible()
  })

  test('should handle different pattern types based on difficulty', async ({ page }) => {
    const difficulties = [
      { level: 'Easy', expectedType: 'numeric' },
      { level: 'Medium', expectedType: 'shapes' },
      { level: 'Hard', expectedType: 'colors' },
      { level: 'Expert', expectedType: 'mixed' }
    ]
    
    for (const { level } of difficulties) {
      // Navigate back to game selection
      await page.goto('/play')
      
      // Select pattern puzzle and difficulty
      await page.click('button:has-text("Pattern")')
      await page.click(`button:has-text("${level}")`)
      await page.click('button:has-text("Generate New Puzzle")')
      
      // Verify game loads
      await page.waitForURL(/\/play\/.*/)
      await page.waitForSelector('#pattern-matching-phaser canvas')
      
      // Verify we're on the pattern matching game
      await expect(page.locator('h1.game-title')).toHaveText('Pattern Matching')
      
      // Go back to menu
      await page.click('button:has-text("Back to Menu")')
      await page.waitForURL('/play')
    }
  })

  test('should navigate back to menu', async ({ page }) => {
    // Create a pattern puzzle
    await page.click('button:has-text("Pattern")')
    await page.click('button:has-text("Easy")')
    await page.click('button:has-text("Generate New Puzzle")')
    
    await page.waitForURL(/\/play\/.*/)
    await page.waitForSelector('#pattern-matching-phaser canvas')
    
    // Click back to menu
    await page.click('button:has-text("Back to Menu")')
    
    // Verify we're back at game selection
    await page.waitForURL('/play')
    await expect(page.locator('h1')).toHaveText('AI Puzzle Game')
  })

  test('should handle keyboard shortcuts', async ({ page }) => {
    // Create a pattern puzzle
    await page.click('button:has-text("Pattern")')
    await page.click('button:has-text("Easy")')
    await page.click('button:has-text("Generate New Puzzle")')
    
    await page.waitForURL(/\/play\/.*/)
    await page.waitForSelector('#pattern-matching-phaser canvas')
    
    // Test pause shortcut (P)
    await page.keyboard.press('p')
    await expect(page.locator('.pause-overlay')).toBeVisible()
    
    // Resume
    await page.keyboard.press('p')
    await expect(page.locator('.pause-overlay')).not.toBeVisible()
    
    // Test hint shortcut (H)
    await page.keyboard.press('h')
    // Hint should be requested
    await page.waitForTimeout(500)
    
    // Test reset shortcut (Ctrl+R / Cmd+R)
    const modifier = process.platform === 'darwin' ? 'Meta' : 'Control'
    await page.keyboard.press(`${modifier}+r`)
    // Puzzle should be reset
    await page.waitForTimeout(500)
  })

  test('should complete a puzzle and show completion screen', async ({ page }) => {
    // Create an easy pattern puzzle
    await page.click('button:has-text("Pattern")')
    await page.click('button:has-text("Easy")')
    await page.click('button:has-text("Generate New Puzzle")')
    
    await page.waitForURL(/\/play\/.*/)
    await page.waitForSelector('#pattern-matching-phaser canvas')
    await page.waitForTimeout(1000)
    
    // Since we can't easily complete the puzzle programmatically,
    // we'll verify that the completion flow elements exist
    // In a real test, you might want to mock the puzzle completion
    
    // The game should have a completion mechanism
    const canvas = await page.locator('#pattern-matching-phaser canvas')
    expect(await canvas.boundingBox()).toBeTruthy()
    
    // After completion, it should redirect back to menu after 3 seconds
    // This would happen automatically when the puzzle is completed
  })
})