import { v4 as uuidv4 } from 'uuid'
import type {
  Puzzle,
  PuzzleState,
  PuzzleCell,
  PuzzleMove,
  MoveResult,
  PuzzleHint,
  ScoreParams,
  PuzzleDifficulty
} from '../../types/puzzle'

/**
 * 4x4 Sudoku implementation with 2x2 boxes
 * Numbers 1-4 must appear exactly once in each row, column, and 2x2 box
 */
export class Sudoku4x4 implements Puzzle {
  private state: PuzzleState
  private moveHistory: PuzzleMove[] = []
  private redoStack: PuzzleMove[] = []
  private startTimestamp: number | null = null
  private pausedTime: number = 0
  private lastPauseTimestamp: number | null = null

  constructor() {
    this.state = this.createInitialState()
    this.generatePuzzle()
  }

  private createInitialState(): PuzzleState {
    const grid: PuzzleCell[][] = []
    
    // Initialize empty 4x4 grid
    for (let row = 0; row < 4; row++) {
      grid[row] = []
      for (let col = 0; col < 4; col++) {
        grid[row][col] = {
          row,
          col,
          value: null,
          locked: false
        }
      }
    }

    return {
      id: uuidv4(),
      type: 'sudoku4x4',
      difficulty: 'easy',
      status: 'in_progress',
      grid,
      moves: [],
      hintsUsed: 0
    }
  }

