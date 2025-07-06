-- Puzzlator Database Setup Script
-- Run this in your Supabase SQL Editor to create all required tables

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop existing types if they exist (for clean setup)
DROP TYPE IF EXISTS puzzle_type CASCADE;
DROP TYPE IF EXISTS difficulty_level CASCADE;
DROP TYPE IF EXISTS achievement_category CASCADE;
DROP TYPE IF EXISTS leaderboard_period CASCADE;
DROP TYPE IF EXISTS game_status CASCADE;

-- Create custom types
CREATE TYPE puzzle_type AS ENUM ('sudoku4x4', 'sudoku6x6', 'sudoku9x9', 'pattern', 'spatial', 'logic', 'wordplay', 'math');
CREATE TYPE difficulty_level AS ENUM ('easy', 'medium', 'hard', 'expert');
CREATE TYPE achievement_category AS ENUM ('completion', 'speed', 'skill', 'collection', 'social');
CREATE TYPE leaderboard_period AS ENUM ('daily', 'weekly', 'monthly', 'all_time');
CREATE TYPE game_status AS ENUM ('in_progress', 'completed', 'abandoned');

-- User Profiles (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  email TEXT,
  avatar_url TEXT,
  bio TEXT,
  total_score INTEGER DEFAULT 0,
  puzzles_completed INTEGER DEFAULT 0,
  puzzles_attempted INTEGER DEFAULT 0,
  total_play_time INTEGER DEFAULT 0, -- in seconds
  preferred_difficulty difficulty_level DEFAULT 'medium',
  is_premium BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Puzzles (simplified to work without custom types if needed)
CREATE TABLE IF NOT EXISTS puzzles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  puzzle_data JSONB NOT NULL,
  solution_data JSONB,
  max_score INTEGER DEFAULT 1000,
  hint_penalty INTEGER DEFAULT 20,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT DEFAULT 'system',
  is_daily BOOLEAN DEFAULT FALSE,
  daily_date DATE,
  play_count INTEGER DEFAULT 0
);

-- Game Sessions
CREATE TABLE IF NOT EXISTS game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  puzzle_id UUID REFERENCES puzzles(id),
  status TEXT DEFAULT 'in_progress',
  game_state JSONB,
  moves JSONB DEFAULT '[]'::jsonb,
  hints_used INTEGER DEFAULT 0,
  time_elapsed INTEGER DEFAULT 0, -- in seconds
  score INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Achievements
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  icon TEXT,
  points INTEGER DEFAULT 10,
  criteria JSONB NOT NULL, -- Defines how to earn this achievement
  is_secret BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Achievements
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES achievements(id),
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  progress INTEGER DEFAULT 100, -- For progressive achievements
  UNIQUE(user_id, achievement_id)
);

-- Leaderboard
CREATE TABLE IF NOT EXISTS leaderboard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  puzzle_id UUID REFERENCES puzzles(id),
  puzzle_type TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  score INTEGER NOT NULL,
  time_elapsed INTEGER NOT NULL, -- in seconds
  hints_used INTEGER DEFAULT 0,
  period_type TEXT DEFAULT 'all_time',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Add indexes for common queries
  INDEX idx_leaderboard_score (score DESC),
  INDEX idx_leaderboard_period (period_type, created_at DESC)
);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE puzzles ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- User Profiles
CREATE POLICY "Public profiles are viewable by everyone" ON user_profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Puzzles
CREATE POLICY "Puzzles are viewable by everyone" ON puzzles
  FOR SELECT USING (true);

CREATE POLICY "Only admins can modify puzzles" ON puzzles
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Game Sessions
CREATE POLICY "Users can view own game sessions" ON game_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own game sessions" ON game_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own game sessions" ON game_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- Achievements
CREATE POLICY "Achievements are viewable by everyone" ON achievements
  FOR SELECT USING (NOT is_secret OR EXISTS (
    SELECT 1 FROM user_achievements 
    WHERE achievement_id = achievements.id 
    AND user_id = auth.uid()
  ));

-- User Achievements
CREATE POLICY "Users can view own achievements" ON user_achievements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can grant achievements" ON user_achievements
  FOR INSERT WITH CHECK (true);

-- Leaderboard
CREATE POLICY "Leaderboard is viewable by everyone" ON leaderboard
  FOR SELECT USING (true);

CREATE POLICY "Users can add own scores" ON leaderboard
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles(username);
CREATE INDEX IF NOT EXISTS idx_puzzles_type_difficulty ON puzzles(type, difficulty);
CREATE INDEX IF NOT EXISTS idx_puzzles_daily ON puzzles(daily_date) WHERE is_daily = true;
CREATE INDEX IF NOT EXISTS idx_game_sessions_user_status ON game_sessions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_game_sessions_updated_at BEFORE UPDATE ON game_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some default achievements
INSERT INTO achievements (code, name, description, category, points, criteria) VALUES
  ('first_puzzle', 'First Steps', 'Complete your first puzzle', 'completion', 10, '{"puzzles_completed": 1}'),
  ('speed_demon', 'Speed Demon', 'Complete a puzzle in under 60 seconds', 'speed', 20, '{"time_under": 60}'),
  ('perfect_score', 'Perfectionist', 'Complete a puzzle with no hints', 'skill', 15, '{"hints_used": 0}'),
  ('puzzle_10', 'Puzzle Enthusiast', 'Complete 10 puzzles', 'collection', 25, '{"puzzles_completed": 10}'),
  ('puzzle_50', 'Puzzle Master', 'Complete 50 puzzles', 'collection', 50, '{"puzzles_completed": 50}'),
  ('daily_streak_7', 'Week Warrior', 'Complete daily puzzles for 7 days straight', 'completion', 30, '{"daily_streak": 7}')
ON CONFLICT (code) DO NOTHING;

-- Success message
SELECT 'All tables created successfully!' as message;