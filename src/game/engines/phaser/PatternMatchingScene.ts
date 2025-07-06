import Phaser from 'phaser'
import { PatternMatchingPuzzle } from '@/game/puzzles/logic/PatternMatching'
import type { PatternItem } from '@/game/puzzles/logic/types'

export class PatternMatchingScene extends Phaser.Scene {
  private puzzle!: PatternMatchingPuzzle
  private patternElements: Phaser.GameObjects.Container[] = []
  private selectedIndex: number | null = null
  private inputPanel!: Phaser.GameObjects.Container
  private hintText!: Phaser.GameObjects.Text
  private feedbackText!: Phaser.GameObjects.Text
  
  // Colors for different pattern types
  private readonly colors = {
    red: 0xff0000,
    blue: 0x0000ff,
    green: 0x00ff00,
    yellow: 0xffff00,
    purple: 0x800080,
    orange: 0xffa500
  }
  
  // Shapes mapping
  private readonly shapeVertices = {
    circle: 0,
    square: 4,
    triangle: 3,
    star: 5,
    pentagon: 5,
    hexagon: 6
  }

  constructor() {
    super({ key: 'PatternMatchingScene' })
  }

  init(data: { puzzle: PatternMatchingPuzzle }) {
    this.puzzle = data.puzzle
    this.selectedIndex = null
    this.patternElements = []
  }

  create() {
    // Set background
    this.cameras.main.setBackgroundColor('#f0f0f0')
    
    // Create title
    this.add.text(this.scale.width / 2, 50, 'Pattern Matching', {
      fontSize: '32px',
      color: '#333',
      fontFamily: 'Arial'
    }).setOrigin(0.5)
    
    // Create pattern display
    this.createPatternDisplay()
    
    // Create input panel
    this.createInputPanel()
    
    // Create hint area
    this.createHintArea()
    
    // Create feedback area
    this.createFeedbackArea()
    
    // Set up keyboard input
    this.setupKeyboardInput()
  }

  private createPatternDisplay() {
    const state = this.puzzle.getState()
    const pattern = state.pattern
    const hiddenIndices = state.hiddenIndices
    const revealedIndices = state.revealedIndices
    
    const startX = 100
    const startY = 200
    const spacing = 120
    const itemsPerRow = 6
    
    pattern.forEach((item, index) => {
      const x = startX + (index % itemsPerRow) * spacing
      const y = startY + Math.floor(index / itemsPerRow) * spacing
      
      const container = this.add.container(x, y)
      
      // Create background
      const bg = this.add.rectangle(0, 0, 100, 100, 0xffffff)
        .setStrokeStyle(3, 0x333333)
      
      container.add(bg)
      
      // Check if this position is hidden
      const isHidden = hiddenIndices.includes(index)
      const isRevealed = revealedIndices.includes(index)
      
      if (!isHidden || isRevealed) {
        // Show the pattern item
        const element = this.createPatternElement(item, 0, 0)
        container.add(element)
      } else {
        // Show question mark for hidden items
        const questionMark = this.add.text(0, 0, '?', {
          fontSize: '48px',
          color: '#999',
          fontFamily: 'Arial'
        }).setOrigin(0.5)
        
        container.add(questionMark)
        
        // Make it interactive
        bg.setInteractive()
          .on('pointerdown', () => this.selectPosition(index))
          .on('pointerover', () => bg.setFillStyle(0xe0e0e0))
          .on('pointerout', () => {
            if (this.selectedIndex !== index) {
              bg.setFillStyle(0xffffff)
            }
          })
      }
      
      // Add index label
      const indexLabel = this.add.text(0, -60, `${index + 1}`, {
        fontSize: '14px',
        color: '#666',
        fontFamily: 'Arial'
      }).setOrigin(0.5)
      
      container.add(indexLabel)
      
      this.patternElements.push(container)
    })
  }

  private createPatternElement(item: PatternItem, x: number, y: number): Phaser.GameObjects.GameObject {
    if (typeof item === 'number') {
      // Create number text
      return this.add.text(x, y, item.toString(), {
        fontSize: '36px',
        color: '#333',
        fontFamily: 'Arial',
        fontStyle: 'bold'
      }).setOrigin(0.5)
    } else if (typeof item === 'string') {
      // Check if it's a color
      if (item in this.colors) {
        // Create colored circle
        return this.add.circle(x, y, 30, this.colors[item as keyof typeof this.colors])
      } else if (item in this.shapeVertices) {
        // Create shape
        return this.createShape(item, x, y)
      } else {
        // Create letter/text
        return this.add.text(x, y, item, {
          fontSize: '36px',
          color: '#333',
          fontFamily: 'Arial',
          fontStyle: 'bold'
        }).setOrigin(0.5)
      }
    }
    
    // Fallback
    return this.add.text(x, y, '?', {
      fontSize: '36px',
      color: '#999',
      fontFamily: 'Arial'
    }).setOrigin(0.5)
  }

