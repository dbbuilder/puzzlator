// Cypress E2E support file
import './commands'

// Global before hook
beforeEach(() => {
  // Reset application state before each test
  cy.clearLocalStorage()
  cy.clearCookies()
})

// Handle uncaught exceptions
Cypress.on('uncaught:exception', (err, runnable) => {
  // Returning false here prevents Cypress from failing the test
  // Only for known issues that don't affect functionality
  if (err.message.includes('ResizeObserver loop limit exceeded')) {
    return false
  }
  return true
})
