import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('should login with new username', async ({ page }) => {
    // Generate unique username
    const username = `player_${Date.now()}`
    
    // Go to homepage
    await page.goto('/')
    
    // Should redirect to login
    await expect(page).toHaveURL('/login')
    
    // Fill in username
    await page.fill('input#username', username)
    
    // Click login button
    await page.click('button:has-text("Start Playing")')
    
    // Should redirect to play page
    await expect(page).toHaveURL('/play')
    
    // Should show game selection
    await expect(page.locator('text=Select Puzzle Type')).toBeVisible()
  })

  test('should login with existing username', async ({ page }) => {
    const username = 'testuser'
    
    // Go to login page
    await page.goto('/login')
    
    // Fill in username
    await page.fill('input#username', username)
    
    // Click login button
    await page.click('button:has-text("Start Playing")')
    
    // Should redirect to play page
    await expect(page).toHaveURL('/play')
    
    // Should show game selection
    await expect(page.locator('text=Select Puzzle Type')).toBeVisible()
  })

  test('should logout successfully', async ({ page }) => {
    // First login
    await page.goto('/login')
    await page.fill('input#username', 'testuser')
    await page.click('button:has-text("Start Playing")')
    await expect(page).toHaveURL('/play')
    
    // Click logout button
    await page.click('button:has-text("Logout")')
    
    // Should redirect to login
    await expect(page).toHaveURL('/login')
  })

  test('should handle empty username', async ({ page }) => {
    await page.goto('/login')
    
    // Button should be disabled without username
    const button = page.locator('button:has-text("Start Playing")')
    await expect(button).toBeDisabled()
    
    // Should stay on login page
    await expect(page).toHaveURL('/login')
    
    // Check for required field validation
    const input = page.locator('input#username')
    await expect(input).toHaveAttribute('required', '')
  })
})