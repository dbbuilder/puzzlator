-- Complete Supabase Schema for Puzzlator
-- This migration creates all tables with proper RLS policies

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE puzzle_type AS ENUM ('sudoku4x4', 'sudoku6x6', 'sudoku9x9', 'pattern', 'spatial', 'kenken', 'kakuro');
CREATE TYPE difficulty_level AS ENUM ('easy', 'medium', 'hard', 'expert');
CREATE TYPE achievement_category AS ENUM ('completion', 'speed', 'skill', 'collection', 'social');
CREATE TYPE leaderboard_period AS ENUM ('daily', 'weekly', 'monthly', 'all_time');

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

-- Puzzles
CREATE TABLE IF NOT EXISTS puzzles (
  id TEXT PRIMARY KEY DEFAULT 'puzzle_' || gen_random_uuid(),
  type puzzle_type NOT NULL,
  difficulty difficulty_level NOT NULL,
  puzzle_data JSONB NOT NULL, -- The puzzle grid/configuration
  solution_data JSONB, -- The solution (optional)
  metadata JSONB DEFAULT '{}', -- Additional puzzle-specific data
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT DEFAULT 'system',
  is_daily BOOLEAN DEFAULT FALSE,
  daily_date DATE,
  play_count INTEGER DEFAULT 0,
  average_time INTEGER, -- in seconds
  average_score INTEGER,
  CONSTRAINT daily_puzzle_unique UNIQUE (daily_date, type)
);

-- Game Sessions
CREATE TABLE IF NOT EXISTS game_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  puzzle_id TEXT NOT NULL REFERENCES puzzles(id),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  time_elapsed INTEGER DEFAULT 0, -- in seconds
  score INTEGER DEFAULT 0,
  hints_used INTEGER DEFAULT 0,
  mistakes INTEGER DEFAULT 0,
  game_state JSONB DEFAULT '{}', -- Current game state for resuming
  is_perfect BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Achievements
CREATE TABLE IF NOT EXISTS achievements (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category achievement_category NOT NULL,
  points INTEGER DEFAULT 10,
  icon_url TEXT,
  requirement JSONB NOT NULL, -- {type: 'puzzles_completed', value: 10}
  hidden BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Achievements
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL REFERENCES achievements(id),
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  progress INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT user_achievement_unique UNIQUE (user_id, achievement_id)
);

-- Leaderboards
CREATE TABLE IF NOT EXISTS leaderboards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  puzzle_id TEXT REFERENCES puzzles(id),
  puzzle_type puzzle_type NOT NULL,
  difficulty difficulty_level,
  score INTEGER NOT NULL,
  time_elapsed INTEGER NOT NULL, -- in seconds
  hints_used INTEGER DEFAULT 0,
  period_type leaderboard_period NOT NULL,
  period_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Create indexes for common queries
  INDEX idx_leaderboard_type_period ON leaderboards(puzzle_type, period_type, period_date),
  INDEX idx_leaderboard_score ON leaderboards(score DESC)
);

-- Friends/Social connections
CREATE TABLE IF NOT EXISTS user_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending', -- pending, accepted, blocked
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT user_connection_unique UNIQUE (user_id, friend_id),
  CONSTRAINT no_self_connection CHECK (user_id != friend_id)
);

-- Puzzle Ratings
CREATE TABLE IF NOT EXISTS puzzle_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  puzzle_id TEXT NOT NULL REFERENCES puzzles(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT user_puzzle_rating_unique UNIQUE (user_id, puzzle_id)
);

-- Create indexes for performance
CREATE INDEX idx_user_profiles_username ON user_profiles(username);
CREATE INDEX idx_game_sessions_user ON game_sessions(user_id, completed_at);
CREATE INDEX idx_game_sessions_puzzle ON game_sessions(puzzle_id);
CREATE INDEX idx_puzzles_type_difficulty ON puzzles(type, difficulty);
CREATE INDEX idx_puzzles_daily ON puzzles(is_daily, daily_date);
CREATE INDEX idx_user_achievements_user ON user_achievements(user_id);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE puzzles ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE puzzle_ratings ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- User Profiles
CREATE POLICY "Public profiles are viewable by everyone"
  ON user_profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Puzzles
CREATE POLICY "Puzzles are viewable by everyone"
  ON puzzles FOR SELECT
  USING (true);

