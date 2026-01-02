'use client'

import { useState, useEffect, useRef } from 'react'
import { usePOS, POSProduct } from './POSProvider'
import { Search, Barcode, X, Package, AlertTriangle } from 'lucide-react'

interface ProductSearchProps {
  onSelect?: (product: POSProduct) => void
}

export function ProductSearch({ onSelect }: ProductSearchProps) {
  const { searchProducts, addToCart, isOnline } = usePOS()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<POSProduct[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const searchTimeout = useRef<NodeJS.Timeout | null>(null)

  // Debounced search
  useEffect(() => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current)
    }

    if (query.length < 2) {
      setResults([])
      setShowResults(false)
      return
    }

    searchTimeout.current = setTimeout(async () => {
      setIsLoading(true)
      const products = await searchProducts(query)
      setResults(products)
      setShowResults(true)
      setIsLoading(false)
    }, 300)

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current)
      }
    }
  }, [query, searchProducts])

  const handleSelect = (product: POSProduct) => {
    if (onSelect) {
      onSelect(product)
    } else {
      addToCart(product)
    }
    setQuery('')
    setResults([])
    setShowResults(false)
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowResults(false)
      setQuery('')
    }
  }

  return (
    <div className="relative">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setShowResults(true)}
          placeholder="Search products, scan barcode..."
          className="w-full pl-12 pr-12 py-4 text-lg bg-white border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
          autoComplete="off"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('')
              setResults([])
              setShowResults(false)
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        )}
        {isLoading && (
          <div className="absolute right-12 top-1/2 -translate-y-1/2">
            <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Offline indicator */}
      {!isOnline && (
        <div className="mt-2 flex items-center gap-2 text-amber-600 text-sm">
          <AlertTriangle className="w-4 h-4" />
          Searching offline cache
        </div>
      )}

      {/* Results dropdown */}
      {showResults && results.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl max-h-[400px] overflow-y-auto">
          {results.map((product) => (
            <button
              key={`${product.productId}-${product.variantId || ''}`}
              onClick={() => handleSelect(product)}
              className="w-full px-4 py-3 flex items-center gap-4 hover:bg-slate-50 border-b border-slate-100 last:border-b-0 text-left transition-colors"
            >
              {/* Product image placeholder */}
              <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Package className="w-6 h-6 text-slate-400" />
              </div>

              {/* Product info */}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-slate-900 truncate">
                  {product.name}
                </div>
                <div className="text-sm text-slate-500 flex items-center gap-2">
                  <span>{product.sku}</span>
                  {product.barcode && (
                    <>
                      <span>•</span>
                      <Barcode className="w-3 h-3" />
                      <span>{product.barcode}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Stock & Price */}
              <div className="text-right flex-shrink-0">
                <div className="font-semibold text-lg text-slate-900">
                  ${product.price.toFixed(2)}
                </div>
                <div className={`text-sm ${
                  product.isInStock ? 'text-emerald-600' : 'text-red-500'
                }`}>
                  {product.trackInventory 
                    ? `${product.quantityAvailable} in stock`
                    : 'Not tracked'
                  }
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No results */}
      {showResults && results.length === 0 && query.length >= 2 && !isLoading && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl p-8 text-center">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No products found for "{query}"</p>
        </div>
      )}
    </div>
  )
}
