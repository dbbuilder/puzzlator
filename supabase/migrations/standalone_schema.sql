-- Standalone database schema for AI Puzzle Game (no auth dependencies)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Puzzle types enum
CREATE TYPE puzzle_type AS ENUM (
  'sudoku4x4',
  'logic',
  'spatial', 
  'pattern',
  'sequence',
  'deduction',
  'wordplay',
  'math'
);

-- Difficulty levels enum
CREATE TYPE difficulty_level AS ENUM (
  'easy',
  'medium',
  'hard',
  'expert'
);

-- Puzzle status enum
CREATE TYPE puzzle_status AS ENUM (
  'not_started',
  'in_progress',
  'completed',
  'abandoned'
);

-- User profiles table (standalone version without auth dependency)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  total_score INTEGER DEFAULT 0,
  puzzles_completed INTEGER DEFAULT 0,
  puzzles_attempted INTEGER DEFAULT 0,
  total_play_time INTEGER DEFAULT 0, -- in seconds
  preferred_difficulty TEXT DEFAULT 'medium',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Puzzles table (stores generated puzzles)
CREATE TABLE puzzles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type puzzle_type NOT NULL,
  difficulty difficulty_level NOT NULL,
  title TEXT,
  description TEXT,
  puzzle_data JSONB NOT NULL, -- Stores the puzzle configuration
  solution_data JSONB NOT NULL, -- Stores the solution
  ai_prompt TEXT, -- The prompt used to generate this puzzle
  ai_model TEXT, -- Which AI model was used
  max_score INTEGER DEFAULT 1000,
  time_limit INTEGER, -- Optional time limit in seconds
  hint_penalty INTEGER DEFAULT 20, -- Points lost per hint
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES user_profiles(id),
  is_daily BOOLEAN DEFAULT FALSE,
  daily_date DATE,
  play_count INTEGER DEFAULT 0,
  avg_completion_time INTEGER, -- in seconds
  avg_score INTEGER,
  rating DECIMAL(3,2), -- Average rating 0-5
  rating_count INTEGER DEFAULT 0
);

-- Game sessions table (tracks individual play sessions)
CREATE TABLE game_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  puzzle_id UUID NOT NULL REFERENCES puzzles(id) ON DELETE CASCADE,
  status puzzle_status NOT NULL DEFAULT 'in_progress',
  score INTEGER DEFAULT 0,
  moves JSONB DEFAULT '[]'::jsonb, -- Array of moves
  hints_used INTEGER DEFAULT 0,
  time_elapsed INTEGER DEFAULT 0, -- in seconds
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  last_played_at TIMESTAMPTZ DEFAULT NOW(),
  game_state JSONB, -- Serialized game state for resume
  
  -- Prevent duplicate active sessions
  CONSTRAINT unique_active_sessions UNIQUE (user_id, puzzle_id)
);

-- Achievements table
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL, -- e.g., 'FIRST_PUZZLE', 'SPEED_DEMON'
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon_url TEXT,
  points INTEGER DEFAULT 10,
  category TEXT, -- e.g., 'milestone', 'skill', 'special'
  requirements JSONB, -- Criteria for earning
  sort_order INTEGER DEFAULT 0,
  is_secret BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User achievements table (tracks earned achievements)
CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  game_session_id UUID REFERENCES game_sessions(id), -- Which session earned it
  
  -- Prevent duplicate achievements
  UNIQUE(user_id, achievement_id)
);

-- Leaderboards table
CREATE TABLE leaderboards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  puzzle_id UUID REFERENCES puzzles(id) ON DELETE CASCADE,
  puzzle_type puzzle_type,
  difficulty difficulty_level,
  score INTEGER NOT NULL,
  time_elapsed INTEGER NOT NULL, -- in seconds
  hints_used INTEGER DEFAULT 0,
  achieved_at TIMESTAMPTZ DEFAULT NOW(),
  period_type TEXT NOT NULL, -- 'all_time', 'monthly', 'weekly', 'daily'
  period_date DATE, -- For periodic leaderboards
  
  -- Indexes for efficient querying
  CONSTRAINT valid_puzzle_ref CHECK (
    (puzzle_id IS NOT NULL) OR (puzzle_type IS NOT NULL AND difficulty IS NOT NULL)
  )
);

