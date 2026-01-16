/**
 * MVM Multi-Vendor Cart Service (Wave K.1)
 * 
 * Production-grade cart system for multi-vendor marketplace.
 * Supports adding products from multiple vendors into one cart,
 * grouping by vendor, and preparing for unified checkout.
 * 
 * Key Features:
 * - Multi-vendor cart with vendor attribution
 * - Price snapshot at add time
 * - Tenant-safe, demo-safe operations
 * - Prepares input for OrderSplitService (Wave K.2)
 * 
 * @module lib/mvm/cart/multi-vendor-cart-service
 * @canonical Wave K.1
 */

import { prisma } from '@/lib/prisma'
import { TenantContext } from '@/lib/tenant-context'
import { Prisma, ChannelStatus } from '@prisma/client'

// ============================================================================
// TYPES
// ============================================================================

export interface MvmCartItem {
  id: string
  vendorId: string
  vendorName: string
  vendorSlug: string
  productId: string
  productName: string
  productSlug: string
  productImage: string | null
  variantId: string | null
  variantName: string | null
  quantity: number
  priceSnapshot: number
  currency: string
  createdAt: Date
}

export interface MvmVendorGroup {
  vendorId: string
  vendorName: string
  vendorSlug: string
  vendorLogo: string | null
  trustBadge: string | null
  averageRating: number | null
  items: MvmCartItem[]
  subtotal: number
}

export interface MvmCart {
  id: string
  tenantId: string
  cartKey: string
  isDemo: boolean
  createdAt: Date
  updatedAt: Date
  items: MvmCartItem[]
  vendorGroups: MvmVendorGroup[]
  totalItems: number
  totalAmount: number
  currency: string
}

export interface AddToCartInput {
  productId: string
  variantId?: string
  quantity: number
  vendorId: string
}

export interface UpdateCartItemInput {
  itemId: string
  quantity: number
}

export interface CartConflict {
  type: 'price_changed' | 'stock_changed' | 'item_removed' | 'vendor_disabled' | 'product_unavailable'
  itemId: string
  productId: string
  productName: string
  oldValue?: number
  newValue?: number
  message: string
}

export interface CheckoutPrepResult {
  success: boolean
  cart: MvmCart | null
  conflicts: CartConflict[]
  hasBlockingConflicts: boolean
  vendorCount: number
  readyForCheckout: boolean
}

export type CartOperationResult<T = void> = 
  | { success: true; data: T }
  | { success: false; error: string; code: CartErrorCode }

export type CartErrorCode = 
  | 'CART_NOT_FOUND'
  | 'ITEM_NOT_FOUND'
  | 'PRODUCT_NOT_FOUND'
  | 'VENDOR_NOT_FOUND'
  | 'VENDOR_DISABLED'
  | 'PRODUCT_UNAVAILABLE'
  | 'INVALID_QUANTITY'
  | 'CHANNEL_NOT_CONFIGURED'
  | 'INTERNAL_ERROR'

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function getProductWithChannelConfig(
  tenantId: string,
  productId: string,
  variantId?: string
): Promise<{
  product: {
    id: string
    name: string
    slug: string
    price: Prisma.Decimal
    status: string
    images: any
    tenantId: string
  }
  variant: {
    id: string
    name: string
    price: Prisma.Decimal | null
  } | null
  channelConfig: {
    status: ChannelStatus
    channelPrice: Prisma.Decimal | null
    useBasePrice: boolean
  } | null
} | null> {
  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      tenantId,
      status: 'ACTIVE'
    },
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      status: true,
      images: true,
      tenantId: true,
      ProductChannelConfig: {
        where: { 
          channel: 'MVM',
          tenantId
        },
        select: {
          status: true,
          channelPrice: true,
          useBasePrice: true
        }
      },
      ProductVariant: variantId ? {
        where: { 
          id: variantId,
          isActive: true
        },
        select: {
          id: true,
          name: true,
          price: true
        }
      } : undefined
    }
  })

  if (!product) return null
  
  if (product.tenantId !== tenantId) {
    console.error('[MvmCart] Tenant isolation violation detected:', { productId, tenantId, productTenantId: product.tenantId })
    return null
  }

  const channelConfig = product.ProductChannelConfig[0] || null
  const variant = product.ProductVariant?.[0] || null

  return {
    product: {
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      status: product.status,
      images: product.images,
      tenantId: product.tenantId
    },
    variant,
    channelConfig
  }
}

