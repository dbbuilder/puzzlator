import { describe, it, expect } from 'vitest'

describe('Puzzle API Test', () => {
  const API_URL = 'http://localhost:14001/api'
  const timestamp = Date.now()
  let puzzleId: string

  it('should create a puzzle', async () => {
    const response = await fetch(`${API_URL}/puzzles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'sudoku4x4',
        difficulty: 'easy',
        title: `Test Puzzle ${timestamp}`,
        description: 'API test puzzle',
        puzzle_data: [[1, 0, 3, 0], [0, 4, 0, 2], [2, 0, 4, 0], [0, 3, 0, 1]],
        solution_data: [[1, 2, 3, 4], [3, 4, 1, 2], [2, 1, 4, 3], [4, 3, 2, 1]]
      })
    })
    
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data).toHaveProperty('id')
    expect(data.type).toBe('sudoku4x4')
    expect(data.difficulty).toBe('easy')
    
    puzzleId = data.id
  })

  it('should fetch the puzzle', async () => {
    const response = await fetch(`${API_URL}/puzzles/${puzzleId}`)
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data.id).toBe(puzzleId)
    expect(data.type).toBe('sudoku4x4')
  })

  it('should list puzzles with filters', async () => {
    const response = await fetch(`${API_URL}/puzzles?type=sudoku4x4&limit=5`)
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(Array.isArray(data)).toBe(true)
    expect(data.length).toBeGreaterThan(0)
    expect(data.every((p: any) => p.type === 'sudoku4x4')).toBe(true)
  })
})