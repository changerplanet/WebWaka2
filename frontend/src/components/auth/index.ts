/**
 * Auth Components (FOUNDATION)
 * 
 * Central exports for authentication and authorization UI components.
 * All components work identically for demo and production users.
 * 
 * @module components/auth
 * @foundation Phase 3.3
 */

// Permission Gates
export {
  PermissionGate,
  RouteGate,
  ActionGate,
  CreateGate,
  EditGate,
  DeleteGate,
  ApproveGate,
  FinancialsGate,
  TransactionGate,
  SettingsGate,
  AdminGate,
  AuditLogGate,
  BlockedActionsSummary,
  checkCapabilities,
  getCapabilityLabel,
  type PermissionGateProps,
  type RouteGateProps,
  type ActionGateProps,
  type CapabilityKey,
} from './PermissionGate'
