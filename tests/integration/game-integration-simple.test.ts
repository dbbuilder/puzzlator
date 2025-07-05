import { describe, it, expect, beforeAll, vi } from 'vitest'
import { Sudoku4x4 } from '../../src/game/puzzles/sudoku/Sudoku4x4'

// Mock Phaser since it requires a browser environment
vi.mock('phaser', () => ({
  Scene: class MockScene {
    add = {
      text: vi.fn(() => ({ setOrigin: vi.fn(), setInteractive: vi.fn() })),
      graphics: vi.fn(() => ({
        fillStyle: vi.fn(),
        fillRect: vi.fn(),
        strokeRect: vi.fn(),
        lineStyle: vi.fn()
      }))
    }
    input = {
      on: vi.fn()
    }
  }
}))

describe('Game Integration Tests', () => {
  const API_URL = 'http://localhost:14001/api'
  let userId: string
  let puzzleId: string

  beforeAll(async () => {
    // Create test user
    const timestamp = Date.now()
    const userResponse = await fetch(`${API_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: `gameintegtest_${timestamp}`,
        display_name: 'Game Integration Test User'
      })
    })
    const userData = await userResponse.json()
    userId = userData.id

    // Create test puzzle
    const puzzleResponse = await fetch(`${API_URL}/puzzles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'sudoku4x4',
        difficulty: 'easy',
        title: `Integration Test Puzzle ${timestamp}`,
        puzzle_data: [[1, 0, 3, 0], [0, 4, 0, 2], [2, 0, 4, 0], [0, 3, 0, 1]],
        solution_data: [[1, 2, 3, 4], [3, 4, 1, 2], [2, 1, 4, 3], [4, 3, 2, 1]]
      })
    })
    const puzzleData = await puzzleResponse.json()
    puzzleId = puzzleData.id
  })

  describe('Game Session Lifecycle', () => {
    it('should create and update a game session', async () => {
      // Initialize game (generates random puzzle)
      const sudoku = new Sudoku4x4()
      const initialState = sudoku.getState()

      // Create game session in database
      const sessionResponse = await fetch(`${API_URL}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          puzzle_id: puzzleId,
          game_state: initialState
        })
      })

      const sessionData = await sessionResponse.json()
      expect(sessionResponse.status).toBe(200)
      expect(sessionData.status).toBe('in_progress')
      const sessionId = sessionData.id

      // Find an empty cell and make a valid move
      let validMove = null
      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
          if (initialState.grid[row][col].value === null) {
            for (let value = 1; value <= 4; value++) {
              const result = sudoku.makeMove({ row, col, value })
              if (result.success) {
                validMove = { row, col, value }
                break
              }
            }
          }
          if (validMove) break
        }
        if (validMove) break
      }

      expect(validMove).toBeTruthy()

      // Update session with new game state
      const updatedState = sudoku.getState()
      const updateResponse = await fetch(`${API_URL}/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          game_state: updatedState,
          moves: updatedState.moves,
          score: sudoku.calculateScore({ 
            timeElapsed: 30, 
            hintsUsed: 0, 
            difficulty: updatedState.difficulty 
          }),
          time_elapsed: 30
        })
      })

      const updateData = await updateResponse.json()
      expect(updateResponse.status).toBe(200)
      expect(updateData.game_state.grid[validMove.row][validMove.col].value).toBe(validMove.value)
      expect(updateData.score).toBeGreaterThan(0)
    })

    it('should handle game completion and leaderboard entry', async () => {
      // Create a new game session
      const sudoku = new Sudoku4x4()
      const sessionResponse = await fetch(`${API_URL}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          puzzle_id: puzzleId,
          game_state: sudoku.getState()
        })
      })
      
      const sessionData = await sessionResponse.json()
      const sessionId = sessionData.id

      // Simulate game completion
      const finalScore = sudoku.calculateScore({ 
        timeElapsed: 120, 
        hintsUsed: 1, 
        difficulty: sudoku.getState().difficulty 
      })

      // Complete the session
      const completeResponse = await fetch(`${API_URL}/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'completed',
          score: finalScore,
          hints_used: 1,
          time_elapsed: 120,
          completed_at: new Date().toISOString()
        })
      })

      const completeData = await completeResponse.json()
      expect(completeResponse.status).toBe(200)
      expect(completeData.status).toBe('completed')

      // Add to leaderboard
      const leaderboardResponse = await fetch(`${API_URL}/leaderboards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          puzzle_id: puzzleId,
          puzzle_type: 'sudoku4x4',
          difficulty: sudoku.getState().difficulty,
          score: finalScore,
          time_elapsed: 120,
          hints_used: 1,
          period_type: 'all_time'
        })
      })

      const leaderboardData = await leaderboardResponse.json()
      expect(leaderboardResponse.status).toBe(200)
      expect(leaderboardData.score).toBe(finalScore)
    })
  })

  describe('Game State Persistence', () => {
    it('should save and restore game state with moves', async () => {
      const sudoku = new Sudoku4x4()
      const initialState = sudoku.getState()
      
      // Make some valid moves
      const moves = []
      for (let row = 0; row < 4 && moves.length < 2; row++) {
        for (let col = 0; col < 4 && moves.length < 2; col++) {
          if (initialState.grid[row][col].value === null) {
            for (let value = 1; value <= 4; value++) {
              const result = sudoku.makeMove({ row, col, value })
              if (result.success) {
                moves.push({ row, col, value })
                break
              }
            }
          }
        }
      }

      const savedState = sudoku.getState()

      // Create new session with saved state
      const sessionResponse = await fetch(`${API_URL}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          puzzle_id: puzzleId,
          game_state: savedState
        })
      })

      const sessionData = await sessionResponse.json()
      const sessionId = sessionData.id

      // Fetch the session
      const fetchResponse = await fetch(`${API_URL}/sessions/${userId}/${puzzleId}`)
      const fetchedSession = await fetchResponse.json()

      expect(fetchedSession).toBeTruthy()
      
      // Verify the moves were saved
      moves.forEach(move => {
        expect(fetchedSession.game_state.grid[move.row][move.col].value).toBe(move.value)
      })
      expect(fetchedSession.game_state.moves).toHaveLength(moves.length)

      // Clean up
      await fetch(`${API_URL}/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'abandoned' })
      })
    })
  })
})