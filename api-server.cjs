const express = require('express')
const { Pool } = require('pg')
const cors = require('cors')

const app = express()
const port = 14001

// Database connection pool
const pool = new Pool({
  host: 'localhost',
  port: 14322,
  database: 'puzzler',
  user: 'postgres',
  password: 'postgres',
})

// Middleware
app.use(cors())
app.use(express.json())

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Generic query endpoint (for development only)
app.post('/api/query', async (req, res) => {
  try {
    const { sql, params } = req.body
    const result = await pool.query(sql, params)
    res.json(result.rows)
  } catch (error) {
    console.error('Query error:', error)
    res.status(500).json({ error: 'Database query failed' })
  }
})

// User profiles
app.get('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params
    const result = await pool.query('SELECT * FROM user_profiles WHERE id = $1', [id])
    res.json(result.rows[0] || null)
  } catch (error) {
    console.error('Error fetching user:', error)
    res.status(500).json({ error: 'Failed to fetch user' })
  }
})

// Get user by username
app.get('/api/users/username/:username', async (req, res) => {
  try {
    const { username } = req.params
    const result = await pool.query('SELECT * FROM user_profiles WHERE username = $1', [username])
    res.json(result.rows[0] || null)
  } catch (error) {
    console.error('Error fetching user by username:', error)
    res.status(500).json({ error: 'Failed to fetch user' })
  }
})

app.post('/api/users', async (req, res) => {
  try {
    const { username, display_name } = req.body
    const result = await pool.query(
      'INSERT INTO user_profiles (username, display_name) VALUES ($1, $2) RETURNING *',
      [username, display_name]
    )
    res.json(result.rows[0])
  } catch (error) {
    console.error('Error creating user:', error)
    res.status(500).json({ error: 'Failed to create user' })
  }
})

// Login endpoint - get or create user
app.post('/api/login', async (req, res) => {
  try {
    console.log('Login request body:', req.body)
    const { username } = req.body
    
    if (!username) {
      return res.status(400).json({ error: 'Username is required' })
    }
    
    // First check if user exists
    let result = await pool.query('SELECT * FROM user_profiles WHERE username = $1', [username])
    
    if (result.rows.length > 0) {
      // User exists, return it
      res.json(result.rows[0])
    } else {
      // Create new user
      result = await pool.query(
        'INSERT INTO user_profiles (username, display_name) VALUES ($1, $2) RETURNING *',
        [username, username]
      )
      res.json(result.rows[0])
    }
  } catch (error) {
    console.error('Error in login:', error)
    res.status(500).json({ error: 'Failed to login' })
  }
})

// Update user profile
app.patch('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { display_name, bio, preferred_difficulty } = req.body
    
    const updates = []
    const values = [id]
    let paramIndex = 2

    if (display_name !== undefined) {
      updates.push(`display_name = $${paramIndex++}`)
      values.push(display_name)
    }
    if (bio !== undefined) {
      updates.push(`bio = $${paramIndex++}`)
      values.push(bio)
    }
    if (preferred_difficulty !== undefined) {
      updates.push(`preferred_difficulty = $${paramIndex++}`)
      values.push(preferred_difficulty)
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' })
    }

    const result = await pool.query(
      `UPDATE user_profiles SET ${updates.join(', ')} WHERE id = $1 RETURNING *`,
      values
    )
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }
    
    res.json(result.rows[0])
  } catch (error) {
    console.error('Error updating user:', error)
    res.status(500).json({ error: 'Failed to update user' })
  }
})

// Game sessions
app.post('/api/sessions', async (req, res) => {
  try {
    const { user_id, puzzle_id, game_state } = req.body
    const result = await pool.query(
      `INSERT INTO game_sessions (user_id, puzzle_id, status, game_state) 
       VALUES ($1, $2, 'in_progress', $3) RETURNING *`,
      [user_id, puzzle_id, game_state ? JSON.stringify(game_state) : null]
    )
    res.json(result.rows[0])
  } catch (error) {
    console.error('Error creating session:', error)
    res.status(500).json({ error: 'Failed to create session' })
  }
})

