import { v4 as uuidv4 } from 'uuid'
import type { PuzzleGenerationRequest, GeneratedPuzzle } from '@/types/ai'
import { Sudoku4x4 } from '@/game/puzzles/sudoku/Sudoku4x4'
import { PatternMatchingPuzzle } from '@/game/puzzles/logic/PatternMatching'
import { SpatialPuzzle } from '@/game/puzzles/spatial/SpatialPuzzle'

/**
 * Generate puzzles locally without AI
 * This serves as a fallback when the AI API is unavailable
 */
export async function generateLocalPuzzle(request: PuzzleGenerationRequest): Promise<GeneratedPuzzle> {
  const startTime = Date.now()
  
  switch (request.type) {
    case 'sudoku4x4':
      return generateLocalSudoku(request, startTime)
    
    case 'pattern':
      return generateLocalPattern(request, startTime)
    
    case 'spatial':
      return generateLocalSpatial(request, startTime)
    
    default:
      throw new Error(`Local generation not implemented for type: ${request.type}`)
  }
}

function generateLocalSudoku(request: PuzzleGenerationRequest, startTime: number): GeneratedPuzzle {
  const sudoku = new Sudoku4x4()
  sudoku.generatePuzzle(request.difficulty)
  
  const grid = []
  const solution = []
  
  // Convert to format expected by AI types
  for (let i = 0; i < 4; i++) {
    grid[i] = []
    solution[i] = []
    for (let j = 0; j < 4; j++) {
      const cell = sudoku.getCell(i, j)
      grid[i][j] = cell.given ? cell.value : null
      solution[i][j] = sudoku.getSolution()?.[i]?.[j] || cell.value
    }
  }
  
  const clueCount = grid.flat().filter(v => v !== null).length
  
  return {
    id: uuidv4(),
    type: 'sudoku4x4',
    difficulty: request.difficulty,
    puzzle: {
      grid,
      difficulty: request.difficulty,
      clues: clueCount
    },
    solution: {
      grid: solution
    },
    metadata: {
      generatedAt: new Date().toISOString(),
      generationTime: Date.now() - startTime,
      model: 'local',
      generatedLocally: true,
      estimatedTime: getEstimatedTime('sudoku4x4', request.difficulty),
      techniques: getTechniques('sudoku4x4', request.difficulty),
      difficultyScore: getDifficultyScore(request.difficulty)
    },
    hints: generateSudokuHints(grid)
  }
}

function generateLocalPattern(request: PuzzleGenerationRequest, startTime: number): GeneratedPuzzle {
  const puzzle = new PatternMatchingPuzzle()
  const patternData = generatePatternByDifficulty(request.difficulty, request.subtype || 'numeric')
  
  return {
    id: uuidv4(),
    type: 'pattern',
    difficulty: request.difficulty,
    puzzle: patternData.puzzle,
    solution: patternData.solution,
    metadata: {
      generatedAt: new Date().toISOString(),
      generationTime: Date.now() - startTime,
      model: 'local',
      generatedLocally: true,
      estimatedTime: getEstimatedTime('pattern', request.difficulty),
      category: patternData.category,
      difficultyScore: getDifficultyScore(request.difficulty)
    },
    hints: patternData.hints
  }
}

function generateLocalSpatial(request: PuzzleGenerationRequest, startTime: number): GeneratedPuzzle {
  const puzzle = new SpatialPuzzle()
  const spatialData = generateSpatialByDifficulty(request.difficulty)
  
  return {
    id: uuidv4(),
    type: 'spatial',
    difficulty: request.difficulty,
    puzzle: spatialData.puzzle,
    solution: spatialData.solution,
    metadata: {
      generatedAt: new Date().toISOString(),
      generationTime: Date.now() - startTime,
      model: 'local',
      generatedLocally: true,
      estimatedTime: getEstimatedTime('spatial', request.difficulty),
      rotationsRequired: spatialData.rotationsRequired,
      difficultyScore: getDifficultyScore(request.difficulty)
    },
    hints: spatialData.hints
  }
}

// Helper functions

