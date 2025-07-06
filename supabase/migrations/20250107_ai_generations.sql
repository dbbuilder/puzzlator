-- Create table to track AI puzzle generations for rate limiting and analytics
CREATE TABLE IF NOT EXISTS public.ai_generations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    puzzle_type TEXT NOT NULL,
    difficulty TEXT NOT NULL,
    prompt_tokens INTEGER DEFAULT 0,
    completion_tokens INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    model TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Indexes for performance
    CONSTRAINT valid_puzzle_type CHECK (puzzle_type IN ('sudoku4x4', 'pattern', 'spatial', 'logic', 'math', 'wordplay')),
    CONSTRAINT valid_difficulty CHECK (difficulty IN ('easy', 'medium', 'hard', 'expert'))
);

-- Create indexes
CREATE INDEX idx_ai_generations_user_id ON public.ai_generations(user_id);
CREATE INDEX idx_ai_generations_created_at ON public.ai_generations(created_at DESC);
CREATE INDEX idx_ai_generations_user_created ON public.ai_generations(user_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.ai_generations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only see their own generation records
CREATE POLICY "Users can view own AI generations"
    ON public.ai_generations
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Service role can insert for any user (used by Edge Function)
CREATE POLICY "Service role can insert AI generations"
    ON public.ai_generations
    FOR INSERT
    TO service_role
    WITH CHECK (true);

-- Add ai_generated column to puzzles table if it doesn't exist
ALTER TABLE public.puzzles 
ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN DEFAULT FALSE;

-- Add metadata column to puzzles table if it doesn't exist
ALTER TABLE public.puzzles 
ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Create function to get user's AI generation count in last hour
CREATE OR REPLACE FUNCTION get_user_ai_generation_count(user_uuid UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    generation_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO generation_count
    FROM public.ai_generations
    WHERE user_id = user_uuid
    AND created_at >= NOW() - INTERVAL '1 hour';
    
    RETURN generation_count;
END;
$$;

-- Create function to get user's token usage for current month
CREATE OR REPLACE FUNCTION get_user_monthly_token_usage(user_uuid UUID)
RETURNS TABLE(
    total_tokens BIGINT,
    generation_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(ag.total_tokens), 0)::BIGINT as total_tokens,
        COUNT(*)::INTEGER as generation_count
    FROM public.ai_generations ag
    WHERE ag.user_id = user_uuid
    AND ag.created_at >= DATE_TRUNC('month', CURRENT_DATE);
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_user_ai_generation_count TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_monthly_token_usage TO authenticated;