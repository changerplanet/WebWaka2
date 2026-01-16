'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { 
  Landmark,
  Users,
  Vote,
  Megaphone,
  HandCoins,
  MapPin,
  Calendar,
  FileText,
  Shield,
  Building2,
  UserCircle,
  Banknote,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Play,
  Eye,
  Clock,
  TrendingUp,
  FileSearch,
  Globe,
  MessageSquare,
  ClipboardList,
  UserPlus,
  Target,
  Flag,
  Scale,
  BookOpen,
  Radio,
  Newspaper
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { QuickStartBanner, DemoGate } from '@/components/demo'
import { resolveQuickStart } from '@/lib/demo/quickstart'

// Demo Scenario - Lagos State Assembly Campaign
const DEMO_SCENARIO = {
  candidate: 'Hon. Akinwale Adeyemi',
  office: 'Lagos State House of Assembly',
  constituency: 'Surulere I',
  party: 'Progressive People\'s Party (PPP)',
  partyAbbr: 'PPP',
  location: 'Surulere LGA, Lagos State, Nigeria',
  electionStage: 'Primary Completed • General Election Upcoming',
}

// Jurisdiction Hierarchy
const JURISDICTION = {
  federal: 'Nigeria',
  state: 'Lagos State',
  lga: 'Surulere LGA',
  ward: 'Ward 03',
}

// Demo Stats
const DEMO_STATS = {
  registeredVolunteers: 847,
  activeOutreachEvents: 12,
  manifestoVersions: 3,
  openPetitions: 7,
  partyMembers: 2340,
  donationsRecorded: 14,
  expensesRecorded: 11,
  totalVotesCast: 1247,
}

// Party Structure
const PARTY_STRUCTURE = [
  { level: 'National', name: 'PPP National Executive', officials: 23, members: 125000 },
  { level: 'State', name: 'PPP Lagos State Chapter', officials: 15, members: 18500 },
  { level: 'LGA', name: 'PPP Surulere LGA', officials: 8, members: 2340 },
  { level: 'Ward', name: 'PPP Ward 03 Unit', officials: 5, members: 312 },
]

// Campaign Events
const CAMPAIGN_EVENTS = [
  { id: '1', title: 'Town Hall Meeting - Aguda', date: 'Jan 15, 2026', ward: 'Ward 03', attendees: 245, status: 'COMPLETED' },
  { id: '2', title: 'Youth Engagement Forum', date: 'Jan 18, 2026', ward: 'Ward 03', attendees: 180, status: 'COMPLETED' },
  { id: '3', title: 'Market Women Outreach', date: 'Jan 22, 2026', ward: 'Ward 05', attendees: 120, status: 'SCHEDULED' },
  { id: '4', title: 'Stakeholders Meeting', date: 'Jan 25, 2026', ward: 'All Wards', attendees: null, status: 'SCHEDULED' },
]

// Donation Facts (NO AMOUNTS - just categories)
const DONATION_FACTS = [
  { id: '1', category: 'Individual - Small', source: 'Party Member', date: 'Jan 10, 2026', disclosed: true, jurisdiction: 'Ward 03' },
  { id: '2', category: 'Individual - Medium', source: 'Business Owner', date: 'Jan 12, 2026', disclosed: true, jurisdiction: 'Surulere LGA' },
  { id: '3', category: 'Corporate', source: 'Registered Company', date: 'Jan 14, 2026', disclosed: true, jurisdiction: 'Lagos State' },
  { id: '4', category: 'Individual - Small', source: 'Party Member', date: 'Jan 15, 2026', disclosed: true, jurisdiction: 'Ward 03' },
  { id: '5', category: 'Fundraising Event', source: 'Dinner Gala', date: 'Jan 16, 2026', disclosed: true, jurisdiction: 'Surulere LGA' },
]

