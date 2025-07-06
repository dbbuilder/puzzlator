import { test, expect } from '@playwright/test'

test.describe('Achievement System', () => {
  // Helper to login and start a game
  async function loginAndStartGame(page, difficulty = 'easy') {
    // Login flow
    await page.goto('/login')
    await page.fill('input[placeholder="Enter your username"]', 'testuser_achievements')
    await page.click('button:has-text("Continue")')
    await page.waitForURL('/play')
    
    // Select a game
    await page.click(`[data-difficulty="${difficulty}"]`)
    await page.waitForURL(/\/play\//)
  }

  test.beforeEach(async ({ page }) => {
    // Clear any existing data
    await page.goto('/')
  })

  test('should unlock "First Victory" achievement on first puzzle completion', async ({ page }) => {
    await loginAndStartGame(page, 'easy')
    
    // Complete the puzzle quickly (mock completion for testing)
    // In a real test, we would solve the puzzle step by step
    await page.evaluate(() => {
      // Trigger puzzle completion
      const event = new CustomEvent('puzzle-complete', { detail: { score: 1000 } })
      window.dispatchEvent(event)
    })
    
    // Wait for achievement notification
    await expect(page.locator('.achievement-notification')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('.achievement-notification')).toContainText('Achievement Unlocked!')
    await expect(page.locator('.achievement-notification')).toContainText('First Victory')
    await expect(page.locator('.achievement-notification__icon')).toContainText('🏆')
  })

  test('should show achievement progress for progressive achievements', async ({ page }) => {
    await loginAndStartGame(page, 'easy')
    
    // Navigate to achievements page
    await page.click('a[href="/achievements"]')
    await page.waitForURL('/achievements')
    
    // Find a progressive achievement
    const progressiveAchievement = page.locator('.achievement-badge').filter({ hasText: 'Puzzle Master' })
    await expect(progressiveAchievement).toBeVisible()
    
    // Check progress display
    const progressText = progressiveAchievement.locator('.achievement-badge__progress-text')
    await expect(progressText).toBeVisible()
    await expect(progressText).toMatch(/\d+\/\d+/)
  })

  test('should display achievements page with filtering', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[placeholder="Enter your username"]', 'testuser_achievements')
    await page.click('button:has-text("Continue")')
    await page.waitForURL('/play')
    
    // Navigate to achievements page
    await page.click('a[href="/achievements"]')
    await page.waitForURL('/achievements')
    
    // Check page elements
    await expect(page.locator('h1')).toContainText('Achievements')
    await expect(page.locator('.achievements-progress')).toBeVisible()
    
    // Test filtering
    await page.click('button:has-text("Unlocked")')
    const unlockedBadges = page.locator('.achievement-badge--unlocked')
    const lockedBadges = page.locator('.achievement-badge--locked')
    
    // When filtered to unlocked, only unlocked badges should be visible
    if (await unlockedBadges.count() > 0) {
      await expect(unlockedBadges.first()).toBeVisible()
    }
    
    // Switch to locked filter
    await page.click('button:has-text("Locked")')
    if (await lockedBadges.count() > 0) {
      await expect(lockedBadges.first()).toBeVisible()
    }
  })

  test('should show achievement details on click', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[placeholder="Enter your username"]', 'testuser_achievements')
    await page.click('button:has-text("Continue")')
    await page.waitForURL('/play')
    
    // Navigate to achievements page
    await page.click('a[href="/achievements"]')
    await page.waitForURL('/achievements')
    
    // Click on an achievement badge
    const firstBadge = page.locator('.achievement-badge').first()
    await firstBadge.click()
    
    // Check modal appears
    const modal = page.locator('.modal-content')
    await expect(modal).toBeVisible()
    await expect(modal.locator('.achievement-details-name')).toBeVisible()
    await expect(modal.locator('.achievement-details-description')).toBeVisible()
    
    // Close modal
    await page.click('.modal-close')
    await expect(modal).not.toBeVisible()
  })

  test('should persist achievements across sessions', async ({ page, context }) => {
    // First session - unlock an achievement
    await loginAndStartGame(page, 'easy')
    
    // Mock completing a puzzle to unlock achievement
    await page.evaluate(() => {
      const event = new CustomEvent('puzzle-complete', { detail: { score: 1000 } })
      window.dispatchEvent(event)
    })
    
    // Wait for achievement
    await expect(page.locator('.achievement-notification')).toBeVisible({ timeout: 5000 })
    
    // Navigate to achievements to verify
    await page.click('a[href="/achievements"]')
    await page.waitForURL('/achievements')
    
    const unlockedCount = await page.locator('.achievement-badge--unlocked').count()
    expect(unlockedCount).toBeGreaterThan(0)
    
    // Create new page in same context (simulating new tab/session)
    const newPage = await context.newPage()
    await newPage.goto('/achievements')
    
    // Verify achievements are still unlocked
    const newUnlockedCount = await newPage.locator('.achievement-badge--unlocked').count()
    expect(newUnlockedCount).toBe(unlockedCount)
  })

  test('should show achievement notification with correct rarity styling', async ({ page }) => {
    await loginAndStartGame(page, 'hard')
    
    // Mock unlocking a rare achievement
    await page.evaluate(() => {
      // Trigger a rare achievement unlock
      const event = new CustomEvent('achievement-unlocked', { 
        detail: { 
          achievement: {
            id: 'speed_demon',
            name: 'Speed Demon',
            rarity: 'rare',
            icon: '⚡'
          }
        }
      })
      window.dispatchEvent(event)
    })
    
    // Check notification has correct rarity class
    const notification = page.locator('.achievement-notification')
    await expect(notification).toBeVisible()
    await expect(notification).toHaveClass(/achievement-notification--rare/)
  })

  test('should update progress bar for partial achievement progress', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[placeholder="Enter your username"]', 'testuser_achievements')
    await page.click('button:has-text("Continue")')
    await page.waitForURL('/play')
    
    // Navigate to achievements
    await page.click('a[href="/achievements"]')
    await page.waitForURL('/achievements')
    
    // Find a progressive achievement
    const progressiveAchievement = page.locator('.achievement-badge').filter({ hasText: 'Puzzle Master' })
    const progressBar = progressiveAchievement.locator('.achievement-badge__progress-fill')
    
    // Check that progress bar exists and has width
    await expect(progressBar).toBeVisible()
    const width = await progressBar.evaluate(el => window.getComputedStyle(el).width)
    expect(parseInt(width)).toBeGreaterThan(0)
  })

  test('should search achievements', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[placeholder="Enter your username"]', 'testuser_achievements')
    await page.click('button:has-text("Continue")')
    await page.waitForURL('/play')
    
    // Navigate to achievements
    await page.click('a[href="/achievements"]')
    await page.waitForURL('/achievements')
    
    // Search for specific achievement
    const searchInput = page.locator('input[type="search"]')
    await searchInput.fill('speed')
    
    // Verify filtered results
    const visibleBadges = page.locator('.achievement-badge:visible')
    const count = await visibleBadges.count()
    
    // All visible badges should contain "speed" in name or description
    for (let i = 0; i < count; i++) {
      const badge = visibleBadges.nth(i)
      const text = await badge.textContent()
      expect(text?.toLowerCase()).toContain('speed')
    }
  })

  test('should sort achievements by different criteria', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[placeholder="Enter your username"]', 'testuser_achievements')
    await page.click('button:has-text("Continue")')
    await page.waitForURL('/play')
    
    // Navigate to achievements
    await page.click('a[href="/achievements"]')
    await page.waitForURL('/achievements')
    
    // Sort by rarity
    await page.selectOption('.sort-select', 'rarity')
    
    // Get all badges and verify rarity order
    const badges = page.locator('.achievement-badge')
    const firstBadgeClasses = await badges.first().getAttribute('class')
    
    // Legendary and epic achievements should appear first when sorted by rarity
    expect(firstBadgeClasses).toMatch(/achievement-badge--(legendary|epic)/)
  })

  test('achievement unlocks should trigger sound', async ({ page }) => {
    // Mock audio play
    await page.addInitScript(() => {
      window.audioPlayed = false
      window.HTMLAudioElement.prototype.play = function() {
        window.audioPlayed = true
        return Promise.resolve()
      }
    })
    
    await loginAndStartGame(page, 'easy')
    
    // Trigger achievement
    await page.evaluate(() => {
      const event = new CustomEvent('puzzle-complete', { detail: { score: 1000 } })
      window.dispatchEvent(event)
    })
    
    // Wait for notification
    await expect(page.locator('.achievement-notification')).toBeVisible()
    
    // Check if sound was played
    const audioPlayed = await page.evaluate(() => window.audioPlayed)
    expect(audioPlayed).toBe(true)
  })
})