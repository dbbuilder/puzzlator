import express from 'express'
import pg from 'pg'
import cors from 'cors'
import { Database } from '../types/database.generated'

const { Pool } = pg

const app = express()
const port = 3001

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

app.patch('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params
    const updates = req.body
    
    const setClause = Object.keys(updates)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ')
    
    const values = [id, ...Object.values(updates)]
    
    const result = await pool.query(
      `UPDATE user_profiles SET ${setClause} WHERE id = $1 RETURNING *`,
      values
    )
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
      [user_id, puzzle_id, game_state]
    )
    res.json(result.rows[0])
  } catch (error) {
    console.error('Error creating session:', error)
    res.status(500).json({ error: 'Failed to create session' })
  }
})

app.get('/api/sessions/:userId/:puzzleId', async (req, res) => {
  try {
    const { userId, puzzleId } = req.params
    const result = await pool.query(
      `SELECT * FROM game_sessions 
       WHERE user_id = $1 AND puzzle_id = $2 AND status IN ('in_progress', 'not_started')
       ORDER BY started_at DESC LIMIT 1`,
      [userId, puzzleId]
    )
    res.json(result.rows[0] || null)
  } catch (error) {
    console.error('Error fetching session:', error)
    res.status(500).json({ error: 'Failed to fetch session' })
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

// Puzzles
app.get('/api/puzzles', async (req, res) => {
  try {
    const { type, difficulty, limit = 10, offset = 0 } = req.query
    
    let query = 'SELECT * FROM puzzles WHERE 1=1'
    const params: any[] = []
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

app.post('/api/puzzles', async (req, res) => {
  try {
    const { type, difficulty, title, description, puzzle_data, solution_data, max_score, time_limit, hint_penalty } = req.body
    const result = await pool.query(
      `INSERT INTO puzzles (type, difficulty, title, description, puzzle_data, solution_data, max_score, time_limit, hint_penalty)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        type,
        difficulty,
        title,
        description,
        JSON.stringify(puzzle_data),
        JSON.stringify(solution_data),
        max_score || 1000,
        time_limit,
        hint_penalty || 20
      ]
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
    const { puzzle_id, puzzle_type, difficulty, period_type = 'all_time', limit = 10 } = req.query
    
    let query = `
      SELECT l.*, u.username, u.display_name, u.avatar_url
      FROM leaderboards l
      JOIN user_profiles u ON l.user_id = u.id
      WHERE 1=1
    `
    const params: any[] = []
    let paramIndex = 1

    if (puzzle_id) {
      query += ` AND l.puzzle_id = $${paramIndex++}`
      params.push(puzzle_id)
    }
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

    query += ` ORDER BY l.score DESC LIMIT $${paramIndex++}`
    params.push(limit)

    const result = await pool.query(query, params)
    res.json(result.rows)
  } catch (error) {
    console.error('Error fetching leaderboards:', error)
    res.status(500).json({ error: 'Failed to fetch leaderboards' })
  }
})

app.post('/api/leaderboards', async (req, res) => {
  try {
    const { user_id, puzzle_id, puzzle_type, difficulty, score, time_elapsed, hints_used, period_type = 'all_time' } = req.body
    
    const period_date = period_type === 'daily' ? new Date().toISOString().split('T')[0] : null
    
    const result = await pool.query(
      `INSERT INTO leaderboards (user_id, puzzle_id, puzzle_type, difficulty, score, time_elapsed, hints_used, period_type, period_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [user_id, puzzle_id, puzzle_type, difficulty, score, time_elapsed, hints_used || 0, period_type, period_date]
    )
    res.json(result.rows[0])
  } catch (error) {
    console.error('Error adding leaderboard entry:', error)
    res.status(500).json({ error: 'Failed to add leaderboard entry' })
  }
})

// Achievements
app.get('/api/achievements', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM achievements ORDER BY sort_order, name')
    res.json(result.rows)
  } catch (error) {
    console.error('Error fetching achievements:', error)
    res.status(500).json({ error: 'Failed to fetch achievements' })
  }
})

app.get('/api/users/:userId/achievements', async (req, res) => {
  try {
    const { userId } = req.params
    const result = await pool.query(
      `SELECT a.*, ua.earned_at, ua.game_session_id
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
app.listen(port, () => {
  console.log(`API server running at http://localhost:${port}`)
})

export default app