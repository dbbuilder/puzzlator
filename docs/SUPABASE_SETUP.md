# Supabase Setup Instructions

## Database Tables Required

The app expects these tables to exist in your Supabase database:

### 1. Run Migrations

```bash
# From your local development environment
cd /path/to/puzzlator

# Push the database schema to Supabase
npx supabase db push
```

### 2. Or Create Tables Manually

Go to your Supabase Dashboard → SQL Editor and run:

```sql
-- Create puzzles table
CREATE TABLE IF NOT EXISTS puzzles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  puzzle_data JSONB NOT NULL,
  solution_data JSONB NOT NULL,
  max_score INTEGER DEFAULT 1000,
  hint_penalty INTEGER DEFAULT 20,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create game_sessions table
CREATE TABLE IF NOT EXISTS game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  puzzle_id UUID REFERENCES puzzles(id),
  status TEXT DEFAULT 'in_progress',
  game_state JSONB,
  moves JSONB DEFAULT '[]'::jsonb,
  hints_used INTEGER DEFAULT 0,
  time_elapsed INTEGER DEFAULT 0,
  score INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  email TEXT,
  avatar_url TEXT,
  total_score INTEGER DEFAULT 0,
  puzzles_completed INTEGER DEFAULT 0,
  puzzles_attempted INTEGER DEFAULT 0,
  total_play_time INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE puzzles ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Puzzles are viewable by everyone" ON puzzles FOR SELECT USING (true);
CREATE POLICY "Game sessions are viewable by owner" ON game_sessions FOR ALL USING (auth.uid()::text = user_id);
CREATE POLICY "User profiles are viewable by everyone" ON user_profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);
```

### 3. Enable Email Confirmation (Optional)

If you want to disable email confirmation for easier testing:

1. Go to Supabase Dashboard → Authentication → Settings
2. Under "Email Auth" section
3. Toggle OFF "Confirm email"

### 4. Current Status

The app currently works in two modes:
- **With Supabase**: Full features with database persistence
- **Demo Mode**: Guest login works without database, data is temporary

Guest login always uses demo mode to avoid email confirmation requirements.