import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
// @ts-ignore - pg is a CommonJS module
import pg from 'pg'
const { Pool } = pg

// Test configuration
const API_URL = 'http://localhost:14001/api'
const TEST_USER_ID = 'test-user-123'
const TEST_PUZZLE_ID = 'test-puzzle-123'

// Database connection for test cleanup
const pool = new Pool({
  host: 'localhost',
  port: 14322,
  database: 'puzzler',
  user: 'postgres',
  password: 'postgres',
})

// Helper function to make API requests
async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })
  
  const data = await response.json()
  return { response, data }
}

describe('API Endpoints', () => {
  beforeAll(async () => {
    // Clean up test data before starting
    await pool.query("DELETE FROM game_sessions WHERE user_id::text LIKE $1", ['test-%'])
    await pool.query("DELETE FROM user_profiles WHERE id::text LIKE $1", ['test-%'])
    await pool.query("DELETE FROM puzzles WHERE id::text LIKE $1", ['test-%'])
  })

  afterAll(async () => {
    // Clean up test data after tests
    await pool.query("DELETE FROM game_sessions WHERE user_id::text LIKE $1", ['test-%'])
    await pool.query("DELETE FROM user_profiles WHERE id::text LIKE $1", ['test-%'])
    await pool.query("DELETE FROM puzzles WHERE id::text LIKE $1", ['test-%'])
    await pool.end()
  })

  describe('Health Check', () => {
    it('should return health status', async () => {
      const { response, data } = await apiRequest('/health')
      
      expect(response.status).toBe(200)
      expect(data).toHaveProperty('status', 'ok')
      expect(data).toHaveProperty('timestamp')
    })
  })

  describe('User Profiles', () => {
    let createdUserId: string

    it('should create a new user profile', async () => {
      const { response, data } = await apiRequest('/users', {
        method: 'POST',
        body: JSON.stringify({
          username: 'testuser123',
          display_name: 'Test User 123',
        }),
      })

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('id')
      expect(data.username).toBe('testuser123')
      expect(data.display_name).toBe('Test User 123')
      expect(data.total_score).toBe(0)
      expect(data.puzzles_completed).toBe(0)
      
      createdUserId = data.id
    })

    it('should fetch user profile by id', async () => {
      const { response, data } = await apiRequest(`/users/${createdUserId}`)

      expect(response.status).toBe(200)
      expect(data.id).toBe(createdUserId)
      expect(data.username).toBe('testuser123')
    })

    it('should return null for non-existent user', async () => {
      const { response, data } = await apiRequest('/users/non-existent-id')

      expect(response.status).toBe(200)
      expect(data).toBeNull()
    })

    it('should update user profile', async () => {
      const { response, data } = await apiRequest(`/users/${createdUserId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          display_name: 'Updated Test User',
          bio: 'This is my bio',
          preferred_difficulty: 'hard',
        }),
      })

      expect(response.status).toBe(200)
      expect(data.display_name).toBe('Updated Test User')
      expect(data.bio).toBe('This is my bio')
      expect(data.preferred_difficulty).toBe('hard')
    })
  })

  describe('Puzzles', () => {
    let testPuzzleId: string

    beforeEach(async () => {
      // Create a test puzzle directly in the database
      const result = await pool.query(
        `INSERT INTO puzzles (id, type, difficulty, title, puzzle_data, solution_data)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [
          TEST_PUZZLE_ID,
          'sudoku4x4',
          'easy',
          'Test Puzzle',
          JSON.stringify([[1, 0, 3, 0], [0, 4, 0, 2], [2, 0, 4, 0], [0, 3, 0, 1]]),
          JSON.stringify([[1, 2, 3, 4], [3, 4, 1, 2], [2, 1, 4, 3], [4, 3, 2, 1]]),
        ]
      )
      testPuzzleId = result.rows[0].id
    })

    it('should fetch puzzles with filters', async () => {
      const { response, data } = await apiRequest('/puzzles?type=sudoku4x4&difficulty=easy&limit=5')

      expect(response.status).toBe(200)
      expect(Array.isArray(data)).toBe(true)
      expect(data.length).toBeGreaterThan(0)
      expect(data[0]).toHaveProperty('type', 'sudoku4x4')
      expect(data[0]).toHaveProperty('difficulty', 'easy')
    })

    it('should fetch puzzle by id', async () => {
      const { response, data } = await apiRequest(`/puzzles/${testPuzzleId}`)

      expect(response.status).toBe(200)
      expect(data.id).toBe(testPuzzleId)
      expect(data.type).toBe('sudoku4x4')
      expect(data.title).toBe('Test Puzzle')
    })

    it('should create a new puzzle', async () => {
      const puzzleData = {
        type: 'sudoku4x4',
        difficulty: 'medium',
        title: 'API Test Puzzle',
        description: 'Created via API test',
        puzzle_data: [[0, 2, 0, 4], [3, 0, 0, 0], [0, 0, 0, 3], [4, 0, 2, 0]],
        solution_data: [[1, 2, 3, 4], [3, 4, 1, 2], [2, 1, 4, 3], [4, 3, 2, 1]],
      }

      const { response, data } = await apiRequest('/puzzles', {
        method: 'POST',
        body: JSON.stringify(puzzleData),
      })

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('id')
      expect(data.type).toBe('sudoku4x4')
      expect(data.difficulty).toBe('medium')
      expect(data.title).toBe('API Test Puzzle')
      expect(data.max_score).toBe(1000)
      expect(data.hint_penalty).toBe(20)

      // Clean up
      await pool.query('DELETE FROM puzzles WHERE id = $1', [data.id])
    })
  })

  describe('Game Sessions', () => {
    let testUserId: string
    let testPuzzleId: string
    let sessionId: string

    beforeEach(async () => {
      // Create test user and puzzle
      const userResult = await pool.query(
        `INSERT INTO user_profiles (id, username, display_name)
         VALUES ($1, $2, $3)
         RETURNING id`,
        ['test-user-session', 'testsession', 'Test Session User']
      )
      testUserId = userResult.rows[0].id

      const puzzleResult = await pool.query(
        `INSERT INTO puzzles (id, type, difficulty, title, puzzle_data, solution_data)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [
          'test-puzzle-session',
          'sudoku4x4',
          'easy',
          'Session Test Puzzle',
          JSON.stringify([[1, 0, 3, 0]]),
          JSON.stringify([[1, 2, 3, 4]]),
        ]
      )
      testPuzzleId = puzzleResult.rows[0].id
    })

    afterEach(async () => {
      // Clean up test data
      await pool.query('DELETE FROM game_sessions WHERE user_id = $1', [testUserId])
      await pool.query('DELETE FROM user_profiles WHERE id = $1', [testUserId])
      await pool.query('DELETE FROM puzzles WHERE id = $1', [testPuzzleId])
    })

    it('should create a new game session', async () => {
      const { response, data } = await apiRequest('/sessions', {
        method: 'POST',
        body: JSON.stringify({
          user_id: testUserId,
          puzzle_id: testPuzzleId,
          game_state: { grid: [[1, 0, 3, 0]] },
        }),
      })

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('id')
      expect(data.user_id).toBe(testUserId)
      expect(data.puzzle_id).toBe(testPuzzleId)
      expect(data.status).toBe('in_progress')
      expect(data.score).toBe(0)
      expect(data.hints_used).toBe(0)
      
      sessionId = data.id
    })

    it('should fetch active game session', async () => {
      const { response, data } = await apiRequest(`/sessions/${testUserId}/${testPuzzleId}`)

      expect(response.status).toBe(200)
      expect(data.user_id).toBe(testUserId)
      expect(data.puzzle_id).toBe(testPuzzleId)
      expect(data.status).toBe('in_progress')
    })

    it('should update game session', async () => {
      const updateData = {
        status: 'completed',
        score: 850,
        moves: [{ row: 0, col: 1, value: 2 }],
        hints_used: 1,
        time_elapsed: 120,
        completed_at: new Date().toISOString(),
      }

      const { response, data } = await apiRequest(`/sessions/${sessionId}`, {
        method: 'PATCH',
        body: JSON.stringify(updateData),
      })

      expect(response.status).toBe(200)
      expect(data.status).toBe('completed')
      expect(data.score).toBe(850)
      expect(data.hints_used).toBe(1)
      expect(data.time_elapsed).toBe(120)
      expect(data.completed_at).toBeTruthy()
    })
  })

  describe('Leaderboards', () => {
    beforeEach(async () => {
      // Create test data for leaderboard
      const userResult = await pool.query(
        `INSERT INTO user_profiles (id, username, display_name)
         VALUES ($1, $2, $3)
         RETURNING id`,
        ['test-leader-user', 'testleader', 'Test Leader']
      )
      
      await pool.query(
        `INSERT INTO leaderboards (user_id, puzzle_type, difficulty, score, time_elapsed, period_type)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [userResult.rows[0].id, 'sudoku4x4', 'easy', 950, 90, 'all_time']
      )
    })

    afterEach(async () => {
      await pool.query('DELETE FROM leaderboards WHERE user_id = $1', ['test-leader-user'])
      await pool.query('DELETE FROM user_profiles WHERE id = $1', ['test-leader-user'])
    })

    it('should fetch leaderboard entries', async () => {
      const { response, data } = await apiRequest('/leaderboards?puzzle_type=sudoku4x4&limit=10')

      expect(response.status).toBe(200)
      expect(Array.isArray(data)).toBe(true)
      expect(data.length).toBeGreaterThan(0)
      expect(data[0]).toHaveProperty('score')
      expect(data[0]).toHaveProperty('username')
      expect(data[0]).toHaveProperty('time_elapsed')
    })

    it('should add leaderboard entry', async () => {
      const entryData = {
        user_id: 'test-leader-user',
        puzzle_type: 'sudoku4x4',
        difficulty: 'medium',
        score: 800,
        time_elapsed: 150,
        hints_used: 2,
        period_type: 'daily',
      }

      const { response, data } = await apiRequest('/leaderboards', {
        method: 'POST',
        body: JSON.stringify(entryData),
      })

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('id')
      expect(data.score).toBe(800)
      expect(data.time_elapsed).toBe(150)
      expect(data.period_type).toBe('daily')
    })
  })

  describe('Achievements', () => {
    it('should fetch all achievements', async () => {
      const { response, data } = await apiRequest('/achievements')

      expect(response.status).toBe(200)
      expect(Array.isArray(data)).toBe(true)
      expect(data.length).toBeGreaterThan(0)
      expect(data[0]).toHaveProperty('code')
      expect(data[0]).toHaveProperty('name')
      expect(data[0]).toHaveProperty('description')
      expect(data[0]).toHaveProperty('points')
    })

    it('should fetch user achievements', async () => {
      // First create a test user
      const userResult = await pool.query(
        `INSERT INTO user_profiles (id, username, display_name)
         VALUES ($1, $2, $3)
         RETURNING id`,
        ['test-achievement-user', 'testachieve', 'Test Achiever']
      )
      const userId = userResult.rows[0].id

      const { response, data } = await apiRequest(`/users/${userId}/achievements`)

      expect(response.status).toBe(200)
      expect(Array.isArray(data)).toBe(true)
      
      // Clean up
      await pool.query('DELETE FROM user_profiles WHERE id = $1', [userId])
    })
  })
})