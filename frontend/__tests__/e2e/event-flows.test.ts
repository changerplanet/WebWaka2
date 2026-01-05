/**
 * Event Flow Tests
 * Tests end-to-end flows: Order lifecycle, Wallet transactions, Cart to Order
 */

const API_URL = process.env.API_URL || 'http://localhost:3000'
const TEST_TENANT = 'test-tenant-e2e-flow'

describe('E2E: Cart to Order to Wallet Flow', () => {
  const testRun = Date.now()
  const sessionId = `e2e-session-${testRun}`
  let cartId: string
  let orderId: string
  let vendorWalletId: string
  let platformWalletId: string

  beforeAll(async () => {
    // Create vendor wallet (unique per test run)
    const vendorRes = await fetch(`${API_URL}/api/wallets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantId: TEST_TENANT,
        type: 'VENDOR',
        vendorId: `e2e-vendor-${testRun}`
      })
    })
    const vendorData = await vendorRes.json()
    vendorWalletId = vendorData.wallet.id

    // Create platform wallet (unique per test run)
    const platformRes = await fetch(`${API_URL}/api/wallets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantId: TEST_TENANT,
        type: 'PLATFORM'
      })
    })
    const platformData = await platformRes.json()
    platformWalletId = platformData.wallet.id
  })

  test('Step 1: Create cart and add items', async () => {
    const response = await fetch(`${API_URL}/api/svm/cart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantId: TEST_TENANT,
        sessionId,
        action: 'ADD_ITEM',
        productId: 'e2e-product-001',
        productName: 'E2E Test Product',
        unitPrice: 100.00,
        quantity: 2
      })
    })

    const data = await response.json()
    expect(data.success).toBe(true)
    cartId = data.cart.id
    expect(data.cart.subtotal).toBe(200)
  })

  test('Step 2: Set customer email on cart', async () => {
    const response = await fetch(`${API_URL}/api/svm/cart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantId: TEST_TENANT,
        sessionId,
        action: 'SET_EMAIL',
        email: 'e2e-customer@test.com'
      })
    })

    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.cart.email).toBe('e2e-customer@test.com')
  })

  test('Step 3: Convert cart to order', async () => {
    const response = await fetch(`${API_URL}/api/svm/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantId: TEST_TENANT,
        cartId,
        customerName: 'E2E Customer',
        shippingAddress: {
          name: 'E2E Customer',
          address1: '123 E2E Street',
          city: 'E2E City',
          state: 'E2',
          postalCode: '12345',
          country: 'US'
        },
        shippingTotal: 10.00,
        taxTotal: 16.80
      })
    })

    const data = await response.json()
    expect(response.status).toBe(201)
    expect(data.success).toBe(true)
    expect(data.order.status).toBe('PENDING')
    expect(data.order.grandTotal).toBe(226.80) // 200 + 10 + 16.80

    orderId = data.order.id
  })

  test('Step 4: Verify cart marked as CONVERTED', async () => {
    const response = await fetch(
      `${API_URL}/api/svm/cart?tenantId=${TEST_TENANT}&sessionId=${sessionId}`
    )
    const data = await response.json()

    // The original cart was converted, so either:
    // 1. A new empty cart is created for the session
    // 2. Cart shows as CONVERTED status
    // Either way, itemCount should be 0 or cart should be converted
    expect(data.success).toBe(true)
    expect(data.cart).toBeDefined()
    // The cart returned is either new (0 items) or the old converted one
    if (data.cart.id === cartId) {
      expect(data.cart.status).toBe('CONVERTED')
    } else {
      expect(data.cart.itemCount).toBe(0)
    }
  })

  test('Step 5: Confirm order', async () => {
    const response = await fetch(`${API_URL}/api/svm/orders/${orderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantId: TEST_TENANT,
        status: 'CONFIRMED'
      })
    })

    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.order.status).toBe('CONFIRMED')
  })

  test('Step 6: Process payment and credit wallets', async () => {
    // Mark order as paid
    const payResponse = await fetch(`${API_URL}/api/svm/orders/${orderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantId: TEST_TENANT,
        paymentStatus: 'CAPTURED',
        paymentMethod: 'card',
        paymentRef: 'pi_e2e_test'
      })
    })
    const payData = await payResponse.json()
    expect(payData.success).toBe(true)
    expect(payData.order.paidAt).toBeDefined()

    // Credit vendor wallet (simulate order payment distribution)
    const vendorCredit = 200 * 0.90 // 90% to vendor
    const vendorCreditRes = await fetch(`${API_URL}/api/wallets/${vendorWalletId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantId: TEST_TENANT,
        action: 'credit',
        amount: vendorCredit,
        entryType: 'CREDIT_SALE_PROCEEDS',
        idempotencyKey: `order-${orderId}-vendor`,
        referenceType: 'ORDER',
        referenceId: orderId
      })
    })
    const vendorCreditData = await vendorCreditRes.json()
    expect(vendorCreditData.success).toBe(true)

    // Credit platform wallet
    const platformFee = 200 * 0.10 // 10% platform fee
    const platformCreditRes = await fetch(`${API_URL}/api/wallets/${platformWalletId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantId: TEST_TENANT,
        action: 'credit',
        amount: platformFee,
        entryType: 'CREDIT_PLATFORM_FEE',
        idempotencyKey: `order-${orderId}-platform`,
        referenceType: 'ORDER',
        referenceId: orderId
      })
    })
    const platformCreditData = await platformCreditRes.json()
    expect(platformCreditData.success).toBe(true)
  })

  test('Step 7: Process and ship order', async () => {
    // Move to PROCESSING
    await fetch(`${API_URL}/api/svm/orders/${orderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantId: TEST_TENANT,
        status: 'PROCESSING'
      })
    })

    // Ship order
    const shipResponse = await fetch(`${API_URL}/api/svm/orders/${orderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantId: TEST_TENANT,
        status: 'SHIPPED',
        trackingNumber: 'E2E-TRACK-001',
        shippingCarrier: 'E2E Express',
        fulfillmentStatus: 'FULFILLED'
      })
    })

    const shipData = await shipResponse.json()
    expect(shipData.success).toBe(true)
    expect(shipData.order.status).toBe('SHIPPED')
    expect(shipData.order.shippedAt).toBeDefined()
    expect(shipData.order.fulfillmentStatus).toBe('FULFILLED')
  })

  test('Step 8: Mark order as delivered', async () => {
    const response = await fetch(`${API_URL}/api/svm/orders/${orderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantId: TEST_TENANT,
        status: 'DELIVERED'
      })
    })

    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.order.status).toBe('DELIVERED')
    expect(data.order.deliveredAt).toBeDefined()
  })

  test('Step 9: Verify final wallet balances', async () => {
    // Check vendor wallet - should have 180 (90% of 200 order)
    const vendorRes = await fetch(
      `${API_URL}/api/wallets/${vendorWalletId}?tenantId=${TEST_TENANT}`
    )
    const vendorData = await vendorRes.json()
    expect(vendorData.wallet.balance).toBe(180) // 90% of 200

    // Check platform wallet - verify it has at least the 20 we credited
    // (Platform wallet is shared, so may have more from other tests)
    const platformRes = await fetch(
      `${API_URL}/api/wallets/${platformWalletId}?tenantId=${TEST_TENANT}`
    )
    const platformData = await platformRes.json()
    expect(platformData.wallet.balance).toBeGreaterThanOrEqual(20) // At least 10% of 200
  })

  test('Step 10: Verify ledger trail', async () => {
    // Check vendor ledger has order reference
    const ledgerRes = await fetch(
      `${API_URL}/api/wallets/${vendorWalletId}/ledger?tenantId=${TEST_TENANT}&referenceType=ORDER`
    )
    const ledgerData = await ledgerRes.json()

    expect(ledgerData.entries.length).toBeGreaterThan(0)
    const orderEntry = ledgerData.entries.find((e: any) => e.referenceId === orderId)
    expect(orderEntry).toBeDefined()
    expect(orderEntry.amount).toBe(180)
  })
})

