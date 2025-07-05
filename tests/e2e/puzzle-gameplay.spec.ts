import { test, expect } from '@playwright/test'

test.describe('Puzzle Gameplay', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to a puzzle
    await page.goto('/login')
    await page.fill('input#username', 'testuser')
    await page.click('button:has-text("Start Playing")')
    await expect(page).toHaveURL('/play')
    
    // Start first puzzle
    await page.locator('.puzzle-card').first().click()
    await expect(page).toHaveURL(/\/play\//)
    
    // Wait for game to load
    await page.waitForSelector('#phaser-game canvas', { state: 'visible' })
    await page.waitForTimeout(1000) // Give Phaser time to initialize
  })

  test('should display game controls', async ({ page }) => {
    // Check for game UI elements
    await expect(page.locator('text=Score:')).toBeVisible()
    await expect(page.locator('text=Time:')).toBeVisible()
    await expect(page.locator('text=Hints:')).toBeVisible()
    
    // Check for control buttons
    await expect(page.locator('button:has-text("Hint")')).toBeVisible()
    await expect(page.locator('button:has-text("Undo")')).toBeVisible()
    await expect(page.locator('button:has-text("Redo")')).toBeVisible()
    await expect(page.locator('button:has-text("Pause")')).toBeVisible()
  })

  test('should interact with game canvas', async ({ page }) => {
    // Get canvas element
    const canvas = page.locator('#phaser-game canvas')
    await expect(canvas).toBeVisible()
    
    // Get canvas bounding box
    const box = await canvas.boundingBox()
    if (!box) throw new Error('Canvas not found')
    
    // Click on a cell (example: top-left area)
    await page.mouse.click(box.x + 50, box.y + 50)
    
    // The game should respond (exact behavior depends on implementation)
    // For now, just verify canvas is still visible after interaction
    await expect(canvas).toBeVisible()
  })

  test('should use hint feature', async ({ page }) => {
    // Get initial hint count
    const hintsText = await page.locator('text=Hints:').textContent()
    const initialHints = parseInt(hintsText?.match(/\d+/)?.[0] || '0')
    
    // Click hint button
    await page.click('button:has-text("Hint")')
    
    // Hint count should increase
    await page.waitForTimeout(500)
    const newHintsText = await page.locator('text=Hints:').textContent()
    const newHints = parseInt(newHintsText?.match(/\d+/)?.[0] || '0')
    
    expect(newHints).toBeGreaterThan(initialHints)
  })

  test('should pause and resume game', async ({ page }) => {
    // Click pause button
    await page.click('button:has-text("Pause")')
    
    // Should show resume button
    await expect(page.locator('button:has-text("Resume")')).toBeVisible()
    
    // Click resume
    await page.click('button:has-text("Resume")')
    
    // Should show pause button again
    await expect(page.locator('button:has-text("Pause")')).toBeVisible()
  })

  test('should exit game', async ({ page }) => {
    // Click exit/back button
    await page.click('button:has-text("Exit")')
    
    // Should return to play page
    await expect(page).toHaveURL('/play')
    
    // Should show puzzle selection again
    await expect(page.locator('text=Available Puzzles')).toBeVisible()
  })
})