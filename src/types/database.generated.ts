export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      achievements: {
        Row: {
          id: string
          code: string
          name: string
          description: string
          icon_url: string | null
          points: number
          category: string | null
          requirements: Json | null
          sort_order: number
          is_secret: boolean
          created_at: string
        }
        Insert: {
          id?: string
          code: string
          name: string
          description: string
          icon_url?: string | null
          points?: number
          category?: string | null
          requirements?: Json | null
          sort_order?: number
          is_secret?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          code?: string
          name?: string
          description?: string
          icon_url?: string | null
          points?: number
          category?: string | null
          requirements?: Json | null
          sort_order?: number
          is_secret?: boolean
          created_at?: string
        }
      }
      game_sessions: {
        Row: {
          id: string
          user_id: string
          puzzle_id: string
          status: 'not_started' | 'in_progress' | 'completed' | 'abandoned'
          score: number
          moves: Json
          hints_used: number
          time_elapsed: number
          started_at: string
          completed_at: string | null
          last_played_at: string
          game_state: Json | null
        }
        Insert: {
          id?: string
          user_id: string
          puzzle_id: string
          status?: 'not_started' | 'in_progress' | 'completed' | 'abandoned'
          score?: number
          moves?: Json
          hints_used?: number
          time_elapsed?: number
          started_at?: string
          completed_at?: string | null
          last_played_at?: string
          game_state?: Json | null
        }
        Update: {
          id?: string
          user_id?: string
          puzzle_id?: string
          status?: 'not_started' | 'in_progress' | 'completed' | 'abandoned'
          score?: number
          moves?: Json
          hints_used?: number
          time_elapsed?: number
          started_at?: string
          completed_at?: string | null
          last_played_at?: string
          game_state?: Json | null
        }
      }
      leaderboards: {
        Row: {
          id: string
          user_id: string
          puzzle_id: string | null
          puzzle_type: 'sudoku4x4' | 'logic' | 'spatial' | 'pattern' | 'sequence' | 'deduction' | 'wordplay' | 'math' | null
          difficulty: 'easy' | 'medium' | 'hard' | 'expert' | null
          score: number
          time_elapsed: number
          hints_used: number
          achieved_at: string
          period_type: string
          period_date: string | null
        }
        Insert: {
          id?: string
          user_id: string
          puzzle_id?: string | null
          puzzle_type?: 'sudoku4x4' | 'logic' | 'spatial' | 'pattern' | 'sequence' | 'deduction' | 'wordplay' | 'math' | null
          difficulty?: 'easy' | 'medium' | 'hard' | 'expert' | null
          score: number
          time_elapsed: number
          hints_used?: number
          achieved_at?: string
          period_type: string
          period_date?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          puzzle_id?: string | null
          puzzle_type?: 'sudoku4x4' | 'logic' | 'spatial' | 'pattern' | 'sequence' | 'deduction' | 'wordplay' | 'math' | null
          difficulty?: 'easy' | 'medium' | 'hard' | 'expert' | null
          score?: number
          time_elapsed?: number
          hints_used?: number
          achieved_at?: string
          period_type?: string
          period_date?: string | null
        }
      }
      puzzles: {
        Row: {
          id: string
          type: 'sudoku4x4' | 'logic' | 'spatial' | 'pattern' | 'sequence' | 'deduction' | 'wordplay' | 'math'
          difficulty: 'easy' | 'medium' | 'hard' | 'expert'
          title: string | null
          description: string | null
          puzzle_data: Json
          solution_data: Json
          ai_prompt: string | null
          ai_model: string | null
          max_score: number
          time_limit: number | null
          hint_penalty: number
          created_at: string
          created_by: string | null
          is_daily: boolean
          daily_date: string | null
          play_count: number
          avg_completion_time: number | null
          avg_score: number | null
          rating: number | null
          rating_count: number
        }
        Insert: {
          id?: string
          type: 'sudoku4x4' | 'logic' | 'spatial' | 'pattern' | 'sequence' | 'deduction' | 'wordplay' | 'math'
          difficulty: 'easy' | 'medium' | 'hard' | 'expert'
          title?: string | null
          description?: string | null
          puzzle_data: Json
          solution_data: Json
          ai_prompt?: string | null
          ai_model?: string | null
          max_score?: number
          time_limit?: number | null
          hint_penalty?: number
          created_at?: string
          created_by?: string | null
          is_daily?: boolean
          daily_date?: string | null
          play_count?: number
          avg_completion_time?: number | null
          avg_score?: number | null
          rating?: number | null
          rating_count?: number
        }
        Update: {
          id?: string
          type?: 'sudoku4x4' | 'logic' | 'spatial' | 'pattern' | 'sequence' | 'deduction' | 'wordplay' | 'math'
          difficulty?: 'easy' | 'medium' | 'hard' | 'expert'
          title?: string | null
          description?: string | null
          puzzle_data?: Json
          solution_data?: Json
          ai_prompt?: string | null
          ai_model?: string | null
          max_score?: number
          time_limit?: number | null
          hint_penalty?: number
          created_at?: string
          created_by?: string | null
          is_daily?: boolean
          daily_date?: string | null
          play_count?: number
          avg_completion_time?: number | null
          avg_score?: number | null
          rating?: number | null
          rating_count?: number
        }
      }
      user_achievements: {
        Row: {
          id: string
          user_id: string
          achievement_id: string
          earned_at: string
          game_session_id: string | null
        }
        Insert: {
          id?: string
          user_id: string
          achievement_id: string
          earned_at?: string
          game_session_id?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          achievement_id?: string
          earned_at?: string
          game_session_id?: string | null
        }
      }
      user_profiles: {
        Row: {
          id: string
          username: string
          display_name: string | null
          avatar_url: string | null
          bio: string | null
          total_score: number
          puzzles_completed: number
          puzzles_attempted: number
          total_play_time: number
          preferred_difficulty: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          username: string
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          total_score?: number
          puzzles_completed?: number
          puzzles_attempted?: number
          total_play_time?: number
          preferred_difficulty?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          total_score?: number
          puzzles_completed?: number
          puzzles_attempted?: number
          total_play_time?: number
          preferred_difficulty?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {}
    Functions: {}
    Enums: {
      puzzle_type: 'sudoku4x4' | 'logic' | 'spatial' | 'pattern' | 'sequence' | 'deduction' | 'wordplay' | 'math'
      difficulty_level: 'easy' | 'medium' | 'hard' | 'expert'
      puzzle_status: 'not_started' | 'in_progress' | 'completed' | 'abandoned'
    }
  }
}