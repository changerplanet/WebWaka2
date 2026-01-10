'use client'

/**
 * HEALTH SUITE: Demo Portal
 * 
 * Showcases Health Suite capabilities with Nigerian demo data.
 * Read-only, demo-safe experience for partners and investors.
 * 
 * @module app/health-demo
 * @phase S5 (Narrative Integration)
 * @standard Platform Standardisation v2
 */

import { useEffect, useState, Suspense, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Stethoscope,
  Users,
  Calendar,
  ClipboardList,
  Activity,
  FlaskConical,
  Pill,
  Receipt,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  Heart,
  UserCheck,
  FileText,
  Clock,
  Banknote,
  Shield,
  Globe,
  Building2,
  UserPlus,
  Ambulance,
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
import { DemoOverlay, QuickStartBanner } from '@/components/demo'

// ============================================================================
// TYPES
// ============================================================================

interface DemoStats {
  patients: number
  providers: number
  appointments: number
  visits: number
  encounters: number
  prescriptions: number
  labOrders: number
  billingFacts: number
  pendingBillingTotal: number
}

interface Patient {
  id: string
  mrn: string
  firstName: string
  lastName: string
  gender: string
  dateOfBirth: string
  bloodGroup: string
  genotype: string
  status: string
}

interface Visit {
  id: string
  visitNumber: string
  patient?: { firstName: string; lastName: string; mrn: string }
  provider?: { firstName: string; lastName: string; title: string }
  chiefComplaint: string
  status: string
  visitDate: string
}

interface Encounter {
  id: string
  visit?: { visitNumber: string }
  patient?: { firstName: string; lastName: string }
  provider?: { firstName: string; lastName: string; title: string }
  vitals: Record<string, unknown>
  status: string
  encounterDate: string
}

interface BillingFact {
  id: string
  patient?: { firstName: string; lastName: string }
  factType: string
  description: string
  amount: number
  status: string
  serviceDate: string
}

// ============================================================================
// HEALTH MODULE CARDS
// ============================================================================

const HEALTH_MODULES = [
  {
    id: 'patients',
    name: 'Patient Registry',
    description: 'Patient demographics, medical history, and guardian relationships',
    icon: Users,
    color: 'teal',
    highlights: [
      'Nigerian names & demographics',
      'Blood group & genotype tracking',
      'Guardian/NOK relationships',
      'Medical history & allergies'
    ]
  },
  {
    id: 'appointments',
    name: 'Appointments & Scheduling',
    description: 'Walk-in and scheduled visits with provider assignments',
    icon: Calendar,
    color: 'blue',
    highlights: [
      'Walk-in patient support',
      'Provider availability',
      'Appointment reminders',
      'Queue management'
    ]
  },
  {
    id: 'visits',
    name: 'Visit Management',
    description: 'Patient check-in, triage, and visit lifecycle tracking',
    icon: ClipboardList,
    color: 'violet',
    highlights: [
      'Visit registration',
      'Chief complaint capture',
      'Status tracking',
      'Waiting queue'
    ]
  },
  {
    id: 'encounters',
    name: 'Clinical Encounters',
    description: 'Vitals, diagnoses, and clinical notes (append-only)',
    icon: Activity,
    color: 'rose',
    highlights: [
      'Vital signs recording',
      'ICD-10 diagnoses',
      'Append-only notes',
      'Clinical audit trail'
    ]
  },
  {
    id: 'prescriptions',
    name: 'Prescriptions',
    description: 'Medication orders with Nigerian drug formulary',
    icon: Pill,
    color: 'emerald',
    highlights: [
      'Common Nigerian medications',
      'Dosage & frequency',
      'Dispensing tracking',
      'Prescription history'
    ]
  },
  {
    id: 'lab',
    name: 'Laboratory',
    description: 'Lab orders, results, and diagnostic tracking',
    icon: FlaskConical,
    color: 'amber',
    highlights: [
      'Common Nigerian lab tests',
      'Order → Result workflow',
      'Immutable results',
      'Reference ranges'
    ]
  },
]

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getColorClasses(color: string) {
  const colors: Record<string, { bg: string; bgLight: string; text: string; border: string }> = {
    teal: { bg: 'bg-teal-600', bgLight: 'bg-teal-50', text: 'text-teal-600', border: 'border-teal-200' },
    blue: { bg: 'bg-blue-600', bgLight: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
    violet: { bg: 'bg-violet-600', bgLight: 'bg-violet-50', text: 'text-violet-600', border: 'border-violet-200' },
    rose: { bg: 'bg-rose-600', bgLight: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-200' },
    emerald: { bg: 'bg-emerald-600', bgLight: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' },
    amber: { bg: 'bg-amber-600', bgLight: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
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

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    'ACTIVE': 'bg-green-100 text-green-800',
    'INACTIVE': 'bg-gray-100 text-gray-800',
    'COMPLETED': 'bg-green-100 text-green-800',
    'IN_PROGRESS': 'bg-blue-100 text-blue-800',
    'IN_CONSULTATION': 'bg-blue-100 text-blue-800',
    'WAITING': 'bg-yellow-100 text-yellow-800',
    'REGISTERED': 'bg-yellow-100 text-yellow-800',
    'SCHEDULED': 'bg-blue-100 text-blue-800',
    'CONFIRMED': 'bg-green-100 text-green-800',
    'CANCELLED': 'bg-red-100 text-red-800',
    'DISCHARGED': 'bg-gray-100 text-gray-800',
    'PENDING': 'bg-yellow-100 text-yellow-800',
    'BILLED': 'bg-green-100 text-green-800',
    'WAIVED': 'bg-gray-100 text-gray-800',
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

function getBloodGroupDisplay(bloodGroup: string): string {
  const mapping: Record<string, string> = {
    'O_POSITIVE': 'O+',
    'O_NEGATIVE': 'O-',
    'A_POSITIVE': 'A+',
    'A_NEGATIVE': 'A-',
    'B_POSITIVE': 'B+',
    'B_NEGATIVE': 'B-',
    'AB_POSITIVE': 'AB+',
    'AB_NEGATIVE': 'AB-',
  }
  return mapping[bloodGroup] || bloodGroup
}

// ============================================================================
// COMPONENTS
// ============================================================================

function ModuleCard({ module }: { module: typeof HEALTH_MODULES[0] }) {
  const Icon = module.icon
  const colors = getColorClasses(module.color)

  return (
    <Card className="group hover:shadow-lg transition-all duration-200" data-testid={`module-card-${module.id}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className={`p-3 rounded-xl ${colors.bgLight}`}>
            <Icon className={`w-6 h-6 ${colors.text}`} />
          </div>
          <Badge variant="secondary" className="bg-teal-100 text-teal-700">
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
          <span className="text-xs text-teal-600 font-medium">{trend}</span>
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
            This page displays sample Nigerian healthcare data for demonstration purposes. 
            All data shown is fictional and represents typical clinic operations.
          </p>
        </div>
      </div>
    </div>
  )
}

function NigeriaFirstBadges() {
  return (
    <div className="flex flex-wrap gap-3 mb-8">
      <Badge className="bg-teal-500/20 text-teal-300 border-teal-400/30">
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
      <Badge className="bg-rose-500/20 text-rose-300 border-rose-400/30">
        <Heart className="w-3 h-3 mr-1" />
        VAT Exempt
      </Badge>
      <Badge className="bg-violet-500/20 text-violet-300 border-violet-400/30">
        <Banknote className="w-3 h-3 mr-1" />
        Cash-Friendly
      </Badge>
    </div>
  )
}

// ============================================================================
// MAIN CONTENT COMPONENT
// ============================================================================

function HealthDemoContent() {
  const [loading, setLoading] = useState(true)
  const [seeding, setSeeding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<DemoStats | null>(null)
  const [patients, setPatients] = useState<Patient[]>([])
  const [visits, setVisits] = useState<Visit[]>([])
  const [encounters, setEncounters] = useState<Encounter[]>([])
  const [billingFacts, setBillingFacts] = useState<BillingFact[]>([])
  const [initialized, setInitialized] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Load demo data
  const loadDemoData = async () => {
    setLoading(true)
    setError(null)

    try {
      // Check if initialized
      const configRes = await fetch('/api/health?action=config')
      const configData = await configRes.json()
      
      // Check for 401 (unauthenticated) - show preview mode
      if (configRes.status === 401 || configData.error === 'Unauthorized') {
        setIsAuthenticated(false)
        setInitialized(false)
        setLoading(false)
        return
      }
      
      setIsAuthenticated(true)
      
      if (!configData.success || !configData.config) {
        setInitialized(false)
        setLoading(false)
        return
      }
      
      setInitialized(true)

      // Load stats
      const statsRes = await fetch('/api/health?action=stats')
      const statsData = await statsRes.json()
      if (statsData.success) {
        setStats(statsData.stats)
      }

      // Load patients (first 10)
      const patientsRes = await fetch('/api/health/patients?limit=10')
      const patientsData = await patientsRes.json()
      if (patientsData.success) {
        setPatients(patientsData.patients || [])
      }

      // Load visits (first 10)
      const visitsRes = await fetch('/api/health/visits?limit=10')
      const visitsData = await visitsRes.json()
      if (visitsData.success) {
        setVisits(visitsData.visits || [])
      }

      // Load encounters (first 10)
      const encountersRes = await fetch('/api/health/encounters?limit=10')
      const encountersData = await encountersRes.json()
      if (encountersData.success) {
        setEncounters(encountersData.encounters || [])
      }

      // Load billing facts (first 10)
      const billingRes = await fetch('/api/health/billing-facts?limit=10')
      const billingData = await billingRes.json()
      if (billingData.success) {
        setBillingFacts(billingData.billingFacts || [])
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
      const res = await fetch('/api/health/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'seed' }),
      })
      const data = await res.json()
      
      if (data.success) {
        await loadDemoData()
      } else {
        setError(data.error || data.message || 'Failed to seed demo data')
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
          <Loader2 className="w-8 h-8 animate-spin text-teal-600 mx-auto mb-4" />
          <p className="text-muted-foreground">Loading Health Suite demo...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-teal-900 via-teal-800 to-cyan-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center gap-2 text-teal-300 text-sm mb-4">
            <span>WebWaka Platform</span>
            <ChevronRight className="w-4 h-4" />
            <Link href="/commerce-demo" className="hover:text-white transition-colors">
              Commerce Suite
            </Link>
            <ChevronRight className="w-4 h-4" />
            <Link href="/education-demo" className="hover:text-white transition-colors">
              Education Suite
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white">Health Suite</span>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <h1 className="text-4xl sm:text-5xl font-bold mb-4" data-testid="page-title">
                Health Suite
              </h1>
              <p className="text-lg text-teal-100 mb-6">
                Complete outpatient clinic management for Nigerian healthcare facilities. 
                Patient registry, appointments, clinical encounters, prescriptions, labs, 
                and billing facts — all integrated and privacy-first.
              </p>
              
              <NigeriaFirstBadges />

              <p className="text-sm text-teal-200">
                Demo: <strong>BrightCare Medical Centre, Ikeja</strong>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                <Users className="w-6 h-6 text-white/70 mx-auto mb-2" />
                <p className="text-3xl font-bold text-white">{stats?.patients || 0}</p>
                <p className="text-sm text-white/70">Patients</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                <Stethoscope className="w-6 h-6 text-white/70 mx-auto mb-2" />
                <p className="text-3xl font-bold text-white">{stats?.providers || 0}</p>
                <p className="text-sm text-white/70">Providers</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                <Activity className="w-6 h-6 text-white/70 mx-auto mb-2" />
                <p className="text-3xl font-bold text-white">{stats?.visits || 0}</p>
                <p className="text-sm text-white/70">Visits</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                <Heart className="w-6 h-6 text-white/70 mx-auto mb-2" />
                <p className="text-3xl font-bold text-white">VAT</p>
                <p className="text-sm text-white/70">Exempt</p>
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
                You are viewing the Health Suite capabilities showcase. Sign in with a 
                tenant that has the <code className="bg-blue-100 px-1 rounded">health</code> capability 
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
              <Stethoscope className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Demo Data Not Loaded</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Click the button below to seed Nigerian demo data for BrightCare Medical Centre, 
                including patients, providers, appointments, and clinical records.
              </p>
              <Button 
                onClick={seedDemoData} 
                disabled={seeding}
                className="bg-teal-600 hover:bg-teal-700"
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
            Health Suite Modules
          </h2>
          <p className="text-muted-foreground text-center mb-8 max-w-2xl mx-auto">
            Six integrated modules covering the complete outpatient clinic workflow.
            All APIs are capability-guarded, tenant-scoped, and privacy-first.
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="module-grid">
            {HEALTH_MODULES.map(module => (
              <ModuleCard key={module.id} module={module} />
            ))}
          </div>
        </div>

        {/* Data Preview Section - Only show if initialized */}
        {initialized && stats && (
          <>
            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
              <StatCard value={stats.patients} label="Patients" icon={Users} />
              <StatCard value={stats.providers} label="Providers" icon={Stethoscope} />
              <StatCard value={stats.appointments} label="Appointments" icon={Calendar} />
              <StatCard value={stats.visits} label="Visits" icon={ClipboardList} />
              <StatCard value={stats.encounters} label="Encounters" icon={Activity} />
              <StatCard value={stats.prescriptions} label="Prescriptions" icon={Pill} />
            </div>

            {/* Patients Preview */}
            {patients.length > 0 && (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-teal-600" />
                    Patient Registry Preview
                  </CardTitle>
                  <CardDescription>Sample patients from BrightCare Medical Centre</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>MRN</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Gender</TableHead>
                        <TableHead>Blood Group</TableHead>
                        <TableHead>Genotype</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {patients.slice(0, 6).map(patient => (
                        <TableRow key={patient.id}>
                          <TableCell className="font-mono text-sm">{patient.mrn}</TableCell>
                          <TableCell className="font-medium">{patient.firstName} {patient.lastName}</TableCell>
                          <TableCell>{patient.gender}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{getBloodGroupDisplay(patient.bloodGroup)}</Badge>
                          </TableCell>
                          <TableCell>{patient.genotype}</TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(patient.status)}>{patient.status}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* Visits Preview */}
            {visits.length > 0 && (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardList className="w-5 h-5 text-violet-600" />
                    Recent Visits
                  </CardTitle>
                  <CardDescription>Patient visits with chief complaints</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Visit #</TableHead>
                        <TableHead>Patient</TableHead>
                        <TableHead>Provider</TableHead>
                        <TableHead>Chief Complaint</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {visits.slice(0, 5).map(visit => (
                        <TableRow key={visit.id}>
                          <TableCell className="font-mono text-sm">{visit.visitNumber}</TableCell>
                          <TableCell className="font-medium">
                            {visit.patient ? `${visit.patient.firstName} ${visit.patient.lastName}` : '-'}
                          </TableCell>
                          <TableCell>
                            {visit.provider ? `${visit.provider.title} ${visit.provider.lastName}` : '-'}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">{visit.chiefComplaint}</TableCell>
                          <TableCell>{formatDate(visit.visitDate)}</TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(visit.status)}>{visit.status.replace('_', ' ')}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* Two Column Layout: Encounters & Billing */}
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              {/* Encounters Preview */}
              {encounters.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="w-5 h-5 text-rose-600" />
                      Clinical Encounters
                    </CardTitle>
                    <CardDescription>Append-only clinical records</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {encounters.slice(0, 5).map(encounter => (
                        <div key={encounter.id} className="flex items-center justify-between py-2 border-b last:border-0">
                          <div>
                            <p className="font-medium text-sm">
                              {encounter.patient ? `${encounter.patient.firstName} ${encounter.patient.lastName}` : '-'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {encounter.provider ? `${encounter.provider.title} ${encounter.provider.lastName}` : '-'}
                              {' • '}
                              {formatDate(encounter.encounterDate)}
                            </p>
                          </div>
                          <Badge className={getStatusColor(encounter.status)}>{encounter.status.replace('_', ' ')}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Billing Facts Preview */}
              {billingFacts.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Receipt className="w-5 h-5 text-amber-600" />
                      Billing Facts
                    </CardTitle>
                    <CardDescription>Service charges (facts only, no invoices)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {billingFacts.slice(0, 5).map(fact => (
                        <div key={fact.id} className="flex items-center justify-between py-2 border-b last:border-0">
                          <div>
                            <p className="font-medium text-sm">{fact.description}</p>
                            <p className="text-xs text-muted-foreground">
                              {fact.patient ? `${fact.patient.firstName} ${fact.patient.lastName}` : '-'}
                              {' • '}
                              {fact.factType}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-sm">{formatCurrency(fact.amount)}</p>
                            <Badge className={getStatusColor(fact.status)}>{fact.status}</Badge>
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
            <CardTitle className="text-xl text-center">Health Suite Architecture</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="bg-white/5 rounded-xl p-4">
                <h4 className="font-semibold text-teal-400 mb-3">Registry Layer</h4>
                <ul className="space-y-2 text-sm text-slate-300">
                  <li>• Patients</li>
                  <li>• Guardians</li>
                  <li>• Providers</li>
                  <li>• Facilities</li>
                </ul>
              </div>

              <div className="bg-white/5 rounded-xl p-4">
                <h4 className="font-semibold text-blue-400 mb-3">Scheduling Layer</h4>
                <ul className="space-y-2 text-sm text-slate-300">
                  <li>• Appointments</li>
                  <li>• Walk-ins</li>
                  <li>• Visits</li>
                  <li>• Queue</li>
                </ul>
              </div>

              <div className="bg-white/5 rounded-xl p-4">
                <h4 className="font-semibold text-rose-400 mb-3">Clinical Layer</h4>
                <ul className="space-y-2 text-sm text-slate-300">
                  <li>• Encounters (Append-only)</li>
                  <li>• Diagnoses (ICD-10)</li>
                  <li>• Clinical Notes</li>
                  <li>• Vitals</li>
                </ul>
              </div>

              <div className="bg-white/5 rounded-xl p-4">
                <h4 className="font-semibold text-amber-400 mb-3">Commerce Boundary</h4>
                <ul className="space-y-2 text-sm text-slate-300">
                  <li>• Billing Facts</li>
                  <li>• → Commerce Billing</li>
                  <li>• → Payments</li>
                  <li>• → Accounting</li>
                </ul>
              </div>
            </div>

            {/* Commerce Boundary Notice */}
            <div className="mt-6 p-4 bg-white/5 rounded-xl border border-amber-500/30">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-300">Commerce Boundary Compliance</p>
                  <p className="text-sm text-slate-400 mt-1">
                    Health Suite emits <strong>billing facts only</strong>. It never creates invoices, 
                    calculates totals, applies VAT (healthcare is VAT-exempt), records payments, 
                    or touches accounting journals. The canonical flow is: 
                    <code className="bg-white/10 px-1.5 py-0.5 rounded mx-1">
                      Health → Billing → Payments → Accounting
                    </code>
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Nigeria-First Features */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-teal-600" />
              Nigeria-First Healthcare Design
            </CardTitle>
            <CardDescription>
              Built for Nigerian healthcare realities and regulatory requirements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Heart className="w-4 h-4 text-rose-600" />
                  Clinical Features
                </h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Blood group tracking (O+, A+, B+, AB+, etc.)</li>
                  <li>• Genotype tracking (AA, AS, SS, AC, SC)</li>
                  <li>• Common Nigerian diagnoses</li>
                  <li>• Local medication formulary</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Banknote className="w-4 h-4 text-amber-600" />
                  Financial Design
                </h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• VAT-exempt healthcare services</li>
                  <li>• Cash-payment friendly</li>
                  <li>• NGN currency default</li>
                  <li>• Billing facts (no direct invoicing)</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-600" />
                  Privacy & Compliance
                </h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• HIPAA-like posture</li>
                  <li>• Append-only clinical records</li>
                  <li>• Full audit trail</li>
                  <li>• Consent on registration</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer Links */}
        <div className="text-center py-8 border-t">
          <p className="text-muted-foreground text-sm mb-4">
            Health Suite is part of the WebWaka Platform
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/commerce-demo" className="text-sm text-teal-600 hover:text-teal-700">
              Commerce Suite →
            </Link>
            <Link href="/education-demo" className="text-sm text-teal-600 hover:text-teal-700">
              Education Suite →
            </Link>
            <Link href="/dashboard" className="text-sm text-teal-600 hover:text-teal-700">
              Dashboard →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// WRAPPER WITH DEMO MODE
// ============================================================================

function HealthDemoWrapper() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [quickStartConfig, setQuickStartConfig] = useState<QuickStartConfig | null>(null)
  
  // Handle Quick Start resolution
  useEffect(() => {
    const quickstartParam = searchParams.get('quickstart')
    if (quickstartParam) {
      const result = resolveQuickStart(quickstartParam)
      if (result.isActive && result.config) {
        // Only activate for Health-specific roles
        const healthRoles = ['clinic', 'patient', 'healthregulator']
        if (healthRoles.includes(quickstartParam.toLowerCase())) {
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
      
      <HealthDemoContent />
    </>
  )
}

// ============================================================================
// MAIN PAGE EXPORT
// ============================================================================

export default function HealthDemoPortal() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    }>
      <DemoModeProvider>
        <HealthDemoWrapper />
      </DemoModeProvider>
    </Suspense>
  )
}
