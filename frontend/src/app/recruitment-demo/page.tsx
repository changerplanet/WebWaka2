'use client'

/**
 * RECRUITMENT SUITE DEMO PAGE
 * Platform Standardisation v2 - S4 Demo UI
 * 
 * Nigeria-First demo scenario: TalentBridge Africa Ltd, Lagos
 * A tech & professional services recruitment firm managing
 * multi-industry placements across Lagos.
 */

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Briefcase,
  Users,
  Calendar,
  FileCheck,
  UserPlus,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Building2,
  MapPin,
  BadgeCheck,
  Shield,
  DollarSign,
  Star,
  ChevronRight,
  ExternalLink,
  Play,
  Handshake,
  UserCheck,
  ClipboardList,
  Target
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
import { DemoOverlay } from '@/components/demo/DemoOverlay'
import { QuickStartBanner } from '@/components/demo/QuickStartBanner'
import { resolveQuickStart } from '@/lib/demo/quickstart'

// ============================================================================
// DEMO DATA: TALENTBRIDGE AFRICA LTD, LAGOS
// ============================================================================

const DEMO_SCENARIO = {
  company: 'TalentBridge Africa Ltd',
  location: 'Lagos, Nigeria',
  industry: 'Tech & Professional Services Recruitment',
  description: 'A leading recruitment firm specializing in technology, finance, and professional services placements across Nigeria and West Africa.',
  stats: {
    openRoles: 12,
    activeCandidates: 156,
    scheduledInterviews: 24,
    pendingOffers: 8
  }
}

const DEMO_JOBS = [
  {
    id: 'JOB-001',
    title: 'Senior Software Engineer',
    client: 'Paystack (Stripe)',
    location: 'Lagos, Nigeria',
    type: 'Full-time',
    salary: '₦18,000,000 - ₦25,000,000/year',
    applicants: 45,
    status: 'OPEN',
    postedDays: 5,
    urgency: 'High'
  },
  {
    id: 'JOB-002',
    title: 'Product Manager',
    client: 'Flutterwave',
    location: 'Lagos, Nigeria',
    type: 'Full-time',
    salary: '₦15,000,000 - ₦22,000,000/year',
    applicants: 32,
    status: 'OPEN',
    postedDays: 8,
    urgency: 'Medium'
  },
  {
    id: 'JOB-003',
    title: 'Financial Analyst',
    client: 'GTBank',
    location: 'Victoria Island, Lagos',
    type: 'Full-time',
    salary: '₦8,000,000 - ₦12,000,000/year',
    applicants: 28,
    status: 'INTERVIEWING',
    postedDays: 12,
    urgency: 'Medium'
  },
  {
    id: 'JOB-004',
    title: 'DevOps Engineer',
    client: 'Andela',
    location: 'Remote (Nigeria)',
    type: 'Contract',
    salary: '$4,000 - $6,000/month',
    applicants: 18,
    status: 'OFFER_STAGE',
    postedDays: 20,
    urgency: 'Low'
  },
  {
    id: 'JOB-005',
    title: 'HR Business Partner',
    client: 'MTN Nigeria',
    location: 'Ikoyi, Lagos',
    type: 'Full-time',
    salary: '₦12,000,000 - ₦16,000,000/year',
    applicants: 22,
    status: 'OPEN',
    postedDays: 3,
    urgency: 'High'
  }
]

