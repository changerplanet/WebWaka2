'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { DemoGate } from '@/components/demo'
import { 
  Church,
  Users,
  Heart,
  Calendar,
  HandCoins,
  MapPin,
  BookOpen,
  Shield,
  Building2,
  UserCircle,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Eye,
  Clock,
  TrendingUp,
  Globe,
  Music,
  Baby,
  Home,
  Star,
  FileText,
  Lock,
  Bell,
  Mic,
  HandHeart,
  Sparkles,
  CircleDollarSign,
  Scale,
  UserCheck,
  ClipboardList,
  ChevronRight,
  Link2,
  X,
  RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { resolveQuickStart, QuickStartConfig } from '@/lib/demo/quickstart'

// ============================================================================
// DEMO SCENARIO - GraceLife Community Church (Fictional, Nigeria-First)
// ============================================================================

const DEMO_SCENARIO = {
  churchName: 'GraceLife Community Church',
  denomination: 'Non-denominational',
  hq: 'Ikeja, Lagos',
  founded: '2008',
  seniorPastor: 'Pastor Emmanuel Adeyemi',
  associatePastor: 'Pastor Grace Okonkwo',
  totalMembers: 2847,
  motto: 'Faith. Family. Future.',
}

// Church Hierarchy (Nigeria-specific)
const CHURCH_HIERARCHY = [
  { level: 'Church HQ', name: 'GraceLife Community Church', units: 1, members: 2847, location: 'Ikeja, Lagos' },
  { level: 'Diocese', name: 'Lagos Mainland Diocese', units: 4, members: 2847, location: 'Lagos Mainland' },
  { level: 'Parish', name: 'Ikeja Central Parish', units: 2, members: 1420, location: 'Ikeja' },
  { level: 'Parish', name: 'Agege Parish', units: 2, members: 890, location: 'Agege' },
  { level: 'Cell', name: 'Harmony Cell', units: 0, members: 24, location: 'Ward A' },
]

// Demo Stats
const DEMO_STATS = {
  totalMembers: 2847,
  activeMinistries: 14,
  weeklyServices: 8,
  activeVolunteers: 312,
  cellGroups: 48,
  averageAttendance: 1850,
  newConverts: 127,
  childrenMinistry: 423,
}

// Ministries
const MINISTRIES = [
  { id: '1', name: 'Choir & Music Ministry', icon: Music, members: 65, head: 'Bro. Femi Adesina', status: 'ACTIVE' },
  { id: '2', name: 'Ushering & Protocol', icon: UserCheck, members: 48, head: 'Sis. Ngozi Eze', status: 'ACTIVE' },
  { id: '3', name: 'Youth Ministry', icon: Star, members: 234, head: 'Pastor David Obi', status: 'ACTIVE' },
  { id: '4', name: 'Children\'s Ministry', icon: Baby, members: 423, head: 'Sis. Funke Balogun', status: 'ACTIVE' },
  { id: '5', name: 'Men\'s Fellowship', icon: Users, members: 180, head: 'Deacon Chidi Nwankwo', status: 'ACTIVE' },
  { id: '6', name: 'Women\'s Ministry', icon: Heart, members: 245, head: 'Deaconess Bisi Adeyemi', status: 'ACTIVE' },
  { id: '7', name: 'Media & Technical', icon: Mic, members: 28, head: 'Bro. Tunde Bakare', status: 'ACTIVE' },
  { id: '8', name: 'Welfare & Benevolence', icon: HandHeart, members: 32, head: 'Deacon Samuel Igwe', status: 'ACTIVE' },
]

// Weekly Services
const SERVICES = [
  { id: '1', name: 'Sunday First Service', day: 'Sunday', time: '7:00 AM', type: 'SUNDAY_SERVICE', avgAttendance: 650 },
  { id: '2', name: 'Sunday Second Service', day: 'Sunday', time: '9:30 AM', type: 'SUNDAY_SERVICE', avgAttendance: 890 },
  { id: '3', name: 'Sunday Third Service', day: 'Sunday', time: '12:00 PM', type: 'SUNDAY_SERVICE', avgAttendance: 310 },
  { id: '4', name: 'Midweek Service', day: 'Wednesday', time: '6:00 PM', type: 'MIDWEEK_SERVICE', avgAttendance: 480 },
  { id: '5', name: 'Friday Night Vigil', day: 'Friday', time: '10:00 PM', type: 'VIGIL', avgAttendance: 220 },
  { id: '6', name: 'Youth Service', day: 'Saturday', time: '4:00 PM', type: 'SPECIAL_SERVICE', avgAttendance: 180 },
]

// Upcoming Events
const EVENTS = [
  { id: '1', title: 'Annual Thanksgiving Service', date: 'Jan 26, 2026', type: 'SPECIAL_SERVICE', expected: 2500, status: 'SCHEDULED' },
  { id: '2', title: 'Youth Camp 2026', date: 'Feb 14-16, 2026', type: 'CONFERENCE', expected: 350, status: 'REGISTRATION_OPEN' },
  { id: '3', title: 'Marriage Seminar', date: 'Feb 22, 2026', type: 'SPECIAL_SERVICE', expected: 200, status: 'SCHEDULED' },
  { id: '4', title: 'Easter Convention', date: 'Apr 18-20, 2026', type: 'CONFERENCE', expected: 3000, status: 'PLANNING' },
]

// Giving Facts (FACTS ONLY - NO AMOUNTS)
const GIVING_FACTS = [
  { id: '1', type: 'TITHE', category: 'Regular Tithe', service: 'Sunday Second Service', date: 'Jan 19, 2026', recorded: true },
  { id: '2', type: 'OFFERING', category: 'General Offering', service: 'Sunday First Service', date: 'Jan 19, 2026', recorded: true },
  { id: '3', type: 'SEED', category: 'Faith Seed', service: 'Midweek Service', date: 'Jan 15, 2026', recorded: true },
  { id: '4', type: 'BUILDING_FUND', category: 'Building Project', service: 'Special Appeal', date: 'Jan 12, 2026', recorded: true },
  { id: '5', type: 'WELFARE', category: 'Benevolence Fund', service: 'Sunday Third Service', date: 'Jan 19, 2026', recorded: true },
]

// Expense Facts
const EXPENSE_FACTS = [
  { id: '1', purpose: 'Sound Equipment Maintenance', category: 'Media', date: 'Jan 18, 2026', approved: true },
  { id: '2', purpose: 'Youth Camp Venue Deposit', category: 'Events', date: 'Jan 15, 2026', approved: true },
  { id: '3', purpose: 'Welfare Support - Widow', category: 'Benevolence', date: 'Jan 14, 2026', approved: true },
  { id: '4', purpose: 'Church Bus Fuel', category: 'Transport', date: 'Jan 12, 2026', approved: true },
]

// Audit Logs (Sample)
const AUDIT_LOGS = [
  { id: '1', action: 'TITHE_FACT_RECORDED', actor: 'System', timestamp: 'Jan 19, 2026 11:45:22', immutable: true },
  { id: '2', action: 'MEMBER_REGISTERED', actor: 'Church Admin', timestamp: 'Jan 18, 2026 14:30:15', immutable: true },
  { id: '3', action: 'EXPENSE_APPROVED', actor: 'Finance Officer', timestamp: 'Jan 18, 2026 10:22:08', immutable: true },
  { id: '4', action: 'SERVICE_ATTENDANCE_LOGGED', actor: 'System', timestamp: 'Jan 19, 2026 13:00:00', immutable: true },
  { id: '5', action: 'LEADERSHIP_ASSIGNED', actor: 'Senior Pastor', timestamp: 'Jan 10, 2026 09:15:00', immutable: true },
]

// Quick Start Roles (S5 wired)
const QUICK_START_ROLES = [
  {
    id: 'pastor',
    title: 'Senior Pastor',
    description: 'Church overview, leadership, governance',
    icon: UserCircle,
    color: 'bg-purple-100 text-purple-700 hover:bg-purple-200',
    gradient: 'from-purple-600 to-indigo-600',
    quickstartKey: 'pastor'
  },
  {
    id: 'churchAdmin',
    title: 'Church Admin',
    description: 'Members, services, events, reports',
    icon: Building2,
    color: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
    gradient: 'from-blue-600 to-slate-600',
    quickstartKey: 'churchAdmin'
  },
  {
    id: 'ministryLeader',
    title: 'Ministry Leader',
    description: 'Department operations, volunteers',
    icon: Users,
    color: 'bg-green-100 text-green-700 hover:bg-green-200',
    gradient: 'from-green-600 to-emerald-600',
    quickstartKey: 'ministryLeader'
  },
  {
    id: 'member',
    title: 'Member',
    description: 'Services, giving, cell groups',
    icon: Heart,
    color: 'bg-amber-100 text-amber-700 hover:bg-amber-200',
    gradient: 'from-amber-600 to-yellow-600',
    quickstartKey: 'member'
  },
]

// Inner component that uses searchParams
function ChurchDemoContent() {
  const [activeTab, setActiveTab] = useState('members')
  const [activeRole, setActiveRole] = useState<typeof QUICK_START_ROLES[0] | null>(null)
  const [showBanner, setShowBanner] = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()

  // Handle quickstart parameter
  useEffect(() => {
    const quickstartRole = searchParams.get('quickstart')
    if (quickstartRole) {
      const role = QUICK_START_ROLES.find((r: any) => r.quickstartKey === quickstartRole)
      if (role) {
        setActiveRole(role)
        setShowBanner(true)
      }
    } else {
      setActiveRole(null)
      setShowBanner(false)
    }
  }, [searchParams])

  const handleRoleSelect = (role: typeof QUICK_START_ROLES[0]) => {
    router.push(`/church-demo?quickstart=${role.quickstartKey}`)
  }

  const handleSwitchRole = () => {
    router.push('/church-demo')
  }

  const handleCopyLink = () => {
    if (activeRole) {
      navigator.clipboard.writeText(`${window.location.origin}/church-demo?quickstart=${activeRole.quickstartKey}`)
    }
  }

  const handleDismissBanner = () => {
    setShowBanner(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800'
      case 'SCHEDULED': return 'bg-blue-100 text-blue-800'
      case 'REGISTRATION_OPEN': return 'bg-purple-100 text-purple-800'
      case 'PLANNING': return 'bg-amber-100 text-amber-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'TITHE': return 'bg-green-100 text-green-800'
      case 'OFFERING': return 'bg-blue-100 text-blue-800'
      case 'SEED': return 'bg-purple-100 text-purple-800'
      case 'BUILDING_FUND': return 'bg-amber-100 text-amber-800'
      case 'WELFARE': return 'bg-pink-100 text-pink-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-indigo-700 to-purple-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex items-center gap-2 mb-4">
            <Badge className="bg-white/20 text-white hover:bg-white/30">S5 Narrative Ready</Badge>
            <Badge variant="outline" className="border-white/40 text-white">Platform Standardisation v2</Badge>
          </div>
          
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-white/10 rounded-xl">
              <Church className="w-10 h-10" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">Church Suite</h1>
              <p className="text-indigo-100 text-lg">Digital Infrastructure for Faith Communities</p>
            </div>
          </div>

          {/* Trust & Safeguarding Badges */}
          <div className="flex flex-wrap gap-2 mt-6">
            <Badge className="bg-green-500/20 text-green-100 border border-green-400/30">
              <Globe className="w-3 h-3 mr-1" />
              Nigeria-First
            </Badge>
            <Badge className="bg-amber-500/20 text-amber-100 border border-amber-400/30">
              <Shield className="w-3 h-3 mr-1" />
              Audit-First
            </Badge>
            <Badge className="bg-blue-500/20 text-blue-100 border border-blue-400/30">
              <Baby className="w-3 h-3 mr-1" />
              Minors Safeguarded
            </Badge>
            <Badge className="bg-purple-500/20 text-purple-100 border border-purple-400/30">
              <Lock className="w-3 h-3 mr-1" />
              Pastoral Confidentiality
            </Badge>
            <Badge className="bg-red-500/20 text-red-100 border border-red-400/30">
              <AlertCircle className="w-3 h-3 mr-1" />
              Facts Only (No Payments)
            </Badge>
          </div>
        </div>
      </div>

      {/* Demo Preview Banner */}
      <div className="bg-amber-50 border-b border-amber-200">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center gap-2 text-amber-800">
            <Eye className="w-4 h-4" />
            <span className="font-medium">Demo Preview Mode</span>
            <span className="text-amber-600">— All data shown is fictional for demonstration purposes</span>
          </div>
        </div>
      </div>

      {/* Quick Start Banner (when role selected) */}
      {showBanner && activeRole && (
        <div className={`bg-gradient-to-r ${activeRole.gradient} text-white`}>
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <activeRole.icon className="w-5 h-5" />
                <div>
                  <span className="font-semibold">{activeRole.title}</span>
                  <span className="mx-2">•</span>
                  <span className="opacity-90">{activeRole.description}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyLink}
                  className="text-white hover:bg-white/20"
                >
                  <Link2 className="w-4 h-4 mr-1" />
                  Copy Link
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSwitchRole}
                  className="text-white hover:bg-white/20"
                >
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Switch Role
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDismissBanner}
                  className="text-white hover:bg-white/20"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Quick Start Role Selector */}
        <Card className="mb-8 border-2 border-dashed border-indigo-200 bg-indigo-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              Quick Start — Select Your Role
            </CardTitle>
            <CardDescription>
              Experience Church Suite from different perspectives
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {QUICK_START_ROLES.map((role) => (
                <button
                  key={role.id}
                  onClick={() => handleRoleSelect(role)}
                  className={`p-4 rounded-lg text-left transition-all ${role.color} border-2 ${
                    activeRole?.id === role.id 
                      ? 'border-indigo-500 ring-2 ring-indigo-300' 
                      : 'border-transparent hover:border-indigo-300'
                  }`}
                >
                  <role.icon className="w-6 h-6 mb-2" />
                  <div className="font-medium">{role.title}</div>
                  <div className="text-xs opacity-80">{role.description}</div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Demo Scenario Banner */}
        <Card className="mb-8 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
          <CardContent className="py-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-1">{DEMO_SCENARIO.churchName}</h2>
                <p className="text-indigo-100 mb-4">{DEMO_SCENARIO.motto}</p>
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {DEMO_SCENARIO.hq}
                  </div>
                  <div className="flex items-center gap-1">
                    <UserCircle className="w-4 h-4" />
                    {DEMO_SCENARIO.seniorPastor}
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {DEMO_SCENARIO.totalMembers.toLocaleString()} Members
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Est. {DEMO_SCENARIO.founded}
                  </div>
                </div>
              </div>
              <Badge className="bg-white/20">
                {DEMO_SCENARIO.denomination}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Church Structure Visualization */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-600" />
              Church Structure
            </CardTitle>
            <CardDescription>
              Multi-level hierarchy: Church → Diocese → Parish → Cell
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {CHURCH_HIERARCHY.map((unit, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-4 p-3 rounded-lg ${
                    unit.level === 'Church HQ' ? 'bg-indigo-100' :
                    unit.level === 'Diocese' ? 'bg-purple-50 ml-4' :
                    unit.level === 'Parish' ? 'bg-blue-50 ml-8' :
                    'bg-gray-50 ml-12'
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">{unit.level}</Badge>
                      <span className="font-medium">{unit.name}</span>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      <MapPin className="w-3 h-3 inline mr-1" />
                      {unit.location}
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <div className="font-medium">{unit.members.toLocaleString()} members</div>
                    {unit.units > 0 && (
                      <div className="text-gray-500">{unit.units} sub-units</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Users className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{DEMO_STATS.totalMembers.toLocaleString()}</div>
                  <div className="text-sm text-gray-500">Total Members</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Heart className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{DEMO_STATS.activeMinistries}</div>
                  <div className="text-sm text-gray-500">Active Ministries</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{DEMO_STATS.weeklyServices}</div>
                  <div className="text-sm text-gray-500">Weekly Services</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <UserCheck className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{DEMO_STATS.activeVolunteers}</div>
                  <div className="text-sm text-gray-500">Active Volunteers</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Home className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{DEMO_STATS.cellGroups}</div>
                  <div className="text-sm text-amber-700">Cell Groups</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{DEMO_STATS.averageAttendance.toLocaleString()}</div>
                  <div className="text-sm text-green-700">Avg. Attendance</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Star className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{DEMO_STATS.newConverts}</div>
                  <div className="text-sm text-purple-700">New Converts (YTD)</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-pink-50 border-pink-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-pink-100 rounded-lg">
                  <Baby className="w-5 h-5 text-pink-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{DEMO_STATS.childrenMinistry}</div>
                  <div className="text-sm text-pink-700">Children&apos;s Ministry</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabbed Capability Preview */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="ministries">Ministries</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="giving">Giving</TabsTrigger>
            <TabsTrigger value="audit">Audit</TabsTrigger>
          </TabsList>

          {/* Members Tab */}
          <TabsContent value="members">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  Membership Management
                </CardTitle>
                <CardDescription>
                  Member lifecycle: Visitor → New Convert → Member → Worker
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Member Lifecycle Visual */}
                  <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-gray-200 rounded-full">
                        <Eye className="w-4 h-4 text-gray-600" />
                      </div>
                      <span className="text-sm font-medium">Visitor</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-green-200 rounded-full">
                        <Star className="w-4 h-4 text-green-600" />
                      </div>
                      <span className="text-sm font-medium">New Convert</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-blue-200 rounded-full">
                        <Users className="w-4 h-4 text-blue-600" />
                      </div>
                      <span className="text-sm font-medium">Member</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-purple-200 rounded-full">
                        <UserCheck className="w-4 h-4 text-purple-600" />
                      </div>
                      <span className="text-sm font-medium">Worker</span>
                    </div>
                  </div>

                  {/* Member Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg text-center">
                      <div className="text-2xl font-bold text-gray-700">156</div>
                      <div className="text-sm text-gray-500">Visitors (This Month)</div>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg text-center">
                      <div className="text-2xl font-bold text-green-700">127</div>
                      <div className="text-sm text-green-600">New Converts (YTD)</div>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg text-center">
                      <div className="text-2xl font-bold text-blue-700">2,308</div>
                      <div className="text-sm text-blue-600">Active Members</div>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg text-center">
                      <div className="text-2xl font-bold text-purple-700">412</div>
                      <div className="text-sm text-purple-600">Workers</div>
                    </div>
                  </div>

                  {/* Safeguarding Notice */}
                  <Alert className="bg-blue-50 border-blue-200">
                    <Baby className="w-4 h-4 text-blue-600" />
                    <AlertTitle className="text-blue-800">Minors Safeguarding Active</AlertTitle>
                    <AlertDescription className="text-blue-700">
                      {DEMO_STATS.childrenMinistry} children registered with guardian linkage. Access restricted to authorized personnel only.
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Ministries Tab */}
          <TabsContent value="ministries">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-purple-600" />
                  Ministries & Departments
                </CardTitle>
                <CardDescription>
                  14 active ministries serving the church community
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {MINISTRIES.map((ministry) => (
                    <div
                      key={ministry.id}
                      className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="p-2 bg-white rounded-lg shadow-sm">
                        <ministry.icon className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{ministry.name}</div>
                        <div className="text-sm text-gray-500">Head: {ministry.head}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{ministry.members}</div>
                        <div className="text-xs text-gray-500">members</div>
                      </div>
                      <Badge className={getStatusColor(ministry.status)}>{ministry.status}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Services Tab */}
          <TabsContent value="services">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  Services & Events
                </CardTitle>
                <CardDescription>
                  Weekly services and upcoming church events
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Weekly Services */}
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Weekly Services
                    </h3>
                    <div className="space-y-2">
                      {SERVICES.map((service) => (
                        <div
                          key={service.id}
                          className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex-1">
                            <div className="font-medium">{service.name}</div>
                            <div className="text-sm text-gray-500">{service.day} • {service.time}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{service.avgAttendance}</div>
                            <div className="text-xs text-gray-500">avg. attendance</div>
                          </div>
                          <Badge variant="outline">{service.type.replace('_', ' ')}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Upcoming Events */}
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Bell className="w-4 h-4" />
                      Upcoming Events
                    </h3>
                    <div className="space-y-2">
                      {EVENTS.map((event) => (
                        <div
                          key={event.id}
                          className="flex items-center gap-4 p-3 bg-blue-50 rounded-lg"
                        >
                          <div className="flex-1">
                            <div className="font-medium">{event.title}</div>
                            <div className="text-sm text-gray-500">{event.date}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{event.expected.toLocaleString()}</div>
                            <div className="text-xs text-gray-500">expected</div>
                          </div>
                          <Badge className={getStatusColor(event.status)}>
                            {event.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Giving Tab */}
          <TabsContent value="giving">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HandCoins className="w-5 h-5 text-green-600" />
                  Giving & Financial Facts
                </CardTitle>
                <CardDescription>
                  Tithe, offerings, and expense facts (FACTS ONLY - No payment processing)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Commerce Boundary Warning */}
                  <Alert className="bg-red-50 border-red-200">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <AlertTitle className="text-red-800">Commerce Boundary — FACTS ONLY</AlertTitle>
                    <AlertDescription className="text-red-700">
                      Church Suite records giving facts only. All payment processing, receipts, and accounting are handled by Commerce Suite. No balances, wallets, or payments here.
                    </AlertDescription>
                  </Alert>

                  {/* Giving Types */}
                  <div className="grid grid-cols-5 gap-2">
                    {['TITHE', 'OFFERING', 'SEED', 'BUILDING_FUND', 'WELFARE'].map((type) => (
                      <div key={type} className={`p-3 rounded-lg text-center ${getTypeColor(type)}`}>
                        <div className="font-medium text-sm">{type.replace('_', ' ')}</div>
                      </div>
                    ))}
                  </div>

                  {/* Recent Giving Facts */}
                  <div>
                    <h3 className="font-semibold mb-3">Recent Giving Facts</h3>
                    <div className="space-y-2">
                      {GIVING_FACTS.map((fact) => (
                        <div
                          key={fact.id}
                          className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
                        >
                          <Badge className={getTypeColor(fact.type)}>{fact.type}</Badge>
                          <div className="flex-1">
                            <div className="font-medium">{fact.category}</div>
                            <div className="text-sm text-gray-500">{fact.service}</div>
                          </div>
                          <div className="text-sm text-gray-500">{fact.date}</div>
                          {fact.recorded && (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Expense Facts */}
                  <div>
                    <h3 className="font-semibold mb-3">Recent Expense Facts</h3>
                    <div className="space-y-2">
                      {EXPENSE_FACTS.map((expense) => (
                        <div
                          key={expense.id}
                          className="flex items-center gap-4 p-3 bg-amber-50 rounded-lg"
                        >
                          <Badge variant="outline">{expense.category}</Badge>
                          <div className="flex-1">
                            <div className="font-medium">{expense.purpose}</div>
                          </div>
                          <div className="text-sm text-gray-500">{expense.date}</div>
                          {expense.approved && (
                            <Badge className="bg-green-100 text-green-800">Approved</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Commerce Flow Diagram */}
                  <div className="bg-gray-100 p-4 rounded-lg">
                    <h4 className="font-semibold mb-3 text-center">Commerce Boundary Flow</h4>
                    <div className="flex items-center justify-center gap-4">
                      <div className="p-3 bg-indigo-100 rounded-lg text-center">
                        <Church className="w-6 h-6 mx-auto text-indigo-600 mb-1" />
                        <div className="text-sm font-medium">Church Suite</div>
                        <div className="text-xs text-gray-500">tithe_fact</div>
                        <div className="text-xs text-gray-500">offering_fact</div>
                        <div className="text-xs text-gray-500">expense_fact</div>
                      </div>
                      <ArrowRight className="w-6 h-6 text-gray-400" />
                      <div className="p-3 bg-green-100 rounded-lg text-center">
                        <CircleDollarSign className="w-6 h-6 mx-auto text-green-600 mb-1" />
                        <div className="text-sm font-medium">Commerce Suite</div>
                        <div className="text-xs text-gray-500">Payments</div>
                        <div className="text-xs text-gray-500">Receipts</div>
                        <div className="text-xs text-gray-500">Accounting</div>
                      </div>
                    </div>
                    <div className="text-center mt-3 text-sm text-gray-500">
                      🚫 No reverse calls • 🚫 No payment status • 🚫 No balances
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Audit Tab */}
          <TabsContent value="audit">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-amber-600" />
                  Governance & Audit
                </CardTitle>
                <CardDescription>
                  Immutable audit trail and compliance records
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Audit Features */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-amber-50 rounded-lg text-center">
                      <Lock className="w-6 h-6 mx-auto text-amber-600 mb-2" />
                      <div className="font-medium">Append-Only</div>
                      <div className="text-xs text-gray-500">Immutable Records</div>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg text-center">
                      <FileText className="w-6 h-6 mx-auto text-blue-600 mb-2" />
                      <div className="font-medium">Exportable</div>
                      <div className="text-xs text-gray-500">Regulator Ready</div>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg text-center">
                      <CheckCircle className="w-6 h-6 mx-auto text-green-600 mb-2" />
                      <div className="font-medium">Integrity</div>
                      <div className="text-xs text-gray-500">Hash Verified</div>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg text-center">
                      <Scale className="w-6 h-6 mx-auto text-purple-600 mb-2" />
                      <div className="font-medium">Compliant</div>
                      <div className="text-xs text-gray-500">CAC/NGO Ready</div>
                    </div>
                  </div>

                  {/* Recent Audit Logs */}
                  <div>
                    <h3 className="font-semibold mb-3">Recent Audit Logs</h3>
                    <div className="space-y-2">
                      {AUDIT_LOGS.map((log) => (
                        <div
                          key={log.id}
                          className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
                        >
                          <Badge variant="outline" className="font-mono text-xs">
                            {log.action}
                          </Badge>
                          <div className="flex-1">
                            <div className="text-sm">Actor: {log.actor}</div>
                          </div>
                          <div className="text-sm text-gray-500">{log.timestamp}</div>
                          {log.immutable && (
                            <Lock className="w-4 h-4 text-amber-500" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pastoral Confidentiality Notice */}
                  <Alert className="bg-purple-50 border-purple-200">
                    <Lock className="w-4 h-4 text-purple-600" />
                    <AlertTitle className="text-purple-800">Pastoral Confidentiality Protected</AlertTitle>
                    <AlertDescription className="text-purple-700">
                      Pastoral notes are encrypted at rest, not searchable, and access-logged. No pastoral data is shown in this demo.
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Nigeria-First Design Notes */}
        <Card className="mb-8 bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <Globe className="w-5 h-5" />
              Nigeria-First Design
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4 text-sm text-green-800">
              <div>
                <h4 className="font-semibold mb-2">Cultural Context</h4>
                <ul className="space-y-1 text-green-700">
                  <li>• Multiple Sunday services</li>
                  <li>• Cell-based pastoral care</li>
                  <li>• Extended family units</li>
                  <li>• Youth & children focus</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Operational Reality</h4>
                <ul className="space-y-1 text-green-700">
                  <li>• Cash-heavy giving reality</li>
                  <li>• Volunteer-driven operations</li>
                  <li>• Multi-branch structures</li>
                  <li>• Offline-first capable</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Compliance Ready</h4>
                <ul className="space-y-1 text-green-700">
                  <li>• CAC/NGO alignment</li>
                  <li>• Trustee governance</li>
                  <li>• Financial transparency</li>
                  <li>• Audit-first design</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 py-8">
          <p>Church Suite — Platform Standardisation v2</p>
          <p className="mt-1">
            All data shown is fictional. No real member, pastoral, or financial data is displayed.
          </p>
          <div className="flex items-center justify-center gap-4 mt-4">
            <Badge variant="outline">S5 Narrative Complete</Badge>
            <Badge className="bg-green-100 text-green-800 border-green-300">🔒 S6 FROZEN</Badge>
          </div>
        </div>
      </div>
    </div>
  )
}

// Main export with Suspense for useSearchParams
export default function ChurchDemoPage() {
  return (
    <DemoGate>
      <Suspense fallback={
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
          <div className="text-indigo-600">Loading Church Suite Demo...</div>
        </div>
      }>
        <ChurchDemoContent />
      </Suspense>
    </DemoGate>
  )
}