app.patch('/api/sessions/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { status, score, moves, hints_used, time_elapsed, game_state, completed_at } = req.body
    
    const updates = []
    const values = [id]
    let paramIndex = 2

    if (status !== undefined) {
      updates.push(`status = $${paramIndex++}`)
      values.push(status)
    }
    if (score !== undefined) {
      updates.push(`score = $${paramIndex++}`)
      values.push(score)
    }
    if (moves !== undefined) {
      updates.push(`moves = $${paramIndex++}`)
      values.push(JSON.stringify(moves))
    }
    if (hints_used !== undefined) {
      updates.push(`hints_used = $${paramIndex++}`)
      values.push(hints_used)
    }
    if (time_elapsed !== undefined) {
      updates.push(`time_elapsed = $${paramIndex++}`)
      values.push(time_elapsed)
    }
    if (game_state !== undefined) {
      updates.push(`game_state = $${paramIndex++}`)
      values.push(JSON.stringify(game_state))
    }
    if (completed_at !== undefined) {
      updates.push(`completed_at = $${paramIndex++}`)
      values.push(completed_at)
    }

    updates.push(`last_played_at = NOW()`)

    const result = await pool.query(
      `UPDATE game_sessions SET ${updates.join(', ')} WHERE id = $1 RETURNING *`,
      values
    )
    res.json(result.rows[0])
  } catch (error) {
    console.error('Error updating session:', error)
    res.status(500).json({ error: 'Failed to update session' })
  }
})

// Get specific game session
app.get('/api/sessions/:userId/:puzzleId', async (req, res) => {
  try {
    const { userId, puzzleId } = req.params
    const result = await pool.query(
      `SELECT * FROM game_sessions 
       WHERE user_id = $1 AND puzzle_id = $2 AND status IN ('not_started', 'in_progress') 
       ORDER BY started_at DESC LIMIT 1`,
      [userId, puzzleId]
    )
    res.json(result.rows[0] || null)
  } catch (error) {
    console.error('Error fetching session:', error)
    res.status(500).json({ error: 'Failed to fetch session' })
  }
})

// Puzzles
app.get('/api/puzzles', async (req, res) => {
  try {
    const { type, difficulty, limit = 10, offset = 0 } = req.query
    
    let query = 'SELECT * FROM puzzles WHERE 1=1'
    const params = []
    let paramIndex = 1

    if (type) {
      query += ` AND type = $${paramIndex++}`
      params.push(type)
    }
    if (difficulty) {
      query += ` AND difficulty = $${paramIndex++}`
      params.push(difficulty)
    }

    query += ' ORDER BY created_at DESC'
    query += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`
    params.push(limit, offset)

    const result = await pool.query(query, params)
    res.json(result.rows)
  } catch (error) {
    console.error('Error fetching puzzles:', error)
    res.status(500).json({ error: 'Failed to fetch puzzles' })
  }
})

// Get puzzle by ID
app.get('/api/puzzles/:id', async (req, res) => {
  try {
    const { id } = req.params
    const result = await pool.query('SELECT * FROM puzzles WHERE id = $1', [id])
    res.json(result.rows[0] || null)
  } catch (error) {
    console.error('Error fetching puzzle:', error)
    res.status(500).json({ error: 'Failed to fetch puzzle' })
  }
})

// Create new puzzle
app.post('/api/puzzles', async (req, res) => {
  try {
    const { type, difficulty, title, description, puzzle_data, solution_data } = req.body
    const result = await pool.query(
      `INSERT INTO puzzles (type, difficulty, title, description, puzzle_data, solution_data)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [type, difficulty, title, description, JSON.stringify(puzzle_data), JSON.stringify(solution_data)]
    )
    res.json(result.rows[0])
  } catch (error) {
    console.error('Error creating puzzle:', error)
    res.status(500).json({ error: 'Failed to create puzzle' })
  }
})