-- Indexes for performance
CREATE INDEX idx_user_profiles_username ON user_profiles(username);
CREATE INDEX idx_puzzles_type_difficulty ON puzzles(type, difficulty);
CREATE INDEX idx_puzzles_daily ON puzzles(daily_date) WHERE is_daily = TRUE;
CREATE INDEX idx_game_sessions_user ON game_sessions(user_id);
CREATE INDEX idx_game_sessions_puzzle ON game_sessions(puzzle_id);
CREATE INDEX idx_game_sessions_status ON game_sessions(status);
CREATE INDEX idx_leaderboards_puzzle ON leaderboards(puzzle_id);
CREATE INDEX idx_leaderboards_type_diff ON leaderboards(puzzle_type, difficulty);
CREATE INDEX idx_leaderboards_period ON leaderboards(period_type, period_date);
CREATE INDEX idx_leaderboards_score ON leaderboards(score DESC);

-- Functions

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for user_profiles
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update user stats after game completion
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE user_profiles
    SET 
      puzzles_completed = puzzles_completed + 1,
      total_score = total_score + NEW.score,
      total_play_time = total_play_time + NEW.time_elapsed
    WHERE id = NEW.user_id;
    
    -- Update puzzle stats
    UPDATE puzzles
    SET
      play_count = play_count + 1,
      avg_completion_time = (
        SELECT AVG(time_elapsed) 
        FROM game_sessions 
        WHERE puzzle_id = NEW.puzzle_id AND status = 'completed'
      ),
      avg_score = (
        SELECT AVG(score) 
        FROM game_sessions 
        WHERE puzzle_id = NEW.puzzle_id AND status = 'completed'
      )
    WHERE id = NEW.puzzle_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for game session completion
CREATE TRIGGER update_stats_on_completion AFTER UPDATE ON game_sessions
  FOR EACH ROW EXECUTE FUNCTION update_user_stats();

-- Insert default achievements
INSERT INTO achievements (code, name, description, category, points, requirements) VALUES
  ('FIRST_PUZZLE', 'First Steps', 'Complete your first puzzle', 'milestone', 10, '{"puzzles_completed": 1}'),
  ('SPEED_DEMON', 'Speed Demon', 'Complete a puzzle in under 60 seconds', 'skill', 25, '{"max_time": 60}'),
  ('PERFECTIONIST', 'Perfectionist', 'Complete a puzzle without using hints', 'skill', 20, '{"max_hints": 0}'),
  ('PUZZLE_ADDICT', 'Puzzle Addict', 'Complete 100 puzzles', 'milestone', 100, '{"puzzles_completed": 100}'),
  ('DAILY_DEVOTEE', 'Daily Devotee', 'Complete daily puzzles for 7 days in a row', 'special', 50, '{"daily_streak": 7}'),
  ('EXPERT_SOLVER', 'Expert Solver', 'Complete an expert difficulty puzzle', 'skill', 30, '{"difficulty": "expert"}'),
  ('VARIETY_SEEKER', 'Variety Seeker', 'Complete puzzles of 5 different types', 'milestone', 40, '{"unique_types": 5}'),
  ('HIGH_SCORER', 'High Scorer', 'Achieve a perfect score on any puzzle', 'skill', 35, '{"perfect_score": true}'),
  ('QUICK_LEARNER', 'Quick Learner', 'Complete 5 puzzles in one day', 'milestone', 25, '{"daily_puzzles": 5}'),
  ('UNSTOPPABLE', 'Unstoppable', 'Achieve a 30-day streak', 'special', 100, '{"daily_streak": 30}');

-- Create a test user for development
INSERT INTO user_profiles (username, display_name) VALUES
  ('testuser', 'Test User');