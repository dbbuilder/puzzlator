import { describe, it, expect } from 'vitest'

describe('User API Test', () => {
  const API_URL = 'http://localhost:14001/api'
  const timestamp = Date.now()
  const testUsername = `apitest_${timestamp}`
  let userId: string

  it('should create a user', async () => {
    const response = await fetch(`${API_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: testUsername,
        display_name: 'API Test User'
      })
    })
    
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data).toHaveProperty('id')
    expect(data.username).toBe(testUsername)
    
    userId = data.id
  })

  it('should fetch the user', async () => {
    const response = await fetch(`${API_URL}/users/${userId}`)
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data.id).toBe(userId)
    expect(data.username).toBe(testUsername)
  })

  it('should update the user', async () => {
    const response = await fetch(`${API_URL}/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        display_name: 'Updated Name',
        bio: 'Test bio'
      })
    })
    
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data.display_name).toBe('Updated Name')
    expect(data.bio).toBe('Test bio')
  })
})