'use client'

import { useState, useEffect, Suspense, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Phone,
  Mail,
  ArrowRight,
  ArrowLeft,
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
  Briefcase,
  Building2,
  GraduationCap,
  Hotel,
  Utensils,
  Compass,
  MapPin,
  RefreshCw,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  WifiOff,
  Wifi,
} from 'lucide-react'
import { DebugOtpViewer } from '@/components/DebugOtpViewer'

// ============================================================================
// OFFLINE DETECTION HOOK
// ============================================================================

function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true)
  
  useEffect(() => {
    // Check initial status
    setIsOnline(navigator.onLine)
    
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])
  
  return isOnline
}

// ============================================================================
// OFFLINE BANNER
// ============================================================================

function OfflineBanner({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-white px-4 py-3 z-50 flex items-center justify-center gap-3" data-testid="offline-banner">
      <WifiOff className="w-5 h-5" />
      <span className="font-medium">You're offline. Your progress is saved.</span>
      {onRetry && (
        <button 
          onClick={onRetry}
          className="ml-2 px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-sm font-medium"
        >
          Retry
        </button>
      )}
    </div>
  )
}

// ============================================================================
// NETWORK ERROR COMPONENT
// ============================================================================

function NetworkError({ 
  message, 
  onRetry 
}: { 
  message: string
  onRetry: () => void 
}) {
  return (
    <div className="p-4 bg-red-50 border border-red-200 rounded-lg" data-testid="network-error">
      <div className="flex items-start gap-3">
        <WifiOff className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="font-medium text-red-700">Network Error</p>
          <p className="text-sm text-red-600 mt-1">{message}</p>
        </div>
      </div>
      <button
        onClick={onRetry}
        className="mt-3 w-full px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-medium rounded-lg flex items-center justify-center gap-2"
      >
        <RefreshCw className="w-4 h-4" />
        Try Again
      </button>
    </div>
  )
}

// ============================================================================
// TYPES
// ============================================================================

type SignupStep = 'identity' | 'otp' | 'intent' | 'business' | 'discovery' | 'complete'

interface SignupState {
  phone: string
  email: string
  sessionToken: string
  otpId: string
  userIntent: string
  businessName: string
  businessType: string
  state: string
  city: string
  discoveryChoices: string[]
  name: string
}

// ============================================================================
// OPTIONS
// ============================================================================

const USER_INTENTS = [
  {
    key: 'run_business',
    label: 'I run a business',
    description: 'I am setting up my own business or shop',
    icon: Building2,
  },
  {
    key: 'setup_for_other',
    label: 'Setting up for someone else',
    description: 'I am helping a friend, family, or client',
    icon: Users,
  },
  {
    key: 'partner',
    label: 'I am a partner / consultant',
    description: 'I work with multiple businesses',
    icon: Briefcase,
  },
]

const BUSINESS_TYPES = [
  { key: 'retail_shop', label: 'Retail Shop' },
  { key: 'supermarket', label: 'Supermarket / Mini-mart' },
  { key: 'restaurant', label: 'Restaurant / Eatery' },
  { key: 'pharmacy', label: 'Pharmacy' },
  { key: 'fashion', label: 'Fashion / Clothing' },
  { key: 'electronics', label: 'Electronics / Phone Shop' },
  { key: 'services', label: 'Services (Salon, Barber, etc.)' },
  { key: 'wholesale', label: 'Wholesale / Distribution' },
  { key: 'school', label: 'School' },
  { key: 'hotel', label: 'Hotel / Guest House' },
  { key: 'other', label: 'Other' },
  { key: 'not_sure', label: 'Not sure yet' },
]

const DISCOVERY_OPTIONS = [
  { key: 'sell_in_store', label: 'Sell in-store', icon: Store, description: 'Use a POS to sell' },
  { key: 'sell_online', label: 'Sell online', icon: Globe, description: 'WhatsApp or online store' },
  { key: 'manage_inventory', label: 'Manage inventory', icon: Package, description: 'Track stock levels' },
  { key: 'track_finances', label: 'Track finances', icon: Calculator, description: 'Monitor profits' },
  { key: 'manage_customers', label: 'Manage customers', icon: Users, description: 'Customer records' },
  { key: 'manage_team', label: 'Manage my team', icon: UserCheck, description: 'Attendance & payroll' },
  { key: 'manage_deliveries', label: 'Manage deliveries', icon: Truck, description: 'Order tracking' },
  { key: 'run_school', label: 'Run a school', icon: GraduationCap, description: 'Student management' },
  { key: 'run_hotel', label: 'Run a hotel', icon: Hotel, description: 'Room bookings' },
  { key: 'something_else', label: 'Something else', icon: Compass, description: 'Explore options' },
]

