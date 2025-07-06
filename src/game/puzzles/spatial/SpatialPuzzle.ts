import type { 
  SpatialPuzzleState, 
  Shape, 
  PlacedShape, 
  SpatialHint, 
  SpatialDifficulty,
  Block
} from './types'
import { 
  TETROMINO_SHAPES, 
  SIMPLE_SHAPES, 
  COMPLEX_SHAPES, 
  SHAPE_COLORS 
} from './types'

export class SpatialPuzzle {
  private state: SpatialPuzzleState
  public readonly difficulty: SpatialDifficulty

  constructor(difficulty: SpatialDifficulty = 'medium') {
    this.difficulty = difficulty
    this.state = this.initializeState()
    this.generatePuzzle()
  }

  private initializeState(): SpatialPuzzleState {
    const gridSize = this.getGridSize()
    
    return {
      gridSize,
      grid: Array(gridSize).fill(null).map(() => Array(gridSize).fill(null)),
      shapesToPlace: [],
      placedShapes: [],
      allowRotation: this.difficulty === 'hard' || this.difficulty === 'expert',
      moves: 0,
      hintsUsed: 0,
      startTime: null,
      endTime: null
    }
  }

  private getGridSize(): number {
    switch (this.difficulty) {
      case 'easy': return 4
      case 'medium': return 5
      case 'hard': return 6
      case 'expert': return 8
    }
  }

  private getShapeCount(): number {
    switch (this.difficulty) {
      case 'easy': return 2 + Math.floor(Math.random() * 2) // 2-3
      case 'medium': return 3 + Math.floor(Math.random() * 2) // 3-4
      case 'hard': return 4 + Math.floor(Math.random() * 2) // 4-5
      case 'expert': return 5 + Math.floor(Math.random() * 3) // 5-7
    }
  }

  private generatePuzzle(): void {
    this.state.shapesToPlace = this.generateShapes()
  }

  generateShapes(): Shape[] {
    const shapeCount = this.getShapeCount()
    const shapes: Shape[] = []
    const availableShapes = this.getAvailableShapes()
    const usedColors = new Set<string>()

    for (let i = 0; i < shapeCount; i++) {
      // Pick a random shape template
      const shapeKeys = Object.keys(availableShapes)
      const randomKey = shapeKeys[Math.floor(Math.random() * shapeKeys.length)]
      const shapeBlocks = [...availableShapes[randomKey as keyof typeof availableShapes]]

      // Pick a unique color
      let color: string
      do {
        color = SHAPE_COLORS[Math.floor(Math.random() * SHAPE_COLORS.length)]
      } while (usedColors.has(color) && usedColors.size < SHAPE_COLORS.length)
      usedColors.add(color)

      shapes.push({
        id: `shape-${i}`,
        blocks: shapeBlocks.map(b => ({ ...b })), // Deep copy
        color
      })
    }

    // Ensure the puzzle is solvable
    if (!this.isPuzzleSolvable(shapes)) {
      // If not solvable, regenerate
      return this.generateShapes()
    }

    return shapes
  }

  private getAvailableShapes(): Record<string, Block[]> {
    switch (this.difficulty) {
      case 'easy':
        return { ...SIMPLE_SHAPES, ...Object.fromEntries(
          Object.entries(TETROMINO_SHAPES).slice(0, 3)
        )}
      case 'medium':
        return TETROMINO_SHAPES
      case 'hard':
        return { ...TETROMINO_SHAPES, ...Object.fromEntries(
          Object.entries(COMPLEX_SHAPES).slice(0, 2)
        )}
      case 'expert':
        return { ...TETROMINO_SHAPES, ...COMPLEX_SHAPES }
    }
  }

  private isPuzzleSolvable(shapes: Shape[]): boolean {
    // Simple check: ensure total blocks don't exceed grid capacity
    const totalBlocks = shapes.reduce((sum, shape) => sum + shape.blocks.length, 0)
    const gridCapacity = this.state.gridSize * this.state.gridSize
    
    // Leave some empty space for medium and higher difficulties
    const maxFillRatio = this.difficulty === 'easy' ? 0.9 : 0.8
    
    return totalBlocks <= gridCapacity * maxFillRatio
  }

  canPlaceShape(shape: Shape, x: number, y: number, rotation: number = 0): boolean {
    const rotatedShape = rotation > 0 ? this.rotateShapeSteps(shape, rotation) : shape

    for (const block of rotatedShape.blocks) {
      const gridX = x + block.x
      const gridY = y + block.y

      // Check bounds
      if (gridX < 0 || gridX >= this.state.gridSize || 
          gridY < 0 || gridY >= this.state.gridSize) {
        return false
      }

      // Check collision
      if (this.state.grid[gridY][gridX] !== null) {
        return false
      }
    }

    return true
  }

