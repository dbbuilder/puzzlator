import { describe, it, expect, beforeEach } from 'vitest'
import { PatternMatchingPuzzle } from './PatternMatching'
import type { PatternMatchingState, PatternRule } from './types'

describe('PatternMatchingPuzzle', () => {
  let puzzle: PatternMatchingPuzzle

  beforeEach(() => {
    puzzle = new PatternMatchingPuzzle()
  })

  describe('initialization', () => {
    it('should create a puzzle with default difficulty', () => {
      expect(puzzle.difficulty).toBe('medium')
      expect(puzzle.type).toBe('pattern-matching')
      expect(puzzle.id).toBeDefined()
    })

    it('should generate a valid initial pattern', () => {
      const state = puzzle.getState()
      expect(state.pattern).toBeDefined()
      expect(state.pattern.length).toBeGreaterThan(0)
      expect(state.currentIndex).toBe(0)
      expect(state.completed).toBe(false)
    })

    it('should set up pattern rules based on difficulty', () => {
      const easyPuzzle = new PatternMatchingPuzzle('easy')
      const hardPuzzle = new PatternMatchingPuzzle('hard')
      
      expect(easyPuzzle.getState().rules.length).toBeLessThan(
        hardPuzzle.getState().rules.length
      )
    })
  })

  describe('pattern generation', () => {
    it('should generate numeric sequences', () => {
      puzzle.generatePattern('numeric', 'easy')
      const state = puzzle.getState()
      
      expect(state.pattern.every(item => typeof item === 'number')).toBe(true)
      expect(state.hiddenIndices.length).toBeGreaterThan(0)
    })

    it('should generate shape sequences', () => {
      puzzle.generatePattern('shapes', 'medium')
      const state = puzzle.getState()
      
      const validShapes = ['circle', 'square', 'triangle', 'star', 'pentagon', 'hexagon']
      expect(state.pattern.every(item => 
        typeof item === 'string' && validShapes.includes(item)
      )).toBe(true)
    })

    it('should generate color sequences', () => {
      puzzle.generatePattern('colors', 'medium')
      const state = puzzle.getState()
      
      const validColors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange']
      expect(state.pattern.every(item => 
        typeof item === 'string' && validColors.includes(item)
      )).toBe(true)
    })

    it('should generate mixed patterns for hard difficulty', () => {
      puzzle.generatePattern('mixed', 'hard')
      const state = puzzle.getState()
      
      const hasNumbers = state.pattern.some(item => typeof item === 'number')
      const hasStrings = state.pattern.some(item => typeof item === 'string')
      
      expect(hasNumbers || hasStrings).toBe(true)
      expect(state.rules.length).toBeGreaterThan(1)
    })
  })

  describe('pattern rules', () => {
    it('should apply arithmetic progression rule', () => {
      const rule: PatternRule = {
        type: 'arithmetic',
        operation: 'add',
        value: 3
      }
      
      const result = puzzle.applyRule(5, rule)
      expect(result).toBe(8)
    })

    it('should apply geometric progression rule', () => {
      const rule: PatternRule = {
        type: 'geometric',
        operation: 'multiply',
        value: 2
      }
      
      const result = puzzle.applyRule(4, rule)
      expect(result).toBe(8)
    })

    it('should apply fibonacci rule', () => {
      const rule: PatternRule = { type: 'fibonacci' }
      const sequence = [1, 1, 2, 3, 5]
      
      const result = puzzle.applyFibonacciRule(sequence, 4)
      expect(result).toBe(8) // 3 + 5 = 8
    })

    it('should apply alternating rule', () => {
      const rule: PatternRule = {
        type: 'alternating',
        values: [1, 2]
      }
      
      expect(puzzle.applyAlternatingRule(0, rule)).toBe(1)
      expect(puzzle.applyAlternatingRule(1, rule)).toBe(2)
      expect(puzzle.applyAlternatingRule(2, rule)).toBe(1)
    })
  })

  describe('answer validation', () => {
    it('should validate correct numeric answer', () => {
      puzzle.generatePattern('numeric', 'easy')
      const state = puzzle.getState()
      const hiddenIndex = state.hiddenIndices[0]
      const correctAnswer = state.pattern[hiddenIndex]
      
      const isValid = puzzle.validateAnswer(hiddenIndex, correctAnswer)
      expect(isValid).toBe(true)
    })

    it('should reject incorrect answer', () => {
      puzzle.generatePattern('numeric', 'easy')
      const state = puzzle.getState()
      const hiddenIndex = state.hiddenIndices[0]
      const wrongAnswer = state.pattern[hiddenIndex] + 1
      
      const isValid = puzzle.validateAnswer(hiddenIndex, wrongAnswer)
      expect(isValid).toBe(false)
    })

    it('should track attempts and mistakes', () => {
      puzzle.generatePattern('numeric', 'easy')
      const state = puzzle.getState()
      const hiddenIndex = state.hiddenIndices[0]
      
      puzzle.validateAnswer(hiddenIndex, 999) // Wrong answer
      expect(puzzle.getAttempts()).toBe(1)
      expect(puzzle.getMistakes()).toBe(1)
    })

    it('should complete puzzle when all hidden values are found', () => {
      puzzle.generatePattern('numeric', 'easy')
      const state = puzzle.getState()
      
      // Answer all hidden values correctly
      state.hiddenIndices.forEach(index => {
        const correctAnswer = state.pattern[index]
        puzzle.validateAnswer(index, correctAnswer)
      })
      
      expect(puzzle.isComplete()).toBe(true)
      expect(puzzle.getState().completed).toBe(true)
    })
  })

  describe('hints', () => {
    it('should provide hint for pattern type', () => {
      puzzle.generatePattern('arithmetic', 'medium')
      const hint = puzzle.getHint(0)
      
      expect(hint).toBeDefined()
      expect(hint?.type).toBe('pattern-type')
      expect(hint?.message).toContain('arithmetic')
    })

    it('should provide rule hint after failed attempts', () => {
      puzzle.generatePattern('numeric', 'easy')
      const state = puzzle.getState()
      const hiddenIndex = state.hiddenIndices[0]
      
      // Make wrong attempts
      puzzle.validateAnswer(hiddenIndex, 999)
      puzzle.validateAnswer(hiddenIndex, 998)
      
      const hint = puzzle.getHint(hiddenIndex)
      expect(hint?.type).toBe('rule')
      expect(hint?.message).toBeDefined()
    })

    it('should provide specific value hint as last resort', () => {
      puzzle.generatePattern('numeric', 'easy')
      const state = puzzle.getState()
      const hiddenIndex = state.hiddenIndices[0]
      
      // Make many wrong attempts
      for (let i = 0; i < 5; i++) {
        puzzle.validateAnswer(hiddenIndex, 999 + i)
      }
      
      const hint = puzzle.getHint(hiddenIndex)
      expect(hint?.type).toBe('value')
      expect(hint?.possibleValues).toContain(state.pattern[hiddenIndex])
    })
  })

  describe('scoring', () => {
    it('should calculate score based on time and mistakes', () => {
      puzzle.generatePattern('numeric', 'medium')
      puzzle.startTimer()
      
      // Simulate some time passing
      puzzle['timeElapsed'] = 30 // 30 seconds
      
      // Make one mistake
      const state = puzzle.getState()
      puzzle.validateAnswer(state.hiddenIndices[0], 999)
      
      const score = puzzle.calculateScore()
      expect(score).toBeGreaterThan(0)
      expect(score).toBeLessThan(1000) // Max score with mistakes
    })

    it('should give bonus for perfect completion', () => {
      puzzle.generatePattern('numeric', 'easy')
      puzzle.startTimer()
      
      const state = puzzle.getState()
      // Answer all correctly on first try
      state.hiddenIndices.forEach(index => {
        puzzle.validateAnswer(index, state.pattern[index])
      })
      
      const score = puzzle.calculateScore()
      expect(score).toBeGreaterThan(900) // High score for perfect
    })

    it('should scale score by difficulty', () => {
      const easyPuzzle = new PatternMatchingPuzzle('easy')
      const hardPuzzle = new PatternMatchingPuzzle('hard')
      
      easyPuzzle.generatePattern('numeric', 'easy')
      hardPuzzle.generatePattern('numeric', 'hard')
      
      easyPuzzle.startTimer()
      hardPuzzle.startTimer()
      
      // Complete both perfectly
      easyPuzzle.getState().hiddenIndices.forEach(index => {
        easyPuzzle.validateAnswer(index, easyPuzzle.getState().pattern[index])
      })
      
      hardPuzzle.getState().hiddenIndices.forEach(index => {
        hardPuzzle.validateAnswer(index, hardPuzzle.getState().pattern[index])
      })
      
      const easyScore = easyPuzzle.calculateScore()
      const hardScore = hardPuzzle.calculateScore()
      
      expect(hardScore).toBeGreaterThan(easyScore)
    })
  })

  describe('serialization', () => {
    it('should serialize and deserialize state', () => {
      puzzle.generatePattern('shapes', 'medium')
      const originalState = puzzle.getState()
      
      const serialized = puzzle.serialize()
      const newPuzzle = new PatternMatchingPuzzle()
      newPuzzle.deserialize(serialized)
      
      const restoredState = newPuzzle.getState()
      expect(restoredState).toEqual(originalState)
      expect(newPuzzle.difficulty).toBe(puzzle.difficulty)
    })

    it('should preserve game progress on deserialize', () => {
      puzzle.generatePattern('numeric', 'medium')
      puzzle.startTimer()
      
      // Make some progress
      const state = puzzle.getState()
      puzzle.validateAnswer(state.hiddenIndices[0], state.pattern[state.hiddenIndices[0]])
      
      const serialized = puzzle.serialize()
      const newPuzzle = new PatternMatchingPuzzle()
      newPuzzle.deserialize(serialized)
      
      expect(newPuzzle.getAttempts()).toBe(puzzle.getAttempts())
      expect(newPuzzle.getState().revealedIndices).toEqual(puzzle.getState().revealedIndices)
    })
  })
})