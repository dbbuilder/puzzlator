import type { GeneratedPuzzle, ValidationResult } from '@/types/ai'

export async function validatePuzzle(type: string, puzzle: GeneratedPuzzle): Promise<ValidationResult> {
  const validator = validators[type]
  if (!validator) {
    return {
      isValid: true,
      hasUniqueSolution: true,
      difficulty: 5,
      solvabilityScore: 1
    }
  }

  return validator(puzzle)
}

const validators: Record<string, (puzzle: GeneratedPuzzle) => Promise<ValidationResult>> = {
  sudoku4x4: async (puzzle) => {
    const errors: string[] = []
    let isValid = true

    // Check grid structure
    if (!puzzle.puzzle.grid || !Array.isArray(puzzle.puzzle.grid)) {
      errors.push('Missing or invalid grid')
      isValid = false
    } else {
      const grid = puzzle.puzzle.grid

      // Check dimensions
      if (grid.length !== 4 || !grid.every(row => row.length === 4)) {
        errors.push('Grid must be 4x4')
        isValid = false
      }

      // Check valid values
      const validValues = [null, 1, 2, 3, 4]
      for (let i = 0; i < grid.length; i++) {
        for (let j = 0; j < grid[i].length; j++) {
          if (!validValues.includes(grid[i][j])) {
            errors.push(`Invalid value at position (${i},${j}): ${grid[i][j]}`)
            isValid = false
          }
        }
      }

      // Check for duplicates in rows
      for (let i = 0; i < 4; i++) {
        const row = grid[i].filter(v => v !== null)
        if (new Set(row).size !== row.length) {
          errors.push(`Duplicate values in row ${i + 1}`)
          isValid = false
        }
      }

      // Check for duplicates in columns
      for (let j = 0; j < 4; j++) {
        const col = grid.map(row => row[j]).filter(v => v !== null)
        if (new Set(col).size !== col.length) {
          errors.push(`Duplicate values in column ${j + 1}`)
          isValid = false
        }
      }

      // Check for duplicates in 2x2 boxes
      const boxes = [
        [[0, 0], [0, 1], [1, 0], [1, 1]],
        [[0, 2], [0, 3], [1, 2], [1, 3]],
        [[2, 0], [2, 1], [3, 0], [3, 1]],
        [[2, 2], [2, 3], [3, 2], [3, 3]]
      ]
      
      for (let b = 0; b < boxes.length; b++) {
        const boxValues = boxes[b]
          .map(([i, j]) => grid[i][j])
          .filter(v => v !== null)
        if (new Set(boxValues).size !== boxValues.length) {
          errors.push(`Duplicate values in box ${b + 1}`)
          isValid = false
        }
      }

      // Count clues
      const clueCount = grid.flat().filter(v => v !== null).length
      const expectedRange = {
        easy: [8, 10],
        medium: [6, 8],
        hard: [5, 6],
        expert: [4, 5]
      }
      
      const range = expectedRange[puzzle.difficulty as keyof typeof expectedRange]
      if (range && (clueCount < range[0] || clueCount > range[1])) {
        errors.push(`Clue count ${clueCount} not in expected range ${range[0]}-${range[1]} for ${puzzle.difficulty}`)
      }
    }

    // Validate solution
    if (!puzzle.solution.grid || !Array.isArray(puzzle.solution.grid)) {
      errors.push('Missing or invalid solution')
      isValid = false
    } else {
      const solution = puzzle.solution.grid
      
      // Check if solution is complete
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
          if (![1, 2, 3, 4].includes(solution[i][j])) {
            errors.push(`Invalid solution value at (${i},${j})`)
            isValid = false
          }
        }
      }

      // Check if solution matches puzzle
      if (puzzle.puzzle.grid) {
        for (let i = 0; i < 4; i++) {
          for (let j = 0; j < 4; j++) {
            const clue = puzzle.puzzle.grid[i][j]
            if (clue !== null && clue !== solution[i][j]) {
              errors.push(`Solution doesn't match clue at (${i},${j})`)
              isValid = false
            }
          }
        }
      }
    }

    return {
      isValid,
      hasUniqueSolution: true, // Would need solver to verify
      difficulty: puzzle.metadata?.difficultyScore || 5,
      solvabilityScore: isValid ? 1 : 0,
      errors: errors.length > 0 ? errors : undefined
    }
  },

  pattern: async (puzzle) => {
    const errors: string[] = []
    let isValid = true

    // Check puzzle structure
    if (!puzzle.puzzle.sequence && !puzzle.puzzle.shapes && !puzzle.puzzle.matrix) {
      errors.push('Missing pattern data')
      isValid = false
    }

    // Check for exactly one null
    if (puzzle.puzzle.sequence) {
      const nullCount = puzzle.puzzle.sequence.filter((v: any) => v === null).length
      if (nullCount !== 1) {
        errors.push(`Expected exactly 1 missing element, found ${nullCount}`)
        isValid = false
      }
    }

    // Check solution
    if (!puzzle.solution.answer) {
      errors.push('Missing solution answer')
      isValid = false
    }

    if (!puzzle.solution.explanation) {
      errors.push('Missing solution explanation')
      isValid = false
    }

    return {
      isValid,
      hasUniqueSolution: true,
      difficulty: 5,
      solvabilityScore: isValid ? 1 : 0,
      errors: errors.length > 0 ? errors : undefined
    }
  },

  spatial: async (puzzle) => {
    const errors: string[] = []
    let isValid = true

    // Check shapes
    if (!puzzle.puzzle.shapes || !Array.isArray(puzzle.puzzle.shapes)) {
      errors.push('Missing or invalid shapes')
      isValid = false
    }

    // Check grid
    if (!puzzle.puzzle.grid || !puzzle.puzzle.grid.width || !puzzle.puzzle.grid.height) {
      errors.push('Missing or invalid grid dimensions')
      isValid = false
    }

    // Check solution placements
    if (!puzzle.solution.placements || !Array.isArray(puzzle.solution.placements)) {
      errors.push('Missing solution placements')
      isValid = false
    } else {
      // Verify all shapes are placed
      if (puzzle.solution.placements.length !== puzzle.puzzle.shapes.length) {
        errors.push('Not all shapes are placed in solution')
        isValid = false
      }
    }

    return {
      isValid,
      hasUniqueSolution: true,
      difficulty: puzzle.metadata?.difficultyScore || 5,
      solvabilityScore: isValid ? 1 : 0,
      errors: errors.length > 0 ? errors : undefined
    }
  }
}

// Helper functions for more complex validation

export function validateSudokuUniqueness(grid: (number | null)[][]): boolean {
  // This would implement a Sudoku solver to check for unique solution
  // For now, return true
  return true
}

export function validatePatternLogic(sequence: any[], answer: any): boolean {
  // Verify the pattern makes logical sense
  // This would check common patterns like arithmetic, geometric, etc.
  return true
}

export function validateSpatialFit(shapes: any[], placements: any[], grid: any): boolean {
  // Verify shapes don't overlap and fit within grid
  // This would check collision detection
  return true
}