CREATE POLICY "Only admins can modify puzzles"
  ON puzzles FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

-- Game Sessions
CREATE POLICY "Users can view own sessions"
  ON game_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own sessions"
  ON game_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
  ON game_sessions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Achievements
CREATE POLICY "Achievements are viewable by everyone"
  ON achievements FOR SELECT
  USING (true);

-- User Achievements
CREATE POLICY "Users can view all user achievements"
  ON user_achievements FOR SELECT
  USING (true);

CREATE POLICY "Users can unlock own achievements"
  ON user_achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own achievement progress"
  ON user_achievements FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Leaderboards
CREATE POLICY "Leaderboards are viewable by everyone"
  ON leaderboards FOR SELECT
  USING (true);

CREATE POLICY "Users can add own leaderboard entries"
  ON leaderboards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- User Connections
CREATE POLICY "Users can view own connections"
  ON user_connections FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can create connection requests"
  ON user_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update connection status"
  ON user_connections FOR UPDATE
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Puzzle Ratings
CREATE POLICY "Ratings are viewable by everyone"
  ON puzzle_ratings FOR SELECT
  USING (true);

CREATE POLICY "Users can rate puzzles"
  ON puzzle_ratings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ratings"
  ON puzzle_ratings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create functions for common operations

-- Function to update user stats after game completion
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.completed_at IS NOT NULL AND OLD.completed_at IS NULL THEN
    UPDATE user_profiles
    SET 
      puzzles_completed = puzzles_completed + 1,
      total_score = total_score + NEW.score,
      total_play_time = total_play_time + NEW.time_elapsed,
      updated_at = NOW()
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_stats_trigger
  AFTER UPDATE ON game_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_user_stats();

-- Function to update puzzle stats
CREATE OR REPLACE FUNCTION update_puzzle_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.completed_at IS NOT NULL THEN
    UPDATE puzzles
    SET 
      play_count = play_count + 1,
      average_time = (
        SELECT AVG(time_elapsed)::INTEGER 
        FROM game_sessions 
        WHERE puzzle_id = NEW.puzzle_id 
        AND completed_at IS NOT NULL
      ),
      average_score = (
        SELECT AVG(score)::INTEGER 
        FROM game_sessions 
        WHERE puzzle_id = NEW.puzzle_id 
        AND completed_at IS NOT NULL
      )
    WHERE id = NEW.puzzle_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_puzzle_stats_trigger
  AFTER INSERT OR UPDATE ON game_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_puzzle_stats();

-- Insert default achievements
INSERT INTO achievements (id, code, name, description, category, points, requirement) VALUES
  ('ach_first_puzzle', 'first_puzzle', 'First Steps', 'Complete your first puzzle', 'completion', 10, '{"type": "puzzles_completed", "value": 1}'),
  ('ach_speed_demon', 'speed_demon', 'Speed Demon', 'Complete a puzzle in under 60 seconds', 'speed', 25, '{"type": "completion_time", "value": 60}'),
  ('ach_perfectionist', 'perfectionist', 'Perfectionist', 'Complete a puzzle with no mistakes', 'skill', 20, '{"type": "perfect_game", "value": 1}'),
  ('ach_streak_3', 'streak_3', 'On a Roll', 'Complete 3 puzzles in a row', 'completion', 15, '{"type": "streak", "value": 3}'),
  ('ach_streak_7', 'streak_7', 'Week Warrior', 'Complete 7 puzzles in a row', 'completion', 30, '{"type": "streak", "value": 7}'),
  ('ach_hint_free', 'hint_free', 'No Help Needed', 'Complete 5 puzzles without hints', 'skill', 35, '{"type": "hint_free_games", "value": 5}'),
  ('ach_puzzle_master', 'puzzle_master', 'Puzzle Master', 'Complete 100 puzzles', 'collection', 100, '{"type": "total_puzzles", "value": 100}')
ON CONFLICT (id) DO NOTHING;

-- Create view for leaderboard with user info
CREATE OR REPLACE VIEW leaderboard_with_users AS
SELECT 
  l.*,
  u.username,
  u.display_name,
  u.avatar_url
FROM leaderboards l
JOIN user_profiles u ON l.user_id = u.id;

-- Grant permissions for the view
GRANT SELECT ON leaderboard_with_users TO authenticated;
GRANT SELECT ON leaderboard_with_users TO anon;