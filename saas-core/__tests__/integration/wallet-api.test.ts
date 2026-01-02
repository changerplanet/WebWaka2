/**
 * Commerce Wallet API - Integration Tests
 * Tests wallet endpoints and operations
 */

const API_URL = process.env.API_URL || 'http://localhost:3000'
const TEST_RUN = Date.now()
const TEST_TENANT = `test-tenant-wallet-integration-${TEST_RUN}`
const OTHER_TENANT = `other-tenant-isolation-test-${TEST_RUN}`

describe('Commerce Wallet API Integration', () => {
  let customerWalletId: string
  let vendorWalletId: string
  let platformWalletId: string

  describe('POST /api/wallets (Create Wallets)', () => {
    test('should create CUSTOMER wallet', async () => {
      const response = await fetch(`${API_URL}/api/wallets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: TEST_TENANT,
          type: 'CUSTOMER',
          customerId: 'customer-integration-test'
        })
      })

      const data = await response.json()
      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.wallet.type).toBe('CUSTOMER')
      expect(data.wallet.balance).toBe(0)
      expect(data.wallet.status).toBe('ACTIVE')

      customerWalletId = data.wallet.id
    })

    test('should create VENDOR wallet', async () => {
      const response = await fetch(`${API_URL}/api/wallets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: TEST_TENANT,
          type: 'VENDOR',
          vendorId: 'vendor-integration-test'
        })
      })

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.wallet.type).toBe('VENDOR')

      vendorWalletId = data.wallet.id
    })

    test('should create PLATFORM wallet', async () => {
      const response = await fetch(`${API_URL}/api/wallets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: TEST_TENANT,
          type: 'PLATFORM'
        })
      })

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.wallet.type).toBe('PLATFORM')

      platformWalletId = data.wallet.id
    })

    test('should reject CUSTOMER wallet without customerId', async () => {
      const response = await fetch(`${API_URL}/api/wallets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: TEST_TENANT,
          type: 'CUSTOMER'
        })
      })

      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toContain('customerId')
    })

    test('should reject invalid wallet type', async () => {
      const response = await fetch(`${API_URL}/api/wallets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: TEST_TENANT,
          type: 'INVALID'
        })
      })

      const data = await response.json()
      expect(data.success).toBe(false)
    })
  })

  describe('GET /api/wallets (List Wallets)', () => {
    test('should list wallets for tenant', async () => {
      const response = await fetch(`${API_URL}/api/wallets?tenantId=${TEST_TENANT}`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(Array.isArray(data.wallets)).toBe(true)
      expect(data.pagination).toBeDefined()
    })

    test('should filter by type', async () => {
      const response = await fetch(`${API_URL}/api/wallets?tenantId=${TEST_TENANT}&type=VENDOR`)
      const data = await response.json()

      expect(data.success).toBe(true)
      data.wallets.forEach((w: any) => {
        expect(w.type).toBe('VENDOR')
      })
    })
  })

  describe('POST /api/wallets/:walletId (Wallet Operations)', () => {
    test('should credit wallet', async () => {
      const response = await fetch(`${API_URL}/api/wallets/${vendorWalletId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: TEST_TENANT,
          action: 'credit',
          amount: 100,
          entryType: 'CREDIT_SALE_PROCEEDS',
          idempotencyKey: `credit-integration-${Date.now()}`,
          description: 'Integration test credit',
          referenceType: 'ORDER',
          referenceId: 'order-integration-001'
        })
      })

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.wallet.balance).toBe(100)
      expect(data.entry.entryType).toBe('CREDIT_SALE_PROCEEDS')
    })

    test('should enforce idempotency', async () => {
      const idempotencyKey = `credit-idempotent-${Date.now()}`

      const response1 = await fetch(`${API_URL}/api/wallets/${vendorWalletId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: TEST_TENANT,
          action: 'credit',
          amount: 50,
          entryType: 'CREDIT_SALE_PROCEEDS',
          idempotencyKey
        })
      })
      const data1 = await response1.json()

      const response2 = await fetch(`${API_URL}/api/wallets/${vendorWalletId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: TEST_TENANT,
          action: 'credit',
          amount: 50,
          entryType: 'CREDIT_SALE_PROCEEDS',
          idempotencyKey
        })
      })
      const data2 = await response2.json()

      expect(data1.isDuplicate).toBe(false)
      expect(data2.isDuplicate).toBe(true)
      expect(data1.entry.id).toBe(data2.entry.id)
    })

    test('should debit wallet', async () => {
      const response = await fetch(`${API_URL}/api/wallets/${vendorWalletId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: TEST_TENANT,
          action: 'debit',
          amount: 30,
          entryType: 'DEBIT_PAYOUT',
          idempotencyKey: `debit-integration-${Date.now()}`,
          referenceType: 'PAYOUT',
          referenceId: 'payout-001'
        })
      })

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.entry.entryType).toBe('DEBIT_PAYOUT')
    })

    test('should create and release hold', async () => {
      const holdId = `hold-integration-${Date.now()}`

      // Create hold
      const holdResponse = await fetch(`${API_URL}/api/wallets/${vendorWalletId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: TEST_TENANT,
          action: 'hold',
          amount: 25,
          holdId
        })
      })
      const holdData = await holdResponse.json()
      expect(holdData.success).toBe(true)
      expect(holdData.wallet.pendingBalance).toBeGreaterThan(0)

      // Release hold
      const releaseResponse = await fetch(`${API_URL}/api/wallets/${vendorWalletId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: TEST_TENANT,
          action: 'release',
          amount: 25,
          holdId
        })
      })
      const releaseData = await releaseResponse.json()
      expect(releaseData.success).toBe(true)
    })

    test('should reject insufficient balance', async () => {
      const response = await fetch(`${API_URL}/api/wallets/${customerWalletId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: TEST_TENANT,
          action: 'debit',
          amount: 10000,
          entryType: 'DEBIT_PAYOUT',
          idempotencyKey: `debit-fail-${Date.now()}`
        })
      })

      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toContain('Insufficient')
    })
  })

  describe('POST /api/wallets/transfer', () => {
    test('should transfer between wallets', async () => {
      // Ensure vendor has balance
      await fetch(`${API_URL}/api/wallets/${vendorWalletId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: TEST_TENANT,
          action: 'credit',
          amount: 100,
          entryType: 'CREDIT_SALE_PROCEEDS',
          idempotencyKey: `credit-for-transfer-${Date.now()}`
        })
      })

      const response = await fetch(`${API_URL}/api/wallets/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: TEST_TENANT,
          fromWalletId: vendorWalletId,
          toWalletId: customerWalletId,
          amount: 20,
          idempotencyKey: `transfer-integration-${Date.now()}`,
          description: 'Integration test refund'
        })
      })

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.toWallet.balance).toBeGreaterThan(0)
    })

    test('should reject same wallet transfer', async () => {
      const response = await fetch(`${API_URL}/api/wallets/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: TEST_TENANT,
          fromWalletId: vendorWalletId,
          toWalletId: vendorWalletId,
          amount: 10,
          idempotencyKey: `transfer-same-${Date.now()}`
        })
      })

      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toContain('same wallet')
    })
  })

  describe('GET /api/wallets/:walletId/ledger', () => {
    test('should get ledger entries', async () => {
      const response = await fetch(
        `${API_URL}/api/wallets/${vendorWalletId}/ledger?tenantId=${TEST_TENANT}`
      )
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(Array.isArray(data.entries)).toBe(true)
      expect(data.pagination).toBeDefined()
    })

    test('should filter by entryType', async () => {
      const response = await fetch(
        `${API_URL}/api/wallets/${vendorWalletId}/ledger?tenantId=${TEST_TENANT}&entryType=CREDIT_SALE_PROCEEDS`
      )
      const data = await response.json()

      expect(data.success).toBe(true)
      data.entries.forEach((e: any) => {
        expect(e.entryType).toBe('CREDIT_SALE_PROCEEDS')
      })
    })
  })

  describe('PUT /api/wallets/:walletId (Status & Recalculate)', () => {
    test('should update wallet status to FROZEN', async () => {
      const response = await fetch(`${API_URL}/api/wallets/${customerWalletId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: TEST_TENANT,
          status: 'FROZEN'
        })
      })

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.wallet.status).toBe('FROZEN')
    })

    test('should reject operations on frozen wallet', async () => {
      const response = await fetch(`${API_URL}/api/wallets/${customerWalletId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: TEST_TENANT,
          action: 'credit',
          amount: 10,
          entryType: 'CREDIT_REFUND',
          idempotencyKey: `frozen-credit-${Date.now()}`
        })
      })

      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toContain('not active')
    })

    test('should unfreeze wallet', async () => {
      const response = await fetch(`${API_URL}/api/wallets/${customerWalletId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: TEST_TENANT,
          status: 'ACTIVE'
        })
      })

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.wallet.status).toBe('ACTIVE')
    })

    test('should recalculate balance', async () => {
      const response = await fetch(`${API_URL}/api/wallets/${vendorWalletId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: TEST_TENANT,
          recalculate: true
        })
      })

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.reconciliation).toBeDefined()
      expect(data.reconciliation.entryCount).toBeGreaterThan(0)
    })
  })
})

describe('Tenant Isolation Tests', () => {
  let tenant1WalletId: string
  let tenant2WalletId: string

  beforeAll(async () => {
    // Create wallet for tenant 1
    const r1 = await fetch(`${API_URL}/api/wallets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantId: TEST_TENANT,
        type: 'CUSTOMER',
        customerId: 'isolation-customer-1'
      })
    })
    const d1 = await r1.json()
    tenant1WalletId = d1.wallet.id

    // Credit tenant 1 wallet
    await fetch(`${API_URL}/api/wallets/${tenant1WalletId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantId: TEST_TENANT,
        action: 'credit',
        amount: 100,
        entryType: 'CREDIT_REFUND',
        idempotencyKey: `isolation-credit-${Date.now()}`
      })
    })

    // Create wallet for tenant 2
    const r2 = await fetch(`${API_URL}/api/wallets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantId: OTHER_TENANT,
        type: 'CUSTOMER',
        customerId: 'isolation-customer-2'
      })
    })
    const d2 = await r2.json()
    tenant2WalletId = d2.wallet.id
  })

  test('should not access wallet from different tenant', async () => {
    // Try to get tenant1's wallet using tenant2's tenantId
    const response = await fetch(
      `${API_URL}/api/wallets/${tenant1WalletId}?tenantId=${OTHER_TENANT}`
    )
    const data = await response.json()

    expect(data.success).toBe(false)
    expect(data.error).toContain('does not belong')
  })

  test('should not modify wallet from different tenant', async () => {
    const response = await fetch(`${API_URL}/api/wallets/${tenant1WalletId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantId: OTHER_TENANT, // Wrong tenant
        action: 'debit',
        amount: 10,
        entryType: 'DEBIT_PAYOUT',
        idempotencyKey: `cross-tenant-debit-${Date.now()}`
      })
    })

    const data = await response.json()
    expect(data.success).toBe(false)
  })

  test('should not transfer between different tenant wallets', async () => {
    const response = await fetch(`${API_URL}/api/wallets/transfer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantId: TEST_TENANT,
        fromWalletId: tenant1WalletId,
        toWalletId: tenant2WalletId, // Different tenant
        amount: 10,
        idempotencyKey: `cross-tenant-transfer-${Date.now()}`
      })
    })

    const data = await response.json()
    expect(data.success).toBe(false)
    expect(data.error).toContain('tenant')
  })

  test('should only list wallets for requested tenant', async () => {
    const response = await fetch(`${API_URL}/api/wallets?tenantId=${TEST_TENANT}`)
    const data = await response.json()

    expect(data.success).toBe(true)
    data.wallets.forEach((w: any) => {
      expect(w.tenantId).toBe(TEST_TENANT)
    })
  })
})
