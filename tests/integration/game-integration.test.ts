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
  let sessionId: string

  beforeAll(async () => {
    // Create test user
    const timestamp = Date.now()
    const userResponse = await fetch(`${API_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: `gametest_${timestamp}`,
        display_name: 'Game Test User'
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
    it('should create a new game session when starting a puzzle', async () => {
      // Initialize game with puzzle data
      const sudoku = new Sudoku4x4()
      sudoku.initializePuzzle(
        [[1, 0, 3, 0], [0, 4, 0, 2], [2, 0, 4, 0], [0, 3, 0, 1]],
        [[1, 2, 3, 4], [3, 4, 1, 2], [2, 1, 4, 3], [4, 3, 2, 1]]
      )

      // Create game session in database
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
      expect(sessionResponse.status).toBe(200)
      expect(sessionData.status).toBe('in_progress')
      expect(sessionData.game_state).toMatchObject({
        grid: [[1, 0, 3, 0], [0, 4, 0, 2], [2, 0, 4, 0], [0, 3, 0, 1]]
      })
      
      sessionId = sessionData.id
    })

    it('should update session when making moves', async () => {
      const sudoku = new Sudoku4x4()
      sudoku.initializePuzzle(
        [[1, 0, 3, 0], [0, 4, 0, 2], [2, 0, 4, 0], [0, 3, 0, 1]],
        [[1, 2, 3, 4], [3, 4, 1, 2], [2, 1, 4, 3], [4, 3, 2, 1]]
      )

      // Make a move
      sudoku.makeMove(0, 1, 2)
      const state = sudoku.getState()

      // Update session with new game state
      const updateResponse = await fetch(`${API_URL}/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          game_state: state,
          moves: state.moveHistory,
          score: sudoku.calculateScore(30, 0),
          time_elapsed: 30
        })
      })

      const updateData = await updateResponse.json()
      expect(updateResponse.status).toBe(200)
      expect(updateData.game_state.grid[0][1]).toBe(2)
      expect(updateData.score).toBeGreaterThan(0)
    })

    it('should handle hints and update score accordingly', async () => {
      const sudoku = new Sudoku4x4()
      sudoku.initializePuzzle(
        [[1, 0, 3, 0], [0, 4, 0, 2], [2, 0, 4, 0], [0, 3, 0, 1]],
        [[1, 2, 3, 4], [3, 4, 1, 2], [2, 1, 4, 3], [4, 3, 2, 1]]
      )

      // Use a hint
      const hint = sudoku.getHint()
      expect(hint).toBeTruthy()
      
      if (hint) {
        sudoku.makeMove(hint.row, hint.col, hint.value)
      }

      // Update session with hint usage
      const updateResponse = await fetch(`${API_URL}/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          game_state: sudoku.getState(),
          hints_used: 1,
          score: sudoku.calculateScore(60, 1), // 1 hint used
          time_elapsed: 60
        })
      })

      const updateData = await updateResponse.json()
      expect(updateResponse.status).toBe(200)
      expect(updateData.hints_used).toBe(1)
      // Score should be reduced due to hint usage
      expect(updateData.score).toBeLessThan(sudoku.calculateScore(60, 0))
    })

    it('should complete session and update leaderboard', async () => {
      const sudoku = new Sudoku4x4()
      sudoku.initializePuzzle(
        [[1, 2, 3, 4], [3, 4, 1, 2], [2, 1, 4, 3], [4, 3, 2, 1]], // Complete puzzle
        [[1, 2, 3, 4], [3, 4, 1, 2], [2, 1, 4, 3], [4, 3, 2, 1]]
      )

      expect(sudoku.checkCompletion()).toBe(true)
      const finalScore = sudoku.calculateScore(120, 1)

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
          difficulty: 'easy',
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
    it('should save and restore game state', async () => {
      const sudoku = new Sudoku4x4()
      sudoku.initializePuzzle(
        [[1, 0, 3, 0], [0, 4, 0, 2], [2, 0, 4, 0], [0, 3, 0, 1]],
        [[1, 2, 3, 4], [3, 4, 1, 2], [2, 1, 4, 3], [4, 3, 2, 1]]
      )

      // Make some moves
      sudoku.makeMove(0, 1, 2)
      sudoku.makeMove(1, 0, 3)
      
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
      const newSessionId = sessionData.id

      // Fetch the session
      const fetchResponse = await fetch(`${API_URL}/sessions/${userId}/${puzzleId}`)
      const fetchedSession = await fetchResponse.json()

      expect(fetchedSession).toBeTruthy()
      expect(fetchedSession.game_state.grid[0][1]).toBe(2)
      expect(fetchedSession.game_state.grid[1][0]).toBe(3)
      expect(fetchedSession.game_state.moveHistory).toHaveLength(2)

      // Clean up
      await fetch(`${API_URL}/sessions/${newSessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'abandoned' })
      })
    })

    it('should handle undo/redo state persistence', async () => {
      const sudoku = new Sudoku4x4()
      sudoku.initializePuzzle(
        [[1, 0, 3, 0], [0, 4, 0, 2], [2, 0, 4, 0], [0, 3, 0, 1]],
        [[1, 2, 3, 4], [3, 4, 1, 2], [2, 1, 4, 3], [4, 3, 2, 1]]
      )

      // Make moves
      sudoku.makeMove(0, 1, 2)
      sudoku.makeMove(1, 0, 3)
      
      // Undo one move
      sudoku.undo()
      
      const stateAfterUndo = sudoku.getState()
      expect(stateAfterUndo.grid[1][0]).toBe(0)
      expect(stateAfterUndo.moveHistory).toHaveLength(1)
      expect(stateAfterUndo.undoStack).toHaveLength(1)

      // Save this state
      const sessionResponse = await fetch(`${API_URL}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          puzzle_id: puzzleId,
          game_state: stateAfterUndo
        })
      })

      const sessionData = await sessionResponse.json()
      expect(sessionData.game_state.undoStack).toHaveLength(1)
      
      // Restore and verify redo works
      const restoredSudoku = new Sudoku4x4()
      restoredSudoku.loadState(sessionData.game_state)
      
      restoredSudoku.redo()
      const stateAfterRedo = restoredSudoku.getState()
      expect(stateAfterRedo.grid[1][0]).toBe(3)
    })
  })
})