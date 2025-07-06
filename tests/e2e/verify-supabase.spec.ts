import { test, expect } from '@playwright/test'

test.describe('Verify Supabase Integration', () => {
  test('should show version 0.3.2', async ({ page }) => {
    await page.goto('https://puzzlator.com')
    
    // Look for version
    const versionElement = await page.locator('text=v0.3.2')
    await expect(versionElement).toBeVisible({ timeout: 10000 })
    
    console.log('✅ Version 0.3.2 confirmed')
  })
  
  test('should not show Supabase configuration errors', async ({ page }) => {
    // Monitor console for errors
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })
    
    await page.goto('https://puzzlator.com')
    await page.waitForTimeout(2000)
    
    // Check that we don't have Supabase configuration errors
    const supabaseErrors = errors.filter(err => 
      err.includes('Supabase not configured') || 
      err.includes('VITE_SUPABASE_URL')
    )
    
    expect(supabaseErrors).toHaveLength(0)
    console.log('✅ No Supabase configuration errors')
  })
  
  test('should show OAuth login buttons', async ({ page }) => {
    await page.goto('https://puzzlator.com')
    
    // OAuth buttons should be visible
    await expect(page.locator('button:has-text("Continue with Google")')).toBeVisible()
    await expect(page.locator('button:has-text("Continue with GitHub")')).toBeVisible()
    
    console.log('✅ OAuth buttons are visible')
  })
  
  test('should not show demo mode warning', async ({ page }) => {
    await page.goto('https://puzzlator.com')
    
    // Should not see demo mode messages in console
    const warnings: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'warn') {
        warnings.push(msg.text())
      }
    })
    
    await page.waitForTimeout(1000)
    
    const demoWarnings = warnings.filter(warn => 
      warn.includes('demo mode') || 
      warn.includes('Supabase not configured')
    )
    
    expect(demoWarnings).toHaveLength(0)
    console.log('✅ No demo mode warnings')
  })
  
  test('full authentication flow test', async ({ page }) => {
    await page.goto('https://puzzlator.com')
    
    // Test sign up flow
    await page.click('button:has-text("Sign Up")')
    
    // Fill in sign up form
    const timestamp = Date.now()
    const testEmail = `test_${timestamp}@example.com`
    
    await page.fill('input[type="email"]', testEmail)
    await page.fill('input[type="password"]', 'TestPassword123!')
    await page.fill('input[placeholder="coolpuzzler123"]', `testuser${timestamp}`)
    
    // We won't actually submit to avoid creating test accounts
    // Just verify the form is working
    const signUpButton = page.locator('button[type="submit"]:has-text("Sign Up")')
    await expect(signUpButton).toBeEnabled()
    
    console.log('✅ Sign up form is functional')
  })
})