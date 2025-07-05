#!/usr/bin/env node

/**
 * Database seeding script for development
 * DISABLED - Supabase functionality has been removed
 */

console.log('Database seeding is currently disabled as Supabase has been removed from the project.')
console.log('Please use the custom auth and database implementation instead.')
process.exit(0)

/* Original Supabase seeding code commented out:

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
    time_limit: 300,
    hint_penalty: 50
  },
  // Add more sample puzzles here...
]

async function seedDatabase() {
  try {
    console.log('Starting database seeding...')
    
    // Insert sample puzzles
    const { data: puzzles, error: puzzleError } = await supabase
      .from('puzzles')
      .insert(samplePuzzles)
      .select()
    
    if (puzzleError) {
      console.error('Error inserting puzzles:', puzzleError)
      return
    }
    
    console.log(`Successfully seeded ${puzzles.length} puzzles`)
    
    // TODO: Add more seed data (users, achievements, etc.)
    
    console.log('Database seeding completed successfully!')
    
  } catch (error) {
    console.error('Seeding error:', error)
    process.exit(1)
  }
}

// Run the seeding
seedDatabase()

*/