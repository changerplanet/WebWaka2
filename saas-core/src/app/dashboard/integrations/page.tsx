'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Plug,
  CreditCard,
  Truck,
  MessageSquare,
  Building2,
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Plus,
  Settings,
  ExternalLink,
  RefreshCw,
  Key,
  Webhook,
  Activity,
  ChevronRight,
  Search,
  Filter,
  Globe,
  Zap,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Copy,
  Trash2,
  Play,
  Send,
  Terminal,
  Code,
  Heart,
  HeartPulse,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Timer,
  AlertTriangle,
  CheckCircle2,
  Radio,
  History,
  FileJson,
  ArrowRight,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'

interface Provider {
  id: string
  key: string
  name: string
  category: string
  description: string
  logoUrl?: string
  websiteUrl?: string
  documentationUrl?: string
  isNigeriaFirst: boolean
  supportedScopes: string[]
  requiredCredentials: string[]
  supportsWebhooks: boolean
  status: string
}

interface Instance {
  id: string
  tenantId: string
  displayName: string
  environment: string
  status: string
  enabledScopes: string[]
  healthStatus?: string
  lastHealthCheck?: string
  errorCount?: number
  lastError?: string
  activatedAt?: string
  provider: {
    key: string
    name: string
    category: string
    logoUrl?: string
    isNigeriaFirst: boolean
  }
  credentials: Array<{
    key: string
    maskedValue: string
  }>
  webhooks: Array<{
    id: string
    name: string
    direction: string
    status: string
    url: string
    totalCalls: number
    successCount: number
    failureCount: number
    lastCalledAt?: string
  }>
}

interface Statistics {
  period: string
  totalCalls: number
  successfulCalls: number
  failedCalls: number
  successRate: number
  webhooksReceived: number
  webhooksSent: number
  averageDurationMs: number
  topErrors: Array<{ code: string; count: number }>
}

interface WebhookLog {
  id: string
  logType: string
  direction: string
  method: string
  url: string
  requestBody: any
  responseStatus: number
  responseBody: any
  success: boolean
  durationMs: number
  createdAt: string
}

interface SecurityAnomaly {
  type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  details: any
}

const CATEGORY_ICONS: Record<string, any> = {
  PAYMENT_GATEWAY: CreditCard,
  BANKING: Building2,
  LOGISTICS: Truck,
  SMS_GATEWAY: MessageSquare,
  WHATSAPP: MessageSquare,
  EMAIL: MessageSquare,
  CUSTOM: Plug,
}

const CATEGORY_COLORS: Record<string, string> = {
  PAYMENT_GATEWAY: 'from-green-500 to-emerald-600',
  BANKING: 'from-blue-500 to-indigo-600',
  LOGISTICS: 'from-orange-500 to-amber-600',
  SMS_GATEWAY: 'from-purple-500 to-violet-600',
  WHATSAPP: 'from-green-400 to-teal-500',
  EMAIL: 'from-pink-500 to-rose-600',
  CUSTOM: 'from-gray-500 to-slate-600',
}

// Sample webhook payloads for testing
const SAMPLE_PAYLOADS: Record<string, any> = {
  paystack: {
    'charge.success': {
      event: 'charge.success',
      data: {
        id: 123456789,
        domain: 'test',
        status: 'success',
        reference: 'test_ref_' + Date.now(),
        amount: 50000,
        currency: 'NGN',
        channel: 'card',
        customer: {
          email: 'customer@example.com',
          customer_code: 'CUS_test123',
        },
      },
    },
    'transfer.success': {
      event: 'transfer.success',
      data: {
        id: 987654321,
        amount: 25000,
        currency: 'NGN',
        status: 'success',
        reference: 'transfer_ref_' + Date.now(),
        recipient: {
          name: 'John Doe',
          account_number: '0123456789',
          bank_name: 'Test Bank',
        },
      },
    },
  },
  flutterwave: {
    'charge.completed': {
      event: 'charge.completed',
      'event.type': 'CARD_TRANSACTION',
      data: {
        id: 123456,
        tx_ref: 'flw_ref_' + Date.now(),
        flw_ref: 'FLW' + Date.now(),
        amount: 10000,
        currency: 'NGN',
        status: 'successful',
        customer: {
          email: 'user@example.com',
          name: 'Test User',
        },
      },
    },
  },
  gig_logistics: {
    'shipment.delivered': {
      event: 'shipment.delivered',
      data: {
        tracking_number: 'GIG' + Date.now(),
        status: 'delivered',
        delivered_at: new Date().toISOString(),
        recipient: 'Jane Doe',
        address: '123 Test Street, Lagos',
      },
    },
  },
}

