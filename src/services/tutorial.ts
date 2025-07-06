import type { 
  TutorialStep, 
  TutorialProgress, 
  TutorialContext, 
  TutorialTooltip,
  TutorialStatistics,
  TutorialOptions
} from '@/types/tutorial'
import { TUTORIAL_STEPS } from '@/types/tutorial'

export class TutorialService {
  private isActive = false
  private currentStep = 0
  private currentContext: TutorialContext = 'game-selection'
  private startTime: number = 0
  private completedSteps: Set<string> = new Set()
  private completedSections: Set<string> = new Set()
  private activeTooltip: TutorialTooltip | null = null
  private backdrop: HTMLElement | null = null
  private keyboardHandler: ((e: KeyboardEvent) => void) | null = null

  constructor(private options: TutorialOptions = {}) {
    this.options = {
      skipButton: true,
      progressBar: true,
      backdrop: true,
      closeOnClickOutside: false,
      keyboardNavigation: true,
      animationDuration: 300,
      ...options
    }
    
    this.loadProgress()
  }

  /**
   * Check if tutorial should be shown
   */
  shouldShowTutorial(): boolean {
    const completed = localStorage.getItem('puzzlator_tutorial_completed')
    const skipped = localStorage.getItem('puzzlator_tutorial_skipped')
    
    return !completed && !skipped
  }

  /**
   * Get tutorial steps for a specific context
   */
  getTutorialSteps(context: TutorialContext): TutorialStep[] {
    return TUTORIAL_STEPS[context] || []
  }

  /**
   * Start the tutorial
   */
  startTutorial(context: TutorialContext = 'game-selection'): void {
    this.isActive = true
    this.currentContext = context
    this.currentStep = 0
    this.startTime = Date.now()
    
    if (this.options.keyboardNavigation) {
      this.setupKeyboardNavigation()
    }
    
    if (this.options.backdrop) {
      this.createBackdrop()
    }
    
    this.showCurrentStep()
    this.saveProgress()
  }

  /**
   * Get current step index
   */
  getCurrentStep(): number {
    return this.currentStep
  }

  /**
   * Move to next step
   */
  nextStep(): void {
    const steps = this.getTutorialSteps(this.currentContext)
    
    if (this.currentStep < steps.length - 1) {
      this.completedSteps.add(steps[this.currentStep].id)
      this.currentStep++
      this.showCurrentStep()
      this.saveProgress()
    } else {
      this.completeTutorial()
    }
  }

  /**
   * Move to previous step
   */
  previousStep(): void {
    if (this.currentStep > 0) {
      this.currentStep--
      this.showCurrentStep()
      this.saveProgress()
    }
  }

  /**
   * Complete the tutorial
   */
  completeTutorial(): void {
    this.isActive = false
    this.completedSections.add(this.currentContext)
    
    localStorage.setItem('puzzlator_tutorial_completed', new Date().toISOString())
    this.saveProgress()
    
    this.cleanup()
  }

  /**
   * Skip the tutorial
   */
  skipTutorial(): void {
    this.isActive = false
    localStorage.setItem('puzzlator_tutorial_skipped', 'true')
    
    this.cleanup()
  }

  /**
   * Check if tutorial is completed
   */
  isCompleted(): boolean {
    return localStorage.getItem('puzzlator_tutorial_completed') !== null
  }

  /**
   * Check if tutorial is active
   */
  isActive(): boolean {
    return this.isActive
  }

  /**
   * Resume tutorial from saved progress
   */
  resumeTutorial(): void {
    const progress = this.loadProgress()
    
    if (progress) {
      this.currentStep = progress.currentStep
      this.currentContext = progress.context as TutorialContext
      this.isActive = true
      this.startTime = Date.now()
      
      if (this.options.keyboardNavigation) {
        this.setupKeyboardNavigation()
      }
      
      if (this.options.backdrop) {
        this.createBackdrop()
      }
      
      this.showCurrentStep()
    }
  }

  /**
   * Reset tutorial progress
   */
  resetTutorial(): void {
    this.currentStep = 0
    this.isActive = false
    this.completedSteps.clear()
    this.completedSections.clear()
    
    localStorage.removeItem('puzzlator_tutorial_completed')
    localStorage.removeItem('puzzlator_tutorial_progress')
    localStorage.removeItem('puzzlator_tutorial_skipped')
    
    this.cleanup()
  }

  /**
   * Get tutorial progress percentage
   */
  getProgress(): number {
    const steps = this.getTutorialSteps(this.currentContext)
    if (steps.length === 0) return 0
    
    return (this.currentStep / steps.length) * 100
  }

  /**
   * Complete a section
   */
  completeSection(section: string): void {
    this.completedSections.add(section)
    this.saveProgress()
  }

  /**
   * Get completed sections
   */
  getCompletedSections(): string[] {
    return Array.from(this.completedSections)
  }