const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT', 'Gombe',
  'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara',
  'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau',
  'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
]

// ============================================================================
// PROGRESS INDICATOR
// ============================================================================

function ProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <div className="w-full max-w-xs mx-auto mb-8">
      <div className="flex justify-between mb-2">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-colors ${
              i <= current ? 'bg-green-500' : 'bg-gray-300'
            }`}
          />
        ))}
      </div>
      <div className="h-1 bg-gray-200 rounded-full">
        <div
          className="h-1 bg-green-500 rounded-full transition-all duration-300"
          style={{ width: `${((current + 1) / total) * 100}%` }}
        />
      </div>
    </div>
  )
}

// ============================================================================
// STEP 1: IDENTITY (Phone/Email)
// ============================================================================

function IdentityStep({
  state,
  setState,
  onNext,
  loading,
  error,
}: {
  state: SignupState
  setState: (s: Partial<SignupState>) => void
  onNext: () => void
  loading: boolean
  error: string | null
}) {
  const [inputMode, setInputMode] = useState<'phone' | 'email'>('phone')

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to WebWaka</h1>
        <p className="text-gray-600">Enter your phone number to get started</p>
      </div>

      {/* Mode Toggle */}
      <div className="flex bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => setInputMode('phone')}
          className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
            inputMode === 'phone'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Phone className="w-4 h-4 inline mr-2" />
          Phone
        </button>
        <button
          onClick={() => setInputMode('email')}
          className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
            inputMode === 'email'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Mail className="w-4 h-4 inline mr-2" />
          Email
        </button>
      </div>

      {/* Input */}
      {inputMode === 'phone' ? (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number
          </label>
          <div className="flex">
            <span className="inline-flex items-center px-4 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg text-gray-500">
              🇳🇬 +234
            </span>
            <input
              type="tel"
              value={state.phone.replace(/^\+?234/, '')}
              onChange={(e) => setState({ phone: e.target.value.replace(/\D/g, '') })}
              placeholder="803 123 4567"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg"
              data-testid="signup-phone-input"
              autoFocus
            />
          </div>
          <p className="mt-2 text-sm text-gray-500">We'll send you a verification code</p>
        </div>
      ) : (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <input
            type="email"
            value={state.email}
            onChange={(e) => setState({ email: e.target.value })}
            placeholder="you@example.com"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg"
            data-testid="signup-email-input"
            autoFocus
          />
          <p className="mt-2 text-sm text-gray-500">We'll send you a verification code</p>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <button
        onClick={onNext}
        disabled={loading || (!state.phone && !state.email)}
        className="w-full py-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
        data-testid="signup-continue-btn"
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            Continue
            <ArrowRight className="w-5 h-5" />
          </>
        )}
      </button>

      <p className="text-center text-sm text-gray-600">
        Already have an account?{' '}
        <Link href="/login" className="text-green-600 font-medium hover:underline">
          Login
        </Link>
      </p>
    </div>
  )
}

// ============================================================================
// STEP 2: OTP VERIFICATION
// ============================================================================

function OtpStep({
  state,
  onVerify,
  onResend,
  onBack,
  loading,
  error,
  canResendAt,
}: {
  state: SignupState
  onVerify: (code: string) => void
  onResend: () => void
  onBack: () => void
  loading: boolean
  error: string | null
  canResendAt: Date | null
}) {
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [canResend, setCanResend] = useState(false)
  const [countdown, setCountdown] = useState(60)

  // Countdown timer
  useEffect(() => {
    if (canResendAt) {
      const updateCountdown = () => {
        const remaining = Math.max(0, Math.ceil((canResendAt.getTime() - Date.now()) / 1000))
        setCountdown(remaining)
        setCanResend(remaining === 0)
      }
      updateCountdown()
      const interval = setInterval(updateCountdown, 1000)
      return () => clearInterval(interval)
    }
  }, [canResendAt])

  // Auto-submit when code is complete
  useEffect(() => {
    const fullCode = code.join('')
    if (fullCode.length === 6 && !loading) {
      onVerify(fullCode)
    }
  }, [code])

  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    
    const newCode = [...code]
    newCode[index] = value.slice(-1)
    setCode(newCode)
    
    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`)
      nextInput?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`)
      prevInput?.focus()
    }
  }

  const maskedRecipient = state.phone 
    ? `+234****${state.phone.slice(-4)}`
    : state.email.replace(/(.{2}).*(@.*)/, '$1***$2')

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="flex items-center text-gray-600 hover:text-gray-900">
        <ArrowLeft className="w-5 h-5 mr-1" />
        Back
      </button>

      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Verify your number</h1>
        <p className="text-gray-600">
          Enter the 6-digit code sent to<br />
          <span className="font-medium text-gray-900">{maskedRecipient}</span>
        </p>
      </div>

      {/* OTP Input */}
      <div className="flex justify-center gap-2">
        {code.map((digit, index) => (
          <input
            key={index}
            id={`otp-${index}`}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleCodeChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-500"
            data-testid={`otp-input-${index}`}
          />
        ))}
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {loading && (
        <div className="flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-green-500" />
        </div>
      )}

      <div className="text-center">
        <p className="text-sm text-gray-600 mb-2">Didn't receive the code?</p>
        {canResend ? (
          <button
            onClick={onResend}
            className="text-green-600 font-medium hover:underline flex items-center justify-center gap-1 mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            Resend Code
          </button>
        ) : (
          <p className="text-sm text-gray-500">
            Resend in {countdown}s
          </p>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// STEP 3: USER INTENT
// ============================================================================

function IntentStep({
  state,
  setState,
  onNext,
  onBack,
}: {
  state: SignupState
  setState: (s: Partial<SignupState>) => void
  onNext: () => void
  onBack: () => void
}) {
  return (
    <div className="space-y-6">
      <button onClick={onBack} className="flex items-center text-gray-600 hover:text-gray-900">
        <ArrowLeft className="w-5 h-5 mr-1" />
        Back
      </button>

      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">What brings you here?</h1>
        <p className="text-gray-600">This helps us personalize your experience</p>
      </div>

      <div className="space-y-3">
        {USER_INTENTS.map((intent) => {
          const Icon = intent.icon
          const isSelected = state.userIntent === intent.key
          return (
            <button
              key={intent.key}
              onClick={() => setState({ userIntent: intent.key })}
              className={`w-full p-4 rounded-xl border-2 transition-all text-left flex items-start gap-4 ${
                isSelected
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              data-testid={`intent-${intent.key}`}
            >
              <div className={`p-2 rounded-lg ${isSelected ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">{intent.label}</p>
                <p className="text-sm text-gray-500">{intent.description}</p>
              </div>
              {isSelected && <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />}
            </button>
          )
        })}
      </div>

      <button
        onClick={onNext}
        disabled={!state.userIntent}
        className="w-full py-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
        data-testid="intent-continue-btn"
      >
        Continue
        <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  )
}

// ============================================================================
// STEP 4: BUSINESS BASICS
// ============================================================================

function BusinessStep({
  state,
  setState,
  onNext,
  onBack,
  loading,
  error,
}: {
  state: SignupState
  setState: (s: Partial<SignupState>) => void
  onNext: () => void
  onBack: () => void
  loading: boolean
  error: string | null
}) {
  return (
    <div className="space-y-6">
      <button onClick={onBack} className="flex items-center text-gray-600 hover:text-gray-900">
        <ArrowLeft className="w-5 h-5 mr-1" />
        Back
      </button>

      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Tell us about your business</h1>
        <p className="text-gray-600">Just the basics to get you started</p>
      </div>

      <div className="space-y-4">
        {/* Business Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Business Name *
          </label>
          <input
            type="text"
            value={state.businessName}
            onChange={(e) => setState({ businessName: e.target.value })}
            placeholder="e.g., Mama's Kitchen, ABC Store"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            data-testid="business-name-input"
          />
        </div>

        {/* Business Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Business Type <span className="text-gray-400">(optional)</span>
          </label>
          <select
            value={state.businessType}
            onChange={(e) => setState({ businessType: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
            data-testid="business-type-select"
          >
            <option value="">Select type</option>
            {BUSINESS_TYPES.map((type) => (
              <option key={type.key} value={type.key}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* State */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            State <span className="text-gray-400">(optional)</span>
          </label>
          <select
            value={state.state}
            onChange={(e) => setState({ state: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
            data-testid="state-select"
          >
            <option value="">Select state</option>
            {NIGERIAN_STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* City */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            City <span className="text-gray-400">(optional)</span>
          </label>
          <input
            type="text"
            value={state.city}
            onChange={(e) => setState({ city: e.target.value })}
            placeholder="e.g., Lagos, Ikeja"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            data-testid="city-input"
          />
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <button
        onClick={onNext}
        disabled={loading || !state.businessName.trim()}
        className="w-full py-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
        data-testid="business-continue-btn"
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            Continue
            <ArrowRight className="w-5 h-5" />
          </>
        )}
      </button>
    </div>
  )
}

// ============================================================================
// STEP 5: DISCOVERY
// ============================================================================

function DiscoveryStep({
  state,
  setState,
  onNext,
  onBack,
  loading,
}: {
  state: SignupState
  setState: (s: Partial<SignupState>) => void
  onNext: () => void
  onBack: () => void
  loading: boolean
}) {
  const toggleChoice = (key: string) => {
    const choices = state.discoveryChoices.includes(key)
      ? state.discoveryChoices.filter((c) => c !== key)
      : [...state.discoveryChoices, key]
    setState({ discoveryChoices: choices })
  }

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="flex items-center text-gray-600 hover:text-gray-900">
        <ArrowLeft className="w-5 h-5 mr-1" />
        Back
      </button>

      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">What do you want to do?</h1>
        <p className="text-gray-600">Select all that apply (you can change this later)</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {DISCOVERY_OPTIONS.map((option) => {
          const Icon = option.icon
          const isSelected = state.discoveryChoices.includes(option.key)
          return (
            <button
              key={option.key}
              onClick={() => toggleChoice(option.key)}
              className={`p-4 rounded-xl border-2 transition-all text-left ${
                isSelected
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              data-testid={`discovery-${option.key}`}
            >
              <Icon className={`w-6 h-6 mb-2 ${isSelected ? 'text-green-600' : 'text-gray-400'}`} />
              <p className="font-medium text-gray-900 text-sm">{option.label}</p>
              <p className="text-xs text-gray-500">{option.description}</p>
            </button>
          )
        })}
      </div>

      <button
        onClick={onNext}
        disabled={loading}
        className="w-full py-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
        data-testid="discovery-continue-btn"
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            Complete Setup
            <Sparkles className="w-5 h-5" />
          </>
        )}
      </button>

      <button
        onClick={onNext}
        className="w-full py-2 text-gray-500 hover:text-gray-700 text-sm"
      >
        Skip for now
      </button>
    </div>
  )
}

