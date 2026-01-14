'use client'

import { ShieldX, ArrowLeft, Home } from 'lucide-react'
import { useRouter } from 'next/navigation'

/**
 * Forbidden Component - 403 Access Denied Page
 * 
 * Displayed when a user tries to access a route they don't have permission for.
 * Provides clear messaging and navigation options to guide the user.
 */
interface ForbiddenProps {
  title?: string
  message?: string
  showGoBack?: boolean
  showGoHome?: boolean
  homeUrl?: string
}

export function Forbidden({
  title = 'Access Denied',
  message = 'You do not have permission to access this page.',
  showGoBack = true,
  showGoHome = true,
  homeUrl = '/dashboard'
}: ForbiddenProps) {
  const router = useRouter()

  const handleGoBack = () => {
    router.back()
  }

  const handleGoHome = () => {
    router.push(homeUrl)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        {/* Icon */}
        <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
          <ShieldX className="h-8 w-8 text-red-600" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {title}
        </h1>

        {/* Error Code */}
        <p className="text-sm text-gray-400 mb-4">
          Error 403 - Forbidden
        </p>

        {/* Message */}
        <p className="text-gray-600 mb-8">
          {message}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {showGoBack && (
            <button
              onClick={handleGoBack}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </button>
          )}
          {showGoHome && (
            <button
              onClick={handleGoHome}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Home className="h-4 w-4" />
              Go to Dashboard
            </button>
          )}
        </div>

        {/* Help Text */}
        <p className="mt-8 text-xs text-gray-400">
          If you believe this is an error, please contact your administrator.
        </p>
      </div>
    </div>
  )
}

export default Forbidden