function generatePatternByDifficulty(difficulty: string, subtype: string) {
  const patterns = {
    easy: {
      numeric: {
        puzzle: {
          sequence: [2, 4, 6, 8, null],
          type: 'numeric',
          rule: 'add 2'
        },
        solution: {
          answer: 10,
          explanation: 'Each number increases by 2'
        },
        category: 'arithmetic',
        hints: [
          { level: 'basic', text: 'Look at the differences between numbers' },
          { level: 'intermediate', text: 'What do you add to get from one number to the next?' }
        ]
      },
      shapes: {
        puzzle: {
          shapes: ['circle', 'square', 'circle', 'square', null],
          type: 'shapes',
          rule: 'alternating'
        },
        solution: {
          answer: 'circle',
          explanation: 'The pattern alternates between circle and square'
        },
        category: 'alternating',
        hints: [
          { level: 'basic', text: 'Look for a repeating pattern' }
        ]
      }
    },
    medium: {
      numeric: {
        puzzle: {
          sequence: [1, 1, 2, 3, 5, null],
          type: 'numeric',
          rule: 'fibonacci'
        },
        solution: {
          answer: 8,
          explanation: 'Each number is the sum of the two before it (Fibonacci sequence)'
        },
        category: 'fibonacci',
        hints: [
          { level: 'basic', text: 'Try adding numbers together' },
          { level: 'intermediate', text: 'Look at how each number relates to the two before it' }
        ]
      }
    },
    hard: {
      numeric: {
        puzzle: {
          sequence: [2, 6, 12, 20, 30, null],
          type: 'numeric',
          rule: 'n * (n + 1)'
        },
        solution: {
          answer: 42,
          explanation: 'Each number follows the pattern n × (n + 1): 1×2=2, 2×3=6, 3×4=12, etc.'
        },
        category: 'polynomial',
        hints: [
          { level: 'basic', text: 'The differences between numbers form a pattern' },
          { level: 'intermediate', text: 'Try looking at factors of each number' }
        ]
      }
    }
  }
  
  const difficultyPatterns = patterns[difficulty as keyof typeof patterns] || patterns.easy
  const pattern = difficultyPatterns[subtype as keyof typeof difficultyPatterns] || difficultyPatterns.numeric
  
  return pattern
}

function generateSpatialByDifficulty(difficulty: string) {
  const configs = {
    easy: {
      puzzle: {
        shapes: [
          { type: 'Square', rotation: 0, position: null },
          { type: 'Line', rotation: 0, position: null },
          { type: 'L', rotation: 0, position: null }
        ],
        grid: { width: 4, height: 4 },
        difficulty: 'easy',
        objective: 'fill'
      },
      solution: {
        placements: [
          { shape: 0, position: { x: 0, y: 0 }, rotation: 0 },
          { shape: 1, position: { x: 2, y: 0 }, rotation: 0 },
          { shape: 2, position: { x: 0, y: 2 }, rotation: 0 }
        ],
        filled: 9
      },
      rotationsRequired: 0,
      hints: [
        { level: 'basic', text: 'Start with the largest shape' },
        { level: 'intermediate', text: 'Place the square in a corner' }
      ]
    },
    medium: {
      puzzle: {
        shapes: [
          { type: 'T', rotation: 0, position: null },
          { type: 'L', rotation: 0, position: null },
          { type: 'Z', rotation: 0, position: null },
          { type: 'Square', rotation: 0, position: null }
        ],
        grid: { width: 6, height: 6 },
        difficulty: 'medium',
        objective: 'fill'
      },
      solution: {
        placements: [
          { shape: 0, position: { x: 0, y: 0 }, rotation: 90 },
          { shape: 1, position: { x: 3, y: 0 }, rotation: 180 },
          { shape: 2, position: { x: 0, y: 3 }, rotation: 0 },
          { shape: 3, position: { x: 4, y: 4 }, rotation: 0 }
        ],
        filled: 16
      },
      rotationsRequired: 2,
      hints: [
        { level: 'basic', text: 'Some shapes need to be rotated' },
        { level: 'intermediate', text: 'Try rotating the T shape' }
      ]
    }
  }
  
  return configs[difficulty as keyof typeof configs] || configs.easy
}

function generateSudokuHints(grid: (number | null)[][]): any[] {
  const hints = []
  
  // Find a row with only one empty cell
  for (let i = 0; i < 4; i++) {
    const emptyCells = grid[i].filter(v => v === null).length
    if (emptyCells === 1) {
      hints.push({
        level: 'basic',
        text: `Look at row ${i + 1}. Which number is missing?`,
        target: `row-${i + 1}`
      })
      break
    }
  }
  
  // Find a column with few empty cells
  for (let j = 0; j < 4; j++) {
    const col = grid.map(row => row[j])
    const emptyCells = col.filter(v => v === null).length
    if (emptyCells === 1 || emptyCells === 2) {
      hints.push({
        level: 'intermediate',
        text: `Check column ${j + 1}. What numbers are already there?`,
        target: `col-${j + 1}`
      })
      break
    }
  }
  
  return hints
}

function getEstimatedTime(type: string, difficulty: string): number {
  const times = {
    sudoku4x4: { easy: 120, medium: 240, hard: 360, expert: 480 },
    pattern: { easy: 60, medium: 120, hard: 180, expert: 240 },
    spatial: { easy: 90, medium: 180, hard: 300, expert: 420 }
  }
  
  return times[type as keyof typeof times]?.[difficulty as keyof typeof times.sudoku4x4] || 180
}

function getTechniques(type: string, difficulty: string): string[] {
  if (type !== 'sudoku4x4') return []
  
  const techniques = {
    easy: ['scanning', 'single candidates'],
    medium: ['scanning', 'single candidates', 'hidden singles'],
    hard: ['scanning', 'single candidates', 'hidden singles', 'naked pairs'],
    expert: ['scanning', 'single candidates', 'hidden singles', 'naked pairs', 'pointing pairs']
  }
  
  return techniques[difficulty as keyof typeof techniques] || techniques.easy
}

function getDifficultyScore(difficulty: string): number {
  const scores = {
    easy: 2.5,
    medium: 5,
    hard: 7.5,
    expert: 9
  }
  
  return scores[difficulty as keyof typeof scores] || 5
}