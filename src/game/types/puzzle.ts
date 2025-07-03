/**
 * Core puzzle types and interfaces for the game engine
 */

export type PuzzleType = 'sudoku4x4' | 'logic' | 'spatial' | 'pattern' | 'sequence' | 'deduction' | 'wordplay' | 'math'
export type PuzzleDifficulty = 'easy' | 'medium' | 'hard' | 'expert'
export type PuzzleStatus = 'not_started' | 'in_progress' | 'completed' | 'abandoned'

/**
 * Represents a single cell in a puzzle grid
 */
export interface PuzzleCell {
  row: number
  col: number
  value: number | string | null
  locked: boolean // Pre-filled clue cells that can't be changed
  highlighted?: boolean // For UI feedback
  error?: boolean // For validation feedback
  candidates?: Array<number | string> // Possible values for hints
}

/**
 * Represents a move made by the player
 */
export interface PuzzleMove {
  row: number
  col: number
  value: number | string | null
  timestamp?: number
}

/**
 * Result of a move attempt
 */
export interface MoveResult {
  success: boolean
  error?: string
  hints?: string[]
}

/**
 * Hint information for a specific cell
 */
export interface PuzzleHint {
  row: number
  col: number
  possibleValues: Array<number | string>
  explanation?: string
  difficulty?: number // How hard is this cell to solve? 1-10
}

/**
 * Complete puzzle state
 */
export interface PuzzleState {
  id: string
  type: PuzzleType
  difficulty: PuzzleDifficulty
  status: PuzzleStatus
  grid: PuzzleCell[][]
  startTime?: number
  endTime?: number
  moves: PuzzleMove[]
  hintsUsed: number
  score?: number
  metadata?: Record<string, any>
}

/**
 * Score calculation parameters
 */
export interface ScoreParams {
  timeElapsed: number // in seconds
  hintsUsed: number
  difficulty: PuzzleDifficulty
  moveCount?: number
  errorCount?: number
}

/**
 * Puzzle generation parameters
 */
export interface PuzzleGenerationParams {
  difficulty: PuzzleDifficulty
  seed?: string // For reproducible puzzles
  theme?: string
  constraints?: Record<string, any>
}

/**
 * Base interface that all puzzle implementations must follow
 */
export interface Puzzle {
  // State management
  getState(): PuzzleState
  loadPuzzle(grid: any, metadata?: Record<string, any>): void
  serialize(): string
  deserialize(data: string): void
  
  // Gameplay
  makeMove(move: PuzzleMove): MoveResult
  isValidMove(move: PuzzleMove): boolean
  isComplete(): boolean
  isSolvable(): boolean
  
  // Hints and assistance
  getHint(row: number, col: number): PuzzleHint | null
  useHint(): void
  getNextMove(): PuzzleMove | null
  
  // Scoring
  calculateScore(params: ScoreParams): number
  
  // History
  undo(): boolean
  redo(): boolean
  clearHistory(): void
  
  // Timer
  startTimer(): void
  pauseTimer(): void
  resumeTimer(): void
  getElapsedTime(): number
}

/**
 * Factory interface for creating puzzles
 */
export interface PuzzleFactory {
  createPuzzle(type: PuzzleType, params?: PuzzleGenerationParams): Puzzle
  generatePuzzle(type: PuzzleType, params: PuzzleGenerationParams): Promise<Puzzle>
}