describe('E2E: Order Cancellation and Refund Flow', () => {
  const testRun = Date.now()
  const sessionId = `e2e-cancel-${testRun}`
  let orderId: string
  let customerWalletId: string
  let vendorWalletId: string

  beforeAll(async () => {
    // Create customer wallet (unique per test run)
    const custRes = await fetch(`${API_URL}/api/wallets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantId: TEST_TENANT,
        type: 'CUSTOMER',
        customerId: `e2e-refund-customer-${testRun}`
      })
    })
    const custData = await custRes.json()
    customerWalletId = custData.wallet.id

    // Create vendor wallet with balance (unique per test run)
    const vendorRes = await fetch(`${API_URL}/api/wallets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantId: TEST_TENANT,
        type: 'VENDOR',
        vendorId: `e2e-refund-vendor-${testRun}`
      })
    })
    const vendorData = await vendorRes.json()
    vendorWalletId = vendorData.wallet.id

    // Give vendor initial balance
    await fetch(`${API_URL}/api/wallets/${vendorWalletId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantId: TEST_TENANT,
        action: 'credit',
        amount: 500,
        entryType: 'CREDIT_SALE_PROCEEDS',
        idempotencyKey: `vendor-initial-${testRun}`
      })
    })

    // Create and confirm an order
    const cartRes = await fetch(`${API_URL}/api/svm/cart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantId: TEST_TENANT,
        sessionId,
        action: 'ADD_ITEM',
        productId: 'refund-product',
        productName: 'Refund Test Product',
        unitPrice: 75.00,
        quantity: 2
      })
    })
    const cartData = await cartRes.json()

    await fetch(`${API_URL}/api/svm/cart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantId: TEST_TENANT,
        sessionId,
        action: 'SET_EMAIL',
        email: 'refund@test.com'
      })
    })

    const orderRes = await fetch(`${API_URL}/api/svm/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantId: TEST_TENANT,
        cartId: cartData.cart.id,
        customerName: 'Refund Customer',
        shippingAddress: {
          name: 'Refund',
          address1: 'Refund St',
          city: 'Refund City',
          state: 'RF',
          postalCode: '00000',
          country: 'US'
        }
      })
    })
    const orderData = await orderRes.json()
    orderId = orderData.order.id
  })

  test('Cancel order and process refund', async () => {
    // Cancel order
    const cancelRes = await fetch(
      `${API_URL}/api/svm/orders/${orderId}?tenantId=${TEST_TENANT}`,
      { method: 'DELETE' }
    )
    const cancelData = await cancelRes.json()
    expect(cancelData.success).toBe(true)
    expect(cancelData.order.status).toBe('CANCELLED')

    // Simulate refund: Transfer from vendor to customer
    const transferRes = await fetch(`${API_URL}/api/wallets/transfer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantId: TEST_TENANT,
        fromWalletId: vendorWalletId,
        toWalletId: customerWalletId,
        amount: 150, // Full refund
        idempotencyKey: `refund-${orderId}`,
        description: `Refund for cancelled order ${orderId}`,
        referenceType: 'REFUND',
        referenceId: orderId
      })
    })
    const transferData = await transferRes.json()
    expect(transferData.success).toBe(true)

    // Verify customer received refund
    const custWallet = await fetch(
      `${API_URL}/api/wallets/${customerWalletId}?tenantId=${TEST_TENANT}`
    )
    const custData = await custWallet.json()
    expect(custData.wallet.balance).toBe(150)
  })
})

describe('E2E: Wallet Hold and Payout Flow', () => {
  let vendorWalletId: string
  const testRun = Date.now()

  beforeAll(async () => {
    // Create vendor wallet with balance (unique per test run)
    const res = await fetch(`${API_URL}/api/wallets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantId: TEST_TENANT,
        type: 'VENDOR',
        vendorId: `e2e-payout-vendor-${testRun}`
      })
    })
    const data = await res.json()
    vendorWalletId = data.wallet.id

    // Credit vendor
    await fetch(`${API_URL}/api/wallets/${vendorWalletId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantId: TEST_TENANT,
        action: 'credit',
        amount: 1000,
        entryType: 'CREDIT_SALE_PROCEEDS',
        idempotencyKey: `payout-vendor-credit-${testRun}`
      })
    })
  })

  test('Hold, then capture for payout', async () => {
    const holdId = `payout-hold-${testRun}`
    const payoutAmount = 500

    // Get initial balance
    const initialRes = await fetch(
      `${API_URL}/api/wallets/${vendorWalletId}?tenantId=${TEST_TENANT}`
    )
    const initialData = await initialRes.json()
    const initialBalance = initialData.wallet.balance

    // Create hold for pending payout
    const holdRes = await fetch(`${API_URL}/api/wallets/${vendorWalletId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantId: TEST_TENANT,
        action: 'hold',
        amount: payoutAmount,
        holdId,
        description: 'Pending payout'
      })
    })
    const holdData = await holdRes.json()
    expect(holdData.success).toBe(true)
    expect(holdData.wallet.balance).toBe(initialBalance) // Balance unchanged
    expect(holdData.wallet.availableBalance).toBe(initialBalance - payoutAmount) // Available reduced

    // Capture hold (payout processed)
    const captureRes = await fetch(`${API_URL}/api/wallets/${vendorWalletId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantId: TEST_TENANT,
        action: 'capture',
        amount: payoutAmount,
        holdId,
        referenceType: 'PAYOUT',
        referenceId: `payout-${testRun}`
      })
    })
    const captureData = await captureRes.json()
    expect(captureData.success).toBe(true)
    expect(captureData.wallet.balance).toBe(initialBalance - payoutAmount) // Balance reduced
    expect(captureData.wallet.pendingBalance).toBe(0) // No pending
    expect(captureData.wallet.availableBalance).toBe(initialBalance - payoutAmount) // Available = Balance
  })

  test('Hold, then release (payout cancelled)', async () => {
    const holdId = `cancelled-payout-${testRun}`
    const holdAmount = 200

    // Get current balance before hold
    const beforeHold = await fetch(
      `${API_URL}/api/wallets/${vendorWalletId}?tenantId=${TEST_TENANT}`
    )
    const beforeHoldData = await beforeHold.json()
    const balanceBeforeHold = beforeHoldData.wallet.balance

    // Create hold
    await fetch(`${API_URL}/api/wallets/${vendorWalletId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantId: TEST_TENANT,
        action: 'hold',
        amount: holdAmount,
        holdId
      })
    })

    // Check available reduced
    const beforeRelease = await fetch(
      `${API_URL}/api/wallets/${vendorWalletId}?tenantId=${TEST_TENANT}`
    )
    const beforeData = await beforeRelease.json()
    expect(beforeData.wallet.availableBalance).toBe(balanceBeforeHold - holdAmount)

    // Release hold (payout cancelled)
    const releaseRes = await fetch(`${API_URL}/api/wallets/${vendorWalletId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantId: TEST_TENANT,
        action: 'release',
        amount: holdAmount,
        holdId
      })
    })
    const releaseData = await releaseRes.json()
    expect(releaseData.success).toBe(true)
    expect(releaseData.wallet.availableBalance).toBe(balanceBeforeHold) // Available restored
  })
})
