import { describe, it, expect, beforeEach, vi } from 'vitest'
import { TutorialService } from '../tutorial'
import type { TutorialStep, TutorialProgress } from '@/types/tutorial'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}
Object.defineProperty(window, 'localStorage', { value: localStorageMock })

describe('TutorialService', () => {
  let tutorialService: TutorialService

  beforeEach(() => {
    vi.clearAllMocks()
    tutorialService = new TutorialService()
  })

  describe('Tutorial Flow', () => {
    it('starts tutorial for first-time users', () => {
      localStorageMock.getItem.mockReturnValue(null)
      
      const shouldShow = tutorialService.shouldShowTutorial()
      expect(shouldShow).toBe(true)
    })

    it('does not show tutorial for returning users', () => {
      localStorageMock.getItem.mockReturnValue('completed')
      
      const shouldShow = tutorialService.shouldShowTutorial()
      expect(shouldShow).toBe(false)
    })

    it('returns tutorial steps in correct order', () => {
      const steps = tutorialService.getTutorialSteps('game-selection')
      
      expect(steps).toBeInstanceOf(Array)
      expect(steps.length).toBeGreaterThan(0)
      expect(steps[0]).toHaveProperty('id')
      expect(steps[0]).toHaveProperty('title')
      expect(steps[0]).toHaveProperty('content')
      expect(steps[0]).toHaveProperty('target')
    })

    it('tracks tutorial progress', () => {
      tutorialService.startTutorial()
      
      expect(tutorialService.getCurrentStep()).toBe(0)
      
      tutorialService.nextStep()
      expect(tutorialService.getCurrentStep()).toBe(1)
      
      tutorialService.previousStep()
      expect(tutorialService.getCurrentStep()).toBe(0)
    })

    it('completes tutorial and saves state', () => {
      tutorialService.startTutorial()
      const steps = tutorialService.getTutorialSteps('game-selection')
      
      // Go through all steps
      for (let i = 0; i < steps.length - 1; i++) {
        tutorialService.nextStep()
      }
      
      tutorialService.completeTutorial()
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'puzzlator_tutorial_completed',
        expect.any(String)
      )
      expect(tutorialService.isCompleted()).toBe(true)
    })
  })

  describe('Context-Specific Tutorials', () => {
    it('provides game selection tutorial steps', () => {
      const steps = tutorialService.getTutorialSteps('game-selection')
      
      const expectedTargets = [
        '.puzzle-types',
        '.difficulty-selector',
        '.generate-button',
        '.leaderboard-link'
      ]
      
      steps.forEach((step, index) => {
        expect(step.target).toBe(expectedTargets[index] || null)
      })
    })

    it('provides in-game tutorial steps', () => {
      const steps = tutorialService.getTutorialSteps('sudoku-game')
      
      expect(steps.some(s => s.title.includes('Select a cell'))).toBe(true)
      expect(steps.some(s => s.title.includes('hints'))).toBe(true)
      expect(steps.some(s => s.title.includes('undo'))).toBe(true)
    })

    it('provides settings tutorial steps', () => {
      const steps = tutorialService.getTutorialSteps('settings')
      
      expect(steps.some(s => s.title.includes('Theme'))).toBe(true)
      expect(steps.some(s => s.title.includes('Difficulty'))).toBe(true)
    })
  })

  describe('Interactive Elements', () => {
    it('highlights target elements', () => {
      const mockElement = document.createElement('div')
      mockElement.className = 'test-element'
      document.body.appendChild(mockElement)
      
      const step: TutorialStep = {
        id: 'test',
        title: 'Test Step',
        content: 'Test content',
        target: '.test-element',
        action: 'click'
      }
      
      tutorialService.highlightElement(step)
      
      expect(mockElement.classList.contains('tutorial-highlight')).toBe(true)
      
      document.body.removeChild(mockElement)
    })

    it('waits for user actions', async () => {
      const step: TutorialStep = {
        id: 'test',
        title: 'Click the button',
        content: 'Please click the button to continue',
        target: '.test-button',
        action: 'click',
        waitForAction: true
      }
      
      const promise = tutorialService.waitForAction(step)
      
      // Simulate user action
      const event = new Event('click')
      document.querySelector('.test-button')?.dispatchEvent(event)
      
      await expect(promise).resolves.toBe(true)
    })

    it('shows tooltips for steps', () => {
      const step: TutorialStep = {
        id: 'test',
        title: 'Tooltip Test',
        content: 'This is a tooltip',
        target: '.test-element',
        position: 'bottom'
      }
      
      const tooltip = tutorialService.createTooltip(step)
      
      expect(tooltip).toHaveProperty('element')
      expect(tooltip.element.textContent).toContain('Tooltip Test')
      expect(tooltip.element.classList.contains('tutorial-tooltip')).toBe(true)
    })
  })

  describe('Skip and Resume', () => {
    it('allows skipping the tutorial', () => {
      tutorialService.startTutorial()
      tutorialService.skipTutorial()
      
      expect(tutorialService.isActive()).toBe(false)
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'puzzlator_tutorial_skipped',
        'true'
      )
    })

    it('resumes tutorial from last position', () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify({
        currentStep: 3,
        context: 'game-selection'
      }))
      
      tutorialService.resumeTutorial()
      
      expect(tutorialService.getCurrentStep()).toBe(3)
      expect(tutorialService.isActive()).toBe(true)
    })

    it('resets tutorial on demand', () => {
      tutorialService.startTutorial()
      tutorialService.nextStep()
      tutorialService.nextStep()
      
      tutorialService.resetTutorial()
      
      expect(tutorialService.getCurrentStep()).toBe(0)
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('puzzlator_tutorial_completed')
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('puzzlator_tutorial_progress')
    })
  })

  describe('Progress Tracking', () => {
    it('returns tutorial progress percentage', () => {
      const steps = tutorialService.getTutorialSteps('game-selection')
      tutorialService.startTutorial()
      
      expect(tutorialService.getProgress()).toBe(0)
      
      tutorialService.nextStep()
      const expectedProgress = (1 / steps.length) * 100
      expect(tutorialService.getProgress()).toBeCloseTo(expectedProgress)
    })

    it('tracks completed tutorial sections', () => {
      tutorialService.completeSection('game-selection')
      tutorialService.completeSection('sudoku-game')
      
      const completed = tutorialService.getCompletedSections()
      expect(completed).toContain('game-selection')
      expect(completed).toContain('sudoku-game')
    })

    it('provides tutorial statistics', () => {
      const stats = tutorialService.getStatistics()
      
      expect(stats).toHaveProperty('totalSteps')
      expect(stats).toHaveProperty('completedSteps')
      expect(stats).toHaveProperty('skippedSteps')
      expect(stats).toHaveProperty('timeSpent')
    })
  })

  describe('Accessibility', () => {
    it('provides keyboard navigation', () => {
      tutorialService.startTutorial()
      
      const event = new KeyboardEvent('keydown', { key: 'ArrowRight' })
      tutorialService.handleKeyboard(event)
      
      expect(tutorialService.getCurrentStep()).toBe(1)
      
      const leftEvent = new KeyboardEvent('keydown', { key: 'ArrowLeft' })
      tutorialService.handleKeyboard(leftEvent)
      
      expect(tutorialService.getCurrentStep()).toBe(0)
    })

    it('announces steps for screen readers', () => {
      const step: TutorialStep = {
        id: 'test',
        title: 'Test Step',
        content: 'Test content',
        ariaLabel: 'Tutorial step 1 of 5: Test Step'
      }
      
      const announcement = tutorialService.getScreenReaderAnnouncement(step)
      expect(announcement).toContain('Tutorial step')
      expect(announcement).toContain('Test Step')
    })
  })
})