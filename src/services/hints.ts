import type { 
  PuzzleHint, 
  HintLevel, 
  HintContext, 
  HintUsage, 
  FormattedHint,
  HintHistory,
  HintResult
} from '@/types/hints'
import { HINT_PENALTIES, HINT_COOLDOWN, MAX_HINTS_PER_LEVEL } from '@/types/hints'

export class HintService {
  private hintHistory: HintHistory = {}
  private cellHintCount: Map<string, Map<string, number>> = new Map()

  constructor() {
    this.loadHintHistory()
  }

  /**
   * Get a hint for a specific puzzle type and context
   */
  getHint(puzzleType: string, context: HintContext): PuzzleHint | null {
    switch (puzzleType) {
      case 'sudoku':
        return this.getSudokuHint(context)
      case 'pattern':
        return this.getPatternHint(context)
      case 'spatial':
        return this.getSpatialHint(context)
      default:
        return null
    }
  }

  /**
   * Get a progressive hint that increases in detail with each request
   */
  getProgressiveHint(puzzleId: string, puzzleType: string, context: HintContext): HintResult | null {
    // Determine hint level based on previous usage
    const cellKey = this.getCellKey(puzzleType, context)
    const cellHints = this.getCellHintCount(puzzleId, cellKey)
    
    let level: HintLevel = 'basic'
    if (cellHints >= MAX_HINTS_PER_LEVEL.basic) {
      level = 'intermediate'
    }
    if (cellHints >= MAX_HINTS_PER_LEVEL.basic + MAX_HINTS_PER_LEVEL.intermediate) {
      level = 'advanced'
    }

    // Get hint with determined level
    const hint = this.getHint(puzzleType, { ...context, level })
    
    if (hint) {
      // Track usage
      this.trackHintUsage(puzzleId, level)
      this.incrementCellHintCount(puzzleId, cellKey)
      
      // Add result metadata
      return {
        ...hint,
        level,
        animation: this.getAnimationForLevel(level),
        duration: this.getDurationForLevel(level)
      }
    }
    
    return null
  }

  /**
   * Get Sudoku-specific hints
   */
  private getSudokuHint(context: HintContext): PuzzleHint | null {
    const { grid, row, col, level = 'basic' } = context
    
    if (!grid || row === undefined || col === undefined) return null
    
    // Don't provide hints for filled cells
    if (grid[row][col] !== null) return null
    
    const possibleValues = this.getSudokuPossibleValues(grid, row, col)
    
    switch (level) {
      case 'basic':
        return {
          type: 'possibleValues',
          level: 'basic',
          possibleValues,
          message: `This cell can contain: ${possibleValues.join(', ')}. Look for a value that doesn't appear in the same row, column, or 2x2 box.`
        }
        
      case 'intermediate':
        const eliminated = this.getSudokuEliminatedValues(grid, row, col)
        return {
          type: 'elimination',
          level: 'intermediate',
          possibleValues,
          eliminatedValues: eliminated.values,
          reason: eliminated.reason,
          message: `Values ${eliminated.values.join(', ')} are eliminated because they appear in the same ${eliminated.reason}.`
        }
        
      case 'advanced':
        const technique = this.getSudokuTechnique(grid, row, col, possibleValues)
        return {
          type: 'technique',
          level: 'advanced',
          technique: technique.name,
          steps: technique.steps,
          possibleValues: [technique.value],
          message: `Using ${technique.name}: This cell must be ${technique.value}.`
        }
    }
  }

  /**
   * Get Pattern matching hints
   */
  private getPatternHint(context: HintContext): PuzzleHint | null {
    const { pattern, index, level = 'basic' } = context
    
    if (!pattern || index === undefined) return null
    if (pattern[index] !== null) return null
    
    const rule = this.detectPatternRule(pattern)
    const nextValue = this.calculateNextPatternValue(pattern, index, rule)
    
    switch (level) {
      case 'basic':
        return {
          type: 'nextValue',
          level: 'basic',
          value: nextValue,
          message: `The next value in this pattern is ${nextValue}.`
        }
        
      case 'intermediate':
        return {
          type: 'rule',
          level: 'intermediate',
          rule: rule.description,
          explanation: rule.explanation,
          value: nextValue,
          message: `Pattern rule: ${rule.description}. ${rule.explanation}`
        }
        
      case 'advanced':
        const fullSequence = this.generateFullSequence(pattern, rule)
        return {
          type: 'sequence',
          level: 'advanced',
          fullSequence,
          formula: rule.formula,
          message: `Complete sequence: ${fullSequence.join(', ')}. Formula: ${rule.formula}`
        }
    }
  }

