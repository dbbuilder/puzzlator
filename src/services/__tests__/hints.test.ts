import { describe, it, expect, beforeEach, vi } from 'vitest'
import { HintService } from '../hints'
import type { PuzzleHint, HintLevel, HintResult } from '@/types/hints'

describe('HintService', () => {
  let hintService: HintService

  beforeEach(() => {
    hintService = new HintService()
  })

  describe('Sudoku Hints', () => {
    const sudokuGrid = [
      [1, null, 3, null],
      [null, 4, null, 2],
      [2, null, 4, null],
      [null, 3, null, 1]
    ]

    it('provides basic hint for empty cell', () => {
      const hint = hintService.getHint('sudoku', {
        grid: sudokuGrid,
        row: 0,
        col: 1,
        level: 'basic'
      })

      expect(hint).toBeDefined()
      expect(hint?.type).toBe('possibleValues')
      expect(hint?.possibleValues).toContain(2)
      expect(hint?.message).toContain('possible value')
    })

    it('provides intermediate hint with elimination logic', () => {
      const hint = hintService.getHint('sudoku', {
        grid: sudokuGrid,
        row: 0,
        col: 1,
        level: 'intermediate'
      })

      expect(hint).toBeDefined()
      expect(hint?.type).toBe('elimination')
      expect(hint?.eliminatedValues).toBeDefined()
      expect(hint?.reason).toContain('row')
    })

    it('provides advanced hint with solving technique', () => {
      const hint = hintService.getHint('sudoku', {
        grid: sudokuGrid,
        row: 0,
        col: 1,
        level: 'advanced'
      })

      expect(hint).toBeDefined()
      expect(hint?.type).toBe('technique')
      expect(hint?.technique).toBeDefined()
      expect(hint?.steps).toBeInstanceOf(Array)
    })

    it('returns null for filled cells', () => {
      const hint = hintService.getHint('sudoku', {
        grid: sudokuGrid,
        row: 0,
        col: 0,
        level: 'basic'
      })

      expect(hint).toBeNull()
    })
  })

  describe('Pattern Matching Hints', () => {
    const pattern = [2, 4, 6, 8, null, null]

    it('provides next value hint for numeric pattern', () => {
      const hint = hintService.getHint('pattern', {
        pattern,
        index: 4,
        level: 'basic'
      })

      expect(hint).toBeDefined()
      expect(hint?.type).toBe('nextValue')
      expect(hint?.value).toBe(10)
      expect(hint?.message).toContain('pattern')
    })

    it('provides pattern rule hint for intermediate level', () => {
      const hint = hintService.getHint('pattern', {
        pattern,
        index: 4,
        level: 'intermediate'
      })

      expect(hint).toBeDefined()
      expect(hint?.type).toBe('rule')
      expect(hint?.rule).toContain('+2')
      expect(hint?.explanation).toBeDefined()
    })

    it('provides complete sequence hint for advanced level', () => {
      const hint = hintService.getHint('pattern', {
        pattern,
        index: 4,
        level: 'advanced'
      })

      expect(hint).toBeDefined()
      expect(hint?.type).toBe('sequence')
      expect(hint?.fullSequence).toEqual([2, 4, 6, 8, 10, 12])
      expect(hint?.formula).toBeDefined()
    })
  })

  describe('Spatial Puzzle Hints', () => {
    const gridState = {
      grid: Array(8).fill(null).map(() => Array(8).fill(null)),
      shapes: [
        { id: 'L', blocks: [{x: 0, y: 0}, {x: 0, y: 1}, {x: 1, y: 1}] },
        { id: 'T', blocks: [{x: 0, y: 0}, {x: 1, y: 0}, {x: 2, y: 0}, {x: 1, y: 1}] }
      ],
      placedShapes: []
    }

    it('provides placement suggestion for basic level', () => {
      const hint = hintService.getHint('spatial', {
        state: gridState,
        shapeId: 'L',
        level: 'basic'
      })

      expect(hint).toBeDefined()
      expect(hint?.type).toBe('placement')
      expect(hint?.position).toHaveProperty('x')
      expect(hint?.position).toHaveProperty('y')
      expect(hint?.message).toContain('Try placing')
    })

    it('provides rotation hint for intermediate level', () => {
      const hint = hintService.getHint('spatial', {
        state: gridState,
        shapeId: 'T',
        level: 'intermediate'
      })

      expect(hint).toBeDefined()
      expect(hint?.type).toBe('rotation')
      expect(hint?.rotation).toBeGreaterThanOrEqual(0)
      expect(hint?.rotation).toBeLessThanOrEqual(270)
      expect(hint?.visualGuide).toBeDefined()
    })

    it('provides strategy hint for advanced level', () => {
      const hint = hintService.getHint('spatial', {
        state: gridState,
        level: 'advanced'
      })

      expect(hint).toBeDefined()
      expect(hint?.type).toBe('strategy')
      expect(hint?.strategy).toBeDefined()
      expect(hint?.steps).toBeInstanceOf(Array)
    })
  })

  describe('Progressive Hint System', () => {
    it('tracks hint usage per puzzle', () => {
      const puzzleId = 'test-puzzle-123'
      
      hintService.trackHintUsage(puzzleId, 'basic')
      hintService.trackHintUsage(puzzleId, 'basic')
      hintService.trackHintUsage(puzzleId, 'intermediate')

      const usage = hintService.getHintUsage(puzzleId)
      expect(usage.basic).toBe(2)
      expect(usage.intermediate).toBe(1)
      expect(usage.advanced).toBe(0)
      expect(usage.total).toBe(3)
    })

    it('progressively reveals more detailed hints', () => {
      const puzzleId = 'test-puzzle-123'
      const sudokuGrid = [
        [1, null, 3, null],
        [null, 4, null, 2],
        [2, null, 4, null],
        [null, 3, null, 1]
      ]

      // First hint - basic
      const hint1 = hintService.getProgressiveHint(puzzleId, 'sudoku', {
        grid: sudokuGrid,
        row: 0,
        col: 1
      })
      expect(hint1?.level).toBe('basic')

      // Second hint for same cell - intermediate
      const hint2 = hintService.getProgressiveHint(puzzleId, 'sudoku', {
        grid: sudokuGrid,
        row: 0,
        col: 1
      })
      expect(hint2?.level).toBe('intermediate')

      // Third hint for same cell - advanced
      const hint3 = hintService.getProgressiveHint(puzzleId, 'sudoku', {
        grid: sudokuGrid,
        row: 0,
        col: 1
      })
      expect(hint3?.level).toBe('advanced')
    })

    it('calculates hint penalty based on usage', () => {
      const puzzleId = 'test-puzzle-123'
      
      expect(hintService.calculateHintPenalty(puzzleId)).toBe(0)
      
      hintService.trackHintUsage(puzzleId, 'basic')
      expect(hintService.calculateHintPenalty(puzzleId)).toBe(10)
      
      hintService.trackHintUsage(puzzleId, 'intermediate')
      expect(hintService.calculateHintPenalty(puzzleId)).toBe(30)
      
      hintService.trackHintUsage(puzzleId, 'advanced')
      expect(hintService.calculateHintPenalty(puzzleId)).toBe(60)
    })

    it('respects hint cooldown period', () => {
      vi.useFakeTimers()
      const puzzleId = 'test-puzzle-123'
      
      hintService.trackHintUsage(puzzleId, 'basic')
      
      // Immediate request should be blocked
      expect(hintService.canRequestHint(puzzleId)).toBe(false)
      
      // After cooldown, should be allowed
      vi.advanceTimersByTime(31000) // 31 seconds
      expect(hintService.canRequestHint(puzzleId)).toBe(true)
      
      vi.useRealTimers()
    })
  })

  describe('Hint Formatting', () => {
    it('formats hints with visual components', () => {
      const hint: PuzzleHint = {
        type: 'possibleValues',
        possibleValues: [2, 4],
        message: 'Possible values for this cell',
        level: 'basic'
      }

      const formatted = hintService.formatHint(hint)
      
      expect(formatted).toHaveProperty('title')
      expect(formatted).toHaveProperty('content')
      expect(formatted).toHaveProperty('visual')
      expect(formatted.visual).toContain('2, 4')
    })

    it('includes step-by-step guide for advanced hints', () => {
      const hint: PuzzleHint = {
        type: 'technique',
        technique: 'Hidden Single',
        steps: [
          'Look at row 1',
          'Check which numbers are missing',
          'Find where 2 can go'
        ],
        level: 'advanced'
      }

      const formatted = hintService.formatHint(hint)
      
      expect(formatted.steps).toBeDefined()
      expect(formatted.steps).toHaveLength(3)
      expect(formatted.interactive).toBe(true)
    })
  })

  describe('Hint Storage', () => {
    it('saves hint history to localStorage', () => {
      const puzzleId = 'test-puzzle-123'
      
      hintService.trackHintUsage(puzzleId, 'basic')
      hintService.saveHintHistory()
      
      const saved = localStorage.getItem('puzzlator_hint_history')
      expect(saved).toBeTruthy()
      
      const parsed = JSON.parse(saved!)
      expect(parsed[puzzleId]).toBeDefined()
    })

    it('loads hint history from localStorage', () => {
      const history = {
        'puzzle-1': { basic: 1, intermediate: 2, advanced: 0 },
        'puzzle-2': { basic: 0, intermediate: 1, advanced: 1 }
      }
      
      localStorage.setItem('puzzlator_hint_history', JSON.stringify(history))
      
      const newService = new HintService()
      expect(newService.getHintUsage('puzzle-1').intermediate).toBe(2)
      expect(newService.getHintUsage('puzzle-2').advanced).toBe(1)
    })
  })
})