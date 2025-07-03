#!/usr/bin/env node

/**
 * Database seeding script for development
 * Seeds the database with sample puzzles and test data
 */

const { createClient } = require('@supabase/supabase-js')
const { config } = require('dotenv')

// Load environment variables
config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  console.error('Please run: npm run setup:supabase')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Sample puzzle data
const samplePuzzles = [
  {
    type: 'sudoku4x4',
    difficulty: 'easy',
    title: 'Easy 4x4 Sudoku #1',
    description: 'A gentle introduction to 4x4 Sudoku',
    puzzle_data: {
      grid: [
        [1, 2, null, null],
        [null, null, 1, 2],
        [2, null, null, 3],
        [null, null, 2, 1]
      ],
      locked: [
        [true, true, false, false],
        [false, false, true, true],
        [true, false, false, true],
        [false, false, true, true]
      ]
    },
    solution_data: {
      grid: [
        [1, 2, 3, 4],
        [3, 4, 1, 2],
        [2, 1, 4, 3],
        [4, 3, 2, 1]
      ]
    },
    max_score: 1000,
    hint_penalty: 20
  },
  {
    type: 'sudoku4x4',
    difficulty: 'medium',
    title: 'Medium 4x4 Sudoku #1',
    description: 'A moderate challenge',
    puzzle_data: {
      grid: [
        [null, 2, null, 4],
        [null, null, null, null],
        [null, null, null, null],
        [1, null, 3, null]
      ],
      locked: [
        [false, true, false, true],
        [false, false, false, false],
        [false, false, false, false],
        [true, false, true, false]
      ]
    },
    solution_data: {
      grid: [
        [3, 2, 1, 4],
        [4, 1, 2, 3],
        [2, 3, 4, 1],
        [1, 4, 3, 2]
      ]
    },
    max_score: 1500,
    hint_penalty: 30
  },
  {
    type: 'sudoku4x4',
    difficulty: 'hard',
    title: 'Hard 4x4 Sudoku #1',
    description: 'For experienced solvers',
    puzzle_data: {
      grid: [
        [null, null, null, 4],
        [null, 3, null, null],
        [null, null, 2, null],
        [3, null, null, null]
      ],
      locked: [
        [false, false, false, true],
        [false, true, false, false],
        [false, false, true, false],
        [true, false, false, false]
      ]
    },
    solution_data: {
      grid: [
        [2, 1, 3, 4],
        [4, 3, 1, 2],
        [1, 4, 2, 3],
        [3, 2, 4, 1]
      ]
    },
    max_score: 2000,
    hint_penalty: 40
  }
]

async function seedDatabase() {
  console.log('🌱 Starting database seed...')
  
  try {
    // Insert sample puzzles
    console.log('📝 Inserting sample puzzles...')
    const { data: puzzles, error: puzzleError } = await supabase
      .from('puzzles')
      .insert(samplePuzzles)
      .select()
    
    if (puzzleError) {
      console.error('Error inserting puzzles:', puzzleError)
      return
    }
    
    console.log(`✅ Inserted ${puzzles.length} puzzles`)
    
    // Create a test user if in development
    if (process.env.NODE_ENV !== 'production') {
      console.log('👤 Creating test user...')
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: 'test@example.com',
        password: 'testpassword123',
        options: {
          data: {
            username: 'testuser',
            display_name: 'Test User'
          }
        }
      })
      
      if (authError && authError.message !== 'User already registered') {
        console.error('Error creating test user:', authError)
      } else if (authData?.user) {
        console.log('✅ Created test user: test@example.com')
        
        // Create some game sessions for the test user
        console.log('🎮 Creating sample game sessions...')
        
        const gameSessions = [
          {
            user_id: authData.user.id,
            puzzle_id: puzzles[0].id,
            status: 'completed',
            score: 850,
            hints_used: 1,
            time_elapsed: 180,
            completed_at: new Date().toISOString()
          },
          {
            user_id: authData.user.id,
            puzzle_id: puzzles[1].id,
            status: 'in_progress',
            score: 0,
            hints_used: 0,
            time_elapsed: 45,
            game_state: {
              grid: [
                [null, 2, null, 4],
                [4, null, null, null],
                [null, null, null, null],
                [1, null, 3, null]
              ]
            }
          }
        ]
        
        const { error: sessionError } = await supabase
          .from('game_sessions')
          .insert(gameSessions)
        
        if (sessionError) {
          console.error('Error creating game sessions:', sessionError)
        } else {
          console.log('✅ Created sample game sessions')
        }
      }
    }
    
    console.log('\n✨ Database seeding complete!')
    console.log('\nYou can now:')
    console.log('1. Run "npm run dev" to start the app')
    console.log('2. Login with test@example.com / testpassword123')
    console.log('3. Access Supabase Studio at http://localhost:54323')
    
  } catch (error) {
    console.error('Seeding error:', error)
    process.exit(1)
  }
}

// Run the seed function
seedDatabase()