  private createShape(shape: string, x: number, y: number): Phaser.GameObjects.GameObject {
    const vertices = this.shapeVertices[shape as keyof typeof this.shapeVertices] || 4
    
    if (shape === 'circle') {
      return this.add.circle(x, y, 30, 0x333333)
    } else if (shape === 'star') {
      // Create star shape
      const star = this.add.star(x, y, 5, 15, 30, 0x333333)
      return star
    } else {
      // Create polygon
      const polygon = this.add.polygon(x, y, this.getPolygonPoints(vertices, 30), 0x333333)
      return polygon
    }
  }

  private getPolygonPoints(vertices: number, radius: number): number[] {
    const points: number[] = []
    const angleStep = (Math.PI * 2) / vertices
    
    for (let i = 0; i < vertices; i++) {
      const angle = angleStep * i - Math.PI / 2
      points.push(Math.cos(angle) * radius)
      points.push(Math.sin(angle) * radius)
    }
    
    return points
  }

  private createInputPanel() {
    const panelY = 450
    const panelWidth = 600
    const panelHeight = 200
    
    this.inputPanel = this.add.container(this.scale.width / 2, panelY)
    
    // Background
    const bg = this.add.rectangle(0, 0, panelWidth, panelHeight, 0xffffff)
      .setStrokeStyle(2, 0x333333)
    
    this.inputPanel.add(bg)
    
    // Title
    const title = this.add.text(0, -80, 'Select Answer:', {
      fontSize: '20px',
      color: '#333',
      fontFamily: 'Arial'
    }).setOrigin(0.5)
    
    this.inputPanel.add(title)
    
    // This will be populated based on pattern type
    this.updateInputOptions()
  }

  private updateInputOptions() {
    // Clear existing options
    const toRemove = this.inputPanel.list.filter(child => 
      child !== this.inputPanel.list[0] && child !== this.inputPanel.list[1]
    )
    toRemove.forEach(child => child.destroy())
    
    const state = this.puzzle.getState()
    const patternType = state.patternType
    
    if (patternType === 'numeric' || patternType === 'arithmetic' || patternType === 'geometric') {
      // Create number pad
      this.createNumberPad()
    } else if (patternType === 'shapes') {
      // Create shape options
      this.createShapeOptions()
    } else if (patternType === 'colors') {
      // Create color options
      this.createColorOptions()
    } else {
      // Mixed - create both numbers and letters
      this.createMixedOptions()
    }
  }

  private createNumberPad() {
    const startX = -200
    const startY = -20
    const spacing = 60
    
    // Create number buttons 0-9
    for (let i = 0; i < 10; i++) {
      const x = startX + (i % 5) * spacing
      const y = startY + Math.floor(i / 5) * spacing
      
      const button = this.add.container(x, y)
      
      const bg = this.add.circle(0, 0, 25, 0xffffff)
        .setStrokeStyle(2, 0x333333)
        .setInteractive()
      
      const text = this.add.text(0, 0, i.toString(), {
        fontSize: '24px',
        color: '#333',
        fontFamily: 'Arial'
      }).setOrigin(0.5)
      
      button.add([bg, text])
      
      bg.on('pointerdown', () => this.submitAnswer(i))
        .on('pointerover', () => bg.setFillStyle(0xe0e0e0))
        .on('pointerout', () => bg.setFillStyle(0xffffff))
      
      this.inputPanel.add(button)
    }
    
    // Add larger number inputs
    const largeNumbers = [10, 20, 50, 100]
    largeNumbers.forEach((num, index) => {
      const x = 100 + (index % 2) * 80
      const y = startY + Math.floor(index / 2) * 40
      
      const button = this.add.container(x, y)
      
      const bg = this.add.rectangle(0, 0, 60, 30, 0xffffff)
        .setStrokeStyle(2, 0x333333)
        .setInteractive()
      
      const text = this.add.text(0, 0, num.toString(), {
        fontSize: '18px',
        color: '#333',
        fontFamily: 'Arial'
      }).setOrigin(0.5)
      
      button.add([bg, text])
      
      bg.on('pointerdown', () => this.submitAnswer(num))
        .on('pointerover', () => bg.setFillStyle(0xe0e0e0))
        .on('pointerout', () => bg.setFillStyle(0xffffff))
      
      this.inputPanel.add(button)
    })
  }

