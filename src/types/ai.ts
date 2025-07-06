// AI Puzzle Generation Types

export interface PuzzleGenerationRequest {
  type: 'sudoku4x4' | 'pattern' | 'spatial' | 'logic' | 'math' | 'wordplay'
  difficulty: 'easy' | 'medium' | 'hard' | 'expert'
  subtype?: string
  userLevel?: number
  previousPerformance?: UserPerformance
  constraints?: PuzzleConstraints
  seed?: string
  useCache?: boolean
  allowFallback?: boolean
}

export interface UserPerformance {
  averageTime: number // seconds
  successRate: number // 0-1
  hintsUsed: number // average hints per puzzle
  mistakeRate?: number
  streakLength?: number
}

export interface PuzzleConstraints {
  maxTime?: number
  minClues?: number
  maxClues?: number
  excludePatterns?: string[]
  requireTechniques?: string[]
  theme?: string
}

export interface GeneratedPuzzle {
  id: string
  type: string
  difficulty: string
  puzzle: any // Puzzle-specific data
  solution: any // Solution data
  metadata?: PuzzleMetadata
  hints?: PuzzleHint[]
  validation?: ValidationResult
}

export interface PuzzleMetadata {
  generatedAt: string
  generationTime: number // ms
  model: string
  promptTokens?: number
  completionTokens?: number
  estimatedTime?: number // seconds to solve
  techniques?: string[]
  difficultyScore?: number
  adjustedDifficulty?: string
  generatedLocally?: boolean
  category?: string
}

export interface PuzzleHint {
  level: 'basic' | 'intermediate' | 'advanced'
  text: string
  target?: string // e.g., "row-2", "cell-3-4"
  visual?: boolean
}

export interface ValidationResult {
  isValid: boolean
  hasUniqueSolution: boolean
  difficulty: number
  solvabilityScore: number
  errors?: string[]
}

// Sudoku-specific types
export interface SudokuPuzzle {
  grid: (number | null)[][]
  difficulty: string
  clues: number
  symmetry?: 'none' | 'rotational' | 'horizontal' | 'vertical' | 'diagonal'
}

export interface SudokuSolution {
  grid: number[][]
  steps?: SolutionStep[]
}

// Pattern-specific types
export interface PatternPuzzle {
  sequence?: (number | string | null)[]
  shapes?: string[]
  colors?: string[]
  matrix?: any[][]
  type: 'numeric' | 'shapes' | 'colors' | 'mixed'
  rule: string
}

export interface PatternSolution {
  answer: number | string
  explanation: string
  formula?: string
}

// Spatial-specific types
export interface SpatialPuzzle {
  shapes: Shape[]
  grid: Grid
  difficulty: string
  rotationAllowed?: boolean
  overlapAllowed?: boolean
}

export interface Shape {
  type: string
  rotation: number
  position: { x: number; y: number } | null
  color?: string
  id?: string
}

export interface Grid {
  width: number
  height: number
  obstacles?: { x: number; y: number }[]
}

export interface SpatialSolution {
  placements: ShapePlacement[]
  filled: number
  coverage?: number
}

export interface ShapePlacement {
  shape: number // index
  position: { x: number; y: number }
  rotation: number
}

// Solution steps for educational purposes
export interface SolutionStep {
  type: string
  description: string
  target?: string
  value?: any
  technique?: string
}

// Prompt templates
export interface PromptTemplate {
  system: string
  user: string
  examples?: Example[]
  constraints?: string[]
  outputFormat?: object
}

export interface Example {
  input: any
  output: any
  explanation?: string
}

// Generator configuration
export interface GeneratorConfig {
  apiKey: string
  model?: string
  temperature?: number
  maxTokens?: number
  timeout?: number
  maxRetries?: number
  cacheEnabled?: boolean
  cacheTTL?: number
  fallbackEnabled?: boolean
}

// Response validation schemas
export interface ResponseSchema {
  type: string
  properties: Record<string, any>
  required: string[]
  additionalProperties?: boolean
}

// Error types
export class PuzzleGenerationError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message)
    this.name = 'PuzzleGenerationError'
  }
}

export class ValidationError extends PuzzleGenerationError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', details)
    this.name = 'ValidationError'
  }
}

export class APIError extends PuzzleGenerationError {
  constructor(message: string, public status?: number, details?: any) {
    super(message, 'API_ERROR', details)
    this.name = 'APIError'
  }
}