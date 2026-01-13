'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="text-center p-8">
            <h1 className="text-6xl font-bold text-slate-300 mb-4">500</h1>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Something went wrong</h2>
            <p className="text-slate-600 mb-6">
              An unexpected error occurred. Please try again.
            </p>
            <button
              onClick={() => reset()}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              Try Again
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
