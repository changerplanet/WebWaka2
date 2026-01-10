/**
 * HEALTH SUITE: Services Index
 * 
 * Exports all Health Suite domain services.
 * 
 * @module lib/health/services
 * @phase S2
 * @standard Platform Standardisation v2
 */

// Patient & Identity
export * from './patient-service'

// Facility & Provider
export * from './facility-service'

// Appointments
export * from './appointment-service'

// Visits
export * from './visit-service'

// Clinical Encounters (Append-Only)
export * from './encounter-service'

// Prescriptions (Facts Only)
export * from './prescription-service'

// Lab Orders & Results (Facts Only)
export * from './lab-order-service'

// Billing Facts (Commerce Boundary)
export * from './billing-fact-service'
