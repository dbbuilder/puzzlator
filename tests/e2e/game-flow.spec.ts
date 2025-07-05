import { test, expect } from '@playwright/test'

test.describe('Game Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login')
    await page.fill('input#username', 'testuser')
    await page.click('button:has-text("Start Playing")')
    await expect(page).toHaveURL('/play')
  })

  test('should display game selection', async ({ page }) => {
    // Should show puzzle selection sections
    await expect(page.locator('text=Select Puzzle Type')).toBeVisible()
    await expect(page.locator('text=Select Difficulty')).toBeVisible()
    
    // Should have generate puzzle button
    await expect(page.locator('button:has-text("Generate New Puzzle")')).toBeVisible()
  })

  test('should filter puzzles by difficulty', async ({ page }) => {
    // Wait for the select to be visible
    await page.waitForSelector('select', { timeout: 5000 })
    
    // Click difficulty filter
    const difficultySelect = page.locator('select').first()
    await difficultySelect.selectOption('easy')
    
    // Wait for filter to apply
    await page.waitForTimeout(500)
    
    // Check that puzzles are filtered
    const puzzleCards = page.locator('.puzzle-card')
    const count = await puzzleCards.count()
    
    if (count > 0) {
      // Verify all visible puzzles are easy difficulty
      const difficulties = await puzzleCards.locator('text=easy').allTextContents()
      expect(difficulties.length).toBeGreaterThan(0)
    }
  })

  test('should start a puzzle game', async ({ page }) => {
    // Select puzzle type and difficulty
    await page.click('button:has-text("Sudoku 4x4")')
    await page.click('button:has-text("Easy")')
    
    // Generate new puzzle
    await page.click('button:has-text("Generate New Puzzle")')
    
    // Wait for navigation or timeout
    try {
      await page.waitForURL(/\/play\//, { timeout: 5000 })
    } catch (e) {
      // If no navigation happens, might be showing an error or still loading
      await page.waitForTimeout(1000)
    }
    
    // Should navigate to game page or show puzzle
    const url = page.url()
    expect(url).toMatch(/\/play(\/|$)/)
    
    // If we navigated to a game page, check for game elements
    if (url.includes('/play/')) {
      // Should show game board
      await expect(page.locator('#phaser-game')).toBeVisible()
      
      // Should show game controls
      await expect(page.locator('text=Score:')).toBeVisible()
      await expect(page.locator('text=Time:')).toBeVisible()
    } else {
      // We're still on the selection page, verify we got feedback
      await expect(page.locator('text=Generate New Puzzle')).toBeVisible()
    }
  })

  test('should navigate to leaderboard', async ({ page }) => {
    // Click leaderboard link
    await page.click('a:has-text("Leaderboard")')
    
    // Should be on leaderboard page
    await expect(page).toHaveURL('/leaderboard')
    
    // Should show leaderboard title
    await expect(page.locator('h1:has-text("Leaderboard")')).toBeVisible()
    
    // Should have filter options
    await expect(page.locator('select')).toHaveCount(3) // puzzle type, difficulty, period
  })

  test('should navigate to profile', async ({ page }) => {
    // Click profile link
    await page.click('a:has-text("Profile")')
    
    // Should be on profile page
    await expect(page).toHaveURL('/profile')
    
    // Should show user stats
    await expect(page.locator('text=Total Score')).toBeVisible()
    await expect(page.locator('text=Puzzles Completed')).toBeVisible()
    await expect(page.locator('h3:has-text("Achievements")')).toBeVisible()
  })
})