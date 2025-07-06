// Main application entry point
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Toast from 'vue-toastification'
import router from './router'
import App from './App.vue'
import { initSentry } from './config/sentry'

// Import styles
import './style.css'
import 'vue-toastification/dist/index.css'

// Initialize Supabase (commented out - using custom auth)
// import { supabase } from './config/supabase'

// Create Vue app
const app = createApp(App)

// Configure Pinia store
const pinia = createPinia()
app.use(pinia)

// Configure router
app.use(router)

// Initialize Sentry error tracking
initSentry({
  app,
  router,
  enabled: import.meta.env.PROD || import.meta.env.VITE_SENTRY_DEBUG === 'true'
})

// Configure toast notifications
app.use(Toast, {
  position: 'top-right',
  timeout: 5000,
  closeOnClick: true,
  pauseOnFocusLoss: true,
  pauseOnHover: true,
  draggable: true,
  draggablePercent: 0.6,
  showCloseButtonOnHover: false,
  hideProgressBar: false,
  closeButton: 'button',
  icon: true,
  rtl: false,
})

// Global error handler (Sentry will capture these automatically)
app.config.errorHandler = (err, instance, info) => {
  console.error('Global error:', err, info)
  // Sentry captures this automatically via the Vue integration
}

// Initialize authentication state (using custom auth)
// supabase.auth.onAuthStateChange((event, session) => {
//   console.log('Auth state changed:', event, session?.user?.email)
// })

// Mount the app
app.mount('#app')

// Register service worker for PWA support
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/'
      })
      
      console.log('Service Worker registered successfully:', registration.scope)
      
      // Check for updates periodically
      setInterval(() => {
        registration.update()
      }, 60 * 60 * 1000) // Check every hour
      
      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New content is available
              console.log('New content available, please refresh')
              // You could show a toast here prompting the user to refresh
            }
          })
        }
      })
    } catch (error) {
      console.error('Service Worker registration failed:', error)
    }
  })
}
