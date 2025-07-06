import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as Sentry from '@sentry/vue'
import { initSentry, setSentryUser, addBreadcrumb, captureError, captureMessage } from '../sentry'

// Mock Sentry
vi.mock('@sentry/vue', () => ({
  init: vi.fn(),
  setUser: vi.fn(),
  addBreadcrumb: vi.fn(),
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  getCurrentHub: vi.fn(() => ({
    getScope: vi.fn(() => ({
      getTransaction: vi.fn()
    }))
  })),
  withScope: vi.fn((callback) => {
    callback({
      setContext: vi.fn()
    })
  }),
  vueRouterInstrumentation: vi.fn()
}))

vi.mock('@sentry/tracing', () => ({
  BrowserTracing: vi.fn()
}))

describe('Sentry Configuration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset env
    import.meta.env.VITE_SENTRY_DSN = ''
  })

  describe('initSentry', () => {
    it('should not initialize when no DSN is provided', () => {
      initSentry({
        app: {} as any,
        enabled: true
      })

      expect(Sentry.init).not.toHaveBeenCalled()
    })

    it('should initialize with proper config when DSN is provided', () => {
      import.meta.env.VITE_SENTRY_DSN = 'https://test@sentry.io/123'
      
      const mockApp = {} as any
      const mockRouter = {} as any

      initSentry({
        app: mockApp,
        router: mockRouter,
        enabled: true
      })

      expect(Sentry.init).toHaveBeenCalledWith(
        expect.objectContaining({
          app: mockApp,
          dsn: 'https://test@sentry.io/123',
          environment: 'test',
          tracesSampleRate: 1.0,
          release: undefined // __APP_VERSION__ is not defined in tests
        })
      )
    })

    it('should not initialize when enabled is false', () => {
      import.meta.env.VITE_SENTRY_DSN = 'https://test@sentry.io/123'
      
      initSentry({
        app: {} as any,
        enabled: false
      })

      expect(Sentry.init).not.toHaveBeenCalled()
    })

    it('should use custom DSN when provided', () => {
      const customDsn = 'https://custom@sentry.io/456'
      
      initSentry({
        app: {} as any,
        dsn: customDsn,
        enabled: true
      })

      expect(Sentry.init).toHaveBeenCalledWith(
        expect.objectContaining({
          dsn: customDsn
        })
      )
    })

    it('should configure proper error filtering', () => {
      import.meta.env.VITE_SENTRY_DSN = 'https://test@sentry.io/123'
      
      initSentry({
        app: {} as any,
        enabled: true
      })

      const config = (Sentry.init as any).mock.calls[0][0]
      expect(config.ignoreErrors).toContain('ResizeObserver loop limit exceeded')
      expect(config.ignoreErrors).toContain('Network request failed')
    })
  })

  describe('setSentryUser', () => {
    beforeEach(() => {
      import.meta.env.VITE_SENTRY_DSN = 'https://test@sentry.io/123'
    })

    it('should set user context when user is provided', () => {
      const user = {
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser'
      }

      setSentryUser(user)

      expect(Sentry.setUser).toHaveBeenCalledWith({
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser'
      })
    })

    it('should clear user context when null is provided', () => {
      setSentryUser(null)

      expect(Sentry.setUser).toHaveBeenCalledWith(null)
    })

    it('should not call setUser when no DSN', () => {
      import.meta.env.VITE_SENTRY_DSN = ''
      
      setSentryUser({ id: 'test' })

      expect(Sentry.setUser).not.toHaveBeenCalled()
    })
  })

  describe('addBreadcrumb', () => {
    beforeEach(() => {
      import.meta.env.VITE_SENTRY_DSN = 'https://test@sentry.io/123'
    })

    it('should add breadcrumb with proper format', () => {
      const data = { puzzleId: '123' }
      
      addBreadcrumb('Puzzle started', 'game', data)

      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
        message: 'Puzzle started',
        category: 'game',
        level: 'info',
        data,
        timestamp: expect.any(Number)
      })
    })

    it('should not add breadcrumb when no DSN', () => {
      import.meta.env.VITE_SENTRY_DSN = ''
      
      addBreadcrumb('Test', 'test')

      expect(Sentry.addBreadcrumb).not.toHaveBeenCalled()
    })
  })

  describe('captureError', () => {
    beforeEach(() => {
      import.meta.env.VITE_SENTRY_DSN = 'https://test@sentry.io/123'
    })

    it('should capture error with context', () => {
      const error = new Error('Test error')
      const context = { component: 'TestComponent' }

      captureError(error, context)

      expect(Sentry.withScope).toHaveBeenCalled()
      expect(Sentry.captureException).toHaveBeenCalledWith(error)
    })

    it('should not capture error when no DSN', () => {
      import.meta.env.VITE_SENTRY_DSN = ''
      
      captureError(new Error('Test'))

      expect(Sentry.captureException).not.toHaveBeenCalled()
    })
  })

  describe('captureMessage', () => {
    beforeEach(() => {
      import.meta.env.VITE_SENTRY_DSN = 'https://test@sentry.io/123'
    })

    it('should capture message with level', () => {
      captureMessage('Test message', 'warning')

      expect(Sentry.captureMessage).toHaveBeenCalledWith('Test message', 'warning')
    })

    it('should use info level by default', () => {
      captureMessage('Test message')

      expect(Sentry.captureMessage).toHaveBeenCalledWith('Test message', 'info')
    })

    it('should not capture message when no DSN', () => {
      import.meta.env.VITE_SENTRY_DSN = ''
      
      captureMessage('Test')

      expect(Sentry.captureMessage).not.toHaveBeenCalled()
    })
  })
})