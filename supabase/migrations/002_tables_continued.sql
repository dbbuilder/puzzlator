-- Continue schema creation - Part 2

-- Player game sessions and progress
CREATE TABLE public.game_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id),
    puzzle_id UUID REFERENCES public.puzzles(id),
    status VARCHAR(20) DEFAULT 'in_progress', -- 'in_progress', 'completed', 'abandoned'
    current_state JSONB, -- Current puzzle state
    moves_history JSONB DEFAULT '[]', -- Array of move objects
    hints_used INTEGER DEFAULT 0,
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE,
    solve_time INTERVAL GENERATED ALWAYS AS (end_time - start_time) STORED,
    score INTEGER, -- Points earned for this session
    is_best_time BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Achievement definitions
CREATE TABLE public.achievements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50), -- 'first_solve', 'streak', 'speed', 'difficulty', 'special'
    icon_url TEXT,
    rarity VARCHAR(20) DEFAULT 'common', -- 'common', 'rare', 'epic', 'legendary'
    requirements JSONB, -- Conditions to unlock achievement
    reward_experience INTEGER DEFAULT 0,
    is_hidden BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User achievements tracking
CREATE TABLE public.user_achievements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id),
    achievement_id UUID REFERENCES public.achievements(id),
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    progress JSONB DEFAULT '{}', -- Progress toward achievement
    UNIQUE(user_id, achievement_id)
);

-- Daily challenges
CREATE TABLE public.daily_challenges (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    date DATE UNIQUE NOT NULL,
    puzzle_id UUID REFERENCES public.puzzles(id),
    bonus_experience INTEGER DEFAULT 50,
    participant_count INTEGER DEFAULT 0,
    best_time INTERVAL,
    best_score INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
