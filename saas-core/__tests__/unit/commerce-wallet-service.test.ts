/**
 * Commerce Wallet Service - Unit Tests
 * Tests the ledger-based wallet operations
 */

import { prisma } from '@/lib/prisma'
import {
  getOrCreateWallet,
  getWallet,
  getWalletWithLedger,
  createLedgerEntry,
  creditWallet,
  debitWallet,
  createHold,
  releaseHold,
  captureHold,
  transferFunds,
  recalculateBalance,
  getLedgerEntries
} from '@/lib/commerce-wallet-service'

// Test data
const TEST_TENANT = 'test-tenant-wallet-unit'
const TEST_CUSTOMER = 'test-customer-wallet-unit'
const TEST_VENDOR = 'test-vendor-wallet-unit'

describe('Commerce Wallet Service', () => {
  let customerWalletId: string
  let vendorWalletId: string
  let platformWalletId: string

  beforeAll(async () => {
    // Clean up any existing test wallets
    await prisma.commerceWalletLedger.deleteMany({
      where: { wallet: { tenantId: TEST_TENANT } }
    })
    await prisma.commerceWallet.deleteMany({
      where: { tenantId: TEST_TENANT }
    })
  })

  afterAll(async () => {
    // Cleanup
    await prisma.commerceWalletLedger.deleteMany({
      where: { wallet: { tenantId: TEST_TENANT } }
    })
    await prisma.commerceWallet.deleteMany({
      where: { tenantId: TEST_TENANT }
    })
    await prisma.$disconnect()
  })

  describe('Wallet Creation', () => {
    test('should create a CUSTOMER wallet', async () => {
      const wallet = await getOrCreateWallet({
        tenantId: TEST_TENANT,
        type: 'CUSTOMER',
        customerId: TEST_CUSTOMER
      })

      expect(wallet).toBeDefined()
      expect(wallet.type).toBe('CUSTOMER')
      expect(wallet.customerId).toBe(TEST_CUSTOMER)
      expect(wallet.status).toBe('ACTIVE')
      expect(Number(wallet.balance)).toBe(0)

      customerWalletId = wallet.id
    })

    test('should create a VENDOR wallet', async () => {
      const wallet = await getOrCreateWallet({
        tenantId: TEST_TENANT,
        type: 'VENDOR',
        vendorId: TEST_VENDOR
      })

      expect(wallet).toBeDefined()
      expect(wallet.type).toBe('VENDOR')
      expect(wallet.vendorId).toBe(TEST_VENDOR)

      vendorWalletId = wallet.id
    })

    test('should create a PLATFORM wallet', async () => {
      const wallet = await getOrCreateWallet({
        tenantId: TEST_TENANT,
        type: 'PLATFORM'
      })

      expect(wallet).toBeDefined()
      expect(wallet.type).toBe('PLATFORM')
      expect(wallet.customerId).toBeNull()
      expect(wallet.vendorId).toBeNull()

      platformWalletId = wallet.id
    })

    test('should return existing wallet (idempotent)', async () => {
      const wallet1 = await getOrCreateWallet({
        tenantId: TEST_TENANT,
        type: 'CUSTOMER',
        customerId: TEST_CUSTOMER
      })

      const wallet2 = await getOrCreateWallet({
        tenantId: TEST_TENANT,
        type: 'CUSTOMER',
        customerId: TEST_CUSTOMER
      })

      expect(wallet1.id).toBe(wallet2.id)
    })
  })

  describe('Credit Operations', () => {
    test('should credit wallet with CREDIT_SALE_PROCEEDS', async () => {
      const result = await creditWallet(
        vendorWalletId,
        100,
        'CREDIT_SALE_PROCEEDS',
        `credit-sale-${Date.now()}`,
        {
          description: 'Test sale proceeds',
          referenceType: 'ORDER',
          referenceId: 'test-order-001'
        }
      )

      expect(result.isDuplicate).toBe(false)
      expect(Number(result.wallet.balance)).toBe(100)
      expect(Number(result.entry.amount)).toBe(100)
      expect(result.entry.entryType).toBe('CREDIT_SALE_PROCEEDS')
    })

    test('should enforce idempotency on duplicate credit', async () => {
      const idempotencyKey = `credit-duplicate-${Date.now()}`

      const result1 = await creditWallet(
        vendorWalletId,
        50,
        'CREDIT_SALE_PROCEEDS',
        idempotencyKey
      )

      const result2 = await creditWallet(
        vendorWalletId,
        50,
        'CREDIT_SALE_PROCEEDS',
        idempotencyKey
      )

      expect(result1.isDuplicate).toBe(false)
      expect(result2.isDuplicate).toBe(true)
      expect(result1.entry.id).toBe(result2.entry.id)
    })

    test('should reject invalid credit entry type', async () => {
      await expect(
        creditWallet(
          vendorWalletId,
          10,
          'DEBIT_PAYOUT' as any,
          `invalid-credit-${Date.now()}`
        )
      ).rejects.toThrow('Invalid credit entry type')
    })
  })

  describe('Debit Operations', () => {
    test('should debit wallet with DEBIT_PAYOUT', async () => {
      // First ensure wallet has balance
      const wallet = await getWallet(vendorWalletId)
      const currentBalance = Number(wallet?.balance || 0)

      if (currentBalance < 30) {
        await creditWallet(
          vendorWalletId,
          100,
          'CREDIT_SALE_PROCEEDS',
          `credit-for-debit-${Date.now()}`
        )
      }

      const result = await debitWallet(
        vendorWalletId,
        30,
        'DEBIT_PAYOUT',
        `debit-payout-${Date.now()}`,
        {
          description: 'Test payout',
          referenceType: 'PAYOUT',
          referenceId: 'test-payout-001'
        }
      )

      expect(result.isDuplicate).toBe(false)
      expect(Number(result.entry.amount)).toBe(-30)
      expect(result.entry.entryType).toBe('DEBIT_PAYOUT')
    })

    test('should fail debit with insufficient balance', async () => {
      await expect(
        debitWallet(
          customerWalletId, // Has 0 balance
          1000,
          'DEBIT_PAYOUT',
          `debit-fail-${Date.now()}`
        )
      ).rejects.toThrow('Insufficient balance')
    })
  })

  describe('Hold Operations', () => {
    test('should create a hold', async () => {
      // Ensure wallet has balance
      await creditWallet(
        vendorWalletId,
        100,
        'CREDIT_SALE_PROCEEDS',
        `credit-for-hold-${Date.now()}`
      )

      const holdId = `hold-${Date.now()}`
      const result = await createHold(vendorWalletId, 50, holdId)

      expect(result.isDuplicate).toBe(false)
      expect(Number(result.wallet.pendingBalance)).toBeGreaterThan(0)
      expect(Number(result.wallet.availableBalance)).toBeLessThan(Number(result.wallet.balance))
    })

    test('should release a hold', async () => {
      const holdId = `hold-release-${Date.now()}`

      // Create hold first
      await createHold(vendorWalletId, 25, holdId)

      const result = await releaseHold(vendorWalletId, 25, holdId)

      expect(result.isDuplicate).toBe(false)
      expect(result.entry.entryType).toBe('HOLD_RELEASED')
    })

    test('should capture a hold', async () => {
      const holdId = `hold-capture-${Date.now()}`

      // Create hold first
      const beforeHold = await getWallet(vendorWalletId)
      const balanceBefore = Number(beforeHold?.balance || 0)

      await createHold(vendorWalletId, 20, holdId)
      const result = await captureHold(vendorWalletId, 20, holdId, {
        referenceType: 'PAYOUT',
        referenceId: 'captured-payout'
      })

      expect(result.entry.entryType).toBe('HOLD_CAPTURED')
      expect(Number(result.wallet.balance)).toBeLessThan(balanceBefore)
    })
  })

  describe('Transfer Operations', () => {
    test('should transfer funds between wallets', async () => {
      // Ensure vendor has balance
      await creditWallet(
        vendorWalletId,
        100,
        'CREDIT_SALE_PROCEEDS',
        `credit-for-transfer-${Date.now()}`
      )

      const result = await transferFunds({
        fromWalletId: vendorWalletId,
        toWalletId: customerWalletId,
        amount: 25,
        idempotencyKey: `transfer-${Date.now()}`,
        description: 'Test refund'
      })

      expect(result.success).toBe(true)
      expect(result.isDuplicate).toBe(false)

      const customerWallet = await getWallet(customerWalletId)
      expect(Number(customerWallet?.balance)).toBeGreaterThan(0)
    })

    test('should enforce idempotency on transfers', async () => {
      const idempotencyKey = `transfer-dup-${Date.now()}`

      await creditWallet(
        vendorWalletId,
        100,
        'CREDIT_SALE_PROCEEDS',
        `credit-for-dup-transfer-${Date.now()}`
      )

      const result1 = await transferFunds({
        fromWalletId: vendorWalletId,
        toWalletId: customerWalletId,
        amount: 10,
        idempotencyKey
      })

      const result2 = await transferFunds({
        fromWalletId: vendorWalletId,
        toWalletId: customerWalletId,
        amount: 10,
        idempotencyKey
      })

      expect(result1.isDuplicate).toBe(false)
      expect(result2.isDuplicate).toBe(true)
    })
  })

  describe('Ledger Operations', () => {
    test('should retrieve ledger entries', async () => {
      const result = await getLedgerEntries(vendorWalletId, { limit: 10 })

      expect(result.entries).toBeDefined()
      expect(Array.isArray(result.entries)).toBe(true)
      expect(result.total).toBeGreaterThan(0)
    })

    test('should filter ledger by entry type', async () => {
      const result = await getLedgerEntries(vendorWalletId, {
        entryType: 'CREDIT_SALE_PROCEEDS'
      })

      result.entries.forEach(entry => {
        expect(entry.entryType).toBe('CREDIT_SALE_PROCEEDS')
      })
    })

    test('should recalculate balance from ledger', async () => {
      const result = await recalculateBalance(vendorWalletId)

      expect(result.wallet).toBeDefined()
      expect(result.entryCount).toBeGreaterThan(0)
      expect(result.calculatedBalance).toBe(Number(result.wallet.balance))
    })
  })

  describe('Wallet Retrieval', () => {
    test('should get wallet by ID', async () => {
      const wallet = await getWallet(vendorWalletId)

      expect(wallet).toBeDefined()
      expect(wallet?.id).toBe(vendorWalletId)
    })

    test('should get wallet with ledger entries', async () => {
      const wallet = await getWalletWithLedger(vendorWalletId, 5)

      expect(wallet).toBeDefined()
      expect(wallet?.ledgerEntries).toBeDefined()
      expect(wallet?.ledgerEntries.length).toBeLessThanOrEqual(5)
    })

    test('should return null for non-existent wallet', async () => {
      const wallet = await getWallet('non-existent-wallet-id')
      expect(wallet).toBeNull()
    })
  })
})
