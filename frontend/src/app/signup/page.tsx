'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Mail,
  ArrowRight,
  CheckCircle,
  Loader2,
  Store,
  Globe,
  ShoppingBag,
  Package,
  Calculator,
  Users,
  UserCheck,
  Truck,
  Handshake,
  GraduationCap,
  HeartPulse,
  Building,
  Utensils,
  Compass,
  Sparkles,
  ChevronLeft,
  AlertCircle,
} from 'lucide-react'

interface IntentDefinition {
  key: string
  domain: string
  label: string
  description: string
  suggestedCapabilities: string[]
  icon?: string
  priority?: number
}

const INTENT_ICONS: Record<string, any> = {
  'store': Store,
  'globe': Globe,
  'shopping-bag': ShoppingBag,
  'package': Package,
  'calculator': Calculator,
  'users': Users,
  'user-check': UserCheck,
  'truck': Truck,
  'handshake': Handshake,
  'graduation-cap': GraduationCap,
  'heart-pulse': HeartPulse,
  'building': Building,
  'utensils': Utensils,
  'compass': Compass,
}

function SignupContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Parse intent from URL
  const intentKey = searchParams.get('intent')
  const source = searchParams.get('source') || 'MARKETING_PAGE'
  const campaignId = searchParams.get('utm_campaign') || searchParams.get('campaign')
  const referralCode = searchParams.get('ref') || searchParams.get('referral')
  
  // State
  const [step, setStep] = useState<'email' | 'intent' | 'verify'>('email')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedIntent, setSelectedIntent] = useState<string | null>(intentKey)
  const [intents, setIntents] = useState<IntentDefinition[]>([])
  const [capturedIntentId, setCapturedIntentId] = useState<string | null>(null)
  const [magicLinkSent, setMagicLinkSent] = useState(false)

  // Fetch intent definitions
  useEffect(() => {
    fetch('/api/intent?action=definitions')
      .then(res => res.json())
      .then(data => setIntents(data.intents || []))
      .catch(console.error)
  }, [])

  // If intent provided in URL, skip intent selection
  useEffect(() => {
    if (intentKey) {
      setSelectedIntent(intentKey)
    }
  }, [intentKey])

  const currentIntent = intents.find(i => i.key === selectedIntent)

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    try {
      setLoading(true)
      setError(null)

      // If no intent selected, show intent selection
      if (!selectedIntent) {
        setStep('intent')
        setLoading(false)
        return
      }

      // Capture intent first
      const intentRes = await fetch('/api/intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'capture',
          intentKey: selectedIntent,
          sourceUrl: window.location.href,
          source,
          campaignId,
          referralCode,
          metadata: { email },
        }),
      })

      const intentData = await intentRes.json()
      if (intentRes.ok && intentData.intent) {
        setCapturedIntentId(intentData.intent.id)
      }

      // Send magic link
      const authRes = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          intent: selectedIntent,
          intentId: intentData.intent?.id,
          source,
          campaignId,
          referralCode,
        }),
      })

      const authData = await authRes.json()

      if (!authRes.ok) {
        throw new Error(authData.error || 'Failed to send magic link')
      }

      setMagicLinkSent(true)
      setStep('verify')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleIntentSelect = (key: string) => {
    setSelectedIntent(key)
    setStep('email')
  }

  const getIconComponent = (iconName?: string) => {
    if (!iconName) return Compass
    return INTENT_ICONS[iconName] || Compass
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg">
              <Store className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">WebWaka</span>
          </Link>
        </div>

        {/* Main Card */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 overflow-hidden">
          {/* Step: Email Entry */}
          {step === 'email' && (
            <>
              <div className="p-6 border-b border-slate-700/50">
                <h1 className="text-xl font-bold text-white">Get Started</h1>
                <p className="text-slate-400 text-sm mt-1">
                  {currentIntent ? (
                    <>Setting up to <span className="text-green-400">{currentIntent.label.toLowerCase()}</span></>
                  ) : (
                    'Create your business account'
                  )}
                </p>
              </div>

              {/* Current Intent Display */}
              {currentIntent && (
                <div className="px-6 py-3 bg-green-500/10 border-b border-slate-700/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {(() => {
                        const IconComponent = getIconComponent(currentIntent.icon)
                        return <IconComponent className="h-5 w-5 text-green-400" />
                      })()}
                      <div>
                        <p className="text-sm font-medium text-white">{currentIntent.label}</p>
                        <p className="text-xs text-slate-400">{currentIntent.description}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedIntent(null)
                        setStep('intent')
                      }}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      Change
                    </button>
                  </div>
                </div>
              )}

              <form onSubmit={handleEmailSubmit} className="p-6 space-y-4">
                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-400" />
                    <span className="text-sm text-red-400">{error}</span>
                  </div>
                )}

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@business.com"
                      className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-green-500 transition-colors"
                      required
                      data-testid="signup-email-input"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  data-testid="signup-continue-btn"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </button>

                <p className="text-center text-sm text-slate-400">
                  Already have an account?{' '}
                  <Link href="/login" className="text-green-400 hover:text-green-300">
                    Sign in
                  </Link>
                </p>
              </form>
            </>
          )}

          {/* Step: Intent Selection */}
          {step === 'intent' && (
            <>
              <div className="p-6 border-b border-slate-700/50">
                <button
                  onClick={() => setStep('email')}
                  className="flex items-center gap-1 text-slate-400 hover:text-white text-sm mb-3"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </button>
                <h1 className="text-xl font-bold text-white">What do you want to do?</h1>
                <p className="text-slate-400 text-sm mt-1">
                  This helps us personalize your experience
                </p>
              </div>

              <div className="p-6 space-y-3 max-h-[400px] overflow-y-auto">
                {intents
                  .filter(i => i.domain === 'COMMERCE' || i.domain === 'HOSPITALITY')
                  .map(intent => {
                    const IconComponent = getIconComponent(intent.icon)
                    const isSelected = selectedIntent === intent.key

                    return (
                      <button
                        key={intent.key}
                        onClick={() => handleIntentSelect(intent.key)}
                        className={`w-full p-4 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'bg-green-500/20 border-green-500/50'
                            : 'bg-slate-900/30 border-slate-700/50 hover:bg-slate-700/30 hover:border-slate-600'
                        }`}
                        data-testid={`intent-${intent.key}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${isSelected ? 'bg-green-500/30' : 'bg-slate-700/50'}`}>
                            <IconComponent className={`h-5 w-5 ${isSelected ? 'text-green-400' : 'text-slate-400'}`} />
                          </div>
                          <div className="flex-1">
                            <p className={`font-medium ${isSelected ? 'text-green-400' : 'text-white'}`}>
                              {intent.label}
                            </p>
                            <p className="text-sm text-slate-400 mt-0.5">{intent.description}</p>
                          </div>
                          {isSelected && (
                            <CheckCircle className="h-5 w-5 text-green-400" />
                          )}
                        </div>
                      </button>
                    )
                  })}

                <button
                  onClick={() => handleIntentSelect('explore_platform')}
                  className={`w-full p-4 rounded-xl border text-left transition-all ${
                    selectedIntent === 'explore_platform'
                      ? 'bg-green-500/20 border-green-500/50'
                      : 'bg-slate-900/30 border-slate-700/50 hover:bg-slate-700/30 hover:border-slate-600'
                  }`}
                  data-testid="intent-explore"
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${selectedIntent === 'explore_platform' ? 'bg-green-500/30' : 'bg-slate-700/50'}`}>
                      <Compass className={`h-5 w-5 ${selectedIntent === 'explore_platform' ? 'text-green-400' : 'text-slate-400'}`} />
                    </div>
                    <div className="flex-1">
                      <p className={`font-medium ${selectedIntent === 'explore_platform' ? 'text-green-400' : 'text-white'}`}>
                        Just Exploring
                      </p>
                      <p className="text-sm text-slate-400 mt-0.5">I want to see what WebWaka offers</p>
                    </div>
                  </div>
                </button>
              </div>
            </>
          )}

          {/* Step: Verification */}
          {step === 'verify' && (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="h-8 w-8 text-green-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Check your email</h2>
              <p className="text-slate-400 mb-6">
                We sent a magic link to <span className="text-white font-medium">{email}</span>
              </p>
              <p className="text-sm text-slate-500">
                Click the link in the email to complete your signup.
              </p>

              {currentIntent && (
                <div className="mt-6 p-4 bg-green-500/10 rounded-xl">
                  <div className="flex items-center justify-center gap-2 text-green-400">
                    <Sparkles className="h-4 w-4" />
                    <span className="text-sm">
                      We'll help you get started with {currentIntent.label.toLowerCase()}
                    </span>
                  </div>
                </div>
              )}

              <button
                onClick={() => {
                  setStep('email')
                  setMagicLinkSent(false)
                }}
                className="mt-6 text-sm text-slate-400 hover:text-white"
              >
                Use a different email
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-slate-500 mt-6">
          By continuing, you agree to our{' '}
          <Link href="/terms" className="text-slate-400 hover:text-white">Terms</Link>
          {' '}and{' '}
          <Link href="/privacy" className="text-slate-400 hover:text-white">Privacy Policy</Link>
        </p>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-green-500 animate-spin" />
      </div>
    }>
      <SignupContent />
    </Suspense>
  )
}