const DEMO_CANDIDATES = [
  {
    id: 'CAN-001',
    name: 'Adaeze Okonkwo',
    role: 'Senior Software Engineer',
    client: 'Paystack (Stripe)',
    stage: 'FINAL_INTERVIEW',
    rating: 4.8,
    appliedDays: 4,
    source: 'LinkedIn'
  },
  {
    id: 'CAN-002',
    name: 'Olumide Adeyemi',
    role: 'Product Manager',
    client: 'Flutterwave',
    stage: 'OFFER_PENDING',
    rating: 4.5,
    appliedDays: 7,
    source: 'Referral'
  },
  {
    id: 'CAN-003',
    name: 'Chidinma Eze',
    role: 'Financial Analyst',
    client: 'GTBank',
    stage: 'TECHNICAL_INTERVIEW',
    rating: 4.2,
    appliedDays: 10,
    source: 'Indeed Nigeria'
  },
  {
    id: 'CAN-004',
    name: 'Tunde Bakare',
    role: 'DevOps Engineer',
    client: 'Andela',
    stage: 'OFFER_ACCEPTED',
    rating: 4.9,
    appliedDays: 18,
    source: 'TalentPool'
  },
  {
    id: 'CAN-005',
    name: 'Amara Nwosu',
    role: 'HR Business Partner',
    client: 'MTN Nigeria',
    stage: 'SCREENING',
    rating: 4.0,
    appliedDays: 2,
    source: 'Direct Application'
  }
]

const DEMO_INTERVIEWS = [
  {
    id: 'INT-001',
    candidate: 'Adaeze Okonkwo',
    role: 'Senior Software Engineer',
    client: 'Paystack',
    type: 'Final Round',
    date: 'Today, 2:00 PM',
    interviewer: 'CTO - Shola Akinlade',
    status: 'SCHEDULED'
  },
  {
    id: 'INT-002',
    candidate: 'Chidinma Eze',
    role: 'Financial Analyst',
    client: 'GTBank',
    type: 'Technical Interview',
    date: 'Tomorrow, 10:00 AM',
    interviewer: 'Head of Treasury',
    status: 'CONFIRMED'
  },
  {
    id: 'INT-003',
    candidate: 'Fatima Ibrahim',
    role: 'Product Manager',
    client: 'Flutterwave',
    type: 'HR Screen',
    date: 'Tomorrow, 3:00 PM',
    interviewer: 'HR Manager',
    status: 'PENDING_CONFIRMATION'
  }
]

const DEMO_PIPELINE = {
  applied: 45,
  screening: 32,
  interview: 24,
  offer: 8,
  placed: 5
}

const DEMO_PLACEMENTS = [
  {
    id: 'PLC-001',
    candidate: 'Tunde Bakare',
    role: 'DevOps Engineer',
    client: 'Andela',
    placementFee: '₦2,400,000',
    startDate: 'Feb 1, 2026',
    status: 'CONFIRMED'
  },
  {
    id: 'PLC-002',
    candidate: 'Emeka Obi',
    role: 'Backend Developer',
    client: 'Kuda Bank',
    placementFee: '₦1,800,000',
    startDate: 'Jan 15, 2026',
    status: 'STARTED'
  }
]

// ============================================================================
// QUICK START ROLE CARDS
// ============================================================================

