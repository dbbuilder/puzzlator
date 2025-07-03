import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Sudoku4x4Scene } from './Sudoku4x4Scene'
import { Sudoku4x4 } from '../../puzzles/sudoku/Sudoku4x4'
import type { PuzzleMove } from '../../types/puzzle'

// Mock Phaser
vi.mock('phaser', () => ({
  Scene: class Scene {
    add = {
      graphics: vi.fn(() => ({
        fillStyle: vi.fn(),
        fillRect: vi.fn(),
        strokeRect: vi.fn(),
        lineStyle: vi.fn(),
        clear: vi.fn()
      })),
      text: vi.fn(() => ({
        setOrigin: vi.fn(),
        setInteractive: vi.fn(),
        setFontSize: vi.fn(),
        setColor: vi.fn(),
        setText: vi.fn(),
        destroy: vi.fn(),
        x: 0,
        y: 0
      })),
      rectangle: vi.fn(() => ({
        setInteractive: vi.fn(),
        setFillStyle: vi.fn(),
        setStrokeStyle: vi.fn(),
        destroy: vi.fn()
      }))
    }
    input = {
      on: vi.fn(),
      off: vi.fn()
    }
    scale = {
      width: 800,
      height: 600
    }
    events = {
      emit: vi.fn(),
      on: vi.fn(),
      off: vi.fn()
    }
  },
  AUTO: 'AUTO'
}))

