'use client'

/**
 * EDUCATION SUITE: Demo Portal
 * 
 * Showcases Education Suite capabilities with Nigerian demo data.
 * Read-only, demo-safe experience for partners and investors.
 * 
 * @module app/education-demo
 * @phase S5 (Narrative Integration)
 * @standard Platform Standardisation v2
 */

import { useEffect, useState, Suspense, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  GraduationCap,
  Users,
  BookOpen,
  Calendar,
  ClipboardCheck,
  Receipt,
  TrendingUp,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  School,
  UserCheck,
  FileText,
  Award,
  Clock,
  DollarSign,
  BarChart3,
  Globe,
  Shield,
  Layers,
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

// Demo Mode Integration (S5)
import { DemoModeProvider, useDemoMode, resolveQuickStart, QuickStartConfig } from '@/lib/demo'
import { DemoOverlay, QuickStartBanner, DemoIndicator } from '@/components/demo'

// ============================================================================
// TYPES
// ============================================================================

interface DemoStats {
  students: { total: number; active: number } | number  // API returns object, handle both
  staff: number
  classes: number
  subjects: number
  guardians: number
  enrollments?: number
  results?: number
  attendance?: number
  feesPaid?: number
  feesOutstanding?: number
  currentSession?: string | null
}

interface Student {
  id: string
  studentId: string
  fullName: string
  gender: string
  class?: { name: string }
  status: string
}

interface Result {
  id: string
  student?: { fullName: string; studentId: string }
  subject?: { name: string; code: string }
  totalScore: number
  grade: string
  remark: string
}

interface AttendanceRecord {
  id: string
  student?: { fullName: string }
  attendanceDate: string  // Field name from Prisma schema
  status: string
}

interface FeeAssignment {
  id: string
  student?: { fullName: string }
  feeStructure?: { name: string }
  finalAmount: number
  amountPaid: number
  status: string
}

// ============================================================================
// EDUCATION MODULE CARDS
// ============================================================================

const EDUCATION_MODULES = [
  {
    id: 'students',
    name: 'Student Registry',
    description: 'Student profiles, guardians, and enrollment lifecycle',
    icon: Users,
    color: 'emerald',
    highlights: [
      'Nigerian names & demographics',
      'Guardian relationships',
      'Blood group & genotype tracking',
      'Admission workflow'
    ]
  },
  {
    id: 'academic',
    name: 'Academic Structure',
    description: 'Sessions, terms, classes, and subjects management',
    icon: School,
    color: 'blue',
    highlights: [
      '3-term academic calendar',
      'JSS 1-3, SS 1-3 classes',
      'Nigerian curriculum subjects',
      'Teacher assignments'
    ]
  },
  {
    id: 'attendance',
    name: 'Attendance Tracking',
    description: 'Daily attendance with backfill support for offline tolerance',
    icon: UserCheck,
    color: 'teal',
    highlights: [
      'Daily/period attendance',
      'Bulk marking',
      'Backfill capability',
      'Attendance reports'
    ]
  },
  {
    id: 'assessments',
    name: 'Assessment & Results',
    description: 'CA, exams, grading, and result computation',
    icon: ClipboardCheck,
    color: 'violet',
    highlights: [
      '40% CA / 60% Exam weighting',
      'A-F grading scale',
      'Class positions',
      'Result sheets'
    ]
  },
  {
    id: 'fees',
    name: 'Fee Management',
    description: 'Fee structures, assignments, and billing integration',
    icon: Receipt,
    color: 'amber',
    highlights: [
      'Tuition, levies, exam fees',
      'Installment support',
      'VAT-exempt (Education)',
      'Billing → Accounting flow'
    ]
  },
  {
    id: 'reports',
    name: 'Report Cards',
    description: 'Term reports with grades, positions, and remarks',
    icon: FileText,
    color: 'rose',
    highlights: [
      'Auto-generated reports',
      'Teacher remarks',
      'Principal comments',
      'Position calculation'
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
    teal: { bg: 'bg-teal-600', bgLight: 'bg-teal-50', text: 'text-teal-600', border: 'border-teal-200' },
    violet: { bg: 'bg-violet-600', bgLight: 'bg-violet-50', text: 'text-violet-600', border: 'border-violet-200' },
    amber: { bg: 'bg-amber-600', bgLight: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
    rose: { bg: 'bg-rose-600', bgLight: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-200' },
  }
  return colors[color] || colors.blue
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(amount)
}

function getGradeColor(grade: string): string {
  const colors: Record<string, string> = {
    'A': 'bg-green-100 text-green-800',
    'B': 'bg-blue-100 text-blue-800',
    'C': 'bg-yellow-100 text-yellow-800',
    'D': 'bg-orange-100 text-orange-800',
    'E': 'bg-red-100 text-red-800',
    'F': 'bg-red-200 text-red-900',
  }
  return colors[grade] || 'bg-gray-100 text-gray-800'
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    'PRESENT': 'bg-green-100 text-green-800',
    'ABSENT': 'bg-red-100 text-red-800',
    'LATE': 'bg-yellow-100 text-yellow-800',
    'PAID': 'bg-green-100 text-green-800',
    'PENDING': 'bg-yellow-100 text-yellow-800',
    'OVERDUE': 'bg-red-100 text-red-800',
    'ACTIVE': 'bg-green-100 text-green-800',
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

// Helper to get student count from either number or { total, active } format
function getStudentCount(students: DemoStats['students']): number {
  if (typeof students === 'number') return students
  return students?.total || 0
}

// ============================================================================
// COMPONENTS
// ============================================================================

function ModuleCard({ module }: { module: typeof EDUCATION_MODULES[0] }) {
  const Icon = module.icon
  const colors = getColorClasses(module.color)

  return (
    <Card className="group hover:shadow-lg transition-all duration-200" data-testid={`module-card-${module.id}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className={`p-3 rounded-xl ${colors.bgLight}`}>
            <Icon className={`w-6 h-6 ${colors.text}`} />
          </div>
          <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
            <CheckCircle className="w-3 h-3 mr-1" />
            Active
          </Badge>
        </div>
        <CardTitle className="mt-4">{module.name}</CardTitle>
        <CardDescription>{module.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {module.highlights.map((highlight, idx) => (
            <div key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
              <ChevronRight className={`w-4 h-4 ${colors.text}`} />
              <span>{highlight}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function StatCard({ 
  value, 
  label, 
  icon: Icon,
  trend,
}: { 
  value: string | number
  label: string
  icon: React.ComponentType<{ className?: string }>
  trend?: string
}) {
  return (
    <div className="bg-white rounded-xl border p-4" data-testid={`stat-${label.toLowerCase().replace(/\s/g, '-')}`}>
      <div className="flex items-center justify-between mb-2">
        <Icon className="w-5 h-5 text-muted-foreground" />
        {trend && (
          <span className="text-xs text-emerald-600 font-medium">{trend}</span>
        )}
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}

function DemoBanner() {
  return (
    <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-lg p-4 mb-6" data-testid="demo-banner">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-amber-800">Demo Data Mode</p>
          <p className="text-sm text-amber-700">
            This page displays sample Nigerian school data for demonstration purposes. 
            All data shown is fictional and represents typical school operations.
          </p>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// MAIN CONTENT
// ============================================================================

function EducationDemoContent() {
  const [loading, setLoading] = useState(true)
  const [seeding, setSeeding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<DemoStats | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [results, setResults] = useState<Result[]>([])
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
  const [fees, setFees] = useState<FeeAssignment[]>([])
  const [initialized, setInitialized] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Load demo data
  const loadDemoData = async () => {
    setLoading(true)
    setError(null)

    try {
      // Check if initialized
      const configRes = await fetch('/api/education?action=config')
      const configData = await configRes.json()
      
      // Check for 401 (unauthenticated) - show preview mode
      if (configRes.status === 401 || configData.error === 'Unauthorized') {
        setIsAuthenticated(false)
        setInitialized(false)
        setLoading(false)
        return
      }
      
      setIsAuthenticated(true)
      
      if (!configData.success || !configData.initialized) {
        setInitialized(false)
        setLoading(false)
        return
      }
      
      setInitialized(true)

      // Load stats
      const statsRes = await fetch('/api/education?action=stats')
      const statsData = await statsRes.json()
      if (statsData.success) {
        setStats(statsData.stats)
      }

      // Load students (first 10)
      const studentsRes = await fetch('/api/education/students?limit=10')
      const studentsData = await studentsRes.json()
      if (studentsData.success) {
        setStudents(studentsData.students || [])
      }

      // Load results (first 10)
      const resultsRes = await fetch('/api/education/assessments?entity=results&limit=10')
      const resultsData = await resultsRes.json()
      if (resultsData.success) {
        setResults(resultsData.results || [])
      }

      // Load attendance (first 10)
      const attendanceRes = await fetch('/api/education/attendance?limit=10')
      const attendanceData = await attendanceRes.json()
      if (attendanceData.success) {
        setAttendance(attendanceData.attendances || [])
      }

      // Load fees (first 10)
      const feesRes = await fetch('/api/education/fees?entity=assignments&limit=10')
      const feesData = await feesRes.json()
      if (feesData.success) {
        setFees(feesData.assignments || [])
      }

    } catch (err) {
      console.error('Error loading demo data:', err)
      setError('Failed to load demo data')
    } finally {
      setLoading(false)
    }
  }

  // Seed demo data
  const seedDemoData = async () => {
    setSeeding(true)
    setError(null)

    try {
      const res = await fetch('/api/education/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'seed' }),
      })
      const data = await res.json()
      
      if (data.success) {
        await loadDemoData()
      } else {
        setError(data.error || 'Failed to seed demo data')
      }
    } catch (err) {
      console.error('Error seeding demo data:', err)
      setError('Failed to seed demo data')
    } finally {
      setSeeding(false)
    }
  }

  useEffect(() => {
    loadDemoData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-muted-foreground">Loading Education Suite demo...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Demo Indicator Banner */}
      <DemoIndicator variant="banner" />

      {/* Hero Header */}
      <div className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center gap-2 text-emerald-300 text-sm mb-4">
            <span>WebWaka Platform</span>
            <ChevronRight className="w-4 h-4" />
            <Link href="/commerce-demo" className="hover:text-white transition-colors">
              Commerce Suite
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white">Education Suite</span>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <h1 className="text-4xl sm:text-5xl font-bold mb-4" data-testid="page-title">
                Education Suite
              </h1>
              <p className="text-lg text-emerald-100 mb-6">
                Complete school management for Nigerian institutions. Student registry, 
                academics, attendance, assessments, fees, and report cards — all integrated.
              </p>
              
              <div className="flex flex-wrap gap-3 mb-8">
                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-400/30">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  S3 API Complete
                </Badge>
                <Badge className="bg-blue-500/20 text-blue-300 border-blue-400/30">
                  <Shield className="w-3 h-3 mr-1" />
                  Capability Guarded
                </Badge>
                <Badge className="bg-amber-500/20 text-amber-300 border-amber-400/30">
                  <Globe className="w-3 h-3 mr-1" />
                  Nigeria-First
                </Badge>
              </div>

              <p className="text-sm text-emerald-200">
                Demo: <strong>Bright Future Academy, Lagos</strong>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                <GraduationCap className="w-6 h-6 text-white/70 mx-auto mb-2" />
                <p className="text-3xl font-bold text-white">{stats ? getStudentCount(stats.students) : 0}</p>
                <p className="text-sm text-white/70">Students</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                <Users className="w-6 h-6 text-white/70 mx-auto mb-2" />
                <p className="text-3xl font-bold text-white">{stats?.staff || 0}</p>
                <p className="text-sm text-white/70">Staff</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                <School className="w-6 h-6 text-white/70 mx-auto mb-2" />
                <p className="text-3xl font-bold text-white">{stats?.classes || 0}</p>
                <p className="text-sm text-white/70">Classes</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                <Receipt className="w-6 h-6 text-white/70 mx-auto mb-2" />
                <p className="text-3xl font-bold text-white">NGN</p>
                <p className="text-sm text-white/70">VAT Exempt</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Demo Banner */}
        <DemoBanner />

        {/* Unauthenticated Preview State */}
        {!isAuthenticated && (
          <Card className="mb-8 border-blue-200 bg-blue-50/50">
            <CardContent className="py-8 text-center">
              <div className="flex items-center justify-center gap-2 text-blue-700 mb-4">
                <Shield className="w-5 h-5" />
                <span className="font-semibold">Demo Preview Mode</span>
              </div>
              <p className="text-blue-600 text-sm max-w-lg mx-auto mb-4">
                You are viewing the Education Suite capabilities showcase. Sign in with a 
                tenant that has the <code className="bg-blue-100 px-1 rounded">education</code> capability 
                enabled to seed and interact with live demo data.
              </p>
              <p className="text-xs text-blue-500">
                Preview mode • No live data displayed
              </p>
            </CardContent>
          </Card>
        )}

        {/* Authenticated but Not Initialized State */}
        {isAuthenticated && !initialized && (
          <Card className="mb-8">
            <CardContent className="py-12 text-center">
              <GraduationCap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Demo Data Not Loaded</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Click the button below to seed Nigerian demo data for Bright Future Academy, 
                including students, staff, classes, and academic records.
              </p>
              <Button 
                onClick={seedDemoData} 
                disabled={seeding}
                className="bg-emerald-600 hover:bg-emerald-700"
                data-testid="seed-demo-btn"
              >
                {seeding ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Seeding Demo Data...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Load Nigerian Demo Data
                  </>
                )}
              </Button>
              {error && (
                <p className="text-sm text-red-600 mt-4">{error}</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Module Cards */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">
            Education Suite Modules
          </h2>
          <p className="text-muted-foreground text-center mb-8 max-w-2xl mx-auto">
            Six integrated modules covering the complete school management lifecycle.
            All APIs are capability-guarded and tenant-scoped.
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="module-grid">
            {EDUCATION_MODULES.map(module => (
              <ModuleCard key={module.id} module={module} />
            ))}
          </div>
        </div>

        {/* Data Preview Section - Only show if initialized */}
        {initialized && stats && (
          <>
            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
              <StatCard value={getStudentCount(stats.students)} label="Students" icon={Users} />
              <StatCard value={stats.staff} label="Staff" icon={GraduationCap} />
              <StatCard value={stats.classes} label="Classes" icon={School} />
              <StatCard value={stats.subjects} label="Subjects" icon={BookOpen} />
              <StatCard value={stats.enrollments || 0} label="Enrollments" icon={UserCheck} />
              <StatCard value={stats.results || 0} label="Results" icon={Award} />
            </div>

            {/* Students Preview */}
            {students.length > 0 && (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-emerald-600" />
                    Student Registry Preview
                  </CardTitle>
                  <CardDescription>Sample students from Bright Future Academy</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Gender</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.slice(0, 6).map(student => (
                        <TableRow key={student.id}>
                          <TableCell className="font-mono text-sm">{student.studentId}</TableCell>
                          <TableCell className="font-medium">{student.fullName}</TableCell>
                          <TableCell>{student.gender}</TableCell>
                          <TableCell>{student.class?.name || '-'}</TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(student.status)}>{student.status}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* Results Preview */}
            {results.length > 0 && (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-violet-600" />
                    Assessment Results Preview
                  </CardTitle>
                  <CardDescription>First Term 2025/2026 results (40% CA + 60% Exam)</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Total Score</TableHead>
                        <TableHead>Grade</TableHead>
                        <TableHead>Remark</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {results.slice(0, 6).map(result => (
                        <TableRow key={result.id}>
                          <TableCell className="font-medium">{result.student?.fullName || '-'}</TableCell>
                          <TableCell>{result.subject?.name || '-'}</TableCell>
                          <TableCell>{result.totalScore}/100</TableCell>
                          <TableCell>
                            <Badge className={getGradeColor(result.grade)}>{result.grade}</Badge>
                          </TableCell>
                          <TableCell>{result.remark}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* Two Column Layout: Attendance & Fees */}
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              {/* Attendance Preview */}
              {attendance.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <UserCheck className="w-5 h-5 text-teal-600" />
                      Attendance Snapshot
                    </CardTitle>
                    <CardDescription>Recent attendance records</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {attendance.slice(0, 5).map(record => (
                        <div key={record.id} className="flex items-center justify-between py-2 border-b last:border-0">
                          <div>
                            <p className="font-medium text-sm">{record.student?.fullName || '-'}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(record.attendanceDate).toLocaleDateString('en-NG', { 
                                weekday: 'short', month: 'short', day: 'numeric' 
                              })}
                            </p>
                          </div>
                          <Badge className={getStatusColor(record.status)}>{record.status}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Fees Preview */}
              {fees.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Receipt className="w-5 h-5 text-amber-600" />
                      Fee Collection Status
                    </CardTitle>
                    <CardDescription>First Term 2025/2026 fee assignments</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {fees.slice(0, 5).map(fee => (
                        <div key={fee.id} className="flex items-center justify-between py-2 border-b last:border-0">
                          <div>
                            <p className="font-medium text-sm">{fee.student?.fullName || '-'}</p>
                            <p className="text-xs text-muted-foreground">{fee.feeStructure?.name || '-'}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-sm">{formatCurrency(fee.amountPaid)}</p>
                            <Badge className={getStatusColor(fee.status)}>{fee.status}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </>
        )}

        {/* Architecture Overview */}
        <Card className="bg-slate-900 text-white border-0 mb-8">
          <CardHeader>
            <CardTitle className="text-xl text-center">Education Suite Architecture</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="bg-white/5 rounded-xl p-4">
                <h4 className="font-semibold text-emerald-400 mb-3">Registry Layer</h4>
                <ul className="space-y-2 text-sm text-slate-300">
                  <li>• Students</li>
                  <li>• Guardians</li>
                  <li>• Staff</li>
                  <li>• Enrollments</li>
                </ul>
              </div>

              <div className="bg-white/5 rounded-xl p-4">
                <h4 className="font-semibold text-blue-400 mb-3">Academic Layer</h4>
                <ul className="space-y-2 text-sm text-slate-300">
                  <li>• Sessions & Terms</li>
                  <li>• Classes</li>
                  <li>• Subjects</li>
                  <li>• Attendance</li>
                </ul>
              </div>

              <div className="bg-white/5 rounded-xl p-4">
                <h4 className="font-semibold text-violet-400 mb-3">Assessment Layer</h4>
                <ul className="space-y-2 text-sm text-slate-300">
                  <li>• CA & Exams</li>
                  <li>• Results</li>
                  <li>• Grading (A-F)</li>
                  <li>• Report Cards</li>
                </ul>
              </div>

              <div className="bg-white/5 rounded-xl p-4">
                <h4 className="font-semibold text-amber-400 mb-3">Finance Layer</h4>
                <ul className="space-y-2 text-sm text-slate-300">
                  <li>• Fee Structures</li>
                  <li>• Fee Facts → Billing</li>
                  <li>• VAT Exempt</li>
                  <li>• NGN Currency</li>
                </ul>
              </div>
            </div>

            {/* Commerce Reuse Flow */}
            <div className="mt-8 p-4 bg-white/5 rounded-xl">
              <h4 className="font-semibold text-center mb-4">Commerce Reuse Boundary</h4>
              <div className="flex items-center justify-center gap-4 text-sm">
                <span className="bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded">Education</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
                <span className="text-slate-400">Fee Facts</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
                <span className="bg-violet-500/20 text-violet-300 px-3 py-1 rounded">Billing</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
                <span className="bg-teal-500/20 text-teal-300 px-3 py-1 rounded">Payments</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
                <span className="bg-cyan-500/20 text-cyan-300 px-3 py-1 rounded">Accounting</span>
              </div>
              <p className="text-xs text-slate-400 text-center mt-3">
                Education Suite emits fee facts only. It never handles money or accounting directly.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Nigeria-First Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="text-center">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Globe className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Nigeria-First Design</h3>
            <p className="text-sm text-gray-500">
              Nigerian names, 3-term calendar, JSS/SSS structure, 
              state of origin, genotype tracking, and NGN currency.
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Capability Guards</h3>
            <p className="text-sm text-gray-500">
              All 11 API routes protected with session-based capability checks. 
              Tenant-scoped queries ensure data isolation.
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Layers className="w-6 h-6 text-violet-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Grading Standard</h3>
            <p className="text-sm text-gray-500">
              Nigerian grading: A (70-100), B (60-69), C (50-59), 
              D (45-49), E (40-44), F (0-39). 40% CA / 60% Exam.
            </p>
          </div>
        </div>

        {/* Footer Note */}
        <div className="text-center">
          <p className="text-sm text-gray-400">
            Education Suite S4 Demo • Platform Standardisation v2 • 
            <span className="text-emerald-600 font-medium"> Nigeria-First</span>
          </p>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// MAIN PAGE
// ============================================================================

function EducationDemoWrapper() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [quickStartConfig, setQuickStartConfig] = useState<QuickStartConfig | null>(null)
  
  // Handle Quick Start resolution
  useEffect(() => {
    const quickstartParam = searchParams.get('quickstart')
    if (quickstartParam) {
      const result = resolveQuickStart(quickstartParam)
      if (result.isActive && result.config) {
        // Only activate for school or parent roles (Education-specific)
        if (quickstartParam.toLowerCase() === 'school' || quickstartParam.toLowerCase() === 'parent') {
          setQuickStartConfig(result.config)
        }
      }
    }
  }, [searchParams])

  // Handle Quick Start actions
  const handleSwitchRole = useCallback(() => {
    // Navigate to commerce-demo with role selector
    router.push('/commerce-demo')
  }, [router])

  const handleDismissQuickStart = useCallback(() => {
    setQuickStartConfig(null)
    // Clear URL param without navigation
    const url = new URL(window.location.href)
    url.searchParams.delete('quickstart')
    window.history.replaceState({}, '', url.toString())
  }, [])

  return (
    <>
      {/* Demo Overlay - Shows when in partner demo mode */}
      <DemoOverlay />
      
      {/* Quick Start Banner - Shows when accessed via ?quickstart= */}
      {quickStartConfig && (
        <QuickStartBanner
          config={quickStartConfig}
          onSwitchRole={handleSwitchRole}
          onDismiss={handleDismissQuickStart}
        />
      )}
      
      <EducationDemoContent />
    </>
  )
}

export default function EducationDemoPortal() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    }>
      <DemoModeProvider>
        <EducationDemoWrapper />
      </DemoModeProvider>
    </Suspense>
  )
}