  private createShapeOptions() {
    const shapes = ['circle', 'square', 'triangle', 'star', 'pentagon', 'hexagon']
    const startX = -250
    const spacing = 80
    
    shapes.forEach((shape, index) => {
      const x = startX + index * spacing
      const y = 0
      
      const button = this.add.container(x, y)
      
      const bg = this.add.rectangle(0, 0, 60, 60, 0xffffff)
        .setStrokeStyle(2, 0x333333)
        .setInteractive()
      
      const shapeObj = this.createShape(shape, 0, 0)
      
      button.add([bg, shapeObj])
      
      bg.on('pointerdown', () => this.submitAnswer(shape))
        .on('pointerover', () => bg.setFillStyle(0xe0e0e0))
        .on('pointerout', () => bg.setFillStyle(0xffffff))
      
      this.inputPanel.add(button)
    })
  }

  private createColorOptions() {
    const colors = Object.keys(this.colors)
    const startX = -250
    const spacing = 80
    
    colors.forEach((color, index) => {
      const x = startX + index * spacing
      const y = 0
      
      const button = this.add.container(x, y)
      
      const bg = this.add.rectangle(0, 0, 60, 60, 0xffffff)
        .setStrokeStyle(2, 0x333333)
        .setInteractive()
      
      const colorCircle = this.add.circle(0, 0, 25, this.colors[color as keyof typeof this.colors])
      
      button.add([bg, colorCircle])
      
      bg.on('pointerdown', () => this.submitAnswer(color))
        .on('pointerover', () => bg.setFillStyle(0xe0e0e0))
        .on('pointerout', () => bg.setFillStyle(0xffffff))
      
      this.inputPanel.add(button)
    })
  }

  private createMixedOptions() {
    // Create both numbers and letters
    this.createNumberPad()
    
    // Add letter options
    const letters = ['A', 'B', 'C']
    const startX = 200
    const startY = -20
    
    letters.forEach((letter, index) => {
      const x = startX
      const y = startY + index * 40
      
      const button = this.add.container(x, y)
      
      const bg = this.add.rectangle(0, 0, 50, 30, 0xffffff)
        .setStrokeStyle(2, 0x333333)
        .setInteractive()
      
      const text = this.add.text(0, 0, letter, {
        fontSize: '20px',
        color: '#333',
        fontFamily: 'Arial'
      }).setOrigin(0.5)
      
      button.add([bg, text])
      
      bg.on('pointerdown', () => this.submitAnswer(letter))
        .on('pointerover', () => bg.setFillStyle(0xe0e0e0))
        .on('pointerout', () => bg.setFillStyle(0xffffff))
      
      this.inputPanel.add(button)
    })
  }

  private createHintArea() {
    this.hintText = this.add.text(this.scale.width / 2, 350, '', {
      fontSize: '18px',
      color: '#666',
      fontFamily: 'Arial',
      align: 'center',
      wordWrap: { width: 600 }
    }).setOrigin(0.5)
  }

