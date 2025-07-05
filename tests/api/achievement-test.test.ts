import { describe, it, expect, beforeAll } from 'vitest'

describe('Achievement API Test', () => {
  const API_URL = 'http://localhost:14001/api'
  let testUserId: string

  beforeAll(async () => {
    // Create a test user
    const timestamp = Date.now()
    const response = await fetch(`${API_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: `achievetest_${timestamp}`,
        display_name: 'Achievement Test User'
      })
    })
    const data = await response.json()
    testUserId = data.id
  })

  it('should fetch all achievements', async () => {
    const response = await fetch(`${API_URL}/achievements`)
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(Array.isArray(data)).toBe(true)
    
    // We should have at least some achievements from our seed data
    expect(data.length).toBeGreaterThan(0)
    
    // Check the structure of an achievement
    const firstAchievement = data[0]
    expect(firstAchievement).toHaveProperty('id')
    expect(firstAchievement).toHaveProperty('code')
    expect(firstAchievement).toHaveProperty('name')
    expect(firstAchievement).toHaveProperty('description')
    expect(firstAchievement).toHaveProperty('points')
  })

  it('should fetch user achievements (empty for new user)', async () => {
    const response = await fetch(`${API_URL}/users/${testUserId}/achievements`)
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(Array.isArray(data)).toBe(true)
    // New user should have no achievements yet
    expect(data.length).toBe(0)
  })

  it('should handle invalid user ID', async () => {
    // Test with a valid UUID format that doesn't exist
    const nonExistentUuid = '00000000-0000-0000-0000-000000000000'
    const response = await fetch(`${API_URL}/users/${nonExistentUuid}/achievements`)
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(Array.isArray(data)).toBe(true)
    expect(data.length).toBe(0)
  })
})