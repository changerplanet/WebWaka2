/**
 * POS Voice Search Service (Wave G4)
 * 
 * Voice-to-product lookup for POS sales counter use case.
 * Supports Nigerian accent tolerance with phonetic matching.
 * 
 * Constraints:
 * - Manual trigger only (no always-on listening)
 * - Product lookup only (no commands like "sell", "checkout")
 * - No auto-add-to-cart
 * - No payments via voice
 * - No data sent without user action
 * - Offline-safe with graceful fallback
 * 
 * @module lib/pos/voice-search-service
 */

import { prisma } from '../prisma'

// ============================================================================
// TYPES
// ============================================================================

export interface VoiceSearchResult {
  query: string
  products: ProductMatch[]
  matchType: 'exact' | 'phonetic' | 'fuzzy' | 'none'
  confidence: number
  processingTimeMs: number
  isDemo: boolean
}

export interface ProductMatch {
  id: string
  name: string
  sku: string | null
  price: number
  imageUrl: string | null
  matchScore: number
  matchReason: string
}

export interface VoiceSearchConfig {
  maxResults: number
  minConfidence: number
  enablePhonetic: boolean
  enableFuzzy: boolean
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_CONFIG: VoiceSearchConfig = {
  maxResults: 5,
  minConfidence: 0.3,
  enablePhonetic: true,
  enableFuzzy: true
}

const DEMO_TENANT_ID = 'demo-tenant-001'

const NIGERIAN_PHONETIC_MAPPINGS: Record<string, string[]> = {
  'coca cola': ['coke', 'cocacola', 'coca-cola', 'koka kola'],
  'fanta': ['fantha', 'fana'],
  'sprite': ['sprait', 'sprit'],
  'pepsi': ['pepsy', 'pepsie'],
  'indomie': ['indomee', 'indo mie', 'noodles'],
  'milo': ['mylo', 'mailo'],
  'peak milk': ['peak', 'pik milk', 'peak'],
  'dano milk': ['dano', 'danno'],
  'golden morn': ['goldenmorn', 'golden morning'],
  'cabin biscuit': ['cabbin', 'kabin biscuit'],
  'gala': ['galla', 'beef roll'],
  'lacasera': ['la casera', 'laka sera'],
  'maltina': ['malteena', 'malta'],
  'star lager': ['star beer', 'star'],
  'gulder': ['gulda', 'golder'],
  'trophy': ['throphy', 'tropy'],
  'heineken': ['heniken', 'haineken'],
  'close up': ['closeup', 'close-up'],
  'oral b': ['oral-b', 'oralb'],
  'dettol': ['detol', 'dettoll'],
  'panadol': ['panadoll', 'panado'],
  'butter': ['butta', 'bota'],
  'sugar': ['shuga', 'suga'],
  'rice': ['ryce', 'rise'],
  'beans': ['beanz', 'binz'],
  'garri': ['gari', 'garii'],
  'palm oil': ['palmoil', 'red oil'],
  'groundnut': ['groundnut oil', 'peanut'],
  'tomato': ['tomatto', 'tumato'],
  'onion': ['onyon', 'oniyon'],
  'pepper': ['pepa', 'peppa']
}

const COMMON_TYPOS: Record<string, string> = {
  'teh': 'the',
  'adn': 'and',
  'wiht': 'with',
  'taht': 'that'
}

// ============================================================================
// PHONETIC MATCHING
// ============================================================================

function soundex(word: string): string {
  const normalized = word.toLowerCase().replace(/[^a-z]/g, '')
  if (!normalized) return ''
  
  const firstLetter = normalized[0].toUpperCase()
  
  const codes: Record<string, string> = {
    'b': '1', 'f': '1', 'p': '1', 'v': '1',
    'c': '2', 'g': '2', 'j': '2', 'k': '2', 'q': '2', 's': '2', 'x': '2', 'z': '2',
    'd': '3', 't': '3',
    'l': '4',
    'm': '5', 'n': '5',
    'r': '6'
  }
  
  let coded = firstLetter
  let lastCode = codes[normalized[0]] || ''
  
  for (let i = 1; i < normalized.length && coded.length < 4; i++) {
    const char = normalized[i]
    const code = codes[char]
    
    if (code && code !== lastCode) {
      coded += code
      lastCode = code
    } else if (!code) {
      lastCode = ''
    }
  }
  
  return coded.padEnd(4, '0')
}

function metaphone(word: string): string {
  let str = word.toLowerCase().replace(/[^a-z]/g, '')
  if (!str) return ''
  
  if (str.startsWith('kn') || str.startsWith('gn') || str.startsWith('pn') || str.startsWith('wr')) {
    str = str.slice(1)
  }
  
  str = str
    .replace(/ck/g, 'k')
    .replace(/ph/g, 'f')
    .replace(/sh/g, 'x')
    .replace(/th/g, '0')
    .replace(/wh/g, 'w')
    .replace(/[aeiou]/g, '')
    .replace(/(.)\1+/g, '$1')
  
  return str.toUpperCase().slice(0, 6)
}

function phoneticMatch(query: string, target: string): number {
  const queryWords = query.toLowerCase().split(/\s+/)
  const targetWords = target.toLowerCase().split(/\s+/)
  
  let totalScore = 0
  let matchedWords = 0
  
  for (const qWord of queryWords) {
    const qSoundex = soundex(qWord)
    const qMetaphone = metaphone(qWord)
    
    for (const tWord of targetWords) {
      const tSoundex = soundex(tWord)
      const tMetaphone = metaphone(tWord)
      
      if (qSoundex === tSoundex && qSoundex !== '0000') {
        totalScore += 0.8
        matchedWords++
        break
      } else if (qMetaphone === tMetaphone && qMetaphone !== '') {
        totalScore += 0.7
        matchedWords++
        break
      }
    }
  }
  
  return queryWords.length > 0 ? totalScore / queryWords.length : 0
}

function nigerianPhoneticMatch(query: string): string | null {
  const normalizedQuery = query.toLowerCase().trim()
  
  for (const [canonical, variants] of Object.entries(NIGERIAN_PHONETIC_MAPPINGS)) {
    if (canonical === normalizedQuery) {
      return canonical
    }
    for (const variant of variants) {
      if (variant === normalizedQuery || normalizedQuery.includes(variant)) {
        return canonical
      }
    }
  }
  
  return null
}

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = []
  
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i]
  }
  
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j
  }
  
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b[i - 1] === a[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }
  
  return matrix[b.length][a.length]
}

