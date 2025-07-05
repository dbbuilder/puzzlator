import type { Database } from '@/types/db'

type UserProfile = Database['public']['Tables']['user_profiles']['Row']
type GameSession = Database['public']['Tables']['game_sessions']['Row']
type Puzzle = Database['public']['Tables']['puzzles']['Row']
type Achievement = Database['public']['Tables']['achievements']['Row']

export class ApiService {
  private baseUrl = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : 'http://localhost:14001/api'

  async request<T>(url: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`)
    }

    return response.json()
  }

  // User profiles
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    return this.request(`/users/${userId}`)
  }

  async createUserProfile(data: { username: string; display_name?: string }): Promise<UserProfile> {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateUserProfile(userId: string, data: Partial<UserProfile>): Promise<UserProfile> {
    return this.request(`/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  // Game sessions
  async createGameSession(data: {
    user_id: string
    puzzle_id: string
    game_state?: any
  }): Promise<GameSession> {
    return this.request('/sessions', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getActiveGameSession(userId: string, puzzleId: string): Promise<GameSession | null> {
    return this.request(`/sessions/${userId}/${puzzleId}`)
  }

  async updateGameSession(
    sessionId: string,
    data: {
      status?: 'not_started' | 'in_progress' | 'completed' | 'abandoned'
      score?: number
      moves?: any[]
      hints_used?: number
      time_elapsed?: number
      game_state?: any
      completed_at?: string
    }
  ): Promise<GameSession> {
    return this.request(`/sessions/${sessionId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  // Puzzles
  async getPuzzles(filters?: {
    type?: string
    difficulty?: string
    limit?: number
    offset?: number
  }): Promise<Puzzle[]> {
    const params = new URLSearchParams()
    if (filters?.type) params.append('type', filters.type)
    if (filters?.difficulty) params.append('difficulty', filters.difficulty)
    if (filters?.limit) params.append('limit', filters.limit.toString())
    if (filters?.offset) params.append('offset', filters.offset.toString())

    return this.request(`/puzzles?${params}`)
  }

  async getPuzzle(puzzleId: string): Promise<Puzzle | null> {
    return this.request(`/puzzles/${puzzleId}`)
  }

  async createPuzzle(data: {
    type: string
    difficulty: string
    title?: string
    description?: string
    puzzle_data: any
    solution_data: any
    max_score?: number
    time_limit?: number
    hint_penalty?: number
  }): Promise<Puzzle> {
    return this.request('/puzzles', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // Leaderboards
  async getLeaderboard(filters?: {
    puzzle_id?: string
    puzzle_type?: string
    difficulty?: string
    period_type?: string
    limit?: number
  }): Promise<any[]> {
    const params = new URLSearchParams()
    if (filters?.puzzle_id) params.append('puzzle_id', filters.puzzle_id)
    if (filters?.puzzle_type) params.append('puzzle_type', filters.puzzle_type)
    if (filters?.difficulty) params.append('difficulty', filters.difficulty)
    if (filters?.period_type) params.append('period_type', filters.period_type)
    if (filters?.limit) params.append('limit', filters.limit.toString())

    return this.request(`/leaderboards?${params}`)
  }

  async addLeaderboardEntry(data: {
    user_id: string
    puzzle_id?: string
    puzzle_type?: string
    difficulty?: string
    score: number
    time_elapsed: number
    hints_used?: number
    period_type?: string
  }): Promise<any> {
    return this.request('/leaderboards', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // Achievements
  async getAchievements(): Promise<Achievement[]> {
    return this.request('/achievements')
  }

  async getUserAchievements(userId: string): Promise<(Achievement & { earned_at: string })[]> {
    return this.request(`/users/${userId}/achievements`)
  }
}

export const api = new ApiService()