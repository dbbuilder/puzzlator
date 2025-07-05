import { describe, it, expect, beforeAll } from 'vitest'

// Test configuration
const API_URL = 'http://localhost:14001/api'

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

// Generate unique test data
const timestamp = Date.now()
const testUsername = `testuser_${timestamp}`
const testPuzzleTitle = `Test Puzzle ${timestamp}`

describe('API Integration Tests', () => {
  let createdUserId: string
  let createdPuzzleId: string
  let createdSessionId: string

  describe('Health Check', () => {
    it('should return health status', async () => {
      const { response, data } = await apiRequest('/health')
      
      expect(response.status).toBe(200)
      expect(data).toHaveProperty('status', 'ok')
      expect(data).toHaveProperty('timestamp')
    })
  })

  describe('User Profile Flow', () => {
    it('should create a new user profile', async () => {
      const { response, data } = await apiRequest('/users', {
        method: 'POST',
        body: JSON.stringify({
          username: testUsername,
          display_name: 'Test User',
        }),
      })

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('id')
      expect(data.username).toBe(testUsername)
      expect(data.display_name).toBe('Test User')
      expect(data.total_score).toBe(0)
      expect(data.puzzles_completed).toBe(0)
      
      createdUserId = data.id
    })

    it('should fetch the created user profile', async () => {
      expect(createdUserId).toBeDefined()
      
      const { response, data } = await apiRequest(`/users/${createdUserId}`)

      expect(response.status).toBe(200)
      expect(data.id).toBe(createdUserId)
      expect(data.username).toBe(testUsername)
    })

    it('should update the user profile', async () => {
      expect(createdUserId).toBeDefined()
      
      const { response, data } = await apiRequest(`/users/${createdUserId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          display_name: 'Updated Test User',
          bio: 'This is my test bio',
          preferred_difficulty: 'hard',
        }),
      })

      expect(response.status).toBe(200)
      expect(data.display_name).toBe('Updated Test User')
      expect(data.bio).toBe('This is my test bio')
      expect(data.preferred_difficulty).toBe('hard')
    })
  })

  describe('Puzzle Management', () => {
    it('should create a new puzzle', async () => {
      const puzzleData = {
        type: 'sudoku4x4',
        difficulty: 'medium',
        title: testPuzzleTitle,
        description: 'Created via API integration test',
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
      expect(data.title).toBe(testPuzzleTitle)
      expect(data.max_score).toBe(1000)
      expect(data.hint_penalty).toBe(20)
      
      createdPuzzleId = data.id
    })

    it('should fetch puzzles with filters', async () => {
      const { response, data } = await apiRequest('/puzzles?type=sudoku4x4&limit=5')

      expect(response.status).toBe(200)
      expect(Array.isArray(data)).toBe(true)
      expect(data.length).toBeGreaterThan(0)
      expect(data.every((p: any) => p.type === 'sudoku4x4')).toBe(true)
    })

    it('should fetch the created puzzle by id', async () => {
      expect(createdPuzzleId).toBeDefined()
      
      const { response, data } = await apiRequest(`/puzzles/${createdPuzzleId}`)

      expect(response.status).toBe(200)
      expect(data.id).toBe(createdPuzzleId)
      expect(data.title).toBe(testPuzzleTitle)
    })
  })

  describe('Game Session Flow', () => {
    it('should create a new game session', async () => {
      expect(createdUserId).toBeDefined()
      expect(createdPuzzleId).toBeDefined()
      
      const { response, data } = await apiRequest('/sessions', {
        method: 'POST',
        body: JSON.stringify({
          user_id: createdUserId,
          puzzle_id: createdPuzzleId,
          game_state: { grid: [[0, 2, 0, 4], [3, 0, 0, 0], [0, 0, 0, 3], [4, 0, 2, 0]] },
        }),
      })

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('id')
      expect(data.user_id).toBe(createdUserId)
      expect(data.puzzle_id).toBe(createdPuzzleId)
      expect(data.status).toBe('in_progress')
      expect(data.score).toBe(0)
      expect(data.hints_used).toBe(0)
      
      createdSessionId = data.id
    })

    it('should fetch active game session', async () => {
      expect(createdUserId).toBeDefined()
      expect(createdPuzzleId).toBeDefined()
      
      const { response, data } = await apiRequest(`/sessions/${createdUserId}/${createdPuzzleId}`)

      expect(response.status).toBe(200)
      expect(data).toBeTruthy()
      expect(data.user_id).toBe(createdUserId)
      expect(data.puzzle_id).toBe(createdPuzzleId)
      expect(data.status).toBe('in_progress')
    })

    it('should update game session progress', async () => {
      expect(createdSessionId).toBeDefined()
      
      const updateData = {
        score: 500,
        moves: [{ row: 0, col: 1, value: 2 }],
        hints_used: 1,
        time_elapsed: 60,
      }

      const { response, data } = await apiRequest(`/sessions/${createdSessionId}`, {
        method: 'PATCH',
        body: JSON.stringify(updateData),
      })

      expect(response.status).toBe(200)
      expect(data.score).toBe(500)
      expect(data.hints_used).toBe(1)
      expect(data.time_elapsed).toBe(60)
    })

    it('should complete game session', async () => {
      expect(createdSessionId).toBeDefined()
      
      const updateData = {
        status: 'completed',
        score: 850,
        moves: [
          { row: 0, col: 1, value: 2 },
          { row: 0, col: 2, value: 3 },
        ],
        hints_used: 1,
        time_elapsed: 120,
        completed_at: new Date().toISOString(),
      }

      const { response, data } = await apiRequest(`/sessions/${createdSessionId}`, {
        method: 'PATCH',
        body: JSON.stringify(updateData),
      })

      expect(response.status).toBe(200)
      expect(data.status).toBe('completed')
      expect(data.score).toBe(850)
      expect(data.time_elapsed).toBe(120)
      expect(data.completed_at).toBeTruthy()
    })
  })

  describe('Leaderboard Integration', () => {
    it('should add a leaderboard entry', async () => {
      expect(createdUserId).toBeDefined()
      expect(createdPuzzleId).toBeDefined()
      
      const entryData = {
        user_id: createdUserId,
        puzzle_id: createdPuzzleId,
        puzzle_type: 'sudoku4x4',
        difficulty: 'medium',
        score: 850,
        time_elapsed: 120,
        hints_used: 1,
        period_type: 'all_time',
      }

      const { response, data } = await apiRequest('/leaderboards', {
        method: 'POST',
        body: JSON.stringify(entryData),
      })

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('id')
      expect(data.score).toBe(850)
      expect(data.time_elapsed).toBe(120)
    })

    it('should fetch leaderboard entries', async () => {
      const { response, data } = await apiRequest('/leaderboards?puzzle_type=sudoku4x4&limit=10')

      expect(response.status).toBe(200)
      expect(Array.isArray(data)).toBe(true)
      expect(data.length).toBeGreaterThan(0)
      
      // Check if our entry is in the leaderboard
      const ourEntry = data.find((entry: any) => entry.user_id === createdUserId)
      expect(ourEntry).toBeTruthy()
      expect(ourEntry.score).toBe(850)
    })
  })

  describe('Achievements', () => {
    it('should fetch all achievements', async () => {
      const { response, data } = await apiRequest('/achievements')

      expect(response.status).toBe(200)
      expect(Array.isArray(data)).toBe(true)
      expect(data.length).toBeGreaterThan(0)
      
      // Check for specific achievements we know exist
      const firstPuzzleAchievement = data.find((a: any) => a.code === 'FIRST_PUZZLE')
      expect(firstPuzzleAchievement).toBeTruthy()
      expect(firstPuzzleAchievement.name).toBe('First Steps')
    })

    it('should fetch user achievements', async () => {
      expect(createdUserId).toBeDefined()
      
      const { response, data } = await apiRequest(`/users/${createdUserId}/achievements`)

      expect(response.status).toBe(200)
      expect(Array.isArray(data)).toBe(true)
      // New user might not have achievements yet, so just check it's an array
    })
  })
})