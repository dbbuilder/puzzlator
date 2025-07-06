/**
 * Types for logic puzzles
 */

export type PatternType = 'numeric' | 'shapes' | 'colors' | 'mixed' | 'arithmetic' | 'geometric'

export type ShapeType = 'circle' | 'square' | 'triangle' | 'star' | 'pentagon' | 'hexagon'

export type ColorType = 'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'orange'

export type PatternItem = number | ShapeType | ColorType | string

export interface PatternRule {
  type: 'arithmetic' | 'geometric' | 'fibonacci' | 'alternating' | 'custom'
  operation?: 'add' | 'subtract' | 'multiply' | 'divide'
  value?: number
  values?: PatternItem[]
  customFunction?: (prev: PatternItem[], index: number) => PatternItem
}

export interface PatternMatchingState {
  pattern: PatternItem[]
  hiddenIndices: number[]
  revealedIndices: number[]
  rules: PatternRule[]
  currentIndex: number
  completed: boolean
  patternType: PatternType
}

export interface PatternHint {
  type: 'pattern-type' | 'rule' | 'value' | 'position'
  message: string
  possibleValues?: PatternItem[]
}