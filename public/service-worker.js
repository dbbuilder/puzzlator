// Service Worker for Puzzlator
const CACHE_NAME = 'puzzlator-v1.0.0'
const STATIC_CACHE_NAME = 'puzzlator-static-v1.0.0'
const DYNAMIC_CACHE_NAME = 'puzzlator-dynamic-v1.0.0'

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/assets/images/logo.svg',
  '/assets/css/main.css'
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...')
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching static assets')
        return cache.addAll(STATIC_ASSETS)
      })
      .catch((err) => {
        console.error('[Service Worker] Failed to cache static assets:', err)
      })
  )
  
  // Force the waiting service worker to become active
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...')
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return cacheName.startsWith('puzzlator-') && 
                   cacheName !== STATIC_CACHE_NAME &&
                   cacheName !== DYNAMIC_CACHE_NAME
          })
          .map((cacheName) => {
            console.log('[Service Worker] Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          })
      )
    })
  )
  
  // Take control of all pages immediately
  self.clients.claim()
})

// Fetch event - serve from cache when possible
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  
  // Don't cache API calls or external resources
  if (url.origin !== location.origin || 
      url.pathname.startsWith('/api/') ||
      url.pathname.startsWith('/supabase/')) {
    return
  }
  
  // Network first strategy for HTML pages
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone the response before caching
          const responseToCache = response.clone()
          caches.open(DYNAMIC_CACHE_NAME)
            .then((cache) => {
              cache.put(request, responseToCache)
            })
          return response
        })
        .catch(() => {
          // Fallback to cache if network fails
          return caches.match(request)
            .then((response) => {
              if (response) {
                return response
              }
              // Return offline page if available
              return caches.match('/offline.html')
            })
        })
    )
    return
  }
  
  // Cache first strategy for assets
  event.respondWith(
    caches.match(request)
      .then((response) => {
        if (response) {
          // Update cache in background
          fetch(request)
            .then((networkResponse) => {
              caches.open(DYNAMIC_CACHE_NAME)
                .then((cache) => {
                  cache.put(request, networkResponse)
                })
            })
            .catch(() => {
              // Ignore network errors for background updates
            })
          
          return response
        }
        
        // Not in cache, fetch from network
        return fetch(request)
          .then((response) => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response
            }
            
            // Clone the response before caching
            const responseToCache = response.clone()
            
            caches.open(DYNAMIC_CACHE_NAME)
              .then((cache) => {
                cache.put(request, responseToCache)
              })
            
            return response
          })
      })
      .catch((err) => {
        console.error('[Service Worker] Fetch error:', err)
        // Return offline page for navigation requests
        if (request.mode === 'navigate') {
          return caches.match('/offline.html')
        }
      })
  )
})

// Background sync for score submission
self.addEventListener('sync', (event) => {
  if (event.tag === 'submit-score') {
    event.waitUntil(submitPendingScores())
  }
})

// Push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return
  
  const data = event.data.json()
  const options = {
    body: data.body,
    icon: '/assets/images/icon-192.png',
    badge: '/assets/images/badge-72.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/'
    }
  }
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Puzzlator', options)
  )
})

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  
  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  )
})

// Helper function to submit pending scores
async function submitPendingScores() {
  // Get pending scores from IndexedDB
  const pendingScores = await getPendingScores()
  
  for (const score of pendingScores) {
    try {
      const response = await fetch('/api/scores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(score)
      })
      
      if (response.ok) {
        await removePendingScore(score.id)
      }
    } catch (err) {
      console.error('[Service Worker] Failed to submit score:', err)
    }
  }
}

// Placeholder functions for IndexedDB operations
async function getPendingScores() {
  // TODO: Implement IndexedDB read
  return []
}

async function removePendingScore(id) {
  // TODO: Implement IndexedDB delete
}