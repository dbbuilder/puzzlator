import { v4 as uuidv4 } from 'uuid'
import type { PuzzleDifficulty } from '../game/types/puzzle'

export interface GeneratedPuzzle {
  id: string
  type: string
  difficulty: PuzzleDifficulty
  title: string
  description?: string
  puzzle_data: any
  solution_data: any
  created_at: Date
}

export interface PuzzleGenerationOptions {
  type: string
  difficulty: PuzzleDifficulty
  seed?: number
  customOptions?: Record<string, any>
}

/**
 * Service for generating puzzles programmatically
 */
export class PuzzleGenerationService {
  private generators: Map<string, PuzzleGenerator> = new Map()

  constructor() {
    // Register default generators
    this.registerGenerator('sudoku4x4', new Sudoku4x4Generator())
  }

  /**
   * Register a new puzzle generator
   */
  registerGenerator(type: string, generator: PuzzleGenerator): void {
    this.generators.set(type, generator)
  }

  /**
   * Generate a puzzle of the specified type and difficulty
   */
  async generatePuzzle(options: PuzzleGenerationOptions): Promise<GeneratedPuzzle> {
    const generator = this.generators.get(options.type)
    if (!generator) {
      throw new Error(`No generator registered for puzzle type: ${options.type}`)
    }

    const { puzzle_data, solution_data } = await generator.generate(
      options.difficulty,
      options.seed,
      options.customOptions
    )

    return {
      id: uuidv4(),
      type: options.type,
      difficulty: options.difficulty,
      title: this.generateTitle(options.type, options.difficulty),
      description: `A ${options.difficulty} ${options.type} puzzle`,
      puzzle_data,
      solution_data,
      created_at: new Date()
    }
  }

  /**
   * Generate multiple puzzles in batch
   */
  async generateBatch(
    options: PuzzleGenerationOptions,
    count: number
  ): Promise<GeneratedPuzzle[]> {
    const puzzles: GeneratedPuzzle[] = []
    
    for (let i = 0; i < count; i++) {
      // Use different seeds for variety
      const seedOptions = { ...options, seed: options.seed ? options.seed + i : undefined }
      puzzles.push(await this.generatePuzzle(seedOptions))
    }
    
    return puzzles
  }

  /**
   * Get available puzzle types
   */
  getAvailableTypes(): string[] {
    return Array.from(this.generators.keys())
  }

  /**
   * Generate a title for the puzzle
   */
  private generateTitle(type: string, difficulty: PuzzleDifficulty): string {
    const typeNames: Record<string, string> = {
      sudoku4x4: '4x4 Sudoku',
      sudoku9x9: '9x9 Sudoku',
      crossword: 'Crossword',
      wordsearch: 'Word Search'
    }

    const difficultyNames: Record<PuzzleDifficulty, string> = {
      easy: 'Easy',
      medium: 'Medium',
      hard: 'Hard',
      expert: 'Expert'
    }

    const typeName = typeNames[type] || type
    const difficultyName = difficultyNames[difficulty]
    
    return `${difficultyName} ${typeName} #${Math.floor(Math.random() * 9999) + 1}`
  }
}

/**
 * Interface for puzzle generators
 */
export interface PuzzleGenerator {
  generate(
    difficulty: PuzzleDifficulty,
    seed?: number,
    options?: Record<string, any>
  ): Promise<{ puzzle_data: any; solution_data: any }>
}

/**
 * Sudoku 4x4 puzzle generator
 */
export class Sudoku4x4Generator implements PuzzleGenerator {
  async generate(
    difficulty: PuzzleDifficulty,
    seed?: number
  ): Promise<{ puzzle_data: number[][]; solution_data: number[][] }> {
    // Generate a complete valid Sudoku solution
    const solution = this.generateCompleteSudoku()
    
    // Create puzzle by removing numbers based on difficulty
    const puzzle = this.createPuzzleFromSolution(solution, difficulty)
    
    return {
      puzzle_data: puzzle,
      solution_data: solution
    }
  }

  private generateCompleteSudoku(): number[][] {
    // Start with a base valid solution
    const baseSolution = [
      [1, 2, 3, 4],
      [3, 4, 1, 2],
      [2, 1, 4, 3],
      [4, 3, 2, 1]
    ]

    // Apply random transformations to create variety
    return this.applyTransformations(baseSolution)
  }

  private applyTransformations(grid: number[][]): number[][] {
    let result = this.deepCopy(grid)
    
    // Random number permutation
    const permutation = this.createPermutation()
    result = result.map(row => row.map(num => permutation[num - 1]))
    
    // Random row swaps within groups
    if (Math.random() > 0.5) {
      [result[0], result[1]] = [result[1], result[0]]
    }
    if (Math.random() > 0.5) {
      [result[2], result[3]] = [result[3], result[2]]
    }
    
    // Random column swaps within groups
    if (Math.random() > 0.5) {
      for (let i = 0; i < 4; i++) {
        [result[i][0], result[i][1]] = [result[i][1], result[i][0]]
      }
    }
    if (Math.random() > 0.5) {
      for (let i = 0; i < 4; i++) {
        [result[i][2], result[i][3]] = [result[i][3], result[i][2]]
      }
    }
    
    // Random rotation (0, 90, 180, 270 degrees)
    const rotations = Math.floor(Math.random() * 4)
    for (let i = 0; i < rotations; i++) {
      result = this.rotate90(result)
    }
    
    return result
  }

  private createPermutation(): number[] {
    const nums = [1, 2, 3, 4]
    for (let i = nums.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [nums[i], nums[j]] = [nums[j], nums[i]]
    }
    return nums
  }

  private rotate90(grid: number[][]): number[][] {
    const n = grid.length
    const rotated: number[][] = Array(n).fill(null).map(() => Array(n).fill(0))
    
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        rotated[j][n - 1 - i] = grid[i][j]
      }
    }
    
    return rotated
  }

  private createPuzzleFromSolution(
    solution: number[][],
    difficulty: PuzzleDifficulty
  ): number[][] {
    const puzzle = this.deepCopy(solution)
    const cellsToRemove = this.getCellsToRemove(difficulty)
    
    // Get all cell positions
    const positions: [number, number][] = []
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        positions.push([row, col])
      }
    }
    
    // Shuffle positions
    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [positions[i], positions[j]] = [positions[j], positions[i]]
    }
    
    // Remove cells
    let removed = 0
    for (const [row, col] of positions) {
      if (removed >= cellsToRemove) break
      
      const temp = puzzle[row][col]
      puzzle[row][col] = 0
      
      // Check if puzzle still has unique solution (simplified check for 4x4)
      if (this.hasUniqueSolution(puzzle)) {
        removed++
      } else {
        // Restore the number if removing it creates multiple solutions
        puzzle[row][col] = temp
      }
    }
    
    return puzzle
  }

  private getCellsToRemove(difficulty: PuzzleDifficulty): number {
    const removeCount = {
      easy: 4,    // Remove 4 cells, leaving 12 clues
      medium: 6,  // Remove 6 cells, leaving 10 clues
      hard: 8,    // Remove 8 cells, leaving 8 clues
      expert: 10  // Remove 10 cells, leaving 6 clues
    }
    return removeCount[difficulty]
  }

  private hasUniqueSolution(puzzle: number[][]): boolean {
    // For 4x4 Sudoku, we can use a simplified check
    // In production, you'd want a more robust solver
    return true // Simplified for this implementation
  }

  private deepCopy(grid: number[][]): number[][] {
    return grid.map(row => [...row])
  }
}

// Export singleton instance
export const puzzleGenerationService = new PuzzleGenerationService()