  /**
   * Get tutorial statistics
   */
  getStatistics(): TutorialStatistics {
    const allSteps = Object.values(TUTORIAL_STEPS).flat()
    const timeSpent = this.isActive ? Math.floor((Date.now() - this.startTime) / 1000) : 0
    
    return {
      totalSteps: allSteps.length,
      completedSteps: this.completedSteps.size,
      skippedSteps: 0, // TODO: Track skipped steps
      timeSpent,
      completedSections: Array.from(this.completedSections),
      lastAccessed: new Date().toISOString()
    }
  }

  /**
   * Highlight an element
   */
  highlightElement(step: TutorialStep): void {
    if (!step.target) return
    
    const element = document.querySelector(step.target) as HTMLElement
    if (!element) return
    
    // Add highlight class
    element.classList.add('tutorial-highlight')
    
    // Scroll into view
    element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    
    // Create tooltip
    if (this.activeTooltip) {
      this.removeTooltip()
    }
    
    this.activeTooltip = this.createTooltip(step)
    this.positionTooltip(this.activeTooltip, element, step.position || 'bottom')
  }

  /**
   * Create a tooltip
   */
  createTooltip(step: TutorialStep): TutorialTooltip {
    const tooltip = document.createElement('div')
    tooltip.className = 'tutorial-tooltip'
    if (step.customClass) {
      tooltip.classList.add(step.customClass)
    }
    
    // Title
    const title = document.createElement('h3')
    title.className = 'tutorial-tooltip-title'
    title.textContent = step.title
    tooltip.appendChild(title)
    
    // Content
    const content = document.createElement('p')
    content.className = 'tutorial-tooltip-content'
    content.textContent = step.content
    tooltip.appendChild(content)
    
    // Progress
    if (this.options.progressBar) {
      const progress = this.createProgressBar()
      tooltip.appendChild(progress)
    }
    
    // Actions
    const actions = document.createElement('div')
    actions.className = 'tutorial-tooltip-actions'
    
    if (this.currentStep > 0) {
      const prevButton = document.createElement('button')
      prevButton.className = 'tutorial-btn tutorial-btn-secondary'
      prevButton.textContent = 'Previous'
      prevButton.onclick = () => this.previousStep()
      actions.appendChild(prevButton)
    }
    
    const nextButton = document.createElement('button')
    nextButton.className = 'tutorial-btn tutorial-btn-primary'
    nextButton.textContent = this.isLastStep() ? 'Finish' : 'Next'
    nextButton.onclick = () => this.nextStep()
    actions.appendChild(nextButton)
    
    if (this.options.skipButton) {
      const skipButton = document.createElement('button')
      skipButton.className = 'tutorial-btn tutorial-btn-text'
      skipButton.textContent = 'Skip Tutorial'
      skipButton.onclick = () => this.skipTutorial()
      actions.appendChild(skipButton)
    }
    
    tooltip.appendChild(actions)
    
    // Arrow
    const arrow = document.createElement('div')
    arrow.className = 'tutorial-tooltip-arrow'
    tooltip.appendChild(arrow)
    
    // Add to DOM
    document.body.appendChild(tooltip)
    
    return {
      element: tooltip,
      step,
      position: { x: 0, y: 0 },
      arrow
    }
  }

  /**
   * Wait for user action
   */
  async waitForAction(step: TutorialStep): Promise<boolean> {
    if (!step.waitForAction || !step.target || !step.action) {
      return Promise.resolve(true)
    }
    
    return new Promise((resolve) => {
      const element = document.querySelector(step.target!)
      if (!element) {
        resolve(false)
        return
      }
      
      const handler = () => {
        element.removeEventListener(step.action!, handler)
        resolve(true)
      }
      
      element.addEventListener(step.action!, handler)
    })
  }

  /**
   * Handle keyboard navigation
   */
  handleKeyboard(event: KeyboardEvent): void {
    if (!this.isActive) return
    
    switch (event.key) {
      case 'ArrowRight':
        event.preventDefault()
        this.nextStep()
        break
      case 'ArrowLeft':
        event.preventDefault()
        this.previousStep()
        break
      case 'Escape':
        event.preventDefault()
        this.skipTutorial()
        break
    }
  }

  /**
   * Get screen reader announcement
   */
  getScreenReaderAnnouncement(step: TutorialStep): string {
    const steps = this.getTutorialSteps(this.currentContext)
    const stepNumber = this.currentStep + 1
    const totalSteps = steps.length
    
    return step.ariaLabel || `Tutorial step ${stepNumber} of ${totalSteps}: ${step.title}. ${step.content}`
  }

  /**
   * Private helper methods
   */
  private showCurrentStep(): void {
    const steps = this.getTutorialSteps(this.currentContext)
    const step = steps[this.currentStep]
    
    if (!step) return
    
    // Remove previous highlighting
    document.querySelectorAll('.tutorial-highlight').forEach(el => {
      el.classList.remove('tutorial-highlight')
    })
    
    // Highlight new element
    this.highlightElement(step)
    
    // Announce for screen readers
    this.announceStep(step)
  }

