/**
 * Voice Search Button Component (Wave G4)
 * 
 * Manual-trigger voice search for POS product lookup.
 * 
 * Constraints:
 * - Manual trigger only (no always-on listening)
 * - Product lookup only (no commands)
 * - Offline-safe with graceful fallback
 * - No auto-add-to-cart
 * 
 * @module components/pos/VoiceSearchButton
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  isSpeechRecognitionSupported,
  getSpeechRecognition,
  DEFAULT_SPEECH_CONFIG,
  type ProductMatch
} from '@/lib/pos/voice-search-service'

type SpeechRecognitionInstance = ReturnType<typeof getSpeechRecognition>

interface VoiceSearchButtonProps {
  tenantId: string
  onResults: (products: ProductMatch[], query: string) => void
  onError?: (error: string) => void
  disabled?: boolean
  className?: string
}

type VoiceSearchState = 'idle' | 'listening' | 'processing' | 'error' | 'offline'

export function VoiceSearchButton({
  tenantId,
  onResults,
  onError,
  disabled = false,
  className = ''
}: VoiceSearchButtonProps) {
  const [state, setState] = useState<VoiceSearchState>('idle')
  const [transcript, setTranscript] = useState('')
  const [isOnline, setIsOnline] = useState(true)
  const [isSupported, setIsSupported] = useState(false)
  const recognitionRef = useRef<SpeechRecognitionInstance>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  useEffect(() => {
    setIsSupported(isSpeechRecognitionSupported())
    setIsOnline(navigator.onLine)
    
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => {
      setIsOnline(false)
      setState('offline')
    }
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      
      if (recognitionRef.current) {
        recognitionRef.current.abort()
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])
  
  const searchProducts = useCallback(async (query: string) => {
    if (!query.trim()) {
      setState('idle')
      return
    }
    
    setState('processing')
    
    try {
      const response = await fetch('/api/pos/voice-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, query })
      })
      
      if (!response.ok) {
        throw new Error('Search failed')
      }
      
      const data = await response.json()
      
      if (data.success) {
        onResults(data.products, query)
        setState('idle')
      } else {
        throw new Error(data.error || 'Unknown error')
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Search failed'
      setState('error')
      onError?.(message)
      
      timeoutRef.current = setTimeout(() => setState('idle'), 3000)
    }
  }, [tenantId, onResults, onError])
  
  const startListening = useCallback(() => {
    if (!isOnline) {
      setState('offline')
      onError?.('Voice search is unavailable offline. Please use text search.')
      return
    }
    
    if (!isSupported) {
      onError?.('Voice search is not supported in this browser')
      return
    }
    
    const recognition = getSpeechRecognition()
    if (!recognition) {
      onError?.('Failed to initialize voice recognition')
      return
    }
    
    recognitionRef.current = recognition
    
    recognition.lang = DEFAULT_SPEECH_CONFIG.language
    recognition.continuous = DEFAULT_SPEECH_CONFIG.continuous
    recognition.interimResults = DEFAULT_SPEECH_CONFIG.interimResults
    recognition.maxAlternatives = DEFAULT_SPEECH_CONFIG.maxAlternatives
    
    recognition.onstart = () => {
      setState('listening')
      setTranscript('')
    }
    
    recognition.onresult = (event) => {
      let finalTranscript = ''
      let interimTranscript = ''
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          finalTranscript += result[0].transcript
        } else {
          interimTranscript += result[0].transcript
        }
      }
      
      setTranscript(finalTranscript || interimTranscript)
      
      if (finalTranscript) {
        searchProducts(finalTranscript)
      }
    }
    
    recognition.onerror = (event) => {
      console.error('[VoiceSearch] Recognition error:', event.error)
      
      let message = 'Voice recognition failed'
      switch (event.error) {
        case 'no-speech':
          message = 'No speech detected. Please try again.'
          break
        case 'audio-capture':
          message = 'Microphone not available'
          break
        case 'not-allowed':
          message = 'Microphone permission denied'
          break
        case 'network':
          message = 'Network error. Please check your connection.'
          break
      }
      
      setState('error')
      onError?.(message)
      
      timeoutRef.current = setTimeout(() => setState('idle'), 3000)
    }
    
    recognition.onend = () => {
      if (state === 'listening' && !transcript) {
        setState('idle')
      }
    }
    
    try {
      recognition.start()
    } catch (error) {
      console.error('[VoiceSearch] Failed to start:', error)
      onError?.('Failed to start voice recognition')
      setState('error')
    }
  }, [isOnline, isSupported, searchProducts, onError, state, transcript])
  
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
  }, [])
  
  const handleClick = useCallback(() => {
    if (state === 'listening') {
      stopListening()
    } else if (state === 'idle') {
      startListening()
    }
  }, [state, startListening, stopListening])
  
  const getButtonStyles = () => {
    const base = 'relative flex items-center justify-center rounded-full p-4 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2'
    
    switch (state) {
      case 'listening':
        return `${base} bg-red-500 text-white animate-pulse focus:ring-red-500`
      case 'processing':
        return `${base} bg-amber-500 text-white cursor-wait focus:ring-amber-500`
      case 'error':
        return `${base} bg-red-100 text-red-600 focus:ring-red-500`
      case 'offline':
        return `${base} bg-gray-200 text-gray-400 cursor-not-allowed`
      default:
        return `${base} bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-500`
    }
  }
  
  const getIcon = () => {
    switch (state) {
      case 'listening':
        return (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <rect x="6" y="6" width="8" height="8" rx="1" />
          </svg>
        )
      case 'processing':
        return (
          <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        )
      case 'error':
        return (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        )
      case 'offline':
        return (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
            <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
          </svg>
        )
      default:
        return (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
          </svg>
        )
    }
  }
  
  const getStatusText = () => {
    switch (state) {
      case 'listening':
        return transcript || 'Listening...'
      case 'processing':
        return 'Searching...'
      case 'error':
        return 'Try again'
      case 'offline':
        return 'Offline'
      default:
        return 'Tap to speak'
    }
  }
  
  if (!isSupported) {
    return null
  }
  
  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <button
        onClick={handleClick}
        disabled={disabled || state === 'processing' || state === 'offline'}
        className={getButtonStyles()}
        aria-label={state === 'listening' ? 'Stop listening' : 'Start voice search'}
      >
        {getIcon()}
        
        {state === 'listening' && (
          <span className="absolute -inset-1 rounded-full border-2 border-red-400 animate-ping" />
        )}
      </button>
      
      <span className="text-sm text-gray-600 text-center max-w-[150px] truncate">
        {getStatusText()}
      </span>
    </div>
  )
}

export function VoiceSearchResults({
  products,
  query,
  onSelect,
  isDemo = false
}: {
  products: ProductMatch[]
  query: string
  onSelect: (product: ProductMatch) => void
  isDemo?: boolean
}) {
  if (products.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        No products found for "{query}"
      </div>
    )
  }
  
  return (
    <div className="divide-y divide-gray-100">
      {isDemo && (
        <div className="px-4 py-2 bg-amber-50 text-amber-700 text-xs">
          Demo mode - sample results
        </div>
      )}
      
      {products.map((product) => (
        <button
          key={product.id}
          onClick={() => onSelect(product)}
          className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors text-left"
        >
          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 truncate">{product.name}</p>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-green-600 font-semibold">
                ₦{product.price.toLocaleString()}
              </span>
              {product.sku && (
                <span className="text-gray-400">SKU: {product.sku}</span>
              )}
            </div>
            <span className="text-xs text-gray-400">{product.matchReason}</span>
          </div>
          
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </button>
      ))}
    </div>
  )
}