// Leaderboards
app.get('/api/leaderboards', async (req, res) => {
  try {
    const { puzzle_type, difficulty, period_type, limit = 10, offset = 0 } = req.query
    
    let query = `
      SELECT l.*, u.username, u.display_name 
      FROM leaderboards l
      JOIN user_profiles u ON l.user_id = u.id
      WHERE 1=1
    `
    const params = []
    let paramIndex = 1

    if (puzzle_type) {
      query += ` AND l.puzzle_type = $${paramIndex++}`
      params.push(puzzle_type)
    }
    if (difficulty) {
      query += ` AND l.difficulty = $${paramIndex++}`
      params.push(difficulty)
    }
    if (period_type) {
      query += ` AND l.period_type = $${paramIndex++}`
      params.push(period_type)
    }

    query += ' ORDER BY l.score DESC, l.time_elapsed ASC'
    query += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`
    params.push(limit, offset)

    const result = await pool.query(query, params)
    res.json(result.rows)
  } catch (error) {
    console.error('Error fetching leaderboards:', error)
    res.status(500).json({ error: 'Failed to fetch leaderboards' })
  }
})

// Add leaderboard entry
app.post('/api/leaderboards', async (req, res) => {
  try {
    const { user_id, puzzle_id, puzzle_type, difficulty, score, time_elapsed, hints_used, period_type } = req.body
    const result = await pool.query(
      `INSERT INTO leaderboards (user_id, puzzle_id, puzzle_type, difficulty, score, time_elapsed, hints_used, period_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [user_id, puzzle_id, puzzle_type, difficulty, score, time_elapsed, hints_used, period_type]
    )
    res.json(result.rows[0])
  } catch (error) {
    console.error('Error creating leaderboard entry:', error)
    res.status(500).json({ error: 'Failed to create leaderboard entry' })
  }
})

// Generate puzzle
app.post('/api/puzzles/generate', async (req, res) => {
  try {
    const { type = 'sudoku4x4', difficulty = 'medium', count = 1 } = req.body
    
    // For now, use the existing database seed approach
    // In production, you'd integrate with the puzzle generation service
    const puzzles = []
    
    for (let i = 0; i < count; i++) {
      // Generate puzzle data (simplified for now)
      const baseSolution = [
        [1, 2, 3, 4],
        [3, 4, 1, 2],
        [2, 1, 4, 3],
        [4, 3, 2, 1]
      ]
      
      // Create puzzle by removing some numbers
      const puzzle = baseSolution.map(row => 
        row.map(num => Math.random() > 0.5 ? num : 0)
      )
      
      const result = await pool.query(
        `INSERT INTO puzzles (type, difficulty, title, puzzle_data, solution_data)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [
          type,
          difficulty,
          `Generated ${difficulty} ${type} #${Date.now() % 9999}`,
          JSON.stringify(puzzle),
          JSON.stringify(baseSolution)
        ]
      )
      
      puzzles.push(result.rows[0])
    }
    
    res.json(count === 1 ? puzzles[0] : puzzles)
  } catch (error) {
    console.error('Error generating puzzle:', error)
    res.status(500).json({ error: 'Failed to generate puzzle' })
  }
})

// Achievements
app.get('/api/achievements', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM achievements ORDER BY points DESC')
    res.json(result.rows)
  } catch (error) {
    console.error('Error fetching achievements:', error)
    res.status(500).json({ error: 'Failed to fetch achievements' })
  }
})

// User achievements
app.get('/api/users/:userId/achievements', async (req, res) => {
  try {
    const { userId } = req.params
    const result = await pool.query(
      `SELECT a.*, ua.earned_at 
       FROM user_achievements ua
       JOIN achievements a ON ua.achievement_id = a.id
       WHERE ua.user_id = $1
       ORDER BY ua.earned_at DESC`,
      [userId]
    )
    res.json(result.rows)
  } catch (error) {
    console.error('Error fetching user achievements:', error)
    res.status(500).json({ error: 'Failed to fetch user achievements' })
  }
})

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`API server running at http://localhost:${port}`)
  console.log(`Health check: http://localhost:${port}/api/health`)
  console.log(`Also accessible on all network interfaces on port ${port}`)
})

module.exports = app