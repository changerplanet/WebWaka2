/**
 * Product Grid Component
 * 
 * Touch-first product selection grid
 */

'use client'

import { useState } from 'react'

export interface Product {
  id: string
  name: string
  sku?: string
  price: number
  imageUrl?: string
  category?: string
  inStock: boolean
}

interface ProductGridProps {
  products: Product[]
  onSelect: (product: Product) => void
  isLoading?: boolean
}

export function ProductGrid({ products, onSelect, isLoading }: ProductGridProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  // Get unique categories
  const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean)))

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = !searchQuery || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesCategory = !selectedCategory || product.category === selectedCategory

    return matchesSearch && matchesCategory
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="products-loading">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full" data-testid="product-grid">
      {/* Search Bar */}
      <div className="p-3 border-b bg-gray-50">
        <input
          type="text"
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-3 text-lg rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          data-testid="product-search"
        />
      </div>

      {/* Category Tabs */}
      {categories.length > 0 && (
        <div className="flex gap-2 p-3 overflow-x-auto border-b bg-white">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`
              px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap
              ${!selectedCategory 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }
            `}
            data-testid="category-all"
          >
            All
          </button>
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category!)}
              className={`
                px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap
                ${selectedCategory === category 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
              data-testid={`category-${category}`}
            >
              {category}
            </button>
          ))}
        </div>
      )}

      {/* Product Grid */}
      <div className="flex-1 overflow-y-auto p-3">
        {filteredProducts.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            No products found
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredProducts.map(product => (
              <button
                key={product.id}
                onClick={() => product.inStock && onSelect(product)}
                disabled={!product.inStock}
                className={`
                  flex flex-col items-center p-4 rounded-xl border-2 transition-all
                  min-h-[120px]
                  ${product.inStock 
                    ? 'border-gray-200 hover:border-blue-500 hover:shadow-md active:scale-95 bg-white' 
                    : 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                  }
                `}
                data-testid={`product-${product.id}`}
              >
                {/* Product Image Placeholder */}
                <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center mb-2">
                  {product.imageUrl ? (
                    <img 
                      src={product.imageUrl} 
                      alt={product.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <span className="text-2xl">📦</span>
                  )}
                </div>

                {/* Product Name */}
                <span className="text-sm font-medium text-center line-clamp-2 mb-1">
                  {product.name}
                </span>

                {/* Price */}
                <span className="text-lg font-bold text-blue-600">
                  ${product.price.toFixed(2)}
                </span>

                {/* Out of Stock Badge */}
                {!product.inStock && (
                  <span className="text-xs text-red-500 mt-1">Out of Stock</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
