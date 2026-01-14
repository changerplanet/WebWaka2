'use client'

/**
 * Single Vendor Marketplace (SVM) Demo Page
 * 
 * Demonstrates e-commerce storefront for single merchants.
 * Supports Partner Demo Mode integration.
 * 
 * @module app/svm-demo
 * @canonical PC-SCP FROZEN
 * @phase Phase 2 Track A (S3)
 */

import { Suspense } from 'react'
import Link from 'next/link'
import {
  Store,
  ChevronRight,
  ShoppingBag,
  Package,
  Truck,
  Star,
  Heart,
  Search,
  Filter,
  Grid,
  List,
  AlertCircle,
  MapPin
} from 'lucide-react'
import { DemoModeProvider } from '@/lib/demo'
import { DemoOverlay, DemoIndicator } from '@/components/demo'

// ============================================================================
// MOCK DATA
// ============================================================================

const MOCK_PRODUCTS = [
  {
    id: 'prod-001',
    name: 'Samsung Galaxy A54 5G',
    category: 'Electronics',
    price: 285000,
    originalPrice: 320000,
    image: '📱',
    rating: 4.5,
    reviews: 128,
    inStock: true,
    badge: 'Best Seller'
  },
  {
    id: 'prod-002',
    name: 'Nike Air Max 270',
    category: 'Fashion',
    price: 95000,
    originalPrice: null,
    image: '👟',
    rating: 4.8,
    reviews: 89,
    inStock: true,
    badge: null
  },
  {
    id: 'prod-003',
    name: 'Hisense 43" Smart TV',
    category: 'Electronics',
    price: 185000,
    originalPrice: 210000,
    image: '📺',
    rating: 4.3,
    reviews: 56,
    inStock: true,
    badge: 'Sale'
  },
  {
    id: 'prod-004',
    name: 'Binatone Blender 1.5L',
    category: 'Home & Kitchen',
    price: 28500,
    originalPrice: null,
    image: '🍹',
    rating: 4.1,
    reviews: 34,
    inStock: false,
    badge: null
  },
  {
    id: 'prod-005',
    name: 'HP Laptop 15 Intel Core i5',
    category: 'Electronics',
    price: 485000,
    originalPrice: 520000,
    image: '💻',
    rating: 4.6,
    reviews: 203,
    inStock: true,
    badge: 'Hot'
  },
  {
    id: 'prod-006',
    name: 'Ankara Fabric (6 yards)',
    category: 'Fashion',
    price: 15000,
    originalPrice: null,
    image: '🎨',
    rating: 4.9,
    reviews: 412,
    inStock: true,
    badge: 'Nigerian Made'
  }
]

const MOCK_CATEGORIES = [
  { name: 'Electronics', count: 245, icon: '📱' },
  { name: 'Fashion', count: 189, icon: '👗' },
  { name: 'Home & Kitchen', count: 156, icon: '🏠' },
  { name: 'Beauty', count: 98, icon: '💄' },
  { name: 'Sports', count: 67, icon: '⚽' }
]

const MOCK_CART = {
  items: 3,
  total: 395000
}

// ============================================================================
// COMPONENTS
// ============================================================================

