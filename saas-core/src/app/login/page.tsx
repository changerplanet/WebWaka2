'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Mail, ArrowRight, Check, AlertCircle, Loader2, Building2, ExternalLink, Copy } from 'lucide-react'

export default function LoginPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [magicLink, setMagicLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  
  const tenantSlug = searchParams.get('tenant')
  const errorParam = searchParams.get('error')
  
  useEffect(() => {
    if (errorParam) {
      const errorMessages: Record<string, string> = {
        'missing_token': 'Invalid login link. Please request a new one.',
        'invalid_or_expired': 'This login link has expired. Please request a new one.',
        'verification_failed': 'Verification failed. Please try again.'
      }
      setError(errorMessages[errorParam] || 'An error occurred')
    }
  }, [errorParam])
  
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMagicLink(null)
    
    try {
      const res = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, tenantSlug })
      })
      
      const data = await res.json()
      
      if (data.success) {
        setSent(true)
        // If magic link is provided in response (dev mode or email failed)
        if (data.magicLink) {
          setMagicLink(data.magicLink)
        }
      } else {
        setError(data.error || 'Failed to send magic link')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function copyMagicLink() {
    if (magicLink) {
      await navigator.clipboard.writeText(magicLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">eMarketWaka</h1>
          {tenantSlug && (
            <p className="text-slate-500 mt-1">Signing in to {tenantSlug}</p>
          )}
        </div>
        
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-8">
          {sent ? (
            // Success State
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900 mb-2">
                {magicLink ? 'Magic Link Ready' : 'Check your email'}
              </h2>
              <p className="text-slate-600 mb-6">
                {magicLink 
                  ? 'Click the button below to sign in, or check your email.'
                  : <>We sent a magic link to <strong>{email}</strong>. Click the link to sign in.</>
                }
              </p>
              
              {/* Show magic link button for testing */}
              {magicLink && (
                <div className="space-y-3 mb-6">
                  <a
                    href={magicLink}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition"
                  >
                    <ExternalLink className="w-5 h-5" />
                    Sign In Now
                  </a>
                  <button
                    onClick={copyMagicLink}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition"
                  >
                    <Copy className="w-4 h-4" />
                    {copied ? 'Copied!' : 'Copy Link'}
                  </button>
                  <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded-lg">
                    ⚠️ Dev Mode: Email sending requires a verified domain in Resend
                  </p>
                </div>
              )}
              
              <p className="text-sm text-slate-500">
                Didn't receive it?{' '}
                <button
                  onClick={() => { setSent(false); setError(null); setMagicLink(null) }}
                  className="text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Try again
                </button>
              </p>
            </div>
          ) : (
            // Login Form
            <>
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold text-slate-900">Sign in with email</h2>
                <p className="text-slate-500 mt-1">We'll send you a magic link</p>
              </div>
              
              {error && (
                <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl mb-6 text-red-700">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p className="text-sm">{error}</p>
                </div>
              )}
              
              <form onSubmit={handleSubmit}>
                <div className="mb-6">
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
        
        {/* Footer */}
        <p className="text-center text-slate-500 text-sm mt-6">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  )
}
