-- Schema completion - Part 3

-- Leaderboards and scoring
CREATE TABLE public.leaderboard_entries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id),
    puzzle_type_id UUID REFERENCES public.puzzle_types(id),
    category VARCHAR(50), -- 'daily', 'weekly', 'monthly', 'all_time'
    rank INTEGER,
    score INTEGER,
    additional_metrics JSONB DEFAULT '{}', -- solve_time, accuracy, etc.
    period_start DATE,
    period_end DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, puzzle_type_id, category, period_start)
);

-- Puzzle ratings and feedback
CREATE TABLE public.puzzle_ratings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id),
    puzzle_id UUID REFERENCES public.puzzles(id),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    difficulty_rating INTEGER CHECK (difficulty_rating >= 1 AND difficulty_rating <= 10),
    feedback TEXT,
    tags TEXT[] DEFAULT '{}', -- 'too_easy', 'unclear', 'creative', etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, puzzle_id)
);

-- AI generation logs for monitoring and improvement
CREATE TABLE public.ai_generation_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    puzzle_type_id UUID REFERENCES public.puzzle_types(id),
    prompt_used TEXT,
    parameters JSONB,
    raw_response TEXT,
    parsed_content JSONB,
    generation_time INTERVAL,
    tokens_used INTEGER,
    cost_estimate DECIMAL(10,6),
    quality_assessment JSONB,
    success BOOLEAN,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_puzzles_type_difficulty ON public.puzzles(puzzle_type_id, difficulty);
CREATE INDEX idx_puzzles_created_at ON public.puzzles(created_at DESC);
CREATE INDEX idx_game_sessions_user_status ON public.game_sessions(user_id, status);
CREATE INDEX idx_game_sessions_puzzle_completed ON public.game_sessions(puzzle_id) WHERE status = 'completed';
CREATE INDEX idx_leaderboard_category_rank ON public.leaderboard_entries(category, rank);
CREATE INDEX idx_user_achievements_user ON public.user_achievements(user_id);
CREATE INDEX idx_ai_logs_created_at ON public.ai_generation_logs(created_at DESC);
