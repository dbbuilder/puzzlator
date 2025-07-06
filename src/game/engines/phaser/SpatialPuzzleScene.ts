import Phaser from 'phaser'
import { SpatialPuzzle } from '@/game/puzzles/spatial/SpatialPuzzle'
import type { Shape, PlacedShape } from '@/game/puzzles/spatial/types'

interface DraggableShape extends Phaser.GameObjects.Container {
  shapeData: Shape
  originalX: number
  originalY: number
  gridPosition?: { x: number; y: number }
  rotation: number
}

export class SpatialPuzzleScene extends Phaser.Scene {
  private puzzle!: SpatialPuzzle
  private gridContainer!: Phaser.GameObjects.Container
  private shapesContainer!: Phaser.GameObjects.Container
  private draggableShapes: DraggableShape[] = []
  private gridCells: Phaser.GameObjects.Rectangle[][] = []
  private selectedShape: DraggableShape | null = null
  private hintText!: Phaser.GameObjects.Text
  private scoreText!: Phaser.GameObjects.Text
  private movesText!: Phaser.GameObjects.Text
  
  // Grid settings
  private gridStartX = 100
  private gridStartY = 150
  private cellSize = 60
  private cellPadding = 2
  
  // Shape palette settings
  private paletteStartX = 100
  private paletteStartY = 500
  private paletteSpacing = 150

  constructor() {
    super({ key: 'SpatialPuzzleScene' })
  }

  init(data: { puzzle: SpatialPuzzle }) {
    this.puzzle = data.puzzle
    this.draggableShapes = []
    this.gridCells = []
    this.selectedShape = null
  }

  create() {
    // Set background
    this.cameras.main.setBackgroundColor('#e8f4f8')
    
    // Create title
    this.add.text(this.scale.width / 2, 30, 'Shape Fitting Puzzle', {
      fontSize: '32px',
      color: '#2c3e50',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5)
    
    // Create grid
    this.createGrid()
    
    // Create shape palette
    this.createShapePalette()
    
    // Create UI elements
    this.createUI()
    
    // Set up keyboard controls
    this.setupKeyboardControls()
    
    // Listen for events
    this.events.on('request-hint', () => this.showHint())
    this.events.on('rotate-selected', () => {
      if (this.selectedShape) {
        this.rotateShape(this.selectedShape)
      }
    })
  }

  private createGrid() {
    const state = this.puzzle.getState()
    this.gridContainer = this.add.container(this.gridStartX, this.gridStartY)
    
    // Create grid background
    const gridBg = this.add.rectangle(
      -this.cellPadding,
      -this.cellPadding,
      state.gridSize * (this.cellSize + this.cellPadding) + this.cellPadding,
      state.gridSize * (this.cellSize + this.cellPadding) + this.cellPadding,
      0x34495e,
      0.3
    ).setOrigin(0)
    
    this.gridContainer.add(gridBg)
    
    // Create grid cells
    for (let y = 0; y < state.gridSize; y++) {
      this.gridCells[y] = []
      for (let x = 0; x < state.gridSize; x++) {
        const cellX = x * (this.cellSize + this.cellPadding)
        const cellY = y * (this.cellSize + this.cellPadding)
        
        const cell = this.add.rectangle(
          cellX,
          cellY,
          this.cellSize,
          this.cellSize,
          0xffffff,
          1
        ).setOrigin(0)
          .setStrokeStyle(2, 0xbdc3c7)
        
        this.gridCells[y][x] = cell
        this.gridContainer.add(cell)
        
        // Add coordinate labels (optional, for debugging)
        if (state.gridSize <= 6) {
          const label = this.add.text(
            cellX + this.cellSize / 2,
            cellY + this.cellSize / 2,
            `${x},${y}`,
            {
              fontSize: '10px',
              color: '#95a5a6',
              fontFamily: 'Arial'
            }
          ).setOrigin(0.5).setAlpha(0.3)
          
          this.gridContainer.add(label)
        }
      }
    }
  }

  private createShapePalette() {
    const state = this.puzzle.getState()
    this.shapesContainer = this.add.container(0, 0)
    
    // Create draggable shapes
    state.shapesToPlace.forEach((shape, index) => {
      const x = this.paletteStartX + (index % 4) * this.paletteSpacing
      const y = this.paletteStartY + Math.floor(index / 4) * this.paletteSpacing
      
      const shapeContainer = this.createDraggableShape(shape, x, y)
      this.draggableShapes.push(shapeContainer)
      this.shapesContainer.add(shapeContainer)
    })
  }

  private createDraggableShape(shape: Shape, x: number, y: number): DraggableShape {
    const container = this.add.container(x, y) as DraggableShape
    container.shapeData = shape
    container.originalX = x
    container.originalY = y
    container.rotation = 0
    
    // Find bounds of the shape
    const minX = Math.min(...shape.blocks.map(b => b.x))
    const minY = Math.min(...shape.blocks.map(b => b.y))
    const maxX = Math.max(...shape.blocks.map(b => b.x))
    const maxY = Math.max(...shape.blocks.map(b => b.y))
    
    // Create background for dragging
    const bgWidth = (maxX - minX + 1) * this.cellSize
    const bgHeight = (maxY - minY + 1) * this.cellSize
    const bg = this.add.rectangle(
      bgWidth / 2,
      bgHeight / 2,
      bgWidth + 20,
      bgHeight + 20,
      0xffffff,
      0.01
    ).setStrokeStyle(2, 0x95a5a6, 0.3)
    
    container.add(bg)
    
    // Create shape blocks
    shape.blocks.forEach(block => {
      const blockX = (block.x - minX) * this.cellSize + this.cellSize / 2
      const blockY = (block.y - minY) * this.cellSize + this.cellSize / 2
      
      const blockRect = this.add.rectangle(
        blockX,
        blockY,
        this.cellSize - 4,
        this.cellSize - 4,
        Phaser.Display.Color.HexStringToColor(shape.color).color
      ).setStrokeStyle(2, 0x2c3e50)
      
      container.add(blockRect)
    })
    
    // Make it interactive
    container.setSize(bgWidth + 20, bgHeight + 20)
    container.setInteractive({ draggable: true, cursor: 'pointer' })
    
    // Set up drag events
    this.setupDragEvents(container)
    
    return container
  }

  private setupDragEvents(shape: DraggableShape) {
    let dragStartX = 0
    let dragStartY = 0
    
    shape.on('dragstart', (pointer: Phaser.Input.Pointer) => {
      this.selectedShape = shape
      shape.setDepth(1000)
      dragStartX = shape.x
      dragStartY = shape.y
      
      // Visual feedback
      shape.setAlpha(0.8)
      this.tweens.add({
        targets: shape,
        scaleX: 1.1,
        scaleY: 1.1,
        duration: 100
      })
    })
    
    // Also select on click
    shape.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.selectedShape = shape
      if (pointer.event.detail === 2) { // Double-click
        this.rotateShape(shape)
      }
    })
    
