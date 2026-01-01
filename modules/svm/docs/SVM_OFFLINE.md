# SVM Module - Offline & PWA Behavior Documentation

## Phase 6 Overview

Defines offline behavior rules for Single Vendor Marketplace with Progressive Web App (PWA) capabilities.

## Key Principles

1. **Browsing allowed offline** - Cached product catalog available
2. **Order placement REQUIRES connectivity** - No offline orders
3. **Graceful degradation** - Clear feedback when offline
4. **Local cart persistence** - Cart saved to localStorage

## Action Classification

### Offline-Safe Actions (Can work without internet)
| Action | Description |
|--------|-------------|
| VIEW_PRODUCTS | Browse cached product catalog |
| VIEW_PRODUCT_DETAILS | View cached product information |
| VIEW_CATEGORIES | Browse cached categories |
| VIEW_CART | View local cart (localStorage) |
| ADD_TO_CART | Add items to local cart |
| UPDATE_CART_QUANTITY | Update quantities locally |
| REMOVE_FROM_CART | Remove items from cart |
| VIEW_WISHLIST | View local wishlist |
| ADD_TO_WISHLIST | Add to local wishlist |
| VIEW_ORDER_HISTORY | View cached previous orders |
| VIEW_SAVED_ADDRESSES | View cached addresses |
| SEARCH_CACHED | Search within cached products |

### Online-Required Actions (NEVER work offline)
| Action | Fallback Message |
|--------|-----------------|
| PLACE_ORDER | Cart saved locally. Try again when connected. |
| CHECKOUT | Please connect to complete your purchase. |
| PROCESS_PAYMENT | Payment requires secure connection. |
| VALIDATE_COUPON | Apply coupon when back online. |
| CALCULATE_SHIPPING | Shipping calculated at checkout. |
| CHECK_INVENTORY | Availability may not be current. |
| CREATE_ACCOUNT | Browse as guest, create account later. |
| LOGIN | Browse as guest. |
| UPDATE_PROFILE | Changes saved when you reconnect. |
| TRACK_ORDER | Check status when back online. |
| SUBMIT_REVIEW | Review saved, submitted when connected. |
| CONTACT_SUPPORT | Message sent when you reconnect. |

## Queueable Actions

Some actions can be queued for later execution:
- `VALIDATE_COUPON` - Queued, applied at checkout
- `UPDATE_PROFILE` - Queued, synced when online
- `SUBMIT_REVIEW` - Queued, submitted when online
- `CONTACT_SUPPORT` - Queued, sent when online

```typescript
import { OfflineQueue } from '@svm/lib'

// Queue an action
OfflineQueue.enqueue('SUBMIT_REVIEW', { productId: 'p1', rating: 5, comment: '...' })

// Process queue when back online
OfflineQueue.processQueue(async (action) => {
  // Execute action
  return true // success
})
```

## Cache Strategies

| Resource | Strategy | TTL |
|----------|----------|-----|
| Static Assets | CACHE_FIRST | 30 days |
| Product Catalog | STALE_WHILE_REVALIDATE | 1 hour |
| Product Details | STALE_WHILE_REVALIDATE | 30 min |
| Categories | CACHE_FIRST | 24 hours |
| Product Images | CACHE_FIRST | 7 days |
| Shipping Rates | NETWORK_ONLY | - |
| Inventory | NETWORK_FIRST | 5 min |
| Promotions | NETWORK_FIRST | 15 min |
| User Data | NETWORK_ONLY | - |
| Orders | NETWORK_ONLY | - |

## Service Worker

Located at `/public/sw.js`

**Features:**
- Caches static assets on install
- Stale-while-revalidate for product data
- Network-only for orders/payments
- Background sync for queued actions (future)
- Push notifications support (future)

**API Routes Never Cached:**
- `/api/svm/orders`
- `/api/svm/cart` (server cart)
- `/api/svm/checkout`
- `/api/auth`
- `/api/payment`

## PWA Manifest

Located at `/public/manifest.json`

**Capabilities:**
- `display: standalone` - App-like experience
- `offline_enabled: true` - Works offline
- Shortcuts for Cart and Shop
- Installable on mobile/desktop

## React Components

### OfflineProvider
Wrap your app to provide offline context:
```tsx
import { OfflineProvider } from '@svm/components/offline-ui'

<OfflineProvider>
  <App />
</OfflineProvider>
```

### OfflineBanner
Shows connectivity status to users:
```tsx
import { OfflineBanner } from '@svm/components/offline-ui'

<OfflineBanner />
// Shows "You're offline" or "Slow connection detected"
// Auto-hides "You're back online" after 3 seconds
```

### ConnectionIndicator
Visual dot indicator:
```tsx
import { ConnectionIndicator } from '@svm/components/offline-ui'

<ConnectionIndicator showLabel size="md" />
// Green dot = Online, Red = Offline, Yellow = Slow
```

