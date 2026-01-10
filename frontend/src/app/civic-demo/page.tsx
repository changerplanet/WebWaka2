'use client'

/**
 * CIVIC SUITE: Demo Portal
 * 
 * Showcases Civic / GovTech Suite capabilities with Nigerian demo data.
 * Demo Scenario: Lagos State Lands Bureau - Certificate of Occupancy
 * 
 * Read-only, demo-safe experience for partners and investors.
 * 
 * @module app/civic-demo
 * @phase S5 (Narrative Integration)
 * @standard Platform Standardisation v2
 */

import { useEffect, useState, Suspense, useCallback } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Building2,
  Users,
  FileText,
  ClipboardCheck,
  Search,
  CheckCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  Shield,
  Globe,
  Clock,
  Banknote,
  Eye,
  UserCheck,
  FolderOpen,
  Scale,
  MapPin,
  Calendar,
  ArrowRight,
  ChevronRight,
  BadgeCheck,
  Copy,
  Scroll,
  Receipt,
  FileSearch,
  LandPlot,
  Landmark,
  FileCheck,
  Timer,
  BarChart3,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DemoModeProvider } from '@/lib/demo/context'
import { DemoOverlay, QuickStartBanner, StorylineSelector } from '@/components/demo'
import { resolveQuickStart, QuickStartConfig } from '@/lib/demo/quickstart'

// ============================================================================
// TYPES
// ============================================================================

interface DemoStats {
  citizens: number
  organizations: number
  agencies: number
  staff: number
  services: number
  requests: number
  cases: number
  inspections: number
  approvals: number
  billingFacts: number
}

interface PublicStatus {
  trackingCode: string
  serviceName: string
  currentStatus: string
  submittedDate: string
  progressStage: number
  progressNote: string
  estimatedCompletionDate?: string
}

interface Request {
  id: string
  requestNumber: string
  trackingCode: string
  applicantName: string
  serviceName: string
  status: string
  submittedAt: string
  isPaid: boolean
}

interface Case {
  id: string
  caseNumber: string
  status: string
  priority: string
  slaDeadline: string
  slaBreached: boolean
  isEscalated: boolean
}

interface AuditLog {
  id: string
  action: string
  entityType: string
  actorName: string
  description: string
  createdAt: string
}

// ============================================================================
// CIVIC MODULE CARDS
// ============================================================================