// Expense Facts
const EXPENSE_FACTS = [
  { id: '1', purpose: 'Campaign Materials', category: 'Printing', date: 'Jan 8, 2026', approved: true },
  { id: '2', purpose: 'Event Logistics', category: 'Transport', date: 'Jan 10, 2026', approved: true },
  { id: '3', purpose: 'Media Advertisement', category: 'Radio', date: 'Jan 12, 2026', approved: true },
  { id: '4', purpose: 'Volunteer Coordination', category: 'Operations', date: 'Jan 14, 2026', approved: true },
]

// Volunteers
const VOLUNTEERS = [
  { id: '1', name: 'Chinedu Okonkwo', ward: 'Ward 03', role: 'Ward Coordinator', activities: 12, lastActive: '2 hours ago' },
  { id: '2', name: 'Funke Adeyemi', ward: 'Ward 03', role: 'Canvasser', activities: 8, lastActive: '1 hour ago' },
  { id: '3', name: 'Babatunde Olawale', ward: 'Ward 05', role: 'Field Agent', activities: 15, lastActive: '30 mins ago' },
  { id: '4', name: 'Amina Ibrahim', ward: 'Ward 03', role: 'Youth Mobilizer', activities: 10, lastActive: '4 hours ago' },
]

// Election Results (Primary - Read Only)
const PRIMARY_RESULTS = {
  election: 'PPP Primary Election - Surulere I',
  date: 'December 15, 2025',
  status: 'CERTIFIED',
  candidates: [
    { name: 'Akinwale Adeyemi', votes: 1247, percentage: 62.4 },
    { name: 'Olumide Bakare', votes: 498, percentage: 24.9 },
    { name: 'Chidinma Eze', votes: 254, percentage: 12.7 },
  ],
  totalVotes: 1999,
  accreditedVoters: 2340,
  turnout: 85.4,
}

// Citizen Petitions
const PETITIONS = [
  { id: '1', title: 'Road Rehabilitation - Adeniran Ogunsanya Street', status: 'UNDER_REVIEW', responses: 2, date: 'Jan 5, 2026' },
  { id: '2', title: 'Street Light Installation Request', status: 'RESPONDED', responses: 1, date: 'Jan 8, 2026' },
  { id: '3', title: 'Market Drainage Improvement', status: 'PENDING', responses: 0, date: 'Jan 12, 2026' },
]

// Audit Logs (Sample)
const AUDIT_LOGS = [
  { id: '1', action: 'DONATION_RECORDED', actor: 'System', timestamp: 'Jan 16, 2026 14:32:01', immutable: true },
  { id: '2', action: 'VOLUNTEER_ASSIGNED', actor: 'Campaign Admin', timestamp: 'Jan 16, 2026 13:15:44', immutable: true },
  { id: '3', action: 'EXPENSE_LOGGED', actor: 'Finance Officer', timestamp: 'Jan 16, 2026 11:22:18', immutable: true },
  { id: '4', action: 'MANIFESTO_PUBLISHED', actor: 'Campaign Manager', timestamp: 'Jan 15, 2026 16:45:00', immutable: true },
  { id: '5', action: 'PRIMARY_RESULT_CERTIFIED', actor: 'Party Electoral Committee', timestamp: 'Dec 15, 2025 22:30:00', immutable: true },
]

// Quick Start Roles (Preview - S5 will wire these)
const QUICK_START_ROLES = [
  {
    id: 'candidate',
    title: 'Candidate',
    description: 'Campaign overview, manifesto, engagements',
    icon: UserCircle,
    color: 'bg-purple-100 text-purple-700 hover:bg-purple-200',
  },
  {
    id: 'partyOfficial',
    title: 'Party Official',
    description: 'Party operations, primaries, membership',
    icon: Building2,
    color: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
  },
  {
    id: 'volunteer',
    title: 'Volunteer',
    description: 'Field operations, canvassing, reports',
    icon: Users,
    color: 'bg-green-100 text-green-700 hover:bg-green-200',
  },
  {
    id: 'regulator',
    title: 'Regulator / Observer',
    description: 'Audit logs, disclosures, compliance',
    icon: Shield,
    color: 'bg-amber-100 text-amber-700 hover:bg-amber-200',
  },
]

