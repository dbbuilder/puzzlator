const { Pool } = require('pg')

const pool = new Pool({
  host: 'localhost',
  port: 14322,
  database: 'puzzler',
  user: 'postgres',
  password: 'postgres',
})

async function seedPuzzles() {
  try {
    // Sample Sudoku puzzles
    const sudokuPuzzles = [
      {
        type: 'sudoku4x4',
        difficulty: 'easy',
        title: 'Easy Sudoku 4x4',
        description: 'A simple 4x4 Sudoku puzzle for beginners',
        puzzle_data: JSON.stringify([
          [1, 0, 3, 0],
          [0, 4, 0, 2],
          [2, 0, 4, 0],
          [0, 3, 0, 1]
        ]),
        solution_data: JSON.stringify([
          [1, 2, 3, 4],
          [3, 4, 1, 2],
          [2, 1, 4, 3],
          [4, 3, 2, 1]
        ])
      },
      {
        type: 'sudoku4x4',
        difficulty: 'medium',
        title: 'Medium Sudoku 4x4',
        description: 'A moderate 4x4 Sudoku puzzle',
        puzzle_data: JSON.stringify([
          [0, 2, 0, 4],
          [3, 0, 0, 0],
          [0, 0, 0, 3],
          [4, 0, 2, 0]
        ]),
        solution_data: JSON.stringify([
          [1, 2, 3, 4],
          [3, 4, 1, 2],
          [2, 1, 4, 3],
          [4, 3, 2, 1]
        ])
      },
      {
        type: 'sudoku4x4',
        difficulty: 'hard',
        title: 'Hard Sudoku 4x4',
        description: 'A challenging 4x4 Sudoku puzzle',
        puzzle_data: JSON.stringify([
          [0, 0, 3, 0],
          [3, 0, 0, 0],
          [0, 0, 0, 3],
          [0, 3, 0, 0]
        ]),
        solution_data: JSON.stringify([
          [1, 2, 3, 4],
          [3, 4, 1, 2],
          [2, 1, 4, 3],
          [4, 3, 2, 1]
        ])
      }
    ]

    console.log('Seeding puzzles...')
    
    for (const puzzle of sudokuPuzzles) {
      const result = await pool.query(
        `INSERT INTO puzzles (type, difficulty, title, description, puzzle_data, solution_data, max_score, time_limit, hint_penalty)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
        [
          puzzle.type,
          puzzle.difficulty,
          puzzle.title,
          puzzle.description,
          puzzle.puzzle_data,
          puzzle.solution_data,
          1000,
          300, // 5 minutes
          20
        ]
      )
      console.log(`Created puzzle: ${puzzle.title} (ID: ${result.rows[0].id})`)
    }
    
    console.log('Puzzles seeded successfully!')
  } catch (error) {
    console.error('Error seeding puzzles:', error)
  } finally {
    await pool.end()
  }
}

seedPuzzles()