  placeShape(shape: Shape, x: number, y: number, rotation: number = 0): void {
    if (!this.canPlaceShape(shape, x, y, rotation)) {
      throw new Error('Cannot place shape at this position')
    }

    const rotatedShape = rotation > 0 ? this.rotateShapeSteps(shape, rotation) : shape

    // Update grid
    for (const block of rotatedShape.blocks) {
      const gridX = x + block.x
      const gridY = y + block.y
      this.state.grid[gridY][gridX] = shape.id
    }

    // Add to placed shapes
    this.state.placedShapes.push({
      shape: rotatedShape,
      x,
      y,
      rotation
    })

    this.state.moves++
  }

  removeShape(shapeId: string): void {
    const placedIndex = this.state.placedShapes.findIndex(
      p => p.shape.id === shapeId
    )
    
    if (placedIndex === -1) {
      throw new Error('Shape not found')
    }

    const placed = this.state.placedShapes[placedIndex]

    // Clear from grid
    for (const block of placed.shape.blocks) {
      const gridX = placed.x + block.x
      const gridY = placed.y + block.y
      this.state.grid[gridY][gridX] = null
    }

    // Remove from placed shapes
    this.state.placedShapes.splice(placedIndex, 1)
    this.state.moves++
  }

  rotateShape(shape: Shape): Shape {
    // Rotate 90 degrees clockwise
    const rotatedBlocks = shape.blocks.map(block => ({
      x: -block.y,
      y: block.x
    }))

    // Normalize to positive coordinates
    const minX = Math.min(...rotatedBlocks.map(b => b.x))
    const minY = Math.min(...rotatedBlocks.map(b => b.y))

    return {
      ...shape,
      blocks: rotatedBlocks.map(block => ({
        x: block.x - minX,
        y: block.y - minY
      }))
    }
  }

  private rotateShapeSteps(shape: Shape, steps: number): Shape {
    let rotated = shape
    for (let i = 0; i < steps; i++) {
      rotated = this.rotateShape(rotated)
    }
    return rotated
  }

  isComplete(): boolean {
    return this.state.placedShapes.length === this.state.shapesToPlace.length
  }

  getHint(shapeId?: string): SpatialHint {
    this.state.hintsUsed++

    // If specific shape requested
    if (shapeId) {
      const shape = this.state.shapesToPlace.find(s => s.id === shapeId)
      if (!shape) {
        return { message: 'Shape not found' }
      }

      // Find a valid position
      for (let y = 0; y < this.state.gridSize; y++) {
        for (let x = 0; x < this.state.gridSize; x++) {
          if (this.canPlaceShape(shape, x, y)) {
            return {
              message: `Try placing the ${shape.color} shape at position (${x + 1}, ${y + 1})`,
              shapeId: shape.id,
              position: { x, y }
            }
          }
        }
      }

      return { message: 'No valid position found for this shape' }
    }

    // General hint
    const unplacedShapes = this.state.shapesToPlace.filter(
      shape => !this.state.placedShapes.some(p => p.shape.id === shape.id)
    )

    if (unplacedShapes.length === 0) {
      return { message: 'All shapes have been placed!' }
    }

    const shape = unplacedShapes[0]
    return {
      message: `Try placing the ${shape.color} shape with ${shape.blocks.length} blocks`,
      shapeId: shape.id
    }
  }

  useHint(): void {
    this.state.hintsUsed++
  }

  startTimer(): void {
    this.state.startTime = Date.now()
  }

  stopTimer(): void {
    if (this.state.startTime && !this.state.endTime) {
      this.state.endTime = Date.now()
    }
  }

  getTimeElapsed(): number {
    if (!this.state.startTime) return 0
    const endTime = this.state.endTime || Date.now()
    return Math.floor((endTime - this.state.startTime) / 1000)
  }

  calculateScore(): number {
    const baseScore = 1000
    const timeElapsed = this.getTimeElapsed()
    const timePenalty = Math.min(timeElapsed * 2, 300)
    const movePenalty = this.state.moves * 5
    const hintPenalty = this.state.hintsUsed * 50

    const difficultyMultiplier = {
      easy: 0.8,
      medium: 1.0,
      hard: 1.2,
      expert: 1.5
    }[this.difficulty]

    const score = Math.max(
      0,
      Math.floor((baseScore - timePenalty - movePenalty - hintPenalty) * difficultyMultiplier)
    )

    return score
  }

  reset(): void {
    // Clear grid
    for (let y = 0; y < this.state.gridSize; y++) {
      for (let x = 0; x < this.state.gridSize; x++) {
        this.state.grid[y][x] = null
      }
    }

    // Reset state
    this.state.placedShapes = []
    this.state.moves = 0
    this.state.hintsUsed = 0
    this.state.startTime = null
    this.state.endTime = null
  }

  getState(): Readonly<SpatialPuzzleState> {
    return { ...this.state }
  }
}