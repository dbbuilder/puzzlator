import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSettingsStore } from '../settings'
import { DEFAULT_SETTINGS } from '@/types/settings'

// Mock supabase
vi.mock('@/config/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      })),
      upsert: vi.fn(() => Promise.resolve({ error: null }))
    }))
  }
}))

// Mock auth store
vi.mock('../auth', () => ({
  useAuthStore: vi.fn(() => ({
    user: { id: 'test-user-id' },
    isAuthenticated: true
  }))
}))

describe('Settings Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    // Clear localStorage
    localStorage.clear()
    // Reset DOM
    document.documentElement.classList.remove('light', 'dark')
    // Use fake timers
    vi.useFakeTimers()
    
    // Mock matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
        onchange: null,
        addListener: vi.fn(), // deprecated
        removeListener: vi.fn(), // deprecated
      }))
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('initializes with default settings', () => {
    const store = useSettingsStore()
    
    expect(store.settings).toEqual(DEFAULT_SETTINGS)
    expect(store.isLoading).toBe(false)
    expect(store.isSaving).toBe(false)
    expect(store.lastSaved).toBe(null)
  })

  describe('Settings Updates', () => {
    it('updates game settings', () => {
      const store = useSettingsStore()
      
      store.updateGameSettings({ 
        defaultDifficulty: 'hard',
        enableSound: false 
      })
      
      expect(store.gameSettings.defaultDifficulty).toBe('hard')
      expect(store.gameSettings.enableSound).toBe(false)
      expect(store.gameSettings.showTimer).toBe(true) // Unchanged
    })

    it('updates UI settings', () => {
      const store = useSettingsStore()
      
      store.updateUISettings({ 
        theme: 'dark',
        fontSize: 'large' 
      })
      
      expect(store.uiSettings.theme).toBe('dark')
      expect(store.uiSettings.fontSize).toBe('large')
    })

    it('updates notification settings', () => {
      const store = useSettingsStore()
      
      store.updateNotificationSettings({ 
        showAchievements: false 
      })
      
      expect(store.notificationSettings.showAchievements).toBe(false)
      expect(store.notificationSettings.showLevelUp).toBe(true) // Unchanged
    })

    it('updates privacy settings', () => {
      const store = useSettingsStore()
      
      store.updatePrivacySettings({ 
        profileVisibility: 'private',
        showInLeaderboard: false 
      })
      
      expect(store.privacySettings.profileVisibility).toBe('private')
      expect(store.privacySettings.showInLeaderboard).toBe(false)
    })
  })

  describe('Theme Management', () => {
    it('applies light theme', () => {
      const store = useSettingsStore()
      
      store.updateUISettings({ theme: 'light' })
      store.applyTheme()
      
      expect(document.documentElement.classList.contains('light')).toBe(true)
      expect(document.documentElement.classList.contains('dark')).toBe(false)
    })

    it('applies dark theme', () => {
      const store = useSettingsStore()
      
      store.updateUISettings({ theme: 'dark' })
      store.applyTheme()
      
      expect(document.documentElement.classList.contains('dark')).toBe(true)
      expect(document.documentElement.classList.contains('light')).toBe(false)
    })

    it('handles auto theme based on system preference', () => {
      // Mock dark mode preference
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-color-scheme: dark)',
          media: query,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
        }))
      })
      
      const store = useSettingsStore()
      store.updateUISettings({ theme: 'auto' })
      
      expect(store.theme).toBe('dark')
    })
  })

  describe('Reset Functionality', () => {
    it('resets all settings to defaults', () => {
      const store = useSettingsStore()
      
      // Change some settings
      store.updateGameSettings({ defaultDifficulty: 'expert' })
      store.updateUISettings({ theme: 'dark' })
      
      // Reset all
      store.resetSettings()
      
      expect(store.settings).toEqual(DEFAULT_SETTINGS)
    })

    it('resets specific section to defaults', () => {
      const store = useSettingsStore()
      
      // Change game settings
      store.updateGameSettings({ 
        defaultDifficulty: 'expert',
        enableSound: false 
      })
      
      // Reset only game settings
      store.resetSection('gameSettings')
      
      expect(store.gameSettings).toEqual(DEFAULT_SETTINGS.gameSettings)
    })
  })

  describe('Local Storage', () => {
    it('saves settings to localStorage', () => {
      const store = useSettingsStore()
      
      store.updateGameSettings({ defaultDifficulty: 'hard' })
      
      // Wait for debounced save
      vi.advanceTimersByTime(100)
      
      const saved = localStorage.getItem('puzzlator_settings')
      expect(saved).toBeTruthy()
      
      const parsed = JSON.parse(saved!)
      expect(parsed.gameSettings.defaultDifficulty).toBe('hard')
    })

    it('loads settings from localStorage', () => {
      // Pre-populate localStorage
      const customSettings = {
        ...DEFAULT_SETTINGS,
        gameSettings: {
          ...DEFAULT_SETTINGS.gameSettings,
          defaultDifficulty: 'expert'
        }
      }
      localStorage.setItem('puzzlator_settings', JSON.stringify(customSettings))
      
      const store = useSettingsStore()
      
      expect(store.gameSettings.defaultDifficulty).toBe('expert')
    })
  })

  describe('Database Integration', () => {
    it('loads settings from database', async () => {
      const mockData = {
        game_settings: { defaultDifficulty: 'hard' },
        ui_settings: { theme: 'dark' },
        notification_settings: DEFAULT_SETTINGS.notificationSettings,
        privacy_settings: DEFAULT_SETTINGS.privacySettings,
        updated_at: new Date().toISOString()
      }

      const { supabase } = await import('@/config/supabase')
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: mockData, error: null }))
          }))
        })),
        upsert: vi.fn()
      } as any)
      
      const store = useSettingsStore()
      await store.loadSettings()
      
      expect(store.gameSettings.defaultDifficulty).toBe('hard')
      expect(store.uiSettings.theme).toBe('dark')
      expect(store.lastSaved).toBeInstanceOf(Date)
    })

    it('saves settings to database', async () => {
      const store = useSettingsStore()
      
      store.updateGameSettings({ defaultDifficulty: 'hard' })
      
      await store.saveSettings()
      
      const { supabase } = await import('@/config/supabase')
      expect(supabase.from).toHaveBeenCalledWith('user_settings')
      expect(store.lastSaved).toBeInstanceOf(Date)
    })
  })
})