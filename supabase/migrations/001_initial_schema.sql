-- AI Puzzle Game Generator - Database Schema
-- File: supabase/migrations/001_initial_schema.sql

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.user_profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100),
    avatar_url TEXT,
    skill_level INTEGER DEFAULT 1,
    total_experience INTEGER DEFAULT 0,
    preferred_difficulty VARCHAR(20) DEFAULT 'medium',
    favorite_puzzle_types TEXT[] DEFAULT '{}',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Puzzle templates and types
CREATE TABLE public.puzzle_types (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL, -- 'logic', 'spatial', 'pattern', 'sequence', 'deduction'
    difficulty_range JSONB DEFAULT '{"min": 1, "max": 10}',
    ai_prompt_template TEXT NOT NULL,
    validation_schema JSONB,
    ui_component VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI-generated puzzle instances
CREATE TABLE public.puzzles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    puzzle_type_id UUID REFERENCES public.puzzle_types(id),
    title VARCHAR(200),
    description TEXT,
    difficulty INTEGER CHECK (difficulty >= 1 AND difficulty <= 10),
    theme VARCHAR(100),
    content JSONB NOT NULL, -- Puzzle data structure
    solution JSONB, -- Solution data
    hints JSONB DEFAULT '[]', -- Array of hint objects
    metadata JSONB DEFAULT '{}', -- AI generation metadata
    created_by UUID REFERENCES public.user_profiles(id),
    is_ai_generated BOOLEAN DEFAULT true,
    quality_score DECIMAL(3,2), -- 0.00 to 10.00
    play_count INTEGER DEFAULT 0,
    success_rate DECIMAL(5,4), -- Percentage as decimal
    average_solve_time INTERVAL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
