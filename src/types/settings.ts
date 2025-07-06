// User Settings Types

export interface UserSettings {
  // Game Settings
  gameSettings: GameSettings
  
  // UI Settings
  uiSettings: UISettings
  
  // Notification Settings
  notificationSettings: NotificationSettings
  
  // Privacy Settings
  privacySettings: PrivacySettings
}

export interface GameSettings {
  // Difficulty preferences
  defaultDifficulty: 'easy' | 'medium' | 'hard' | 'expert'
  autoSelectDifficulty: boolean
  
  // Hint settings
  enableHints: boolean
  hintDelay: number // seconds before hint button appears
  autoHintThreshold: number // minutes before suggesting a hint
  
  // Timer settings
  showTimer: boolean
  pauseOnBlur: boolean // pause when window loses focus
  
  // Sound settings
  enableSound: boolean
  masterVolume: number // 0-100
  effectsVolume: number // 0-100
  musicVolume: number // 0-100
  
  // Game behavior
  confirmBeforeQuit: boolean
  autoSaveInterval: number // seconds
  showMistakeIndicator: boolean
  enableAnimations: boolean
}

export interface UISettings {
  // Theme
  theme: 'light' | 'dark' | 'auto'
  colorScheme: 'default' | 'colorblind' | 'high-contrast'
  
  // Display
  fontSize: 'small' | 'medium' | 'large'
  reducedMotion: boolean
  compactMode: boolean
  
  // Game board
  highlightSelection: boolean
  highlightConflicts: boolean
  showPossibleValues: boolean
  gridStyle: 'default' | 'minimal' | 'classic'
}

export interface NotificationSettings {
  // In-game notifications
  showAchievements: boolean
  showLevelUp: boolean
  showDailyChallenge: boolean
  
  // Push notifications (when PWA is implemented)
  enablePushNotifications: boolean
  dailyChallengeReminder: boolean
  weeklyProgress: boolean
  friendActivity: boolean
}

export interface PrivacySettings {
  // Profile visibility
  profileVisibility: 'public' | 'friends' | 'private'
  showInLeaderboard: boolean
  
  // Statistics sharing
  shareStatistics: boolean
  anonymousAnalytics: boolean
  
  // Social features
  allowFriendRequests: boolean
  allowChallenges: boolean
}

// Default settings
export const DEFAULT_SETTINGS: UserSettings = {
  gameSettings: {
    defaultDifficulty: 'medium',
    autoSelectDifficulty: false,
    enableHints: true,
    hintDelay: 60,
    autoHintThreshold: 10,
    showTimer: true,
    pauseOnBlur: true,
    enableSound: true,
    masterVolume: 70,
    effectsVolume: 80,
    musicVolume: 50,
    confirmBeforeQuit: true,
    autoSaveInterval: 30,
    showMistakeIndicator: true,
    enableAnimations: true,
  },
  uiSettings: {
    theme: 'auto',
    colorScheme: 'default',
    fontSize: 'medium',
    reducedMotion: false,
    compactMode: false,
    highlightSelection: true,
    highlightConflicts: true,
    showPossibleValues: false,
    gridStyle: 'default',
  },
  notificationSettings: {
    showAchievements: true,
    showLevelUp: true,
    showDailyChallenge: true,
    enablePushNotifications: false,
    dailyChallengeReminder: false,
    weeklyProgress: false,
    friendActivity: false,
  },
  privacySettings: {
    profileVisibility: 'public',
    showInLeaderboard: true,
    shareStatistics: true,
    anonymousAnalytics: true,
    allowFriendRequests: true,
    allowChallenges: true,
  },
}