const ROLE_CARDS = [
  {
    role: 'recruiter',
    title: 'Recruiter',
    description: 'Source candidates, manage pipelines, close placements',
    icon: UserPlus,
    color: 'bg-blue-500'
  },
  {
    role: 'hiringManager',
    title: 'Hiring Manager',
    description: 'Review candidates, conduct interviews, approve offers',
    icon: UserCheck,
    color: 'bg-green-500'
  },
  {
    role: 'candidate',
    title: 'Candidate',
    description: 'Apply for roles, track applications, receive offers',
    icon: Briefcase,
    color: 'bg-orange-500'
  },
  {
    role: 'recruitmentAuditor',
    title: 'Recruitment Auditor',
    description: 'Audit placements, verify fees, check Commerce handoff',
    icon: ClipboardList,
    color: 'bg-purple-500'
  }
]

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getStageColor(stage: string): string {
  const colors: Record<string, string> = {
    'APPLIED': 'bg-gray-100 text-gray-800',
    'SCREENING': 'bg-blue-100 text-blue-800',
    'TECHNICAL_INTERVIEW': 'bg-yellow-100 text-yellow-800',
    'FINAL_INTERVIEW': 'bg-orange-100 text-orange-800',
    'OFFER_PENDING': 'bg-purple-100 text-purple-800',
    'OFFER_ACCEPTED': 'bg-green-100 text-green-800',
    'PLACED': 'bg-emerald-100 text-emerald-800'
  }
  return colors[stage] || 'bg-gray-100 text-gray-800'
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    'OPEN': 'bg-green-100 text-green-800',
    'INTERVIEWING': 'bg-blue-100 text-blue-800',
    'OFFER_STAGE': 'bg-purple-100 text-purple-800',
    'FILLED': 'bg-gray-100 text-gray-800',
    'SCHEDULED': 'bg-blue-100 text-blue-800',
    'CONFIRMED': 'bg-green-100 text-green-800',
    'PENDING_CONFIRMATION': 'bg-yellow-100 text-yellow-800'
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

function formatStageName(stage: string): string {
  return stage.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
}

// ============================================================================
// MAIN DEMO CONTENT
// ============================================================================

function RecruitmentDemoContent() {
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
    router.push('/recruitment-demo')
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
      <section className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 text-white">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
        <div className="relative max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* S5 Badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
              <Badge variant="secondary" className="bg-green-500 text-white">
                S5 Narrative Ready
              </Badge>
              <span className="text-sm text-blue-100">Platform Standardisation v2</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">
              Recruitment Suite
            </h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto mb-8">
              End-to-end recruitment and talent acquisition for Nigerian businesses.
              From job posting to placement — with full Commerce integration.
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
                NGN Fee Tracking
              </Badge>
              <Badge variant="outline" className="border-white/30 text-white bg-white/10">
                <Handshake className="h-3 w-3 mr-1" />
                Commerce Boundary
              </Badge>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50">
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
              Select a perspective to explore the Recruitment Suite
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {ROLE_CARDS.map((card) => (
              <Link
                key={card.role}
                href={`/recruitment-demo?quickstart=${card.role}`}
                className="block"
              >
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-blue-300">
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
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Building2 className="h-8 w-8 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
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
                  You're viewing sample data from TalentBridge Africa Ltd. All data is fictional and for demonstration purposes only.
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
                  <p className="text-sm text-gray-600">Open Roles</p>
                  <p className="text-3xl font-bold text-gray-900">{DEMO_SCENARIO.stats.openRoles}</p>
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
                  <p className="text-sm text-gray-600">Active Candidates</p>
                  <p className="text-3xl font-bold text-gray-900">{DEMO_SCENARIO.stats.activeCandidates}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Scheduled Interviews</p>
                  <p className="text-3xl font-bold text-gray-900">{DEMO_SCENARIO.stats.scheduledInterviews}</p>
                </div>
                <div className="p-3 bg-orange-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending Offers</p>
                  <p className="text-3xl font-bold text-gray-900">{DEMO_SCENARIO.stats.pendingOffers}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <FileCheck className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Active Job Listings */}
      <section className="max-w-7xl mx-auto px-4 pb-12 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-blue-600" />
              Active Job Listings
            </CardTitle>
            <CardDescription>
              Current open positions being recruited for Nigerian tech and professional services
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job Title</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Salary Range</TableHead>
                  <TableHead>Applicants</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {DEMO_JOBS.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{job.title}</p>
                        <p className="text-xs text-gray-500">{job.type} • Posted {job.postedDays}d ago</p>
                      </div>
                    </TableCell>
                    <TableCell>{job.client}</TableCell>
                    <TableCell>{job.location}</TableCell>
                    <TableCell className="text-sm">{job.salary}</TableCell>
                    <TableCell>{job.applicants}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(job.status)}>
                        {formatStageName(job.status)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      {/* Candidate Pipeline */}
      <section className="max-w-7xl mx-auto px-4 pb-12 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-green-600" />
              Candidate Pipeline
            </CardTitle>
            <CardDescription>
              Track candidates from application to placement
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-2 mb-8">
              {Object.entries(DEMO_PIPELINE).map(([stage, count], index, arr) => (
                <div key={stage} className="flex items-center flex-1">
                  <div className="flex-1 text-center">
                    <div className="text-3xl font-bold text-gray-900">{count}</div>
                    <div className="text-sm text-gray-600 capitalize">{stage}</div>
                  </div>
                  {index < arr.length - 1 && (
                    <ChevronRight className="h-6 w-6 text-gray-300 flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>

            {/* Recent Candidates */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Candidate</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Source</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {DEMO_CANDIDATES.map((candidate) => (
                  <TableRow key={candidate.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{candidate.name}</p>
                        <p className="text-xs text-gray-500">Applied {candidate.appliedDays}d ago</p>
                      </div>
                    </TableCell>
                    <TableCell>{candidate.role}</TableCell>
                    <TableCell>{candidate.client}</TableCell>
                    <TableCell>
                      <Badge className={getStageColor(candidate.stage)}>
                        {formatStageName(candidate.stage)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        <span>{candidate.rating}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">{candidate.source}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      {/* Interview Schedule */}
      <section className="max-w-7xl mx-auto px-4 pb-12 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-orange-600" />
              Interview Schedule
            </CardTitle>
            <CardDescription>
              Upcoming interviews and assessments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {DEMO_INTERVIEWS.map((interview) => (
                <div key={interview.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Calendar className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-medium">{interview.candidate}</p>
                      <p className="text-sm text-gray-600">
                        {interview.role} at {interview.client}
                      </p>
                      <p className="text-sm text-gray-500">
                        {interview.type} • {interview.interviewer}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{interview.date}</p>
                    <Badge className={getStatusColor(interview.status)}>
                      {formatStageName(interview.status)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Placements & Fee Summary */}
      <section className="max-w-7xl mx-auto px-4 pb-12 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
              Recent Placements
            </CardTitle>
            <CardDescription>
              Successful placements with fee facts emitted to Commerce
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Candidate</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Placement Fee (Fact)</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {DEMO_PLACEMENTS.map((placement) => (
                  <TableRow key={placement.id}>
                    <TableCell className="font-medium">{placement.candidate}</TableCell>
                    <TableCell>{placement.role}</TableCell>
                    <TableCell>{placement.client}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                        {placement.placementFee}
                      </Badge>
                    </TableCell>
                    <TableCell>{placement.startDate}</TableCell>
                    <TableCell>
                      <Badge className="bg-emerald-100 text-emerald-800">
                        {placement.status}
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
        <Card className="border-2 border-dashed border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Handshake className="h-5 w-5 text-blue-600" />
              Commerce Boundary Architecture
            </CardTitle>
            <CardDescription>
              Recruitment emits fee facts. Commerce handles invoicing and payment collection.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              {/* Recruitment Module */}
              <div className="p-6 bg-white rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <h4 className="font-semibold">Recruitment Suite</h4>
                </div>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Job Posting & Management
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Candidate Pipeline
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Interview Scheduling
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Offer Management
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Placement Fee Facts
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
                  <p className="text-xs text-gray-400">(Placement Amount, Client, Date)</p>
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
                    VAT Calculation
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
                <strong>Boundary Rule:</strong> Recruitment creates placement fee facts (amount, client, date). 
                Commerce handles invoice generation, payment collection, VAT calculation, and accounting.
                Recruitment NEVER handles money directly.
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
                <h4 className="font-semibold mb-2">Market Context</h4>
                <ul className="space-y-1">
                  <li>• NGN salary ranges for local placements</li>
                  <li>• USD rates for remote/international roles</li>
                  <li>• Lagos-centric with national expansion</li>
                  <li>• Tech, Finance, Professional Services focus</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Compliance</h4>
                <ul className="space-y-1">
                  <li>• PAYE withholding awareness</li>
                  <li>• NHF/NSITF contribution tracking</li>
                  <li>• Work permit status for expats</li>
                  <li>• Local labor law compliance</li>
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

function RecruitmentDemoInner() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    }>
      <RecruitmentDemoContent />
    </Suspense>
  )
}

export default function RecruitmentDemoPage() {
  return (
    <DemoModeProvider>
      <RecruitmentDemoInner />
    </DemoModeProvider>
  )
}
