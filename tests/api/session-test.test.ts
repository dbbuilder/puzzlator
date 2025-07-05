import { describe, it, expect, beforeAll } from 'vitest'

describe('Game Session API Test', () => {
  const API_URL = 'http://localhost:14001/api'
  const timestamp = Date.now()
  let userId: string
  let puzzleId: string
  let sessionId: string

  beforeAll(async () => {
    // Create a user
    const userResponse = await fetch(`${API_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: `sessiontest_${timestamp}`,
        display_name: 'Session Test User'
      })
    })
    const userData = await userResponse.json()
    userId = userData.id

    // Create a puzzle
    const puzzleResponse = await fetch(`${API_URL}/puzzles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'sudoku4x4',
        difficulty: 'easy',
        title: `Session Test Puzzle ${timestamp}`,
        puzzle_data: [[1, 0, 3, 0], [0, 4, 0, 2]],
        solution_data: [[1, 2, 3, 4], [3, 4, 1, 2]]
      })
    })
    const puzzleData = await puzzleResponse.json()
    puzzleId = puzzleData.id
  })

  it('should create a game session', async () => {
    const response = await fetch(`${API_URL}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        puzzle_id: puzzleId,
        game_state: { 
          grid: [[1, 0, 3, 0], [0, 4, 0, 2]],
          moves: []
        }
      })
    })
    
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data).toHaveProperty('id')
    expect(data.user_id).toBe(userId)
    expect(data.puzzle_id).toBe(puzzleId)
    expect(data.status).toBe('in_progress')
    expect(data.score).toBe(0)
    
    sessionId = data.id
  })

  it('should fetch active session by user and puzzle', async () => {
    const response = await fetch(`${API_URL}/sessions/${userId}/${puzzleId}`)
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data).toBeTruthy()
    expect(data.id).toBe(sessionId)
    expect(data.user_id).toBe(userId)
    expect(data.puzzle_id).toBe(puzzleId)
    expect(data.status).toBe('in_progress')
  })

  it('should update game session', async () => {
    const response = await fetch(`${API_URL}/sessions/${sessionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        score: 450,
        hints_used: 1,
        time_elapsed: 30,
        moves: [
          { row: 0, col: 1, value: 2, timestamp: new Date().toISOString() }
        ]
      })
    })
    
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data.score).toBe(450)
    expect(data.hints_used).toBe(1)
    expect(data.time_elapsed).toBe(30)
  })

  it('should complete game session', async () => {
    const response = await fetch(`${API_URL}/sessions/${sessionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'completed',
        score: 850,
        hints_used: 1,
        time_elapsed: 60,
        completed_at: new Date().toISOString()
      })
    })
    
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data.status).toBe('completed')
    expect(data.score).toBe(850)
    expect(data.completed_at).toBeTruthy()
  })

  it('should not return completed session when fetching active session', async () => {
    const response = await fetch(`${API_URL}/sessions/${userId}/${puzzleId}`)
    const data = await response.json()
    
    expect(response.status).toBe(200)
    // Should be null since the session is completed
    expect(data).toBeNull()
  })
})