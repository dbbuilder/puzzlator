describe('AI Puzzle Generation', () => {
  beforeEach(() => {
    // Login as test user
    cy.login('test@example.com', 'testpassword123')
    cy.visit('/game-selection')
  })

  describe('AI Generation Button', () => {
    it('shows AI Generate button when logged in', () => {
      cy.get('.ai-generate-button').should('be.visible')
      cy.get('.ai-generate-button').should('contain', 'AI Generate')
      cy.get('.ai-generate-button svg').should('have.class', 'lucide-sparkles')
    })

    it('disables AI Generate button when not logged in', () => {
      cy.logout()
      cy.visit('/game-selection')
      
      // Select puzzle type and difficulty
      cy.get('.puzzle-types button').first().click()
      cy.get('.difficulty-selector button').first().click()
      
      cy.get('.ai-generate-button')
        .should('have.class', 'cursor-not-allowed')
        .should('have.attr', 'title', 'Login required for AI generation')
    })

    it('shows remaining AI generations in tooltip', () => {
      // Select puzzle type and difficulty
      cy.get('.puzzle-types button').first().click()
      cy.get('.difficulty-selector button').first().click()
      
      cy.get('.ai-generate-button').trigger('mouseenter')
      cy.get('.ai-generate-button').should('have.attr', 'title').and('match', /\(\d+ remaining this hour\)/)
    })
  })

  describe('AI Puzzle Generation Flow', () => {
    it('generates an AI puzzle successfully', () => {
      // Mock the Edge Function response
      cy.intercept('POST', '**/functions/generate-puzzle', {
        statusCode: 200,
        body: {
          success: true,
          puzzle: {
            id: 'ai-puzzle-123',
            type: 'sudoku4x4',
            difficulty: 'medium',
            title: 'AI Sudoku 4x4 - Medium',
            description: 'AI-generated sudoku4x4 puzzle',
            puzzle_data: {
              grid: [
                [1, null, 3, null],
                [null, 4, null, 2],
                [2, null, 4, null],
                [null, 3, null, 1]
              ]
            },
            solution_data: {
              grid: [
                [1, 2, 3, 4],
                [3, 4, 1, 2],
                [2, 1, 4, 3],
                [4, 3, 2, 1]
              ]
            },
            ai_generated: true,
            max_score: 1000,
            hint_penalty: 20,
            created_at: new Date().toISOString()
          },
          hints: [
            {
              level: 'basic',
              text: 'Look for cells with only one possible value',
              target: 'general'
            }
          ]
        }
      }).as('generatePuzzle')

      // Select Sudoku 4x4 and Medium difficulty
      cy.get('.puzzle-types button').contains('Sudoku 4x4').click()
      cy.get('.difficulty-selector button').contains('Medium').click()

      // Click AI Generate button
      cy.get('.ai-generate-button').click()

      // Should show loading state
      cy.get('.fixed').contains('Creating AI-powered puzzle...').should('be.visible')

      // Wait for the request
      cy.wait('@generatePuzzle')

      // Should show success toast
      cy.get('.Vue-Toastification__toast--success').contains('AI puzzle generated successfully!')

      // Should navigate to game
      cy.url().should('include', '/play/ai-puzzle-123')
      
      // Verify puzzle loaded
      cy.get('.game-container').should('be.visible')
    })

    it('handles rate limit exceeded error', () => {
      // Mock rate limit error
      cy.intercept('POST', '**/functions/generate-puzzle', {
        statusCode: 400,
        body: {
          success: false,
          error: 'Rate limit exceeded. Please try again later.'
        }
      }).as('generatePuzzle')

      // Select puzzle type and difficulty
      cy.get('.puzzle-types button').first().click()
      cy.get('.difficulty-selector button').first().click()

      // Click AI Generate button
      cy.get('.ai-generate-button').click()

      // Wait for the request
      cy.wait('@generatePuzzle')

      // Should show error toast
      cy.get('.Vue-Toastification__toast--error').contains('Rate limit exceeded')

      // Should still be on game selection page
      cy.url().should('include', '/game-selection')
    })

    it('handles API failure gracefully', () => {
      // Mock API error
      cy.intercept('POST', '**/functions/generate-puzzle', {
        statusCode: 500,
        body: {
          success: false,
          error: 'Internal server error'
        }
      }).as('generatePuzzle')

      // Select puzzle type and difficulty
      cy.get('.puzzle-types button').first().click()
      cy.get('.difficulty-selector button').first().click()

      // Click AI Generate button
      cy.get('.ai-generate-button').click()

      // Wait for the request
      cy.wait('@generatePuzzle')

      // Should show error toast
      cy.get('.Vue-Toastification__toast--error').contains('Failed to generate AI puzzle')

      // Loading should be hidden
      cy.get('.fixed').should('not.exist')
    })

    it('updates generation count after successful generation', () => {
      // Mock initial stats
      cy.intercept('POST', '**/rest/v1/rpc/get_user_ai_generation_count', {
        statusCode: 200,
        body: 5
      }).as('getGenerationCount')

      // Mock successful generation
      cy.intercept('POST', '**/functions/generate-puzzle', {
        statusCode: 200,
        body: {
          success: true,
          puzzle: {
            id: 'ai-puzzle-456',
            type: 'pattern',
            difficulty: 'easy',
            title: 'AI Pattern - Easy',
            puzzle_data: { sequence: [1, 2, 4, 8, null] },
            solution_data: { answer: 16 },
            ai_generated: true
          }
        }
      }).as('generatePuzzle')

      // Mock updated stats
      cy.intercept('POST', '**/rest/v1/rpc/get_user_ai_generation_count', {
        statusCode: 200,
        body: 6
      }).as('getUpdatedCount')

      cy.visit('/game-selection')
      
      // Select puzzle type and difficulty
      cy.get('.puzzle-types button').contains('Pattern').click()
      cy.get('.difficulty-selector button').contains('Easy').click()

      // Check initial tooltip
      cy.get('.ai-generate-button').should('have.attr', 'title').and('include', '5 remaining this hour')

      // Generate puzzle
      cy.get('.ai-generate-button').click()
      cy.wait('@generatePuzzle')

      // Go back to game selection
      cy.visit('/game-selection')
      cy.wait('@getUpdatedCount')

      // Check updated tooltip
      cy.get('.ai-generate-button').should('have.attr', 'title').and('include', '4 remaining this hour')
    })
  })

  describe('AI Puzzle Gameplay', () => {
    it('plays an AI-generated Sudoku puzzle', () => {
      // Mock AI puzzle in game store
      cy.window().then((win) => {
        const gameStore = win.pinia._s.get('game')
        gameStore.setCurrentPuzzle({
          id: 'ai-sudoku-test',
          type: 'sudoku4x4',
          difficulty: 'medium',
          title: 'AI Sudoku Test',
          puzzle_data: {
            grid: [
              [1, null, null, 4],
              [null, null, 1, null],
              [null, 3, null, null],
              [2, null, null, 3]
            ]
          },
          solution_data: {
            grid: [
              [1, 2, 3, 4],
              [3, 4, 1, 2],
              [4, 3, 2, 1],
              [2, 1, 4, 3]
            ]
          },
          ai_generated: true,
          metadata: {
            estimatedTime: 300,
            techniques: ['hidden singles'],
            difficultyScore: 3.5
          }
        })
      })

      cy.visit('/play/ai-sudoku-test')

      // Verify AI badge is shown
      cy.get('.ai-badge').should('contain', 'AI Generated')

      // Play the puzzle
      cy.get('.sudoku-cell').filter(':empty').first().click()
      cy.get('.number-pad button').contains('2').click()

      // Verify move was recorded
      cy.get('.sudoku-cell').filter(':contains(2)').should('have.length.at.least', 2)
    })

    it('shows AI-specific hints', () => {
      // Mock puzzle with AI hints
      cy.window().then((win) => {
        const gameStore = win.pinia._s.get('game')
        gameStore.setCurrentPuzzle({
          id: 'ai-pattern-test',
          type: 'pattern',
          difficulty: 'hard',
          puzzle_data: {
            sequence: [1, 1, 2, 3, 5, null],
            type: 'numeric'
          },
          solution_data: { answer: 8 },
          ai_generated: true,
          metadata: {
            hints: [
              {
                level: 'basic',
                text: 'This is a famous mathematical sequence',
                target: 'sequence'
              },
              {
                level: 'intermediate',
                text: 'Each number is the sum of the two preceding ones',
                target: 'rule'
              }
            ]
          }
        })
      })

      cy.visit('/play/ai-pattern-test')

      // Request hint
      cy.get('.hint-button').click()

      // Should show AI-provided hint
      cy.get('.hint-display').should('contain', 'This is a famous mathematical sequence')
    })
  })

  describe('AI Puzzle History', () => {
    it('shows AI-generated puzzles in history', () => {
      // Mock puzzles with mix of AI and regular
      cy.intercept('GET', '**/rest/v1/puzzles*', {
        statusCode: 200,
        body: [
          {
            id: 'ai-1',
            type: 'sudoku4x4',
            difficulty: 'easy',
            title: 'AI Sudoku - Easy',
            ai_generated: true,
            created_at: new Date().toISOString()
          },
          {
            id: 'regular-1',
            type: 'pattern',
            difficulty: 'medium',
            title: 'Pattern Puzzle',
            ai_generated: false,
            created_at: new Date().toISOString()
          },
          {
            id: 'ai-2',
            type: 'spatial',
            difficulty: 'hard',
            title: 'AI Spatial - Hard',
            ai_generated: true,
            created_at: new Date().toISOString()
          }
        ]
      }).as('getPuzzles')

      cy.visit('/profile')
      cy.wait('@getPuzzles')

      // Check AI puzzles have special indicator
      cy.get('.puzzle-history-item').contains('AI Sudoku - Easy')
        .parent().find('.ai-indicator').should('be.visible')
      
      cy.get('.puzzle-history-item').contains('Pattern Puzzle')
        .parent().find('.ai-indicator').should('not.exist')
      
      cy.get('.puzzle-history-item').contains('AI Spatial - Hard')
        .parent().find('.ai-indicator').should('be.visible')
    })

    it('filters to show only AI-generated puzzles', () => {
      cy.visit('/profile')

      // Click AI filter
      cy.get('.filter-buttons button').contains('AI Generated').click()

      // Should only show AI puzzles
      cy.get('.puzzle-history-item').each(($item) => {
        cy.wrap($item).find('.ai-indicator').should('be.visible')
      })
    })
  })
})

// Helper commands
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.session([email, password], () => {
    cy.visit('/login')
    cy.get('input[type="email"]').type(email)
    cy.get('input[type="password"]').type(password)
    cy.get('button[type="submit"]').click()
    cy.url().should('include', '/game-selection')
  })
})

Cypress.Commands.add('logout', () => {
  cy.window().then((win) => {
    win.localStorage.clear()
    win.sessionStorage.clear()
  })
})

declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>
      logout(): Chainable<void>
    }
  }
}