import { describe, it, expect, beforeAll } from 'vitest'

describe('Leaderboard API Test', () => {
  const API_URL = 'http://localhost:14001/api'
  const timestamp = Date.now()
  let userId: string
  let puzzleId: string

  beforeAll(async () => {
    // Create a user for the leaderboard entry
    const userResponse = await fetch(`${API_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: `leadertest_${timestamp}`,
        display_name: 'Leaderboard Test User'
      })
    })
    const userData = await userResponse.json()
    userId = userData.id

    // Create a puzzle for the leaderboard entry
    const puzzleResponse = await fetch(`${API_URL}/puzzles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'sudoku4x4',
        difficulty: 'medium',
        title: `Leaderboard Test Puzzle ${timestamp}`,
        puzzle_data: [[0, 2, 0, 4]],
        solution_data: [[1, 2, 3, 4]]
      })
    })
    const puzzleData = await puzzleResponse.json()
    puzzleId = puzzleData.id
  })

  it('should create a leaderboard entry', async () => {
    const response = await fetch(`${API_URL}/leaderboards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        puzzle_id: puzzleId,
        puzzle_type: 'sudoku4x4',
        difficulty: 'medium',
        score: 950,
        time_elapsed: 45,
        hints_used: 0,
        period_type: 'all_time'
      })
    })
    
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data).toHaveProperty('id')
    expect(data.score).toBe(950)
    expect(data.time_elapsed).toBe(45)
  })

  it('should fetch leaderboard entries', async () => {
    const response = await fetch(`${API_URL}/leaderboards?puzzle_type=sudoku4x4&limit=10`)
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(Array.isArray(data)).toBe(true)
    expect(data.length).toBeGreaterThan(0)
    
    // Check that our entry is included
    const ourEntry = data.find((entry: any) => entry.user_id === userId)
    expect(ourEntry).toBeTruthy()
    expect(ourEntry.score).toBe(950)
    expect(ourEntry.username).toBe(`leadertest_${timestamp}`)
  })

  it('should fetch filtered leaderboard', async () => {
    const response = await fetch(`${API_URL}/leaderboards?puzzle_type=sudoku4x4&difficulty=medium&period_type=all_time`)
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(Array.isArray(data)).toBe(true)
    // All entries should match the filters
    data.forEach((entry: any) => {
      expect(entry.puzzle_type).toBe('sudoku4x4')
      expect(entry.difficulty).toBe('medium')
      expect(entry.period_type).toBe('all_time')
    })
  })
})