  /**
   * Generate a valid Sudoku puzzle with unique solution
   */
  private generatePuzzle(): void {
    // First, create a complete valid solution
    const solution = this.generateCompleteSolution()
    
    // Copy solution to grid
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        this.state.grid[row][col].value = solution[row][col]
      }
    }

    // Remove cells based on difficulty to create the puzzle
    const cellsToRemove = this.getCellsToRemove(this.state.difficulty)
    const positions = this.getRandomPositions(cellsToRemove)
    
    // Clear selected cells and lock the remaining ones
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        const pos = row * 4 + col
        if (positions.includes(pos)) {
          this.state.grid[row][col].value = null
          this.state.grid[row][col].locked = false
        } else {
          this.state.grid[row][col].locked = true
        }
      }
    }
  }

  /**
   * Generate a complete valid Sudoku solution
   */
  private generateCompleteSolution(): number[][] {
    // Start with a known valid solution
    const baseSolution = [
      [1, 2, 3, 4],
      [3, 4, 1, 2],
      [2, 1, 4, 3],
      [4, 3, 2, 1]
    ]

    // Randomly permute the numbers 1-4
    const numberMap = this.createNumberPermutation()
    const permutedSolution = baseSolution.map(row =>
      row.map(num => numberMap[num - 1])
    )

    // Shuffle rows within groups (maintaining valid Sudoku)
    // Group 1: rows 0-1, Group 2: rows 2-3
    if (Math.random() > 0.5) {
      [permutedSolution[0], permutedSolution[1]] = [permutedSolution[1], permutedSolution[0]]
    }
    if (Math.random() > 0.5) {
      [permutedSolution[2], permutedSolution[3]] = [permutedSolution[3], permutedSolution[2]]
    }

    // Shuffle columns within groups
    if (Math.random() > 0.5) {
      for (let row of permutedSolution) {
        [row[0], row[1]] = [row[1], row[0]]
      }
    }
    if (Math.random() > 0.5) {
      for (let row of permutedSolution) {
        [row[2], row[3]] = [row[3], row[2]]
      }
    }

    return permutedSolution
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  private createNumberPermutation(): number[] {
    return this.shuffleArray([1, 2, 3, 4])
  }

  private getCellsToRemove(difficulty: PuzzleDifficulty): number {
    const removeCount = {
      easy: 4,    // Remove 4 cells, leaving 12 clues
      medium: 6,  // Remove 6 cells, leaving 10 clues
      hard: 8,    // Remove 8 cells, leaving 8 clues
      expert: 10  // Remove 10 cells, leaving 6 clues
    }
    return removeCount[difficulty]
  }

  private getRandomPositions(count: number): number[] {
    const positions = Array.from({ length: 16 }, (_, i) => i)
    return this.shuffleArray(positions).slice(0, count)
  }

  // Puzzle interface implementation

  getState(): PuzzleState {
    return JSON.parse(JSON.stringify(this.state)) // Deep clone
  }

  loadPuzzle(grid: (number | null)[][], metadata?: Record<string, any>): void {
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        this.state.grid[row][col].value = grid[row][col]
        this.state.grid[row][col].locked = grid[row][col] !== null
      }
    }
    
    if (metadata) {
      this.state.metadata = metadata
    }
    
    this.moveHistory = []
    this.redoStack = []
  }

  serialize(): string {
    return JSON.stringify({
      state: this.state,
      moveHistory: this.moveHistory,
      startTimestamp: this.startTimestamp,
      pausedTime: this.pausedTime
    })
  }

  deserialize(data: string): void {
    const parsed = JSON.parse(data)
    this.state = parsed.state
    this.moveHistory = parsed.moveHistory || []
    this.startTimestamp = parsed.startTimestamp
    this.pausedTime = parsed.pausedTime || 0
    this.redoStack = []
  }

  makeMove(move: PuzzleMove): MoveResult {
    // Check if cell is locked
    if (this.state.grid[move.row][move.col].locked) {
      return {
        success: false,
        error: 'Cannot modify locked cell'
      }
    }

    // Validate the move
    if (move.value !== null && !this.isValidMove(move)) {
      const violations = this.getViolations(move)
      return {
        success: false,
        error: `Invalid move: number already exists in ${violations.join(' and ')}`
      }
    }

    // Make the move
    this.state.grid[move.row][move.col].value = move.value
    
    // Record the move
    const recordedMove = { ...move, timestamp: Date.now() }
    this.moveHistory.push(recordedMove)
    this.state.moves.push(recordedMove)
    
    // Clear redo stack
    this.redoStack = []

    // Check if puzzle is complete
    if (this.isComplete()) {
      this.state.status = 'completed'
      this.state.endTime = Date.now()
    }

    return { success: true }
  }

  isValidMove(move: PuzzleMove): boolean {
    if (move.value === null) return true // Clearing a cell is always valid
    
    const num = move.value as number
    if (num < 1 || num > 4) return false

    // Check row constraint
    for (let col = 0; col < 4; col++) {
      if (col !== move.col && this.state.grid[move.row][col].value === num) {
        return false
      }
    }

    // Check column constraint
    for (let row = 0; row < 4; row++) {
      if (row !== move.row && this.state.grid[row][move.col].value === num) {
        return false
      }
    }

    // Check 2x2 box constraint
    const boxRow = Math.floor(move.row / 2) * 2
    const boxCol = Math.floor(move.col / 2) * 2
    
    for (let r = boxRow; r < boxRow + 2; r++) {
      for (let c = boxCol; c < boxCol + 2; c++) {
        if (r !== move.row || c !== move.col) {
          if (this.state.grid[r][c].value === num) {
            return false
          }
        }
      }
    }

    return true
  }

  private getViolations(move: PuzzleMove): string[] {
    const violations: string[] = []
    const num = move.value as number

    // Check row
    for (let col = 0; col < 4; col++) {
      if (col !== move.col && this.state.grid[move.row][col].value === num) {
        violations.push('row')
        break
      }
    }

    // Check column
    for (let row = 0; row < 4; row++) {
      if (row !== move.row && this.state.grid[row][move.col].value === num) {
        violations.push('column')
        break
      }
    }

    // Check box
    const boxRow = Math.floor(move.row / 2) * 2
    const boxCol = Math.floor(move.col / 2) * 2
    
    for (let r = boxRow; r < boxRow + 2; r++) {
      for (let c = boxCol; c < boxCol + 2; c++) {
        if ((r !== move.row || c !== move.col) && this.state.grid[r][c].value === num) {
          violations.push('box')
          break
        }
      }
    }

    return violations
  }

  isComplete(): boolean {
    // Check if all cells are filled
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        if (this.state.grid[row][col].value === null) {
          return false
        }
      }
    }

    // Verify the solution is valid
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        const value = this.state.grid[row][col].value
        this.state.grid[row][col].value = null // Temporarily clear
        
        const isValid = this.isValidMove({ row, col, value })
        this.state.grid[row][col].value = value // Restore
        
        if (!isValid) return false
      }
    }

    return true
  }

  isSolvable(): boolean {
    // Create a copy of the current state
    const savedGrid = this.state.grid.map(row =>
      row.map(cell => ({ ...cell }))
    )

    // Try to solve using backtracking
    const solvable = this.solveWithBacktracking()

    // Restore original state
    this.state.grid = savedGrid

    return solvable
  }

  private solveWithBacktracking(): boolean {
    // Find next empty cell
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        if (this.state.grid[row][col].value === null) {
          // Try each number 1-4
          for (let num = 1; num <= 4; num++) {
            if (this.isValidMove({ row, col, value: num })) {
              this.state.grid[row][col].value = num

              if (this.solveWithBacktracking()) {
                return true
              }

              // Backtrack
              this.state.grid[row][col].value = null
            }
          }
          return false // No valid number found
        }
      }
    }
    return true // All cells filled successfully
  }

  getHint(row: number, col: number): PuzzleHint | null {
    const cell = this.state.grid[row][col]
    
    if (cell.locked) {
      return null
    }

    const possibleValues: number[] = []
    
    for (let num = 1; num <= 4; num++) {
      if (this.isValidMove({ row, col, value: num })) {
        possibleValues.push(num)
      }
    }

    return {
      row,
      col,
      possibleValues,
      difficulty: 5 - possibleValues.length // Fewer options = harder
    }
  }

  useHint(): void {
    this.state.hintsUsed++
  }

  getNextMove(): PuzzleMove | null {
    // Find the cell with fewest possible values (most constrained)
    let bestMove: PuzzleMove | null = null
    let fewestOptions = 5

    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        if (this.state.grid[row][col].value === null) {
          const hint = this.getHint(row, col)
          if (hint && hint.possibleValues.length < fewestOptions) {
            fewestOptions = hint.possibleValues.length
            bestMove = {
              row,
              col,
              value: hint.possibleValues[0] // Pick first valid option
            }
          }
        }
      }
    }

    return bestMove
  }

  calculateScore(params: ScoreParams): number {
    const baseScore = 100
    
    // Time bonus (lose 1 point per 5 seconds)
    const timeBonus = Math.max(0, 100 - Math.floor(params.timeElapsed / 5))
    
    // Hint penalty (lose 20 points per hint)
    const hintPenalty = params.hintsUsed * 20
    
    // Difficulty multiplier
    const difficultyMultiplier = {
      easy: 1,
      medium: 1.5,
      hard: 2,
      expert: 3
    }[params.difficulty]

    const finalScore = Math.max(
      10, // Minimum score
      Math.floor((baseScore + timeBonus - hintPenalty) * difficultyMultiplier)
    )

    return finalScore
  }

  undo(): boolean {
    if (this.moveHistory.length === 0) return false

    const lastMove = this.moveHistory.pop()!
    this.redoStack.push(lastMove)

    // Find the previous value for this cell
    let previousValue: number | null = null
    
    // Check if cell was originally locked
    const isLocked = this.state.grid[lastMove.row][lastMove.col].locked
    if (!isLocked) {
      // Look for the previous move to this cell
      for (let i = this.moveHistory.length - 1; i >= 0; i--) {
        const move = this.moveHistory[i]
        if (move.row === lastMove.row && move.col === lastMove.col) {
          previousValue = move.value
          break
        }
      }
    }

    this.state.grid[lastMove.row][lastMove.col].value = previousValue
    this.state.moves.pop()

    // Update status if needed
    if (this.state.status === 'completed') {
      this.state.status = 'in_progress'
      this.state.endTime = undefined
    }

    return true
  }

  redo(): boolean {
    if (this.redoStack.length === 0) return false

    const moveToRedo = this.redoStack.pop()!
    
    // Apply the move directly without going through makeMove
    // to avoid clearing the redo stack
    this.state.grid[moveToRedo.row][moveToRedo.col].value = moveToRedo.value
    this.moveHistory.push(moveToRedo)
    this.state.moves.push(moveToRedo)
    
    // Check if puzzle is complete
    if (this.isComplete()) {
      this.state.status = 'completed'
      this.state.endTime = Date.now()
    }

    return true
  }

  clearHistory(): void {
    this.moveHistory = []
    this.redoStack = []
    this.state.moves = []
  }

  startTimer(): void {
    if (!this.startTimestamp) {
      this.startTimestamp = Date.now()
      this.state.startTime = this.startTimestamp
    }
  }

  pauseTimer(): void {
    if (this.startTimestamp && !this.lastPauseTimestamp) {
      this.lastPauseTimestamp = Date.now()
    }
  }

  resumeTimer(): void {
    if (this.lastPauseTimestamp) {
      this.pausedTime += Date.now() - this.lastPauseTimestamp
      this.lastPauseTimestamp = null
    }
  }

  getElapsedTime(): number {
    if (!this.startTimestamp) return 0

    const now = this.lastPauseTimestamp || Date.now()
    return Math.floor((now - this.startTimestamp - this.pausedTime) / 1000)
  }
}