import Phaser from 'phaser'
import type { Sudoku4x4 } from '../../puzzles/sudoku/Sudoku4x4'
import type { PuzzleMove } from '../../types/puzzle'
import type {
  SceneConfig,
  GridBounds,
  CellPosition,
  CellRectangle,
  CellText,
  NumberInputPanel,
  NumberButton,
  Animation
} from './types'

/**
 * Phaser scene for rendering and interacting with a 4x4 Sudoku puzzle
 */
export class Sudoku4x4Scene extends Phaser.Scene {
  public readonly key = 'Sudoku4x4Scene'
  
  private puzzle: Sudoku4x4
  private config: SceneConfig
  private gridGraphics!: Phaser.GameObjects.Graphics
  private gridBounds!: GridBounds
  
  private cellRectangles: Map<string, CellRectangle> = new Map()
  private cellTexts: Map<string, CellText> = new Map()
  private cellHighlights: Map<string, Phaser.GameObjects.Rectangle> = new Map()
  private cellErrors: Map<string, Phaser.GameObjects.Rectangle> = new Map()
  
  private selectedCell: CellPosition | null = null
  private numberInputPanel: NumberInputPanel | null = null
  
  private cellClickHandler?: (position: CellPosition) => void
  private moveHandler?: (move: PuzzleMove) => void
  
  private isCompletionShowing = false

  constructor(puzzle: Sudoku4x4) {
    super({ key: 'Sudoku4x4Scene' })
    this.puzzle = puzzle
    this.config = this.createDefaultConfig()
  }

  private createDefaultConfig(): SceneConfig {
    return {
      gridSize: 4,
      cellSize: 80,
      gridPadding: 20,
      colors: {
        background: 0x1a1a2e,
        grid: 0x16213e,
        gridBold: 0x0f3460,
        cell: 0x2d3561,
        cellLocked: 0x1f2937,
        cellHover: 0x3f4a7a,
        cellSelected: 0x4f5a8a,
        cellError: 0xe63946,
        text: '#ffffff',
        textLocked: '#9ca3af',
        error: 0xdc2626,
        success: 0x10b981
      },
      fonts: {
        cell: 'bold 32px Arial',
        ui: 'bold 20px Arial'
      },
      animations: {
        placementDuration: 200,
        errorDuration: 500,
        completionDuration: 1000
      }
    }
  }

  // Scene lifecycle methods

  create(): void {
    this.calculateGridBounds()
    this.createGrid()
    this.renderPuzzleState()
    this.setupInteraction()
    
    // Listen for resize events
    this.scale.on('resize', this.handleResize, this)
  }

  update(): void {
    // Update animations if needed
  }

  destroy(): void {
    this.scale.off('resize', this.handleResize, this)
    super.destroy()
  }

  // Public API

  getPuzzle(): Sudoku4x4 {
    return this.puzzle
  }

  getConfig(): SceneConfig {
    return { ...this.config }
  }

  getGridGraphics(): Phaser.GameObjects.Graphics {
    return this.gridGraphics
  }

  getCellTexts(): CellText[] {
    return Array.from(this.cellTexts.values())
  }

  getCellText(row: number, col: number): CellText | undefined {
    return this.cellTexts.get(`${row},${col}`)
  }

  getCellRectangle(row: number, col: number): CellRectangle {
    const key = `${row},${col}`
    const rect = this.cellRectangles.get(key)
    if (!rect) throw new Error(`Cell rectangle not found for ${key}`)
    return rect
  }

  getCellHighlight(row: number, col: number): Phaser.GameObjects.Rectangle | undefined {
    return this.cellHighlights.get(`${row},${col}`)
  }

  getCellError(row: number, col: number): Phaser.GameObjects.Rectangle | undefined {
    return this.cellErrors.get(`${row},${col}`)
  }

  getGridBounds(): GridBounds {
    return { ...this.gridBounds }
  }

  getNumberInputPanel(): NumberInputPanel | null {
    return this.numberInputPanel
  }

  isShowingCompletion(): boolean {
    return this.isCompletionShowing
  }

