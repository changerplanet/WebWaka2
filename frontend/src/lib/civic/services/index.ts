/**
 * CIVIC SUITE: Services Index
 * 
 * Exports all Civic domain services.
 * 
 * @module lib/civic/services
 * @phase S2
 * @standard Platform Standardisation v2
 */

// Citizen & Organization Management
export * as CitizenService from './citizen-service'

// Agency Structure
export * as AgencyService from './agency-service'

// Service Catalogue
export * as ServiceCatalogueService from './service-catalogue-service'

// Request & Case Workflow
export * as RequestService from './request-service'
export * as CaseService from './case-service'

// Inspections & Approvals
export * as InspectionService from './inspection-service'

// Billing Facts (Commerce Boundary)
export * as BillingFactService from './billing-fact-service'

// Audit & Transparency
export * as AuditService from './audit-service'
