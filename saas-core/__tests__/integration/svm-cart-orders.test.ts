/**
 * SVM Cart & Orders API - Integration Tests
 * Tests the cart and order persistence endpoints
 */

const API_URL = process.env.API_URL || 'http://localhost:3000'
const TEST_TENANT = 'test-tenant-svm-integration'

describe('SVM Cart API Integration', () => {
  let cartId: string
  const sessionId = `session-${Date.now()}`

  describe('POST /api/svm/cart', () => {
    test('should create cart and add item', async () => {
      const response = await fetch(`${API_URL}/api/svm/cart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: TEST_TENANT,
          sessionId,
          action: 'ADD_ITEM',
          productId: 'test-product-001',
          productName: 'Test Product',
          unitPrice: 29.99,
          quantity: 2
        })
      })

      const data = await response.json()
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.cart).toBeDefined()
      expect(data.cart.itemCount).toBe(2)

      cartId = data.cart.id
    })

    test('should add another item to cart', async () => {
      const response = await fetch(`${API_URL}/api/svm/cart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: TEST_TENANT,
          sessionId,
          action: 'ADD_ITEM',
          productId: 'test-product-002',
          productName: 'Another Product',
          unitPrice: 15.00,
          quantity: 1
        })
      })

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.cart.items.length).toBe(2)
    })

    test('should merge same product (increase quantity)', async () => {
      const response = await fetch(`${API_URL}/api/svm/cart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: TEST_TENANT,
          sessionId,
          action: 'ADD_ITEM',
          productId: 'test-product-001', // Same as first item
          productName: 'Test Product',
          unitPrice: 29.99,
          quantity: 1
        })
      })

      const data = await response.json()
      expect(data.success).toBe(true)
      // First product should now have quantity 3
      const firstProduct = data.cart.items.find((i: any) => i.productId === 'test-product-001')
      expect(firstProduct.quantity).toBe(3)
    })

    test('should update item quantity', async () => {
      const response = await fetch(`${API_URL}/api/svm/cart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: TEST_TENANT,
          sessionId,
          action: 'UPDATE_QUANTITY',
          productId: 'test-product-002',
          quantity: 5
        })
      })

      const data = await response.json()
      expect(data.success).toBe(true)
      const product = data.cart.items.find((i: any) => i.productId === 'test-product-002')
      expect(product.quantity).toBe(5)
    })

    test('should set email on cart', async () => {
      const response = await fetch(`${API_URL}/api/svm/cart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: TEST_TENANT,
          sessionId,
          action: 'SET_EMAIL',
          email: 'test@example.com'
        })
      })

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.cart.email).toBe('test@example.com')
    })

    test('should remove item from cart', async () => {
      const response = await fetch(`${API_URL}/api/svm/cart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: TEST_TENANT,
          sessionId,
          action: 'REMOVE_ITEM',
          productId: 'test-product-002'
        })
      })

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.cart.items.length).toBe(1)
    })
  })

  describe('GET /api/svm/cart', () => {
    test('should get cart by sessionId', async () => {
      const response = await fetch(
        `${API_URL}/api/svm/cart?tenantId=${TEST_TENANT}&sessionId=${sessionId}`
      )

      const data = await response.json()
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.cart.id).toBe(cartId)
    })

    test('should return error without tenant/session', async () => {
      const response = await fetch(`${API_URL}/api/svm/cart?tenantId=${TEST_TENANT}`)
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toContain('required')
    })
  })
})

