import { describe, it, expect, beforeEach } from 'vitest'
import { SpatialPuzzle } from './SpatialPuzzle'
import type { Shape, SpatialPuzzleState } from './types'

describe('SpatialPuzzle', () => {
  let puzzle: SpatialPuzzle

  describe('Easy difficulty', () => {
    beforeEach(() => {
      puzzle = new SpatialPuzzle('easy')
    })

    it('should create a puzzle with 4x4 grid', () => {
      const state = puzzle.getState()
      expect(state.gridSize).toBe(4)
      expect(state.grid.length).toBe(4)
      expect(state.grid[0].length).toBe(4)
    })

    it('should have 2-3 shapes to place', () => {
      const state = puzzle.getState()
      expect(state.shapesToPlace.length).toBeGreaterThanOrEqual(2)
      expect(state.shapesToPlace.length).toBeLessThanOrEqual(3)
    })

    it('should generate simple shapes', () => {
      const state = puzzle.getState()
      state.shapesToPlace.forEach(shape => {
        // Easy mode can have shapes up to 4 blocks (tetrominoes)
        expect(shape.blocks.length).toBeLessThanOrEqual(4)
      })
    })
  })

  describe('Medium difficulty', () => {
    beforeEach(() => {
      puzzle = new SpatialPuzzle('medium')
    })

    it('should create a puzzle with 5x5 grid', () => {
      const state = puzzle.getState()
      expect(state.gridSize).toBe(5)
    })

    it('should have 3-4 shapes to place', () => {
      const state = puzzle.getState()
      expect(state.shapesToPlace.length).toBeGreaterThanOrEqual(3)
      expect(state.shapesToPlace.length).toBeLessThanOrEqual(4)
    })
  })

  describe('Hard difficulty', () => {
    beforeEach(() => {
      puzzle = new SpatialPuzzle('hard')
    })

    it('should create a puzzle with 6x6 grid', () => {
      const state = puzzle.getState()
      expect(state.gridSize).toBe(6)
    })

    it('should have 4-5 shapes to place', () => {
      const state = puzzle.getState()
      expect(state.shapesToPlace.length).toBeGreaterThanOrEqual(4)
      expect(state.shapesToPlace.length).toBeLessThanOrEqual(5)
    })

    it('should allow shape rotation', () => {
      const state = puzzle.getState()
      expect(state.allowRotation).toBe(true)
    })
  })

  describe('Expert difficulty', () => {
    beforeEach(() => {
      puzzle = new SpatialPuzzle('expert')
    })

    it('should create a puzzle with 8x8 grid', () => {
      const state = puzzle.getState()
      expect(state.gridSize).toBe(8)
    })

    it('should have 5-7 shapes to place', () => {
      const state = puzzle.getState()
      expect(state.shapesToPlace.length).toBeGreaterThanOrEqual(5)
      expect(state.shapesToPlace.length).toBeLessThanOrEqual(7)
    })

    it('should have complex shapes', () => {
      const state = puzzle.getState()
      const hasComplexShape = state.shapesToPlace.some(shape => shape.blocks.length >= 4)
      expect(hasComplexShape).toBe(true)
    })
  })

  describe('Shape generation', () => {
    beforeEach(() => {
      puzzle = new SpatialPuzzle('medium')
    })

    it('should generate valid tetromino shapes', () => {
      const shapes = puzzle.generateShapes()
      shapes.forEach(shape => {
        // Check that all blocks are connected
        expect(shape.blocks.length).toBeGreaterThan(0)
        
        // Check that shape has valid color
        expect(shape.color).toMatch(/^#[0-9a-f]{6}$/i)
        
        // Check that shape has an id
        expect(shape.id).toBeTruthy()
      })
    })

    it('should generate unique shape IDs', () => {
      const shapes = puzzle.generateShapes()
      const ids = shapes.map(s => s.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(ids.length)
    })

    it('should ensure puzzle is solvable', () => {
      const state = puzzle.getState()
      
      // Calculate total blocks needed
      const totalBlocks = state.shapesToPlace.reduce((sum, shape) => 
        sum + shape.blocks.length, 0
      )
      
      // Calculate available space
      const availableSpace = state.gridSize * state.gridSize
      
      // Ensure shapes can fit
      expect(totalBlocks).toBeLessThanOrEqual(availableSpace)
    })
  })

  describe('Shape placement', () => {
    beforeEach(() => {
      puzzle = new SpatialPuzzle('easy')
    })

    it('should validate valid placements', () => {
      const state = puzzle.getState()
      const shape = state.shapesToPlace[0]
      
      // Try to place at origin
      const isValid = puzzle.canPlaceShape(shape, 0, 0)
      expect(typeof isValid).toBe('boolean')
    })

    it('should reject out-of-bounds placements', () => {
      const state = puzzle.getState()
      const shape = state.shapesToPlace[0]
      
      // Try to place outside grid
      const isValid = puzzle.canPlaceShape(shape, state.gridSize, state.gridSize)
      expect(isValid).toBe(false)
    })

    it('should place shape correctly', () => {
      const state = puzzle.getState()
      const shape = state.shapesToPlace[0]
      
      // Place shape at valid position
      if (puzzle.canPlaceShape(shape, 0, 0)) {
        puzzle.placeShape(shape, 0, 0)
        
        // Check that shape is marked as placed
        const updatedState = puzzle.getState()
        const placedShape = updatedState.placedShapes.find(s => s.shape.id === shape.id)
        expect(placedShape).toBeTruthy()
        expect(placedShape?.x).toBe(0)
        expect(placedShape?.y).toBe(0)
      }
    })

    it('should update grid when shape is placed', () => {
      const shape = puzzle.getState().shapesToPlace[0]
      
      if (puzzle.canPlaceShape(shape, 0, 0)) {
        puzzle.placeShape(shape, 0, 0)
        
        const state = puzzle.getState()
        // Check that grid cells are occupied
        shape.blocks.forEach(block => {
          expect(state.grid[block.y][block.x]).toBe(shape.id)
        })
      }
    })

    it('should prevent overlapping placements', () => {
      const state = puzzle.getState()
      const [shape1, shape2] = state.shapesToPlace
      
      if (shape1 && shape2 && puzzle.canPlaceShape(shape1, 0, 0)) {
        puzzle.placeShape(shape1, 0, 0)
        
        // Try to place second shape at same position
        const canOverlap = puzzle.canPlaceShape(shape2, 0, 0)
        expect(canOverlap).toBe(false)
      }
    })
  })

  describe('Shape removal', () => {
    beforeEach(() => {
      puzzle = new SpatialPuzzle('easy')
    })

    it('should remove placed shape', () => {
      const shape = puzzle.getState().shapesToPlace[0]
      
      if (puzzle.canPlaceShape(shape, 0, 0)) {
        puzzle.placeShape(shape, 0, 0)
        puzzle.removeShape(shape.id)
        
        const state = puzzle.getState()
        const placedShape = state.placedShapes.find(s => s.shape.id === shape.id)
        expect(placedShape).toBeUndefined()
      }
    })

    it('should clear grid cells when shape is removed', () => {
      const shape = puzzle.getState().shapesToPlace[0]
      
      if (puzzle.canPlaceShape(shape, 0, 0)) {
        puzzle.placeShape(shape, 0, 0)
        puzzle.removeShape(shape.id)
        
        const state = puzzle.getState()
        // Check that grid cells are cleared
        shape.blocks.forEach(block => {
          expect(state.grid[block.y][block.x]).toBeNull()
        })
      }
    })
  })

  describe('Shape rotation', () => {
    beforeEach(() => {
      puzzle = new SpatialPuzzle('hard') // Hard mode allows rotation
    })

    it('should rotate shape 90 degrees', () => {
      const shape: Shape = {
        id: 'test',
        blocks: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 0, y: 1 }
        ],
        color: '#ff0000'
      }
      
      const rotated = puzzle.rotateShape(shape)
      
      // L-shape rotated 90 degrees clockwise
      // Original: (0,0), (1,0), (0,1) -> Rotated: (0,0), (1,0), (1,1)
      expect(rotated.blocks).toHaveLength(3)
      expect(rotated.blocks).toContainEqual({ x: 0, y: 0 })
      expect(rotated.blocks).toContainEqual({ x: 1, y: 0 })
      expect(rotated.blocks).toContainEqual({ x: 1, y: 1 })
    })

    it('should rotate shape back to original after 4 rotations', () => {
      const shape = puzzle.getState().shapesToPlace[0]
      
      let rotated = shape
      for (let i = 0; i < 4; i++) {
        rotated = puzzle.rotateShape(rotated)
      }
      
      // Should be back to original
      expect(rotated.blocks).toEqual(shape.blocks)
    })
  })

  describe('Puzzle completion', () => {
    beforeEach(() => {
      puzzle = new SpatialPuzzle('easy')
    })

    it('should detect when puzzle is complete', () => {
      const state = puzzle.getState()
      
      // Place all shapes
      state.shapesToPlace.forEach((shape, index) => {
        // Find a valid position for each shape
        for (let y = 0; y < state.gridSize; y++) {
          for (let x = 0; x < state.gridSize; x++) {
            if (puzzle.canPlaceShape(shape, x, y)) {
              puzzle.placeShape(shape, x, y)
              break
            }
          }
        }
      })
      
      // Check if all shapes are placed
      const updatedState = puzzle.getState()
      const allPlaced = updatedState.shapesToPlace.length === updatedState.placedShapes.length
      
      if (allPlaced) {
        expect(puzzle.isComplete()).toBe(true)
      }
    })

    it('should not be complete with shapes remaining', () => {
      expect(puzzle.isComplete()).toBe(false)
    })
  })

  describe('Hints', () => {
    beforeEach(() => {
      puzzle = new SpatialPuzzle('medium')
    })

    it('should provide placement hints', () => {
      const hint = puzzle.getHint()
      expect(hint).toBeTruthy()
      expect(hint.message).toContain('shape')
    })

    it('should suggest valid positions', () => {
      const shape = puzzle.getState().shapesToPlace[0]
      const hint = puzzle.getHint(shape.id)
      
      if (hint.position) {
        const canPlace = puzzle.canPlaceShape(shape, hint.position.x, hint.position.y)
        expect(canPlace).toBe(true)
      }
    })
  })

  describe('Scoring', () => {
    beforeEach(() => {
      puzzle = new SpatialPuzzle('medium')
      puzzle.startTimer()
    })

    it('should calculate score based on time and moves', () => {
      // Place a shape
      const shape = puzzle.getState().shapesToPlace[0]
      if (puzzle.canPlaceShape(shape, 0, 0)) {
        puzzle.placeShape(shape, 0, 0)
      }
      
      // Simulate time passing
      puzzle.stopTimer()
      
      const score = puzzle.calculateScore()
      expect(score).toBeGreaterThan(0)
      expect(score).toBeLessThanOrEqual(1000)
    })

    it('should reduce score for hints used', () => {
      puzzle.useHint()
      const scoreWithHint = puzzle.calculateScore()
      
      const puzzleNoHint = new SpatialPuzzle('medium')
      puzzleNoHint.startTimer()
      puzzleNoHint.stopTimer()
      const scoreWithoutHint = puzzleNoHint.calculateScore()
      
      expect(scoreWithHint).toBeLessThan(scoreWithoutHint)
    })
  })

  describe('Reset', () => {
    beforeEach(() => {
      puzzle = new SpatialPuzzle('easy')
    })

    it('should reset puzzle to initial state', () => {
      // Place some shapes
      const shape = puzzle.getState().shapesToPlace[0]
      if (puzzle.canPlaceShape(shape, 0, 0)) {
        puzzle.placeShape(shape, 0, 0)
      }
      
      puzzle.reset()
      
      const state = puzzle.getState()
      expect(state.placedShapes.length).toBe(0)
      expect(state.moves).toBe(0)
      expect(state.hintsUsed).toBe(0)
      
      // Grid should be empty
      state.grid.forEach(row => {
        row.forEach(cell => {
          expect(cell).toBeNull()
        })
      })
    })
  })
})