// API Playground endpoints
const API_ENDPOINTS = [
  {
    category: 'Integrations',
    endpoints: [
      { method: 'GET', path: '/api/integrations?action=status', description: 'Get module status' },
      { method: 'GET', path: '/api/integrations?action=providers', description: 'List all providers' },
      { method: 'GET', path: '/api/integrations?action=nigeria-first-providers', description: 'List Nigeria-first providers' },
      { method: 'GET', path: '/api/integrations?action=categories', description: 'List categories' },
      { method: 'GET', path: '/api/integrations?action=statistics&period=week', description: 'Get statistics' },
    ],
  },
  {
    category: 'Instances',
    endpoints: [
      { method: 'GET', path: '/api/integrations?action=instances&tenantId=demo-tenant', description: 'List tenant integrations' },
      { method: 'POST', path: '/api/integrations', description: 'Enable integration', body: { action: 'enable-integration', tenantId: 'demo-tenant', providerKey: 'paystack', enabledScopes: ['payments:read'], activatedBy: 'user' } },
    ],
  },
  {
    category: 'Developer',
    endpoints: [
      { method: 'GET', path: '/api/integrations?action=scopes', description: 'List available scopes' },
      { method: 'GET', path: '/api/integrations?action=apps', description: 'List developer apps' },
      { method: 'POST', path: '/api/integrations', description: 'Create developer app', body: { action: 'create-app', name: 'Test App', developerName: 'John', developerEmail: 'john@example.com', allowedScopes: ['orders:read'] } },
    ],
  },
  {
    category: 'Audit',
    endpoints: [
      { method: 'GET', path: '/api/integrations?action=logs&limit=10', description: 'Get recent logs' },
      { method: 'GET', path: '/api/integrations?action=events&limit=10', description: 'Get recent events' },
      { method: 'GET', path: '/api/integrations?action=security-anomalies', description: 'Check security anomalies' },
    ],
  },
]

