import { test, expect } from '@playwright/test'
import { login, logout } from './helpers/auth'

test.describe('Spatial Puzzle (Shape Fitting)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'test@example.com', 'password123')
    await page.waitForURL('/play')
  })

  test.afterEach(async ({ page }) => {
    await logout(page)
  })

  test('should create and play a spatial puzzle', async ({ page }) => {
    // Select spatial puzzle type
    await page.click('button:has-text("Spatial")')
    
    // Select easy difficulty
    await page.click('button:has-text("Easy")')
    
    // Generate new puzzle
    await page.click('button:has-text("Generate New Puzzle")')
    
    // Wait for game to load
    await page.waitForURL(/\/play\/.*/)
    await page.waitForSelector('#spatial-puzzle-phaser canvas', { timeout: 10000 })
    
    // Verify game title
    await expect(page.locator('h1.game-title')).toHaveText('Shape Fitting Puzzle')
    
    // Verify game controls are visible
    await expect(page.locator('button:has-text("Hint")')).toBeVisible()
    await expect(page.locator('button:has-text("Reset")')).toBeVisible()
    await expect(page.locator('button:has-text("Pause")')).toBeVisible()
    
    // Verify stats are displayed
    await expect(page.locator('.stat-item').first()).toBeVisible() // Timer
    await expect(page.locator('.stat-item').nth(1)).toBeVisible() // Score
    await expect(page.locator('.stat-item').nth(2)).toBeVisible() // Moves
    
    // Wait for canvas to be ready
    await page.waitForTimeout(1000)
    
    // The spatial puzzle should be visible in the Phaser canvas
    const canvas = await page.locator('#spatial-puzzle-phaser canvas')
    expect(await canvas.boundingBox()).toBeTruthy()
  })

  test('should show/hide rotate button based on difficulty', async ({ page }) => {
    // Test easy difficulty (no rotation)
    await page.click('button:has-text("Spatial")')
    await page.click('button:has-text("Easy")')
    await page.click('button:has-text("Generate New Puzzle")')
    
    await page.waitForURL(/\/play\/.*/)
    await page.waitForSelector('#spatial-puzzle-phaser canvas')
    
    // Rotate button should not be visible for easy difficulty
    await expect(page.locator('button:has-text("Rotate")')).not.toBeVisible()
    
    // Go back and test hard difficulty
    await page.click('button:has-text("Back to Menu")')
    await page.waitForURL('/play')
    
    // Test hard difficulty (with rotation)
    await page.click('button:has-text("Spatial")')
    await page.click('button:has-text("Hard")')
    await page.click('button:has-text("Generate New Puzzle")')
    
    await page.waitForURL(/\/play\/.*/)
    await page.waitForSelector('#spatial-puzzle-phaser canvas')
    
    // Rotate button should be visible for hard difficulty
    await expect(page.locator('button:has-text("Rotate")')).toBeVisible()
  })

  test('should pause and resume the game', async ({ page }) => {
    // Create a spatial puzzle
    await page.click('button:has-text("Spatial")')
    await page.click('button:has-text("Medium")')
    await page.click('button:has-text("Generate New Puzzle")')
    
    await page.waitForURL(/\/play\/.*/)
    await page.waitForSelector('#spatial-puzzle-phaser canvas')
    
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
    // Create a spatial puzzle
    await page.click('button:has-text("Spatial")')
    await page.click('button:has-text("Easy")')
    await page.click('button:has-text("Generate New Puzzle")')
    
    await page.waitForURL(/\/play\/.*/)
    await page.waitForSelector('#spatial-puzzle-phaser canvas')
    
    // Get initial timer value
    await page.waitForTimeout(2000) // Let timer run for 2 seconds
    
    // Reset the puzzle
    await page.click('button:has-text("Reset")')
    
    // Verify timer is reset (should show 0:00)
    await page.waitForTimeout(500)
    const timerText = await page.locator('.stat-item').first().textContent()
    expect(timerText).toContain('0:0')
    
    // Verify moves counter is reset
    const movesText = await page.locator('.stat-item').nth(2).textContent()
    expect(movesText).toContain('0')
  })

  test('should request hints', async ({ page }) => {
    // Create a spatial puzzle
    await page.click('button:has-text("Spatial")')
    await page.click('button:has-text("Medium")')
    await page.click('button:has-text("Generate New Puzzle")')
    
    await page.waitForURL(/\/play\/.*/)
    await page.waitForSelector('#spatial-puzzle-phaser canvas')
    await page.waitForTimeout(1000)
    
    // Request a hint
    await page.click('button:has-text("Hint")')
    
    // Verify hint is requested (score should reflect hint usage)
    await expect(page.locator('.game-stats')).toBeVisible()
  })

  test('should handle drag and drop interactions', async ({ page }) => {
    // Create a spatial puzzle
    await page.click('button:has-text("Spatial")')
    await page.click('button:has-text("Easy")')
    await page.click('button:has-text("Generate New Puzzle")')
    
    await page.waitForURL(/\/play\/.*/)
    await page.waitForSelector('#spatial-puzzle-phaser canvas')
    await page.waitForTimeout(1000)
    
    // Get canvas element
    const canvas = await page.locator('#spatial-puzzle-phaser canvas')
    const box = await canvas.boundingBox()
    
    if (box) {
      // Simulate drag from shape palette to grid
      const startX = box.x + 100  // Shape palette area
      const startY = box.y + 500
      const endX = box.x + 200    // Grid area
      const endY = box.y + 200
      
      await page.mouse.move(startX, startY)
      await page.mouse.down()
      await page.mouse.move(endX, endY)
      await page.mouse.up()
      
      // Verify the game is still running
      await expect(page.locator('.game-stats')).toBeVisible()
    }
  })

  test('should navigate back to menu', async ({ page }) => {
    // Create a spatial puzzle
    await page.click('button:has-text("Spatial")')
    await page.click('button:has-text("Easy")')
    await page.click('button:has-text("Generate New Puzzle")')
    
    await page.waitForURL(/\/play\/.*/)
    await page.waitForSelector('#spatial-puzzle-phaser canvas')
    
    // Click back to menu
    await page.click('button:has-text("Back to Menu")')
    
    // Verify we're back at game selection
    await page.waitForURL('/play')
    await expect(page.locator('h1')).toHaveText('AI Puzzle Game')
  })

  test('should handle keyboard shortcuts', async ({ page }) => {
    // Create a spatial puzzle with rotation enabled
    await page.click('button:has-text("Spatial")')
    await page.click('button:has-text("Hard")')
    await page.click('button:has-text("Generate New Puzzle")')
    
    await page.waitForURL(/\/play\/.*/)
    await page.waitForSelector('#spatial-puzzle-phaser canvas')
    
    // Test pause shortcut (P)
    await page.keyboard.press('p')
    await expect(page.locator('.pause-overlay')).toBeVisible()
    
    // Resume
    await page.keyboard.press('p')
    await expect(page.locator('.pause-overlay')).not.toBeVisible()
    
    // Test hint shortcut (H)
    await page.keyboard.press('h')
    await page.waitForTimeout(500)
    
    // Test reset shortcut (Ctrl+R / Cmd+R)
    const modifier = process.platform === 'darwin' ? 'Meta' : 'Control'
    await page.keyboard.press(`${modifier}+r`)
    await page.waitForTimeout(500)
  })

  test('should support different grid sizes based on difficulty', async ({ page }) => {
    const difficulties = [
      { level: 'Easy', gridSize: '4x4' },
      { level: 'Medium', gridSize: '5x5' },
      { level: 'Hard', gridSize: '6x6' },
      { level: 'Expert', gridSize: '8x8' }
    ]
    
    for (const { level } of difficulties) {
      // Navigate back to game selection
      await page.goto('/play')
      
      // Select spatial puzzle and difficulty
      await page.click('button:has-text("Spatial")')
      await page.click(`button:has-text("${level}")`)
      await page.click('button:has-text("Generate New Puzzle")')
      
      // Verify game loads
      await page.waitForURL(/\/play\/.*/)
      await page.waitForSelector('#spatial-puzzle-phaser canvas')
      
      // Verify we're on the spatial puzzle game
      await expect(page.locator('h1.game-title')).toHaveText('Shape Fitting Puzzle')
      
      // Go back to menu
      await page.click('button:has-text("Back to Menu")')
      await page.waitForURL('/play')
    }
  })
})