export default function PoliticalDemoPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const quickstartParam = searchParams.get('quickstart')
  const quickStartResult = resolveQuickStart(quickstartParam)
  
  const [quickStartConfig, setQuickStartConfig] = useState<typeof quickStartResult.config>(
    quickStartResult.isActive ? quickStartResult.config : null
  )
  
  useEffect(() => {
    const result = resolveQuickStart(quickstartParam)
    setQuickStartConfig(result.isActive ? result.config : null)
  }, [quickstartParam])
  
  const handleSwitchRole = () => {
    router.push('/political-demo')
  }
  
  const handleDismissQuickStart = () => {
    router.push('/commerce-demo')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800'
      case 'SCHEDULED': return 'bg-blue-100 text-blue-800'
      case 'CERTIFIED': return 'bg-green-100 text-green-800'
      case 'RESPONDED': return 'bg-green-100 text-green-800'
      case 'UNDER_REVIEW': return 'bg-yellow-100 text-yellow-800'
      case 'PENDING': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <DemoGate>
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
      {/* Quick Start Banner */}
      {quickStartConfig && (
        <QuickStartBanner
          config={quickStartConfig}
          onSwitchRole={handleSwitchRole}
          onDismiss={handleDismissQuickStart}
        />
      )}

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-700 to-indigo-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex items-center gap-2 mb-4">
            <Badge className="bg-white/20 text-white hover:bg-white/30">S5 Narrative Ready</Badge>
            <Badge variant="outline" className="border-white/40 text-white">Platform Standardisation v2</Badge>
          </div>
          
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-white/10 rounded-xl">
              <Landmark className="w-10 h-10" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">Political Suite</h1>
              <p className="text-purple-100 text-lg">Democratic operations infrastructure for Nigeria</p>
            </div>
          </div>

          {/* Nigeria-First Badges */}
          <div className="flex flex-wrap gap-2 mt-6">
            <Badge className="bg-green-500/20 text-green-100 border border-green-400/30">
              <Shield className="w-3 h-3 mr-1" />
              INEC-Aware
            </Badge>
            <Badge className="bg-amber-500/20 text-amber-100 border border-amber-400/30">
              <Scale className="w-3 h-3 mr-1" />
              Electoral Act 2022+
            </Badge>
            <Badge className="bg-blue-500/20 text-blue-100 border border-blue-400/30">
              <MapPin className="w-3 h-3 mr-1" />
              Ward-Centric
            </Badge>
            <Badge className="bg-purple-500/20 text-purple-100 border border-purple-400/30">
              <FileSearch className="w-3 h-3 mr-1" />
              Audit-First
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Non-Partisan Disclaimer */}
        <Card className="mb-8 border-2 border-amber-200 bg-amber-50/50">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-amber-900">Non-Partisan Demonstration</h3>
                <p className="text-amber-800 text-sm">
                  This is a non-partisan demonstration of political operations infrastructure. 
                  All parties, candidates, and data shown are fictional. This platform does not endorse 
                  any political party, candidate, or position.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Start Role Selector */}
        {!quickStartConfig && (
          <Card className="mb-8 border-2 border-purple-200 bg-purple-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="w-5 h-5 text-purple-600" />
                Quick Start: Choose Your Role
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {QUICK_START_ROLES.map((role) => (
                  <button
                    key={role.id}
                    onClick={() => router.push(`/political-demo?quickstart=${role.id}`)}
                    className={`p-4 rounded-lg text-left transition-all ${role.color}`}
                  >
                    <role.icon className="w-8 h-8 mb-2" />
                    <h3 className="font-semibold">{role.title}</h3>
                    <p className="text-sm opacity-80">{role.description}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Demo Scenario */}
        <Card className="mb-8 bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
          <CardContent className="py-4">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Landmark className="w-6 h-6 text-purple-700" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-purple-900">{DEMO_SCENARIO.candidate}</h3>
                <p className="text-purple-700">{DEMO_SCENARIO.office} • {DEMO_SCENARIO.constituency}</p>
                <p className="text-sm text-purple-600 mt-1">{DEMO_SCENARIO.party} ({DEMO_SCENARIO.partyAbbr})</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="text-purple-700 border-purple-300">
                    {DEMO_SCENARIO.electionStage}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Jurisdiction Hierarchy */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Jurisdiction Hierarchy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className="bg-gray-100 text-gray-800">{JURISDICTION.federal}</Badge>
              <ArrowRight className="w-4 h-4 text-gray-400" />
              <Badge className="bg-blue-100 text-blue-800">{JURISDICTION.state}</Badge>
              <ArrowRight className="w-4 h-4 text-gray-400" />
              <Badge className="bg-green-100 text-green-800">{JURISDICTION.lga}</Badge>
              <ArrowRight className="w-4 h-4 text-gray-400" />
              <Badge className="bg-purple-100 text-purple-800">{JURISDICTION.ward}</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-3">
              All political records are tagged with jurisdiction for regulatory compliance and audit trails.
            </p>
          </CardContent>
        </Card>

        {/* Demo Preview Mode Notice */}
        <div className="bg-blue-100 border border-blue-200 rounded-lg p-4 mb-8">
          <div className="flex items-center gap-2 text-blue-800">
            <Eye className="w-5 h-5" />
            <span className="font-medium">Demo Preview Mode</span>
          </div>
          <p className="text-blue-700 text-sm mt-1">
            This is a demonstration of Political Suite capabilities. In production, data would come from authenticated API calls with capability-based access control.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Users className="w-4 h-4" />
                <span className="text-xs">Registered Volunteers</span>
              </div>
              <p className="text-2xl font-bold">{DEMO_STATS.registeredVolunteers}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Calendar className="w-4 h-4" />
                <span className="text-xs">Active Events</span>
              </div>
              <p className="text-2xl font-bold">{DEMO_STATS.activeOutreachEvents}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <FileText className="w-4 h-4" />
                <span className="text-xs">Manifesto Versions</span>
              </div>
              <p className="text-2xl font-bold">{DEMO_STATS.manifestoVersions}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <MessageSquare className="w-4 h-4" />
                <span className="text-xs">Open Petitions</span>
              </div>
              <p className="text-2xl font-bold">{DEMO_STATS.openPetitions}</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="campaign" className="mb-8">
          <TabsList className="grid grid-cols-5 lg:w-auto lg:inline-flex">
            <TabsTrigger value="campaign">Campaign</TabsTrigger>
            <TabsTrigger value="party">Party</TabsTrigger>
            <TabsTrigger value="fundraising">Fundraising</TabsTrigger>
            <TabsTrigger value="governance">Governance</TabsTrigger>
            <TabsTrigger value="audit">Audit</TabsTrigger>
          </TabsList>

          {/* Campaign Tab */}
          <TabsContent value="campaign" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Campaign Events */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Megaphone className="w-5 h-5" />
                    Outreach Events
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {CAMPAIGN_EVENTS.map((event) => (
                      <div key={event.id} className="border rounded-lg p-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium">{event.title}</h4>
                            <p className="text-sm text-muted-foreground">{event.date} • {event.ward}</p>
                          </div>
                          <Badge className={getStatusColor(event.status)}>{event.status}</Badge>
                        </div>
                        {event.attendees && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {event.attendees} attendees
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Volunteers */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="w-5 h-5" />
                    Field Volunteers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {VOLUNTEERS.map((volunteer) => (
                      <div key={volunteer.id} className="border rounded-lg p-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium">{volunteer.name}</h4>
                            <p className="text-sm text-muted-foreground">{volunteer.role} • {volunteer.ward}</p>
                          </div>
                          <Badge variant="outline">{volunteer.activities} activities</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          <Clock className="w-3 h-3 inline mr-1" />
                          Last active: {volunteer.lastActive}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Party Tab */}
          <TabsContent value="party" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Party Structure */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    Party Structure
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {PARTY_STRUCTURE.map((unit, idx) => (
                      <div key={idx} className="border rounded-lg p-3">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <Badge variant="outline" className="mb-1">{unit.level}</Badge>
                            <h4 className="font-medium">{unit.name}</h4>
                          </div>
                        </div>
                        <div className="flex gap-4 text-sm text-muted-foreground">
                          <span>{unit.officials} officials</span>
                          <span>{unit.members.toLocaleString()} members</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Primary Results */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Vote className="w-5 h-5" />
                    Primary Election Results
                    <Badge className="bg-green-100 text-green-800 ml-2">APPEND-ONLY</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <h4 className="font-medium">{PRIMARY_RESULTS.election}</h4>
                    <p className="text-sm text-muted-foreground">{PRIMARY_RESULTS.date}</p>
                    <Badge className={`${getStatusColor(PRIMARY_RESULTS.status)} mt-1`}>
                      {PRIMARY_RESULTS.status}
                    </Badge>
                  </div>
                  <div className="space-y-3">
                    {PRIMARY_RESULTS.candidates.map((candidate, idx) => (
                      <div key={idx}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className={idx === 0 ? 'font-medium' : ''}>{candidate.name}</span>
                          <span>{candidate.votes.toLocaleString()} ({candidate.percentage}%)</span>
                        </div>
                        <Progress value={candidate.percentage} className="h-2" />
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t text-sm text-muted-foreground">
                    <p>Total Votes: {PRIMARY_RESULTS.totalVotes.toLocaleString()}</p>
                    <p>Turnout: {PRIMARY_RESULTS.turnout}%</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Fundraising Tab */}
          <TabsContent value="fundraising" className="space-y-6">
            {/* Commerce Boundary Warning */}
            <Card className="border-2 border-amber-300 bg-amber-50">
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  <Banknote className="w-6 h-6 text-amber-600 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-amber-900">Facts Only — Commerce Boundary</h3>
                    <p className="text-amber-800 text-sm">
                      Political Suite records donation and expense <strong>facts only</strong>. 
                      All financial execution (payments, VAT, accounting) occurs in Commerce Suite. 
                      This suite never processes payments or holds balances.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Donation Facts */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HandCoins className="w-5 h-5" />
                    Donation Facts
                    <Badge variant="outline" className="ml-2">FACTS ONLY</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {DONATION_FACTS.map((donation) => (
                      <div key={donation.id} className="border rounded-lg p-3 text-sm">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="font-medium">{donation.category}</span>
                            <p className="text-muted-foreground">{donation.source}</p>
                          </div>
                          {donation.disclosed && (
                            <Badge className="bg-green-100 text-green-800">Disclosed</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          <span>{donation.date}</span>
                          <MapPin className="w-3 h-3 ml-2" />
                          <span>{donation.jurisdiction}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Expense Facts */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardList className="w-5 h-5" />
                    Expense Facts
                    <Badge variant="outline" className="ml-2">FACTS ONLY</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {EXPENSE_FACTS.map((expense) => (
                      <div key={expense.id} className="border rounded-lg p-3 text-sm">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="font-medium">{expense.purpose}</span>
                            <p className="text-muted-foreground">{expense.category}</p>
                          </div>
                          {expense.approved && (
                            <Badge className="bg-green-100 text-green-800">Approved</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          <span>{expense.date}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Governance Tab */}
          <TabsContent value="governance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Citizen Petitions & Engagement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {PETITIONS.map((petition) => (
                    <div key={petition.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium">{petition.title}</h4>
                          <p className="text-sm text-muted-foreground">Submitted: {petition.date}</p>
                        </div>
                        <Badge className={getStatusColor(petition.status)}>
                          {petition.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        {petition.responses} response(s)
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Audit Tab */}
          <TabsContent value="audit" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Immutable Audit Log
                  <Badge className="bg-purple-100 text-purple-800 ml-2">APPEND-ONLY</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-3 font-medium">Action</th>
                        <th className="text-left p-3 font-medium">Actor</th>
                        <th className="text-left p-3 font-medium">Timestamp</th>
                        <th className="text-center p-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {AUDIT_LOGS.map((log) => (
                        <tr key={log.id} className="border-t">
                          <td className="p-3 font-mono text-xs">{log.action}</td>
                          <td className="p-3">{log.actor}</td>
                          <td className="p-3 text-muted-foreground">{log.timestamp}</td>
                          <td className="p-3 text-center">
                            {log.immutable && (
                              <Badge className="bg-green-100 text-green-800">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Immutable
                              </Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Commerce Boundary Architecture */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Commerce Boundary Architecture
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Political Suite */}
              <div className="border-2 border-purple-200 rounded-lg p-4 bg-purple-50/50">
                <h3 className="font-semibold text-purple-800 mb-3 flex items-center gap-2">
                  <Landmark className="w-5 h-5" />
                  Political Suite (This Vertical)
                </h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-purple-600" />
                    Campaign Management
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-purple-600" />
                    Party Operations
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-purple-600" />
                    Election Administration
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-purple-600" />
                    Fundraising FACTS
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-purple-600" />
                    Audit & Compliance
                  </li>
                </ul>
              </div>

              {/* Arrow */}
              <div className="flex items-center justify-center">
                <div className="text-center">
                  <ArrowRight className="w-8 h-8 text-gray-400 mx-auto" />
                  <p className="text-xs text-muted-foreground mt-2">Emits donation<br />& expense facts</p>
                </div>
              </div>

              {/* Commerce Suite */}
              <div className="border-2 border-indigo-200 rounded-lg p-4 bg-indigo-50/50">
                <h3 className="font-semibold text-indigo-800 mb-3 flex items-center gap-2">
                  <Banknote className="w-5 h-5" />
                  Commerce Suite (Handles Financials)
                </h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-indigo-600" />
                    Payment Processing
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-indigo-600" />
                    VAT Calculation
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-indigo-600" />
                    Accounting Journals
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-indigo-600" />
                    Wallet Management
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-indigo-600" />
                    Financial Reporting
                  </li>
                </ul>
              </div>
            </div>

            {/* Boundary Rule */}
            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <h4 className="font-semibold text-amber-800 mb-2">Boundary Rule (Non-Negotiable)</h4>
              <p className="text-amber-700 text-sm">
                Political Suite records <strong>facts only</strong> — donation pledges, expense logs, and disclosure records. 
                It <strong>never</strong> processes payments, calculates VAT, manages wallets, or touches accounting journals. 
                All financial execution flows through Commerce Suite.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Nigeria-First Design Notes */}
        <Card className="mb-8 border-purple-200 bg-purple-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-800">
              <Flag className="w-5 h-5" />
              Nigeria-First Design Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-semibold text-purple-900 mb-2">Regulatory Context</h4>
                <ul className="space-y-1 text-purple-800">
                  <li>• INEC-aware jurisdiction hierarchy</li>
                  <li>• Electoral Act 2022+ compliance ready</li>
                  <li>• Campaign finance limit tracking</li>
                  <li>• Mandatory disclosure timelines</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-purple-900 mb-2">Operational Realities</h4>
                <ul className="space-y-1 text-purple-800">
                  <li>• Ward-centric grassroots operations</li>
                  <li>• Offline-first volunteer capture</li>
                  <li>• Cash-heavy fundraising reality</li>
                  <li>• Multi-party, multi-election support</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-purple-900 mb-2">Audit & Trust</h4>
                <ul className="space-y-1 text-purple-800">
                  <li>• Append-only election records</li>
                  <li>• Immutable audit trails</li>
                  <li>• Regulator read-only access</li>
                  <li>• Court-ready evidence exports</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-purple-900 mb-2">Platform Neutrality</h4>
                <ul className="space-y-1 text-purple-800">
                  <li>• Non-partisan infrastructure</li>
                  <li>• No endorsements or recommendations</li>
                  <li>• Equal treatment for all parties</li>
                  <li>• Transparent governance model</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </DemoGate>
  )
}
