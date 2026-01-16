'use client'

/**
 * LEGAL PRACTICE SUITE DEMO PAGE
 * Platform Standardisation v2 - S4 Demo UI
 * 
 * Nigeria-First demo scenario: Adebayo & Partners, Lagos
 * A mid-sized commercial law firm handling civil, corporate, 
 * and banking matters across Nigerian courts.
 */

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Scale,
  Briefcase,
  Clock,
  Calendar,
  DollarSign,
  FileText,
  Users,
  AlertTriangle,
  ArrowRight,
  Building2,
  MapPin,
  BadgeCheck,
  Shield,
  Gavel,
  CheckCircle,
  UserCheck,
  ClipboardList,
  BookOpen,
  Timer,
  Wallet,
  Play,
  ChevronRight,
  ExternalLink,
  Star,
  AlertCircle,
  Handshake
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { DemoModeProvider, useDemoMode } from '@/lib/demo/context'
import { DemoOverlay, DemoGate } from '@/components/demo'
import { QuickStartBanner } from '@/components/demo/QuickStartBanner'
import { resolveQuickStart } from '@/lib/demo/quickstart'

// ============================================================================
// DEMO DATA: ADEBAYO & PARTNERS, LAGOS
// ============================================================================

const DEMO_SCENARIO = {
  company: 'Adebayo & Partners',
  location: 'Victoria Island, Lagos, Nigeria',
  industry: 'Commercial Law Firm',
  description: 'A mid-sized commercial law firm specializing in civil litigation, corporate law, and banking disputes across Nigerian courts. Established practice serving corporate and individual clients.',
  stats: {
    activeMatters: 28,
    billableHours: 285,
    pendingDeadlines: 12,
    retainerBalance: 12500000
  }
}

const DEMO_MATTERS = [
  {
    id: 'MAT-2026-0001',
    title: 'Chief Okafor v. ABC Construction Ltd',
    type: 'CIVIL',
    client: 'Chief Emeka Okafor',
    court: 'Federal High Court, Lagos',
    suitNumber: 'FHC/L/CS/245/2026',
    status: 'ACTIVE',
    leadLawyer: 'Barr. Adaeze Nwosu',
    agreedFee: '₦5,000,000',
    nextDeadline: 'Jan 15, 2026'
  },
  {
    id: 'MAT-2026-0002',
    title: 'Zenith Bank v. NaijaTech Solutions',
    type: 'BANKING',
    client: 'Zenith Bank Plc',
    court: 'Federal High Court, Lagos',
    suitNumber: 'FHC/L/CS/301/2026',
    status: 'ACTIVE',
    leadLawyer: 'Barr. Emeka Obi',
    agreedFee: '₦8,000,000',
    nextDeadline: 'Jan 18, 2026'
  },
  {
    id: 'MAT-2026-0003',
    title: 'Adebayo Divorce Proceedings',
    type: 'FAMILY',
    client: 'Mr. Tunde Adebayo',
    court: 'Lagos High Court, Ikeja',
    suitNumber: 'LD/1234/2025',
    status: 'ACTIVE',
    leadLawyer: 'Barr. Funmi Adeola',
    agreedFee: '₦2,000,000',
    nextDeadline: 'Jan 22, 2026'
  },
  {
    id: 'MAT-2026-0004',
    title: 'Dangote Industries - Trademark Dispute',
    type: 'CORPORATE',
    client: 'Dangote Industries Ltd',
    court: 'Federal High Court, Abuja',
    suitNumber: 'FHC/ABJ/IP/88/2025',
    status: 'ACTIVE',
    leadLawyer: 'Barr. Adaeze Nwosu',
    agreedFee: '₦15,000,000',
    nextDeadline: 'Jan 25, 2026'
  },
  {
    id: 'MAT-2025-0089',
    title: 'Land Title Dispute - Lekki',
    type: 'PROPERTY',
    client: 'Dr. Ngozi Eze',
    court: 'Lagos High Court, Lagos Island',
    suitNumber: 'LD/567/2025',
    status: 'CLOSED',
    leadLawyer: 'Barr. Chidi Okoro',
    agreedFee: '₦3,500,000',
    nextDeadline: 'Settled'
  }
]

