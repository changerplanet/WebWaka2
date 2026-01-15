/**
 * Voice Search Hook (Wave G4)
 * 
 * React hook for managing voice search state and results.
 * 
 * Constraints:
 * - Manual trigger only
 * - Product lookup only
 * - Offline-safe
 * 
 * @module hooks/useVoiceSearch
 */

'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import {
  isSpeechRecognitionSupported,
  getSpeechRecognition,
  DEFAULT_SPEECH_CONFIG,
  type ProductMatch,
  type VoiceSearchResult
} from '@/lib/pos/voice-search-service'

type SpeechRecognitionInstance = ReturnType<typeof getSpeechRecognition>

interface UseVoiceSearchOptions {
  tenantId: string
  onResults?: (result: VoiceSearchResult) => void
  onError?: (error: string) => void
}

interface UseVoiceSearchReturn {
  isListening: boolean
  isProcessing: boolean
  isOnline: boolean
  isSupported: boolean
  transcript: string
  results: ProductMatch[]
  lastQuery: string
  error: string | null
  isDemo: boolean
  startListening: () => void
  stopListening: () => void
  clearResults: () => void
  searchByText: (query: string) => Promise<void>
}

export function useVoiceSearch({
  tenantId,
  onResults,
  onError
}: UseVoiceSearchOptions): UseVoiceSearchReturn {
  const [isListening, setIsListening] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [isSupported, setIsSupported] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [results, setResults] = useState<ProductMatch[]>([])
  const [lastQuery, setLastQuery] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isDemo, setIsDemo] = useState(false)
  
  const recognitionRef = useRef<SpeechRecognitionInstance>(null)
  
  useEffect(() => {
    setIsSupported(isSpeechRecognitionSupported())
    setIsOnline(navigator.onLine)
    
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      
      if (recognitionRef.current) {
        recognitionRef.current.abort()
      }
    }
  }, [])
  
  const searchProducts = useCallback(async (query: string) => {
    if (!query.trim()) return
    
    setIsProcessing(true)
    setError(null)
    setLastQuery(query)
    
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
        setResults(data.products)
        setIsDemo(data.isDemo || false)
        onResults?.(data)
      } else {
        throw new Error(data.error || 'Unknown error')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Search failed'
      setError(message)
      onError?.(message)
    } finally {
      setIsProcessing(false)
    }
  }, [tenantId, onResults, onError])
  
  const startListening = useCallback(() => {
    if (!isOnline) {
      setError('Voice search is unavailable offline. Please use text search.')
      onError?.('Voice search is unavailable offline')
      return
    }
    
    if (!isSupported) {
      setError('Voice search is not supported in this browser')
      onError?.('Voice search not supported')
      return
    }
    
    const recognition = getSpeechRecognition()
    if (!recognition) {
      setError('Failed to initialize voice recognition')
      return
    }
    
    recognitionRef.current = recognition
    
    recognition.lang = DEFAULT_SPEECH_CONFIG.language
    recognition.continuous = DEFAULT_SPEECH_CONFIG.continuous
    recognition.interimResults = DEFAULT_SPEECH_CONFIG.interimResults
    recognition.maxAlternatives = DEFAULT_SPEECH_CONFIG.maxAlternatives
    
    recognition.onstart = () => {
      setIsListening(true)
      setTranscript('')
      setError(null)
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
        setIsListening(false)
        searchProducts(finalTranscript)
      }
    }
    
    recognition.onerror = (event) => {
      console.error('[useVoiceSearch] Recognition error:', event.error)
      setIsListening(false)
      
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
      
      setError(message)
      onError?.(message)
    }
    
    recognition.onend = () => {
      setIsListening(false)
    }
    
    try {
      recognition.start()
    } catch (err) {
      console.error('[useVoiceSearch] Failed to start:', err)
      setError('Failed to start voice recognition')
    }
  }, [isOnline, isSupported, searchProducts, onError])
  
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    setIsListening(false)
  }, [])
  
  const clearResults = useCallback(() => {
    setResults([])
    setLastQuery('')
    setTranscript('')
    setError(null)
  }, [])
  
  const searchByText = useCallback(async (query: string) => {
    await searchProducts(query)
  }, [searchProducts])
  
  return {
    isListening,
    isProcessing,
    isOnline,
    isSupported,
    transcript,
    results,
    lastQuery,
    error,
    isDemo,
    startListening,
    stopListening,
    clearResults,
    searchByText
  }
}
