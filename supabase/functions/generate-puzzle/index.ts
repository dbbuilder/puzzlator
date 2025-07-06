import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import OpenAI from 'https://deno.land/x/openai@v4.24.0/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get request data
    const { type, difficulty, userLevel, previousPerformance, constraints } = await req.json()

    // Validate required fields
    if (!type || !difficulty) {
      throw new Error('Missing required fields: type and difficulty')
    }

    // Initialize OpenAI
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured')
    }

    const openai = new OpenAI({
      apiKey: openaiApiKey,
    })

    // Get auth token and user ID
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    })

    // Verify user token
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      throw new Error('Invalid authentication token')
    }

    // Check rate limiting (10 puzzles per hour per user)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { count } = await supabase
      .from('ai_generations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', oneHourAgo)

    if (count && count >= 10) {
      throw new Error('Rate limit exceeded. Please try again later.')
    }

    // Build the prompt based on puzzle type
    const systemPrompt = getSystemPrompt(type, difficulty, userLevel, previousPerformance)
    const userPrompt = getUserPrompt(type, difficulty, constraints)

    // Generate puzzle with OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-1106-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: 'json_object' }
    })

    const response = completion.choices[0]?.message?.content
    if (!response) {
      throw new Error('Empty response from OpenAI')
    }

    let puzzleData
    try {
      puzzleData = JSON.parse(response)
    } catch (e) {
      throw new Error('Invalid JSON response from OpenAI')
    }

    // Validate the generated puzzle
    const validation = await validatePuzzle(type, puzzleData)
    if (!validation.isValid) {
      throw new Error(`Invalid puzzle generated: ${validation.errors?.join(', ')}`)
    }

    // Store generation record
    const { error: insertError } = await supabase
      .from('ai_generations')
      .insert({
        user_id: user.id,
        puzzle_type: type,
        difficulty,
        prompt_tokens: completion.usage?.prompt_tokens || 0,
        completion_tokens: completion.usage?.completion_tokens || 0,
        total_tokens: completion.usage?.total_tokens || 0,
        model: 'gpt-4-1106-preview'
      })

    if (insertError) {
      console.error('Failed to store generation record:', insertError)
    }

    // Create puzzle record
    const { data: puzzle, error: puzzleError } = await supabase
      .from('puzzles')
      .insert({
        type,
        difficulty,
        title: `AI ${type} - ${difficulty}`,
        description: `AI-generated ${type} puzzle`,
        puzzle_data: puzzleData.puzzle,
        solution_data: puzzleData.solution,
        metadata: puzzleData.metadata,
        ai_generated: true,
        max_score: 1000,
        hint_penalty: 20
      })
      .select()
      .single()

    if (puzzleError) {
      throw new Error(`Failed to create puzzle: ${puzzleError.message}`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        puzzle,
        hints: puzzleData.hints
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Edge function error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

function getSystemPrompt(type: string, difficulty: string, userLevel?: number, performance?: any): string {
  const prompts: Record<string, string> = {
    sudoku4x4: `You are an expert Sudoku puzzle generator. Generate 4x4 Sudoku puzzles that are:
1. Valid (each row, column, and 2x2 box contains numbers 1-4 exactly once)
2. Have a unique solution
3. Appropriate for the requested difficulty level
4. Solvable using logical deduction without guessing

Difficulty guidelines:
- Easy: 8-10 given numbers, solvable with basic scanning
- Medium: 6-8 given numbers, requires some logic
- Hard: 5-6 given numbers, requires advanced techniques
- Expert: 4-5 given numbers, requires complex logic chains`,

    pattern: `You are an expert pattern puzzle generator. Create engaging pattern recognition puzzles that:
1. Have a clear, logical rule
2. Are appropriate for the difficulty level
3. Have exactly one correct answer
4. Are educational and satisfying to solve`,

    spatial: `You are an expert spatial puzzle generator. Create challenging shape-fitting puzzles that:
1. Use tetromino-like shapes or custom polygons
2. Have a clear objective (fill the grid, match a pattern, etc.)
3. Are solvable with the given shapes
4. Test spatial reasoning and rotation skills`
  }

  let prompt = prompts[type] || prompts.pattern
  
  if (userLevel) {
    prompt += `\n\nThe user is at level ${userLevel}.`
  }
  
  if (performance) {
    prompt += `\n\nUser performance: ${performance.successRate}% success rate, ${performance.averageTime}s average time.`
  }

  return prompt + '\n\nAlways return a valid JSON object.'
}

function getUserPrompt(type: string, difficulty: string, constraints?: any): string {
  const basePrompt = `Generate a ${difficulty} ${type} puzzle.`
  
  if (constraints) {
    return basePrompt + `\n\nAdditional constraints: ${JSON.stringify(constraints)}`
  }
  
  return basePrompt + `\n\nReturn format:
{
  "puzzle": { ... puzzle data ... },
  "solution": { ... solution data ... },
  "metadata": { 
    "estimatedTime": <seconds>,
    "techniques": [...],
    "difficultyScore": <1-10>
  },
  "hints": [
    {
      "level": "basic",
      "text": "...",
      "target": "..."
    }
  ]
}`
}

async function validatePuzzle(type: string, data: any): Promise<{ isValid: boolean; errors?: string[] }> {
  // Basic validation - in production, use more sophisticated validation
  const errors: string[] = []
  
  if (!data.puzzle) errors.push('Missing puzzle data')
  if (!data.solution) errors.push('Missing solution data')
  
  if (type === 'sudoku4x4' && data.puzzle?.grid) {
    const grid = data.puzzle.grid
    if (!Array.isArray(grid) || grid.length !== 4) {
      errors.push('Invalid grid dimensions')
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  }
}