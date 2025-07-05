import { describe, it, expect } from 'vitest'

describe('Simple API Test', () => {
  it('should fetch health status', async () => {
    const response = await fetch('http://localhost:14001/api/health')
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data).toHaveProperty('status', 'ok')
  })
})