### OfflineBlocker
Blocks actions that require connectivity:
```tsx
import { OfflineBlocker } from '@svm/components/offline-ui'

<OfflineBlocker action="Checkout" fallbackMessage="Please connect to checkout">
  <Button onClick={checkout}>Checkout</Button>
</OfflineBlocker>
```

### SyncStatus
Shows pending sync actions:
```tsx
import { SyncStatus } from '@svm/components/offline-ui'

<SyncStatus />
// Shows "3 actions pending" with "Sync now" button when online
```

### OfflinePage
Full-page offline message:
```tsx
import { OfflinePage } from '@svm/components/offline-ui'

// Use when user navigates to online-only page while offline
<OfflinePage />
```

## useOffline Hook

```tsx
import { useOffline } from '@svm/components/offline-ui'

function MyComponent() {
  const { isOnline, connectionStatus, pendingActions, lastOnline } = useOffline()
  
  if (!isOnline) {
    return <OfflineMessage />
  }
  
  return <OnlineContent />
}
```

## OfflineCartManager

Manage cart in localStorage:
```typescript
import { OfflineCartManager } from '@svm/lib'

// Add item
OfflineCartManager.addItem('tenant_123', {
  productId: 'p1',
  productName: 'Widget',
  unitPrice: 29.99,
  quantity: 2
})

// Get cart
const cart = OfflineCartManager.getCart('tenant_123')

// Check if needs sync
if (OfflineCartManager.needsSync('tenant_123')) {
  // Sync with server when online
}

// Mark as synced
OfflineCartManager.markSynced('tenant_123')
```

## ConnectivityListener

Listen for connectivity changes:
```typescript
import { ConnectivityListener } from '@svm/lib'

// Initialize (call once in app entry)
ConnectivityListener.init()

// Subscribe to changes
const unsubscribe = ConnectivityListener.subscribe((online, status) => {
  console.log('Connection:', online, status)
  if (online && status === 'ONLINE') {
    syncPendingActions()
  }
})

// Get current state
const { online, status } = ConnectivityListener.getCurrentState()

// Cleanup
unsubscribe()
```

## UI Feedback Messages

Pre-defined messages for consistent UX:
```typescript
import { OFFLINE_MESSAGES } from '@svm/lib'

OFFLINE_MESSAGES['OFFLINE_BANNER']
// { title: "You're offline", message: "Some features may be limited...", type: "info" }

OFFLINE_MESSAGES['CHECKOUT_BLOCKED']
// { title: "Cannot checkout offline", message: "Please connect...", type: "error" }
```

## Local Storage Keys

```typescript
import { STORAGE_KEYS } from '@svm/lib'

STORAGE_KEYS.CART             // 'svm_cart'
STORAGE_KEYS.WISHLIST         // 'svm_wishlist'
STORAGE_KEYS.RECENT_PRODUCTS  // 'svm_recent_products'
STORAGE_KEYS.CACHED_PRODUCTS  // 'svm_cached_products'
STORAGE_KEYS.OFFLINE_QUEUE    // 'svm_offline_queue'
STORAGE_KEYS.LAST_SYNC        // 'svm_last_sync'
```

## Integration Example

```tsx
// App.tsx
import { OfflineProvider, OfflineBanner, useOffline } from '@svm/components/offline-ui'
import { validateAction } from '@svm/lib'

function App() {
  return (
    <OfflineProvider>
      <OfflineBanner />
      <MainContent />
    </OfflineProvider>
  )
}

function CheckoutButton() {
  const { isOnline } = useOffline()
  
  const handleCheckout = () => {
    const validation = validateAction('CHECKOUT', isOnline)
    
    if (!validation.allowed) {
      showToast(validation.reason)
      return
    }
    
    navigateToCheckout()
  }
  
  return (
    <button onClick={handleCheckout} disabled={!isOnline}>
      {isOnline ? 'Checkout' : 'Checkout (Requires Internet)'}
    </button>
  )
}
```

## Verification Checklist

- ✅ No offline order placement
- ✅ Clear user feedback when offline
- ✅ Cart persisted to localStorage
- ✅ Browsing cached products works offline
- ✅ Online-required actions blocked with message
- ✅ Reconnection detected and shown
- ✅ Slow connection warning
- ✅ Queueable actions saved for later

## Files Reference

- `/modules/svm/src/lib/offline-behavior.ts` - Core offline logic
- `/modules/svm/src/components/offline-ui.tsx` - React components
- `/modules/svm/public/sw.js` - Service worker
- `/modules/svm/public/manifest.json` - PWA manifest
- `/modules/svm/docs/SVM_OFFLINE.md` - This documentation

## Current Limitations

- Service worker not yet registered in saas-core
- Push notifications not implemented
- Background sync not implemented
- No offline product search (only cached viewing)
