'use client'

import { useEffect, useState } from 'react'
import { useMVM, ProductMapping } from './MVMProvider'
import { 
  Search, 
  Plus, 
  Trash2, 
  Package,
  DollarSign,
  BarChart3,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  X
} from 'lucide-react'

// ============================================================================
// ADD PRODUCT MODAL (Placeholder - would connect to Core products)
// ============================================================================

function AddProductModal({ onClose, onAdd }: { onClose: () => void; onAdd: (productId: string) => void }) {
  const [productId, setProductId] = useState('')
  
  const demoProducts = [
    { id: 'prod-1', name: 'Classic White T-Shirt', sku: 'TSH-WHT-M', price: 29.99 },
    { id: 'prod-2', name: 'Denim Jacket', sku: 'DNM-JKT-M', price: 89.99 },
    { id: 'prod-3', name: 'Running Sneakers', sku: 'SNK-RUN-10', price: 129.99 },
    { id: 'prod-6', name: 'Canvas Backpack', sku: 'BP-CNV-NVY', price: 69.99 },
  ]

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
          <div className="p-6 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Map Product</h2>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>
          
          <div className="p-6">
            <p className="text-sm text-slate-500 mb-4">
              Select a Core product to map to your vendor store
            </p>
            
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {demoProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => setProductId(product.id)}
                  className={`w-full p-3 text-left rounded-lg border-2 transition-colors ${
                    productId === product.id
                      ? 'border-green-600 bg-green-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <p className="font-medium text-slate-900">{product.name}</p>
                  <p className="text-sm text-slate-500">{product.sku} • ${product.price}</p>
                </button>
              ))}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (productId) {
                    onAdd(productId)
                    onClose()
                  }
                }}
                disabled={!productId}
                className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-slate-300 text-white rounded-xl font-medium"
              >
                Add Product
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// ============================================================================
// PRODUCT MAPPING VIEW
// ============================================================================

export function VendorProductsView() {
  const { productMappings, isLoadingProducts, fetchProductMappings, addProductMapping, removeProductMapping } = useMVM()
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    fetchProductMappings()
  }, [fetchProductMappings])

  const filteredMappings = productMappings.filter(mapping => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return (
        mapping.productName?.toLowerCase().includes(q) ||
        mapping.productSku?.toLowerCase().includes(q)
      )
    }
    return true
  })

  const handleAddProduct = async (productId: string) => {
    await addProductMapping(productId)
  }

  const handleRemoveProduct = async (mapping: ProductMapping) => {
    setDeletingId(mapping.id)
    await removeProductMapping(mapping.productId)
    setDeletingId(null)
  }

  const totalRevenue = productMappings.reduce((sum, m) => sum + (m.revenue || 0), 0)
  const totalSales = productMappings.reduce((sum, m) => sum + (m.salesCount || 0), 0)
  const activeCount = productMappings.filter(m => m.isActive).length

  return (
    <div className="space-y-6" data-testid="vendor-products">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Products</h1>
          <p className="text-slate-500">Manage your product catalog mappings</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium flex items-center gap-2 transition-colors"
          data-testid="add-product-btn"
        >
          <Plus className="w-5 h-5" />
          Map Product
        </button>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{productMappings.length}</p>
              <p className="text-sm text-slate-500">Total Products ({activeCount} active)</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">${totalRevenue.toFixed(2)}</p>
              <p className="text-sm text-slate-500">Total Revenue</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{totalSales}</p>
              <p className="text-sm text-slate-500">Total Sales</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search products..."
          className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none"
          data-testid="product-search"
        />
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {isLoadingProducts ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
          </div>
        ) : filteredMappings.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 mb-4">No products mapped yet</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
            >
              Map Your First Product
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-left text-sm text-slate-500">
                  <th className="px-6 py-4 font-medium">Product</th>
                  <th className="px-6 py-4 font-medium">SKU</th>
                  <th className="px-6 py-4 font-medium text-right">Price</th>
                  <th className="px-6 py-4 font-medium text-right">Sales</th>
                  <th className="px-6 py-4 font-medium text-right">Revenue</th>
                  <th className="px-6 py-4 font-medium text-center">Status</th>
                  <th className="px-6 py-4 font-medium">Mapped</th>
                  <th className="px-6 py-4 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {filteredMappings.map((mapping) => (
                  <tr 
                    key={mapping.id} 
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors"
                    data-testid={`product-row-${mapping.id}`}
                  >
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-900">{mapping.productName}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-sm">
                      {mapping.productSku}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-slate-900">
                      ${mapping.price?.toFixed(2) || '—'}
                    </td>
                    <td className="px-6 py-4 text-right text-slate-900">
                      {mapping.salesCount || 0}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-emerald-600">
                      ${(mapping.revenue || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {mapping.isActive ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                          <CheckCircle className="w-3 h-3" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
                          <XCircle className="w-3 h-3" /> Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {new Date(mapping.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleRemoveProduct(mapping)}
                        disabled={deletingId === mapping.id}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        data-testid={`remove-product-${mapping.id}`}
                      >
                        {deletingId === mapping.id ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Trash2 className="w-5 h-5" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl">
        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-amber-800">
          <p className="font-medium">Product Mapping</p>
          <p className="mt-1">
            Products are managed in the Core catalog. Map existing Core products to your vendor store to sell them.
            You cannot create new products directly.
          </p>
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <AddProductModal 
          onClose={() => setShowAddModal(false)} 
          onAdd={handleAddProduct}
        />
      )}
    </div>
  )
}
