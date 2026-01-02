/**
 * Jest Test Setup
 * Global configuration and utilities for all tests
 */

// Extend Jest matchers
import '@testing-library/jest-dom'

// Mock environment variables
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test'
process.env.NEXTAUTH_SECRET = 'test-secret-for-jest'
process.env.NEXTAUTH_URL = 'http://localhost:3000'

// Global test utilities
global.testTenantId = 'test-tenant-jest'
global.testCustomerId = 'test-customer-jest'
global.testVendorId = 'test-vendor-jest'

// Increase timeout for integration tests
jest.setTimeout(30000)

// Clean up after all tests
afterAll(async () => {
  // Allow connections to close
  await new Promise(resolve => setTimeout(resolve, 500))
})
