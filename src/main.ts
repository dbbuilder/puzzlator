// Main application entry point
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Toast from 'vue-toastification'
import router from './router'
import App from './App.vue'

// Import styles
import './style.css'
import 'vue-toastification/dist/index.css'

// Initialize Supabase
import { supabase } from './config/supabase'

// Create Vue app
const app = createApp(App)

// Configure Pinia store
const pinia = createPinia()
app.use(pinia)

// Configure router
app.use(router)

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

// Global error handler
app.config.errorHandler = (err, instance, info) => {
  console.error('Global error:', err, info)
  // TODO: Send to error tracking service
}

// Initialize authentication state
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth state changed:', event, session?.user?.email)
})

// Mount the app
app.mount('#app')