function getEffectivePrice(
  basePrice: Prisma.Decimal,
  variantPrice: Prisma.Decimal | null,
  channelConfig: { useBasePrice: boolean; channelPrice: Prisma.Decimal | null } | null
): number {
  if (channelConfig && !channelConfig.useBasePrice && channelConfig.channelPrice) {
    return channelConfig.channelPrice.toNumber()
  }
  if (variantPrice) {
    return variantPrice.toNumber()
  }
  return basePrice.toNumber()
}

function getProductImage(images: any): string | null {
  if (!images) return null
  if (Array.isArray(images) && images.length > 0) {
    return images[0].url || images[0]
  }
  if (typeof images === 'object' && images.url) {
    return images.url
  }
  return null
}

// ============================================================================
// MULTI-VENDOR CART SERVICE
// ============================================================================

export const MultiVendorCartService = {
  /**
   * Get or create cart for the given tenant and cart key
   */
  async getCart(
    ctx: TenantContext,
    cartKey: string
  ): Promise<CartOperationResult<MvmCart>> {
    try {
      let cart = await prisma.mvm_cart.findUnique({
        where: {
          tenantId_cartKey: {
            tenantId: ctx.tenantId,
            cartKey
          }
        },
        include: {
          items: {
            orderBy: { createdAt: 'asc' }
          }
        }
      })

      if (!cart) {
        return {
          success: true,
          data: {
            id: '',
            tenantId: ctx.tenantId,
            cartKey,
            isDemo: ctx.isDemo,
            createdAt: new Date(),
            updatedAt: new Date(),
            items: [],
            vendorGroups: [],
            totalItems: 0,
            totalAmount: 0,
            currency: 'NGN'
          }
        }
      }

      const enrichedCart = await this.enrichCart(ctx, cart)
      return { success: true, data: enrichedCart }
    } catch (error) {
      console.error('[MvmCart] getCart error:', error)
      return { success: false, error: 'Failed to get cart', code: 'INTERNAL_ERROR' }
    }
  },

  /**
   * Enrich cart with product and vendor details
   */
  async enrichCart(
    ctx: TenantContext,
    cart: {
      id: string
      tenantId: string
      cartKey: string
      isDemo: boolean
      createdAt: Date
      updatedAt: Date
      items: Array<{
        id: string
        cartId: string
        vendorId: string
        productId: string
        variantId: string | null
        quantity: number
        priceSnapshot: Prisma.Decimal
        currency: string
        createdAt: Date
      }>
    }
  ): Promise<MvmCart> {
    const vendorIds = [...new Set(cart.items.map(i => i.vendorId))]
    const productIds = [...new Set(cart.items.map(i => i.productId))]

    const [vendors, products, ratingSummaries] = await Promise.all([
      prisma.mvm_vendor.findMany({
        where: { id: { in: vendorIds } },
        select: { id: true, name: true, slug: true, logo: true }
      }),
      prisma.product.findMany({
        where: { id: { in: productIds } },
        select: {
          id: true,
          name: true,
          slug: true,
          images: true,
          ProductVariant: {
            select: { id: true, name: true }
          }
        }
      }),
      prisma.mvm_vendor_rating_summary.findMany({
        where: { vendorId: { in: vendorIds } },
        select: { vendorId: true, averageRating: true, scoreBand: true }
      })
    ])

    const vendorMap = new Map(vendors.map(v => [v.id, v]))
    const productMap = new Map(products.map(p => [p.id, p]))
    const ratingMap = new Map(ratingSummaries.map(r => [r.vendorId, r]))

    const enrichedItems: MvmCartItem[] = cart.items.map(item => {
      const vendor = vendorMap.get(item.vendorId)
      const product = productMap.get(item.productId)
      const variant = product?.ProductVariant.find(v => v.id === item.variantId)

      return {
        id: item.id,
        vendorId: item.vendorId,
        vendorName: vendor?.name || 'Unknown Vendor',
        vendorSlug: vendor?.slug || '',
        productId: item.productId,
        productName: product?.name || 'Unknown Product',
        productSlug: product?.slug || '',
        productImage: product ? getProductImage(product.images) : null,
        variantId: item.variantId,
        variantName: variant?.name || null,
        quantity: item.quantity,
        priceSnapshot: item.priceSnapshot.toNumber(),
        currency: item.currency,
        createdAt: item.createdAt
      }
    })

    const vendorGroups: MvmVendorGroup[] = []
    const groupMap = new Map<string, MvmCartItem[]>()

    for (const item of enrichedItems) {
      const existing = groupMap.get(item.vendorId) || []
      existing.push(item)
      groupMap.set(item.vendorId, existing)
    }

    for (const [vendorId, items] of groupMap) {
      const vendor = vendorMap.get(vendorId)
      const rating = ratingMap.get(vendorId)
      
      vendorGroups.push({
        vendorId,
        vendorName: vendor?.name || 'Unknown Vendor',
        vendorSlug: vendor?.slug || '',
        vendorLogo: vendor?.logo || null,
        trustBadge: rating?.scoreBand || null,
        averageRating: rating?.averageRating?.toNumber() || null,
        items,
        subtotal: items.reduce((sum, i) => sum + (i.priceSnapshot * i.quantity), 0)
      })
    }

    const totalItems = enrichedItems.reduce((sum, i) => sum + i.quantity, 0)
    const totalAmount = enrichedItems.reduce((sum, i) => sum + (i.priceSnapshot * i.quantity), 0)

    return {
      id: cart.id,
      tenantId: cart.tenantId,
      cartKey: cart.cartKey,
      isDemo: cart.isDemo,
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
      items: enrichedItems,
      vendorGroups,
      totalItems,
      totalAmount,
      currency: 'NGN'
    }
  },

  /**
   * Add item to cart
   */
  async addItem(
    ctx: TenantContext,
    cartKey: string,
    input: AddToCartInput
  ): Promise<CartOperationResult<MvmCart>> {
    try {
      if (input.quantity < 1) {
        return { success: false, error: 'Quantity must be at least 1', code: 'INVALID_QUANTITY' }
      }

      const vendor = await prisma.mvm_vendor.findUnique({
        where: { id: input.vendorId },
        select: { id: true, status: true, tenantId: true }
      })

      if (!vendor) {
        return { success: false, error: 'Vendor not found', code: 'VENDOR_NOT_FOUND' }
      }

      if (vendor.tenantId !== ctx.tenantId) {
        return { success: false, error: 'Vendor not found', code: 'VENDOR_NOT_FOUND' }
      }

      if (vendor.status !== 'APPROVED') {
        return { success: false, error: 'Vendor is not active', code: 'VENDOR_DISABLED' }
      }

      const productData = await getProductWithChannelConfig(
        ctx.tenantId,
        input.productId,
        input.variantId || undefined
      )

      if (!productData) {
        return { success: false, error: 'Product not found or not active', code: 'PRODUCT_NOT_FOUND' }
      }

      const { product, variant, channelConfig } = productData

      if (channelConfig && channelConfig.status !== 'ACTIVE') {
        return { success: false, error: 'Product not available in marketplace', code: 'CHANNEL_NOT_CONFIGURED' }
      }

      const effectivePrice = getEffectivePrice(product.price, variant?.price || null, channelConfig)

      let cart = await prisma.mvm_cart.findUnique({
        where: {
          tenantId_cartKey: {
            tenantId: ctx.tenantId,
            cartKey
          }
        }
      })

      if (!cart) {
        cart = await prisma.mvm_cart.create({
          data: {
            tenantId: ctx.tenantId,
            cartKey,
            isDemo: ctx.isDemo
          }
        })
      }

      const existingItem = await prisma.mvm_cart_item.findFirst({
        where: {
          cartId: cart.id,
          vendorId: input.vendorId,
          productId: input.productId,
          variantId: input.variantId || null
        }
      })

      if (existingItem) {
        await prisma.mvm_cart_item.update({
          where: { id: existingItem.id },
          data: {
            quantity: existingItem.quantity + input.quantity,
            priceSnapshot: effectivePrice
          }
        })
      } else {
        await prisma.mvm_cart_item.create({
          data: {
            cartId: cart.id,
            vendorId: input.vendorId,
            productId: input.productId,
            variantId: input.variantId || null,
            quantity: input.quantity,
            priceSnapshot: effectivePrice,
            currency: 'NGN'
          }
        })
      }

      await prisma.mvm_cart.update({
        where: { id: cart.id },
        data: { updatedAt: new Date() }
      })

      return this.getCart(ctx, cartKey)
    } catch (error) {
      console.error('[MvmCart] addItem error:', error)
      return { success: false, error: 'Failed to add item', code: 'INTERNAL_ERROR' }
    }
  },

  /**
   * Update item quantity
   */
  async updateQuantity(
    ctx: TenantContext,
    cartKey: string,
    input: UpdateCartItemInput
  ): Promise<CartOperationResult<MvmCart>> {
    try {
      if (input.quantity < 0) {
        return { success: false, error: 'Quantity cannot be negative', code: 'INVALID_QUANTITY' }
      }

      const cart = await prisma.mvm_cart.findUnique({
        where: {
          tenantId_cartKey: {
            tenantId: ctx.tenantId,
            cartKey
          }
        }
      })

      if (!cart) {
        return { success: false, error: 'Cart not found', code: 'CART_NOT_FOUND' }
      }

      const item = await prisma.mvm_cart_item.findFirst({
        where: {
          id: input.itemId,
          cartId: cart.id
        }
      })

      if (!item) {
        return { success: false, error: 'Item not found in cart', code: 'ITEM_NOT_FOUND' }
      }

      if (input.quantity === 0) {
        await prisma.mvm_cart_item.delete({
          where: { id: item.id }
        })
      } else {
        await prisma.mvm_cart_item.update({
          where: { id: item.id },
          data: { quantity: input.quantity }
        })
      }

      await prisma.mvm_cart.update({
        where: { id: cart.id },
        data: { updatedAt: new Date() }
      })

      return this.getCart(ctx, cartKey)
    } catch (error) {
      console.error('[MvmCart] updateQuantity error:', error)
      return { success: false, error: 'Failed to update quantity', code: 'INTERNAL_ERROR' }
    }
  },

  /**
   * Remove item from cart
   */
  async removeItem(
    ctx: TenantContext,
    cartKey: string,
    itemId: string
  ): Promise<CartOperationResult<MvmCart>> {
    try {
      const cart = await prisma.mvm_cart.findUnique({
        where: {
          tenantId_cartKey: {
            tenantId: ctx.tenantId,
            cartKey
          }
        }
      })

      if (!cart) {
        return { success: false, error: 'Cart not found', code: 'CART_NOT_FOUND' }
      }

      const item = await prisma.mvm_cart_item.findFirst({
        where: {
          id: itemId,
          cartId: cart.id
        }
      })

      if (!item) {
        return { success: false, error: 'Item not found in cart', code: 'ITEM_NOT_FOUND' }
      }

      await prisma.mvm_cart_item.delete({
        where: { id: item.id }
      })

      await prisma.mvm_cart.update({
        where: { id: cart.id },
        data: { updatedAt: new Date() }
      })

      return this.getCart(ctx, cartKey)
    } catch (error) {
      console.error('[MvmCart] removeItem error:', error)
      return { success: false, error: 'Failed to remove item', code: 'INTERNAL_ERROR' }
    }
  },

  /**
   * Clear cart (entire or per vendor)
   */
  async clearCart(
    ctx: TenantContext,
    cartKey: string,
    vendorId?: string
  ): Promise<CartOperationResult<MvmCart>> {
    try {
      const cart = await prisma.mvm_cart.findUnique({
        where: {
          tenantId_cartKey: {
            tenantId: ctx.tenantId,
            cartKey
          }
        }
      })

      if (!cart) {
        return { success: false, error: 'Cart not found', code: 'CART_NOT_FOUND' }
      }

      if (vendorId) {
        await prisma.mvm_cart_item.deleteMany({
          where: {
            cartId: cart.id,
            vendorId
          }
        })
      } else {
        await prisma.mvm_cart_item.deleteMany({
          where: { cartId: cart.id }
        })
      }

      await prisma.mvm_cart.update({
        where: { id: cart.id },
        data: { updatedAt: new Date() }
      })

      return this.getCart(ctx, cartKey)
    } catch (error) {
      console.error('[MvmCart] clearCart error:', error)
      return { success: false, error: 'Failed to clear cart', code: 'INTERNAL_ERROR' }
    }
  },

  /**
   * Prepare cart for checkout - validates all items and detects conflicts
   * NO PAYMENT EXECUTION - only preparation
   */
  async prepareForCheckout(
    ctx: TenantContext,
    cartKey: string
  ): Promise<CartOperationResult<CheckoutPrepResult>> {
    try {
      const cartResult = await this.getCart(ctx, cartKey)
      if (!cartResult.success) {
        return cartResult as CartOperationResult<CheckoutPrepResult>
      }

      const cart = cartResult.data
      if (cart.items.length === 0) {
        return {
          success: true,
          data: {
            success: true,
            cart,
            conflicts: [],
            hasBlockingConflicts: false,
            vendorCount: 0,
            readyForCheckout: false
          }
        }
      }

      const conflicts: CartConflict[] = []
      const productIds = cart.items.map(i => i.productId)
      const vendorIds = [...new Set(cart.items.map(i => i.vendorId))]

      const [products, vendors, channelConfigs, inventoryLevels] = await Promise.all([
        prisma.product.findMany({
          where: { id: { in: productIds } },
          select: {
            id: true,
            name: true,
            price: true,
            status: true,
            ProductVariant: {
              select: { id: true, price: true }
            }
          }
        }),
        prisma.mvm_vendor.findMany({
          where: { id: { in: vendorIds } },
          select: { id: true, status: true }
        }),
        prisma.productChannelConfig.findMany({
          where: {
            productId: { in: productIds },
            channel: 'MVM'
          },
          select: {
            productId: true,
            status: true,
            channelPrice: true,
            useBasePrice: true
          }
        }),
        prisma.inventoryLevel.findMany({
          where: { productId: { in: productIds } },
          select: { productId: true, variantId: true, quantityOnHand: true }
        })
      ])

      const productMap = new Map(products.map(p => [p.id, p]))
      const vendorMap = new Map(vendors.map(v => [v.id, v]))
      const channelConfigMap = new Map(channelConfigs.map(c => [c.productId, c]))
      const inventoryMap = new Map<string, number>()
      for (const inv of inventoryLevels) {
        const key = inv.variantId ? `${inv.productId}:${inv.variantId}` : inv.productId
        inventoryMap.set(key, inv.quantityOnHand)
      }

      for (const item of cart.items) {
        const product = productMap.get(item.productId)
        const vendor = vendorMap.get(item.vendorId)
        const channelConfig = channelConfigMap.get(item.productId)

        if (!vendor || vendor.status !== 'APPROVED') {
          conflicts.push({
            type: 'vendor_disabled',
            itemId: item.id,
            productId: item.productId,
            productName: item.productName,
            message: `Vendor "${item.vendorName}" is no longer accepting orders`
          })
          continue
        }

        if (!product || product.status !== 'ACTIVE') {
          conflicts.push({
            type: 'item_removed',
            itemId: item.id,
            productId: item.productId,
            productName: item.productName,
            message: `"${item.productName}" is no longer available`
          })
          continue
        }

        if (channelConfig && channelConfig.status !== 'ACTIVE') {
          conflicts.push({
            type: 'product_unavailable',
            itemId: item.id,
            productId: item.productId,
            productName: item.productName,
            message: `"${item.productName}" is not available in marketplace`
          })
          continue
        }

        const variant = product.ProductVariant.find(v => v.id === item.variantId)
        const currentPrice = getEffectivePrice(
          product.price,
          variant?.price || null,
          channelConfig ? {
            useBasePrice: channelConfig.useBasePrice,
            channelPrice: channelConfig.channelPrice
          } : null
        )

        if (Math.abs(currentPrice - item.priceSnapshot) > 0.01) {
          conflicts.push({
            type: 'price_changed',
            itemId: item.id,
            productId: item.productId,
            productName: item.productName,
            oldValue: item.priceSnapshot,
            newValue: currentPrice,
            message: `Price of "${item.productName}" changed from ₦${item.priceSnapshot.toLocaleString()} to ₦${currentPrice.toLocaleString()}`
          })
        }

        const invKey = item.variantId ? `${item.productId}:${item.variantId}` : item.productId
        const stock = inventoryMap.get(invKey) ?? Infinity

        if (stock < item.quantity) {
          if (stock === 0) {
            conflicts.push({
              type: 'stock_changed',
              itemId: item.id,
              productId: item.productId,
              productName: item.productName,
              oldValue: item.quantity,
              newValue: 0,
              message: `"${item.productName}" is out of stock`
            })
          } else {
            conflicts.push({
              type: 'stock_changed',
              itemId: item.id,
              productId: item.productId,
              productName: item.productName,
              oldValue: item.quantity,
              newValue: stock,
              message: `Only ${stock} of "${item.productName}" available`
            })
          }
        }
      }

      const blockingTypes: CartConflict['type'][] = [
        'item_removed',
        'vendor_disabled',
        'product_unavailable'
      ]
      const hasBlockingConflicts = conflicts.some(c => 
        blockingTypes.includes(c.type) || 
        (c.type === 'stock_changed' && c.newValue === 0)
      )

      return {
        success: true,
        data: {
          success: true,
          cart,
          conflicts,
          hasBlockingConflicts,
          vendorCount: cart.vendorGroups.length,
          readyForCheckout: cart.items.length > 0 && !hasBlockingConflicts
        }
      }
    } catch (error) {
      console.error('[MvmCart] prepareForCheckout error:', error)
      return { success: false, error: 'Failed to prepare checkout', code: 'INTERNAL_ERROR' }
    }
  }
}
