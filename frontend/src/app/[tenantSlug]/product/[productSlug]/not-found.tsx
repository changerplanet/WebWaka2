import Link from 'next/link'

export default function ProductNotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="text-center bg-white p-8 rounded-xl shadow-lg max-w-md">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg 
            className="w-8 h-8 text-slate-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" 
            />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-slate-900 mb-2">Product Not Found</h1>
        <p className="text-slate-600 mb-6">
          The product you're looking for doesn't exist or is no longer available.
        </p>
        <Link 
          href="/"
          className="inline-block px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
        >
          Go to Homepage
        </Link>
      </div>
    </div>
  )
}
