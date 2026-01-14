/**
 * PORTALS MODULE
 * 
 * End-user portals for Education and Health.
 * Phase E2.2 - Education & Health Portals
 * 
 * Created: January 14, 2026
 */

export * from './types';
export { educationPortalService } from './education/education-portal-service';
export { healthPortalService } from './health/health-portal-service';
export { canAccessStudent, canAccessPatient } from './authorization';