// ============================================================================
// STEP 6: COMPLETE
// ============================================================================

function CompleteStep({
  tenantSlug,
}: {
  tenantSlug: string
}) {
  const router = useRouter()

  useEffect(() => {
    // Redirect to dashboard after 3 seconds
    const timer = setTimeout(() => {
      router.push('/dashboard')
    }, 3000)
    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="space-y-6 text-center">
      <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center">
        <CheckCircle className="w-10 h-10 text-green-600" />
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">You're all set!</h1>
        <p className="text-gray-600">
          Welcome to WebWaka. Your business is ready.
        </p>
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <p className="text-sm text-gray-500 mb-1">Your business URL</p>
        <p className="font-mono text-green-600">{tenantSlug}.webwaka.com</p>
      </div>

      <button
        onClick={() => router.push('/dashboard')}
        className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
        data-testid="goto-dashboard-btn"
      >
        Go to Dashboard
        <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const LOCAL_STORAGE_KEY = 'webwaka_signup_state'

function SignupV2Content() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isOnline = useOnlineStatus()
  
  // URL params
  const intentParam = searchParams.get('intent')
  const referralCode = searchParams.get('ref') || searchParams.get('referral')
  
  // State
  const [step, setStep] = useState<SignupStep>('identity')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isNetworkError, setIsNetworkError] = useState(false)
  const [canResendAt, setCanResendAt] = useState<Date | null>(null)
  const [tenantSlug, setTenantSlug] = useState('')
  const [lastAction, setLastAction] = useState<(() => void) | null>(null)
  
  const [formState, setFormState] = useState<SignupState>({
    phone: '',
    email: '',
    sessionToken: '',
    otpId: '',
    userIntent: '',
    businessName: '',
    businessType: '',
    state: '',
    city: '',
    discoveryChoices: intentParam ? [intentParam] : [],
    name: '',
  })

  // Load saved state from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY)
      if (saved) {
        const { state: savedState, step: savedStep, timestamp } = JSON.parse(saved)
        // Only restore if less than 30 minutes old
        const isValid = Date.now() - timestamp < 30 * 60 * 1000
        if (isValid && savedState && savedStep) {
          setFormState(savedState)
          setStep(savedStep)
        } else {
          localStorage.removeItem(LOCAL_STORAGE_KEY)
        }
      }
    } catch (e) {
      // Ignore localStorage errors
    }
  }, [])

  // Save state to localStorage on changes
  useEffect(() => {
    if (step !== 'identity' && step !== 'complete') {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({
          state: formState,
          step,
          timestamp: Date.now(),
        }))
      } catch (e) {
        // Ignore localStorage errors
      }
    }
  }, [formState, step])

  // Clear saved state on completion
  useEffect(() => {
    if (step === 'complete') {
      try {
        localStorage.removeItem(LOCAL_STORAGE_KEY)
      } catch (e) {
        // Ignore
      }
    }
  }, [step])

  const updateState = (updates: Partial<SignupState>) => {
    setFormState((prev) => ({ ...prev, ...updates }))
  }

  // Step indices for progress bar
  const stepIndex = {
    identity: 0,
    otp: 1,
    intent: 2,
    business: 3,
    discovery: 4,
    complete: 5,
  }

  // Retry last action (for network errors)
  const handleRetry = useCallback(() => {
    setError(null)
    setIsNetworkError(false)
    if (lastAction) {
      lastAction()
    }
  }, [lastAction])

  // Wrap API calls with error handling
  const safeApiCall = async <T,>(
    action: () => Promise<T>,
    actionFn: () => void
  ): Promise<T | null> => {
    if (!isOnline) {
      setError('You are offline. Please check your internet connection.')
      setIsNetworkError(true)
      setLastAction(() => actionFn)
      return null
    }

    try {
      setIsNetworkError(false)
      return await action()
    } catch (err: any) {
      if (err.message?.includes('fetch') || err.message?.includes('network') || !navigator.onLine) {
        setError('Network error. Please check your connection and try again.')
        setIsNetworkError(true)
        setLastAction(() => actionFn)
      } else {
        setError(err.message || 'Something went wrong. Please try again.')
      }
      return null
    }
  }

  // ============================================================================
  // API CALLS
  // ============================================================================

  const handleStartSignup = async () => {
    setLoading(true)
    setError(null)

    const result = await safeApiCall(async () => {
      const response = await fetch('/api/auth/v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'signup-start',
          phone: formState.phone ? `+234${formState.phone}` : undefined,
          email: formState.email || undefined,
          referralCode,
          intent: intentParam,
          source: 'MARKETING_PAGE',
        }),
      })
      return response.json()
    }, handleStartSignup)

    setLoading(false)

    if (!result) return

    if (result.success) {
      updateState({
        sessionToken: result.sessionToken,
        otpId: result.otpId,
      })
      setCanResendAt(result.canResendAt ? new Date(result.canResendAt) : null)
      setStep('otp')
    } else {
      if (result.errorCode === 'USER_EXISTS') {
        setError('An account already exists. Please login instead.')
      } else {
        setError(result.error || 'Failed to start signup')
      }
    }
  }

  const handleVerifyOtp = async (code: string) => {
    setLoading(true)
    setError(null)

    const result = await safeApiCall(async () => {
      const response = await fetch('/api/auth/v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'signup-otp-verify',
          sessionToken: formState.sessionToken,
          otpId: formState.otpId,
          code,
        }),
      })
      return response.json()
    }, () => handleVerifyOtp(code))

    setLoading(false)

    if (!result) return

    if (result.success) {
      setStep('intent')
    } else {
      setError(result.error || 'Invalid code')
    }
  }

  const handleResendOtp = async () => {
    setLoading(true)
    setError(null)

    const result = await safeApiCall(async () => {
      const response = await fetch('/api/auth/v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'otp-resend',
          otpId: formState.otpId,
        }),
      })
      return response.json()
    }, handleResendOtp)

    setLoading(false)

    if (!result) return

    if (result.success) {
      updateState({ otpId: result.otpId })
      setCanResendAt(result.canResendAt ? new Date(result.canResendAt) : null)
    } else {
      setError(result.error || 'Failed to resend code')
    }
  }

  const handleSetIntent = async () => {
    const result = await safeApiCall(async () => {
      const response = await fetch('/api/auth/v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'signup-intent',
          sessionToken: formState.sessionToken,
          intent: formState.userIntent,
        }),
      })
      return response.json()
    }, handleSetIntent)
    
    // Continue to next step regardless (intent is optional)
    setStep('business')
  }

  const handleSetBusiness = async () => {
    setLoading(true)
    setError(null)

    const result = await safeApiCall(async () => {
      const response = await fetch('/api/auth/v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'signup-business',
          sessionToken: formState.sessionToken,
          businessName: formState.businessName,
          businessType: formState.businessType,
          country: 'NG',
          state: formState.state,
          city: formState.city,
        }),
      })
      return response.json()
    }, handleSetBusiness)

    setLoading(false)

    if (!result) return

    if (result.success) {
      setStep('discovery')
    } else {
      setError(result.error || 'Please enter a valid business name')
    }
  }

  const handleCompleteSignup = async () => {
    setLoading(true)
    setError(null)

    const result = await safeApiCall(async () => {
      // Set discovery choices first
      await fetch('/api/auth/v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'signup-discovery',
          sessionToken: formState.sessionToken,
          choices: formState.discoveryChoices,
        }),
      })

      // Complete signup
      const response = await fetch('/api/auth/v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'signup-complete',
          sessionToken: formState.sessionToken,
          name: formState.name,
        }),
      })
      return response.json()
    }, handleCompleteSignup)

    setLoading(false)

    if (!result) return

    if (result.success) {
      setTenantSlug(result.tenantSlug)
      setStep('complete')
    } else {
      setError(result.error || 'Failed to complete signup')
    }
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center p-4">
      {/* Offline Banner */}
      {!isOnline && <OfflineBanner onRetry={handleRetry} />}
      
      <div className={`w-full max-w-md ${!isOnline ? 'pt-16' : ''}`}>
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-green-500 to-green-600 mb-3">
            <Building2 className="w-7 h-7 text-white" />
          </div>
        </div>

        {/* Progress */}
        {step !== 'complete' && (
          <ProgressBar current={stepIndex[step]} total={5} />
        )}

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
          {/* Network Error Display */}
          {isNetworkError && error && (
            <NetworkError message={error} onRetry={handleRetry} />
          )}
          
          {!isNetworkError && step === 'identity' && (
            <IdentityStep
              state={formState}
              setState={updateState}
              onNext={handleStartSignup}
              loading={loading}
              error={error}
            />
          )}
          
          {!isNetworkError && step === 'otp' && (
            <OtpStep
              state={formState}
              onVerify={handleVerifyOtp}
              onResend={handleResendOtp}
              onBack={() => setStep('identity')}
              loading={loading}
              error={error}
              canResendAt={canResendAt}
            />
          )}
          
          {!isNetworkError && step === 'intent' && (
            <IntentStep
              state={formState}
              setState={updateState}
              onNext={handleSetIntent}
              onBack={() => setStep('otp')}
            />
          )}
          
          {!isNetworkError && step === 'business' && (
            <BusinessStep
              state={formState}
              setState={updateState}
              onNext={handleSetBusiness}
              onBack={() => setStep('intent')}
              loading={loading}
              error={error}
            />
          )}
          
          {!isNetworkError && step === 'discovery' && (
            <DiscoveryStep
              state={formState}
              setState={updateState}
              onNext={handleCompleteSignup}
              onBack={() => setStep('business')}
              loading={loading}
            />
          )}
          
          {step === 'complete' && (
            <CompleteStep tenantSlug={tenantSlug} />
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500 mt-6">
          By signing up, you agree to our{' '}
          <Link href="/terms" className="text-green-600 hover:underline">Terms</Link>
          {' '}and{' '}
          <Link href="/privacy" className="text-green-600 hover:underline">Privacy Policy</Link>
        </p>
      </div>
      
      {/* Debug OTP Viewer for external reviewers */}
      <DebugOtpViewer identifier={formState.phone || formState.email || undefined} />
    </div>
  )
}

export default function SignupV2Page() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-green-500" />
      </div>
    }>
      <SignupV2Content />
    </Suspense>
  )
}