  // Event handlers

  onCellClick(handler: (position: CellPosition) => void): void {
    this.cellClickHandler = handler
  }

  onMove(handler: (move: PuzzleMove) => void): void {
    this.moveHandler = handler
  }

  // UI actions

  highlightCell(row: number, col: number): void {
    const key = `${row},${col}`
    let highlight = this.cellHighlights.get(key)
    
    if (!highlight) {
      const { x, y } = this.getCellPosition(row, col)
      highlight = this.add.rectangle(x, y, this.config.cellSize, this.config.cellSize)
      highlight.setFillStyle(this.config.colors.cellHover, 0.3)
      highlight.setDepth(1)
      this.cellHighlights.set(key, highlight)
    }
    
    highlight.setVisible(true)
  }

  clearHighlight(row: number, col: number): void {
    const highlight = this.cellHighlights.get(`${row},${col}`)
    if (highlight) {
      highlight.setVisible(false)
    }
  }

  showCellError(row: number, col: number): void {
    const key = `${row},${col}`
    let error = this.cellErrors.get(key)
    
    if (!error) {
      const { x, y } = this.getCellPosition(row, col)
      error = this.add.rectangle(x, y, this.config.cellSize - 4, this.config.cellSize - 4)
      error.setStrokeStyle(3, this.config.colors.error)
      error.setDepth(2)
      this.cellErrors.set(key, error)
    }
    
    error.setVisible(true)
    error.fillColor = this.config.colors.error
  }

  clearCellError(row: number, col: number): void {
    const error = this.cellErrors.get(`${row},${col}`)
    if (error) {
      error.setVisible(false)
    }
  }

  selectCell(row: number, col: number): void {
    const state = this.puzzle.getState()
    const cell = state.grid[row][col]
    
    // Don't select locked cells
    if (cell.locked) return
    
    // Clear previous selection
    if (this.selectedCell) {
      this.clearHighlight(this.selectedCell.row, this.selectedCell.col)
    }
    
    this.selectedCell = { row, col }
    this.highlightCell(row, col)
    this.showNumberInput(row, col)
  }

  inputNumber(value: number): void {
    if (!this.selectedCell || !this.moveHandler) return
    
    const state = this.puzzle.getState()
    const cell = state.grid[this.selectedCell.row][this.selectedCell.col]
    
    if (!cell.locked) {
      this.moveHandler({
        row: this.selectedCell.row,
        col: this.selectedCell.col,
        value
      })
    }
  }

  clearCell(): void {
    if (!this.selectedCell || !this.moveHandler) return
    
    const state = this.puzzle.getState()
    const cell = state.grid[this.selectedCell.row][this.selectedCell.col]
    
    if (!cell.locked) {
      this.moveHandler({
        row: this.selectedCell.row,
        col: this.selectedCell.col,
        value: null
      })
    }
  }

