// Tutorial System Types

export interface TutorialStep {
  id: string
  title: string
  content: string
  target?: string // CSS selector for element to highlight
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center'
  action?: 'click' | 'hover' | 'input' | 'none'
  waitForAction?: boolean
  ariaLabel?: string
  image?: string
  video?: string
  customClass?: string
}

export interface TutorialProgress {
  currentStep: number
  totalSteps: number
  context: string
  startedAt: string
  lastUpdated: string
  completedSteps: string[]
}

export interface TutorialTooltip {
  element: HTMLElement
  step: TutorialStep
  position: { x: number; y: number }
  arrow?: HTMLElement
}

export interface TutorialStatistics {
  totalSteps: number
  completedSteps: number
  skippedSteps: number
  timeSpent: number // in seconds
  completedSections: string[]
  lastAccessed: string
}

export type TutorialContext = 
  | 'game-selection'
  | 'sudoku-game'
  | 'pattern-game'
  | 'spatial-game'
  | 'settings'
  | 'profile'
  | 'achievements'
  | 'leaderboard'

export interface TutorialOptions {
  skipButton?: boolean
  progressBar?: boolean
  backdrop?: boolean
  closeOnClickOutside?: boolean
  keyboardNavigation?: boolean
  animationDuration?: number
}

// Tutorial step definitions
export const TUTORIAL_STEPS: Record<TutorialContext, TutorialStep[]> = {
  'game-selection': [
    {
      id: 'welcome',
      title: 'Welcome to Puzzlator!',
      content: 'Let me show you around. This is where you select and start puzzles.',
      position: 'center'
    },
    {
      id: 'puzzle-types',
      title: 'Choose Your Puzzle Type',
      content: 'We have various puzzle types including Sudoku, Pattern Matching, and Spatial puzzles. Click any to select it.',
      target: '.puzzle-types',
      position: 'bottom',
      action: 'click'
    },
    {
      id: 'difficulty',
      title: 'Select Difficulty',
      content: 'Choose your preferred difficulty level. Start with Easy if you\'re new!',
      target: '.difficulty-selector',
      position: 'bottom',
      action: 'click'
    },
    {
      id: 'generate',
      title: 'Generate a Puzzle',
      content: 'Click this button to create a new puzzle with your selected type and difficulty.',
      target: '.generate-button',
      position: 'top',
      action: 'click',
      waitForAction: true
    },
    {
      id: 'navigation',
      title: 'Explore More',
      content: 'Check out the Leaderboard to see top players, or visit your Profile to track progress.',
      target: '.leaderboard-link',
      position: 'bottom'
    }
  ],
  
  'sudoku-game': [
    {
      id: 'game-intro',
      title: 'Sudoku 4x4',
      content: 'Fill the grid so each row, column, and 2x2 box contains numbers 1-4.',
      position: 'center'
    },
    {
      id: 'select-cell',
      title: 'Select a Cell',
      content: 'Click any empty cell to select it.',
      target: '#phaser-game',
      position: 'center',
      action: 'click'
    },
    {
      id: 'enter-number',
      title: 'Enter a Number',
      content: 'Type a number (1-4) or click the number buttons to fill the selected cell.',
      target: '#phaser-game',
      position: 'center'
    },
    {
      id: 'hints',
      title: 'Need Help?',
      content: 'Click the hint button or press H to get a hint. Hints will help you but reduce your score.',
      target: '.control-btn[title*="Hint"]',
      position: 'bottom'
    },
    {
      id: 'undo-redo',
      title: 'Made a Mistake?',
      content: 'Use Undo (Ctrl+Z) and Redo (Ctrl+Y) to correct mistakes.',
      target: '.control-btn[title*="Undo"]',
      position: 'bottom'
    },
    {
      id: 'timer',
      title: 'Track Your Time',
      content: 'Your time is tracked here. Try to complete puzzles quickly for a better score!',
      target: '.stat-item:has(.Clock)',
      position: 'bottom'
    }
  ],
  
  'pattern-game': [
    {
      id: 'pattern-intro',
      title: 'Pattern Matching',
      content: 'Find the pattern and complete the sequence.',
      position: 'center'
    },
    {
      id: 'analyze',
      title: 'Analyze the Pattern',
      content: 'Look at the given values to identify the rule or pattern.',
      target: '.pattern-display',
      position: 'bottom'
    },
    {
      id: 'submit',
      title: 'Submit Your Answer',
      content: 'Enter the missing values and submit when ready.',
      target: '.submit-button',
      position: 'top'
    }
  ],
  
  'spatial-game': [
    {
      id: 'spatial-intro',
      title: 'Spatial Puzzle',
      content: 'Fit all shapes into the grid without overlapping.',
      position: 'center'
    },
    {
      id: 'drag-drop',
      title: 'Drag and Drop',
      content: 'Drag shapes from the panel and drop them onto the grid.',
      target: '.shape-panel',
      position: 'right'
    },
    {
      id: 'rotation',
      title: 'Rotate Shapes',
      content: 'Right-click or press R to rotate shapes (in harder difficulties).',
      target: '.control-btn[title*="Rotate"]',
      position: 'bottom'
    }
  ],
  
  'settings': [
    {
      id: 'settings-intro',
      title: 'Customize Your Experience',
      content: 'Adjust game settings to your preferences.',
      position: 'center'
    },
    {
      id: 'theme',
      title: 'Theme Selection',
      content: 'Choose between Light, Dark, or Auto theme.',
      target: 'select[value*="theme"]',
      position: 'left'
    },
    {
      id: 'difficulty',
      title: 'Default Difficulty',
      content: 'Set your preferred starting difficulty for new puzzles.',
      target: 'select[value*="difficulty"]',
      position: 'left'
    },
    {
      id: 'hints',
      title: 'Hint Settings',
      content: 'Configure how hints work in your games.',
      target: '.hint-settings',
      position: 'left'
    }
  ],
  
  'profile': [
    {
      id: 'profile-stats',
      title: 'Your Statistics',
      content: 'Track your progress, scores, and achievements here.',
      target: '.stats-grid',
      position: 'bottom'
    },
    {
      id: 'achievements',
      title: 'Achievements',
      content: 'View your unlocked achievements and progress towards new ones.',
      target: '.achievements-section',
      position: 'top'
    }
  ],
  
  'achievements': [
    {
      id: 'achievement-types',
      title: 'Achievement Categories',
      content: 'Achievements are grouped by category: Gameplay, Mastery, Speed, and more.',
      target: '.achievement-categories',
      position: 'bottom'
    },
    {
      id: 'progress',
      title: 'Track Progress',
      content: 'See your progress towards each achievement.',
      target: '.achievement-progress',
      position: 'bottom'
    }
  ],
  
  'leaderboard': [
    {
      id: 'leaderboard-intro',
      title: 'Compete with Others',
      content: 'See how you rank against other players.',
      position: 'center'
    },
    {
      id: 'filters',
      title: 'Filter Results',
      content: 'Filter by puzzle type, difficulty, or time period.',
      target: '.leaderboard-filters',
      position: 'bottom'
    }
  ]
}