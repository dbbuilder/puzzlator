import { describe, it, expect, beforeEach } from 'vitest'
import { PuzzleGenerationService, Sudoku4x4Generator } from './puzzle-generation'
import type { PuzzleDifficulty } from '../game/types/puzzle'

describe('PuzzleGenerationService', () => {
  let service: PuzzleGenerationService

  beforeEach(() => {
    service = new PuzzleGenerationService()
  })

  describe('puzzle generation', () => {
    it('should generate a sudoku4x4 puzzle', async () => {
      const puzzle = await service.generatePuzzle({
        type: 'sudoku4x4',
        difficulty: 'easy'
      })

      expect(puzzle).toBeDefined()
      expect(puzzle.id).toBeDefined()
      expect(puzzle.type).toBe('sudoku4x4')
      expect(puzzle.difficulty).toBe('easy')
      expect(puzzle.title).toMatch(/Easy 4x4 Sudoku #\d+/)
      expect(puzzle.puzzle_data).toBeDefined()
      expect(puzzle.solution_data).toBeDefined()
      expect(puzzle.created_at).toBeInstanceOf(Date)
    })

    it('should throw error for unregistered puzzle type', async () => {
      await expect(
        service.generatePuzzle({
          type: 'nonexistent',
          difficulty: 'easy'
        })
      ).rejects.toThrow('No generator registered for puzzle type: nonexistent')
    })

    it('should generate puzzles with different difficulties', async () => {
      const difficulties: PuzzleDifficulty[] = ['easy', 'medium', 'hard', 'expert']
      
      for (const difficulty of difficulties) {
        const puzzle = await service.generatePuzzle({
          type: 'sudoku4x4',
          difficulty
        })
        
        expect(puzzle.difficulty).toBe(difficulty)
        
        // Count empty cells in puzzle
        const emptyCells = puzzle.puzzle_data
          .flat()
          .filter((cell: number) => cell === 0).length
        
        // Higher difficulty should have more empty cells
        if (difficulty === 'easy') expect(emptyCells).toBeLessThanOrEqual(6)
        if (difficulty === 'expert') expect(emptyCells).toBeGreaterThanOrEqual(8)
      }
    })
  })

  describe('batch generation', () => {
    it('should generate multiple puzzles', async () => {
      const puzzles = await service.generateBatch(
        {
          type: 'sudoku4x4',
          difficulty: 'medium'
        },
        5
      )

      expect(puzzles).toHaveLength(5)
      
      // Check that all puzzles are unique
      const puzzleStrings = puzzles.map(p => JSON.stringify(p.puzzle_data))
      const uniquePuzzles = new Set(puzzleStrings)
      expect(uniquePuzzles.size).toBe(5)
    })
  })

  describe('available types', () => {
    it('should return registered puzzle types', () => {
      const types = service.getAvailableTypes()
      expect(types).toContain('sudoku4x4')
    })

    it('should include newly registered types', () => {
      // Mock generator
      const mockGenerator = {
        async generate() {
          return { puzzle_data: [], solution_data: [] }
        }
      }
      
      service.registerGenerator('custom', mockGenerator)
      const types = service.getAvailableTypes()
      
      expect(types).toContain('custom')
    })
  })
})

describe('Sudoku4x4Generator', () => {
  let generator: Sudoku4x4Generator

  beforeEach(() => {
    generator = new Sudoku4x4Generator()
  })

  describe('solution generation', () => {
    it('should generate valid 4x4 sudoku solutions', async () => {
      const { solution_data } = await generator.generate('medium')
      
      // Check dimensions
      expect(solution_data).toHaveLength(4)
      solution_data.forEach(row => {
        expect(row).toHaveLength(4)
      })
      
      // Check all numbers 1-4 are present
      const allNumbers = solution_data.flat()
      expect(allNumbers).toHaveLength(16)
      expect(new Set(allNumbers)).toEqual(new Set([1, 2, 3, 4]))
      
      // Check rows contain all numbers 1-4
      solution_data.forEach(row => {
        expect(new Set(row)).toEqual(new Set([1, 2, 3, 4]))
      })
      
      // Check columns contain all numbers 1-4
      for (let col = 0; col < 4; col++) {
        const column = solution_data.map(row => row[col])
        expect(new Set(column)).toEqual(new Set([1, 2, 3, 4]))
      }
      
      // Check 2x2 boxes contain all numbers 1-4
      const boxes = [
        [solution_data[0][0], solution_data[0][1], solution_data[1][0], solution_data[1][1]],
        [solution_data[0][2], solution_data[0][3], solution_data[1][2], solution_data[1][3]],
        [solution_data[2][0], solution_data[2][1], solution_data[3][0], solution_data[3][1]],
        [solution_data[2][2], solution_data[2][3], solution_data[3][2], solution_data[3][3]]
      ]
      
      boxes.forEach(box => {
        expect(new Set(box)).toEqual(new Set([1, 2, 3, 4]))
      })
    })

    it('should generate different solutions', async () => {
      const solutions = []
      for (let i = 0; i < 10; i++) {
        const { solution_data } = await generator.generate('medium')
        solutions.push(JSON.stringify(solution_data))
      }
      
      // At least some solutions should be different
      const uniqueSolutions = new Set(solutions)
      expect(uniqueSolutions.size).toBeGreaterThan(1)
    })
  })

  describe('puzzle generation', () => {
    it('should create puzzles from solutions', async () => {
      const { puzzle_data, solution_data } = await generator.generate('easy')
      
      // Puzzle should have some empty cells (0s)
      const emptyCells = puzzle_data.flat().filter((cell: number) => cell === 0)
      expect(emptyCells.length).toBeGreaterThan(0)
      
      // All non-zero cells in puzzle should match solution
      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
          if (puzzle_data[row][col] !== 0) {
            expect(puzzle_data[row][col]).toBe(solution_data[row][col])
          }
        }
      }
    })

    it('should respect difficulty levels', async () => {
      const easyPuzzle = await generator.generate('easy')
      const expertPuzzle = await generator.generate('expert')
      
      const easyEmptyCells = easyPuzzle.puzzle_data.flat().filter((c: number) => c === 0).length
      const expertEmptyCells = expertPuzzle.puzzle_data.flat().filter((c: number) => c === 0).length
      
      // Expert should have more empty cells than easy
      expect(expertEmptyCells).toBeGreaterThan(easyEmptyCells)
    })
  })
})