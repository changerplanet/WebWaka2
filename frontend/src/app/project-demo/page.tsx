'use client'

/**
 * PROJECT MANAGEMENT SUITE: Demo Portal
 * 
 * Showcases Project Management Suite capabilities with Nigerian demo data.
 * Demo Scenario: BuildRight Construction Ltd, Lagos
 * 
 * Read-only, demo-safe experience for partners and investors.
 * 
 * @module app/project-demo
 * @phase S4-S5 (Canonicalization)
 * @standard Platform Standardisation v2
 */

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { DemoGate } from '@/components/demo'
import {
  FolderKanban,
  Target,
  Users,
  CheckCircle,
  AlertCircle,
  Loader2,
  Clock,
  Banknote,
  Calendar,
  ArrowRight,
  BadgeCheck,
  AlertTriangle,
  BarChart2,
  DollarSign,
  ListTodo,
  Milestone,
  UserCog,
  TrendingUp,
  Building2,
  CircleDot,
  PlayCircle,
  PauseCircle,
  CheckCircle2,
  XCircle,
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
import { Progress } from '@/components/ui/progress'
import { DemoModeProvider } from '@/lib/demo/context'
import { DemoOverlay, QuickStartBanner } from '@/components/demo'
import { resolveQuickStart, QuickStartConfig } from '@/lib/demo/quickstart'

// ============================================================================
// IN-MEMORY DEMO DATA (Nigerian context)
// ============================================================================

const DEMO_COMPANY_NAME = 'BuildRight Construction Ltd'
const DEMO_COMPANY_LOCATION = 'Lagos, Nigeria'

// Demo Projects
const DEMO_PROJECTS = [
  {
    id: 'proj-1',
    name: 'Lekki Commercial Plaza Phase 2',
    projectCode: 'LCP-2026-001',
    status: 'IN_PROGRESS',
    health: 'GREEN',
    progress: 65,
    manager: 'Engr. Chukwu Okafor',
    startDate: '2025-06-01',
    endDate: '2026-12-31',
    budget: 850000000,
    spent: 520000000,
    tasksTotal: 48,
    tasksCompleted: 31,
  },
  {
    id: 'proj-2',
    name: 'Victoria Island Office Renovation',
    projectCode: 'VIO-2026-002',
    status: 'IN_PROGRESS',
    health: 'YELLOW',
    progress: 42,
    manager: 'Mrs. Adaeze Williams',
    startDate: '2025-09-01',
    endDate: '2026-06-30',
    budget: 320000000,
    spent: 180000000,
    tasksTotal: 32,
    tasksCompleted: 14,
  },
  {
    id: 'proj-3',
    name: 'Ikeja Industrial Warehouse',
    projectCode: 'IIW-2025-003',
    status: 'COMPLETED',
    health: 'GREEN',
    progress: 100,
    manager: 'Alhaji Musa Danjuma',
    startDate: '2024-03-01',
    endDate: '2025-11-30',
    budget: 480000000,
    spent: 495000000,
    tasksTotal: 56,
    tasksCompleted: 56,
  },
]

// Demo Tasks
const DEMO_TASKS = [
  { id: 'task-1', projectName: 'Lekki Commercial Plaza', taskNumber: 'LCP-T-001', title: 'Foundation inspection', status: 'COMPLETED', priority: 'HIGH', assignee: 'Engr. Adebayo', dueDate: '2025-07-15' },
  { id: 'task-2', projectName: 'Lekki Commercial Plaza', taskNumber: 'LCP-T-002', title: 'Steel framework installation', status: 'IN_PROGRESS', priority: 'HIGH', assignee: 'Site Team A', dueDate: '2026-01-30' },
  { id: 'task-3', projectName: 'Lekki Commercial Plaza', taskNumber: 'LCP-T-003', title: 'Electrical conduit laying', status: 'TODO', priority: 'MEDIUM', assignee: 'Electrical Crew', dueDate: '2026-02-15' },
  { id: 'task-4', projectName: 'VI Office Renovation', taskNumber: 'VIO-T-001', title: 'Demolition of interior walls', status: 'COMPLETED', priority: 'HIGH', assignee: 'Demolition Team', dueDate: '2025-10-01' },
  { id: 'task-5', projectName: 'VI Office Renovation', taskNumber: 'VIO-T-002', title: 'HVAC system upgrade', status: 'IN_PROGRESS', priority: 'HIGH', assignee: 'HVAC Contractors', dueDate: '2026-01-15' },
  { id: 'task-6', projectName: 'VI Office Renovation', taskNumber: 'VIO-T-003', title: 'Flooring installation', status: 'BLOCKED', priority: 'MEDIUM', assignee: 'Interior Team', dueDate: '2026-03-01' },
]

// Demo Milestones
const DEMO_MILESTONES = [
  { id: 'ms-1', projectName: 'Lekki Commercial Plaza', name: 'Foundation Complete', status: 'COMPLETED', targetDate: '2025-08-31', actualDate: '2025-08-28', paymentLinked: true },
  { id: 'ms-2', projectName: 'Lekki Commercial Plaza', name: 'Structural Frame Complete', status: 'IN_PROGRESS', targetDate: '2026-03-31', actualDate: null, paymentLinked: true },
  { id: 'ms-3', projectName: 'Lekki Commercial Plaza', name: 'MEP Installation', status: 'PENDING', targetDate: '2026-07-31', actualDate: null, paymentLinked: true },
  { id: 'ms-4', projectName: 'VI Office Renovation', name: 'Demolition Complete', status: 'COMPLETED', targetDate: '2025-10-15', actualDate: '2025-10-12', paymentLinked: false },
  { id: 'ms-5', projectName: 'VI Office Renovation', name: 'Systems Upgrade', status: 'AT_RISK', targetDate: '2026-02-28', actualDate: null, paymentLinked: true },
]

// Demo Team Members
const DEMO_TEAM = [
  { id: 'tm-1', name: 'Engr. Chukwu Okafor', role: 'Project Manager', department: 'Construction', tasksAssigned: 8, tasksCompleted: 5, utilization: 95 },
  { id: 'tm-2', name: 'Mrs. Adaeze Williams', role: 'Project Manager', department: 'Renovation', tasksAssigned: 6, tasksCompleted: 2, utilization: 88 },
  { id: 'tm-3', name: 'Engr. Adebayo Ogundimu', role: 'Site Engineer', department: 'Construction', tasksAssigned: 12, tasksCompleted: 9, utilization: 100 },
  { id: 'tm-4', name: 'Mr. Emeka Nwosu', role: 'Electrical Lead', department: 'MEP', tasksAssigned: 7, tasksCompleted: 4, utilization: 75 },
  { id: 'tm-5', name: 'Mrs. Fatima Hassan', role: 'Procurement Officer', department: 'Admin', tasksAssigned: 5, tasksCompleted: 3, utilization: 60 },
]

// Demo Budget Categories
const DEMO_BUDGET = [
  { category: 'Labor', budgeted: 280000000, spent: 175000000, variance: -105000000 },
  { category: 'Materials', budgeted: 420000000, spent: 385000000, variance: -35000000 },
  { category: 'Equipment', budgeted: 95000000, spent: 88000000, variance: -7000000 },
  { category: 'Contractors', budgeted: 320000000, spent: 295000000, variance: -25000000 },
  { category: 'Permits & Fees', budgeted: 35000000, spent: 32000000, variance: -3000000 },
]

// Demo Stats
const DEMO_STATS = {
  activeProjects: 2,
  completedProjects: 1,
  totalTasks: 136,
  completedTasks: 101,
  teamMembers: 24,
  totalBudget: 1650000000,
  totalSpent: 1195000000,
  avgProgress: 69,
}

// Format currency
function formatNaira(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// ============================================================================
// STATUS BADGES
// ============================================================================

function ProjectStatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-700',
    PLANNING: 'bg-blue-100 text-blue-700',
    IN_PROGRESS: 'bg-amber-100 text-amber-700',
    ON_HOLD: 'bg-orange-100 text-orange-700',
    COMPLETED: 'bg-emerald-100 text-emerald-700',
    CANCELLED: 'bg-red-100 text-red-700',
  }
  return <Badge className={`${colors[status] || 'bg-gray-100 text-gray-700'} border-0`}>{status.replace('_', ' ')}</Badge>
}