const DEMO_TIME_ENTRIES = [
  {
    id: 'TE-001',
    matter: 'Chief Okafor v. ABC Construction',
    lawyer: 'Barr. Adaeze Nwosu',
    date: 'Jan 6, 2026',
    hours: 4.5,
    description: 'Preparation of witness statements',
    rate: '₦50,000/hr',
    amount: '₦225,000',
    status: 'UNBILLED'
  },
  {
    id: 'TE-002',
    matter: 'Zenith Bank v. NaijaTech',
    lawyer: 'Barr. Emeka Obi',
    date: 'Jan 6, 2026',
    hours: 3.0,
    description: 'Court appearance - Motion for Summary Judgment',
    rate: '₦60,000/hr',
    amount: '₦180,000',
    status: 'BILLED'
  },
  {
    id: 'TE-003',
    matter: 'Dangote - Trademark',
    lawyer: 'Barr. Adaeze Nwosu',
    date: 'Jan 5, 2026',
    hours: 6.0,
    description: 'Research on IP precedents and drafting brief',
    rate: '₦50,000/hr',
    amount: '₦300,000',
    status: 'UNBILLED'
  },
  {
    id: 'TE-004',
    matter: 'Adebayo Divorce',
    lawyer: 'Barr. Funmi Adeola',
    date: 'Jan 5, 2026',
    hours: 2.5,
    description: 'Client meeting and settlement negotiation',
    rate: '₦30,000/hr',
    amount: '₦75,000',
    status: 'UNBILLED'
  }
]

const DEMO_DEADLINES = [
  {
    id: 'DL-001',
    matter: 'Chief Okafor v. ABC Construction',
    type: 'FILING',
    description: 'File Reply to Statement of Defence',
    court: 'Federal High Court, Lagos',
    dueDate: 'Jan 15, 2026',
    daysLeft: 8,
    priority: 'HIGH',
    status: 'PENDING'
  },
  {
    id: 'DL-002',
    matter: 'Zenith Bank v. NaijaTech',
    type: 'COURT_DATE',
    description: 'Hearing on Interlocutory Application',
    court: 'Federal High Court, Lagos',
    dueDate: 'Jan 18, 2026',
    daysLeft: 11,
    priority: 'HIGH',
    status: 'CONFIRMED'
  },
  {
    id: 'DL-003',
    matter: 'Adebayo Divorce',
    type: 'COURT_DATE',
    description: 'Final Hearing',
    court: 'Lagos High Court, Ikeja',
    dueDate: 'Jan 22, 2026',
    daysLeft: 15,
    priority: 'MEDIUM',
    status: 'PENDING'
  },
  {
    id: 'DL-004',
    matter: 'Dangote - Trademark',
    type: 'FILING',
    description: 'Submit Final Written Address',
    court: 'Federal High Court, Abuja',
    dueDate: 'Jan 25, 2026',
    daysLeft: 18,
    priority: 'MEDIUM',
    status: 'PENDING'
  },
  {
    id: 'DL-005',
    matter: 'Chief Okafor v. ABC Construction',
    type: 'SERVICE',
    description: 'Service of Court Processes on Defendant',
    court: 'Federal High Court, Lagos',
    dueDate: 'Jan 10, 2026',
    daysLeft: 3,
    priority: 'URGENT',
    status: 'PENDING'
  }
]

const DEMO_RETAINERS = [
  {
    id: 'RET-001',
    client: 'Dangote Industries Ltd',
    matter: 'Trademark Dispute',
    balance: '₦8,500,000',
    initialAmount: '₦10,000,000',
    status: 'ACTIVE',
    lastActivity: 'Jan 5, 2026'
  },
  {
    id: 'RET-002',
    client: 'Zenith Bank Plc',
    matter: 'NaijaTech Recovery',
    balance: '₦2,800,000',
    initialAmount: '₦5,000,000',
    status: 'ACTIVE',
    lastActivity: 'Jan 6, 2026'
  },
  {
    id: 'RET-003',
    client: 'Chief Emeka Okafor',
    matter: 'ABC Construction',
    balance: '₦750,000',
    initialAmount: '₦2,000,000',
    status: 'LOW_BALANCE',
    lastActivity: 'Jan 4, 2026'
  },
  {
    id: 'RET-004',
    client: 'Mr. Tunde Adebayo',
    matter: 'Divorce Proceedings',
    balance: '₦450,000',
    initialAmount: '₦1,000,000',
    status: 'LOW_BALANCE',
    lastActivity: 'Jan 5, 2026'
  }
]

// ============================================================================
// QUICK START ROLE CARDS
// ============================================================================