describe('SVM Orders API Integration', () => {
  let orderId: string
  let orderNumber: string
  const sessionId = `session-order-${Date.now()}`
  let cartId: string

  beforeAll(async () => {
    // Create a cart with items for order creation
    const cartResponse = await fetch(`${API_URL}/api/svm/cart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantId: TEST_TENANT,
        sessionId,
        action: 'ADD_ITEM',
        productId: 'order-product-001',
        productName: 'Order Test Product',
        unitPrice: 50.00,
        quantity: 2
      })
    })
    const cartData = await cartResponse.json()
    cartId = cartData.cart.id

    // Set email
    await fetch(`${API_URL}/api/svm/cart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantId: TEST_TENANT,
        sessionId,
        action: 'SET_EMAIL',
        email: 'order@test.com'
      })
    })
  })

  describe('POST /api/svm/orders', () => {
    test('should create order from cart', async () => {
      const response = await fetch(`${API_URL}/api/svm/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: TEST_TENANT,
          cartId,
          customerName: 'Test Customer',
          shippingAddress: {
            name: 'Test Customer',
            address1: '123 Test St',
            city: 'Test City',
            state: 'TS',
            postalCode: '12345',
            country: 'US'
          },
          shippingTotal: 5.99,
          taxTotal: 8.00
        })
      })

      const data = await response.json()
      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.order).toBeDefined()
      expect(data.order.orderNumber).toMatch(/^ORD-/)
      expect(data.order.status).toBe('PENDING')
      expect(data.order.items.length).toBe(1)

      orderId = data.order.id
      orderNumber = data.order.orderNumber
    })

    test('should create order with direct items', async () => {
      const response = await fetch(`${API_URL}/api/svm/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: TEST_TENANT,
          customerEmail: 'direct@test.com',
          customerName: 'Direct Order Customer',
          items: [
            { productId: 'direct-001', productName: 'Direct Product', unitPrice: 25, quantity: 2 }
          ],
          shippingAddress: {
            name: 'Direct',
            address1: '456 Direct Ave',
            city: 'Direct City',
            state: 'DC',
            postalCode: '54321',
            country: 'US'
          }
        })
      })

      const data = await response.json()
      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
    })

    test('should reject order without email', async () => {
      const response = await fetch(`${API_URL}/api/svm/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: TEST_TENANT,
          items: [{ productId: 'x', productName: 'X', unitPrice: 10, quantity: 1 }],
          shippingAddress: { name: 'X', address1: 'X', city: 'X', state: 'X', postalCode: 'X', country: 'US' }
        })
      })

      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toContain('customerEmail')
    })
  })

  describe('GET /api/svm/orders', () => {
    test('should list orders for tenant', async () => {
      const response = await fetch(`${API_URL}/api/svm/orders?tenantId=${TEST_TENANT}`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(Array.isArray(data.orders)).toBe(true)
      expect(data.pagination).toBeDefined()
    })

    test('should filter by order number', async () => {
      const response = await fetch(
        `${API_URL}/api/svm/orders?tenantId=${TEST_TENANT}&orderNumber=${orderNumber}`
      )
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.orders.length).toBeGreaterThan(0)
    })
  })

  describe('GET /api/svm/orders/:orderId', () => {
    test('should get order details', async () => {
      const response = await fetch(
        `${API_URL}/api/svm/orders/${orderId}?tenantId=${TEST_TENANT}`
      )
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.order.id).toBe(orderId)
      expect(data.order.items).toBeDefined()
    })

    test('should return 404 for non-existent order', async () => {
      const response = await fetch(
        `${API_URL}/api/svm/orders/non-existent-id?tenantId=${TEST_TENANT}`
      )
      const data = await response.json()

      expect(data.success).toBe(false)
      expect(data.error).toContain('not found')
    })
  })

  describe('PUT /api/svm/orders/:orderId (Status Updates)', () => {
    test('should update order to CONFIRMED', async () => {
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

    test('should update payment status to CAPTURED', async () => {
      const response = await fetch(`${API_URL}/api/svm/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: TEST_TENANT,
          paymentStatus: 'CAPTURED',
          paymentMethod: 'card',
          paymentRef: 'pi_test123'
        })
      })

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.order.paymentStatus).toBe('CAPTURED')
      expect(data.order.paidAt).toBeDefined()
    })

    test('should reject invalid status transition', async () => {
      const response = await fetch(`${API_URL}/api/svm/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: TEST_TENANT,
          status: 'DELIVERED' // Can't go directly to DELIVERED from CONFIRMED
        })
      })

      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toContain('Invalid status transition')
    })

    test('should update to PROCESSING with tracking', async () => {
      const response = await fetch(`${API_URL}/api/svm/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: TEST_TENANT,
          status: 'PROCESSING',
          trackingNumber: 'TRACK12345',
          shippingCarrier: 'UPS'
        })
      })

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.order.status).toBe('PROCESSING')
      expect(data.order.trackingNumber).toBe('TRACK12345')
    })
  })

  describe('DELETE /api/svm/orders/:orderId (Cancellation)', () => {
    let cancelOrderId: string

    beforeAll(async () => {
      // Create order to cancel
      const response = await fetch(`${API_URL}/api/svm/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: TEST_TENANT,
          customerEmail: 'cancel@test.com',
          items: [{ productId: 'cancel-001', productName: 'Cancel Product', unitPrice: 10, quantity: 1 }],
          shippingAddress: { name: 'Cancel', address1: 'Cancel St', city: 'Cancel', state: 'CC', postalCode: '00000', country: 'US' }
        })
      })
      const data = await response.json()
      cancelOrderId = data.order.id
    })

    test('should cancel order', async () => {
      const response = await fetch(
        `${API_URL}/api/svm/orders/${cancelOrderId}?tenantId=${TEST_TENANT}`,
        { method: 'DELETE' }
      )

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.order.status).toBe('CANCELLED')
      expect(data.order.cancelledAt).toBeDefined()
    })
  })
})