describe('Sudoku4x4Scene', () => {
  let scene: Sudoku4x4Scene
  let puzzle: Sudoku4x4

  beforeEach(() => {
    puzzle = new Sudoku4x4()
    scene = new Sudoku4x4Scene(puzzle)
  })

  describe('initialization', () => {
    it('should create scene with correct key', () => {
      expect(scene.key).toBe('Sudoku4x4Scene')
    })

    it('should store puzzle reference', () => {
      expect(scene.getPuzzle()).toBe(puzzle)
    })

    it('should have default configuration', () => {
      const config = scene.getConfig()
      expect(config.gridSize).toBe(4)
      expect(config.cellSize).toBeGreaterThan(0)
      expect(config.gridPadding).toBeGreaterThan(0)
      expect(config.colors).toBeDefined()
      expect(config.colors.background).toBeDefined()
      expect(config.colors.grid).toBeDefined()
      expect(config.colors.cell).toBeDefined()
    })
  })

  describe('rendering', () => {
    it('should create grid graphics on scene creation', () => {
      scene.create()
      
      expect(scene.add.graphics).toHaveBeenCalled()
      expect(scene.getGridGraphics()).toBeDefined()
    })

    it('should draw 4x4 grid with proper dimensions', () => {
      scene.create()
      const graphics = scene.getGridGraphics()
      
      // Should draw grid lines (5 vertical + 5 horizontal = 10 lines)
      expect(graphics.strokeRect).toHaveBeenCalledTimes(16) // 16 cells
      expect(graphics.lineStyle).toHaveBeenCalled()
    })

    it('should render puzzle numbers in correct positions', () => {
      scene.create()
      const state = puzzle.getState()
      
      // Count non-null cells
      const filledCells = state.grid.flat().filter(cell => cell.value !== null)
      
      // Should create text objects for each filled cell
      expect(scene.add.text).toHaveBeenCalledTimes(filledCells.length)
    })

    it('should apply different styles for locked and unlocked cells', () => {
      scene.create()
      const cellTexts = scene.getCellTexts()
      
      // Verify different colors are used
      const lockedCells = cellTexts.filter(text => text.locked)
      const unlockedCells = cellTexts.filter(text => !text.locked)
      
      expect(lockedCells.length).toBeGreaterThan(0)
      expect(unlockedCells.length).toBe(0) // Initially only locked cells have text
    })

    it('should highlight cells on hover', () => {
      scene.create()
      const cell = { row: 0, col: 0 }
      
      scene.highlightCell(cell.row, cell.col)
      
      const highlight = scene.getCellHighlight(cell.row, cell.col)
      expect(highlight).toBeDefined()
      expect(highlight.visible).toBe(true)
    })

    it('should show error state for invalid cells', () => {
      scene.create()
      const cell = { row: 0, col: 0 }
      
      scene.showCellError(cell.row, cell.col)
      
      const errorHighlight = scene.getCellError(cell.row, cell.col)
      expect(errorHighlight).toBeDefined()
      expect(errorHighlight.fillColor).toBe(scene.getConfig().colors.error)
    })
  })

  describe('interaction', () => {
    it('should handle cell clicks', () => {
      scene.create()
      const clickHandler = vi.fn()
      scene.onCellClick(clickHandler)
      
      // Simulate click on cell (1, 1)
      const cellRect = scene.getCellRectangle(1, 1)
      cellRect.emit('pointerdown')
      
      expect(clickHandler).toHaveBeenCalledWith({ row: 1, col: 1 })
    })

    it('should show number input panel on cell selection', () => {
      scene.create()
      scene.selectCell(1, 1)
      
      const inputPanel = scene.getNumberInputPanel()
      expect(inputPanel).toBeDefined()
      expect(inputPanel.visible).toBe(true)
      expect(inputPanel.buttons).toHaveLength(5) // Numbers 1-4 + clear button
    })

    it('should handle number input', () => {
      scene.create()
      scene.selectCell(0, 0)
      
      const moveHandler = vi.fn()
      scene.onMove(moveHandler)
      
      // Click number 2
      scene.inputNumber(2)
      
      expect(moveHandler).toHaveBeenCalledWith({
        row: 0,
        col: 0,
        value: 2
      })
    })

    it('should handle clear/delete input', () => {
      scene.create()
      scene.selectCell(1, 1)
      
      const moveHandler = vi.fn()
      scene.onMove(moveHandler)
      
      // Click clear button
      scene.clearCell()
      
      expect(moveHandler).toHaveBeenCalledWith({
        row: 1,
        col: 1,
        value: null
      })
    })

    it('should not allow interaction with locked cells', () => {
      scene.create()
      const state = puzzle.getState()
      const lockedCell = state.grid.flat().find(cell => cell.locked)
      
      if (lockedCell) {
        const moveHandler = vi.fn()
        scene.onMove(moveHandler)
        
        scene.selectCell(lockedCell.row, lockedCell.col)
        scene.inputNumber(1)
        
        expect(moveHandler).not.toHaveBeenCalled()
      }
    })
  })

  describe('animations', () => {
    it('should animate number placement', async () => {
      scene.create()
      
      const animation = scene.animateNumberPlacement(1, 1, 3)
      
      expect(animation).toBeDefined()
      expect(animation.duration).toBeGreaterThan(0)
      
      await animation.complete()
      
      const cellText = scene.getCellText(1, 1)
      expect(cellText.text).toBe('3')
    })

    it('should animate invalid move feedback', async () => {
      scene.create()
      
      const animation = scene.animateInvalidMove(2, 2)
      
      expect(animation).toBeDefined()
      expect(animation.type).toBe('shake')
      
      await animation.complete()
      
      // Cell should return to normal state
      const errorHighlight = scene.getCellError(2, 2)
      expect(errorHighlight.visible).toBe(false)
    })

    it('should animate puzzle completion', async () => {
      scene.create()
      
      const animation = scene.animateCompletion()
      
      expect(animation).toBeDefined()
      expect(animation.type).toBe('celebration')
      
      await animation.complete()
      
      expect(scene.events.emit).toHaveBeenCalledWith('puzzle:completed')
    })
  })

  describe('responsive design', () => {
    it('should scale grid to fit screen', () => {
      scene.scale.width = 400
      scene.scale.height = 600
      
      scene.create()
      
      const config = scene.getConfig()
      expect(config.cellSize).toBeLessThanOrEqual(80) // Should fit in 400px width
    })

    it('should center grid on screen', () => {
      scene.create()
      
      const gridBounds = scene.getGridBounds()
      const centerX = scene.scale.width / 2
      const centerY = scene.scale.height / 2
      
      expect(Math.abs(gridBounds.centerX - centerX)).toBeLessThan(1)
      expect(Math.abs(gridBounds.centerY - centerY)).toBeLessThan(100) // Some offset for UI
    })

    it('should resize on screen size change', () => {
      scene.create()
      const originalCellSize = scene.getConfig().cellSize
      
      // Simulate resize
      scene.scale.width = 600
      scene.handleResize()
      
      const newCellSize = scene.getConfig().cellSize
      expect(newCellSize).not.toBe(originalCellSize)
    })
  })

  describe('state synchronization', () => {
    it('should update display when puzzle state changes', () => {
      scene.create()
      
      // Make a move in the puzzle
      const move: PuzzleMove = { row: 0, col: 0, value: 2 }
      puzzle.makeMove(move)
      
      // Update scene
      scene.updateFromPuzzleState()
      
      const cellText = scene.getCellText(0, 0)
      expect(cellText.text).toBe('2')
    })

    it('should clear cell display when value is removed', () => {
      scene.create()
      
      // Add then remove a value
      puzzle.makeMove({ row: 1, col: 1, value: 3 })
      scene.updateFromPuzzleState()
      
      puzzle.makeMove({ row: 1, col: 1, value: null })
      scene.updateFromPuzzleState()
      
      const cellText = scene.getCellText(1, 1)
      expect(cellText).toBeUndefined()
    })

    it('should show completion state', () => {
      scene.create()
      
      // Create a nearly complete puzzle and finish it
      const testGrid = [
        [1, 2, 3, 4],
        [3, 4, 1, 2],
        [2, 1, 4, null],
        [4, 3, 2, 1]
      ]
      puzzle.loadPuzzle(testGrid)
      scene.updateFromPuzzleState()
      
      puzzle.makeMove({ row: 2, col: 3, value: 3 })
      scene.updateFromPuzzleState()
      
      expect(scene.isShowingCompletion()).toBe(true)
    })
  })
})