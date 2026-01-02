'use client'

import { useState, useEffect } from 'react'
import { useSVM, SVMProduct, SVMVariant } from './SVMProvider'
import { Search, ShoppingCart, Filter, Grid, List, Star, Heart, ChevronDown, X, Plus, Minus, Truck, Tag } from 'lucide-react'

// ============================================================================
// PRODUCT CARD
// ============================================================================

interface ProductCardProps {
  product: SVMProduct
  onSelect: (product: SVMProduct) => void
  onAddToCart: (product: SVMProduct) => void
}

export function ProductCard({ product, onSelect, onAddToCart }: ProductCardProps) {
  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.basePrice
  const discountPercent = hasDiscount 
    ? Math.round((1 - product.basePrice / product.compareAtPrice!) * 100) 
    : 0

  return (
    <div 
      className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-slate-100"
      data-testid={`product-card-${product.id}`}
    >
      {/* Image */}
      <div 
        className="relative aspect-square bg-slate-100 overflow-hidden cursor-pointer"
        onClick={() => onSelect(product)}
      >
        {product.images[0]?.url ? (
          <img 
            src={product.images[0].url} 
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300">
            <ShoppingCart className="w-12 h-12" />
          </div>
        )}
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {hasDiscount && (
            <span className="px-2 py-1 bg-red-500 text-white text-xs font-semibold rounded">
              -{discountPercent}%
            </span>
          )}
          {product.status === 'NEW' && (
            <span className="px-2 py-1 bg-emerald-500 text-white text-xs font-semibold rounded">
              NEW
            </span>
          )}
        </div>

        {/* Quick Actions */}
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <button className="p-2 bg-white rounded-full shadow-md hover:bg-slate-50 transition-colors">
            <Heart className="w-4 h-4 text-slate-600" />
          </button>
        </div>

        {/* Quick Add */}
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onAddToCart(product)
            }}
            className="w-full py-2 bg-white hover:bg-slate-50 text-slate-900 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2"
            data-testid={`quick-add-${product.id}`}
          >
            <Plus className="w-4 h-4" />
            Quick Add
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <p className="text-xs text-slate-500 mb-1">{product.categoryName}</p>
        <h3 
          className="font-medium text-slate-900 mb-2 line-clamp-2 cursor-pointer hover:text-indigo-600 transition-colors"
          onClick={() => onSelect(product)}
        >
          {product.name}
        </h3>
        
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-slate-900">
            ${product.basePrice.toFixed(2)}
          </span>
          {hasDiscount && (
            <span className="text-sm text-slate-400 line-through">
              ${product.compareAtPrice!.toFixed(2)}
            </span>
          )}
        </div>

        {product.hasVariants && (
          <p className="text-xs text-slate-400 mt-2">
            {product.variants.length} variants
          </p>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// PRODUCT GRID
// ============================================================================

interface ProductGridProps {
  onSelectProduct: (product: SVMProduct) => void
}

export function ProductGrid({ onSelectProduct }: ProductGridProps) {
  const { products, isLoadingProducts, fetchProducts, addToCart } = useSVM()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState('name')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchProducts(searchQuery, selectedCategory || undefined)
  }

  const categories = [
    { id: null, name: 'All Products' },
    { id: 'cat-1', name: 'Clothing' },
    { id: 'cat-2', name: 'Footwear' },
    { id: 'cat-3', name: 'Accessories' },
    { id: 'cat-4', name: 'Electronics' },
  ]

  const sortedProducts = [...products].sort((a, b) => {
    switch (sortBy) {
      case 'price-low': return a.basePrice - b.basePrice
      case 'price-high': return b.basePrice - a.basePrice
      case 'newest': return (b.id > a.id ? 1 : -1)
      default: return a.name.localeCompare(b.name)
    }
  })

  return (
    <div className="max-w-7xl mx-auto" data-testid="product-grid">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Shop All Products</h1>
        <p className="text-slate-600">Discover our curated collection of premium products</p>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col lg:flex-row gap-4 mb-8">
        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
              data-testid="product-search-input"
            />
          </div>
        </form>

        {/* Sort & View */}
        <div className="flex items-center gap-3">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 outline-none"
            data-testid="sort-select"
          >
            <option value="name">Sort by Name</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="newest">Newest First</option>
          </select>

          <div className="flex bg-white border border-slate-200 rounded-xl overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-3 ${viewMode === 'grid' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-3 ${viewMode === 'list' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-2 mb-8">
        {categories.map((cat) => (
          <button
            key={cat.id || 'all'}
            onClick={() => {
              setSelectedCategory(cat.id)
              fetchProducts(searchQuery, cat.id || undefined)
            }}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === cat.id
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
            data-testid={`category-${cat.id || 'all'}`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Free Shipping Banner */}
      <div className="mb-8 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl flex items-center gap-3">
        <Truck className="w-6 h-6 text-indigo-600" />
        <p className="text-slate-700">
          <span className="font-semibold">Free shipping</span> on orders over $50
        </p>
      </div>

      {/* Products */}
      {isLoadingProducts ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full" />
        </div>
      ) : sortedProducts.length === 0 ? (
        <div className="text-center py-20">
          <ShoppingCart className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-slate-900 mb-2">No products found</h3>
          <p className="text-slate-500">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className={viewMode === 'grid' 
          ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          : "flex flex-col gap-4"
        }>
          {sortedProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onSelect={onSelectProduct}
              onAddToCart={(p) => addToCart(p)}
            />
          ))}
        </div>
      )}

      {/* Results Count */}
      {!isLoadingProducts && sortedProducts.length > 0 && (
        <p className="text-center text-slate-500 mt-8">
          Showing {sortedProducts.length} products
        </p>
      )}
    </div>
  )
}

// ============================================================================
// PRODUCT DETAIL
// ============================================================================

interface ProductDetailProps {
  productId: string
  onBack: () => void
}

export function ProductDetail({ productId, onBack }: ProductDetailProps) {
  const { fetchProduct, currentProduct, addToCart } = useSVM()
  const [selectedVariant, setSelectedVariant] = useState<SVMVariant | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [selectedImage, setSelectedImage] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(true)
    fetchProduct(productId).then(() => setIsLoading(false))
  }, [productId, fetchProduct])

  useEffect(() => {
    if (currentProduct?.variants?.length) {
      setSelectedVariant(currentProduct.variants[0])
    }
  }, [currentProduct])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!currentProduct) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500">Product not found</p>
        <button onClick={onBack} className="mt-4 text-indigo-600 hover:underline">
          ← Back to products
        </button>
      </div>
    )
  }

  const product = currentProduct
  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.basePrice
  const currentPrice = selectedVariant?.price || product.basePrice

  const handleAddToCart = () => {
    addToCart(product, selectedVariant || undefined, quantity)
    setQuantity(1)
  }

  // Group variants by option name
  const optionGroups = product.options?.map((option: any) => ({
    name: option.name,
    values: option.values || [],
    selectedValue: selectedVariant?.options?.[option.name]
  })) || []

  return (
    <div className="max-w-6xl mx-auto" data-testid="product-detail">
      {/* Breadcrumb */}
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 mb-6 transition-colors"
        data-testid="back-to-products"
      >
        ← Back to products
      </button>

      <div className="grid lg:grid-cols-2 gap-12">
        {/* Images */}
        <div>
          <div className="aspect-square bg-slate-100 rounded-2xl overflow-hidden mb-4">
            {product.images[selectedImage]?.url ? (
              <img 
                src={product.images[selectedImage].url}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-300">
                <ShoppingCart className="w-20 h-20" />
              </div>
            )}
          </div>
          
          {product.images.length > 1 && (
            <div className="flex gap-3">
              {product.images.map((img, idx) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImage(idx)}
                  className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                    selectedImage === idx ? 'border-indigo-600' : 'border-transparent'
                  }`}
                >
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          <p className="text-indigo-600 font-medium mb-2">{product.categoryName}</p>
          <h1 className="text-3xl font-bold text-slate-900 mb-4">{product.name}</h1>
          
          {/* Price */}
          <div className="flex items-baseline gap-3 mb-6">
            <span className="text-3xl font-bold text-slate-900">
              ${currentPrice.toFixed(2)}
            </span>
            {hasDiscount && (
              <>
                <span className="text-xl text-slate-400 line-through">
                  ${product.compareAtPrice!.toFixed(2)}
                </span>
                <span className="px-2 py-1 bg-red-100 text-red-700 text-sm font-semibold rounded">
                  Save ${(product.compareAtPrice! - currentPrice).toFixed(2)}
                </span>
              </>
            )}
          </div>

          {/* Description */}
          <p className="text-slate-600 mb-8 leading-relaxed">
            {product.description || product.shortDescription}
          </p>

          {/* Variants */}
          {optionGroups.length > 0 && (
            <div className="space-y-6 mb-8">
              {optionGroups.map((group: any) => (
                <div key={group.name}>
                  <label className="block text-sm font-medium text-slate-700 mb-3">
                    {group.name}: <span className="font-normal text-slate-500">{group.selectedValue}</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {group.values.map((value: string) => {
                      const variant = product.variants.find(v => v.options?.[group.name] === value)
                      const isSelected = selectedVariant?.options?.[group.name] === value
                      const isAvailable = variant?.inventoryQuantity ? variant.inventoryQuantity > 0 : true
                      
                      return (
                        <button
                          key={value}
                          onClick={() => variant && setSelectedVariant(variant)}
                          disabled={!isAvailable}
                          className={`px-4 py-2 rounded-lg border-2 font-medium transition-all ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                              : isAvailable
                                ? 'border-slate-200 hover:border-slate-300 text-slate-700'
                                : 'border-slate-100 text-slate-300 cursor-not-allowed'
                          }`}
                          data-testid={`variant-${group.name}-${value}`}
                        >
                          {value}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Quantity */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Quantity
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                className="w-10 h-10 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors"
                data-testid="quantity-decrease"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-12 text-center text-lg font-medium" data-testid="quantity-value">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(q => q + 1)}
                className="w-10 h-10 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors"
                data-testid="quantity-increase"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Add to Cart */}
          <div className="flex gap-4 mb-8">
            <button
              onClick={handleAddToCart}
              className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-lg transition-colors flex items-center justify-center gap-3"
              data-testid="add-to-cart-btn"
            >
              <ShoppingCart className="w-5 h-5" />
              Add to Cart
            </button>
            <button className="px-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
              <Heart className="w-5 h-5 text-slate-600" />
            </button>
          </div>

          {/* Info */}
          <div className="space-y-3 border-t border-slate-200 pt-6">
            <div className="flex items-center gap-3 text-slate-600">
              <Truck className="w-5 h-5 text-emerald-500" />
              <span>Free shipping on orders over $50</span>
            </div>
            <div className="flex items-center gap-3 text-slate-600">
              <Tag className="w-5 h-5 text-indigo-500" />
              <span>Use code <strong>SAVE10</strong> for 10% off</span>
            </div>
          </div>

          {/* Tags */}
          {product.tags?.length > 0 && (
            <div className="mt-6 pt-6 border-t border-slate-200">
              <p className="text-sm text-slate-500 mb-2">Tags:</p>
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag: string) => (
                  <span key={tag} className="px-3 py-1 bg-slate-100 text-slate-600 text-sm rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// EXPORTS
// ============================================================================

export { ProductCard, ProductGrid, ProductDetail }
