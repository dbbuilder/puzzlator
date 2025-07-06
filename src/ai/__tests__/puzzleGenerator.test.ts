import { describe, it, expect, beforeEach, vi } from 'vitest'
import { PuzzleGenerator } from '../puzzleGenerator'
import type { PuzzleGenerationRequest, GeneratedPuzzle } from '@/types/ai'

// Mock OpenAI
vi.mock('openai', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: vi.fn()
        }
      }
    }))
  }
})

describe('PuzzleGenerator', () => {
  let generator: PuzzleGenerator
  let mockOpenAI: any

  beforeEach(() => {
    vi.clearAllMocks()
    generator = new PuzzleGenerator({ apiKey: 'test-key' })
    mockOpenAI = (generator as any).openai
  })

  describe('Sudoku Generation', () => {
    it('generates a valid 4x4 Sudoku puzzle', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              puzzle: {
                grid: [
                  [1, null, 3, null],
                  [null, 4, null, 2],
                  [2, null, 4, null],
                  [null, 3, null, 1]
                ],
                difficulty: 'medium',
                clues: 8
              },
              solution: {
                grid: [
                  [1, 2, 3, 4],
                  [3, 4, 1, 2],
                  [2, 1, 4, 3],
                  [4, 3, 2, 1]
                ]
              },
              metadata: {
                estimatedTime: 300,
                techniques: ['hidden singles', 'naked pairs'],
                difficultyScore: 3.5
              }
            })
          }
        }]
      }

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse)

      const request: PuzzleGenerationRequest = {
        type: 'sudoku4x4',
        difficulty: 'medium',
        userLevel: 5
      }

      const result = await generator.generatePuzzle(request)

      expect(result).toBeDefined()
      expect(result.type).toBe('sudoku4x4')
      expect(result.difficulty).toBe('medium')
      expect(result.puzzle.grid).toHaveLength(4)
      expect(result.solution.grid).toHaveLength(4)
    })

    it('validates Sudoku puzzle constraints', async () => {
      const invalidResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              puzzle: {
                grid: [
                  [1, 1, 3, 4], // Invalid: duplicate 1 in row
                  [2, 3, 4, 1],
                  [3, 4, 1, 2],
                  [4, 2, 2, 3]  // Invalid: duplicate 2 in row
                ],
                difficulty: 'easy',
                clues: 16
              },
              solution: {
                grid: [
                  [1, 2, 3, 4],
                  [2, 3, 4, 1],
                  [3, 4, 1, 2],
                  [4, 1, 2, 3]
                ]
              }
            })
          }
        }],
        usage: { prompt_tokens: 100, completion_tokens: 200 }
      }

      mockOpenAI.chat.completions.create.mockResolvedValue(invalidResponse)

      const request: PuzzleGenerationRequest = {
        type: 'sudoku4x4',
        difficulty: 'easy'
      }

      await expect(generator.generatePuzzle(request)).rejects.toThrow('Invalid puzzle generated')
    })

    it('retries on generation failure', async () => {
      // First attempt fails
      mockOpenAI.chat.completions.create
        .mockRejectedValueOnce(new Error('API error'))
        .mockResolvedValueOnce({
          choices: [{
            message: {
              content: JSON.stringify({
                puzzle: { grid: [[1, null, 3, 4], [null, 3, 4, 1], [3, 4, 1, null], [4, 1, null, 3]] },
                solution: { grid: [[1, 2, 3, 4], [2, 3, 4, 1], [3, 4, 1, 2], [4, 1, 2, 3]] }
              })
            }
          }]
        })

      const request: PuzzleGenerationRequest = {
        type: 'sudoku4x4',
        difficulty: 'hard'
      }

      const result = await generator.generatePuzzle(request)

      expect(result).toBeDefined()
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledTimes(2)
    })
  })

  describe('Pattern Matching Generation', () => {
    it('generates numeric patterns', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              puzzle: {
                sequence: [2, 4, 8, 16, null],
                type: 'numeric',
                rule: 'multiply by 2'
              },
              solution: {
                answer: 32,
                explanation: 'Each number is multiplied by 2'
              },
              metadata: {
                difficulty: 'easy',
                category: 'multiplication'
              }
            })
          }
        }]
      }

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse)

      const request: PuzzleGenerationRequest = {
        type: 'pattern',
        difficulty: 'easy',
        subtype: 'numeric'
      }

      const result = await generator.generatePuzzle(request)

      expect(result.puzzle.sequence).toEqual([2, 4, 8, 16, null])
      expect(result.solution.answer).toBe(32)
    })

    it('generates shape patterns', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              puzzle: {
                shapes: ['circle', 'square', 'triangle', 'circle', 'square', null],
                type: 'shapes',
                rule: 'repeating pattern of 3'
              },
              solution: {
                answer: 'triangle',
                explanation: 'Pattern repeats every 3 shapes: circle, square, triangle'
              }
            })
          }
        }]
      }

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse)

      const request: PuzzleGenerationRequest = {
        type: 'pattern',
        difficulty: 'medium',
        subtype: 'shapes'
      }

      const result = await generator.generatePuzzle(request)

      expect(result.puzzle.shapes).toContain('circle')
      expect(result.solution.answer).toBe('triangle')
    })
  })

  describe('Spatial Puzzle Generation', () => {
    it('generates spatial rotation puzzles', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              puzzle: {
                shapes: [
                  { type: 'L', rotation: 0, position: null },
                  { type: 'T', rotation: 90, position: null },
                  { type: 'Square', rotation: 0, position: null }
                ],
                grid: { width: 6, height: 6 },
                difficulty: 'medium'
              },
              solution: {
                placements: [
                  { shape: 0, position: { x: 0, y: 0 }, rotation: 0 },
                  { shape: 1, position: { x: 3, y: 0 }, rotation: 90 },
                  { shape: 2, position: { x: 0, y: 3 }, rotation: 0 }
                ],
                filled: 12
              }
            })
          }
        }]
      }

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse)

      const request: PuzzleGenerationRequest = {
        type: 'spatial',
        difficulty: 'medium'
      }

      const result = await generator.generatePuzzle(request)

      expect(result.puzzle.shapes).toHaveLength(3)
      expect(result.puzzle.grid.width).toBe(6)
      expect(result.solution.placements).toHaveLength(3)
    })
  })

  describe('Prompt Engineering', () => {
    it('includes user performance in prompts', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              puzzle: { grid: [[1, null, 3, 4], [null, 3, 4, 1], [3, 4, 1, null], [4, 1, null, 3]] },
              solution: { grid: [[1, 2, 3, 4], [2, 3, 4, 1], [3, 4, 1, 2], [4, 1, 2, 3]] }
            })
          }
        }],
        usage: { prompt_tokens: 100, completion_tokens: 200 }
      }

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse)

      const request: PuzzleGenerationRequest = {
        type: 'sudoku4x4',
        difficulty: 'medium',
        userLevel: 7,
        previousPerformance: {
          averageTime: 240,
          successRate: 0.85,
          hintsUsed: 0.2
        }
      }

      await generator.generatePuzzle(request)

      const createCall = mockOpenAI.chat.completions.create.mock.calls[0][0]
      const systemMessage = createCall.messages.find((m: any) => m.role === 'system')
      
      expect(systemMessage.content).toContain('user level 7')
      expect(systemMessage.content).toContain('85% success rate')
    })

    it('adapts difficulty based on performance', async () => {
      const request: PuzzleGenerationRequest = {
        type: 'pattern',
        difficulty: 'medium',
        previousPerformance: {
          averageTime: 60, // Very fast
          successRate: 1.0, // Perfect
          hintsUsed: 0 // No hints
        }
      }

      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              puzzle: { sequence: [1, 1, 2, 3, 5, null], type: 'numeric' },
              solution: { answer: 8 },
              metadata: { adjustedDifficulty: 'hard' }
            })
          }
        }]
      }

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse)
      const result = await generator.generatePuzzle(request)

      expect(result.metadata?.adjustedDifficulty).toBe('hard')
    })
  })

  describe('Error Handling', () => {
    it('handles API rate limiting', async () => {
      const rateLimitError = new Error('Rate limit exceeded')
      ;(rateLimitError as any).status = 429

      mockOpenAI.chat.completions.create
        .mockRejectedValueOnce(rateLimitError)
        .mockResolvedValueOnce({
          choices: [{
            message: {
              content: JSON.stringify({
                puzzle: { grid: [[1, null], [null, 2]] },
                solution: { grid: [[1, 2], [2, 1]] }
              })
            }
          }]
        })

      const result = await generator.generatePuzzle({
        type: 'sudoku4x4',
        difficulty: 'easy'
      })

      expect(result).toBeDefined()
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledTimes(2)
    })

    it('falls back to local generation on API failure', async () => {
      mockOpenAI.chat.completions.create.mockRejectedValue(new Error('API unavailable'))

      const result = await generator.generatePuzzle({
        type: 'sudoku4x4',
        difficulty: 'easy',
        allowFallback: true
      })

      expect(result).toBeDefined()
      expect(result.metadata?.generatedLocally).toBe(true)
    })

    it('validates generated puzzle structure', async () => {
      const malformedResponse = {
        choices: [{
          message: {
            content: 'Not valid JSON'
          }
        }]
      }

      mockOpenAI.chat.completions.create.mockResolvedValue(malformedResponse)

      await expect(generator.generatePuzzle({
        type: 'pattern',
        difficulty: 'medium'
      })).rejects.toThrow('Invalid response format')
    })
  })

  describe('Caching', () => {
    it('caches generated puzzles', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              puzzle: { sequence: [1, 2, 3, null] },
              solution: { answer: 4 }
            })
          }
        }]
      }

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse)

      const request: PuzzleGenerationRequest = {
        type: 'pattern',
        difficulty: 'easy',
        useCache: true
      }

      // First call
      const result1 = await generator.generatePuzzle(request)
      
      // Second call should use cache
      const result2 = await generator.generatePuzzle(request)

      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledTimes(1)
      expect(result1).toEqual(result2)
    })

    it('bypasses cache when requested', async () => {
      const request: PuzzleGenerationRequest = {
        type: 'pattern',
        difficulty: 'easy',
        useCache: false
      }

      await generator.generatePuzzle(request)
      await generator.generatePuzzle(request)

      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledTimes(2)
    })
  })
})