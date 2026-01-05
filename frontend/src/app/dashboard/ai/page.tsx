'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  Brain, 
  Sparkles,
  Zap,
  MessageSquare,
  BarChart3,
  Settings,
  AlertTriangle,
  RefreshCw,
  Bot,
  Workflow,
  FileText,
  Lightbulb,
  TrendingUp
} from 'lucide-react'

interface AIStats {
  automationsActive: number
  tasksCompleted: number
  timeSaved: string
  aiInsights: number
  chatbotSessions: number
  accuracy: string
}

interface AutomationItem {
  id: string
  name: string
  type: 'WORKFLOW' | 'CHATBOT' | 'PREDICTION' | 'RECOMMENDATION'
  status: 'ACTIVE' | 'PAUSED' | 'DRAFT'
  runsToday: number
  successRate: string
}

export default function AIDashboard() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const tenantSlug = searchParams.get('tenant')
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<AIStats | null>(null)
  const [automations, setAutomations] = useState<AutomationItem[]>([])
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (tenantSlug) {
      fetchAIData()
    } else {
      setError('No tenant specified')
      setLoading(false)
    }
  }, [tenantSlug])

  async function fetchAIData() {
    try {
      setRefreshing(true)
      
      // Simulate API call - replace with actual endpoints when available
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setStats({
        automationsActive: 0,
        tasksCompleted: 0,
        timeSaved: '0 hrs',
        aiInsights: 0,
        chatbotSessions: 0,
        accuracy: '0%'
      })
      setAutomations([])
      setError(null)
    } catch (err) {
      console.error('Failed to fetch AI data:', err)
      setError('Failed to load AI data. Make sure the AI module is activated.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-700'
      case 'PAUSED': return 'bg-yellow-100 text-yellow-700'
      case 'DRAFT': return 'bg-gray-100 text-gray-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  function getTypeIcon(type: string) {
    switch (type) {
      case 'WORKFLOW': return <Workflow className="w-4 h-4" />
      case 'CHATBOT': return <MessageSquare className="w-4 h-4" />
      case 'PREDICTION': return <TrendingUp className="w-4 h-4" />
      default: return <Lightbulb className="w-4 h-4" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50" data-testid="ai-dashboard-loading">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-4 border-violet-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-slate-600">Loading AI dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50" data-testid="ai-dashboard-error">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-slate-800 mb-2">Unable to Load AI</h1>
          <p className="text-slate-600 mb-4">{error}</p>
          <div className="space-x-3">
            <button 
              onClick={() => router.push(`/dashboard?tenant=${tenantSlug}`)}
              className="px-4 py-2 text-slate-600 hover:text-slate-800"
            >
              ← Go Back
            </button>
            <button 
              onClick={fetchAIData}
              className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50" data-testid="ai-dashboard">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => router.push(`/dashboard?tenant=${tenantSlug}`)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                data-testid="back-to-dashboard"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
                  <Brain className="w-5 h-5 text-violet-600" />
                </div>
                <div>
                  <h1 className="font-bold text-slate-800">AI & Automation</h1>
                  <p className="text-sm text-slate-500">Smart Business Tools</p>
                </div>
              </div>
            </div>
            <button 
              onClick={fetchAIData}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
              data-testid="refresh-dashboard"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6" data-testid="automations-card">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center">
                <Zap className="w-6 h-6 text-violet-600" />
              </div>
            </div>
            <p className="text-sm text-slate-500 mb-1">Active Automations</p>
            <p className="text-2xl font-bold text-slate-800">{stats?.automationsActive || 0}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6" data-testid="tasks-completed-card">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="text-sm text-slate-500 mb-1">Tasks Completed</p>
            <p className="text-2xl font-bold text-green-600">{stats?.tasksCompleted || 0}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6" data-testid="time-saved-card">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-sm text-slate-500 mb-1">Time Saved</p>
            <p className="text-2xl font-bold text-blue-600">{stats?.timeSaved || '0 hrs'}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6" data-testid="ai-insights-card">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <Lightbulb className="w-6 h-6 text-amber-600" />
              </div>
            </div>
            <p className="text-sm text-slate-500 mb-1">AI Insights</p>
            <p className="text-2xl font-bold text-amber-600">{stats?.aiInsights || 0}</p>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Automations List */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200" data-testid="automations-list">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-slate-800">Automations</h2>
                <a 
                  href={`/dashboard/ai/automations?tenant=${tenantSlug}`}
                  className="text-sm text-violet-600 hover:text-violet-700 font-medium"
                >
                  View All →
                </a>
              </div>
            </div>
            <div className="divide-y divide-slate-100">
              {automations.length > 0 ? (
                automations.map((automation) => (
                  <div key={automation.id} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center text-violet-600">
                          {getTypeIcon(automation.type)}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">{automation.name}</p>
                          <p className="text-sm text-slate-500">{automation.type} • {automation.runsToday} runs today</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(automation.status)}`}>
                          {automation.status}
                        </span>
                        <p className="text-xs text-slate-400 mt-1">{automation.successRate} success</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-500">
                  <Brain className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p>No automations configured</p>
                  <a 
                    href={`/dashboard/ai/automations/new?tenant=${tenantSlug}`}
                    className="text-sm text-violet-600 hover:text-violet-700 mt-2 inline-block"
                  >
                    Create your first automation →
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6" data-testid="chatbot-stats-card">
              <h2 className="font-semibold text-slate-800 mb-4">AI Chatbot</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="text-sm text-slate-600">Sessions Today</span>
                  <span className="font-semibold text-slate-800">{stats?.chatbotSessions || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="text-sm text-slate-600">Response Accuracy</span>
                  <span className="font-semibold text-slate-800">{stats?.accuracy || '0%'}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6" data-testid="quick-actions-card">
              <h2 className="font-semibold text-slate-800 mb-4">Quick Actions</h2>
              <div className="space-y-2">
                {[
                  { icon: Workflow, label: 'New Automation', href: `/dashboard/ai/automations/new?tenant=${tenantSlug}` },
                  { icon: Bot, label: 'Chatbot Settings', href: `/dashboard/ai/chatbot?tenant=${tenantSlug}` },
                  { icon: Lightbulb, label: 'AI Insights', href: `/dashboard/ai/insights?tenant=${tenantSlug}` },
                  { icon: TrendingUp, label: 'Predictions', href: `/dashboard/ai/predictions?tenant=${tenantSlug}` },
                  { icon: BarChart3, label: 'Analytics', href: `/dashboard/ai/analytics?tenant=${tenantSlug}` },
                  { icon: Settings, label: 'AI Settings', href: `/dashboard/ai/settings?tenant=${tenantSlug}` },
                ].map((action, i) => (
                  <a
                    key={i}
                    href={action.href}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors group"
                  >
                    <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center group-hover:bg-violet-100 transition-colors">
                      <action.icon className="w-4 h-4 text-slate-500 group-hover:text-violet-600" />
                    </div>
                    <span className="text-sm text-slate-700 group-hover:text-slate-900">{action.label}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* AI Features Info */}
        <div className="mt-6 bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl border border-violet-200 p-6" data-testid="ai-features-info">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-violet-100 rounded-lg">
              <Brain className="w-6 h-6 text-violet-600" />
            </div>
            <div>
              <h3 className="font-semibold text-violet-900 mb-2">AI-Powered Features</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Workflow className="w-4 h-4 text-violet-600" />
                  <span className="text-violet-700">Workflow Automation</span>
                </div>
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-violet-600" />
                  <span className="text-violet-700">Smart Chatbot</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-violet-600" />
                  <span className="text-violet-700">Sales Predictions</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-violet-600" />
                  <span className="text-violet-700">Business Insights</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
