'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Phone,
  Mail,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Loader2,
  Building2,
  Eye,
  EyeOff,
  RefreshCw,
  AlertCircle,
  Smartphone,
  Key,
  Sparkles,
} from 'lucide-react'
import { DebugOtpViewer } from '@/components/DebugOtpViewer'

// ============================================================================
// TYPES
// ============================================================================

type LoginStep = 'identify' | 'otp' | 'password'
type LoginMethod = 'otp_phone' | 'otp_email' | 'password' | 'magic_link'

interface LoginState {
  identifier: string
  method: LoginMethod
  availableMethods: LoginMethod[]
  hasPassword: boolean
  otpId: string
  maskedIdentifier: string
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

function LoginV2Content() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // URL params
  const errorParam = searchParams.get('error')
  const returnTo = searchParams.get('return') || '/dashboard'
  
  // State
  const [step, setStep] = useState<LoginStep>('identify')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [canResendAt, setCanResendAt] = useState<Date | null>(null)
  const [rememberDevice, setRememberDevice] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  
  const [formState, setFormState] = useState<LoginState>({
    identifier: '',
    method: 'otp_phone',
    availableMethods: [],
    hasPassword: false,
    otpId: '',
    maskedIdentifier: '',
  })
  const [password, setPassword] = useState('')
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', ''])

  // Handle URL error params
  useEffect(() => {
    if (errorParam) {
      const errorMessages: Record<string, string> = {
        'missing_token': 'Invalid login link. Please try again.',
        'invalid_or_expired': 'This login link has expired. Please request a new one.',
        'verification_failed': 'Verification failed. Please try again.',
        'session_expired': 'Your session has expired. Please login again.',
      }
      setError(errorMessages[errorParam] || 'An error occurred')
    }
  }, [errorParam])

  const updateState = (updates: Partial<LoginState>) => {
    setFormState((prev) => ({ ...prev, ...updates }))
  }

  // Detect input type
  const detectInputType = (value: string): 'phone' | 'email' | 'unknown' => {
    if (value.includes('@') && value.includes('.')) return 'email'
    const digitsOnly = value.replace(/[\s\-\+\(\)]/g, '')
    if (/^\d{10,15}$/.test(digitsOnly) || /^0[789]\d{9}$/.test(digitsOnly)) return 'phone'
    return 'unknown'
  }

  const inputType = detectInputType(formState.identifier)

  // ============================================================================
  // API CALLS
  // ============================================================================