  private isLastStep(): boolean {
    const steps = this.getTutorialSteps(this.currentContext)
    return this.currentStep === steps.length - 1
  }

  private createProgressBar(): HTMLElement {
    const container = document.createElement('div')
    container.className = 'tutorial-progress'
    
    const bar = document.createElement('div')
    bar.className = 'tutorial-progress-bar'
    bar.style.width = `${this.getProgress()}%`
    
    container.appendChild(bar)
    return container
  }

  private positionTooltip(tooltip: TutorialTooltip, target: HTMLElement, position: string): void {
    const tooltipRect = tooltip.element.getBoundingClientRect()
    const targetRect = target.getBoundingClientRect()
    
    let x = 0
    let y = 0
    
    switch (position) {
      case 'top':
        x = targetRect.left + (targetRect.width - tooltipRect.width) / 2
        y = targetRect.top - tooltipRect.height - 10
        break
      case 'bottom':
        x = targetRect.left + (targetRect.width - tooltipRect.width) / 2
        y = targetRect.bottom + 10
        break
      case 'left':
        x = targetRect.left - tooltipRect.width - 10
        y = targetRect.top + (targetRect.height - tooltipRect.height) / 2
        break
      case 'right':
        x = targetRect.right + 10
        y = targetRect.top + (targetRect.height - tooltipRect.height) / 2
        break
      case 'center':
        x = (window.innerWidth - tooltipRect.width) / 2
        y = (window.innerHeight - tooltipRect.height) / 2
        break
    }
    
    // Keep tooltip within viewport
    x = Math.max(10, Math.min(x, window.innerWidth - tooltipRect.width - 10))
    y = Math.max(10, Math.min(y, window.innerHeight - tooltipRect.height - 10))
    
    tooltip.element.style.left = `${x}px`
    tooltip.element.style.top = `${y}px`
    tooltip.position = { x, y }
    
    // Position arrow
    if (tooltip.arrow && position !== 'center') {
      tooltip.arrow.className = `tutorial-tooltip-arrow tutorial-tooltip-arrow-${position}`
    }
  }

  private removeTooltip(): void {
    if (this.activeTooltip) {
      this.activeTooltip.element.remove()
      this.activeTooltip = null
    }
  }

  private createBackdrop(): void {
    this.backdrop = document.createElement('div')
    this.backdrop.className = 'tutorial-backdrop'
    
    if (this.options.closeOnClickOutside) {
      this.backdrop.onclick = () => this.skipTutorial()
    }
    
    document.body.appendChild(this.backdrop)
  }

  private removeBackdrop(): void {
    if (this.backdrop) {
      this.backdrop.remove()
      this.backdrop = null
    }
  }

  private setupKeyboardNavigation(): void {
    this.keyboardHandler = (e: KeyboardEvent) => this.handleKeyboard(e)
    window.addEventListener('keydown', this.keyboardHandler)
  }

  private removeKeyboardNavigation(): void {
    if (this.keyboardHandler) {
      window.removeEventListener('keydown', this.keyboardHandler)
      this.keyboardHandler = null
    }
  }

  private announceStep(step: TutorialStep): void {
    const announcement = this.getScreenReaderAnnouncement(step)
    
    // Create invisible announcement element
    const announcer = document.createElement('div')
    announcer.className = 'sr-only'
    announcer.setAttribute('role', 'status')
    announcer.setAttribute('aria-live', 'polite')
    announcer.textContent = announcement
    
    document.body.appendChild(announcer)
    
    // Remove after announcement
    setTimeout(() => announcer.remove(), 1000)
  }

  private saveProgress(): void {
    const progress: TutorialProgress = {
      currentStep: this.currentStep,
      totalSteps: this.getTutorialSteps(this.currentContext).length,
      context: this.currentContext,
      startedAt: new Date(this.startTime).toISOString(),
      lastUpdated: new Date().toISOString(),
      completedSteps: Array.from(this.completedSteps)
    }
    
    localStorage.setItem('puzzlator_tutorial_progress', JSON.stringify(progress))
  }

  private loadProgress(): TutorialProgress | null {
    try {
      const saved = localStorage.getItem('puzzlator_tutorial_progress')
      if (saved) {
        const progress = JSON.parse(saved) as TutorialProgress
        this.completedSteps = new Set(progress.completedSteps)
        return progress
      }
    } catch (error) {
      console.error('Failed to load tutorial progress:', error)
    }
    return null
  }

  private cleanup(): void {
    this.removeTooltip()
    this.removeBackdrop()
    this.removeKeyboardNavigation()
    
    document.querySelectorAll('.tutorial-highlight').forEach(el => {
      el.classList.remove('tutorial-highlight')
    })
  }
}