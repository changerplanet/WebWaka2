/**
 * PORTAL TYPES
 * 
 * Shared types for Education and Health end-user portals.
 * Part of Phase E2.2 - Education & Health Portals
 * 
 * Created: January 14, 2026
 */

export type PortalUserRole = 'STUDENT' | 'PARENT' | 'PATIENT';

export interface PortalSession {
  userId: string;
  tenantId: string;
  role: PortalUserRole;
  entityId: string;
  entityName: string;
  isDemo: boolean;
}

export interface PortalAccessResult {
  allowed: boolean;
  role?: PortalUserRole;
  entityId?: string;
  entityName?: string;
  error?: string;
}
