import type { PromptTemplate } from '@/types/ai'

export const promptTemplates: Record<string, PromptTemplate> = {
  sudoku4x4: {
    system: `You are an expert Sudoku puzzle generator. Generate 4x4 Sudoku puzzles that are:
1. Valid (each row, column, and 2x2 box contains numbers 1-4 exactly once)
2. Have a unique solution
3. Appropriate for the requested difficulty level
4. Solvable using logical deduction without guessing

Difficulty guidelines:
- Easy: 8-10 given numbers, solvable with basic scanning
- Medium: 6-8 given numbers, requires some logic
- Hard: 5-6 given numbers, requires advanced techniques
- Expert: 4-5 given numbers, requires complex logic chains

Always return a JSON object with the puzzle grid, solution grid, and metadata.`,
    
    user: `Generate a {difficulty} 4x4 Sudoku puzzle. Use null for empty cells.

Return format:
{
  "puzzle": {
    "grid": [[1, null, 3, null], ...],
    "difficulty": "{difficulty}",
    "clues": <number of given digits>
  },
  "solution": {
    "grid": [[1, 2, 3, 4], ...],
    "steps": [optional array of solution steps]
  },
  "metadata": {
    "estimatedTime": <seconds>,
    "techniques": ["hidden singles", ...],
    "difficultyScore": <1-10>
  },
  "hints": [
    {
      "level": "basic",
      "text": "Look at row 1. What number is missing?",
      "target": "row-1"
    }
  ]
}`,
    
    examples: [{
      input: { difficulty: 'medium' },
      output: {
        puzzle: {
          grid: [[1, null, 3, null], [null, 4, null, 2], [2, null, 4, null], [null, 3, null, 1]],
          difficulty: 'medium',
          clues: 8
        },
        solution: {
          grid: [[1, 2, 3, 4], [3, 4, 1, 2], [2, 1, 4, 3], [4, 3, 2, 1]]
        }
      }
    }]
  },

  pattern: {
    system: `You are an expert pattern puzzle generator. Create engaging pattern recognition puzzles that:
1. Have a clear, logical rule
2. Are appropriate for the difficulty level
3. Have exactly one correct answer
4. Are educational and satisfying to solve

Pattern types:
- Numeric: arithmetic sequences, geometric sequences, Fibonacci-like
- Shapes: rotations, transformations, combinations
- Colors: sequences, gradients, combinations
- Mixed: combining multiple pattern types

Difficulty affects pattern complexity and the number of steps in the sequence.`,
    
    user: `Generate a {difficulty} pattern puzzle of type: {subtype}.

Return format:
{
  "puzzle": {
    "sequence": [<array with one null element>] OR
    "shapes": [<array with one null element>] OR
    "matrix": [[<2D array with missing elements>]],
    "type": "{subtype}",
    "rule": "<hidden rule description>"
  },
  "solution": {
    "answer": <missing value>,
    "explanation": "<clear explanation of the pattern>",
    "formula": "<optional mathematical formula>"
  },
  "metadata": {
    "category": "<pattern category>",
    "difficulty": "{difficulty}"
  },
  "hints": [
    {
      "level": "basic",
      "text": "Look at the differences between consecutive numbers"
    }
  ]
}`
  },

  spatial: {
    system: `You are an expert spatial puzzle generator. Create challenging shape-fitting puzzles that:
1. Use tetromino-like shapes or custom polygons
2. Have a clear objective (fill the grid, match a pattern, etc.)
3. Are solvable with the given shapes
4. Test spatial reasoning and rotation skills

Difficulty guidelines:
- Easy: 3-4 simple shapes, no rotation needed, small grid
- Medium: 4-5 shapes, rotation allowed, medium grid
- Hard: 5-6 shapes, rotation required, larger grid
- Expert: 6+ shapes, complex shapes, obstacles in grid`,
    
    user: `Generate a {difficulty} spatial puzzle.

Return format:
{
  "puzzle": {
    "shapes": [
      {
        "type": "L" | "T" | "Square" | "Line" | "Z" | "Custom",
        "rotation": 0,
        "position": null,
        "blocks": [[1,1,0], [1,0,0], [1,0,0]] // for custom shapes
      }
    ],
    "grid": {
      "width": <4-8>,
      "height": <4-8>,
      "obstacles": [{"x": 2, "y": 3}] // optional blocked cells
    },
    "difficulty": "{difficulty}",
    "objective": "fill" | "match" | "connect"
  },
  "solution": {
    "placements": [
      {
        "shape": 0,
        "position": {"x": 0, "y": 0},
        "rotation": 90
      }
    ],
    "filled": <number of filled cells>
  },
  "metadata": {
    "estimatedTime": <seconds>,
    "rotationsRequired": <number>
  }
}`
  },

  logic: {
    system: `You are an expert logic puzzle generator. Create puzzles that test deductive reasoning, including:
- Grid logic puzzles (like Einstein's puzzle)
- Truth/lie puzzles
- Sequence completion
- Logical deduction challenges

Ensure puzzles have exactly one solution reachable through pure logic.`,
    
    user: `Generate a {difficulty} logic puzzle.`
  },

  math: {
    system: `You are an expert mathematical puzzle generator. Create puzzles that:
1. Test mathematical thinking without requiring advanced knowledge
2. Are solvable with basic arithmetic and logical thinking
3. Have elegant solutions
4. Are appropriate for a general audience

Types include: number sequences, arithmetic puzzles, geometric puzzles, cryptarithmetic.`,
    
    user: `Generate a {difficulty} math puzzle.`
  },

  wordplay: {
    system: `You are an expert word puzzle generator. Create engaging wordplay puzzles including:
- Anagrams
- Word ladders
- Cryptic definitions
- Letter patterns
- Word searches with twists

Keep vocabulary appropriate and avoid obscure words unless for expert level.`,
    
    user: `Generate a {difficulty} wordplay puzzle.`
  }
}