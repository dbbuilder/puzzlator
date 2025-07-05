import { Database } from '@/types/db'

export class DatabaseService {
  private baseUrl = 'http://localhost:14322'
  private connectionString = 'postgresql://postgres:postgres@localhost:14322/puzzler'
  private apiUrl = 'http://localhost:14001'

  async query<T = any>(sql: string, params?: any[]): Promise<T[]> {
    // For now, we'll implement a simple REST API approach
    // In production, you'd use a proper database client or Supabase client
    try {
      const response = await fetch('/api/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sql, params }),
      })
      
      if (!response.ok) {
        throw new Error(`Database query failed: ${response.statusText}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('Database query error:', error)
      throw error
    }
  }

  // User profiles
  async getUserProfile(userId: string): Promise<Database['public']['Tables']['user_profiles']['Row'] | null> {
    const [profile] = await this.query<Database['public']['Tables']['user_profiles']['Row']>(
      'SELECT * FROM user_profiles WHERE id = $1',
      [userId]
    )
    return profile || null
  }

  async createUserProfile(data: Database['public']['Tables']['user_profiles']['Insert']) {
    return this.query(
      'INSERT INTO user_profiles (username, display_name) VALUES ($1, $2) RETURNING *',
      [data.username, data.display_name]
    )
  }

  async updateUserProfile(userId: string, data: Database['public']['Tables']['user_profiles']['Update']) {
    const setClauses = Object.entries(data)
      .filter(([_, value]) => value !== undefined)
      .map(([key], index) => `${key} = $${index + 2}`)
      .join(', ')
    
    const values = [userId, ...Object.values(data).filter(v => v !== undefined)]
    
    return this.query(
      `UPDATE user_profiles SET ${setClauses} WHERE id = $1 RETURNING *`,
      values
    )
  }

  // Game sessions
  async createGameSession(data: Database['public']['Tables']['game_sessions']['Insert']) {
    return this.query(
      `INSERT INTO game_sessions (user_id, puzzle_id, status, game_state) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [data.user_id, data.puzzle_id, data.status || 'in_progress', data.game_state]
    )
  }

  async updateGameSession(sessionId: string, data: Database['public']['Tables']['game_sessions']['Update']) {
    const updates: string[] = []
    const values: any[] = [sessionId]
    let paramIndex = 2

    if (data.status !== undefined) {
      updates.push(`status = $${paramIndex++}`)
      values.push(data.status)
    }
    if (data.score !== undefined) {
      updates.push(`score = $${paramIndex++}`)
      values.push(data.score)
    }
    if (data.moves !== undefined) {
      updates.push(`moves = $${paramIndex++}`)
      values.push(data.moves)
    }
    if (data.hints_used !== undefined) {
      updates.push(`hints_used = $${paramIndex++}`)
      values.push(data.hints_used)
    }
    if (data.time_elapsed !== undefined) {
      updates.push(`time_elapsed = $${paramIndex++}`)
      values.push(data.time_elapsed)
    }
    if (data.game_state !== undefined) {
      updates.push(`game_state = $${paramIndex++}`)
      values.push(data.game_state)
    }
    if (data.completed_at !== undefined) {
      updates.push(`completed_at = $${paramIndex++}`)
      values.push(data.completed_at)
    }

    updates.push(`last_played_at = NOW()`)

    return this.query(
      `UPDATE game_sessions SET ${updates.join(', ')} WHERE id = $1 RETURNING *`,
      values
    )
  }

  async getActiveGameSession(userId: string, puzzleId: string) {
    const [session] = await this.query<Database['public']['Tables']['game_sessions']['Row']>(
      `SELECT * FROM game_sessions 
       WHERE user_id = $1 AND puzzle_id = $2 AND status IN ('in_progress', 'not_started')
       ORDER BY started_at DESC LIMIT 1`,
      [userId, puzzleId]
    )
    return session || null
  }

  // Puzzles
  async getPuzzle(puzzleId: string) {
    const [puzzle] = await this.query<Database['public']['Tables']['puzzles']['Row']>(
      'SELECT * FROM puzzles WHERE id = $1',
      [puzzleId]
    )
    return puzzle || null
  }

  async getPuzzles(filters: {
    type?: Database['public']['Enums']['puzzle_type']
    difficulty?: Database['public']['Enums']['difficulty_level']
    limit?: number
    offset?: number
  }) {
    let query = 'SELECT * FROM puzzles WHERE 1=1'
    const params: any[] = []
    let paramIndex = 1

    if (filters.type) {
      query += ` AND type = $${paramIndex++}`
      params.push(filters.type)
    }
    if (filters.difficulty) {
      query += ` AND difficulty = $${paramIndex++}`
      params.push(filters.difficulty)
    }

    query += ' ORDER BY created_at DESC'

    if (filters.limit) {
      query += ` LIMIT $${paramIndex++}`
      params.push(filters.limit)
    }
    if (filters.offset) {
      query += ` OFFSET $${paramIndex++}`
      params.push(filters.offset)
    }

    return this.query<Database['public']['Tables']['puzzles']['Row']>(query, params)
  }

  async createPuzzle(data: Database['public']['Tables']['puzzles']['Insert']) {
    return this.query(
      `INSERT INTO puzzles (type, difficulty, title, description, puzzle_data, solution_data, max_score, time_limit, hint_penalty)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        data.type,
        data.difficulty,
        data.title,
        data.description,
        data.puzzle_data,
        data.solution_data,
        data.max_score || 1000,
        data.time_limit,
        data.hint_penalty || 20
      ]
    )
  }

  // Leaderboards
  async getLeaderboard(filters: {
    puzzleId?: string
    puzzleType?: Database['public']['Enums']['puzzle_type']
    difficulty?: Database['public']['Enums']['difficulty_level']
    periodType?: string
    limit?: number
  }) {
    let query = `
      SELECT l.*, u.username, u.display_name 
      FROM leaderboards l
      JOIN user_profiles u ON l.user_id = u.id
      WHERE 1=1
    `
    const params: any[] = []
    let paramIndex = 1

    if (filters.puzzleId) {
      query += ` AND l.puzzle_id = $${paramIndex++}`
      params.push(filters.puzzleId)
    }
    if (filters.puzzleType) {
      query += ` AND l.puzzle_type = $${paramIndex++}`
      params.push(filters.puzzleType)
    }
    if (filters.difficulty) {
      query += ` AND l.difficulty = $${paramIndex++}`
      params.push(filters.difficulty)
    }
    if (filters.periodType) {
      query += ` AND l.period_type = $${paramIndex++}`
      params.push(filters.periodType)
    }

    query += ' ORDER BY l.score DESC'

    if (filters.limit) {
      query += ` LIMIT $${paramIndex++}`
      params.push(filters.limit)
    }

    return this.query(query, params)
  }

  async addLeaderboardEntry(data: Database['public']['Tables']['leaderboards']['Insert']) {
    return this.query(
      `INSERT INTO leaderboards (user_id, puzzle_id, puzzle_type, difficulty, score, time_elapsed, hints_used, period_type, period_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        data.user_id,
        data.puzzle_id,
        data.puzzle_type,
        data.difficulty,
        data.score,
        data.time_elapsed,
        data.hints_used || 0,
        data.period_type,
        data.period_date
      ]
    )
  }

  // Achievements
  async getUserAchievements(userId: string) {
    return this.query(
      `SELECT a.*, ua.earned_at 
       FROM user_achievements ua
       JOIN achievements a ON ua.achievement_id = a.id
       WHERE ua.user_id = $1
       ORDER BY ua.earned_at DESC`,
      [userId]
    )
  }

  async checkAndAwardAchievements(userId: string, sessionId: string) {
    // This would contain logic to check achievement criteria
    // and award new achievements based on user progress
    // For now, it's a placeholder
    return []
  }
}

export const db = new DatabaseService()