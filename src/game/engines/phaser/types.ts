/**
 * Types for Phaser game engine integration
 */

export interface SceneConfig {
  gridSize: number
  cellSize: number
  gridPadding: number
  colors: {
    background: number
    grid: number
    gridBold: number
    cell: number
    cellLocked: number
    cellHover: number
    cellSelected: number
    cellError: number
    text: string
    textLocked: string
    error: number
    success: number
  }
  fonts: {
    cell: string
    ui: string
  }
  animations: {
    placementDuration: number
    errorDuration: number
    completionDuration: number
  }
}

export interface GridBounds {
  x: number
  y: number
  width: number
  height: number
  centerX: number
  centerY: number
}

export interface CellPosition {
  row: number
  col: number
}

export interface CellRectangle extends Phaser.GameObjects.Rectangle {
  cellData?: {
    row: number
    col: number
  }
}

export interface CellText extends Phaser.GameObjects.Text {
  cellData?: {
    row: number
    col: number
    locked: boolean
  }
}

export interface NumberInputPanel {
  visible: boolean
  x: number
  y: number
  buttons: NumberButton[]
  background: Phaser.GameObjects.Rectangle
}

export interface NumberButton {
  value: number | null
  text: Phaser.GameObjects.Text
  background: Phaser.GameObjects.Rectangle
}

export interface Animation {
  duration: number
  type: 'placement' | 'error' | 'shake' | 'celebration'
  complete: () => Promise<void>
}

export interface PuzzleSceneEvents {
  'cell:click': (position: CellPosition) => void
  'cell:hover': (position: CellPosition) => void
  'move:make': (move: any) => void
  'puzzle:completed': () => void
  'scene:resize': () => void
}