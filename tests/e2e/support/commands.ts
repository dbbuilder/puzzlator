// Custom Cypress commands for testing

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Login with test user credentials
       */
      login(email?: string, password?: string): Chainable<void>
      
      /**
       * Create a test puzzle for testing
       */
      createTestPuzzle(type: string, difficulty: number): Chainable<void>
      
      /**
       * Wait for game canvas to be ready
       */
      waitForGameReady(): Chainable<void>
      
      /**
       * Complete a puzzle for testing progression
       */
      completePuzzle(moves: Array<any>): Chainable<void>
    }
  }
}

// Login command
Cypress.Commands.add('login', (email = 'test@example.com', password = 'testpassword') => {
  cy.visit('/login')
  cy.get('[data-testid="email-input"]').type(email)
  cy.get('[data-testid="password-input"]').type(password)
  cy.get('[data-testid="login-button"]').click()
  cy.url().should('not.include', '/login')
})

// Create test puzzle command
Cypress.Commands.add('createTestPuzzle', (type: string, difficulty: number) => {
  cy.request('POST', '/api/test/create-puzzle', {
    type,
    difficulty,
  }).then((response) => {
    expect(response.status).to.eq(201)
  })
})

// Wait for game canvas to be ready
Cypress.Commands.add('waitForGameReady', () => {
  cy.get('[data-testid="game-canvas"]').should('be.visible')
  cy.get('[data-testid="loading-indicator"]').should('not.exist')
  // Wait for Phaser to initialize
  cy.wait(1000)
})

// Complete puzzle command
Cypress.Commands.add('completePuzzle', (moves: Array<any>) => {
  moves.forEach((move, index) => {
    cy.get(`[data-testid="puzzle-cell-${move.x}-${move.y}"]`).click()
    if (move.value) {
      cy.get('[data-testid="number-input"]').type(move.value.toString())
    }
    cy.wait(100) // Small delay between moves
  })
  
  // Verify puzzle completion
  cy.get('[data-testid="success-message"]').should('be.visible')
})

export {}