  /**
   * Get Spatial puzzle hints
   */
  private getSpatialHint(context: HintContext): PuzzleHint | null {
    const { state, shapeId, level = 'basic' } = context
    
    if (!state) return null
    
    switch (level) {
      case 'basic':
        if (!shapeId) return null
        const position = this.findBestPlacement(state, shapeId)
        return {
          type: 'placement',
          level: 'basic',
          position,
          message: `Try placing this shape at position (${position.x}, ${position.y}).`
        }
        
      case 'intermediate':
        if (!shapeId) return null
        const rotation = this.findBestRotation(state, shapeId)
        return {
          type: 'rotation',
          level: 'intermediate',
          rotation: rotation.angle,
          visualGuide: rotation.guide,
          message: `Rotate the shape ${rotation.angle}° for a better fit.`
        }
        
      case 'advanced':
        const strategy = this.getSpatialStrategy(state)
        return {
          type: 'strategy',
          level: 'advanced',
          strategy: strategy.name,
          steps: strategy.steps,
          message: `Strategy: ${strategy.name}. ${strategy.description}`
        }
    }
  }

  /**
   * Sudoku helper methods
   */
  private getSudokuPossibleValues(grid: (number | null)[][], row: number, col: number): number[] {
    const used = new Set<number>()
    
    // Check row
    for (let c = 0; c < 4; c++) {
      if (grid[row][c] !== null) used.add(grid[row][c]!)
    }
    
    // Check column
    for (let r = 0; r < 4; r++) {
      if (grid[r][col] !== null) used.add(grid[r][col]!)
    }
    
    // Check 2x2 box
    const boxRow = Math.floor(row / 2) * 2
    const boxCol = Math.floor(col / 2) * 2
    for (let r = boxRow; r < boxRow + 2; r++) {
      for (let c = boxCol; c < boxCol + 2; c++) {
        if (grid[r][c] !== null) used.add(grid[r][c]!)
      }
    }
    
    // Return possible values
    return [1, 2, 3, 4].filter(n => !used.has(n))
  }

  private getSudokuEliminatedValues(grid: (number | null)[][], row: number, col: number) {
    const eliminated = []
    const reasons = []
    
    // Check each value 1-4
    for (let value = 1; value <= 4; value++) {
      // Check row
      for (let c = 0; c < 4; c++) {
        if (grid[row][c] === value) {
          eliminated.push(value)
          reasons.push('row')
          break
        }
      }
      
      // Check column
      for (let r = 0; r < 4; r++) {
        if (grid[r][col] === value && !eliminated.includes(value)) {
          eliminated.push(value)
          reasons.push('column')
          break
        }
      }
      
      // Check box
      const boxRow = Math.floor(row / 2) * 2
      const boxCol = Math.floor(col / 2) * 2
      for (let r = boxRow; r < boxRow + 2; r++) {
        for (let c = boxCol; c < boxCol + 2; c++) {
          if (grid[r][c] === value && !eliminated.includes(value)) {
            eliminated.push(value)
            reasons.push('box')
            break
          }
        }
      }
    }
    
    return {
      values: eliminated,
      reason: reasons[0] || 'constraint'
    }
  }

  private getSudokuTechnique(
    grid: (number | null)[][], 
    row: number, 
    col: number, 
    possibleValues: number[]
  ) {
    // Simple technique: if only one possible value
    if (possibleValues.length === 1) {
      return {
        name: 'Naked Single',
        value: possibleValues[0],
        steps: [
          'Check all values in the row',
          'Check all values in the column', 
          'Check all values in the 2x2 box',
          `Only ${possibleValues[0]} is possible`
        ]
      }
    }
    
    // Hidden single technique
    for (const value of possibleValues) {
      // Check if this is the only place in row where value can go
      let rowCount = 0
      for (let c = 0; c < 4; c++) {
        if (grid[row][c] === null && this.getSudokuPossibleValues(grid, row, c).includes(value)) {
          rowCount++
        }
      }
      if (rowCount === 1) {
        return {
          name: 'Hidden Single (Row)',
          value,
          steps: [
            `Look at row ${row + 1}`,
            `Check where ${value} can be placed`,
            `Only this cell can contain ${value} in this row`
          ]
        }
      }
    }
    
    // Default to first possible value
    return {
      name: 'Process of Elimination',
      value: possibleValues[0],
      steps: [
        'Eliminate values that appear in the same row',
        'Eliminate values that appear in the same column',
        'Eliminate values that appear in the same box',
        `The remaining value is ${possibleValues[0]}`
      ]
    }
  }