    shape.on('drag', (pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
      shape.x = dragX
      shape.y = dragY
      
      // Highlight valid grid position
      this.highlightValidPosition(shape)
    })
    
    shape.on('dragend', (pointer: Phaser.Input.Pointer) => {
      shape.setAlpha(1)
      this.tweens.add({
        targets: shape,
        scaleX: 1,
        scaleY: 1,
        duration: 100
      })
      
      // Try to snap to grid
      const gridPos = this.getGridPosition(pointer.x, pointer.y)
      
      if (gridPos && this.puzzle.canPlaceShape(shape.shapeData, gridPos.x, gridPos.y, shape.rotation / 90)) {
        // Place the shape
        this.placeShapeOnGrid(shape, gridPos.x, gridPos.y)
      } else {
        // Return to original position
        this.tweens.add({
          targets: shape,
          x: shape.originalX,
          y: shape.originalY,
          duration: 200,
          ease: 'Power2'
        })
        
        // Shake to indicate invalid placement
        this.shakeObject(shape)
      }
      
      shape.setDepth(0)
      this.clearHighlights()
    })
  }

  private highlightValidPosition(shape: DraggableShape) {
    this.clearHighlights()
    
    const gridPos = this.getGridPosition(shape.x, shape.y)
    if (!gridPos) return
    
    const canPlace = this.puzzle.canPlaceShape(shape.shapeData, gridPos.x, gridPos.y, shape.rotation / 90)
    
    // Highlight grid cells
    shape.shapeData.blocks.forEach(block => {
      const rotatedBlock = this.rotateBlock(block, shape.rotation / 90)
      const cellX = gridPos.x + rotatedBlock.x
      const cellY = gridPos.y + rotatedBlock.y
      
      if (cellY >= 0 && cellY < this.gridCells.length && 
          cellX >= 0 && cellX < this.gridCells[cellY].length) {
        const cell = this.gridCells[cellY][cellX]
        cell.setFillStyle(canPlace ? 0x2ecc71 : 0xe74c3c, 0.3)
      }
    })
  }

  private clearHighlights() {
    this.gridCells.forEach(row => {
      row.forEach(cell => {
        cell.setFillStyle(0xffffff, 1)
      })
    })
  }

  private getGridPosition(worldX: number, worldY: number): { x: number; y: number } | null {
    const localX = worldX - this.gridStartX
    const localY = worldY - this.gridStartY
    
    const gridX = Math.floor(localX / (this.cellSize + this.cellPadding))
    const gridY = Math.floor(localY / (this.cellSize + this.cellPadding))
    
    const state = this.puzzle.getState()
    if (gridX >= 0 && gridX < state.gridSize && gridY >= 0 && gridY < state.gridSize) {
      return { x: gridX, y: gridY }
    }
    
    return null
  }

  private placeShapeOnGrid(shape: DraggableShape, gridX: number, gridY: number) {
    try {
      // Place in puzzle logic
      this.puzzle.placeShape(shape.shapeData, gridX, gridY, shape.rotation / 90)
      
      // Update visual position
      shape.x = this.gridStartX + gridX * (this.cellSize + this.cellPadding) + this.cellSize / 2
      shape.y = this.gridStartY + gridY * (this.cellSize + this.cellPadding) + this.cellSize / 2
      shape.gridPosition = { x: gridX, y: gridY }
      
      // Disable dragging
      shape.removeInteractive()
      shape.setAlpha(0.9)
      
      // Update grid visual
      this.updateGridVisual()
      
      // Update UI
      this.updateUI()
      
      // Emit state update
      this.events.emit('state-update')
      
      // Check if puzzle is complete
      if (this.puzzle.isComplete()) {
        this.showCompletion()
      }
      
      // Play sound effect
      this.sound.play('place', { volume: 0.5 })
    } catch (error) {
      console.error('Failed to place shape:', error)
      // Return to original position
      this.tweens.add({
        targets: shape,
        x: shape.originalX,
        y: shape.originalY,
        duration: 200
      })
    }
  }

  private rotateShape(shape: DraggableShape) {
    const state = this.puzzle.getState()
    if (!state.allowRotation) {
      this.shakeObject(shape)
      return
    }
    
    // Rotate 90 degrees
    shape.rotation += 90
    if (shape.rotation >= 360) {
      shape.rotation = 0
    }
    
    // Visual rotation with animation
    this.tweens.add({
      targets: shape,
      angle: shape.rotation,
      duration: 200,
      ease: 'Power2'
    })
    
    // Update the shape data rotation
    const rotationSteps = shape.rotation / 90
    shape.shapeData = this.rotateShapeData(shape.shapeData, rotationSteps)
  }

  private rotateShapeData(shape: Shape, steps: number): Shape {
    let rotated = shape
    for (let i = 0; i < steps; i++) {
      rotated = this.puzzle.rotateShape(rotated)
    }
    return { ...shape, blocks: rotated.blocks }
  }

  private rotateBlock(block: { x: number; y: number }, steps: number): { x: number; y: number } {
    let x = block.x
    let y = block.y
    
    for (let i = 0; i < steps; i++) {
      const newX = -y
      const newY = x
      x = newX
      y = newY
    }
    
    return { x, y }
  }

  private updateGridVisual() {
    const state = this.puzzle.getState()
    
    // Update grid colors based on placed shapes
    for (let y = 0; y < state.gridSize; y++) {
      for (let x = 0; x < state.gridSize; x++) {
        const shapeId = state.grid[y][x]
        const cell = this.gridCells[y][x]
        
        if (shapeId) {
          const shape = state.shapesToPlace.find(s => s.id === shapeId)
          if (shape) {
            cell.setFillStyle(Phaser.Display.Color.HexStringToColor(shape.color).color, 0.3)
          }
        } else {
          cell.setFillStyle(0xffffff, 1)
        }
      }
    }
  }

  private createUI() {
    // Score display
    this.scoreText = this.add.text(20, 80, 'Score: 1000', {
      fontSize: '20px',
      color: '#2c3e50',
      fontFamily: 'Arial'
    })
    
    // Moves display
    this.movesText = this.add.text(200, 80, 'Moves: 0', {
      fontSize: '20px',
      color: '#2c3e50',
      fontFamily: 'Arial'
    })
    
    // Hint area
    this.hintText = this.add.text(this.scale.width / 2, 100, '', {
      fontSize: '16px',
      color: '#7f8c8d',
      fontFamily: 'Arial',
      align: 'center',
      wordWrap: { width: 600 }
    }).setOrigin(0.5)
    
    // Instructions
    const instructions = this.puzzle.getState().allowRotation 
      ? 'Drag shapes to the grid. Double-click to rotate.'
      : 'Drag shapes to the grid.'
    
    this.add.text(this.scale.width / 2, this.scale.height - 30, instructions, {
      fontSize: '14px',
      color: '#95a5a6',
      fontFamily: 'Arial'
    }).setOrigin(0.5)
  }

  private updateUI() {
    const state = this.puzzle.getState()
    this.movesText.setText(`Moves: ${state.moves}`)
    
    // Update score
    const score = this.puzzle.calculateScore()
    this.scoreText.setText(`Score: ${score}`)
  }

  private setupKeyboardControls() {
    // R key to rotate selected shape
    this.input.keyboard?.on('keydown-R', () => {
      if (this.selectedShape && this.puzzle.getState().allowRotation) {
        this.rotateShape(this.selectedShape)
      }
    })
    
    // H key for hint
    this.input.keyboard?.on('keydown-H', () => {
      this.showHint()
    })
    
    // ESC to deselect
    this.input.keyboard?.on('keydown-ESC', () => {
      this.selectedShape = null
    })
  }

  private showHint() {
    const hint = this.puzzle.getHint()
    this.puzzle.useHint()
    
    this.hintText.setText(hint.message)
    this.updateUI()
    
    // Clear hint after 5 seconds
    this.time.delayedCall(5000, () => {
      this.hintText.setText('')
    })
    
    // Visual hint if position is provided
    if (hint.position) {
      const cell = this.gridCells[hint.position.y][hint.position.x]
      this.tweens.add({
        targets: cell,
        alpha: 0.5,
        duration: 500,
        yoyo: true,
        repeat: 3
      })
    }
  }

  private shakeObject(obj: Phaser.GameObjects.GameObject) {
    const originalX = obj.x
    
    this.tweens.add({
      targets: obj,
      x: originalX + 10,
      duration: 50,
      yoyo: true,
      repeat: 3,
      onComplete: () => {
        obj.x = originalX
      }
    })
  }

  private showCompletion() {
    // Stop timer
    this.puzzle.stopTimer()
    
    // Calculate final score
    const score = this.puzzle.calculateScore()
    
    // Create completion overlay
    const overlay = this.add.rectangle(
      this.scale.width / 2,
      this.scale.height / 2,
      this.scale.width,
      this.scale.height,
      0x000000,
      0.7
    )
    
    // Completion message
    const completionText = this.add.text(
      this.scale.width / 2,
      this.scale.height / 2 - 50,
      'Puzzle Complete!',
      {
        fontSize: '48px',
        color: '#ffffff',
        fontFamily: 'Arial',
        fontStyle: 'bold'
      }
    ).setOrigin(0.5)
    
    // Score display
    const scoreDisplay = this.add.text(
      this.scale.width / 2,
      this.scale.height / 2 + 20,
      `Score: ${score}\nTime: ${this.puzzle.getTimeElapsed()}s\nMoves: ${this.puzzle.getState().moves}`,
      {
        fontSize: '24px',
        color: '#ffffff',
        fontFamily: 'Arial',
        align: 'center',
        lineSpacing: 10
      }
    ).setOrigin(0.5)
    
    // Continue button
    const continueBtn = this.add.text(
      this.scale.width / 2,
      this.scale.height / 2 + 120,
      'Continue',
      {
        fontSize: '28px',
        color: '#ffffff',
        fontFamily: 'Arial',
        backgroundColor: '#27ae60',
        padding: { x: 30, y: 15 }
      }
    ).setOrigin(0.5)
      .setInteractive({ cursor: 'pointer' })
    
    continueBtn.on('pointerover', () => continueBtn.setBackgroundColor('#2ecc71'))
    continueBtn.on('pointerout', () => continueBtn.setBackgroundColor('#27ae60'))
    continueBtn.on('pointerdown', () => {
      this.events.emit('puzzle-complete', { score, puzzle: this.puzzle })
    })
    
    // Animate in
    overlay.setAlpha(0)
    completionText.setScale(0)
    scoreDisplay.setAlpha(0)
    continueBtn.setAlpha(0)
    
    this.tweens.add({
      targets: overlay,
      alpha: 0.7,
      duration: 300
    })
    
    this.tweens.add({
      targets: completionText,
      scaleX: 1,
      scaleY: 1,
      duration: 500,
      ease: 'Back.easeOut',
      delay: 200
    })
    
    this.tweens.add({
      targets: [scoreDisplay, continueBtn],
      alpha: 1,
      duration: 300,
      delay: 400
    })
  }
  
  // Load sound effects
  preload() {
    // Create simple sound effects programmatically
    this.sound.add('place', {
      volume: 0.5
    })
  }
}