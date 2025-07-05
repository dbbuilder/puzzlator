import { describe, it, expect, beforeAll, afterAll } from 'vitest'
// @ts-ignore - pg is a CommonJS module
import pg from 'pg'
const { Pool } = pg

describe('Database Operations', () => {
  let pool: any
  const timestamp = Date.now()
  let testUserId: string
  let testPuzzleId: string

  beforeAll(async () => {
    pool = new Pool({
      host: 'localhost',
      port: 14322,
      database: 'puzzler',
      user: 'postgres',
      password: 'postgres',
    })
    
    // Generate proper UUIDs for test data
    const uuidResult = await pool.query(
      'SELECT uuid_generate_v4() as user_id, uuid_generate_v4() as puzzle_id'
    )
    testUserId = uuidResult.rows[0].user_id
    testPuzzleId = uuidResult.rows[0].puzzle_id
  })

  afterAll(async () => {
    // Clean up test data
    await pool.query('DELETE FROM game_sessions WHERE user_id = $1', [testUserId])
    await pool.query('DELETE FROM leaderboards WHERE user_id = $1', [testUserId])
    await pool.query('DELETE FROM user_achievements WHERE user_id = $1', [testUserId])
    await pool.query('DELETE FROM user_profiles WHERE id = $1', [testUserId])
    await pool.query('DELETE FROM puzzles WHERE id = $1', [testPuzzleId])
    await pool.end()
  })

  describe('User Profile Operations', () => {
    it('should create and retrieve a user profile', async () => {
      // Create user
      const createResult = await pool.query(
        `INSERT INTO user_profiles (id, username, display_name) 
         VALUES ($1, $2, $3) RETURNING *`,
        [testUserId, `testuser_${timestamp}`, 'Test User']
      )
      
      expect(createResult.rows).toHaveLength(1)
      const createdUser = createResult.rows[0]
      expect(createdUser.id).toBe(testUserId)
      expect(createdUser.username).toBe(`testuser_${timestamp}`)
      expect(createdUser.total_score).toBe(0)
      expect(createdUser.puzzles_completed).toBe(0)

      // Retrieve user
      const getResult = await pool.query(
        'SELECT * FROM user_profiles WHERE id = $1',
        [testUserId]
      )
      
      expect(getResult.rows).toHaveLength(1)
      expect(getResult.rows[0].id).toBe(testUserId)
    })

    it('should update user profile fields', async () => {
      const updateResult = await pool.query(
        `UPDATE user_profiles 
         SET display_name = $2, bio = $3, preferred_difficulty = $4
         WHERE id = $1 RETURNING *`,
        [testUserId, 'Updated Name', 'Test bio', 'hard']
      )
      
      expect(updateResult.rows).toHaveLength(1)
      const updatedUser = updateResult.rows[0]
      expect(updatedUser.display_name).toBe('Updated Name')
      expect(updatedUser.bio).toBe('Test bio')
      expect(updatedUser.preferred_difficulty).toBe('hard')
    })
  })

  describe('Puzzle Operations', () => {
    it('should create and retrieve a puzzle', async () => {
      const puzzleData = [[1, 0, 3, 0], [0, 4, 0, 2], [2, 0, 4, 0], [0, 3, 0, 1]]
      const solutionData = [[1, 2, 3, 4], [3, 4, 1, 2], [2, 1, 4, 3], [4, 3, 2, 1]]

      const createResult = await pool.query(
        `INSERT INTO puzzles (id, type, difficulty, title, puzzle_data, solution_data)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [testPuzzleId, 'sudoku4x4', 'medium', 'Test Puzzle', 
         JSON.stringify(puzzleData), JSON.stringify(solutionData)]
      )
      
      expect(createResult.rows).toHaveLength(1)
      const createdPuzzle = createResult.rows[0]
      expect(createdPuzzle.id).toBe(testPuzzleId)
      expect(createdPuzzle.type).toBe('sudoku4x4')
      expect(createdPuzzle.max_score).toBe(1000)
      expect(createdPuzzle.hint_penalty).toBe(20)
    })

    it('should list puzzles with filters', async () => {
      const result = await pool.query(
        `SELECT * FROM puzzles 
         WHERE type = $1 AND difficulty = $2 
         ORDER BY created_at DESC LIMIT 10`,
        ['sudoku4x4', 'medium']
      )
      
      expect(result.rows.length).toBeGreaterThan(0)
      result.rows.forEach((puzzle: any) => {
        expect(puzzle.type).toBe('sudoku4x4')
        expect(puzzle.difficulty).toBe('medium')
      })
    })
  })

  describe('Game Session Operations', () => {
    let sessionId: string

    it('should create a game session', async () => {
      const gameState = {
        grid: [[1, 0, 3, 0], [0, 4, 0, 2], [2, 0, 4, 0], [0, 3, 0, 1]],
        moves: []
      }

      const createResult = await pool.query(
        `INSERT INTO game_sessions (user_id, puzzle_id, status, game_state)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [testUserId, testPuzzleId, 'in_progress', JSON.stringify(gameState)]
      )
      
      expect(createResult.rows).toHaveLength(1)
      const session = createResult.rows[0]
      sessionId = session.id
      expect(session.user_id).toBe(testUserId)
      expect(session.puzzle_id).toBe(testPuzzleId)
      expect(session.status).toBe('in_progress')
      expect(session.score).toBe(0)
    })

    it('should update game session progress', async () => {
      const moves = [{ row: 0, col: 1, value: 2, timestamp: Date.now() }]
      
      const updateResult = await pool.query(
        `UPDATE game_sessions 
         SET score = $2, moves = $3, hints_used = $4, time_elapsed = $5, last_played_at = NOW()
         WHERE id = $1 RETURNING *`,
        [sessionId, 500, JSON.stringify(moves), 1, 60]
      )
      
      expect(updateResult.rows).toHaveLength(1)
      const updated = updateResult.rows[0]
      expect(updated.score).toBe(500)
      expect(updated.hints_used).toBe(1)
      expect(updated.time_elapsed).toBe(60)
    })

    it('should complete a game session', async () => {
      const completeResult = await pool.query(
        `UPDATE game_sessions 
         SET status = $2, score = $3, completed_at = NOW()
         WHERE id = $1 RETURNING *`,
        [sessionId, 'completed', 850]
      )
      
      expect(completeResult.rows).toHaveLength(1)
      const completed = completeResult.rows[0]
      expect(completed.status).toBe('completed')
      expect(completed.score).toBe(850)
      expect(completed.completed_at).toBeTruthy()
    })

    it('should handle concurrent session constraint', async () => {
      // Try to create another session for same user/puzzle
      try {
        await pool.query(
          `INSERT INTO game_sessions (user_id, puzzle_id, status)
           VALUES ($1, $2, $3)`,
          [testUserId, testPuzzleId, 'in_progress']
        )
        // Should not reach here
        expect(true).toBe(false)
      } catch (error: any) {
        expect(error.code).toBe('23505') // Unique constraint violation
        expect(error.constraint).toBe('unique_active_sessions')
      }
    })
  })

  describe('Leaderboard Operations', () => {
    it('should add leaderboard entry', async () => {
      const createResult = await pool.query(
        `INSERT INTO leaderboards 
         (user_id, puzzle_id, puzzle_type, difficulty, score, time_elapsed, hints_used, period_type)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [testUserId, testPuzzleId, 'sudoku4x4', 'medium', 850, 120, 1, 'all_time']
      )
      
      expect(createResult.rows).toHaveLength(1)
      const entry = createResult.rows[0]
      expect(entry.score).toBe(850)
      expect(entry.time_elapsed).toBe(120)
    })

    it('should retrieve leaderboard with user info', async () => {
      const result = await pool.query(
        `SELECT l.*, u.username, u.display_name 
         FROM leaderboards l
         JOIN user_profiles u ON l.user_id = u.id
         WHERE l.puzzle_type = $1 AND l.period_type = $2
         ORDER BY l.score DESC, l.time_elapsed ASC
         LIMIT 10`,
        ['sudoku4x4', 'all_time']
      )
      
      expect(result.rows.length).toBeGreaterThan(0)
      const firstEntry = result.rows[0]
      expect(firstEntry).toHaveProperty('username')
      expect(firstEntry).toHaveProperty('display_name')
      expect(firstEntry).toHaveProperty('score')
    })
  })

  describe('Achievement Operations', () => {
    it('should have achievements in database', async () => {
      const result = await pool.query(
        'SELECT * FROM achievements ORDER BY sort_order, points DESC'
      )
      
      expect(result.rows.length).toBeGreaterThan(0)
      const firstAchievement = result.rows[0]
      expect(firstAchievement).toHaveProperty('code')
      expect(firstAchievement).toHaveProperty('name')
      expect(firstAchievement).toHaveProperty('description')
      expect(firstAchievement).toHaveProperty('points')
    })

    it('should grant achievement to user', async () => {
      // Get first achievement
      const achievementResult = await pool.query(
        'SELECT id FROM achievements LIMIT 1'
      )
      const achievementId = achievementResult.rows[0].id

      // Grant to user
      const grantResult = await pool.query(
        `INSERT INTO user_achievements (user_id, achievement_id)
         VALUES ($1, $2) 
         ON CONFLICT (user_id, achievement_id) DO NOTHING
         RETURNING *`,
        [testUserId, achievementId]
      )
      
      if (grantResult.rows.length > 0) {
        expect(grantResult.rows[0].user_id).toBe(testUserId)
        expect(grantResult.rows[0].achievement_id).toBe(achievementId)
      }
    })
  })

  describe('Transaction Operations', () => {
    it('should complete game and update stats atomically', async () => {
      const client = await pool.connect()
      
      try {
        await client.query('BEGIN')
        
        // Generate a new puzzle ID for this test to avoid conflicts
        const newPuzzleResult = await client.query('SELECT uuid_generate_v4() as puzzle_id')
        const newPuzzleId = newPuzzleResult.rows[0].puzzle_id
        
        // Create the puzzle first
        await client.query(
          `INSERT INTO puzzles (id, type, difficulty, title, puzzle_data, solution_data)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [newPuzzleId, 'sudoku4x4', 'medium', 'Transaction Test Puzzle', 
           JSON.stringify([[1,0,0,0]]), JSON.stringify([[1,2,3,4]])]
        )
        
        // Create a new session for transaction test
        const sessionResult = await client.query(
          `INSERT INTO game_sessions (user_id, puzzle_id, status, score)
           VALUES ($1, $2, $3, $4) RETURNING id`,
          [testUserId, newPuzzleId, 'completed', 900]
        )
        const transactionSessionId = sessionResult.rows[0].id
        
        // Update user stats
        await client.query(
          `UPDATE user_profiles 
           SET total_score = total_score + $2, 
               puzzles_completed = puzzles_completed + 1
           WHERE id = $1`,
          [testUserId, 900]
        )
        
        // Add leaderboard entry
        await client.query(
          `INSERT INTO leaderboards 
           (user_id, puzzle_id, puzzle_type, difficulty, score, time_elapsed, period_type)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [testUserId, newPuzzleId, 'sudoku4x4', 'medium', 900, 100, 'daily']
        )
        
        await client.query('COMMIT')
        
        // Verify the transaction
        const userResult = await pool.query(
          'SELECT total_score, puzzles_completed FROM user_profiles WHERE id = $1',
          [testUserId]
        )
        
        expect(userResult.rows[0].total_score).toBeGreaterThanOrEqual(900)
        expect(userResult.rows[0].puzzles_completed).toBeGreaterThanOrEqual(1)
        
        // Clean up transaction test data
        await pool.query('DELETE FROM game_sessions WHERE id = $1', [transactionSessionId])
        await pool.query('DELETE FROM leaderboards WHERE puzzle_id = $1', [newPuzzleId])
        await pool.query('DELETE FROM puzzles WHERE id = $1', [newPuzzleId])
        
      } catch (error) {
        await client.query('ROLLBACK')
        throw error
      } finally {
        client.release()
      }
    })
  })
})