  private createFeedbackArea() {
    this.feedbackText = this.add.text(this.scale.width / 2, 600, '', {
      fontSize: '24px',
      color: '#333',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5)
  }

  private setupKeyboardInput() {
    // Number keys
    for (let i = 0; i <= 9; i++) {
      this.input.keyboard?.on(`keydown-${i}`, () => {
        if (this.selectedIndex !== null) {
          this.submitAnswer(i)
        }
      })
    }
    
    // Letter keys
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    for (const letter of letters) {
      this.input.keyboard?.on(`keydown-${letter}`, () => {
        if (this.selectedIndex !== null) {
          this.submitAnswer(letter)
        }
      })
    }
    
    // Hint key
    this.input.keyboard?.on('keydown-H', () => {
      this.requestHint()
    })
  }

  private selectPosition(index: number) {
    // Deselect previous
    if (this.selectedIndex !== null) {
      const prevContainer = this.patternElements[this.selectedIndex]
      const prevBg = prevContainer.list[0] as Phaser.GameObjects.Rectangle
      prevBg.setFillStyle(0xffffff)
    }
    
    // Select new
    this.selectedIndex = index
    const container = this.patternElements[index]
    const bg = container.list[0] as Phaser.GameObjects.Rectangle
    bg.setFillStyle(0xe0e0e0)
    
    // Clear feedback
    this.feedbackText.setText('')
  }

  private submitAnswer(answer: PatternItem) {
    if (this.selectedIndex === null) {
      this.showFeedback('Please select a position first!', 0xff0000)
      return
    }
    
    const isCorrect = this.puzzle.validateAnswer(this.selectedIndex, answer)
    
    if (isCorrect) {
      // Update display
      this.updatePatternElement(this.selectedIndex, answer)
      
      // Show success feedback
      this.showFeedback('Correct!', 0x00ff00)
      
      // Check if puzzle is complete
      if (this.puzzle.isComplete()) {
        this.showCompletion()
      } else {
        // Auto-select next hidden position
        this.selectNextHidden()
      }
    } else {
      // Show error feedback
      this.showFeedback('Try again!', 0xff0000)
      
      // Shake the element
      this.shakeElement(this.patternElements[this.selectedIndex])
    }
  }

  private updatePatternElement(index: number, value: PatternItem) {
    const container = this.patternElements[index]
    
    // Remove question mark
    const toRemove = container.list.filter((child, i) => i > 1)
    toRemove.forEach(child => child.destroy())
    
    // Add the revealed element
    const element = this.createPatternElement(value, 0, 0)
    container.add(element)
    
    // Deselect
    const bg = container.list[0] as Phaser.GameObjects.Rectangle
    bg.setFillStyle(0xffffff)
    bg.removeInteractive()
  }

  private selectNextHidden() {
    const state = this.puzzle.getState()
    const hiddenIndices = state.hiddenIndices
    const revealedIndices = state.revealedIndices
    
    // Find next unrevealed position
    const nextHidden = hiddenIndices.find(index => !revealedIndices.includes(index))
    
    if (nextHidden !== undefined) {
      this.selectPosition(nextHidden)
    } else {
      this.selectedIndex = null
    }
  }

  private requestHint() {
    const hint = this.puzzle.getHint(this.selectedIndex || undefined)
    
    if (hint) {
      this.puzzle.useHint()
      this.hintText.setText(hint.message)
      
      if (hint.possibleValues) {
        this.hintText.setText(hint.message + '\n' + hint.possibleValues.join(', '))
      }
      
      // Clear hint after 5 seconds
      this.time.delayedCall(5000, () => {
        this.hintText.setText('')
      })
    }
  }

  private showFeedback(message: string, color: number) {
    this.feedbackText.setText(message).setColor(`#${color.toString(16).padStart(6, '0')}`)
    
    // Clear after 2 seconds
    this.time.delayedCall(2000, () => {
      this.feedbackText.setText('')
    })
  }

  private shakeElement(element: Phaser.GameObjects.Container) {
    const originalX = element.x
    
    this.tweens.add({
      targets: element,
      x: originalX + 10,
      duration: 50,
      yoyo: true,
      repeat: 3,
      onComplete: () => {
        element.x = originalX
      }
    })
  }

  private showCompletion() {
    // Stop timer
    this.puzzle.stopTimer()
    
    // Calculate score
    const score = this.puzzle.calculateScore()
    
    // Show completion message
    const completionText = this.add.text(this.scale.width / 2, this.scale.height / 2, 
      `Pattern Complete!\n\nScore: ${score}\nTime: ${this.puzzle.getTimeElapsed()}s\nMistakes: ${this.puzzle.getMistakes()}`, {
      fontSize: '32px',
      color: '#333',
      fontFamily: 'Arial',
      align: 'center',
      backgroundColor: '#ffffff',
      padding: { x: 40, y: 30 }
    }).setOrigin(0.5)
    
    // Add continue button
    const continueButton = this.add.text(this.scale.width / 2, this.scale.height / 2 + 150, 'Continue', {
      fontSize: '24px',
      color: '#fff',
      fontFamily: 'Arial',
      backgroundColor: '#4CAF50',
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5).setInteractive()
    
    continueButton.on('pointerdown', () => {
      this.events.emit('puzzle-complete', { score, puzzle: this.puzzle })
    })
  }
  
  updateFromPuzzleState() {
    // Update the display based on current puzzle state
    const state = this.puzzle.getState()
    state.revealedIndices.forEach(index => {
      if (!this.patternElements[index].list.some(child => child !== this.patternElements[index].list[0])) {
        this.updatePatternElement(index, state.pattern[index])
      }
    })
  }
}