export default function IntegrationsDashboard() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [instances, setInstances] = useState<Instance[]>([])
  const [statistics, setStatistics] = useState<Statistics | null>(null)
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([])
  const [anomalies, setAnomalies] = useState<SecurityAnomaly[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [initialized, setInitialized] = useState(false)
  const [activeTab, setActiveTab] = useState<'available' | 'connected' | 'health' | 'webhooks' | 'playground'>('available')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [showConnectModal, setShowConnectModal] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null)
  const [connectingProvider, setConnectingProvider] = useState(false)
  const [credentials, setCredentials] = useState<Record<string, string>>({})
  const [showCredentials, setShowCredentials] = useState<Record<string, boolean>>({})

  // Webhook Testing State
  const [selectedWebhookProvider, setSelectedWebhookProvider] = useState<string>('paystack')
  const [selectedWebhookEvent, setSelectedWebhookEvent] = useState<string>('charge.success')
  const [webhookPayload, setWebhookPayload] = useState<string>('')
  const [webhookTestResult, setWebhookTestResult] = useState<any>(null)
  const [testingWebhook, setTestingWebhook] = useState(false)

  // API Playground State
  const [selectedEndpoint, setSelectedEndpoint] = useState(API_ENDPOINTS[0].endpoints[0])
  const [apiRequestBody, setApiRequestBody] = useState<string>('')
  const [apiResponse, setApiResponse] = useState<any>(null)
  const [executingApi, setExecutingApi] = useState(false)
  const [expandedCategory, setExpandedCategory] = useState<string>('Integrations')

  // Demo tenant ID
  const tenantId = 'demo-tenant-integrations'

  useEffect(() => {
    initializeAndFetch()
  }, [])

  useEffect(() => {
    // Update webhook payload when provider/event changes
    const providerPayloads = SAMPLE_PAYLOADS[selectedWebhookProvider]
    if (providerPayloads && providerPayloads[selectedWebhookEvent]) {
      setWebhookPayload(JSON.stringify(providerPayloads[selectedWebhookEvent], null, 2))
    }
  }, [selectedWebhookProvider, selectedWebhookEvent])

  useEffect(() => {
    // Update API request body when endpoint changes
    if (selectedEndpoint.body) {
      setApiRequestBody(JSON.stringify(selectedEndpoint.body, null, 2))
    } else {
      setApiRequestBody('')
    }
  }, [selectedEndpoint])

  const initializeAndFetch = async () => {
    try {
      setLoading(true)
      setError(null)

      // Check status first
      const statusRes = await fetch('/api/integrations?action=status')
      const statusData = await statusRes.json()

      if (!statusData.initialized) {
        await fetch('/api/integrations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'initialize' }),
        })
        setInitialized(true)
      } else {
        setInitialized(true)
      }

      // Fetch all data in parallel
      const [providersRes, instancesRes, statsRes, logsRes, anomaliesRes] = await Promise.all([
        fetch('/api/integrations?action=providers&limit=50').then(r => r.json()).catch(() => ({ providers: [] })),
        fetch(`/api/integrations?action=instances&tenantId=${tenantId}`).then(r => r.json()).catch(() => ({ instances: [] })),
        fetch('/api/integrations?action=statistics&period=week').then(r => r.json()).catch(() => null),
        fetch('/api/integrations?action=logs&limit=20').then(r => r.json()).catch(() => ({ logs: [] })),
        fetch('/api/integrations?action=security-anomalies').then(r => r.json()).catch(() => ({ anomalies: [] })),
      ])

      setProviders(providersRes.providers || [])
      setInstances(instancesRes.instances || [])
      setStatistics(statsRes)
      setWebhookLogs(logsRes.logs || [])
      setAnomalies(anomaliesRes.anomalies || [])
    } catch (err) {
      setError('Failed to load integrations data')
      console.error('Integrations error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleConnect = (provider: Provider) => {
    setSelectedProvider(provider)
    setCredentials({})
    setShowConnectModal(true)
  }

  const handleSubmitConnection = async () => {
    if (!selectedProvider) return

    try {
      setConnectingProvider(true)

      const enableRes = await fetch('/api/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'enable-integration',
          tenantId,
          providerKey: selectedProvider.key,
          displayName: selectedProvider.name,
          environment: 'production',
          enabledScopes: selectedProvider.supportedScopes,
          activatedBy: 'dashboard-user',
        }),
      })

      const enableData = await enableRes.json()

      if (!enableRes.ok) {
        throw new Error(enableData.error || 'Failed to enable integration')
      }

      const configRes = await fetch('/api/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'configure-credentials',
          instanceId: enableData.id,
          credentials,
          configuredBy: 'dashboard-user',
        }),
      })

      if (!configRes.ok) {
        const configData = await configRes.json()
        throw new Error(configData.error || 'Failed to configure credentials')
      }

      await initializeAndFetch()
      setShowConnectModal(false)
      setSelectedProvider(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect integration')
    } finally {
      setConnectingProvider(false)
    }
  }

  const handleDisconnect = async (instanceId: string) => {
    if (!confirm('Are you sure you want to disconnect this integration?')) return

    try {
      await fetch('/api/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'revoke-instance',
          instanceId,
          reason: 'User disconnected from dashboard',
          revokedBy: 'dashboard-user',
        }),
      })

      await initializeAndFetch()
    } catch (err) {
      setError('Failed to disconnect integration')
    }
  }

  // Webhook Testing Functions
  const handleTestWebhook = async () => {
    try {
      setTestingWebhook(true)
      setWebhookTestResult(null)

      let payload
      try {
        payload = JSON.parse(webhookPayload)
      } catch {
        setWebhookTestResult({ error: 'Invalid JSON payload' })
        return
      }

      // Simulate webhook processing
      const res = await fetch('/api/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'process-webhook',
          webhookId: 'test-webhook',
          payload,
          headers: {
            'content-type': 'application/json',
            'x-provider': selectedWebhookProvider,
          },
        }),
      })

      const data = await res.json()
      setWebhookTestResult({
        success: res.ok,
        status: res.status,
        response: data,
        timestamp: new Date().toISOString(),
      })

      // Refresh logs
      const logsRes = await fetch('/api/integrations?action=logs&limit=20').then(r => r.json())
      setWebhookLogs(logsRes.logs || [])
    } catch (err) {
      setWebhookTestResult({
        error: err instanceof Error ? err.message : 'Test failed',
      })
    } finally {
      setTestingWebhook(false)
    }
  }

  // API Playground Functions
  const handleExecuteApi = async () => {
    try {
      setExecutingApi(true)
      setApiResponse(null)

      const options: RequestInit = {
        method: selectedEndpoint.method,
        headers: { 'Content-Type': 'application/json' },
      }

      if (selectedEndpoint.method === 'POST' && apiRequestBody) {
        options.body = apiRequestBody
      }

      const startTime = Date.now()
      const res = await fetch(selectedEndpoint.path, options)
      const duration = Date.now() - startTime
      const data = await res.json()

      setApiResponse({
        status: res.status,
        statusText: res.statusText,
        duration,
        data,
        timestamp: new Date().toISOString(),
      })
    } catch (err) {
      setApiResponse({
        error: err instanceof Error ? err.message : 'Request failed',
      })
    } finally {
      setExecutingApi(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      ACTIVE: 'bg-green-100 text-green-700 border-green-200',
      PENDING_SETUP: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      SUSPENDED: 'bg-orange-100 text-orange-700 border-orange-200',
      REVOKED: 'bg-red-100 text-red-700 border-red-200',
      FAILED: 'bg-red-100 text-red-700 border-red-200',
    }
    return styles[status] || 'bg-gray-100 text-gray-700 border-gray-200'
  }

  const getHealthColor = (health: string | undefined) => {
    switch (health) {
      case 'healthy':
        return 'text-green-500'
      case 'degraded':
        return 'text-yellow-500'
      case 'unhealthy':
        return 'text-red-500'
      default:
        return 'text-slate-400'
    }
  }

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      PAYMENT_GATEWAY: 'Payment Gateway',
      BANKING: 'Banking & Verification',
      LOGISTICS: 'Logistics & Delivery',
      SMS_GATEWAY: 'SMS & Messaging',
      WHATSAPP: 'WhatsApp',
      EMAIL: 'Email',
      CUSTOM: 'Custom Integration',
    }
    return labels[category] || category
  }

  const filteredProviders = selectedCategory
    ? providers.filter(p => p.category === selectedCategory)
    : providers

  const connectedProviderKeys = instances.map(i => i.provider.key)
  const availableProviders = filteredProviders.filter(p => !connectedProviderKeys.includes(p.key))
  const categories = [...new Set(providers.map(p => p.category))]

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center" data-testid="integrations-loading">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 text-green-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading integrations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" data-testid="integrations-dashboard">
      {/* Header */}
      <div className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/20">
                <Plug className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Integrations Hub</h1>
                <p className="text-slate-400 text-sm">Connect, monitor, and test your integrations</p>
              </div>
            </div>
            <button
              onClick={initializeAndFetch}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors"
              data-testid="refresh-integrations-btn"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3" data-testid="error-message">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <span className="text-red-400">{error}</span>
            <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-300">
              <XCircle className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-5 border border-slate-700/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Connected</span>
              <Plug className="h-5 w-5 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-white" data-testid="connected-count">{instances.filter(i => i.status === 'ACTIVE').length}</p>
            <p className="text-slate-500 text-xs">Active integrations</p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-5 border border-slate-700/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Available</span>
              <Globe className="h-5 w-5 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-white" data-testid="available-count">{providers.length}</p>
            <p className="text-slate-500 text-xs">Total providers</p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-5 border border-slate-700/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">API Calls</span>
              <Activity className="h-5 w-5 text-purple-500" />
            </div>
            <p className="text-2xl font-bold text-white" data-testid="api-calls-count">{statistics?.totalCalls || 0}</p>
            <p className="text-slate-500 text-xs">This week</p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-5 border border-slate-700/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Success Rate</span>
              <Zap className="h-5 w-5 text-yellow-500" />
            </div>
            <p className="text-2xl font-bold text-white" data-testid="success-rate">{statistics?.successRate?.toFixed(0) || 100}%</p>
            <p className="text-slate-500 text-xs">API reliability</p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-5 border border-slate-700/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Avg Response</span>
              <Timer className="h-5 w-5 text-cyan-500" />
            </div>
            <p className="text-2xl font-bold text-white">{statistics?.averageDurationMs?.toFixed(0) || 0}ms</p>
            <p className="text-slate-500 text-xs">Response time</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { key: 'available', label: 'Available', icon: Globe },
            { key: 'connected', label: 'Connected', icon: Plug, count: instances.length },
            { key: 'health', label: 'Health Monitor', icon: HeartPulse },
            { key: 'webhooks', label: 'Webhook Tester', icon: Webhook },
            { key: 'playground', label: 'API Playground', icon: Terminal },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                activeTab === tab.key
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 border border-transparent'
              }`}
              data-testid={`tab-${tab.key}`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
              {tab.count !== undefined && (
                <span className="px-2 py-0.5 text-xs rounded-full bg-slate-700">{tab.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* Available Integrations Tab */}
        {activeTab === 'available' && (
          <div>
            {/* Category Filter */}
            <div className="flex flex-wrap gap-2 mb-6">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                  !selectedCategory
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'
                }`}
                data-testid="filter-all"
              >
                All
              </button>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                    selectedCategory === cat
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'
                  }`}
                  data-testid={`filter-${cat.toLowerCase()}`}
                >
                  {getCategoryLabel(cat)}
                </button>
              ))}
            </div>

            {/* Provider Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableProviders.map(provider => {
                const IconComponent = CATEGORY_ICONS[provider.category] || Plug
                const gradientClass = CATEGORY_COLORS[provider.category] || 'from-gray-500 to-slate-600'

                return (
                  <div
                    key={provider.id}
                    className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 overflow-hidden hover:border-green-500/30 transition-all group"
                    data-testid={`provider-card-${provider.key}`}
                  >
                    <div className={`h-2 bg-gradient-to-r ${gradientClass}`} />
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-xl bg-gradient-to-br ${gradientClass} shadow-lg`}>
                            <IconComponent className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-white flex items-center gap-2">
                              {provider.name}
                              {provider.isNigeriaFirst && (
                                <span className="px-1.5 py-0.5 text-[10px] font-medium bg-green-500/20 text-green-400 rounded">
                                  🇳🇬
                                </span>
                              )}
                            </h3>
                            <p className="text-xs text-slate-500">{getCategoryLabel(provider.category)}</p>
                          </div>
                        </div>
                        {provider.documentationUrl && (
                          <a
                            href={provider.documentationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-500 hover:text-slate-300 transition-colors"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                      </div>

                      <p className="text-sm text-slate-400 mb-4 line-clamp-2">{provider.description}</p>

                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {provider.supportedScopes.slice(0, 3).map(scope => (
                          <span key={scope} className="px-2 py-0.5 text-[10px] bg-slate-700/50 text-slate-400 rounded">
                            {scope}
                          </span>
                        ))}
                        {provider.supportedScopes.length > 3 && (
                          <span className="px-2 py-0.5 text-[10px] bg-slate-700/50 text-slate-400 rounded">
                            +{provider.supportedScopes.length - 3} more
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleConnect(provider)}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors"
                          data-testid={`connect-${provider.key}-btn`}
                        >
                          <Plus className="h-4 w-4" />
                          Connect
                        </button>
                        {provider.supportsWebhooks && (
                          <div className="p-2 bg-slate-700/50 rounded-lg" title="Supports Webhooks">
                            <Webhook className="h-4 w-4 text-slate-400" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {availableProviders.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                <Plug className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No available providers in this category</p>
              </div>
            )}
          </div>
        )}

        {/* Connected Integrations Tab */}
        {activeTab === 'connected' && (
          <div>
            {instances.length === 0 ? (
              <div className="text-center py-12 text-slate-400 bg-slate-800/30 rounded-2xl border border-slate-700/50">
                <Plug className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="mb-4">No connected integrations yet</p>
                <button
                  onClick={() => setActiveTab('available')}
                  className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
                >
                  Browse Available Integrations
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {instances.map(instance => {
                  const IconComponent = CATEGORY_ICONS[instance.provider.category] || Plug
                  const gradientClass = CATEGORY_COLORS[instance.provider.category] || 'from-gray-500 to-slate-600'

                  return (
                    <div
                      key={instance.id}
                      className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 overflow-hidden"
                      data-testid={`instance-card-${instance.id}`}
                    >
                      <div className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-xl bg-gradient-to-br ${gradientClass} shadow-lg`}>
                              <IconComponent className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-white text-lg flex items-center gap-2">
                                {instance.displayName || instance.provider.name}
                                {instance.provider.isNigeriaFirst && (
                                  <span className="px-1.5 py-0.5 text-[10px] font-medium bg-green-500/20 text-green-400 rounded">
                                    🇳🇬
                                  </span>
                                )}
                              </h3>
                              <p className="text-sm text-slate-400">{getCategoryLabel(instance.provider.category)}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusBadge(instance.status)}`}>
                              {instance.status.replace('_', ' ')}
                            </span>
                            <button
                              onClick={() => handleDisconnect(instance.id)}
                              className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                              title="Disconnect"
                              data-testid={`disconnect-${instance.id}-btn`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-slate-900/50 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-3">
                              <Key className="h-4 w-4 text-slate-400" />
                              <span className="text-sm font-medium text-slate-300">Credentials</span>
                            </div>
                            <div className="space-y-2">
                              {instance.credentials.map(cred => (
                                <div key={cred.key} className="flex items-center justify-between">
                                  <span className="text-xs text-slate-500">{cred.key}</span>
                                  <span className="text-xs text-slate-400 font-mono">{cred.maskedValue}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="bg-slate-900/50 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-3">
                              <Webhook className="h-4 w-4 text-slate-400" />
                              <span className="text-sm font-medium text-slate-300">Webhooks</span>
                            </div>
                            {instance.webhooks.length > 0 ? (
                              <div className="space-y-2">
                                {instance.webhooks.map(webhook => (
                                  <div key={webhook.id} className="flex items-center justify-between">
                                    <span className="text-xs text-slate-400">{webhook.name}</span>
                                    <span className={`text-xs ${webhook.status === 'ACTIVE' ? 'text-green-400' : 'text-slate-500'}`}>
                                      {webhook.direction}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-slate-500">No webhooks configured</p>
                            )}
                          </div>

                          <div className="bg-slate-900/50 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-3">
                              <Shield className="h-4 w-4 text-slate-400" />
                              <span className="text-sm font-medium text-slate-300">Permissions</span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {instance.enabledScopes.slice(0, 4).map(scope => (
                                <span key={scope} className="px-2 py-0.5 text-[10px] bg-slate-700/50 text-slate-400 rounded">
                                  {scope}
                                </span>
                              ))}
                              {instance.enabledScopes.length > 4 && (
                                <span className="px-2 py-0.5 text-[10px] bg-slate-700/50 text-slate-400 rounded">
                                  +{instance.enabledScopes.length - 4}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Health Monitor Tab */}
        {activeTab === 'health' && (
          <div className="space-y-6" data-testid="health-monitor-tab">
            {/* Security Alerts */}
            {anomalies.length > 0 && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <AlertTriangle className="h-6 w-6 text-red-400" />
                  <h2 className="text-lg font-semibold text-white">Security Alerts</h2>
                  <span className="px-2 py-0.5 text-xs bg-red-500/20 text-red-400 rounded-full">{anomalies.length}</span>
                </div>
                <div className="space-y-3">
                  {anomalies.map((anomaly, i) => (
                    <div key={i} className="bg-slate-900/50 rounded-xl p-4 flex items-start gap-4">
                      <div className={`p-2 rounded-lg ${
                        anomaly.severity === 'critical' ? 'bg-red-500/20' :
                        anomaly.severity === 'high' ? 'bg-orange-500/20' :
                        anomaly.severity === 'medium' ? 'bg-yellow-500/20' : 'bg-blue-500/20'
                      }`}>
                        <AlertTriangle className={`h-5 w-5 ${
                          anomaly.severity === 'critical' ? 'text-red-400' :
                          anomaly.severity === 'high' ? 'text-orange-400' :
                          anomaly.severity === 'medium' ? 'text-yellow-400' : 'text-blue-400'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-white">{anomaly.type.replace(/_/g, ' ')}</span>
                          <span className={`px-2 py-0.5 text-[10px] font-medium rounded uppercase ${
                            anomaly.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                            anomaly.severity === 'high' ? 'bg-orange-500/20 text-orange-400' :
                            anomaly.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-blue-500/20 text-blue-400'
                          }`}>{anomaly.severity}</span>
                        </div>
                        <p className="text-sm text-slate-400">{anomaly.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Overall Health Status */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-green-500/20">
                    <HeartPulse className="h-5 w-5 text-green-400" />
                  </div>
                  <span className="text-slate-300 font-medium">System Health</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-green-400">
                    {statistics?.successRate ? Math.round(statistics.successRate) : 100}%
                  </span>
                  <span className="text-slate-500 text-sm">healthy</span>
                </div>
                <div className="mt-4 h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all"
                    style={{ width: `${statistics?.successRate || 100}%` }}
                  />
                </div>
              </div>

              <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-blue-500/20">
                    <Activity className="h-5 w-5 text-blue-400" />
                  </div>
                  <span className="text-slate-300 font-medium">API Activity</span>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">Success</span>
                    <span className="text-sm text-green-400 font-medium">{statistics?.successfulCalls || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">Failed</span>
                    <span className="text-sm text-red-400 font-medium">{statistics?.failedCalls || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">Webhooks In</span>
                    <span className="text-sm text-purple-400 font-medium">{statistics?.webhooksReceived || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">Webhooks Out</span>
                    <span className="text-sm text-cyan-400 font-medium">{statistics?.webhooksSent || 0}</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-orange-500/20">
                    <AlertCircle className="h-5 w-5 text-orange-400" />
                  </div>
                  <span className="text-slate-300 font-medium">Top Errors</span>
                </div>
                {statistics?.topErrors && statistics.topErrors.length > 0 ? (
                  <div className="space-y-3">
                    {statistics.topErrors.map((err, i) => (
                      <div key={i} className="flex justify-between items-center">
                        <span className="text-sm text-slate-400 font-mono">{err.code || 'Unknown'}</span>
                        <span className="text-sm text-red-400 font-medium">{err.count}x</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-24 text-slate-500 text-sm">
                    <CheckCircle2 className="h-5 w-5 mr-2 text-green-400" />
                    No errors reported
                  </div>
                )}
              </div>
            </div>

            {/* Integration Health Status */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 overflow-hidden">
              <div className="p-6 border-b border-slate-700/50">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Heart className="h-5 w-5 text-red-400" />
                  Integration Status
                </h2>
              </div>
              <div className="divide-y divide-slate-700/50">
                {instances.length === 0 ? (
                  <div className="p-6 text-center text-slate-400">
                    No integrations to monitor
                  </div>
                ) : instances.map(instance => {
                  const IconComponent = CATEGORY_ICONS[instance.provider.category] || Plug
                  const gradientClass = CATEGORY_COLORS[instance.provider.category] || 'from-gray-500 to-slate-600'
                  const healthStatus = instance.healthStatus || 'healthy'

                  return (
                    <div key={instance.id} className="p-4 flex items-center justify-between hover:bg-slate-700/20 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg bg-gradient-to-br ${gradientClass}`}>
                          <IconComponent className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-white">{instance.displayName || instance.provider.name}</p>
                          <p className="text-xs text-slate-500">{instance.provider.key}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-xs text-slate-500">Last Check</p>
                          <p className="text-sm text-slate-400">
                            {instance.lastHealthCheck 
                              ? new Date(instance.lastHealthCheck).toLocaleTimeString()
                              : 'Never'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            healthStatus === 'healthy' ? 'bg-green-500 animate-pulse' :
                            healthStatus === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
                          }`} />
                          <span className={`text-sm font-medium capitalize ${getHealthColor(healthStatus)}`}>
                            {healthStatus}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Recent Logs */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 overflow-hidden">
              <div className="p-6 border-b border-slate-700/50 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <History className="h-5 w-5 text-slate-400" />
                  Recent Activity
                </h2>
                <button
                  onClick={async () => {
                    const logsRes = await fetch('/api/integrations?action=logs&limit=20').then(r => r.json())
                    setWebhookLogs(logsRes.logs || [])
                  }}
                  className="text-sm text-slate-400 hover:text-slate-300 flex items-center gap-1"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </button>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {webhookLogs.length === 0 ? (
                  <div className="p-6 text-center text-slate-400">
                    No recent activity
                  </div>
                ) : webhookLogs.map(log => (
                  <div key={log.id} className="p-4 border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 text-[10px] font-medium rounded ${
                          log.success ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {log.success ? 'SUCCESS' : 'FAILED'}
                        </span>
                        <span className="text-xs text-slate-400">{log.method}</span>
                        <span className="text-xs text-slate-500 font-mono truncate max-w-[200px]">{log.url}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span>{log.durationMs}ms</span>
                        <span>{new Date(log.createdAt).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Webhook Tester Tab */}
        {activeTab === 'webhooks' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" data-testid="webhook-tester-tab">
            {/* Webhook Configuration */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 overflow-hidden">
              <div className="p-6 border-b border-slate-700/50">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Send className="h-5 w-5 text-purple-400" />
                  Test Webhook
                </h2>
                <p className="text-sm text-slate-400 mt-1">Simulate webhook events from providers</p>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Provider</label>
                  <select
                    value={selectedWebhookProvider}
                    onChange={(e) => {
                      setSelectedWebhookProvider(e.target.value)
                      const events = Object.keys(SAMPLE_PAYLOADS[e.target.value] || {})
                      setSelectedWebhookEvent(events[0] || '')
                    }}
                    className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    data-testid="webhook-provider-select"
                  >
                    {Object.keys(SAMPLE_PAYLOADS).map(provider => (
                      <option key={provider} value={provider}>{provider.charAt(0).toUpperCase() + provider.slice(1)}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Event Type</label>
                  <select
                    value={selectedWebhookEvent}
                    onChange={(e) => setSelectedWebhookEvent(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    data-testid="webhook-event-select"
                  >
                    {Object.keys(SAMPLE_PAYLOADS[selectedWebhookProvider] || {}).map(event => (
                      <option key={event} value={event}>{event}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Payload (JSON)</label>
                  <textarea
                    value={webhookPayload}
                    onChange={(e) => setWebhookPayload(e.target.value)}
                    rows={12}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-purple-500 resize-none"
                    placeholder='{"event": "charge.success", "data": {...}}'
                    data-testid="webhook-payload-input"
                  />
                </div>

                <button
                  onClick={handleTestWebhook}
                  disabled={testingWebhook || !webhookPayload}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  data-testid="send-webhook-btn"
                >
                  {testingWebhook ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Play className="h-5 w-5" />
                      Send Test Webhook
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Webhook Result */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 overflow-hidden">
              <div className="p-6 border-b border-slate-700/50">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Radio className="h-5 w-5 text-cyan-400" />
                  Response
                </h2>
              </div>
              <div className="p-6">
                {webhookTestResult ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      {webhookTestResult.success ? (
                        <CheckCircle className="h-6 w-6 text-green-400" />
                      ) : (
                        <XCircle className="h-6 w-6 text-red-400" />
                      )}
                      <div>
                        <p className={`font-medium ${webhookTestResult.success ? 'text-green-400' : 'text-red-400'}`}>
                          {webhookTestResult.success ? 'Webhook Processed Successfully' : 'Webhook Processing Failed'}
                        </p>
                        <p className="text-xs text-slate-500">{webhookTestResult.timestamp}</p>
                      </div>
                    </div>

                    {webhookTestResult.error ? (
                      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                        <p className="text-sm text-red-400">{webhookTestResult.error}</p>
                      </div>
                    ) : (
                      <div className="bg-slate-900/50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-slate-500">Status: {webhookTestResult.status}</span>
                          <button
                            onClick={() => navigator.clipboard.writeText(JSON.stringify(webhookTestResult.response, null, 2))}
                            className="text-slate-400 hover:text-slate-300"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                        </div>
                        <pre className="text-xs text-slate-300 font-mono overflow-auto max-h-60">
                          {JSON.stringify(webhookTestResult.response, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                    <Webhook className="h-12 w-12 mb-4 opacity-50" />
                    <p>Send a test webhook to see the response</p>
                  </div>
                )}
              </div>

              {/* Quick Reference */}
              <div className="p-6 border-t border-slate-700/50">
                <h3 className="text-sm font-medium text-slate-300 mb-3">Webhook Endpoint</h3>
                <div className="bg-slate-900/50 rounded-lg p-3 flex items-center justify-between">
                  <code className="text-sm text-cyan-400 font-mono">/api/integrations/webhook/{'{provider}'}</code>
                  <button
                    onClick={() => navigator.clipboard.writeText('/api/integrations/webhook/{provider}')}
                    className="text-slate-400 hover:text-slate-300"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* API Playground Tab */}
        {activeTab === 'playground' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" data-testid="api-playground-tab">
            {/* Endpoint Explorer */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 overflow-hidden">
              <div className="p-6 border-b border-slate-700/50">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Code className="h-5 w-5 text-green-400" />
                  API Explorer
                </h2>
              </div>
              <div className="max-h-[600px] overflow-y-auto">
                {API_ENDPOINTS.map(category => (
                  <div key={category.category}>
                    <button
                      onClick={() => setExpandedCategory(expandedCategory === category.category ? '' : category.category)}
                      className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-700/30 transition-colors border-b border-slate-700/30"
                    >
                      <span className="font-medium text-slate-300">{category.category}</span>
                      {expandedCategory === category.category ? (
                        <ChevronUp className="h-4 w-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-slate-400" />
                      )}
                    </button>
                    {expandedCategory === category.category && (
                      <div className="bg-slate-900/30">
                        {category.endpoints.map((endpoint, i) => (
                          <button
                            key={i}
                            onClick={() => setSelectedEndpoint(endpoint)}
                            className={`w-full p-3 flex items-center gap-3 text-left hover:bg-slate-700/30 transition-colors border-b border-slate-700/20 ${
                              selectedEndpoint === endpoint ? 'bg-green-500/10 border-l-2 border-l-green-500' : ''
                            }`}
                          >
                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                              endpoint.method === 'GET' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'
                            }`}>
                              {endpoint.method}
                            </span>
                            <span className="text-sm text-slate-400 truncate">{endpoint.description}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Request Builder */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 overflow-hidden">
                <div className="p-6 border-b border-slate-700/50">
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Terminal className="h-5 w-5 text-yellow-400" />
                    Request
                  </h2>
                </div>
                <div className="p-6 space-y-4">
                  <div className="bg-slate-900/50 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <span className={`px-2 py-1 text-xs font-bold rounded ${
                        selectedEndpoint.method === 'GET' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'
                      }`}>
                        {selectedEndpoint.method}
                      </span>
                      <code className="text-sm text-cyan-400 font-mono flex-1 truncate">{selectedEndpoint.path}</code>
                      <button
                        onClick={() => navigator.clipboard.writeText(selectedEndpoint.path)}
                        className="text-slate-400 hover:text-slate-300"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-sm text-slate-400">{selectedEndpoint.description}</p>
                  </div>

                  {selectedEndpoint.method === 'POST' && (
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Request Body (JSON)</label>
                      <textarea
                        value={apiRequestBody}
                        onChange={(e) => setApiRequestBody(e.target.value)}
                        rows={8}
                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-green-500 resize-none"
                        placeholder='{"action": "...", ...}'
                        data-testid="api-request-body"
                      />
                    </div>
                  )}

                  <button
                    onClick={handleExecuteApi}
                    disabled={executingApi}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    data-testid="execute-api-btn"
                  >
                    {executingApi ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Executing...
                      </>
                    ) : (
                      <>
                        <Play className="h-5 w-5" />
                        Execute Request
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Response */}
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 overflow-hidden">
                <div className="p-6 border-b border-slate-700/50 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <FileJson className="h-5 w-5 text-cyan-400" />
                    Response
                  </h2>
                  {apiResponse && (
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 text-xs font-bold rounded ${
                        apiResponse.status >= 200 && apiResponse.status < 300 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {apiResponse.status} {apiResponse.statusText}
                      </span>
                      <span className="text-xs text-slate-400">{apiResponse.duration}ms</span>
                    </div>
                  )}
                </div>
                <div className="p-6">
                  {apiResponse ? (
                    <div className="space-y-4">
                      {apiResponse.error ? (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                          <p className="text-sm text-red-400">{apiResponse.error}</p>
                        </div>
                      ) : (
                        <div className="bg-slate-900/50 rounded-lg p-4 max-h-80 overflow-auto">
                          <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap">
                            {JSON.stringify(apiResponse.data, null, 2)}
                          </pre>
                        </div>
                      )}
                      <button
                        onClick={() => navigator.clipboard.writeText(JSON.stringify(apiResponse.data, null, 2))}
                        className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-300"
                      >
                        <Copy className="h-4 w-4" />
                        Copy Response
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                      <Terminal className="h-12 w-12 mb-4 opacity-50" />
                      <p>Execute a request to see the response</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Connect Modal */}
      {showConnectModal && selectedProvider && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" data-testid="connect-modal">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-700">
              <div className="flex items-center gap-3">
                {(() => {
                  const IconComponent = CATEGORY_ICONS[selectedProvider.category] || Plug
                  const gradientClass = CATEGORY_COLORS[selectedProvider.category] || 'from-gray-500 to-slate-600'
                  return (
                    <div className={`p-2.5 rounded-xl bg-gradient-to-br ${gradientClass}`}>
                      <IconComponent className="h-5 w-5 text-white" />
                    </div>
                  )
                })()}
                <div>
                  <h2 className="text-lg font-semibold text-white">Connect {selectedProvider.name}</h2>
                  <p className="text-sm text-slate-400">Enter your API credentials</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {selectedProvider.requiredCredentials.map(credKey => (
                <div key={credKey}>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    {credKey.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                    <span className="text-red-400 ml-1">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showCredentials[credKey] ? 'text' : 'password'}
                      value={credentials[credKey] || ''}
                      onChange={e => setCredentials(prev => ({ ...prev, [credKey]: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-green-500 transition-colors pr-10"
                      placeholder={`Enter your ${credKey.replace(/_/g, ' ')}`}
                      data-testid={`input-${credKey}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCredentials(prev => ({ ...prev, [credKey]: !prev[credKey] }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                    >
                      {showCredentials[credKey] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              ))}

              <div className="bg-slate-900/50 rounded-lg p-4 flex items-start gap-3">
                <Shield className="h-5 w-5 text-green-400 mt-0.5" />
                <div className="text-sm">
                  <p className="text-slate-300 font-medium">Secure Storage</p>
                  <p className="text-slate-500">Your credentials are encrypted at rest and never logged.</p>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-700 flex gap-3">
              <button
                onClick={() => {
                  setShowConnectModal(false)
                  setSelectedProvider(null)
                }}
                className="flex-1 px-4 py-2.5 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                data-testid="cancel-connect-btn"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitConnection}
                disabled={connectingProvider || selectedProvider.requiredCredentials.some(k => !credentials[k])}
                className="flex-1 px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                data-testid="submit-connect-btn"
              >
                {connectingProvider ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Plug className="h-4 w-4" />
                    Connect
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