const ROLE_CARDS = [
  {
    role: 'legalClient',
    title: 'Client',
    description: 'Track your matters, view billing, monitor deadlines',
    icon: UserCheck,
    color: 'bg-blue-500'
  },
  {
    role: 'lawyer',
    title: 'Lawyer',
    description: 'Manage cases, track time, handle filings',
    icon: Scale,
    color: 'bg-green-500'
  },
  {
    role: 'firmAdmin',
    title: 'Firm Admin',
    description: 'Oversee practice, manage team, track retainers',
    icon: Briefcase,
    color: 'bg-purple-500'
  },
  {
    role: 'legalAuditor',
    title: 'Legal Auditor',
    description: 'Verify fees, audit compliance, check Commerce boundary',
    icon: ClipboardList,
    color: 'bg-orange-500'
  }
]

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getMatterTypeColor(type: string): string {
  const colors: Record<string, string> = {
    'CIVIL': 'bg-blue-100 text-blue-800',
    'BANKING': 'bg-green-100 text-green-800',
    'FAMILY': 'bg-pink-100 text-pink-800',
    'CORPORATE': 'bg-purple-100 text-purple-800',
    'PROPERTY': 'bg-amber-100 text-amber-800',
    'CRIMINAL': 'bg-red-100 text-red-800'
  }
  return colors[type] || 'bg-gray-100 text-gray-800'
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    'ACTIVE': 'bg-green-100 text-green-800',
    'CLOSED': 'bg-gray-100 text-gray-800',
    'PENDING': 'bg-yellow-100 text-yellow-800',
    'CONFIRMED': 'bg-blue-100 text-blue-800',
    'UNBILLED': 'bg-orange-100 text-orange-800',
    'BILLED': 'bg-green-100 text-green-800',
    'LOW_BALANCE': 'bg-red-100 text-red-800'
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    'URGENT': 'bg-red-100 text-red-800',
    'HIGH': 'bg-orange-100 text-orange-800',
    'MEDIUM': 'bg-yellow-100 text-yellow-800',
    'LOW': 'bg-green-100 text-green-800'
  }
  return colors[priority] || 'bg-gray-100 text-gray-800'
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0
  }).format(amount)
}

// ============================================================================
// MAIN DEMO CONTENT
// ============================================================================

function LegalDemoContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const quickstartParam = searchParams.get('quickstart')
  const quickStartResult = resolveQuickStart(quickstartParam)
  
  // Quick Start state
  const [quickStartConfig, setQuickStartConfig] = useState<typeof quickStartResult.config>(
    quickStartResult.isActive ? quickStartResult.config : null
  )
  
  // Update quickstart when URL changes
  useEffect(() => {
    const result = resolveQuickStart(quickstartParam)
    setQuickStartConfig(result.isActive ? result.config : null)
  }, [quickstartParam])
  
  // Quick Start handlers
  const handleSwitchRole = () => {
    router.push('/legal-demo')
  }
  
  const handleDismissQuickStart = () => {
    router.push('/commerce-demo')
  }
  
  const demoContext = useDemoMode()
  const isInDemoMode = demoContext?.isActive ?? false

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Quick Start Banner */}
      {quickStartConfig && (
        <QuickStartBanner
          config={quickStartConfig}
          onSwitchRole={handleSwitchRole}
          onDismiss={handleDismissQuickStart}
        />
      )}

      {/* Demo Overlay for guided tours */}
      <DemoOverlay />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 text-white">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
        <div className="relative max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* S5 Badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
              <Badge variant="secondary" className="bg-green-500 text-white">
                S5 Narrative Ready
              </Badge>
              <span className="text-sm text-slate-300">Platform Standardisation v2</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">
              Legal Practice Suite
            </h1>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto mb-8">
              Complete practice management for Nigerian law firms.
              Matters, time tracking, billing, deadlines — with Commerce integration.
            </p>

            {/* Nigeria-First Badges */}
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              <Badge variant="outline" className="border-white/30 text-white bg-white/10">
                <Shield className="h-3 w-3 mr-1" />
                Capability Guarded
              </Badge>
              <Badge variant="outline" className="border-white/30 text-white bg-white/10">
                <MapPin className="h-3 w-3 mr-1" />
                Nigeria-First
              </Badge>
              <Badge variant="outline" className="border-white/30 text-white bg-white/10">
                <DollarSign className="h-3 w-3 mr-1" />
                NGN Billing
              </Badge>
              <Badge variant="outline" className="border-white/30 text-white bg-white/10">
                <Handshake className="h-3 w-3 mr-1" />
                Commerce Boundary
              </Badge>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100">
                <Play className="h-4 w-4 mr-2" />
                Start Demo Tour
              </Button>
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                View Documentation
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Start Role Selector */}
      {!quickStartConfig && (
        <section className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Quick Start: Choose Your Role
            </h2>
            <p className="text-gray-600">
              Select a perspective to explore the Legal Practice Suite
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {ROLE_CARDS.map((card) => (
              <Link
                key={card.role}
                href={`/legal-demo?quickstart=${card.role}`}
                className="block"
              >
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-slate-300">
                  <CardContent className="p-6 text-center">
                    <div className={`w-12 h-12 rounded-full ${card.color} flex items-center justify-center mx-auto mb-4`}>
                      <card.icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">{card.title}</h3>
                    <p className="text-sm text-gray-600">{card.description}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Demo Scenario Banner */}
      <section className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <Card className="bg-gradient-to-r from-slate-50 to-slate-100 border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-slate-200 rounded-lg">
                <Scale className="h-8 w-8 text-slate-700" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="bg-slate-100 text-slate-800 border-slate-300">
                    Demo Scenario
                  </Badge>
                </div>
                <h3 className="text-xl font-bold text-gray-900">{DEMO_SCENARIO.company}</h3>
                <p className="text-gray-600 flex items-center gap-1 mb-2">
                  <MapPin className="h-4 w-4" />
                  {DEMO_SCENARIO.location} • {DEMO_SCENARIO.industry}
                </p>
                <p className="text-sm text-gray-700">{DEMO_SCENARIO.description}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Demo Preview Mode Notice */}
      <section className="max-w-7xl mx-auto px-4 pb-8 sm:px-6 lg:px-8">
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <div>
                <p className="font-medium text-amber-800">Demo Preview Mode</p>
                <p className="text-sm text-amber-700">
                  You're viewing sample data from Adebayo & Partners. All data is fictional and for demonstration purposes only.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Stats Cards */}
      <section className="max-w-7xl mx-auto px-4 pb-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Matters</p>
                  <p className="text-3xl font-bold text-gray-900">{DEMO_SCENARIO.stats.activeMatters}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Briefcase className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Billable Hours</p>
                  <p className="text-3xl font-bold text-gray-900">{DEMO_SCENARIO.stats.billableHours}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <Clock className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending Deadlines</p>
                  <p className="text-3xl font-bold text-gray-900">{DEMO_SCENARIO.stats.pendingDeadlines}</p>
                </div>
                <div className="p-3 bg-red-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Retainer Balance</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(DEMO_SCENARIO.stats.retainerBalance)}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Wallet className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Active Matters */}
      <section className="max-w-7xl mx-auto px-4 pb-12 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-blue-600" />
              Active Matters
            </CardTitle>
            <CardDescription>
              Current cases and legal matters being handled by the firm
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Matter</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Court</TableHead>
                  <TableHead>Lead Lawyer</TableHead>
                  <TableHead>Next Deadline</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {DEMO_MATTERS.map((matter) => (
                  <TableRow key={matter.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{matter.title}</p>
                        <p className="text-xs text-gray-500">{matter.id} • {matter.suitNumber}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getMatterTypeColor(matter.type)}>
                        {matter.type}
                      </Badge>
                    </TableCell>
                    <TableCell>{matter.client}</TableCell>
                    <TableCell className="text-sm">{matter.court}</TableCell>
                    <TableCell>{matter.leadLawyer}</TableCell>
                    <TableCell>{matter.nextDeadline}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(matter.status)}>
                        {matter.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      {/* Time Entries & Deadlines Grid */}
      <section className="max-w-7xl mx-auto px-4 pb-12 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Time Entries */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-green-600" />
                Recent Time Entries
              </CardTitle>
              <CardDescription>
                Billable hours tracked this week
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {DEMO_TIME_ENTRIES.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{entry.matter}</p>
                      <p className="text-xs text-gray-600">{entry.lawyer} • {entry.date}</p>
                      <p className="text-xs text-gray-500 mt-1">{entry.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{entry.hours}h</p>
                      <p className="text-sm text-gray-600">{entry.amount}</p>
                      <Badge className={getStatusColor(entry.status)} variant="outline">
                        {entry.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Deadlines */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-red-600" />
                Upcoming Deadlines
              </CardTitle>
              <CardDescription>
                Court dates and filing deadlines
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {DEMO_DEADLINES.map((deadline) => (
                  <div key={deadline.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={getPriorityColor(deadline.priority)} variant="outline">
                          {deadline.priority}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {deadline.type.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="font-medium text-sm">{deadline.description}</p>
                      <p className="text-xs text-gray-600">{deadline.matter}</p>
                      <p className="text-xs text-gray-500">{deadline.court}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm">{deadline.dueDate}</p>
                      <p className={`text-xs ${deadline.daysLeft <= 3 ? 'text-red-600 font-bold' : 'text-gray-600'}`}>
                        {deadline.daysLeft} days left
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Retainer Accounts */}
      <section className="max-w-7xl mx-auto px-4 pb-12 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-purple-600" />
              Retainer Accounts
            </CardTitle>
            <CardDescription>
              Client retainer balances and fee tracking
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Matter</TableHead>
                  <TableHead>Initial Retainer</TableHead>
                  <TableHead>Current Balance</TableHead>
                  <TableHead>Last Activity</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {DEMO_RETAINERS.map((retainer) => (
                  <TableRow key={retainer.id}>
                    <TableCell className="font-medium">{retainer.client}</TableCell>
                    <TableCell>{retainer.matter}</TableCell>
                    <TableCell>{retainer.initialAmount}</TableCell>
                    <TableCell className="font-semibold">{retainer.balance}</TableCell>
                    <TableCell>{retainer.lastActivity}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(retainer.status)}>
                        {retainer.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      {/* Commerce Boundary Architecture */}
      <section className="max-w-7xl mx-auto px-4 pb-12 sm:px-6 lg:px-8">
        <Card className="border-2 border-dashed border-slate-200 bg-slate-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Handshake className="h-5 w-5 text-slate-600" />
              Commerce Boundary Architecture
            </CardTitle>
            <CardDescription>
              Legal Practice emits fee facts. Commerce handles invoicing and payment collection.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              {/* Legal Practice Module */}
              <div className="p-6 bg-white rounded-lg border border-slate-200">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-slate-100 rounded-lg">
                    <Scale className="h-5 w-5 text-slate-600" />
                  </div>
                  <h4 className="font-semibold">Legal Practice Suite</h4>
                </div>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Matter Management
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Time Entry Tracking
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Retainer Management
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Court Deadlines
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Fee & Disbursement Facts
                  </li>
                </ul>
              </div>

              {/* Arrow */}
              <div className="flex items-center justify-center">
                <div className="text-center">
                  <div className="flex items-center gap-2 text-gray-400">
                    <div className="h-0.5 w-8 bg-gray-300" />
                    <ArrowRight className="h-6 w-6" />
                    <div className="h-0.5 w-8 bg-gray-300" />
                  </div>
                  <p className="text-sm text-gray-500 mt-2">Fee Facts</p>
                  <p className="text-xs text-gray-400">(Billable Hours, Disbursements)</p>
                </div>
              </div>

              {/* Commerce Module */}
              <div className="p-6 bg-white rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <DollarSign className="h-5 w-5 text-green-600" />
                  </div>
                  <h4 className="font-semibold">Commerce Suite</h4>
                </div>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Invoice Generation
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Payment Collection
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    VAT Calculation (7.5%)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Revenue Recognition
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Accounting Journals
                  </li>
                </ul>
              </div>
            </div>

            {/* Boundary Rule */}
            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                <strong>Boundary Rule:</strong> Legal Practice creates fee facts (billable hours, disbursements, retainer usage). 
                Commerce handles invoice generation, payment collection, VAT calculation, and accounting.
                Legal Practice NEVER processes payments directly.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Nigeria-First Design Notes */}
      <section className="max-w-7xl mx-auto px-4 pb-12 sm:px-6 lg:px-8">
        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <MapPin className="h-5 w-5" />
              Nigeria-First Design Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-green-800">
              <div>
                <h4 className="font-semibold mb-2">Legal Context</h4>
                <ul className="space-y-1">
                  <li>• Nigerian courts (FHC, High Courts, CoA, NIC)</li>
                  <li>• Retainer-first billing model (common practice)</li>
                  <li>• NGN currency with ₦ symbol throughout</li>
                  <li>• Manual court filing tracking (no e-filing)</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Practice Areas</h4>
                <ul className="space-y-1">
                  <li>• Civil Litigation & Debt Recovery</li>
                  <li>• Banking & Financial Disputes</li>
                  <li>• Corporate & Commercial Law</li>
                  <li>• Family Law & Property Disputes</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 border-t">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link 
                href="/commerce-demo" 
                className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
              >
                <ArrowRight className="h-4 w-4 rotate-180" />
                Back to Commerce Demo
              </Link>
              <span className="text-gray-300">|</span>
              <span className="text-sm text-gray-500">
                Platform Standardisation v2
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                Demo / Sample Data
              </Badge>
              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                S4-S5 Complete
              </Badge>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

// ============================================================================
// PAGE WRAPPER WITH PROVIDERS
// ============================================================================

function LegalDemoInner() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600" />
      </div>
    }>
      <LegalDemoContent />
    </Suspense>
  )
}

export default function LegalDemoPage() {
  return (
    <DemoGate>
      <DemoModeProvider>
        <LegalDemoInner />
      </DemoModeProvider>
    </DemoGate>
  )
}