  /**
   * Pattern helper methods
   */
  private detectPatternRule(pattern: (number | null)[]) {
    const values = pattern.filter(v => v !== null) as number[]
    
    if (values.length < 2) {
      return {
        type: 'unknown',
        description: 'Not enough values',
        explanation: 'Need at least 2 values to detect pattern',
        formula: 'Unknown'
      }
    }
    
    // Check arithmetic progression
    const diff = values[1] - values[0]
    let isArithmetic = true
    for (let i = 2; i < values.length; i++) {
      if (values[i] - values[i - 1] !== diff) {
        isArithmetic = false
        break
      }
    }
    
    if (isArithmetic) {
      return {
        type: 'arithmetic',
        description: `+${diff}`,
        explanation: `Each value increases by ${diff}`,
        formula: `n + ${diff}`
      }
    }
    
    // Check geometric progression
    if (values[0] !== 0) {
      const ratio = values[1] / values[0]
      let isGeometric = true
      for (let i = 2; i < values.length; i++) {
        if (values[i] / values[i - 1] !== ratio) {
          isGeometric = false
          break
        }
      }
      
      if (isGeometric) {
        return {
          type: 'geometric',
          description: `×${ratio}`,
          explanation: `Each value is multiplied by ${ratio}`,
          formula: `n × ${ratio}`
        }
      }
    }
    
    // Default
    return {
      type: 'complex',
      description: 'Complex pattern',
      explanation: 'Pattern follows a more complex rule',
      formula: 'Complex formula'
    }
  }

  private calculateNextPatternValue(pattern: (number | null)[], index: number, rule: any): number {
    const values = pattern.filter(v => v !== null) as number[]
    
    if (rule.type === 'arithmetic' && values.length > 0) {
      const diff = values.length > 1 ? values[1] - values[0] : 2
      const lastKnownIndex = pattern.lastIndexOf(values[values.length - 1])
      const lastValue = values[values.length - 1]
      return lastValue + (diff * (index - lastKnownIndex))
    }
    
    if (rule.type === 'geometric' && values.length > 0) {
      const ratio = values.length > 1 ? values[1] / values[0] : 2
      const lastKnownIndex = pattern.lastIndexOf(values[values.length - 1])
      const lastValue = values[values.length - 1]
      return lastValue * Math.pow(ratio, index - lastKnownIndex)
    }
    
    // Default fallback
    return values[values.length - 1] + 2
  }

  private generateFullSequence(pattern: (number | null)[], rule: any): number[] {
    const result = [...pattern] as number[]
    
    for (let i = 0; i < pattern.length; i++) {
      if (pattern[i] === null) {
        result[i] = this.calculateNextPatternValue(pattern, i, rule)
      }
    }
    
    return result
  }

  /**
   * Spatial helper methods
   */
  private findBestPlacement(state: any, shapeId: string): { x: number; y: number } {
    // Simple heuristic: find first empty space that fits
    const shape = state.shapes.find((s: any) => s.id === shapeId)
    if (!shape) return { x: 0, y: 0 }
    
    for (let y = 0; y < state.grid.length; y++) {
      for (let x = 0; x < state.grid[0].length; x++) {
        if (this.canPlaceShape(state, shape, x, y)) {
          return { x, y }
        }
      }
    }
    
    return { x: 0, y: 0 }
  }

  private canPlaceShape(state: any, shape: any, x: number, y: number): boolean {
    for (const block of shape.blocks) {
      const gridX = x + block.x
      const gridY = y + block.y
      
      if (gridX < 0 || gridX >= state.grid[0].length || 
          gridY < 0 || gridY >= state.grid.length ||
          state.grid[gridY][gridX] !== null) {
        return false
      }
    }
    return true
  }

  private findBestRotation(state: any, shapeId: string): { angle: number; guide: string } {
    // Check which rotation allows the shape to fit
    const rotations = [0, 90, 180, 270]
    
    for (const angle of rotations) {
      // Simplified check - in real implementation would rotate and test
      if (angle === 90) {
        return {
          angle: 90,
          guide: 'Rotate clockwise once'
        }
      }
    }
    
    return {
      angle: 0,
      guide: 'No rotation needed'
    }
  }

  private getSpatialStrategy(state: any) {
    // Analyze the board state and suggest a strategy
    const emptyCount = state.grid.flat().filter((cell: any) => cell === null).length
    const totalCells = state.grid.length * state.grid[0].length
    const fillPercentage = ((totalCells - emptyCount) / totalCells) * 100
    
    if (fillPercentage < 25) {
      return {
        name: 'Corner First',
        description: 'Start by filling corners and edges',
        steps: [
          'Place larger shapes in corners first',
          'Fill edges with medium shapes',
          'Use small shapes to fill gaps'
        ]
      }
    } else if (fillPercentage < 75) {
      return {
        name: 'Gap Filling',
        description: 'Focus on filling large gaps',
        steps: [
          'Identify the largest empty areas',
          'Match shapes to gap sizes',
          'Save small shapes for final gaps'
        ]
      }
    } else {
      return {
        name: 'Precision Placement',
        description: 'Carefully place remaining shapes',
        steps: [
          'Count remaining empty cells',
          'Match shape sizes to gaps',
          'Try different rotations'
        ]
      }
    }
  }

