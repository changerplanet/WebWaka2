'use client'

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'

// ============================================================================
// TYPES
// ============================================================================

export interface SVMProduct {
  id: string
  tenantId: string
  name: string
  slug: string
  description?: string
  shortDescription?: string
  categoryId?: string
  categoryName?: string
  tags: string[]
  basePrice: number
  compareAtPrice?: number | null
  currency: string
  images: { id: string; url: string; altText?: string; isDefault?: boolean }[]
  status: string
  hasVariants: boolean
  variants: SVMVariant[]
  options: any[]
  weight?: number
  weightUnit: string
}

export interface SVMVariant {
  id: string
  productId: string
  name: string
  sku: string
  price: number
  compareAtPrice?: number | null
  options: Record<string, string>
  imageUrl?: string
  inventoryQuantity: number
  isActive: boolean
}

export interface CartItem {
  productId: string
  variantId?: string
  productName: string
  variantName?: string
  sku?: string
  unitPrice: number
  quantity: number
  imageUrl?: string
  lineTotal: number
}

export interface Cart {
  id: string | null
  items: CartItem[]
  itemCount: number
  subtotal: number
  promotionCode?: string | null
  discountTotal: number
  shippingTotal: number
  taxTotal: number
  total: number
}

export interface ShippingOption {
  rateId: string
  zoneName: string
  rateName: string
  carrier?: string
  description?: string
  fee: number
  isFree: boolean
  freeShippingApplied: boolean
  amountToFreeShipping?: number
  estimatedDays?: { min?: number; max?: number }
}

export interface ShippingAddress {
  name: string
  address1: string
  address2?: string
  city: string
  state?: string
  postalCode: string
  country: string
  phone?: string
  email?: string
}

interface SVMContextType {
  // Config
  tenantId: string
  sessionId: string
  
  // Products
  products: SVMProduct[]
  currentProduct: SVMProduct | null
  isLoadingProducts: boolean
  
  // Cart
  cart: Cart
  isCartOpen: boolean
  
  // Checkout
  shippingAddress: ShippingAddress | null
  shippingOptions: ShippingOption[]
  selectedShipping: ShippingOption | null
  isLoadingShipping: boolean
  
  // Order
  currentOrder: any | null
  
  // Actions
  fetchProducts: (query?: string, categoryId?: string) => Promise<void>
  fetchProduct: (productId: string) => Promise<SVMProduct | null>
  addToCart: (product: SVMProduct, variant?: SVMVariant, quantity?: number) => Promise<void>
  updateCartQuantity: (productId: string, variantId: string | undefined, quantity: number) => Promise<void>
  removeFromCart: (productId: string, variantId?: string) => Promise<void>
  clearCart: () => Promise<void>
  applyPromoCode: (code: string) => Promise<{ success: boolean; error?: string }>
  removePromoCode: () => Promise<void>
  setShippingAddress: (address: ShippingAddress) => void
  calculateShipping: (address: ShippingAddress) => Promise<void>
  selectShipping: (option: ShippingOption) => void
  placeOrder: () => Promise<{ success: boolean; order?: any; error?: string }>
  toggleCart: () => void
  resetOrder: () => void
}

const SVMContext = createContext<SVMContextType | null>(null)

export function useSVM() {
  const context = useContext(SVMContext)
  if (!context) {
    throw new Error('useSVM must be used within SVMProvider')
  }
  return context
}

// ============================================================================
// DEMO DATA
// ============================================================================

