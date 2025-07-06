import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { UserSettings, GameSettings, UISettings, NotificationSettings, PrivacySettings } from '@/types/settings'
import { DEFAULT_SETTINGS } from '@/types/settings'
import { supabase } from '@/config/supabase'
import { useAuthStore } from './auth'

export const useSettingsStore = defineStore('settings', () => {
  // State
  const settings = ref<UserSettings>(structuredClone(DEFAULT_SETTINGS))
  const isLoading = ref(false)
  const isSaving = ref(false)
  const lastSaved = ref<Date | null>(null)

  // Computed
  const gameSettings = computed(() => settings.value.gameSettings)
  const uiSettings = computed(() => settings.value.uiSettings)
  const notificationSettings = computed(() => settings.value.notificationSettings)
  const privacySettings = computed(() => settings.value.privacySettings)

  const theme = computed(() => {
    if (uiSettings.value.theme === 'auto') {
      if (typeof window !== 'undefined' && window.matchMedia) {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      }
      return 'light' // Default to light if matchMedia not available
    }
    return uiSettings.value.theme
  })

  // Actions
  async function loadSettings() {
    const authStore = useAuthStore()
    if (!authStore.user || !supabase) return

    isLoading.value = true
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', authStore.user.id)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        throw error
      }

      if (data) {
        settings.value = {
          gameSettings: data.game_settings || DEFAULT_SETTINGS.gameSettings,
          uiSettings: data.ui_settings || DEFAULT_SETTINGS.uiSettings,
          notificationSettings: data.notification_settings || DEFAULT_SETTINGS.notificationSettings,
          privacySettings: data.privacy_settings || DEFAULT_SETTINGS.privacySettings,
        }
        lastSaved.value = new Date(data.updated_at)
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
    } finally {
      isLoading.value = false
    }
  }

  async function saveSettings() {
    const authStore = useAuthStore()
    if (!authStore.user || !supabase) return

    isSaving.value = true
    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: authStore.user.id,
          game_settings: settings.value.gameSettings,
          ui_settings: settings.value.uiSettings,
          notification_settings: settings.value.notificationSettings,
          privacy_settings: settings.value.privacySettings,
          updated_at: new Date().toISOString(),
        })

      if (error) throw error

      lastSaved.value = new Date()
    } catch (error) {
      console.error('Failed to save settings:', error)
      throw error
    } finally {
      isSaving.value = false
    }
  }

  function updateGameSettings(updates: Partial<GameSettings>) {
    settings.value.gameSettings = {
      ...settings.value.gameSettings,
      ...updates,
    }
  }

  function updateUISettings(updates: Partial<UISettings>) {
    settings.value.uiSettings = {
      ...settings.value.uiSettings,
      ...updates,
    }
    
    // Apply theme immediately
    if (updates.theme !== undefined) {
      applyTheme()
    }
  }

  function updateNotificationSettings(updates: Partial<NotificationSettings>) {
    settings.value.notificationSettings = {
      ...settings.value.notificationSettings,
      ...updates,
    }
  }

  function updatePrivacySettings(updates: Partial<PrivacySettings>) {
    settings.value.privacySettings = {
      ...settings.value.privacySettings,
      ...updates,
    }
  }

  function resetSettings() {
    settings.value = structuredClone(DEFAULT_SETTINGS)
  }

  function resetSection(section: keyof UserSettings) {
    settings.value[section] = structuredClone(DEFAULT_SETTINGS[section])
  }

  // Apply theme to document
  function applyTheme() {
    const root = document.documentElement
    const currentTheme = theme.value
    
    root.classList.remove('light', 'dark')
    root.classList.add(currentTheme)
    
    // Update meta theme-color for mobile browsers
    const metaTheme = document.querySelector('meta[name="theme-color"]')
    if (metaTheme) {
      metaTheme.setAttribute('content', currentTheme === 'dark' ? '#1a1a2e' : '#f3f4f6')
    }
  }

  // Local storage for offline support
  function saveToLocalStorage() {
    try {
      localStorage.setItem('puzzlator_settings', JSON.stringify(settings.value))
    } catch (error) {
      console.error('Failed to save settings to local storage:', error)
    }
  }

  function loadFromLocalStorage() {
    try {
      const stored = localStorage.getItem('puzzlator_settings')
      if (stored) {
        const parsed = JSON.parse(stored)
        settings.value = {
          ...DEFAULT_SETTINGS,
          ...parsed,
        }
      }
    } catch (error) {
      console.error('Failed to load settings from local storage:', error)
    }
  }

  // Watch for changes and auto-save
  let saveTimeout: NodeJS.Timeout | null = null
  watch(settings, () => {
    saveToLocalStorage()
    
    // Debounce saving to database
    if (saveTimeout) clearTimeout(saveTimeout)
    saveTimeout = setTimeout(() => {
      saveSettings()
    }, 2000)
  }, { deep: true })

  // Initialize
  if (typeof window !== 'undefined') {
    // Load from local storage first for immediate UI
    loadFromLocalStorage()
    applyTheme()
    
    // Then sync with database
    const authStore = useAuthStore()
    if (authStore.isAuthenticated) {
      loadSettings()
    }
    
    // Listen for system theme changes
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (uiSettings.value.theme === 'auto') {
          applyTheme()
        }
      })
    }
  }

  return {
    // State
    settings,
    isLoading,
    isSaving,
    lastSaved,
    
    // Computed
    gameSettings,
    uiSettings,
    notificationSettings,
    privacySettings,
    theme,
    
    // Actions
    loadSettings,
    saveSettings,
    updateGameSettings,
    updateUISettings,
    updateNotificationSettings,
    updatePrivacySettings,
    resetSettings,
    resetSection,
    applyTheme,
  }
})