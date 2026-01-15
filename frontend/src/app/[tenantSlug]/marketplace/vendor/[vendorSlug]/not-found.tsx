import Link from 'next/link'
import { Store, AlertCircle } from 'lucide-react'

export default function VendorNotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-6 flex justify-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          Vendor Not Found
        </h1>
        
        <p className="text-slate-600 mb-8">
          This vendor could not be found or is not currently available.
        </p>
        
        <Link
          href="javascript:history.back()"
          className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
        >
          <Store className="w-5 h-5" />
          Back to Marketplace
        </Link>
      </div>
    </div>
  )
}