  updateFromPuzzleState(): void {
    const state = this.puzzle.getState()
    
    // Update all cells
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        const cell = state.grid[row][col]
        const key = `${row},${col}`
        
        if (cell.value !== null) {
          // Update or create text
          let text = this.cellTexts.get(key)
          if (!text) {
            const { x, y } = this.getCellPosition(row, col)
            text = this.add.text(x, y, cell.value.toString(), {
              font: this.config.fonts.cell,
              color: cell.locked ? this.config.colors.textLocked : this.config.colors.text
            })
            text.setOrigin(0.5)
            text.setDepth(10)
            ;(text as CellText).cellData = { row, col, locked: cell.locked }
            this.cellTexts.set(key, text as CellText)
          } else {
            text.setText(cell.value.toString())
          }
        } else {
          // Remove text if cell is empty and was not originally locked
          const text = this.cellTexts.get(key)
          if (text) {
            const originalCell = this.puzzle.getState().grid[row][col]
            if (!originalCell.locked) {
              text.destroy()
              this.cellTexts.delete(key)
            }
          }
        }
      }
    }
    
    // Check for completion
    if (state.status === 'completed' && !this.isCompletionShowing) {
      this.animateCompletion()
    }
  }

  // Animations

  animateNumberPlacement(row: number, col: number, value: number): Animation {
    const { x, y } = this.getCellPosition(row, col)
    const text = this.add.text(x, y, value.toString(), {
      font: this.config.fonts.cell,
      color: this.config.colors.text
    })
    text.setOrigin(0.5)
    text.setScale(0)
    text.setDepth(10)
    
    // Store the text
    const key = `${row},${col}`
    const oldText = this.cellTexts.get(key)
    if (oldText) oldText.destroy()
    ;(text as CellText).cellData = { row, col, locked: false }
    this.cellTexts.set(key, text as CellText)
    
    // Animate scale
    this.tweens.add({
      targets: text,
      scale: 1,
      duration: this.config.animations.placementDuration,
      ease: 'Back.easeOut'
    })
    
    return {
      duration: this.config.animations.placementDuration,
      type: 'placement',
      complete: () => new Promise(resolve => {
        setTimeout(resolve, this.config.animations.placementDuration)
      })
    }
  }

  animateInvalidMove(row: number, col: number): Animation {
    const rect = this.getCellRectangle(row, col)
    const originalX = rect.x
    
    this.showCellError(row, col)
    
    // Shake animation
    this.tweens.add({
      targets: rect,
      x: originalX + 5,
      duration: 50,
      yoyo: true,
      repeat: 3,
      onComplete: () => {
        rect.x = originalX
        this.clearCellError(row, col)
      }
    })
    
    return {
      duration: this.config.animations.errorDuration,
      type: 'shake',
      complete: () => new Promise(resolve => {
        setTimeout(() => {
          this.clearCellError(row, col)
          resolve()
        }, this.config.animations.errorDuration)
      })
    }
  }

  animateCompletion(): Animation {
    this.isCompletionShowing = true
    
    // Animate all cells with a wave effect
    const cells = Array.from(this.cellRectangles.values())
    cells.forEach((cell, index) => {
      this.tweens.add({
        targets: cell,
        scale: 1.1,
        duration: 300,
        delay: index * 50,
        yoyo: true,
        ease: 'Sine.easeInOut'
      })
    })
    
    // Create celebration text
    const celebrationText = this.add.text(
      this.gridBounds.centerX,
      this.gridBounds.centerY - 200,
      'Puzzle Complete!',
      {
        font: 'bold 48px Arial',
        color: '#10b981'
      }
    )
    celebrationText.setOrigin(0.5)
    celebrationText.setScale(0)
    celebrationText.setDepth(100)
    
    this.tweens.add({
      targets: celebrationText,
      scale: 1,
      duration: 500,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.events.emit('puzzle:completed')
      }
    })
    
    return {
      duration: this.config.animations.completionDuration,
      type: 'celebration',
      complete: () => new Promise(resolve => {
        setTimeout(resolve, this.config.animations.completionDuration)
      })
    }
  }

  // Responsive handling

  handleResize(): void {
    const oldCellSize = this.config.cellSize
    this.calculateGridBounds()
    
    // Only redraw if cell size actually changed
    if (oldCellSize !== this.config.cellSize) {
      this.redrawGrid()
    }
    
    this.events.emit('scene:resize')
  }

  // Private methods

  private calculateGridBounds(): void {
    const screenWidth = this.scale.width
    const screenHeight = this.scale.height
    
    // Calculate cell size based on screen dimensions
    const maxGridWidth = screenWidth - this.config.gridPadding * 2
    const maxGridHeight = screenHeight - this.config.gridPadding * 4 - 100 // Leave room for UI
    
    const maxCellSize = Math.min(
      maxGridWidth / this.config.gridSize,
      maxGridHeight / this.config.gridSize,
      100 // Maximum cell size
    )
    
    this.config.cellSize = Math.floor(maxCellSize)
    
    const gridWidth = this.config.cellSize * this.config.gridSize
    const gridHeight = this.config.cellSize * this.config.gridSize
    
    this.gridBounds = {
      x: (screenWidth - gridWidth) / 2,
      y: (screenHeight - gridHeight) / 2 - 50,
      width: gridWidth,
      height: gridHeight,
      centerX: screenWidth / 2,
      centerY: (screenHeight - 100) / 2
    }
  }

  private createGrid(): void {
    // Create background
    this.gridGraphics = this.add.graphics()
    this.drawGrid()
    
    // Create cell rectangles for interaction
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        const { x, y } = this.getCellPosition(row, col)
        const rect = this.add.rectangle(
          x, y,
          this.config.cellSize - 2,
          this.config.cellSize - 2
        ) as CellRectangle
        
        rect.setInteractive()
        rect.setFillStyle(this.config.colors.cell, 0.1)
        rect.setDepth(0)
        
        // Store cell data
        rect.cellData = { row, col }
        
        // Add hover effects
        rect.on('pointerover', () => {
          if (!this.selectedCell || this.selectedCell.row !== row || this.selectedCell.col !== col) {
            this.highlightCell(row, col)
          }
        })
        
        rect.on('pointerout', () => {
          if (!this.selectedCell || this.selectedCell.row !== row || this.selectedCell.col !== col) {
            this.clearHighlight(row, col)
          }
        })
        
        rect.on('pointerdown', () => {
          if (this.cellClickHandler) {
            this.cellClickHandler({ row, col })
          }
          this.selectCell(row, col)
        })
        
        this.cellRectangles.set(`${row},${col}`, rect)
      }
    }
  }

  private drawGrid(): void {
    this.gridGraphics.clear()
    
    // Draw background
    this.gridGraphics.fillStyle(this.config.colors.background)
    this.gridGraphics.fillRect(0, 0, this.scale.width, this.scale.height)
    
    // Draw grid lines
    this.gridGraphics.lineStyle(1, this.config.colors.grid)
    
    // Draw all grid lines
    for (let i = 0; i <= 4; i++) {
      const lineWidth = (i % 2 === 0) ? 3 : 1
      const lineColor = (i % 2 === 0) ? this.config.colors.gridBold : this.config.colors.grid
      
      this.gridGraphics.lineStyle(lineWidth, lineColor)
      
      // Vertical lines
      const x = this.gridBounds.x + i * this.config.cellSize
      this.gridGraphics.moveTo(x, this.gridBounds.y)
      this.gridGraphics.lineTo(x, this.gridBounds.y + this.gridBounds.height)
      this.gridGraphics.stroke()
      
      // Horizontal lines
      const y = this.gridBounds.y + i * this.config.cellSize
      this.gridGraphics.moveTo(this.gridBounds.x, y)
      this.gridGraphics.lineTo(this.gridBounds.x + this.gridBounds.width, y)
      this.gridGraphics.stroke()
    }
    
    // Draw cell backgrounds
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        const { x, y } = this.getCellPosition(row, col)
        const cellSize = this.config.cellSize - 2
        
        this.gridGraphics.fillStyle(this.config.colors.cell, 0.3)
        this.gridGraphics.fillRect(
          x - cellSize / 2,
          y - cellSize / 2,
          cellSize,
          cellSize
        )
        
        // Draw as strokeRect for test compatibility
        this.gridGraphics.lineStyle(1, this.config.colors.grid, 0.5)
        this.gridGraphics.strokeRect(
          x - cellSize / 2,
          y - cellSize / 2,
          cellSize,
          cellSize
        )
      }
    }
  }

  private redrawGrid(): void {
    // Clear and redraw everything
    this.cellRectangles.forEach(rect => rect.destroy())
    this.cellRectangles.clear()
    
    this.cellTexts.forEach(text => text.destroy())
    this.cellTexts.clear()
    
    this.cellHighlights.forEach(highlight => highlight.destroy())
    this.cellHighlights.clear()
    
    this.cellErrors.forEach(error => error.destroy())
    this.cellErrors.clear()
    
    if (this.numberInputPanel) {
      this.hideNumberInput()
    }
    
    this.createGrid()
    this.renderPuzzleState()
  }

  private getCellPosition(row: number, col: number): { x: number, y: number } {
    return {
      x: this.gridBounds.x + col * this.config.cellSize + this.config.cellSize / 2,
      y: this.gridBounds.y + row * this.config.cellSize + this.config.cellSize / 2
    }
  }

  private renderPuzzleState(): void {
    const state = this.puzzle.getState()
    
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        const cell = state.grid[row][col]
        if (cell.value !== null) {
          const { x, y } = this.getCellPosition(row, col)
          const text = this.add.text(x, y, cell.value.toString(), {
            font: this.config.fonts.cell,
            color: cell.locked ? this.config.colors.textLocked : this.config.colors.text
          })
          text.setOrigin(0.5)
          text.setDepth(10)
          
          ;(text as CellText).cellData = { row, col, locked: cell.locked }
          ;(text as CellText).locked = cell.locked
          this.cellTexts.set(`${row},${col}`, text as CellText)
        }
      }
    }
  }

  private setupInteraction(): void {
    // Keyboard input
    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      if (!this.selectedCell) return
      
      const key = event.key
      if (key >= '1' && key <= '4') {
        this.inputNumber(parseInt(key))
      } else if (key === 'Delete' || key === 'Backspace') {
        this.clearCell()
      } else if (key === 'Escape') {
        this.deselectCell()
      }
    })
  }

  private showNumberInput(row: number, col: number): void {
    // Hide previous panel
    this.hideNumberInput()
    
    const { x, y } = this.getCellPosition(row, col)
    const panelY = y + this.config.cellSize
    
    // Create panel background
    const panelWidth = 250
    const panelHeight = 60
    const background = this.add.rectangle(x, panelY, panelWidth, panelHeight)
    background.setFillStyle(this.config.colors.cell, 0.95)
    background.setStrokeStyle(2, this.config.colors.gridBold)
    background.setDepth(20)
    
    // Create number buttons
    const buttons: NumberButton[] = []
    const buttonSize = 40
    const buttonSpacing = 10
    const startX = x - (2 * (buttonSize + buttonSpacing))
    
    for (let i = 1; i <= 4; i++) {
      const buttonX = startX + (i - 1) * (buttonSize + buttonSpacing)
      const button = this.createNumberButton(buttonX, panelY, i, buttonSize)
      buttons.push(button)
    }
    
    // Add clear button
    const clearButton = this.createNumberButton(
      startX + 4 * (buttonSize + buttonSpacing),
      panelY,
      null,
      buttonSize
    )
    buttons.push(clearButton)
    
    this.numberInputPanel = {
      visible: true,
      x,
      y: panelY,
      buttons,
      background
    }
  }

  private createNumberButton(x: number, y: number, value: number | null, size: number): NumberButton {
    const bg = this.add.rectangle(x, y, size, size)
    bg.setFillStyle(this.config.colors.cellHover)
    bg.setInteractive()
    bg.setDepth(21)
    
    const text = this.add.text(x, y, value ? value.toString() : 'X', {
      font: this.config.fonts.ui,
      color: this.config.colors.text
    })
    text.setOrigin(0.5)
    text.setDepth(22)
    
    bg.on('pointerover', () => {
      bg.setFillStyle(this.config.colors.cellSelected)
    })
    
    bg.on('pointerout', () => {
      bg.setFillStyle(this.config.colors.cellHover)
    })
    
    bg.on('pointerdown', () => {
      if (value !== null) {
        this.inputNumber(value)
      } else {
        this.clearCell()
      }
      this.hideNumberInput()
    })
    
    return { value, text, background: bg }
  }

  private hideNumberInput(): void {
    if (this.numberInputPanel) {
      this.numberInputPanel.background.destroy()
      this.numberInputPanel.buttons.forEach(button => {
        button.background.destroy()
        button.text.destroy()
      })
      this.numberInputPanel = null
    }
  }

  private deselectCell(): void {
    if (this.selectedCell) {
      this.clearHighlight(this.selectedCell.row, this.selectedCell.col)
      this.selectedCell = null
      this.hideNumberInput()
    }
  }
}