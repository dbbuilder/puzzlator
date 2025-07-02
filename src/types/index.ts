// Core game types and interfaces

export interface User {
  id: string
  username: string
  displayName?: string
  avatarUrl?: string
  skillLevel: number
  totalExperience: number
  preferredDifficulty: 'easy' | 'medium' | 'hard' | 'expert'
  favoritePuzzleTypes: string[]
  settings: UserSettings
  createdAt: string
  updatedAt: string
}

export interface UserSettings {
  theme: 'dark' | 'light' | 'auto'
  soundEnabled: boolean
  animationsEnabled: boolean
  hintsEnabled: boolean
  autoSave: boolean
  notifications: {
    dailyChallenge: boolean
    achievements: boolean
    leaderboard: boolean
  }
}

export interface PuzzleType {
  id: string
  name: string
  description: string
  category: 'logic' | 'spatial' | 'pattern' | 'sequence' | 'deduction'
  difficultyRange: {
    min: number
    max: number
  }
  aiPromptTemplate: string
  validationSchema: Record<string, any>
  uiComponent: string
  isActive: boolean
  createdAt: string
}

export interface Puzzle {
  id: string
  puzzleTypeId: string
  title: string
  description: string
  difficulty: number // 1-10
  theme: string
  content: PuzzleContent
  solution: PuzzleSolution
  hints: PuzzleHint[]
  metadata: PuzzleMetadata
  createdBy?: string
  isAiGenerated: boolean
  qualityScore?: number
  playCount: number
  successRate: number
  averageSolveTime?: number
  createdAt: string
  updatedAt: string
}

export interface PuzzleContent {
  // Dynamic content structure based on puzzle type
  [key: string]: any
}

export interface PuzzleSolution {
  // Solution data structure
  [key: string]: any
}

export interface PuzzleHint {
  id: string
  text: string
  difficulty: 'easy' | 'medium' | 'hard'
  unlockCost?: number
  order: number
}

export interface PuzzleMetadata {
  generationTime?: number
  promptUsed?: string
  aiModel?: string
  tokensUsed?: number
  validationResults?: {
    solvable: boolean
    difficulty: number
    qualityScore: number
  }
}

export interface GameSession {
  id: string
  userId: string
  puzzleId: string
  status: 'in_progress' | 'completed' | 'abandoned'
  currentState?: GameState
  movesHistory: GameMove[]
  hintsUsed: number
  startTime: string
  endTime?: string
  solveTime?: number
  score?: number
  isBestTime: boolean
  createdAt: string
}

export interface GameState {
  // Current puzzle state - dynamic based on puzzle type
  [key: string]: any
}

export interface GameMove {
  id: string
  timestamp: string
  type: string
  data: Record<string, any>
  isUndo?: boolean
}

export interface Achievement {
  id: string
  name: string
  description: string
  category: 'first_solve' | 'streak' | 'speed' | 'difficulty' | 'special'
  iconUrl?: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  requirements: AchievementRequirements
  rewardExperience: number
  isHidden: boolean
  createdAt: string
}

export interface AchievementRequirements {
  type: string
  target: number
  conditions?: Record<string, any>
}

export interface UserAchievement {
  id: string
  userId: string
  achievementId: string
  earnedAt: string
  progress: Record<string, any>
}

export interface LeaderboardEntry {
  id: string
  userId: string
  puzzleTypeId?: string
  category: 'daily' | 'weekly' | 'monthly' | 'all_time'
  rank: number
  score: number
  additionalMetrics: Record<string, any>
  periodStart: string
  periodEnd: string
  createdAt: string
}

export interface DailyChallenge {
  id: string
  date: string
  puzzleId: string
  bonusExperience: number
  participantCount: number
  bestTime?: number
  bestScore?: number
  createdAt: string
}

export interface PuzzleRating {
  id: string
  userId: string
  puzzleId: string
  rating: number // 1-5
  difficultyRating: number // 1-10
  feedback?: string
  tags: string[]
  createdAt: string
}

// API Response Types
export interface ApiResponse<T = any> {
  data?: T
  error?: ApiError
  meta?: ApiMeta
}

export interface ApiError {
  code: string
  message: string
  details?: Record<string, any>
}

export interface ApiMeta {
  page?: number
  limit?: number
  total?: number
  hasMore?: boolean
}

// Game Engine Types
export interface GameConfig {
  width: number
  height: number
  backgroundColor: string
  physics?: {
    default: string
    [key: string]: any
  }
  scale?: {
    mode: number
    autoCenter: number
    width: number
    height: number
  }
}

export interface GameScene extends Phaser.Scene {
  puzzleData?: Puzzle
  gameState?: GameState
  inputHandler?: InputHandler
  uiManager?: UIManager
}

export interface InputHandler {
  enable(): void
  disable(): void
  onPointerDown(pointer: Phaser.Input.Pointer): void
  onPointerMove(pointer: Phaser.Input.Pointer): void
  onPointerUp(pointer: Phaser.Input.Pointer): void
  onKeyDown(event: KeyboardEvent): void
}

export interface UIManager {
  showHint(hint: PuzzleHint): void
  showSuccess(): void
  showError(message: string): void
  updateScore(score: number): void
  updateTimer(time: number): void
}

// AI Generation Types
export interface AIGenerationRequest {
  type: string
  difficulty: number
  theme?: string
  playerPreferences?: {
    favoriteTypes: string[]
    averageSolveTime: number
    preferredComplexity: 'simple' | 'moderate' | 'complex'
  }
}

export interface AIGenerationResponse {
  puzzle: Puzzle
  generationMetadata: {
    promptUsed: string
    tokensUsed: number
    generationTime: number
    model: string
  }
}

// Event Types
export interface GameEvent {
  type: string
  timestamp: string
  data: Record<string, any>
}

export interface PuzzleCompletedEvent extends GameEvent {
  type: 'puzzle_completed'
  data: {
    puzzleId: string
    solveTime: number
    score: number
    hintsUsed: number
  }
}

export interface AchievementUnlockedEvent extends GameEvent {
  type: 'achievement_unlocked'
  data: {
    achievementId: string
    userId: string
  }
}
