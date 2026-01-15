import Link from 'next/link'
import { Store, AlertCircle } from 'lucide-react'

export default function MarketplaceNotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-6 flex justify-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          Marketplace Not Available
        </h1>
        
        <p className="text-slate-600 mb-8">
          This marketplace is not available. The business may have been suspended or does not have multi-vendor commerce enabled.
        </p>
        
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
        >
          <Store className="w-5 h-5" />
          Back to Home
        </Link>
      </div>
    </div>
  )
}