function ProductCard({ product }: { product: typeof MOCK_PRODUCTS[0] }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow" data-testid={`product-${product.id}`}>
      {/* Image */}
      <div className="relative bg-gray-50 p-8 text-center">
        <span className="text-6xl">{product.image}</span>
        {product.badge && (
          <span className={`absolute top-3 left-3 px-2 py-1 text-xs font-medium rounded-full ${
            product.badge === 'Sale' ? 'bg-red-100 text-red-700' :
            product.badge === 'Best Seller' ? 'bg-amber-100 text-amber-700' :
            product.badge === 'Hot' ? 'bg-orange-100 text-orange-700' :
            'bg-emerald-100 text-emerald-700'
          }`}>
            {product.badge}
          </span>
        )}
        <button className="absolute top-3 right-3 p-2 bg-white rounded-full shadow hover:bg-gray-50">
          <Heart className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Details */}
      <div className="p-4">
        <p className="text-xs text-gray-500 mb-1">{product.category}</p>
        <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">{product.name}</h3>
        
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-amber-400 fill-current" />
            <span className="text-sm font-medium">{product.rating}</span>
          </div>
          <span className="text-xs text-gray-400">({product.reviews} reviews)</span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <span className="text-lg font-bold text-gray-900">₦{product.price.toLocaleString()}</span>
            {product.originalPrice && (
              <span className="text-sm text-gray-400 line-through ml-2">
                ₦{product.originalPrice.toLocaleString()}
              </span>
            )}
          </div>
          {!product.inStock && (
            <span className="text-xs text-red-600 font-medium">Out of Stock</span>
          )}
        </div>

        <button 
          className={`w-full mt-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            product.inStock 
              ? 'bg-blue-600 text-white hover:bg-blue-700' 
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
          disabled={!product.inStock}
        >
          {product.inStock ? 'Add to Cart' : 'Notify Me'}
        </button>
      </div>
    </div>
  )
}

function CategorySidebar() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6" data-testid="category-sidebar">
      <h3 className="font-semibold text-gray-900 mb-4">Categories</h3>
      <div className="space-y-2">
        {MOCK_CATEGORIES.map(cat => (
          <button 
            key={cat.name}
            className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span>{cat.icon}</span>
              <span className="text-sm text-gray-700">{cat.name}</span>
            </div>
            <span className="text-xs text-gray-400">{cat.count}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function CartSummary() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6" data-testid="cart-summary">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Your Cart</h3>
        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
          {MOCK_CART.items} items
        </span>
      </div>
      
      <div className="flex items-center justify-between py-3 border-t border-gray-100">
        <span className="text-gray-600">Subtotal</span>
        <span className="font-bold text-gray-900">₦{MOCK_CART.total.toLocaleString()}</span>
      </div>

      <button className="w-full mt-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors" data-testid="checkout-btn">
        Proceed to Checkout
      </button>

      <p className="text-xs text-gray-400 text-center mt-3">
        Free delivery on orders over ₦50,000
      </p>
    </div>
  )
}

function DeliveryInfo() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6" data-testid="delivery-info">
      <h3 className="font-semibold text-gray-900 mb-4">Delivery</h3>
      
      <div className="space-y-3">
        <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-100 rounded-lg">
          <MapPin className="w-5 h-5 text-emerald-600" />
          <div>
            <p className="text-sm font-medium text-emerald-700">Lagos Mainland</p>
            <p className="text-xs text-emerald-600">₦1,500 • 1-2 days</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <Truck className="w-5 h-5 text-gray-400" />
          <div>
            <p className="text-sm text-gray-700">Lagos Island</p>
            <p className="text-xs text-gray-500">₦2,000 • 1-2 days</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <Package className="w-5 h-5 text-gray-400" />
          <div>
            <p className="text-sm text-gray-700">Outside Lagos</p>
            <p className="text-xs text-gray-500">₦3,500+ • 3-5 days</p>
          </div>
        </div>
      </div>

      <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-xs text-amber-700">
          <strong>Nigeria-First:</strong> 37 states supported with 7 geopolitical zone pricing.
        </p>
      </div>
    </div>
  )
}

// ============================================================================
// MAIN CONTENT
// ============================================================================

function SVMDemoContent() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Demo Indicator Banner */}
      <DemoIndicator variant="banner" />

      {/* Demo Overlay */}
      <DemoOverlay />

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-2 text-blue-100 text-sm mb-2">
            <Link href="/commerce-demo" className="hover:text-white">Commerce Suite</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white">Single Vendor Marketplace</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <Store className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">SVM Demo</h1>
              <p className="text-blue-100">
                Online storefront for single merchants with catalog, cart, and checkout
              </p>
            </div>
          </div>

          <div className="mt-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/20 rounded-full text-sm">
              <AlertCircle className="w-4 h-4" />
              Demo Mode — Sample store data
            </span>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">
              <Filter className="w-4 h-4" />
              Filters
            </button>
            <div className="flex items-center border border-gray-200 rounded-lg">
              <button className="p-2 bg-gray-100">
                <Grid className="w-4 h-4" />
              </button>
              <button className="p-2 hover:bg-gray-50">
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="space-y-6">
            <CategorySidebar />
            <CartSummary />
            <DeliveryInfo />
          </div>

          {/* Products Grid */}
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Featured Products</h2>
              <select className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
                <option>Sort by: Featured</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
                <option>Newest First</option>
              </select>
            </div>

            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6" data-testid="products-grid">
              {MOCK_PRODUCTS.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="mt-12 grid md:grid-cols-4 gap-6">
          <div className="text-center p-6 bg-white rounded-xl border border-gray-200">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <ShoppingBag className="w-6 h-6 text-blue-600" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-1">Product Catalog</h4>
            <p className="text-sm text-gray-500">Unlimited products with variants, images, and SEO</p>
          </div>

          <div className="text-center p-6 bg-white rounded-xl border border-gray-200">
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Package className="w-6 h-6 text-indigo-600" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-1">Order Management</h4>
            <p className="text-sm text-gray-500">Track orders from placement to delivery</p>
          </div>

          <div className="text-center p-6 bg-white rounded-xl border border-gray-200">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Truck className="w-6 h-6 text-emerald-600" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-1">Shipping Zones</h4>
            <p className="text-sm text-gray-500">37 Nigerian states with zone-based pricing</p>
          </div>

          <div className="text-center p-6 bg-white rounded-xl border border-gray-200">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Heart className="w-6 h-6 text-amber-600" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-1">Customer Accounts</h4>
            <p className="text-sm text-gray-500">Wishlists, order history, saved addresses</p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-400">
            Single Vendor Marketplace v1.0 • 
            <span className="text-blue-600 font-medium"> FROZEN</span>
          </p>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function SVMDemoPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>}>
      <DemoModeProvider>
        <SVMDemoContent />
      </DemoModeProvider>
    </Suspense>
  )
}
