import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useToast } from 'vue-toastification'

export interface AppSettings {
  theme: 'light' | 'dark' | 'system'
  soundEnabled: boolean
  musicEnabled: boolean
  animationsEnabled: boolean
  difficulty: 'easy' | 'medium' | 'hard'
  hintsEnabled: boolean
}

export interface AppError {
  message: string
  code?: string
  timestamp: Date
}

export const useAppStore = defineStore('app', () => {
  // State
  const loading = ref(false)
  const loadingMessage = ref('')
  const error = ref<AppError | null>(null)
  const settings = ref<AppSettings>({
    theme: 'system',
    soundEnabled: true,
    musicEnabled: true,
    animationsEnabled: true,
    difficulty: 'medium',
    hintsEnabled: true
  })
  const showAuthModal = ref(false)
  const authModalMode = ref<'login' | 'signup'>('login')
  
  // Toast notifications
  const toast = useToast()

  // Computed
  const hasError = computed(() => !!error.value)
  const isDarkMode = computed(() => {
    if (settings.value.theme === 'dark') return true
    if (settings.value.theme === 'light') return false
    // System preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  // Actions
  async function initialize() {
    try {
      loading.value = true
      loadingMessage.value = 'Initializing app settings...'

      // Load settings from localStorage
      const savedSettings = localStorage.getItem('app-settings')
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings)
          settings.value = { ...settings.value, ...parsed }
        } catch (e) {
          console.error('Failed to parse saved settings:', e)
        }
      }

      // Apply theme
      applyTheme()

      // Listen for system theme changes
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (settings.value.theme === 'system') {
          applyTheme()
        }
      })
    } catch (error) {
      console.error('Failed to initialize app:', error)
      setError('Failed to initialize application settings')
    } finally {
      loading.value = false
      loadingMessage.value = ''
    }
  }

  function setLoading(isLoading: boolean, message = '') {
    loading.value = isLoading
    loadingMessage.value = message
  }

  function setError(message: string, code?: string) {
    error.value = {
      message,
      code,
      timestamp: new Date()
    }
    toast.error(message)
  }

  function clearError() {
    error.value = null
  }

  function updateSettings(newSettings: Partial<AppSettings>) {
    settings.value = { ...settings.value, ...newSettings }
    localStorage.setItem('app-settings', JSON.stringify(settings.value))
    
    // Apply theme if changed
    if ('theme' in newSettings) {
      applyTheme()
    }
  }

  function applyTheme() {
    const root = document.documentElement
    if (isDarkMode.value) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }

  function openAuthModal(mode: 'login' | 'signup' = 'login') {
    authModalMode.value = mode
    showAuthModal.value = true
  }

  function closeAuthModal() {
    showAuthModal.value = false
  }

  function toggleAuthMode() {
    authModalMode.value = authModalMode.value === 'login' ? 'signup' : 'login'
  }

  function playSound(soundName: 'success' | 'error' | 'click' | 'move') {
    if (!settings.value.soundEnabled) return

    try {
      const audio = new Audio(`/assets/sounds/${soundName}.mp3`)
      audio.volume = 0.5
      audio.play().catch(e => console.warn('Failed to play sound:', e))
    } catch (e) {
      console.warn('Failed to play sound:', e)
    }
  }

  function showSuccess(message: string) {
    toast.success(message)
    playSound('success')
  }

  function showError(message: string) {
    toast.error(message)
    playSound('error')
  }

  function showInfo(message: string) {
    toast.info(message)
  }

  function showWarning(message: string) {
    toast.warning(message)
  }

  return {
    // State
    loading,
    loadingMessage,
    error,
    settings,
    showAuthModal,
    authModalMode,

    // Computed
    hasError,
    isDarkMode,

    // Actions
    initialize,
    setLoading,
    setError,
    clearError,
    updateSettings,
    openAuthModal,
    closeAuthModal,
    toggleAuthMode,
    playSound,
    showSuccess,
    showError,
    showInfo,
    showWarning
  }
})