/**
 * SVM Service Worker
 * 
 * Handles offline caching for Single Vendor Marketplace.
 * 
 * RULES:
 * - Browsing allowed offline (cached)
 * - Order placement REQUIRES connectivity
 * - Graceful degradation when offline
 */

const CACHE_NAME = 'svm-cache-v1'
const STATIC_CACHE = 'svm-static-v1'
const IMAGE_CACHE = 'svm-images-v1'
const DATA_CACHE = 'svm-data-v1'

// Static assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/offline',
  '/manifest.json'
]

// API routes that should NEVER be cached
const NO_CACHE_ROUTES = [
  '/api/svm/orders',
  '/api/svm/cart',       // Server cart (not local)
  '/api/svm/checkout',
  '/api/auth',
  '/api/payment'
]

// API routes with short cache
const SHORT_CACHE_ROUTES = [
  '/api/svm/shipping',
  '/api/svm/promotions'
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...')
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('[SW] Caching static assets')
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => self.skipWaiting())
  )
})

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...')
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => {
            // Delete old versions
            return name.startsWith('svm-') && 
                   name !== CACHE_NAME && 
                   name !== STATIC_CACHE && 
                   name !== IMAGE_CACHE &&
                   name !== DATA_CACHE
          })
          .map(name => {
            console.log('[SW] Deleting old cache:', name)
            return caches.delete(name)
          })
      )
    })
    .then(() => self.clients.claim())
  )
})

// Fetch event - handle requests
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }
  
  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return
  }
  
  // Determine caching strategy based on request type
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE))
  } else if (isProductImage(url)) {
    event.respondWith(cacheFirst(request, IMAGE_CACHE))
  } else if (isProductData(url)) {
    event.respondWith(staleWhileRevalidate(request, DATA_CACHE))
  } else if (shouldNeverCache(url)) {
    event.respondWith(networkOnly(request))
  } else if (isShortCacheRoute(url)) {
    event.respondWith(networkFirst(request, DATA_CACHE, 300)) // 5 min cache
  } else {
    // Default: stale-while-revalidate
    event.respondWith(staleWhileRevalidate(request, CACHE_NAME))
  }
})

// Check if request is for static asset
function isStaticAsset(url) {
  const staticExtensions = ['.js', '.css', '.woff', '.woff2', '.ttf', '.eot']
  return staticExtensions.some(ext => url.pathname.endsWith(ext))
}

// Check if request is for product image
function isProductImage(url) {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']
  return imageExtensions.some(ext => url.pathname.endsWith(ext))
}

// Check if request is for product data
function isProductData(url) {
  return url.pathname.includes('/api/svm/products')
}

// Check if request should never be cached
function shouldNeverCache(url) {
  return NO_CACHE_ROUTES.some(route => url.pathname.startsWith(route))
}

// Check if request has short cache
function isShortCacheRoute(url) {
  return SHORT_CACHE_ROUTES.some(route => url.pathname.startsWith(route))
}

// Cache-first strategy
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)
  
  if (cached) {
    return cached
  }
  
  try {
    const response = await fetch(request)
    if (response.ok) {
      cache.put(request, response.clone())
    }
    return response
  } catch (error) {
    console.log('[SW] Cache-first failed:', error)
    return new Response('Offline', { status: 503 })
  }
}

// Network-first strategy
async function networkFirst(request, cacheName, maxAge = 3600) {
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, response.clone())
    }
    return response
  } catch (error) {
    const cache = await caches.open(cacheName)
    const cached = await cache.match(request)
    
    if (cached) {
      return cached
    }
    
    return new Response(
      JSON.stringify({ success: false, offline: true, error: 'You are offline' }),
      { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

// Network-only strategy
async function networkOnly(request) {
  try {
    return await fetch(request)
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        offline: true, 
        error: 'This action requires an internet connection' 
      }),
      { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

// Stale-while-revalidate strategy
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)
  
  const fetchPromise = fetch(request).then(response => {
    if (response.ok) {
      cache.put(request, response.clone())
    }
    return response
  }).catch(() => cached)
  
  return cached || fetchPromise
}

// Handle push notifications (future)
self.addEventListener('push', (event) => {
  if (!event.data) return
  
  const data = event.data.json()
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'SVM Marketplace', {
      body: data.body || 'You have a new notification',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      data: data.url || '/'
    })
  )
})

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  
  event.waitUntil(
    clients.openWindow(event.notification.data || '/')
  )
})

// Background sync for queued actions (future)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-cart') {
    event.waitUntil(syncCart())
  } else if (event.tag === 'sync-reviews') {
    event.waitUntil(syncReviews())
  }
})

async function syncCart() {
  // Sync cart with server when back online
  console.log('[SW] Syncing cart...')
}

async function syncReviews() {
  // Submit pending reviews when back online
  console.log('[SW] Syncing reviews...')
}

console.log('[SW] Service worker loaded')
