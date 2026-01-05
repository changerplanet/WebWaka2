'use client'

import { useState, useEffect, useCallback } from 'react'
import { Terminal, RefreshCw, Eye, EyeOff, AlertTriangle } from 'lucide-react'

interface OtpLogEntry {
  identifier: string
  code: string
  type: string
  createdAt: string
  expiresAt: string
  expiresIn: string
}

interface DebugOtpViewerProps {
  identifier?: string  // Filter by specific phone/email
}

/**
 * DEBUG OTP VIEWER
 * 
 * This component displays mocked OTP codes for external reviewers
 * to test authentication flows in preview/development environments.
 * 
 * ⚠️ This should NEVER be enabled in production
 */
export function DebugOtpViewer({ identifier }: DebugOtpViewerProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [otps, setOtps] = useState<OtpLogEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isProduction, setIsProduction] = useState(false)
  
  const fetchOtps = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const url = identifier 
        ? `/api/debug/otp-logs?identifier=${encodeURIComponent(identifier)}`
        : '/api/debug/otp-logs'
      
      const res = await fetch(url)
      
      if (res.status === 403) {
        setIsProduction(true)
        return
      }
      
      if (!res.ok) {
        throw new Error('Failed to fetch OTP logs')
      }
      
      const data = await res.json()
      setOtps(data.otps || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load OTPs')
    } finally {
      setLoading(false)
    }
  }, [identifier])
  
  // Auto-refresh when visible
  useEffect(() => {
    if (isVisible && !isProduction) {
      fetchOtps()
      const interval = setInterval(fetchOtps, 3000) // Refresh every 3 seconds
      return () => clearInterval(interval)
    }
  }, [isVisible, isProduction, fetchOtps])
  
  // Don't render in production
  if (isProduction) {
    return null
  }
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Toggle Button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg shadow-lg font-medium text-sm transition-colors"
        data-testid="debug-otp-toggle"
        title="Toggle Debug OTP Viewer"
      >
        <Terminal className="w-4 h-4" />
        {isVisible ? 'Hide' : 'View'} Test OTPs
        {!isVisible && otps.length > 0 && (
          <span className="ml-1 px-2 py-0.5 bg-yellow-600 rounded-full text-xs">
            {otps.length}
          </span>
        )}
      </button>
      
      {/* Debug Panel */}
      {isVisible && (
        <div className="absolute bottom-12 right-0 w-80 bg-gray-900 rounded-lg shadow-2xl overflow-hidden border border-yellow-500/50">
          {/* Header */}
          <div className="bg-yellow-500 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-black" />
              <span className="font-bold text-black text-sm">DEBUG MODE</span>
            </div>
            <button
              onClick={fetchOtps}
              disabled={loading}
              className="p-1 hover:bg-yellow-600 rounded transition-colors"
            >
              <RefreshCw className={`w-4 h-4 text-black ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          
          <div className="p-3 text-xs text-yellow-400 bg-gray-800 border-b border-gray-700">
            ⚠️ For external reviewers only. Disabled in production.
          </div>
          
          {/* Content */}
          <div className="max-h-64 overflow-y-auto">
            {error ? (
              <div className="p-4 text-red-400 text-sm text-center">
                {error}
              </div>
            ) : otps.length === 0 ? (
              <div className="p-4 text-gray-400 text-sm text-center">
                No recent OTPs found.
                <br />
                <span className="text-xs">Request an OTP to see it here.</span>
              </div>
            ) : (
              <div className="divide-y divide-gray-700">
                {otps.map((otp, index) => (
                  <div key={`${otp.identifier}-${otp.code}-${index}`} className="p-3 hover:bg-gray-800">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-400">{otp.type}</span>
                      <span className="text-xs text-gray-500">{otp.expiresIn}</span>
                    </div>
                    <div className="font-mono text-green-400 text-lg mb-1">
                      {otp.code}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {otp.identifier}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Footer */}
          <div className="p-2 bg-gray-800 text-center">
            <a
              href="/api/debug/otp-logs"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-400 hover:underline"
            >
              Open full OTP logs →
            </a>
          </div>
        </div>
      )}
    </div>
  )
}

export default DebugOtpViewer
