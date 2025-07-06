export interface Block {
  x: number
  y: number
}

export interface Shape {
  id: string
  blocks: Block[]
  color: string
}

export interface PlacedShape {
  shape: Shape
  x: number
  y: number
  rotation?: number
}

export interface SpatialPuzzleState {
  gridSize: number
  grid: (string | null)[][]
  shapesToPlace: Shape[]
  placedShapes: PlacedShape[]
  allowRotation: boolean
  moves: number
  hintsUsed: number
  startTime: number | null
  endTime: number | null
}

export interface SpatialHint {
  message: string
  shapeId?: string
  position?: { x: number; y: number }
  rotation?: number
}

export type SpatialDifficulty = 'easy' | 'medium' | 'hard' | 'expert'

// Common tetromino shapes
export const TETROMINO_SHAPES = {
  I: [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 2, y: 0 },
    { x: 3, y: 0 }
  ],
  O: [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: 1, y: 1 }
  ],
  T: [
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: 1, y: 1 },
    { x: 2, y: 1 }
  ],
  S: [
    { x: 1, y: 0 },
    { x: 2, y: 0 },
    { x: 0, y: 1 },
    { x: 1, y: 1 }
  ],
  Z: [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 1, y: 1 },
    { x: 2, y: 1 }
  ],
  J: [
    { x: 0, y: 0 },
    { x: 0, y: 1 },
    { x: 1, y: 1 },
    { x: 2, y: 1 }
  ],
  L: [
    { x: 2, y: 0 },
    { x: 0, y: 1 },
    { x: 1, y: 1 },
    { x: 2, y: 1 }
  ]
}

// Simple shapes for easier difficulties
export const SIMPLE_SHAPES = {
  DOT: [
    { x: 0, y: 0 }
  ],
  LINE2: [
    { x: 0, y: 0 },
    { x: 1, y: 0 }
  ],
  LINE3: [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 2, y: 0 }
  ],
  CORNER: [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 0, y: 1 }
  ]
}

// Complex shapes for harder difficulties
export const COMPLEX_SHAPES = {
  PLUS: [
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: 1, y: 1 },
    { x: 2, y: 1 },
    { x: 1, y: 2 }
  ],
  U: [
    { x: 0, y: 0 },
    { x: 2, y: 0 },
    { x: 0, y: 1 },
    { x: 1, y: 1 },
    { x: 2, y: 1 }
  ],
  STAIRS: [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 1, y: 1 },
    { x: 2, y: 1 },
    { x: 2, y: 2 }
  ],
  ZIGZAG: [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 1, y: 1 },
    { x: 2, y: 1 },
    { x: 2, y: 2 },
    { x: 3, y: 2 }
  ]
}

// Shape colors
export const SHAPE_COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#FFA07A', // Light Salmon
  '#98D8C8', // Mint
  '#F7DC6F', // Yellow
  '#BB8FCE', // Purple
  '#85C1F2'  // Light Blue
]