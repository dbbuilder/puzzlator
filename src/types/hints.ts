// Hint System Types

export type HintLevel = 'basic' | 'intermediate' | 'advanced'

export type HintType = 
  | 'possibleValues'    // Shows possible values for a cell
  | 'elimination'       // Shows why certain values are eliminated
  | 'technique'         // Shows solving technique
  | 'nextValue'         // Shows next value in pattern
  | 'rule'              // Shows pattern rule
  | 'sequence'          // Shows complete sequence
  | 'placement'         // Shows where to place shape
  | 'rotation'          // Shows rotation suggestion
  | 'strategy'          // Shows overall strategy

export interface PuzzleHint {
  type: HintType
  level: HintLevel
  message: string
  
  // For Sudoku hints
  possibleValues?: number[]
  eliminatedValues?: number[]
  reason?: string
  technique?: string
  steps?: string[]
  
  // For Pattern hints
  value?: number
  rule?: string
  explanation?: string
  fullSequence?: number[]
  formula?: string
  
  // For Spatial hints
  position?: { x: number; y: number }
  rotation?: number
  visualGuide?: string
  strategy?: string
}

export interface HintResult extends PuzzleHint {
  cellHighlight?: { row: number; col: number }[]
  animation?: 'pulse' | 'glow' | 'arrow'
  duration?: number
}

export interface HintUsage {
  basic: number
  intermediate: number
  advanced: number
  total: number
  lastHintTime?: number
}

export interface HintContext {
  // For Sudoku
  grid?: (number | null)[][]
  row?: number
  col?: number
  
  // For Pattern
  pattern?: (number | null)[]
  index?: number
  
  // For Spatial
  state?: any
  shapeId?: string
  
  // Common
  level?: HintLevel
}

export interface FormattedHint {
  title: string
  content: string
  visual?: string
  steps?: string[]
  interactive?: boolean
  highlight?: any
}

export interface HintHistory {
  [puzzleId: string]: {
    basic: number
    intermediate: number
    advanced: number
    lastCell?: string // For tracking progressive hints per cell
  }
}

// Hint penalties for scoring
export const HINT_PENALTIES = {
  basic: 10,
  intermediate: 20,
  advanced: 30
} as const

// Hint cooldown in milliseconds
export const HINT_COOLDOWN = 30000 // 30 seconds

// Maximum hints per level before forcing next level
export const MAX_HINTS_PER_LEVEL = {
  basic: 3,
  intermediate: 2,
  advanced: Infinity
} as const