const CIVIC_MODULES = [
  {
    id: 'registry',
    name: 'Citizen & Org Registry',
    description: 'Profiles for citizens and organizations with identity references (not replacement)',
    icon: Users,
    color: 'emerald',
    highlights: [
      'Citizen profiles',
      'Organization profiles',
      'Document verification',
      'Non-NIN identifiers'
    ]
  },
  {
    id: 'agencies',
    name: 'Agency Structure',
    description: 'Government agencies, departments, units, and staff management',
    icon: Landmark,
    color: 'blue',
    highlights: [
      'Multi-agency support',
      'Department hierarchy',
      'Staff roles',
      'Jurisdiction tracking'
    ]
  },
  {
    id: 'services',
    name: 'Service Catalogue',
    description: 'Government services with fees, SLAs, and requirements',
    icon: FolderOpen,
    color: 'violet',
    highlights: [
      'Service definitions',
      'Fee schedules',
      'SLA tracking',
      'Required documents'
    ]
  },
  {
    id: 'requests',
    name: 'Request & Cases',
    description: 'Service request submission and internal case workflow',
    icon: FileText,
    color: 'amber',
    highlights: [
      'Public tracking codes',
      'Status progression',
      'Case assignment',
      'SLA monitoring'
    ]
  },
  {
    id: 'inspections',
    name: 'Inspections & Approvals',
    description: 'Field inspections, findings, and approval decisions',
    icon: ClipboardCheck,
    color: 'rose',
    highlights: [
      'Scheduled inspections',
      'Findings (append-only)',
      'Approval decisions',
      'Audit compliance'
    ]
  },
  {
    id: 'audit',
    name: 'Audit & Transparency',
    description: 'Append-only audit logs and public tracking for FOI compliance',
    icon: Scroll,
    color: 'teal',
    highlights: [
      'Append-only logs',
      'Public status',
      'FOI-ready export',
      'Actor tracking'
    ]
  },
]

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getColorClasses(color: string) {
  const colors: Record<string, { bg: string; bgLight: string; text: string; border: string }> = {
    emerald: { bg: 'bg-emerald-600', bgLight: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' },
    blue: { bg: 'bg-blue-600', bgLight: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
    violet: { bg: 'bg-violet-600', bgLight: 'bg-violet-50', text: 'text-violet-600', border: 'border-violet-200' },
    amber: { bg: 'bg-amber-600', bgLight: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
    rose: { bg: 'bg-rose-600', bgLight: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-200' },
    teal: { bg: 'bg-teal-600', bgLight: 'bg-teal-50', text: 'text-teal-600', border: 'border-teal-200' },
  }
  return colors[color] || colors.emerald
}

function getStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-700',
    SUBMITTED: 'bg-blue-100 text-blue-700',
    UNDER_REVIEW: 'bg-yellow-100 text-yellow-700',
    PENDING_DOCUMENTS: 'bg-orange-100 text-orange-700',
    PENDING_INSPECTION: 'bg-purple-100 text-purple-700',
    PENDING_PAYMENT: 'bg-red-100 text-red-700',
    PENDING_APPROVAL: 'bg-indigo-100 text-indigo-700',
    APPROVED: 'bg-green-100 text-green-700',
    REJECTED: 'bg-red-100 text-red-700',
    CANCELLED: 'bg-gray-100 text-gray-700',
    // Case statuses
    OPEN: 'bg-blue-100 text-blue-700',
    ASSIGNED: 'bg-cyan-100 text-cyan-700',
    IN_PROGRESS: 'bg-yellow-100 text-yellow-700',
    PENDING_INFO: 'bg-orange-100 text-orange-700',
    ESCALATED: 'bg-red-100 text-red-700',
    RESOLVED: 'bg-green-100 text-green-700',
    CLOSED: 'bg-gray-100 text-gray-700',
  }
  return statusColors[status] || 'bg-gray-100 text-gray-700'
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(amount)
}

// ============================================================================
// DEMO PREVIEW MODE COMPONENT
// ============================================================================

function DemoPreviewMode() {
  return (
    <Card className="border-emerald-200 bg-emerald-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-emerald-800">
          <Eye className="h-5 w-5" />
          Demo Preview Mode
        </CardTitle>
        <CardDescription className="text-emerald-700">
          You are viewing the Civic / GovTech Suite demo. To seed data and interact with full features,
          please log in with a tenant that has the <code className="bg-emerald-100 px-1 rounded">civic_registry</code> capability enabled.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <Link href="/auth/login">
            <Button variant="outline" className="border-emerald-300 text-emerald-700 hover:bg-emerald-100">
              Sign In
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              Go to Dashboard
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// PUBLIC STATUS TRACKER COMPONENT
// ============================================================================

function PublicStatusTracker() {
  const [trackingCode, setTrackingCode] = useState('')
  const [status, setStatus] = useState<PublicStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sampleCodes = ['LSLB-A1B2C3', 'LSLB-D4E5F6', 'LSLB-G7H8I9', 'LSLB-J0K1L2']

  const lookupStatus = async (code: string) => {
    if (!code) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/civic/public?trackingCode=${code}`)
      const data = await res.json()
      if (data.success) {
        setStatus(data.status)
      } else {
        setError(data.error || 'Status not found')
        setStatus(null)
      }
    } catch {
      setError('Unable to lookup status')
      setStatus(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-emerald-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5 text-emerald-600" />
          Public Status Tracker
        </CardTitle>
        <CardDescription>
          Track your application status using your tracking code (no login required)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={trackingCode}
            onChange={(e) => setTrackingCode(e.target.value.toUpperCase())}
            placeholder="Enter tracking code (e.g., LSLB-A1B2C3)"
            className="flex-1 px-3 py-2 border rounded-md text-sm"
          />
          <Button 
            onClick={() => lookupStatus(trackingCode)}
            disabled={loading || !trackingCode}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Track'}
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-muted-foreground">Try sample codes:</span>
          {sampleCodes.map(code => (
            <button
              key={code}
              onClick={() => { setTrackingCode(code); lookupStatus(code) }}
              className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
            >
              {code}
            </button>
          ))}
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        {status && (
          <div className="p-4 bg-gray-50 rounded-lg border space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium">{status.serviceName}</span>
              <Badge className={getStatusColor(status.currentStatus)}>
                {status.currentStatus.replace(/_/g, ' ')}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Tracking Code:</span>
                <p className="font-mono">{status.trackingCode}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Submitted:</span>
                <p>{formatDate(status.submittedDate)}</p>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span>Stage {status.progressStage} of 7</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-emerald-600 h-2 rounded-full transition-all"
                  style={{ width: `${(status.progressStage / 7) * 100}%` }}
                />
              </div>
            </div>
            {status.progressNote && (
              <p className="text-sm p-2 bg-emerald-50 border border-emerald-200 rounded">
                {status.progressNote}
              </p>
            )}
            {status.estimatedCompletionDate && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Timer className="h-4 w-4" />
                Estimated completion: {formatDate(status.estimatedCompletionDate)}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ============================================================================
// MAIN PAGE CONTENT
// ============================================================================

function CivicDemoContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [stats, setStats] = useState<DemoStats | null>(null)
  const [requests, setRequests] = useState<Request[]>([])
  const [cases, setCases] = useState<Case[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [seeding, setSeeding] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [seeded, setSeeded] = useState(false)
  
  // Quick Start handling
  const quickstartParam = searchParams.get('quickstart')
  const quickStartResult = resolveQuickStart(quickstartParam)
  const [quickStartConfig, setQuickStartConfig] = useState<QuickStartConfig | null>(
    quickStartResult.isActive ? quickStartResult.config : null
  )

  const loadDemoData = useCallback(async () => {
    try {
      // Check demo status
      const demoRes = await fetch('/api/civic/demo')
      if (demoRes.status === 401) {
        setIsAuthenticated(false)
        setLoading(false)
        return
      }
      
      setIsAuthenticated(true)
      const demoData = await demoRes.json()
      
      if (demoData.success && demoData.seeded) {
        setSeeded(true)
        setStats(demoData.stats)
        
        // Load additional data
        const [requestsRes, casesRes, auditRes] = await Promise.all([
          fetch('/api/civic/requests?limit=5'),
          fetch('/api/civic/cases?limit=5'),
          fetch('/api/civic/audit?limit=10'),
        ])
        
        const requestsData = await requestsRes.json()
        const casesData = await casesRes.json()
        const auditData = await auditRes.json()
        
        if (requestsData.success) setRequests(requestsData.requests || [])
        if (casesData.success) setCases(casesData.cases || [])
        if (auditData.success) setAuditLogs(auditData.logs || [])
      }
    } catch (error) {
      console.error('Failed to load demo data:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDemoData()
  }, [loadDemoData])
  
  // Update quickstart when URL changes
  useEffect(() => {
    const result = resolveQuickStart(quickstartParam)
    setQuickStartConfig(result.isActive ? result.config : null)
  }, [quickstartParam])

  const seedDemoData = async () => {
    setSeeding(true)
    try {
      const res = await fetch('/api/civic/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'seed' }),
      })
      const data = await res.json()
      if (data.success) {
        await loadDemoData()
      }
    } catch (error) {
      console.error('Failed to seed demo data:', error)
    } finally {
      setSeeding(false)
    }
  }
  
  // Quick Start handlers
  const handleSwitchRole = () => {
    // Remove quickstart param and show storyline selector
    router.push('/civic-demo')
  }
  
  const handleDismissQuickStart = () => {
    // Exit to commerce-demo (as per S5 mandate)
    router.push('/commerce-demo')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Demo Overlay (for guided storylines) */}
      <DemoOverlay />
      
      {/* Quick Start Banner */}
      {quickStartConfig && (
        <QuickStartBanner
          config={quickStartConfig}
          onSwitchRole={handleSwitchRole}
          onDismiss={handleDismissQuickStart}
        />
      )}
      
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 rounded-xl p-8 text-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            <Landmark className="h-10 w-10" />
            <div>
              <h1 className="text-3xl font-bold">Civic / GovTech Suite</h1>
              <p className="text-emerald-100">Government Service Delivery Platform</p>
            </div>
          </div>
          
          <p className="text-emerald-100 max-w-2xl mb-6">
            Transparent, auditable government service delivery. From application to approval, 
            every action is logged, every decision is traceable.
          </p>

          <div className="flex flex-wrap gap-2">
            <Badge className="bg-white/20 text-white border-0">🔒 S6 FROZEN</Badge>
            <Badge className="bg-white/20 text-white border-0">Capability Guarded</Badge>
            <Badge className="bg-white/20 text-white border-0">Nigeria-First</Badge>
            <Badge className="bg-white/20 text-white border-0">FOI-Ready</Badge>
            <Badge className="bg-white/20 text-white border-0">Append-Only Audit</Badge>
          </div>
        </div>
      </div>
      
      {/* Quick Start Role Cards (when no quickstart active) */}
      {!quickStartConfig && (
        <Card className="border-emerald-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-emerald-600" />
              Quick Start: Choose Your Role
            </CardTitle>
            <CardDescription>
              Experience the Civic / GovTech Suite from different perspectives
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link href="/civic-demo?quickstart=citizen">
                <div className="p-4 border rounded-lg hover:bg-emerald-50 hover:border-emerald-300 transition-colors cursor-pointer">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-5 w-5 text-emerald-600" />
                    <span className="font-medium">Citizen</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Application → tracking → approval
                  </p>
                </div>
              </Link>
              <Link href="/civic-demo?quickstart=agencyStaff">
                <div className="p-4 border rounded-lg hover:bg-violet-50 hover:border-violet-300 transition-colors cursor-pointer">
                  <div className="flex items-center gap-2 mb-2">
                    <Landmark className="h-5 w-5 text-violet-600" />
                    <span className="font-medium">Agency Staff</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Case intake → review → SLA
                  </p>
                </div>
              </Link>
              <Link href="/civic-demo?quickstart=civicRegulator">
                <div className="p-4 border rounded-lg hover:bg-rose-50 hover:border-rose-300 transition-colors cursor-pointer">
                  <div className="flex items-center gap-2 mb-2">
                    <Scale className="h-5 w-5 text-rose-600" />
                    <span className="font-medium">Regulator</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Oversight → compliance → FOI
                  </p>
                </div>
              </Link>
              <Link href="/civic-demo?quickstart=auditor">
                <div className="p-4 border rounded-lg hover:bg-amber-50 hover:border-amber-300 transition-colors cursor-pointer">
                  <div className="flex items-center gap-2 mb-2">
                    <FileSearch className="h-5 w-5 text-amber-600" />
                    <span className="font-medium">Auditor</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Reconstruct → verify → report
                  </p>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Demo Scenario Banner */}
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-amber-800 text-lg">
            <LandPlot className="h-5 w-5" />
            Demo Scenario: Lagos State Lands Bureau
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-amber-700 text-sm">
            <strong>Certificate of Occupancy (C of O)</strong> — Follow a citizen&apos;s application from 
            submission through inspection to final approval. Experience the full audit trail.
          </p>
        </CardContent>
      </Card>

      {/* Authentication Check */}
      {!isAuthenticated && <DemoPreviewMode />}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-emerald-600" />
                <span className="text-sm text-muted-foreground">Citizens</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.citizens}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-amber-600" />
                <span className="text-sm text-muted-foreground">Requests</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.requests}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4 text-violet-600" />
                <span className="text-sm text-muted-foreground">Inspections</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.inspections}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm text-muted-foreground">Approvals</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.approvals}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-muted-foreground">Billing Facts</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.billingFacts}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Seed Demo Data Button */}
      {isAuthenticated && !seeded && (
        <Card className="border-emerald-200">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground mb-4">
              No demo data found. Seed the Lagos Lands Bureau scenario to explore the platform.
            </p>
            <Button 
              onClick={seedDemoData}
              disabled={seeding}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {seeding ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Seeding Demo Data...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Seed Lagos Lands Bureau Demo
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Public Status Tracker (Always visible) */}
      <PublicStatusTracker />

      {/* Module Cards */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Platform Capabilities</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {CIVIC_MODULES.map(module => {
            const colors = getColorClasses(module.color)
            const Icon = module.icon
            return (
              <Card key={module.id} className={`hover:shadow-md transition-shadow ${colors.border}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${colors.bgLight}`}>
                      <Icon className={`h-5 w-5 ${colors.text}`} />
                    </div>
                    <div>
                      <CardTitle className="text-base">{module.name}</CardTitle>
                      <Badge variant="outline" className="text-xs">Active</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">{module.description}</p>
                  <ul className="text-xs space-y-1">
                    {module.highlights.map((h, i) => (
                      <li key={i} className="flex items-center gap-1">
                        <ChevronRight className="h-3 w-3 text-muted-foreground" />
                        {h}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Recent Requests Table */}
      {requests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-amber-600" />
              Recent Service Requests
            </CardTitle>
            <CardDescription>
              Track applications from submission through approval
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request #</TableHead>
                  <TableHead>Tracking</TableHead>
                  <TableHead>Applicant</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Paid</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map(request => (
                  <TableRow key={request.id}>
                    <TableCell className="font-mono text-sm">{request.requestNumber}</TableCell>
                    <TableCell className="font-mono text-sm">{request.trackingCode}</TableCell>
                    <TableCell>{request.applicantName}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{request.serviceName}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(request.status)}>
                        {request.status.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {request.isPaid ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-amber-600" />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Recent Cases Table */}
      {cases.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-violet-600" />
              Active Cases
            </CardTitle>
            <CardDescription>
              Internal case workflow with SLA monitoring
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Case #</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>SLA Deadline</TableHead>
                  <TableHead>SLA</TableHead>
                  <TableHead>Escalated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cases.map(caseItem => (
                  <TableRow key={caseItem.id}>
                    <TableCell className="font-mono text-sm">{caseItem.caseNumber}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(caseItem.status)}>
                        {caseItem.status.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{caseItem.priority}</Badge>
                    </TableCell>
                    <TableCell>{formatDate(caseItem.slaDeadline)}</TableCell>
                    <TableCell>
                      {caseItem.slaBreached ? (
                        <Badge className="bg-red-100 text-red-700">Breached</Badge>
                      ) : (
                        <Badge className="bg-green-100 text-green-700">On Track</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {caseItem.isEscalated ? (
                        <Badge className="bg-orange-100 text-orange-700">Yes</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Audit Trail */}
      {auditLogs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scroll className="h-5 w-5 text-teal-600" />
              Audit Trail
            </CardTitle>
            <CardDescription>
              Append-only audit log — every action is recorded permanently
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {auditLogs.map(log => (
                <div key={log.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="p-1.5 bg-teal-100 rounded">
                    <FileCheck className="h-4 w-4 text-teal-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-xs">{log.action.replace(/_/g, ' ')}</Badge>
                      <span className="text-xs text-muted-foreground">{log.entityType}</span>
                    </div>
                    <p className="text-sm mt-1">{log.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      by {log.actorName} • {formatDate(log.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Architecture Diagram */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            System Architecture
          </CardTitle>
          <CardDescription>
            Civic / GovTech Suite layers and Commerce boundary
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Layer 1: Public */}
            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="h-4 w-4 text-emerald-600" />
                <span className="font-medium text-emerald-800">Public Layer</span>
              </div>
              <p className="text-sm text-emerald-700">
                Status tracking (no auth) • Public service catalogue • FOI exports
              </p>
            </div>
            
            {/* Layer 2: Citizen */}
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-800">Citizen Layer</span>
              </div>
              <p className="text-sm text-blue-700">
                Request submission • Document upload • Status tracking • Payment status (read-only)
              </p>
            </div>
            
            {/* Layer 3: Agency */}
            <div className="p-3 bg-violet-50 rounded-lg border border-violet-200">
              <div className="flex items-center gap-2 mb-2">
                <Landmark className="h-4 w-4 text-violet-600" />
                <span className="font-medium text-violet-800">Agency Layer</span>
              </div>
              <p className="text-sm text-violet-700">
                Case management • Inspections • Approvals • Staff workflows • Audit logging
              </p>
            </div>
            
            {/* Layer 4: Commerce Boundary */}
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-amber-600" />
                <span className="font-medium text-amber-800">Commerce Boundary</span>
              </div>
              <p className="text-sm text-amber-700">
                Billing facts only → Commerce handles invoicing, VAT, payments, accounting
              </p>
            </div>
          </div>

          {/* Commerce Boundary Notice */}
          <div className="mt-4 p-3 bg-gray-100 rounded-lg">
            <p className="text-sm text-gray-600">
              <strong>Commerce Boundary Compliance:</strong> The Civic Suite emits billing facts only. 
              All VAT calculation, invoice generation, payment processing, and accounting journal entries 
              are handled by the Commerce Suite.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Nigeria-First Design */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-emerald-600" />
            Nigeria-First GovTech Design
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-emerald-600" />
                <span className="font-medium">Identity References</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Not a National ID replacement. References only. Citizens control their identity.
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Scroll className="h-4 w-4 text-emerald-600" />
                <span className="font-medium">Append-Only Audit</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Every decision is logged permanently. FOI-ready. Regulator-safe. Tamper-evident.
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="h-4 w-4 text-emerald-600" />
                <span className="font-medium">Public Transparency</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Citizens track status without login. Progress visible. Trust verifiable.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <Link href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
          <Link href="/commerce-demo" className="hover:text-foreground transition-colors">Commerce Demo</Link>
          <Link href="/education-demo" className="hover:text-foreground transition-colors">Education Demo</Link>
          <Link href="/health-demo" className="hover:text-foreground transition-colors">Health Demo</Link>
          <Link href="/hospitality-demo" className="hover:text-foreground transition-colors">Hospitality Demo</Link>
        </div>
        <Badge variant="outline" className="text-xs">
          Platform Standardisation v2
        </Badge>
      </div>
    </div>
  )
}

// ============================================================================
// MAIN PAGE EXPORT
// ============================================================================

export default function CivicDemoPage() {
  return (
    <DemoModeProvider>
      <div className="min-h-screen bg-gray-50/50">
        <div className="container max-w-6xl mx-auto py-8 px-4">
          <Suspense fallback={
            <div className="flex items-center justify-center min-h-[400px]">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
          }>
            <CivicDemoContent />
          </Suspense>
        </div>
      </div>
    </DemoModeProvider>
  )
}
