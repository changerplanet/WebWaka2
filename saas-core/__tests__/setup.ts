/**
 * Jest Test Setup
 * Global configuration and utilities for all tests
 */

// Extend Jest matchers
import '@testing-library/jest-dom'

// Load environment from .env file for database connection
import { config } from 'dotenv'
config({ path: '.env' })

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