  const handleIdentify = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'identify',
          identifier: formState.identifier,
        }),
      })

      const data = await response.json()

      if (data.success) {
        updateState({
          method: data.method,
          availableMethods: data.availableMethods,
          hasPassword: data.hasPassword,
          maskedIdentifier: data.maskedIdentifier,
        })
        
        // If user has password and email, show password step by default
        if (data.hasPassword && data.method === 'password') {
          setStep('password')
        } else {
          // Start OTP flow
          await handleSendOtp()
        }
      } else {
        if (data.errorCode === 'USER_NOT_FOUND') {
          setError('No account found. Would you like to sign up?')
        } else {
          setError(data.error || 'Failed to identify user')
        }
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSendOtp = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login-otp',
          identifier: formState.identifier,
          rememberDevice,
        }),
      })

      const data = await response.json()

      if (data.success) {
        updateState({
          otpId: data.otpId,
          maskedIdentifier: data.maskedRecipient,
        })
        setCanResendAt(data.canResendAt ? new Date(data.canResendAt) : null)
        setStep('otp')
      } else {
        setError(data.error || 'Failed to send OTP')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (code: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login-otp-verify',
          otpId: formState.otpId,
          code,
          identifier: formState.identifier,
          rememberDevice,
        }),
      })

      const data = await response.json()

      if (data.success) {
        router.push(returnTo)
      } else {
        setError(data.error || 'Invalid code')
        setOtpCode(['', '', '', '', '', ''])
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordLogin = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login-password',
          identifier: formState.identifier,
          password,
          rememberDevice,
        }),
      })

      const data = await response.json()

      if (data.success) {
        // Compute role-based redirect
        const redirectUrl = computeRedirectUrl(data, returnTo)
        router.push(redirectUrl)
      } else {
        setError(data.error || 'Invalid credentials')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Helper to compute the correct redirect URL based on user role
  const computeRedirectUrl = (loginResponse: {
    globalRole?: string
    isPartner?: boolean
    tenantId?: string
    tenantSlug?: string
  }, defaultReturn: string): string => {
    // If an explicit return URL was provided (not default), use it
    if (defaultReturn !== '/dashboard') {
      return defaultReturn
    }
    
    // Super Admin goes to /admin
    if (loginResponse.globalRole === 'SUPER_ADMIN') {
      return '/admin'
    }
    
    // Partner users go to /dashboard/partner
    if (loginResponse.isPartner) {
      return '/dashboard/partner'
    }
    
    // Tenant users go to /dashboard with tenant slug
    if (loginResponse.tenantSlug) {
      return `/dashboard?tenant=${loginResponse.tenantSlug}`
    }
    
    // Default fallback
    return defaultReturn
  }

  const handleResendOtp = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'otp-resend',
          otpId: formState.otpId,
        }),
      })

      const data = await response.json()

      if (data.success) {
        updateState({ otpId: data.otpId })
        setCanResendAt(data.canResendAt ? new Date(data.canResendAt) : null)
        setOtpCode(['', '', '', '', '', ''])
      } else {
        setError(data.error || 'Failed to resend code')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ============================================================================
  // OTP INPUT HANDLING
  // ============================================================================

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    
    const newCode = [...otpCode]
    newCode[index] = value.slice(-1)
    setOtpCode(newCode)
    
    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`)
      nextInput?.focus()
    }
    
    // Auto-submit when complete
    const fullCode = newCode.join('')
    if (fullCode.length === 6) {
      handleVerifyOtp(fullCode)
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`)
      prevInput?.focus()
    }
  }

  // Countdown for resend
  const [countdown, setCountdown] = useState(0)
  useEffect(() => {
    if (canResendAt) {
      const updateCountdown = () => {
        const remaining = Math.max(0, Math.ceil((canResendAt.getTime() - Date.now()) / 1000))
        setCountdown(remaining)
      }
      updateCountdown()
      const interval = setInterval(updateCountdown, 1000)
      return () => clearInterval(interval)
    }
  }, [canResendAt])

  // ============================================================================
  // RENDER: IDENTIFY STEP
  // ============================================================================

  const renderIdentifyStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome back</h1>
        <p className="text-gray-600">Enter your phone number or email to login</p>
      </div>

      {/* Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Phone or Email
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            {inputType === 'phone' ? (
              <Phone className="w-5 h-5 text-gray-400" />
            ) : (
              <Mail className="w-5 h-5 text-gray-400" />
            )}
          </div>
          <input
            type="text"
            value={formState.identifier}
            onChange={(e) => updateState({ identifier: e.target.value })}
            placeholder="08012345678 or you@example.com"
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg"
            data-testid="login-identifier-input"
            autoFocus
          />
        </div>
      </div>

      {/* Remember device */}
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={rememberDevice}
          onChange={(e) => setRememberDevice(e.target.checked)}
          className="w-5 h-5 text-green-600 rounded border-gray-300 focus:ring-green-500"
        />
        <span className="text-sm text-gray-600">Remember this device</span>
      </label>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-red-700">{error}</p>
            {error.includes('sign up') && (
              <Link href="/signup-v2" className="text-sm text-green-600 font-medium hover:underline">
                Sign up now →
              </Link>
            )}
          </div>
        </div>
      )}

      <button
        onClick={handleIdentify}
        disabled={loading || !formState.identifier}
        className="w-full py-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
        data-testid="login-continue-btn"
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

      <div className="text-center">
        <p className="text-sm text-gray-600">
          Don't have an account?{' '}
          <Link href="/signup-v2" className="text-green-600 font-medium hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )

  // ============================================================================
  // RENDER: OTP STEP
  // ============================================================================

  const renderOtpStep = () => (
    <div className="space-y-6">
      <button onClick={() => setStep('identify')} className="flex items-center text-gray-600 hover:text-gray-900">
        <ArrowLeft className="w-5 h-5 mr-1" />
        Back
      </button>

      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Enter verification code</h1>
        <p className="text-gray-600">
          We sent a code to<br />
          <span className="font-medium text-gray-900">{formState.maskedIdentifier}</span>
        </p>
      </div>

      {/* OTP Input */}
      <div className="flex justify-center gap-2">
        {otpCode.map((digit, index) => (
          <input
            key={index}
            id={`otp-${index}`}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleOtpChange(index, e.target.value)}
            onKeyDown={(e) => handleOtpKeyDown(index, e)}
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
        {countdown === 0 ? (
          <button
            onClick={handleResendOtp}
            disabled={loading}
            className="text-green-600 font-medium hover:underline flex items-center justify-center gap-1 mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            Resend Code
          </button>
        ) : (
          <p className="text-sm text-gray-500">Resend in {countdown}s</p>
        )}
      </div>

      {/* Switch to password if available */}
      {formState.hasPassword && (
        <div className="pt-4 border-t border-gray-200">
          <button
            onClick={() => setStep('password')}
            className="w-full py-3 text-gray-600 hover:text-gray-900 text-sm flex items-center justify-center gap-2"
          >
            <Key className="w-4 h-4" />
            Login with password instead
          </button>
        </div>
      )}
    </div>
  )

  // ============================================================================
  // RENDER: PASSWORD STEP
  // ============================================================================

  const renderPasswordStep = () => (
    <div className="space-y-6">
      <button onClick={() => setStep('identify')} className="flex items-center text-gray-600 hover:text-gray-900">
        <ArrowLeft className="w-5 h-5 mr-1" />
        Back
      </button>

      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Enter your password</h1>
        <p className="text-gray-600">
          Logging in as <span className="font-medium text-gray-900">{formState.maskedIdentifier}</span>
        </p>
      </div>

      {/* Password Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Password
        </label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg"
            data-testid="login-password-input"
            autoFocus
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-4 flex items-center"
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5 text-gray-400" />
            ) : (
              <Eye className="w-5 h-5 text-gray-400" />
            )}
          </button>
        </div>
        <div className="mt-2 text-right">
          <Link href="/reset-password" className="text-sm text-green-600 hover:underline">
            Forgot password?
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <button
        onClick={handlePasswordLogin}
        disabled={loading || !password}
        className="w-full py-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
        data-testid="login-password-btn"
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            Login
            <ArrowRight className="w-5 h-5" />
          </>
        )}
      </button>

      {/* Switch to OTP */}
      <div className="pt-4 border-t border-gray-200">
        <button
          onClick={handleSendOtp}
          className="w-full py-3 text-gray-600 hover:text-gray-900 text-sm flex items-center justify-center gap-2"
        >
          <Smartphone className="w-4 h-4" />
          Login with OTP instead
        </button>
      </div>
    </div>
  )

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-green-500 to-green-600 mb-3">
            <Building2 className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">WebWaka</h2>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
          {step === 'identify' && renderIdentifyStep()}
          {step === 'otp' && renderOtpStep()}
          {step === 'password' && renderPasswordStep()}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500 mt-6">
          Protected by WebWaka Security
        </p>
      </div>
      
      {/* Debug OTP Viewer for external reviewers */}
      <DebugOtpViewer identifier={formState.identifier || undefined} />
    </div>
  )
}

export default function LoginV2Page() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-green-500" />
      </div>
    }>
      <LoginV2Content />
    </Suspense>
  )
}