function fuzzyMatch(query: string, target: string): number {
  const q = query.toLowerCase()
  const t = target.toLowerCase()
  
  if (t.includes(q)) {
    return 0.9
  }
  
  const distance = levenshteinDistance(q, t)
  const maxLen = Math.max(q.length, t.length)
  
  if (maxLen === 0) return 0
  
  const similarity = 1 - (distance / maxLen)
  return Math.max(0, similarity)
}

// ============================================================================
// CORE SEARCH FUNCTIONS
// ============================================================================

export async function searchProductsByVoice(
  tenantId: string,
  query: string,
  config: Partial<VoiceSearchConfig> = {}
): Promise<VoiceSearchResult> {
  const startTime = Date.now()
  const mergedConfig = { ...DEFAULT_CONFIG, ...config }
  const isDemo = tenantId === DEMO_TENANT_ID
  
  const cleanedQuery = cleanQuery(query)
  
  if (!cleanedQuery || cleanedQuery.length < 2) {
    return {
      query,
      products: [],
      matchType: 'none',
      confidence: 0,
      processingTimeMs: Date.now() - startTime,
      isDemo
    }
  }
  
  const nigerianMatch = nigerianPhoneticMatch(cleanedQuery)
  const searchTerms = nigerianMatch ? [cleanedQuery, nigerianMatch] : [cleanedQuery]
  
  const products = await prisma.product.findMany({
    where: {
      tenantId,
      status: 'ACTIVE',
      OR: searchTerms.flatMap(term => [
        { name: { contains: term, mode: 'insensitive' } },
        { sku: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } }
      ])
    },
    select: {
      id: true,
      name: true,
      sku: true,
      price: true,
      images: true
    },
    take: mergedConfig.maxResults * 2
  })
  
  const scoredProducts: ProductMatch[] = []
  
  for (const product of products) {
    const nameMatch = fuzzyMatch(cleanedQuery, product.name)
    const skuMatch = product.sku ? fuzzyMatch(cleanedQuery, product.sku) : 0
    const phoneticScore = mergedConfig.enablePhonetic 
      ? phoneticMatch(cleanedQuery, product.name) 
      : 0
    
    const bestScore = Math.max(nameMatch, skuMatch, phoneticScore)
    
    if (bestScore >= mergedConfig.minConfidence) {
      let matchReason = 'Text match'
      if (phoneticScore === bestScore && phoneticScore > 0) {
        matchReason = 'Sounds like'
      } else if (skuMatch === bestScore && skuMatch > 0) {
        matchReason = 'SKU match'
      }
      
      const images = product.images as string[] | null
      
      scoredProducts.push({
        id: product.id,
        name: product.name,
        sku: product.sku,
        price: Number(product.price),
        imageUrl: images?.[0] || null,
        matchScore: bestScore,
        matchReason
      })
    }
  }
  
  scoredProducts.sort((a, b) => b.matchScore - a.matchScore)
  const topProducts = scoredProducts.slice(0, mergedConfig.maxResults)
  
  let matchType: VoiceSearchResult['matchType'] = 'none'
  let confidence = 0
  
  if (topProducts.length > 0) {
    const topScore = topProducts[0].matchScore
    confidence = topScore
    
    if (topScore >= 0.9) {
      matchType = 'exact'
    } else if (topScore >= 0.6) {
      matchType = 'phonetic'
    } else {
      matchType = 'fuzzy'
    }
  }
  
  return {
    query,
    products: topProducts,
    matchType,
    confidence,
    processingTimeMs: Date.now() - startTime,
    isDemo
  }
}

