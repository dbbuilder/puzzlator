import { describe, it, expect, beforeEach } from 'vitest'
import { Sudoku4x4 } from './Sudoku4x4'
import type { PuzzleState, PuzzleMove } from '../../types/puzzle'

describe('Sudoku4x4', () => {
  let sudoku: Sudoku4x4

  beforeEach(() => {
    sudoku = new Sudoku4x4()
  })

  describe('initialization', () => {
    it('should create a 4x4 grid', () => {
      const state = sudoku.getState()
      expect(state.grid).toHaveLength(4)
      state.grid.forEach(row => {
        expect(row).toHaveLength(4)
      })
    })

    it('should initialize with a valid puzzle configuration', () => {
      const state = sudoku.getState()
      expect(state.id).toBeDefined()
      expect(state.type).toBe('sudoku4x4')
      expect(state.difficulty).toBeDefined()
      expect(state.status).toBe('in_progress')
    })

    it('should have some cells pre-filled as clues', () => {
      const state = sudoku.getState()
      const filledCells = state.grid.flat().filter(cell => cell.value !== null)
      expect(filledCells.length).toBeGreaterThan(0)
      expect(filledCells.length).toBeLessThan(16) // Not all cells should be filled
      
      // All clue cells should be locked
      filledCells.forEach(cell => {
        expect(cell.locked).toBe(true)
      })
    })

    it('should generate a solvable puzzle', () => {
      expect(sudoku.isSolvable()).toBe(true)
    })
  })

  describe('gameplay', () => {
    it('should allow placing valid numbers in empty cells', () => {
      const state = sudoku.getState()
      const emptyCell = state.grid.flat().find(cell => cell.value === null)
      
      if (emptyCell) {
        const move: PuzzleMove = {
          row: emptyCell.row,
          col: emptyCell.col,
          value: 1
        }
        
        const result = sudoku.makeMove(move)
        expect(result.success).toBe(true)
        
        const newState = sudoku.getState()
        expect(newState.grid[emptyCell.row][emptyCell.col].value).toBe(1)
      }
    })

    it('should not allow placing numbers in locked cells', () => {
      const state = sudoku.getState()
      const lockedCell = state.grid.flat().find(cell => cell.locked)
      
      if (lockedCell) {
        const move: PuzzleMove = {
          row: lockedCell.row,
          col: lockedCell.col,
          value: 2
        }
        
        const result = sudoku.makeMove(move)
        expect(result.success).toBe(false)
        expect(result.error).toContain('locked')
      }
    })

    it('should validate row constraints', () => {
      // Create a puzzle with a known configuration
      const testGrid = [
        [1, 2, null, null],
        [null, null, null, null],
        [null, null, null, null],
        [null, null, null, null]
      ]
      sudoku.loadPuzzle(testGrid)
      
      // Try to place 1 in the same row - should fail
      const invalidMove: PuzzleMove = { row: 0, col: 2, value: 1 }
      const result = sudoku.makeMove(invalidMove)
      expect(result.success).toBe(false)
      expect(result.error).toContain('row')
      
      // Try to place 3 in the same row - should succeed
      const validMove: PuzzleMove = { row: 0, col: 2, value: 3 }
      const result2 = sudoku.makeMove(validMove)
      expect(result2.success).toBe(true)
    })

    it('should validate column constraints', () => {
      const testGrid = [
        [1, null, null, null],
        [2, null, null, null],
        [null, null, null, null],
        [null, null, null, null]
      ]
      sudoku.loadPuzzle(testGrid)
      
      // Try to place 1 in the same column - should fail
      const invalidMove: PuzzleMove = { row: 2, col: 0, value: 1 }
      const result = sudoku.makeMove(invalidMove)
      expect(result.success).toBe(false)
      expect(result.error).toContain('column')
    })

    it('should validate 2x2 box constraints', () => {
      const testGrid = [
        [1, 2, null, null],
        [3, null, null, null],
        [null, null, null, null],
        [null, null, null, null]
      ]
      sudoku.loadPuzzle(testGrid)
      
      // Try to place 1 in the same 2x2 box - should fail
      const invalidMove: PuzzleMove = { row: 1, col: 1, value: 1 }
      const result = sudoku.makeMove(invalidMove)
      expect(result.success).toBe(false)
      expect(result.error).toContain('box')
    })

    it('should allow clearing a cell', () => {
      const state = sudoku.getState()
      const emptyCell = state.grid.flat().find(cell => cell.value === null)
      
      if (emptyCell) {
        // First place a value
        sudoku.makeMove({ row: emptyCell.row, col: emptyCell.col, value: 1 })
        
        // Then clear it
        const clearMove: PuzzleMove = {
          row: emptyCell.row,
          col: emptyCell.col,
          value: null
        }
        const result = sudoku.makeMove(clearMove)
        expect(result.success).toBe(true)
        
        const newState = sudoku.getState()
        expect(newState.grid[emptyCell.row][emptyCell.col].value).toBe(null)
      }
    })
  })

  describe('hints', () => {
    it('should provide hints for empty cells', () => {
      const state = sudoku.getState()
      const emptyCell = state.grid.flat().find(cell => cell.value === null)
      
      if (emptyCell) {
        const hint = sudoku.getHint(emptyCell.row, emptyCell.col)
        expect(hint).toBeDefined()
        expect(hint.possibleValues).toBeInstanceOf(Array)
        expect(hint.possibleValues.length).toBeGreaterThan(0)
        expect(hint.possibleValues.length).toBeLessThanOrEqual(4)
        
        // All hint values should be valid moves
        hint.possibleValues.forEach(value => {
          const testSudoku = new Sudoku4x4()
          testSudoku.loadPuzzle(sudoku.getState().grid.map(row => 
            row.map(cell => cell.value)
          ))
          const result = testSudoku.makeMove({
            row: emptyCell.row,
            col: emptyCell.col,
            value
          })
          expect(result.success).toBe(true)
        })
      }
    })

    it('should not provide hints for locked cells', () => {
      const state = sudoku.getState()
      const lockedCell = state.grid.flat().find(cell => cell.locked)
      
      if (lockedCell) {
        const hint = sudoku.getHint(lockedCell.row, lockedCell.col)
        expect(hint).toBeNull()
      }
    })
  })

  describe('completion', () => {
    it('should detect when puzzle is completed successfully', () => {
      // Create a nearly complete puzzle
      const testGrid = [
        [1, 2, 3, 4],
        [3, 4, 1, 2],
        [2, 1, 4, null],
        [4, 3, 2, 1]
      ]
      sudoku.loadPuzzle(testGrid)
      
      expect(sudoku.isComplete()).toBe(false)
      
      // Make the final move
      sudoku.makeMove({ row: 2, col: 3, value: 3 })
      
      expect(sudoku.isComplete()).toBe(true)
      expect(sudoku.getState().status).toBe('completed')
    })

    it('should calculate score based on time and hints used', () => {
      // Simulate a game with some time elapsed and hints used
      sudoku.startTimer()
      
      // Use some hints
      sudoku.useHint()
      sudoku.useHint()
      
      // Complete the puzzle (in a real scenario)
      const score = sudoku.calculateScore({
        timeElapsed: 120, // 2 minutes
        hintsUsed: 2,
        difficulty: 'easy'
      })
      
      expect(score).toBeGreaterThan(0)
      expect(score).toBeLessThan(1000) // Max score should be reasonable
    })
  })

  describe('undo/redo', () => {
    it('should support undoing moves', () => {
      const state = sudoku.getState()
      const emptyCell = state.grid.flat().find(cell => cell.value === null)
      
      if (emptyCell) {
        // Make a move
        sudoku.makeMove({ row: emptyCell.row, col: emptyCell.col, value: 1 })
        expect(sudoku.getState().grid[emptyCell.row][emptyCell.col].value).toBe(1)
        
        // Undo the move
        const undoResult = sudoku.undo()
        expect(undoResult).toBe(true)
        expect(sudoku.getState().grid[emptyCell.row][emptyCell.col].value).toBe(null)
      }
    })

    it('should support redoing moves', () => {
      const state = sudoku.getState()
      const emptyCell = state.grid.flat().find(cell => cell.value === null)
      
      if (emptyCell) {
        // Make a move, undo it, then redo it
        sudoku.makeMove({ row: emptyCell.row, col: emptyCell.col, value: 1 })
        sudoku.undo()
        
        const redoResult = sudoku.redo()
        expect(redoResult).toBe(true)
        expect(sudoku.getState().grid[emptyCell.row][emptyCell.col].value).toBe(1)
      }
    })
  })

  describe('serialization', () => {
    it('should serialize and deserialize puzzle state', () => {
      // Make some moves
      const state = sudoku.getState()
      const emptyCell = state.grid.flat().find(cell => cell.value === null)
      
      if (emptyCell) {
        sudoku.makeMove({ row: emptyCell.row, col: emptyCell.col, value: 1 })
      }
      
      // Serialize
      const serialized = sudoku.serialize()
      expect(serialized).toBeTypeOf('string')
      
      // Create new puzzle and deserialize
      const newSudoku = new Sudoku4x4()
      newSudoku.deserialize(serialized)
      
      // States should match
      expect(newSudoku.getState()).toEqual(sudoku.getState())
    })
  })
})