function HealthBadge({ health }: { health: string }) {
  const colors: Record<string, string> = {
    GREEN: 'bg-emerald-100 text-emerald-700',
    YELLOW: 'bg-amber-100 text-amber-700',
    RED: 'bg-red-100 text-red-700',
  }
  const icons: Record<string, React.ReactNode> = {
    GREEN: <CheckCircle2 className="h-3 w-3" />,
    YELLOW: <AlertTriangle className="h-3 w-3" />,
    RED: <XCircle className="h-3 w-3" />,
  }
  return (
    <Badge className={`${colors[health] || 'bg-gray-100 text-gray-700'} border-0 flex items-center gap-1`}>
      {icons[health]} {health}
    </Badge>
  )
}

function TaskStatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    TODO: 'bg-gray-100 text-gray-700',
    IN_PROGRESS: 'bg-blue-100 text-blue-700',
    BLOCKED: 'bg-red-100 text-red-700',
    COMPLETED: 'bg-emerald-100 text-emerald-700',
  }
  const icons: Record<string, React.ReactNode> = {
    TODO: <CircleDot className="h-3 w-3" />,
    IN_PROGRESS: <PlayCircle className="h-3 w-3" />,
    BLOCKED: <PauseCircle className="h-3 w-3" />,
    COMPLETED: <CheckCircle2 className="h-3 w-3" />,
  }
  return (
    <Badge className={`${colors[status] || 'bg-gray-100 text-gray-700'} border-0 flex items-center gap-1`}>
      {icons[status]} {status.replace('_', ' ')}
    </Badge>
  )
}

function MilestoneStatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    PENDING: 'bg-gray-100 text-gray-700',
    IN_PROGRESS: 'bg-blue-100 text-blue-700',
    AT_RISK: 'bg-orange-100 text-orange-700',
    COMPLETED: 'bg-emerald-100 text-emerald-700',
  }
  return <Badge className={`${colors[status] || 'bg-gray-100 text-gray-700'} border-0`}>{status.replace('_', ' ')}</Badge>
}

function PriorityBadge({ priority }: { priority: string }) {
  const colors: Record<string, string> = {
    LOW: 'bg-gray-100 text-gray-700',
    MEDIUM: 'bg-blue-100 text-blue-700',
    HIGH: 'bg-orange-100 text-orange-700',
    URGENT: 'bg-red-100 text-red-700',
  }
  return <Badge className={`${colors[priority] || 'bg-gray-100 text-gray-700'} border-0`}>{priority}</Badge>
}

// ============================================================================
// DEMO PREVIEW MODE
// ============================================================================

function DemoPreviewMode() {
  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-800">
          <BadgeCheck className="h-5 w-5" />
          Demo Preview Mode
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-blue-700 text-sm">
          You&apos;re viewing the Project Management Suite demo without authentication. 
          Full functionality is available with Nigerian demo data.
        </p>
        <div className="flex gap-2">
          <Link href="/auth/login">
            <Button variant="outline" size="sm">
              Sign In for Full Access
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// MAIN PAGE CONTENT
// ============================================================================

function ProjectDemoContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Quick Start handling
  const quickstartParam = searchParams.get('quickstart')
  const quickStartResult = resolveQuickStart(quickstartParam)
  const [quickStartConfig, setQuickStartConfig] = useState<QuickStartConfig | null>(
    quickStartResult.isActive ? quickStartResult.config : null
  )

  // Update quickstart when URL changes
  useEffect(() => {
    const result = resolveQuickStart(quickstartParam)
    setQuickStartConfig(result.isActive ? result.config : null)
  }, [quickstartParam])
  
  // Quick Start handlers
  const handleSwitchRole = () => {
    router.push('/project-demo')
  }
  
  const handleDismissQuickStart = () => {
    router.push('/commerce-demo')
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
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-blue-800 rounded-xl p-8 text-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            <FolderKanban className="h-10 w-10" />
            <div>
              <h1 className="text-3xl font-bold">Project Management Suite</h1>
              <p className="text-indigo-100">Project Planning & Delivery Platform</p>
            </div>
          </div>
          
          <p className="text-indigo-100 max-w-2xl mb-6">
            Complete project lifecycle management — from planning to delivery. 
            Tasks, milestones, teams, budgets, and Commerce-safe cost tracking.
          </p>

          <div className="flex flex-wrap gap-2">
            <Badge className="bg-white/20 text-white border-0">🔒 S5 Narrative Ready</Badge>
            <Badge className="bg-white/20 text-white border-0">Capability Guarded</Badge>
            <Badge className="bg-white/20 text-white border-0">Nigeria-First</Badge>
            <Badge className="bg-white/20 text-white border-0">NGN Budget Tracking</Badge>
            <Badge className="bg-white/20 text-white border-0">Commerce Boundary</Badge>
          </div>
        </div>
      </div>
      
      {/* Quick Start Role Cards (when no quickstart active) */}
      {!quickStartConfig && (
        <Card className="border-indigo-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-600" />
              Quick Start: Choose Your Role
            </CardTitle>
            <CardDescription>
              Experience the Project Management Suite from different perspectives
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link href="/project-demo?quickstart=projectOwner">
                <div className="p-4 border rounded-lg hover:bg-indigo-50 hover:border-indigo-300 transition-colors cursor-pointer">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-5 w-5 text-indigo-600" />
                    <span className="font-medium">Owner</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Visibility → cost → delivery
                  </p>
                </div>
              </Link>
              <Link href="/project-demo?quickstart=projectManager">
                <div className="p-4 border rounded-lg hover:bg-teal-50 hover:border-teal-300 transition-colors cursor-pointer">
                  <div className="flex items-center gap-2 mb-2">
                    <FolderKanban className="h-5 w-5 text-teal-600" />
                    <span className="font-medium">Manager</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Plan → execute → deliver
                  </p>
                </div>
              </Link>
              <Link href="/project-demo?quickstart=teamMember">
                <div className="p-4 border rounded-lg hover:bg-orange-50 hover:border-orange-300 transition-colors cursor-pointer">
                  <div className="flex items-center gap-2 mb-2">
                    <UserCog className="h-5 w-5 text-orange-600" />
                    <span className="font-medium">Team Member</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Tasks → updates → complete
                  </p>
                </div>
              </Link>
              <Link href="/project-demo?quickstart=projectAuditor">
                <div className="p-4 border rounded-lg hover:bg-purple-50 hover:border-purple-300 transition-colors cursor-pointer">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart2 className="h-5 w-5 text-purple-600" />
                    <span className="font-medium">Auditor</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Costs → variance → audit
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
            <Building2 className="h-5 w-5" />
            Demo Scenario: {DEMO_COMPANY_NAME}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-amber-700 text-sm">
            <strong>{DEMO_COMPANY_LOCATION}</strong> — A construction company managing multi-phase commercial 
            and renovation projects. ₦1.6B total budget across 3 projects with 24 team members.
          </p>
        </CardContent>
      </Card>

      {/* Demo Preview Mode */}
      <DemoPreviewMode />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FolderKanban className="h-4 w-4 text-indigo-600" />
              <span className="text-sm text-muted-foreground">Active Projects</span>
            </div>
            <p className="text-2xl font-bold mt-1">{DEMO_STATS.activeProjects}</p>
            <p className="text-xs text-muted-foreground">{DEMO_STATS.completedProjects} completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <ListTodo className="h-4 w-4 text-teal-600" />
              <span className="text-sm text-muted-foreground">Tasks</span>
            </div>
            <p className="text-2xl font-bold mt-1">{DEMO_STATS.completedTasks}/{DEMO_STATS.totalTasks}</p>
            <p className="text-xs text-muted-foreground">{Math.round(DEMO_STATS.completedTasks / DEMO_STATS.totalTasks * 100)}% complete</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-muted-foreground">Team Members</span>
            </div>
            <p className="text-2xl font-bold mt-1">{DEMO_STATS.teamMembers}</p>
            <p className="text-xs text-muted-foreground">Across all projects</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Banknote className="h-4 w-4 text-amber-600" />
              <span className="text-sm text-muted-foreground">Total Budget</span>
            </div>
            <p className="text-2xl font-bold mt-1">{formatNaira(DEMO_STATS.totalBudget)}</p>
            <p className="text-xs text-muted-foreground">{formatNaira(DEMO_STATS.totalSpent)} spent</p>
          </CardContent>
        </Card>
      </div>

      {/* Projects */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderKanban className="h-5 w-5 text-indigo-600" />
            Project Portfolio ({DEMO_PROJECTS.length})
          </CardTitle>
          <CardDescription>Active and completed projects</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {DEMO_PROJECTS.map((project) => (
              <div key={project.id} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-muted-foreground">{project.projectCode}</span>
                      <ProjectStatusBadge status={project.status} />
                      <HealthBadge health={project.health} />
                    </div>
                    <h4 className="font-medium mt-1">{project.name}</h4>
                    <p className="text-sm text-muted-foreground">Manager: {project.manager}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Budget</p>
                    <p className="font-medium">{formatNaira(project.budget)}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Progress</span>
                    <span>{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Tasks: {project.tasksCompleted}/{project.tasksTotal}</span>
                    <span>Spent: {formatNaira(project.spent)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tasks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListTodo className="h-5 w-5 text-teal-600" />
            Recent Tasks
          </CardTitle>
          <CardDescription>Task assignments and status</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task #</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Assignee</TableHead>
                <TableHead>Due Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {DEMO_TASKS.map((task) => (
                <TableRow key={task.id}>
                  <TableCell className="font-mono text-sm">{task.taskNumber}</TableCell>
                  <TableCell className="font-medium">{task.title}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{task.projectName}</TableCell>
                  <TableCell><TaskStatusBadge status={task.status} /></TableCell>
                  <TableCell><PriorityBadge priority={task.priority} /></TableCell>
                  <TableCell>{task.assignee}</TableCell>
                  <TableCell>{new Date(task.dueDate).toLocaleDateString('en-NG')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Milestones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Milestone className="h-5 w-5 text-purple-600" />
            Key Milestones
          </CardTitle>
          <CardDescription>Project milestones and payment triggers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {DEMO_MILESTONES.map((milestone) => (
              <div key={milestone.id} className="p-3 border rounded-lg flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <MilestoneStatusBadge status={milestone.status} />
                    {milestone.paymentLinked && (
                      <Badge variant="outline" className="text-xs">Payment Linked</Badge>
                    )}
                  </div>
                  <p className="font-medium mt-1">{milestone.name}</p>
                  <p className="text-sm text-muted-foreground">{milestone.projectName}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Target</p>
                  <p className="font-medium">{new Date(milestone.targetDate).toLocaleDateString('en-NG')}</p>
                  {milestone.actualDate && (
                    <p className="text-xs text-emerald-600">
                      Completed: {new Date(milestone.actualDate).toLocaleDateString('en-NG')}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Team */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Team Overview
          </CardTitle>
          <CardDescription>Team members and workload</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Tasks</TableHead>
                <TableHead>Utilization</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {DEMO_TEAM.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">{member.name}</TableCell>
                  <TableCell>{member.role}</TableCell>
                  <TableCell>{member.department}</TableCell>
                  <TableCell>{member.tasksCompleted}/{member.tasksAssigned}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={member.utilization} className="h-2 w-16" />
                      <span className="text-sm">{member.utilization}%</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Budget Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5 text-amber-600" />
            Budget Summary (All Projects)
          </CardTitle>
          <CardDescription>Cost tracking by category</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Budgeted</TableHead>
                <TableHead className="text-right">Spent</TableHead>
                <TableHead className="text-right">Variance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {DEMO_BUDGET.map((item) => (
                <TableRow key={item.category}>
                  <TableCell className="font-medium">{item.category}</TableCell>
                  <TableCell className="text-right">{formatNaira(item.budgeted)}</TableCell>
                  <TableCell className="text-right">{formatNaira(item.spent)}</TableCell>
                  <TableCell className={`text-right font-medium ${item.variance < 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {formatNaira(Math.abs(item.variance))} {item.variance < 0 ? 'under' : 'over'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Commerce Boundary Architecture */}
      <Card className="border-violet-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-violet-800">
            <BarChart2 className="h-5 w-5" />
            System Architecture: Commerce Boundary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-violet-50 rounded-lg p-6">
            <div className="grid md:grid-cols-3 gap-6">
              {/* Project Management Domain */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-indigo-700 font-medium">
                  <FolderKanban className="h-5 w-5" />
                  Project Management Domain
                </div>
                <div className="space-y-2 text-sm">
                  <div className="p-2 bg-white rounded border">📋 Project Planning</div>
                  <div className="p-2 bg-white rounded border">✅ Task Management</div>
                  <div className="p-2 bg-white rounded border">👥 Team Allocation</div>
                  <div className="p-2 bg-white rounded border">🎯 Milestone Tracking</div>
                  <div className="p-2 bg-white rounded border">💰 Budget Facts</div>
                </div>
              </div>
              
              {/* Boundary Arrow */}
              <div className="flex flex-col items-center justify-center">
                <div className="text-violet-600 font-medium text-center mb-2">
                  Cost Facts
                </div>
                <div className="flex items-center gap-2">
                  <ArrowRight className="h-6 w-6 text-violet-600" />
                  <ArrowRight className="h-6 w-6 text-violet-600" />
                </div>
                <div className="text-xs text-violet-600 mt-2 text-center">
                  Labor, Materials, Equipment
                </div>
              </div>
              
              {/* Commerce Domain */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-emerald-700 font-medium">
                  <DollarSign className="h-5 w-5" />
                  Commerce Suite
                </div>
                <div className="space-y-2 text-sm">
                  <div className="p-2 bg-white rounded border">🧾 Invoicing</div>
                  <div className="p-2 bg-white rounded border">💳 Payment Collection</div>
                  <div className="p-2 bg-white rounded border">📊 VAT Calculation</div>
                  <div className="p-2 bg-white rounded border">📒 Accounting Journals</div>
                  <div className="p-2 bg-white rounded border">🏦 Vendor Payments</div>
                </div>
              </div>
            </div>
            
            {/* Boundary Rule */}
            <div className="mt-6 p-4 bg-white rounded-lg border border-violet-200">
              <p className="text-violet-800 text-sm">
                <strong>Commerce Boundary Rule:</strong> Project Management creates cost facts (labor hours, material purchases, equipment usage). 
                Commerce handles invoicing, VAT calculation, and vendor payments. 
                Project Management NEVER processes payments directly.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Nigeria-First Notes */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            🇳🇬 Nigeria-First Design
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-green-700">
            <div className="space-y-2">
              <p><strong>🏗️ Construction context</strong> — Lagos commercial and industrial projects</p>
              <p><strong>💵 NGN budget tracking</strong> — Naira-denominated cost management</p>
              <p><strong>📅 Payment milestones</strong> — Phase completions tied to client payments</p>
            </div>
            <div className="space-y-2">
              <p><strong>🌧️ Seasonal planning</strong> — Rainy season impacts on schedules</p>
              <p><strong>👷 Mixed workforce</strong> — Permanent staff and contract workers</p>
              <p><strong>📈 Material cost tracking</strong> — Fluctuating prices in Nigerian market</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================================================
// MAIN PAGE EXPORT
// ============================================================================

export default function ProjectDemoPage() {
  return (
    <DemoGate>
      <DemoModeProvider>
        <div className="min-h-screen bg-gray-50/50">
          <div className="container max-w-6xl mx-auto py-8 px-4">
            <Suspense fallback={
              <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
              </div>
            }>
              <ProjectDemoContent />
            </Suspense>
          </div>
        </div>
      </DemoModeProvider>
    </DemoGate>
  )
}
