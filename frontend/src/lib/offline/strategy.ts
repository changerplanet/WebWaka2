/**
 * Offline-First Data Strategy for WebWaka Commerce
 * 
 * ============================================================================
 * WHAT DATA IS SAFE OFFLINE (Read-Only Cache)
 * ============================================================================
 * 
 * ✅ Safe to cache:
 * - Tenant branding (name, colors, logo)
 * - User profile (read-only snapshot)
 * - Static UI assets (CSS, JS, images)
 * - Recent dashboard data (with timestamp)
 * 
 * ⚠️ Cache with caution:
 * - User list (may become stale)
 * - Settings (changes need sync)
 * 
 * ❌ Never cache:
 * - Authentication tokens (security risk)
 * - Other tenants' data (isolation violation)
 * - Sensitive financial data
 * 
 * ============================================================================
 * WHAT ACTIONS ARE QUEUED (Offline Mutations)
 * ============================================================================
 * 
 * ✅ Safe to queue:
 * - Profile updates (name, avatar)
 * - Notes/comments creation
 * - Settings changes
 * - Read status updates
 * 
 * ⚠️ Queue with conflict handling:
 * - Item updates (use last-write-wins or merge)
 * - Status changes (may conflict with other users)
 * 
 * ❌ Never queue (require online):
 * - Financial transactions
 * - User invitations/removals
 * - Permission changes
 * - Delete operations (too risky offline)
 * 
 * ============================================================================
 * CONFLICT RESOLUTION APPROACH
 * ============================================================================
 * 
 * Strategy: Last-Write-Wins with Client Timestamps + Server Arbitration
 * 
 * 1. Each queued action includes:
 *    - clientTimestamp (when user took action)
 *    - tenantId (isolation)
 *    - actionId (deduplication)
 *    - version (optimistic concurrency)
 * 
 * 2. On sync, server checks:
 *    - If resource version matches → Apply change
 *    - If version mismatch → Return conflict with server state
 *    - Client can then merge or show conflict UI
 * 
 * 3. Conflict resolution options:
 *    - Auto-merge for non-critical data
 *    - User choice for important conflicts
 *    - Server-wins for security-sensitive data
 * 
 * ============================================================================
 * SYNC RETRY STRATEGY
 * ============================================================================
 * 
 * Exponential Backoff with Jitter:
 * - Initial delay: 1 second
 * - Max delay: 5 minutes
 * - Jitter: ±20% to prevent thundering herd
 * - Max retries: 10 (then require manual retry)
 * 
 * Retry conditions:
 * - Network error → Retry with backoff
 * - 429 (rate limit) → Retry after Retry-After header
 * - 5xx (server error) → Retry with backoff
 * - 4xx (client error) → Don't retry, mark failed
 * - 409 (conflict) → Don't retry, handle conflict
 * 
 * ============================================================================
 */

// Action types that can be queued offline
export type OfflineActionType = 
  | 'PROFILE_UPDATE'
  | 'SETTINGS_UPDATE'
  | 'NOTE_CREATE'
  | 'NOTE_UPDATE'
  | 'STATUS_UPDATE'
  | 'PREFERENCE_UPDATE'

// Actions that should NEVER be queued
export const ONLINE_ONLY_ACTIONS = [
  'USER_DELETE',
  'USER_INVITE',
  'PERMISSION_CHANGE',
  'PAYMENT_PROCESS',
  'TENANT_DELETE',
  'ADMIN_ACTION'
]

// Sync status for queued actions
export type SyncStatus = 
  | 'pending'      // Waiting to sync
  | 'syncing'      // Currently being synced
  | 'synced'       // Successfully synced
  | 'failed'       // Failed after max retries
  | 'conflict'     // Conflict detected, needs resolution

// Queued action structure
export interface QueuedAction {
  id: string                    // Unique action ID (UUID)
  tenantId: string              // Tenant isolation
  userId: string                // User who created action
  type: OfflineActionType       // Action type
  endpoint: string              // API endpoint to call
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  payload: Record<string, any>  // Request body
  resourceId?: string           // ID of resource being modified
  resourceVersion?: number      // Optimistic concurrency version
  clientTimestamp: number       // When action was created (ms)
  syncStatus: SyncStatus        // Current sync status
  retryCount: number            // Number of sync attempts
  lastRetryAt?: number          // Last retry timestamp
  errorMessage?: string         // Last error message
  conflictData?: any            // Server state on conflict
}

// Cached data structure
export interface CachedData {
  tenantId: string
  key: string                   // Cache key (e.g., "tenant:branding")
  data: any                     // Cached data
  cachedAt: number              // When data was cached
  expiresAt: number             // When cache expires
  version?: number              // Data version for invalidation
}

// Sync configuration
export const SYNC_CONFIG = {
  initialDelay: 1000,           // 1 second
  maxDelay: 300000,             // 5 minutes
  maxRetries: 10,
  jitterPercent: 0.2,           // ±20%
  
  // Cache TTLs (in milliseconds)
  cacheTTL: {
    branding: 3600000,          // 1 hour
    userProfile: 300000,        // 5 minutes
    dashboardData: 60000,       // 1 minute
    staticAssets: 86400000      // 24 hours
  }
}

/**
 * Calculate next retry delay with exponential backoff and jitter
 */
export function calculateRetryDelay(retryCount: number): number {
  const baseDelay = SYNC_CONFIG.initialDelay * Math.pow(2, retryCount)
  const cappedDelay = Math.min(baseDelay, SYNC_CONFIG.maxDelay)
  
  // Add jitter
  const jitter = cappedDelay * SYNC_CONFIG.jitterPercent
  const delay = cappedDelay + (Math.random() * 2 - 1) * jitter
  
  return Math.round(delay)
}

/**
 * Check if an action should be retried based on error
 */
export function shouldRetryAction(statusCode: number, retryCount: number): boolean {
  // Don't retry if max retries exceeded
  if (retryCount >= SYNC_CONFIG.maxRetries) return false
  
  // Retry on network errors and server errors
  if (statusCode === 0 || statusCode >= 500) return true
  
  // Retry on rate limiting
  if (statusCode === 429) return true
  
  // Don't retry on client errors (except rate limit)
  return false
}

/**
 * Check if an action type is allowed offline
 */
export function isOfflineAllowed(actionType: string): boolean {
  return !ONLINE_ONLY_ACTIONS.includes(actionType)
}
