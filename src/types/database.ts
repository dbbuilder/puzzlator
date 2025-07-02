export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          username: string | null
          full_name: string | null
          avatar_url: string | null
          skill_level: number
          experience_points: number
          puzzles_completed: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          skill_level?: number
          experience_points?: number
          puzzles_completed?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          skill_level?: number
          experience_points?: number
          puzzles_completed?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      puzzles: {
        Row: {
          id: string
          type: Database['public']['Enums']['puzzle_type']
          title: string
          description: string | null
          difficulty: number
          content: Json
          solution: Json
          ai_prompt: string | null
          ai_model: string | null
          is_active: boolean
          play_count: number
          success_rate: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          type: Database['public']['Enums']['puzzle_type']
          title: string
          description?: string | null
          difficulty: number
          content: Json
          solution: Json
          ai_prompt?: string | null
          ai_model?: string | null
          is_active?: boolean
          play_count?: number
          success_rate?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          type?: Database['public']['Enums']['puzzle_type']
          title?: string
          description?: string | null
          difficulty?: number
          content?: Json
          solution?: Json
          ai_prompt?: string | null
          ai_model?: string | null
          is_active?: boolean
          play_count?: number
          success_rate?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      game_sessions: {
        Row: {
          id: string
          user_id: string
          puzzle_id: string
          started_at: string
          completed_at: string | null
          is_completed: boolean
          score: number | null
          time_spent: number | null
          hints_used: number
          moves_count: number
          game_state: Json | null
        }
        Insert: {
          id?: string
          user_id: string
          puzzle_id: string
          started_at?: string
          completed_at?: string | null
          is_completed?: boolean
          score?: number | null
          time_spent?: number | null
          hints_used?: number
          moves_count?: number
          game_state?: Json | null
        }
        Update: {
          id?: string
          user_id?: string
          puzzle_id?: string
          started_at?: string
          completed_at?: string | null
          is_completed?: boolean
          score?: number | null
          time_spent?: number | null
          hints_used?: number
          moves_count?: number
          game_state?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: 'game_sessions_puzzle_id_fkey'
            columns: ['puzzle_id']
            referencedRelation: 'puzzles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'game_sessions_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'user_profiles'
            referencedColumns: ['id']
          }
        ]
      }
      achievements: {
        Row: {
          id: string
          name: string
          description: string
          icon: string | null
          points: number
          requirement_type: string
          requirement_value: Json
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          icon?: string | null
          points?: number
          requirement_type: string
          requirement_value: Json
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          icon?: string | null
          points?: number
          requirement_type?: string
          requirement_value?: Json
          created_at?: string
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          id: string
          user_id: string
          achievement_id: string
          earned_at: string
        }
        Insert: {
          id?: string
          user_id: string
          achievement_id: string
          earned_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          achievement_id?: string
          earned_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'user_achievements_achievement_id_fkey'
            columns: ['achievement_id']
            referencedRelation: 'achievements'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'user_achievements_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'user_profiles'
            referencedColumns: ['id']
          }
        ]
      }
      leaderboards: {
        Row: {
          id: string
          user_id: string
          puzzle_type: Database['public']['Enums']['puzzle_type']
          score: number
          time_spent: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          puzzle_type: Database['public']['Enums']['puzzle_type']
          score: number
          time_spent: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          puzzle_type?: Database['public']['Enums']['puzzle_type']
          score?: number
          time_spent?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'leaderboards_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'user_profiles'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: {}
    Functions: {}
    Enums: {
      puzzle_type: 'logic' | 'spatial' | 'pattern' | 'sequence' | 'deduction' | 'wordplay' | 'math'
    }
    CompositeTypes: {}
  }
}