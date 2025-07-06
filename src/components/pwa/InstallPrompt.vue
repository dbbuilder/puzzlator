<template>
  <Transition name="slide-up">
    <div v-if="showPrompt && !isInstalled" class="install-prompt">
      <div class="install-content">
        <div class="install-icon">
          <Download class="w-8 h-8" />
        </div>
        <div class="install-text">
          <h3 class="install-title">Install Puzzlator</h3>
          <p class="install-description">
            Install the app for offline play and a better experience
          </p>
        </div>
        <div class="install-actions">
          <button @click="installApp" class="btn-install">
            Install
          </button>
          <button @click="dismissPrompt" class="btn-dismiss">
            <X class="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Download, X } from 'lucide-vue-next'

// State
const showPrompt = ref(false)
const isInstalled = ref(false)
let deferredPrompt: any = null

// Check if already installed
const checkInstalled = () => {
  // Check if running in standalone mode (installed)
  if (window.matchMedia('(display-mode: standalone)').matches) {
    isInstalled.value = true
    return
  }
  
  // Check if on iOS and in Safari
  if ('standalone' in window.navigator) {
    isInstalled.value = (window.navigator as any).standalone
    return
  }
  
  // Check if previously dismissed
  const dismissed = localStorage.getItem('pwa-install-dismissed')
  if (dismissed) {
    const dismissedDate = new Date(dismissed)
    const daysSinceDismissed = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24)
    // Show again after 30 days
    if (daysSinceDismissed < 30) {
      return
    }
  }
}

// Handle install prompt
const handleBeforeInstallPrompt = (e: Event) => {
  // Prevent the default prompt
  e.preventDefault()
  
  // Store the event for later use
  deferredPrompt = e
  
  // Show our custom prompt after a delay
  setTimeout(() => {
    if (!isInstalled.value) {
      showPrompt.value = true
    }
  }, 30000) // Show after 30 seconds
}

// Install the app
const installApp = async () => {
  if (!deferredPrompt) {
    // For iOS, show instructions
    if (isIOS()) {
      showIOSInstructions()
      return
    }
    return
  }
  
  // Show the install prompt
  deferredPrompt.prompt()
  
  // Wait for the user's response
  const { outcome } = await deferredPrompt.userChoice
  
  if (outcome === 'accepted') {
    console.log('PWA installed successfully')
    isInstalled.value = true
  }
  
  // Clear the deferred prompt
  deferredPrompt = null
  showPrompt.value = false
}

// Dismiss the prompt
const dismissPrompt = () => {
  showPrompt.value = false
  localStorage.setItem('pwa-install-dismissed', new Date().toISOString())
}

// Check if iOS
const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
}

// Show iOS installation instructions
const showIOSInstructions = () => {
  // You could show a modal with instructions here
  alert('To install on iOS:\n1. Tap the Share button\n2. Select "Add to Home Screen"\n3. Tap "Add"')
}

// Handle app installed event
const handleAppInstalled = () => {
  console.log('PWA was installed')
  isInstalled.value = true
  showPrompt.value = false
  deferredPrompt = null
}

// Lifecycle
onMounted(() => {
  checkInstalled()
  
  // Listen for install prompt
  window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  
  // Listen for successful installation
  window.addEventListener('appinstalled', handleAppInstalled)
})

onUnmounted(() => {
  window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  window.removeEventListener('appinstalled', handleAppInstalled)
})
</script>

<style scoped>
.install-prompt {
  position: fixed;
  bottom: 1rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  max-width: 500px;
  width: calc(100% - 2rem);
}

.install-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.2);
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.install-icon {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  background: #7c3aed;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.install-text {
  flex: 1;
  min-width: 0;
}

.install-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.25rem 0;
}

.install-description {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
}

.install-actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}

.btn-install {
  padding: 0.5rem 1rem;
  background: #7c3aed;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-install:hover {
  background: #6d28d9;
  transform: translateY(-1px);
}

.btn-dismiss {
  padding: 0.5rem;
  background: transparent;
  border: none;
  color: #6b7280;
  cursor: pointer;
  transition: color 0.2s;
}

.btn-dismiss:hover {
  color: #374151;
}

/* Transitions */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from {
  transform: translate(-50%, 100%);
  opacity: 0;
}

.slide-up-leave-to {
  transform: translate(-50%, 100%);
  opacity: 0;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .install-content {
    background: #1f2937;
  }
  
  .install-title {
    color: #f9fafb;
  }
  
  .install-description {
    color: #d1d5db;
  }
  
  .btn-dismiss {
    color: #9ca3af;
  }
  
  .btn-dismiss:hover {
    color: #e5e7eb;
  }
}

/* Mobile responsive */
@media (max-width: 640px) {
  .install-prompt {
    bottom: 0;
    left: 0;
    right: 0;
    transform: none;
    max-width: none;
    width: 100%;
  }
  
  .install-content {
    border-radius: 12px 12px 0 0;
  }
}
</style>