function cleanQuery(query: string): string {
  let cleaned = query.toLowerCase().trim()
  
  for (const [typo, correct] of Object.entries(COMMON_TYPOS)) {
    cleaned = cleaned.replace(new RegExp(`\\b${typo}\\b`, 'g'), correct)
  }
  
  cleaned = cleaned.replace(/[^\w\s-]/g, ' ')
  cleaned = cleaned.replace(/\s+/g, ' ').trim()
  
  return cleaned
}

// ============================================================================
// DEMO DATA
// ============================================================================

export function generateDemoVoiceSearchResult(query: string): VoiceSearchResult {
  const demoProducts: ProductMatch[] = [
    {
      id: 'demo-prod-001',
      name: 'Coca Cola 50cl',
      sku: 'CC-50CL',
      price: 250,
      imageUrl: null,
      matchScore: 0.95,
      matchReason: 'Text match'
    },
    {
      id: 'demo-prod-002',
      name: 'Coca Cola 1L',
      sku: 'CC-1L',
      price: 450,
      imageUrl: null,
      matchScore: 0.85,
      matchReason: 'Sounds like'
    }
  ]
  
  return {
    query,
    products: query.length >= 2 ? demoProducts : [],
    matchType: query.length >= 2 ? 'exact' : 'none',
    confidence: query.length >= 2 ? 0.95 : 0,
    processingTimeMs: 45,
    isDemo: true
  }
}

// ============================================================================
// SPEECH RECOGNITION UTILITIES
// ============================================================================

export interface SpeechRecognitionConfig {
  language: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
}

export const DEFAULT_SPEECH_CONFIG: SpeechRecognitionConfig = {
  language: 'en-NG',
  continuous: false,
  interimResults: true,
  maxAlternatives: 3
}

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false
  return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
}

interface SpeechRecognitionInstance {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  onstart: (() => void) | null
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

interface SpeechRecognitionEvent {
  resultIndex: number
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionResultList {
  length: number
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
  isFinal: boolean
  length: number
  [index: number]: SpeechRecognitionAlternative
}

interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

interface SpeechRecognitionErrorEvent {
  error: string
  message?: string
}

export function getSpeechRecognition(): SpeechRecognitionInstance | null {
  if (typeof window === 'undefined') return null
  
  const win = window as unknown as { 
    SpeechRecognition?: new () => SpeechRecognitionInstance
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance
  }
  
  const SpeechRecognitionAPI = win.SpeechRecognition || win.webkitSpeechRecognition
  
  if (!SpeechRecognitionAPI) return null
  
  return new SpeechRecognitionAPI()
}
