import { describe, it, expect } from 'vitest'

describe('Puzzle Generation API', () => {
  const API_URL = 'http://localhost:14001/api'

  it('should generate a single puzzle', async () => {
    const response = await fetch(`${API_URL}/puzzles/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'sudoku4x4',
        difficulty: 'medium'
      })
    })
    
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data).toHaveProperty('id')
    expect(data.type).toBe('sudoku4x4')
    expect(data.difficulty).toBe('medium')
    expect(data.title).toMatch(/Generated medium sudoku4x4 #\d+/)
    expect(data.puzzle_data).toBeDefined()
    expect(data.solution_data).toBeDefined()
  })

  it('should generate multiple puzzles', async () => {
    const response = await fetch(`${API_URL}/puzzles/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'sudoku4x4',
        difficulty: 'easy',
        count: 3
      })
    })
    
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(Array.isArray(data)).toBe(true)
    expect(data).toHaveLength(3)
    
    data.forEach((puzzle: any) => {
      expect(puzzle.type).toBe('sudoku4x4')
      expect(puzzle.difficulty).toBe('easy')
    })
  })

  it('should use defaults when not specified', async () => {
    const response = await fetch(`${API_URL}/puzzles/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    })
    
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data.type).toBe('sudoku4x4')
    expect(data.difficulty).toBe('medium')
  })
})