  /**
   * Tracking and management methods
   */
  trackHintUsage(puzzleId: string, level: HintLevel): void {
    if (!this.hintHistory[puzzleId]) {
      this.hintHistory[puzzleId] = { basic: 0, intermediate: 0, advanced: 0 }
    }
    
    this.hintHistory[puzzleId][level]++
    this.hintHistory[puzzleId].lastCell = new Date().toISOString()
    
    this.saveHintHistory()
  }

  getHintUsage(puzzleId: string): HintUsage {
    const history = this.hintHistory[puzzleId] || { basic: 0, intermediate: 0, advanced: 0 }
    
    return {
      basic: history.basic,
      intermediate: history.intermediate,
      advanced: history.advanced,
      total: history.basic + history.intermediate + history.advanced,
      lastHintTime: history.lastCell ? new Date(history.lastCell).getTime() : undefined
    }
  }

  calculateHintPenalty(puzzleId: string): number {
    const usage = this.getHintUsage(puzzleId)
    
    return (
      usage.basic * HINT_PENALTIES.basic +
      usage.intermediate * HINT_PENALTIES.intermediate +
      usage.advanced * HINT_PENALTIES.advanced
    )
  }

  canRequestHint(puzzleId: string): boolean {
    const usage = this.getHintUsage(puzzleId)
    
    if (!usage.lastHintTime) return true
    
    const timeSinceLastHint = Date.now() - usage.lastHintTime
    return timeSinceLastHint >= HINT_COOLDOWN
  }

  formatHint(hint: PuzzleHint): FormattedHint {
    const formatted: FormattedHint = {
      title: this.getHintTitle(hint),
      content: hint.message
    }
    
    // Add visual components based on hint type
    if (hint.possibleValues) {
      formatted.visual = `Possible values: ${hint.possibleValues.join(', ')}`
    }
    
    if (hint.steps) {
      formatted.steps = hint.steps
      formatted.interactive = hint.level === 'advanced'
    }
    
    if (hint.position) {
      formatted.visual = `Position: (${hint.position.x}, ${hint.position.y})`
    }
    
    return formatted
  }

  private getHintTitle(hint: PuzzleHint): string {
    const titles = {
      possibleValues: 'Possible Values',
      elimination: 'Process of Elimination',
      technique: `Solving Technique: ${hint.technique}`,
      nextValue: 'Next Value',
      rule: 'Pattern Rule',
      sequence: 'Complete Sequence',
      placement: 'Placement Suggestion',
      rotation: 'Rotation Hint',
      strategy: 'Strategy Guide'
    }
    
    return titles[hint.type] || 'Hint'
  }

  /**
   * Helper methods
   */
  private getCellKey(puzzleType: string, context: HintContext): string {
    switch (puzzleType) {
      case 'sudoku':
        return `${context.row},${context.col}`
      case 'pattern':
        return `index:${context.index}`
      case 'spatial':
        return context.shapeId || 'general'
      default:
        return 'default'
    }
  }

  private getCellHintCount(puzzleId: string, cellKey: string): number {
    if (!this.cellHintCount.has(puzzleId)) {
      this.cellHintCount.set(puzzleId, new Map())
    }
    
    const puzzleMap = this.cellHintCount.get(puzzleId)!
    return puzzleMap.get(cellKey) || 0
  }

  private incrementCellHintCount(puzzleId: string, cellKey: string): void {
    if (!this.cellHintCount.has(puzzleId)) {
      this.cellHintCount.set(puzzleId, new Map())
    }
    
    const puzzleMap = this.cellHintCount.get(puzzleId)!
    puzzleMap.set(cellKey, (puzzleMap.get(cellKey) || 0) + 1)
  }

  private getAnimationForLevel(level: HintLevel): 'pulse' | 'glow' | 'arrow' {
    const animations = {
      basic: 'pulse' as const,
      intermediate: 'glow' as const,
      advanced: 'arrow' as const
    }
    return animations[level]
  }

  private getDurationForLevel(level: HintLevel): number {
    const durations = {
      basic: 3000,
      intermediate: 5000,
      advanced: 8000
    }
    return durations[level]
  }

  /**
   * Storage methods
   */
  saveHintHistory(): void {
    try {
      localStorage.setItem('puzzlator_hint_history', JSON.stringify(this.hintHistory))
    } catch (error) {
      console.error('Failed to save hint history:', error)
    }
  }

  private loadHintHistory(): void {
    try {
      const saved = localStorage.getItem('puzzlator_hint_history')
      if (saved) {
        this.hintHistory = JSON.parse(saved)
      }
    } catch (error) {
      console.error('Failed to load hint history:', error)
      this.hintHistory = {}
    }
  }
}