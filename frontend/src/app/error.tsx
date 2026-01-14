'use client'

import { AlertTriangle, RefreshCw } from 'lucide-react'
import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error for monitoring (without exposing to user)
    console.error('Global error boundary caught:', error)
  }, [error])

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <div className="max-w-md w-full text-center">
        {/* Error Icon */}
        <div className="flex justify-center mb-6">
          <div className="rounded-full bg-destructive/10 p-4">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
        </div>

        {/* Error Title */}
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Something went wrong
        </h1>

        {/* Error Description */}
        <p className="text-muted-foreground mb-8">
          We encountered an unexpected error. Please try again or contact support if the problem persists.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center px-4 py-2 bg-muted text-muted-foreground rounded-md font-medium hover:bg-muted/80 transition-colors"
          >
            Return home
          </a>
        </div>
      </div>
    </div>
  )
}
