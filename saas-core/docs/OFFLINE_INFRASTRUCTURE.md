# Offline Infrastructure Documentation

## Overview

This SaaS Core application supports Progressive Web App (PWA) functionality with offline-first capabilities. The system is designed to work across multiple tenants while maintaining data isolation.

## Key Components

### 1. Service Worker (`/public/sw.js`)

The service worker handles:
- **Precaching**: Static assets are cached during installation
- **Network-first strategy** for API requests
- **Cache-first strategy** for static assets
- **Background sync** for offline mutations
- **Tenant-aware caching**: Separate cache per tenant

#### Cache Structure
- `saas-core-static-v{version}` - Static assets (pages, CSS, JS)
- `saas-core-tenant-{slug}` - Per-tenant API responses

### 2. IndexedDB Storage (`/src/lib/offline/indexeddb.ts`)

Database structure:
- `offlineActions` - Queued mutations waiting to sync
- `cachedData` - Read-only cached data per tenant  
- `syncMeta` - Sync status and metadata

### 3. React Hooks (`/src/lib/offline/hooks.ts`)

Available hooks:
- `useOnlineStatus()` - Returns current online/offline status
- `useServiceWorker()` - Service worker registration and control
- `useOfflineQueue(tenantId)` - Manage offline action queue
- `useCachedData(tenantId, key)` - Read/write cached data
- `useOfflineApi(tenantId)` - Offline-first API calls

### 4. UI Components (`/src/components/OfflineStatus.tsx`)

- `OfflineStatusBar` - Full status bar with sync controls
- `OfflineIndicator` - Compact offline indicator

## PWA Manifest

The manifest is dynamically generated per tenant at `/manifest.json?tenant={slug}`.

Features:
- Tenant-specific app name and colors
- Dynamic icons with tenant branding
- Shortcuts to dashboard

## Integration Guide

### Basic Usage

```tsx
// In a tenant dashboard component
import { useOfflineQueue, useOnlineStatus } from '@/lib/offline/hooks'
import { OfflineStatusBar } from '@/components/OfflineStatus'

function Dashboard({ tenantId }) {
  const isOnline = useOnlineStatus()
  const { queue, stats } = useOfflineQueue(tenantId)
  
  async function handleSubmit(data) {
    if (isOnline) {
      // Direct API call
      await fetch('/api/resource', { method: 'POST', body: JSON.stringify(data) })
    } else {
      // Queue for later
      await queue('NOTE_CREATE', '/api/resource', 'POST', data, userId)
    }
  }
  
  return (
    <>
      {/* Your UI */}
      <OfflineStatusBar tenantId={tenantId} />
    </>
  )
}
```

### Offline-First API Pattern

```tsx
import { useOfflineApi } from '@/lib/offline/hooks'

function MyComponent({ tenantId, userId }) {
  const { request, isOnline } = useOfflineApi(tenantId)
  
  async function submitForm(data) {
    const { queued, error } = await request('/api/notes', {
      method: 'POST',
      body: data,
      offlineAction: {
        type: 'NOTE_CREATE',
        userId,
      }
    })
    
    if (queued) {
      showToast('Saved locally - will sync when online')
    }
  }
}
```

## Allowed Offline Actions

Safe to queue:
- `PROFILE_UPDATE`
- `SETTINGS_UPDATE`
- `NOTE_CREATE`
- `NOTE_UPDATE`
- `STATUS_UPDATE`
- `PREFERENCE_UPDATE`

**Never queue** (require online):
- User deletion/invitation
- Permission changes
- Payment processing
- Tenant deletion
- Admin actions

## Conflict Resolution

The system uses **last-write-wins** with client timestamps. When a conflict is detected:

1. Server returns 409 with conflict data
2. Action is marked as `conflict` status
3. UI can show conflict resolution dialog
4. User chooses: keep local, keep server, or merge

## Testing

### Simulate Offline Mode

1. Open browser DevTools
2. Go to Network tab
3. Select "Offline" from throttling dropdown
4. Perform actions - they should be queued
5. Go back online - actions should sync automatically

### Verify PWA Installation

1. Visit the app in Chrome
2. Look for install prompt in address bar
3. Install from different tenant URLs
4. Verify different app names and icons

## Files Reference

```
/app/saas-core/
├── public/
│   └── sw.js                    # Service Worker
├── src/
│   ├── app/
│   │   ├── layout.tsx           # PWA Provider setup
│   │   ├── manifest.json/
│   │   │   └── route.ts         # Dynamic manifest endpoint
│   │   ├── offline/
│   │   │   └── page.tsx         # Offline fallback page
│   │   └── api/icons/[size]/
│   │       └── route.ts         # Dynamic icon generator
│   ├── components/
│   │   ├── PWAProvider.tsx      # PWA context provider
│   │   └── OfflineStatus.tsx    # Offline UI components
│   └── lib/offline/
│       ├── index.ts             # Barrel export
│       ├── strategy.ts          # Offline rules & config
│       ├── indexeddb.ts         # IndexedDB operations
│       └── hooks.ts             # React hooks
```

## Future Integration Notes

When integrating real application features:

1. **Forms**: Wrap form submissions with offline queue handler
2. **Lists**: Use `useCachedData` for offline-viewable lists
3. **Real-time**: Disable WebSocket features when offline
4. **Sync indicators**: Add per-item sync status to UI