const DEMO_PRODUCTS: SVMProduct[] = [
  {
    id: 'prod-1', tenantId: 'demo', name: 'Classic White T-Shirt', slug: 'classic-white-tshirt',
    description: 'A timeless classic white t-shirt made from 100% organic cotton. Perfect for everyday wear.',
    shortDescription: 'Premium organic cotton t-shirt',
    categoryId: 'cat-1', categoryName: 'Clothing', tags: ['cotton', 'basics', 'unisex'],
    basePrice: 29.99, compareAtPrice: 39.99, currency: 'USD',
    images: [{ id: 'img-1', url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400', altText: 'White T-Shirt', isDefault: true }],
    status: 'ACTIVE', hasVariants: true, options: [{ name: 'Size', values: ['S', 'M', 'L', 'XL'] }],
    variants: [
      { id: 'var-1a', productId: 'prod-1', name: 'Small', sku: 'TSH-WHT-S', price: 29.99, options: { Size: 'S' }, inventoryQuantity: 25, isActive: true },
      { id: 'var-1b', productId: 'prod-1', name: 'Medium', sku: 'TSH-WHT-M', price: 29.99, options: { Size: 'M' }, inventoryQuantity: 50, isActive: true },
      { id: 'var-1c', productId: 'prod-1', name: 'Large', sku: 'TSH-WHT-L', price: 29.99, options: { Size: 'L' }, inventoryQuantity: 30, isActive: true },
      { id: 'var-1d', productId: 'prod-1', name: 'X-Large', sku: 'TSH-WHT-XL', price: 29.99, options: { Size: 'XL' }, inventoryQuantity: 15, isActive: true },
    ],
    weight: 0.3, weightUnit: 'lb'
  },
  {
    id: 'prod-2', tenantId: 'demo', name: 'Denim Jacket', slug: 'denim-jacket',
    description: 'Classic denim jacket with a modern fit. Features brass buttons and multiple pockets.',
    shortDescription: 'Vintage-style denim jacket',
    categoryId: 'cat-1', categoryName: 'Clothing', tags: ['denim', 'outerwear', 'vintage'],
    basePrice: 89.99, compareAtPrice: null, currency: 'USD',
    images: [{ id: 'img-2', url: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=400', altText: 'Denim Jacket', isDefault: true }],
    status: 'ACTIVE', hasVariants: true, options: [{ name: 'Size', values: ['S', 'M', 'L'] }],
    variants: [
      { id: 'var-2a', productId: 'prod-2', name: 'Small', sku: 'DNM-JKT-S', price: 89.99, options: { Size: 'S' }, inventoryQuantity: 10, isActive: true },
      { id: 'var-2b', productId: 'prod-2', name: 'Medium', sku: 'DNM-JKT-M', price: 89.99, options: { Size: 'M' }, inventoryQuantity: 15, isActive: true },
      { id: 'var-2c', productId: 'prod-2', name: 'Large', sku: 'DNM-JKT-L', price: 89.99, options: { Size: 'L' }, inventoryQuantity: 8, isActive: true },
    ],
    weight: 1.2, weightUnit: 'lb'
  },
  {
    id: 'prod-3', tenantId: 'demo', name: 'Running Sneakers', slug: 'running-sneakers',
    description: 'Lightweight running sneakers with superior cushioning and breathable mesh upper.',
    shortDescription: 'Performance running shoes',
    categoryId: 'cat-2', categoryName: 'Footwear', tags: ['shoes', 'running', 'athletic'],
    basePrice: 129.99, compareAtPrice: 159.99, currency: 'USD',
    images: [{ id: 'img-3', url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400', altText: 'Running Sneakers', isDefault: true }],
    status: 'ACTIVE', hasVariants: true, options: [{ name: 'Size', values: ['8', '9', '10', '11', '12'] }],
    variants: [
      { id: 'var-3a', productId: 'prod-3', name: 'Size 8', sku: 'SNK-RUN-8', price: 129.99, options: { Size: '8' }, inventoryQuantity: 12, isActive: true },
      { id: 'var-3b', productId: 'prod-3', name: 'Size 9', sku: 'SNK-RUN-9', price: 129.99, options: { Size: '9' }, inventoryQuantity: 18, isActive: true },
      { id: 'var-3c', productId: 'prod-3', name: 'Size 10', sku: 'SNK-RUN-10', price: 129.99, options: { Size: '10' }, inventoryQuantity: 20, isActive: true },
      { id: 'var-3d', productId: 'prod-3', name: 'Size 11', sku: 'SNK-RUN-11', price: 129.99, options: { Size: '11' }, inventoryQuantity: 14, isActive: true },
      { id: 'var-3e', productId: 'prod-3', name: 'Size 12', sku: 'SNK-RUN-12', price: 129.99, options: { Size: '12' }, inventoryQuantity: 8, isActive: true },
    ],
    weight: 0.8, weightUnit: 'lb'
  },
  {
    id: 'prod-4', tenantId: 'demo', name: 'Leather Wallet', slug: 'leather-wallet',
    description: 'Handcrafted genuine leather wallet with RFID protection. Multiple card slots and bill compartment.',
    shortDescription: 'Premium leather bifold wallet',
    categoryId: 'cat-3', categoryName: 'Accessories', tags: ['leather', 'wallet', 'gift'],
    basePrice: 49.99, compareAtPrice: null, currency: 'USD',
    images: [{ id: 'img-4', url: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=400', altText: 'Leather Wallet', isDefault: true }],
    status: 'ACTIVE', hasVariants: true, options: [{ name: 'Color', values: ['Brown', 'Black'] }],
    variants: [
      { id: 'var-4a', productId: 'prod-4', name: 'Brown', sku: 'WLT-LTH-BRN', price: 49.99, options: { Color: 'Brown' }, inventoryQuantity: 35, isActive: true },
      { id: 'var-4b', productId: 'prod-4', name: 'Black', sku: 'WLT-LTH-BLK', price: 49.99, options: { Color: 'Black' }, inventoryQuantity: 40, isActive: true },
    ],
    weight: 0.2, weightUnit: 'lb'
  },
  {
    id: 'prod-5', tenantId: 'demo', name: 'Wireless Headphones', slug: 'wireless-headphones',
    description: 'Premium wireless headphones with active noise cancellation and 30-hour battery life.',
    shortDescription: 'ANC wireless headphones',
    categoryId: 'cat-4', categoryName: 'Electronics', tags: ['audio', 'wireless', 'noise-cancelling'],
    basePrice: 199.99, compareAtPrice: 249.99, currency: 'USD',
    images: [{ id: 'img-5', url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400', altText: 'Wireless Headphones', isDefault: true }],
    status: 'ACTIVE', hasVariants: false, options: [],
    variants: [
      { id: 'var-5a', productId: 'prod-5', name: 'Default', sku: 'HP-WLS-BLK', price: 199.99, options: {}, inventoryQuantity: 25, isActive: true },
    ],
    weight: 0.5, weightUnit: 'lb'
  },
  {
    id: 'prod-6', tenantId: 'demo', name: 'Canvas Backpack', slug: 'canvas-backpack',
    description: 'Durable canvas backpack with laptop compartment. Water-resistant and perfect for travel.',
    shortDescription: 'Travel-ready canvas backpack',
    categoryId: 'cat-3', categoryName: 'Accessories', tags: ['bags', 'travel', 'canvas'],
    basePrice: 69.99, compareAtPrice: null, currency: 'USD',
    images: [{ id: 'img-6', url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400', altText: 'Canvas Backpack', isDefault: true }],
    status: 'ACTIVE', hasVariants: true, options: [{ name: 'Color', values: ['Navy', 'Olive', 'Gray'] }],
    variants: [
      { id: 'var-6a', productId: 'prod-6', name: 'Navy', sku: 'BP-CNV-NVY', price: 69.99, options: { Color: 'Navy' }, inventoryQuantity: 20, isActive: true },
      { id: 'var-6b', productId: 'prod-6', name: 'Olive', sku: 'BP-CNV-OLV', price: 69.99, options: { Color: 'Olive' }, inventoryQuantity: 15, isActive: true },
      { id: 'var-6c', productId: 'prod-6', name: 'Gray', sku: 'BP-CNV-GRY', price: 69.99, options: { Color: 'Gray' }, inventoryQuantity: 18, isActive: true },
    ],
    weight: 1.0, weightUnit: 'lb'
  },
  {
    id: 'prod-7', tenantId: 'demo', name: 'Sunglasses', slug: 'sunglasses',
    description: 'Classic aviator sunglasses with polarized lenses and UV400 protection.',
    shortDescription: 'Polarized aviator sunglasses',
    categoryId: 'cat-3', categoryName: 'Accessories', tags: ['eyewear', 'summer', 'polarized'],
    basePrice: 79.99, compareAtPrice: 99.99, currency: 'USD',
    images: [{ id: 'img-7', url: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400', altText: 'Sunglasses', isDefault: true }],
    status: 'ACTIVE', hasVariants: false, options: [],
    variants: [
      { id: 'var-7a', productId: 'prod-7', name: 'Default', sku: 'SG-AVT-GLD', price: 79.99, options: {}, inventoryQuantity: 50, isActive: true },
    ],
    weight: 0.1, weightUnit: 'lb'
  },
  {
    id: 'prod-8', tenantId: 'demo', name: 'Fitness Watch', slug: 'fitness-watch',
    description: 'Smart fitness watch with heart rate monitoring, GPS, and 7-day battery life.',
    shortDescription: 'GPS fitness smartwatch',
    categoryId: 'cat-4', categoryName: 'Electronics', tags: ['fitness', 'smartwatch', 'gps'],
    basePrice: 149.99, compareAtPrice: null, currency: 'USD',
    images: [{ id: 'img-8', url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400', altText: 'Fitness Watch', isDefault: true }],
    status: 'ACTIVE', hasVariants: true, options: [{ name: 'Color', values: ['Black', 'White'] }],
    variants: [
      { id: 'var-8a', productId: 'prod-8', name: 'Black', sku: 'FW-GPS-BLK', price: 149.99, options: { Color: 'Black' }, inventoryQuantity: 30, isActive: true },
      { id: 'var-8b', productId: 'prod-8', name: 'White', sku: 'FW-GPS-WHT', price: 149.99, options: { Color: 'White' }, inventoryQuantity: 25, isActive: true },
    ],
    weight: 0.1, weightUnit: 'lb'
  },
]

const DEMO_SHIPPING_OPTIONS: ShippingOption[] = [
  { rateId: 'ship-1', zoneName: 'Domestic', rateName: 'Standard Shipping', carrier: 'USPS', fee: 5.99, isFree: false, freeShippingApplied: false, amountToFreeShipping: 44.01, estimatedDays: { min: 5, max: 7 } },
  { rateId: 'ship-2', zoneName: 'Domestic', rateName: 'Express Shipping', carrier: 'FedEx', fee: 12.99, isFree: false, freeShippingApplied: false, estimatedDays: { min: 2, max: 3 } },
  { rateId: 'ship-3', zoneName: 'Domestic', rateName: 'Overnight', carrier: 'FedEx', fee: 24.99, isFree: false, freeShippingApplied: false, estimatedDays: { min: 1, max: 1 } },
]

// ============================================================================
// STORAGE HELPERS
// ============================================================================

const STORAGE_KEYS = {
  CART: 'svm_cart',
  SESSION: 'svm_session',
  SHIPPING_ADDRESS: 'svm_shipping_address'
}

function generateSessionId(): string {
  return `sess_${Date.now().toString(36)}${Math.random().toString(36).substring(2, 9)}`
}

function loadFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue
  try {
    const stored = localStorage.getItem(key)
    return stored ? JSON.parse(stored) : defaultValue
  } catch {
    return defaultValue
  }
}

function saveToStorage(key: string, value: any): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    console.warn('Failed to save to storage:', e)
  }
}

// ============================================================================
// PROVIDER
// ============================================================================

interface SVMProviderProps {
  children: ReactNode
  tenantId?: string
}

export function SVMProvider({ children, tenantId }: SVMProviderProps) {
  // Require explicit tenant ID - no hardcoded defaults
  if (!tenantId) {
    throw new Error('SVMProvider requires a tenantId. No tenant context available.')
  }
  const [sessionId] = useState(() => {
    if (typeof window === 'undefined') return generateSessionId()
    const stored = loadFromStorage<string>(STORAGE_KEYS.SESSION, '')
    if (stored) return stored
    const newSession = generateSessionId()
    saveToStorage(STORAGE_KEYS.SESSION, newSession)
    return newSession
  })

  const [products, setProducts] = useState<SVMProduct[]>([])
  const [currentProduct, setCurrentProduct] = useState<SVMProduct | null>(null)
  const [isLoadingProducts, setIsLoadingProducts] = useState(false)
  
  const [cart, setCart] = useState<Cart>({
    id: null,
    items: [],
    itemCount: 0,
    subtotal: 0,
    promotionCode: null,
    discountTotal: 0,
    shippingTotal: 0,
    taxTotal: 0,
    total: 0
  })
  const [isCartOpen, setIsCartOpen] = useState(false)
  
  const [shippingAddress, setShippingAddressState] = useState<ShippingAddress | null>(null)
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([])
  const [selectedShipping, setSelectedShipping] = useState<ShippingOption | null>(null)
  const [isLoadingShipping, setIsLoadingShipping] = useState(false)
  
  const [currentOrder, setCurrentOrder] = useState<any | null>(null)

  // Load cart from storage on mount
  useEffect(() => {
    const savedCart = loadFromStorage<Cart>(STORAGE_KEYS.CART, cart)
    if (savedCart.items.length > 0) {
      setCart(savedCart)
    }
    const savedAddress = loadFromStorage<ShippingAddress | null>(STORAGE_KEYS.SHIPPING_ADDRESS, null)
    if (savedAddress) {
      setShippingAddressState(savedAddress)
    }
  }, [])

  // Save cart to storage on change
  useEffect(() => {
    if (cart.items.length > 0 || cart.id) {
      saveToStorage(STORAGE_KEYS.CART, cart)
    }
  }, [cart])

  const recalculateCart = useCallback((items: CartItem[], promoCode?: string | null, shipping?: number) => {
    const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0)
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
    const discountTotal = promoCode ? subtotal * 0.1 : 0 // Mock 10% discount
    const shippingTotal = shipping ?? cart.shippingTotal
    const taxTotal = (subtotal - discountTotal) * 0.08 // 8% tax
    const total = subtotal - discountTotal + shippingTotal + taxTotal

    return {
      subtotal,
      itemCount,
      discountTotal,
      shippingTotal,
      taxTotal,
      total
    }
  }, [cart.shippingTotal])

  const fetchProducts = useCallback(async (query?: string, categoryId?: string) => {
    setIsLoadingProducts(true)
    try {
      const res = await fetch(`/api/svm/catalog?tenantId=${tenantId}${query ? `&query=${encodeURIComponent(query)}` : ''}${categoryId ? `&categoryId=${categoryId}` : ''}&limit=24`)
      const data = await res.json()
      
      if (data.success && data.products?.length > 0) {
        setProducts(data.products)
      } else {
        // Use demo products
        let filtered = DEMO_PRODUCTS
        if (query) {
          const q = query.toLowerCase()
          filtered = filtered.filter(p => 
            p.name.toLowerCase().includes(q) || 
            p.description?.toLowerCase().includes(q) ||
            p.tags.some(t => t.includes(q))
          )
        }
        if (categoryId) {
          filtered = filtered.filter(p => p.categoryId === categoryId)
        }
        setProducts(filtered)
      }
    } catch (e) {
      console.warn('Failed to fetch products, using demo:', e)
      setProducts(DEMO_PRODUCTS)
    } finally {
      setIsLoadingProducts(false)
    }
  }, [tenantId])

  const fetchProduct = useCallback(async (productId: string): Promise<SVMProduct | null> => {
    try {
      const res = await fetch(`/api/svm/catalog?tenantId=${tenantId}&productId=${productId}`)
      const data = await res.json()
      
      if (data.success && data.product) {
        setCurrentProduct(data.product)
        return data.product
      }
    } catch (e) {
      console.warn('Failed to fetch product, using demo:', e)
    }
    
    // Fallback to demo
    const demo = DEMO_PRODUCTS.find(p => p.id === productId || p.slug === productId)
    if (demo) {
      setCurrentProduct(demo)
      return demo
    }
    return null
  }, [tenantId])

  const addToCart = useCallback(async (product: SVMProduct, variant?: SVMVariant, quantity = 1) => {
    const selectedVariant = variant || product.variants[0]
    
    setCart(prev => {
      const existingIndex = prev.items.findIndex(
        item => item.productId === product.id && item.variantId === selectedVariant?.id
      )

      let newItems: CartItem[]
      if (existingIndex >= 0) {
        newItems = [...prev.items]
        newItems[existingIndex] = {
          ...newItems[existingIndex],
          quantity: newItems[existingIndex].quantity + quantity,
          lineTotal: (newItems[existingIndex].quantity + quantity) * newItems[existingIndex].unitPrice
        }
      } else {
        const newItem: CartItem = {
          productId: product.id,
          variantId: selectedVariant?.id,
          productName: product.name,
          variantName: selectedVariant?.name !== 'Default' ? selectedVariant?.name : undefined,
          sku: selectedVariant?.sku,
          unitPrice: selectedVariant?.price || product.basePrice,
          quantity,
          imageUrl: product.images[0]?.url,
          lineTotal: (selectedVariant?.price || product.basePrice) * quantity
        }
        newItems = [...prev.items, newItem]
      }

      const calculated = recalculateCart(newItems, prev.promotionCode)
      return {
        ...prev,
        items: newItems,
        ...calculated
      }
    })
    
    setIsCartOpen(true)
  }, [recalculateCart])

  const updateCartQuantity = useCallback(async (productId: string, variantId: string | undefined, quantity: number) => {
    setCart(prev => {
      let newItems: CartItem[]
      if (quantity <= 0) {
        newItems = prev.items.filter(item => !(item.productId === productId && item.variantId === variantId))
      } else {
        newItems = prev.items.map(item => {
          if (item.productId === productId && item.variantId === variantId) {
            return { ...item, quantity, lineTotal: item.unitPrice * quantity }
          }
          return item
        })
      }
      const calculated = recalculateCart(newItems, prev.promotionCode)
      return { ...prev, items: newItems, ...calculated }
    })
  }, [recalculateCart])

  const removeFromCart = useCallback(async (productId: string, variantId?: string) => {
    setCart(prev => {
      const newItems = prev.items.filter(item => !(item.productId === productId && item.variantId === variantId))
      const calculated = recalculateCart(newItems, prev.promotionCode)
      return { ...prev, items: newItems, ...calculated }
    })
  }, [recalculateCart])

  const clearCart = useCallback(async () => {
    setCart({
      id: null,
      items: [],
      itemCount: 0,
      subtotal: 0,
      promotionCode: null,
      discountTotal: 0,
      shippingTotal: 0,
      taxTotal: 0,
      total: 0
    })
    localStorage.removeItem(STORAGE_KEYS.CART)
  }, [])

  const applyPromoCode = useCallback(async (code: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/svm/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          action: 'VALIDATE',
          code,
          subtotal: cart.subtotal,
          items: cart.items
        })
      })
      const data = await res.json()
      
      if (data.valid) {
        setCart(prev => {
          const calculated = recalculateCart(prev.items, code)
          return { ...prev, promotionCode: code, ...calculated }
        })
        return { success: true }
      }
      return { success: false, error: data.error || 'Invalid code' }
    } catch (e) {
      // Demo mode - accept any code
      if (code.toUpperCase() === 'SAVE10' || code.toUpperCase() === 'DEMO') {
        setCart(prev => {
          const calculated = recalculateCart(prev.items, code)
          return { ...prev, promotionCode: code, ...calculated }
        })
        return { success: true }
      }
      return { success: false, error: 'Invalid promo code' }
    }
  }, [tenantId, cart.subtotal, cart.items, recalculateCart])

  const removePromoCode = useCallback(async () => {
    setCart(prev => {
      const calculated = recalculateCart(prev.items, null)
      return { ...prev, promotionCode: null, ...calculated }
    })
  }, [recalculateCart])

  const setShippingAddress = useCallback((address: ShippingAddress) => {
    setShippingAddressState(address)
    saveToStorage(STORAGE_KEYS.SHIPPING_ADDRESS, address)
  }, [])

  const calculateShipping = useCallback(async (address: ShippingAddress) => {
    setIsLoadingShipping(true)
    try {
      const res = await fetch('/api/svm/shipping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          destination: {
            country: address.country,
            state: address.state,
            city: address.city,
            postalCode: address.postalCode
          },
          items: cart.items.map(item => ({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            unitPrice: item.unitPrice
          })),
          subtotal: cart.subtotal
        })
      })
      const data = await res.json()
      
      if (data.success && data.options?.length > 0) {
        // Update free shipping threshold based on subtotal
        const options = data.options.map((opt: ShippingOption) => ({
          ...opt,
          amountToFreeShipping: opt.freeShippingApplied ? 0 : 
            (cart.subtotal >= 50 ? 0 : 50 - cart.subtotal)
        }))
        setShippingOptions(options)
        setSelectedShipping(options[0])
      } else {
        // Use demo shipping with free shipping threshold
        const demoOptions = DEMO_SHIPPING_OPTIONS.map(opt => ({
          ...opt,
          isFree: cart.subtotal >= 50,
          fee: cart.subtotal >= 50 ? 0 : opt.fee,
          freeShippingApplied: cart.subtotal >= 50,
          amountToFreeShipping: cart.subtotal >= 50 ? 0 : 50 - cart.subtotal
        }))
        setShippingOptions(demoOptions)
        setSelectedShipping(demoOptions[0])
      }
    } catch (e) {
      console.warn('Failed to calculate shipping, using demo:', e)
      const demoOptions = DEMO_SHIPPING_OPTIONS.map(opt => ({
        ...opt,
        isFree: cart.subtotal >= 50,
        fee: cart.subtotal >= 50 ? 0 : opt.fee,
        freeShippingApplied: cart.subtotal >= 50,
        amountToFreeShipping: cart.subtotal >= 50 ? 0 : 50 - cart.subtotal
      }))
      setShippingOptions(demoOptions)
      setSelectedShipping(demoOptions[0])
    } finally {
      setIsLoadingShipping(false)
    }
  }, [tenantId, cart.items, cart.subtotal])

  const selectShipping = useCallback((option: ShippingOption) => {
    setSelectedShipping(option)
    setCart(prev => {
      const calculated = recalculateCart(prev.items, prev.promotionCode, option.fee)
      // Remove shippingTotal from calculated to avoid duplicate property
      const { shippingTotal: _unused, ...rest } = calculated
      return { ...prev, shippingTotal: option.fee, ...rest }
    })
  }, [recalculateCart])

  const placeOrder = useCallback(async (): Promise<{ success: boolean; order?: any; error?: string }> => {
    if (!shippingAddress || !selectedShipping || cart.items.length === 0) {
      return { success: false, error: 'Missing required information' }
    }

    try {
      const res = await fetch('/api/svm/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          guestEmail: shippingAddress.email,
          items: cart.items.map(item => ({
            productId: item.productId,
            variantId: item.variantId,
            productName: item.productName,
            productSku: item.sku,
            variantName: item.variantName,
            unitPrice: item.unitPrice,
            quantity: item.quantity
          })),
          shippingAddress,
          shippingMethod: selectedShipping.rateName,
          shippingTotal: selectedShipping.fee,
          taxTotal: cart.taxTotal,
          discountTotal: cart.discountTotal,
          currency: 'USD'
        })
      })
      const data = await res.json()
      
      if (data.success) {
        setCurrentOrder(data.order)
        await clearCart()
        return { success: true, order: data.order }
      }
      return { success: false, error: data.error || 'Failed to place order' }
    } catch (e) {
      // Demo mode - create mock order
      const mockOrder = {
        id: `order_${Date.now().toString(36)}`,
        orderNumber: `ORD-${new Date().toISOString().slice(0,10).replace(/-/g, '')}-${Math.floor(Math.random() * 9999).toString().padStart(4, '0')}`,
        status: 'CONFIRMED',
        items: cart.items,
        subtotal: cart.subtotal,
        discountTotal: cart.discountTotal,
        shippingTotal: selectedShipping.fee,
        taxTotal: cart.taxTotal,
        grandTotal: cart.total,
        shippingAddress,
        shippingMethod: selectedShipping.rateName,
        estimatedDelivery: selectedShipping.estimatedDays,
        createdAt: new Date().toISOString()
      }
      setCurrentOrder(mockOrder)
      await clearCart()
      return { success: true, order: mockOrder }
    }
  }, [tenantId, shippingAddress, selectedShipping, cart, clearCart])

  const toggleCart = useCallback(() => {
    setIsCartOpen(prev => !prev)
  }, [])

  const resetOrder = useCallback(() => {
    setCurrentOrder(null)
    setShippingAddressState(null)
    setShippingOptions([])
    setSelectedShipping(null)
    localStorage.removeItem(STORAGE_KEYS.SHIPPING_ADDRESS)
  }, [])

  const value: SVMContextType = {
    tenantId,
    sessionId,
    products,
    currentProduct,
    isLoadingProducts,
    cart,
    isCartOpen,
    shippingAddress,
    shippingOptions,
    selectedShipping,
    isLoadingShipping,
    currentOrder,
    fetchProducts,
    fetchProduct,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    applyPromoCode,
    removePromoCode,
    setShippingAddress,
    calculateShipping,
    selectShipping,
    placeOrder,
    toggleCart,
    resetOrder
  }

  return (
    <SVMContext.Provider value={value}>
      {children}
    </SVMContext.Provider>
  )
}
