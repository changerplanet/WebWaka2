'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Stethoscope,
  Users,
  Calendar,
  ClipboardList,
  Pill,
  DollarSign,
  Bell,
  Settings,
  Plus,
  Search,
  ChevronRight,
  UserCheck,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { HEALTH_LABELS } from '@/lib/health/config';

interface DashboardStats {
  patientsToday: number;
  appointmentsToday: number;
  completedConsultations: number;
  pendingPrescriptions: number;
  waitingPatients: number;
  revenue: number;
}

export default function ClinicAdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulated stats
    setStats({
      patientsToday: 45,
      appointmentsToday: 38,
      completedConsultations: 28,
      pendingPrescriptions: 12,
      waitingPatients: 8,
      revenue: 285000,
    });
    setLoading(false);
  }, []);

  const quickActions = [
    { title: 'New Patient', description: 'Register patient', icon: <Users className="w-5 h-5" />, href: '/health/patients/new', color: 'bg-blue-500' },
    { title: 'Book Appointment', description: 'Schedule visit', icon: <Calendar className="w-5 h-5" />, href: '/health/appointments/new', color: 'bg-green-500' },
    { title: 'Start Consultation', description: 'Begin visit', icon: <ClipboardList className="w-5 h-5" />, href: '/health/consultations', color: 'bg-purple-500' },
    { title: 'Dispense', description: 'Pharmacy queue', icon: <Pill className="w-5 h-5" />, href: '/health/pharmacy', color: 'bg-orange-500' },
  ];

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(amount);

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" data-testid="health-admin-dashboard">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="bg-cyan-100 p-2 rounded-lg">
                <Stethoscope className="w-6 h-6 text-cyan-600" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Health Suite</h1>
                <p className="text-xs text-gray-500">Clinic Management</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative hidden md:block">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input placeholder="Search patients..." className="pl-9 w-64 bg-gray-50" />
            </div>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                {stats.waitingPatients}
              </span>
            </Button>
            <Button variant="ghost" size="icon">
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-cyan-600 to-blue-600 rounded-2xl p-6 text-white">
          <h2 className="text-2xl font-bold mb-1">Good Morning, Doctor!</h2>
          <p className="text-cyan-100 mb-4">You have {stats.waitingPatients} patients waiting and {stats.appointmentsToday - stats.completedConsultations} upcoming appointments.</p>
          <div className="flex gap-3">
            <Button className="bg-white text-cyan-700 hover:bg-cyan-50">
              <Plus className="w-4 h-4 mr-2" />
              Quick Actions
            </Button>
            <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">
              View Schedule
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border cursor-pointer hover:shadow-md transition-shadow"
               onClick={() => router.push('/health/patients')}>
            <div className="flex items-center justify-between mb-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.patientsToday}</p>
            <p className="text-sm text-gray-500">{HEALTH_LABELS.patients} Today</p>
          </div>

          <div className="bg-white p-5 rounded-xl border cursor-pointer hover:shadow-md transition-shadow"
               onClick={() => router.push('/health/appointments')}>
            <div className="flex items-center justify-between mb-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <Calendar className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                {stats.completedConsultations}/{stats.appointmentsToday}
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.appointmentsToday}</p>
            <p className="text-sm text-gray-500">{HEALTH_LABELS.appointments}</p>
          </div>

          <div className="bg-white p-5 rounded-xl border cursor-pointer hover:shadow-md transition-shadow"
               onClick={() => router.push('/health/pharmacy')}>
            <div className="flex items-center justify-between mb-3">
              <div className="bg-orange-100 p-2 rounded-lg">
                <Pill className="w-5 h-5 text-orange-600" />
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-700">
                Pending
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.pendingPrescriptions}</p>
            <p className="text-sm text-gray-500">{HEALTH_LABELS.prescriptions}</p>
          </div>

          <div className="bg-white p-5 rounded-xl border">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-purple-100 p-2 rounded-lg">
                <DollarSign className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.revenue)}</p>
            <p className="text-sm text-gray-500">Today's Revenue</p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <div className="md:col-span-2 bg-white rounded-xl border p-6">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => router.push(action.href)}
                  className="flex items-center gap-4 p-4 rounded-lg border hover:bg-gray-50 transition-colors text-left"
                  data-testid={`quick-action-${index}`}
                >
                  <div className={`${action.color} p-3 rounded-lg text-white`}>
                    {action.icon}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{action.title}</p>
                    <p className="text-sm text-gray-500">{action.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Waiting Queue */}
          <div className="bg-white rounded-xl border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Waiting Queue</h3>
              <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full">
                {stats.waitingPatients} waiting
              </span>
            </div>
            <div className="space-y-3">
              {['Adaeze O.', 'Chukwuemeka E.', 'Fatima I.', 'Oluwaseun A.'].slice(0, stats.waitingPatients).map((name, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="bg-cyan-100 text-cyan-700 font-semibold text-sm w-8 h-8 rounded-full flex items-center justify-center">
                      {index + 1}
                    </div>
                    <span className="font-medium text-gray-900">{name}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    {10 + index * 5}min
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4" onClick={() => router.push('/health/consultations')}>
              View All Patients
            </Button>
          </div>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[
            { label: HEALTH_LABELS.patients, icon: Users, href: '/health/patients', color: 'text-blue-600 bg-blue-100' },
            { label: HEALTH_LABELS.appointments, icon: Calendar, href: '/health/appointments', color: 'text-green-600 bg-green-100' },
            { label: HEALTH_LABELS.consultations, icon: ClipboardList, href: '/health/consultations', color: 'text-purple-600 bg-purple-100' },
            { label: HEALTH_LABELS.prescriptions, icon: Pill, href: '/health/prescriptions', color: 'text-orange-600 bg-orange-100' },
            { label: HEALTH_LABELS.pharmacy, icon: Pill, href: '/health/pharmacy', color: 'text-cyan-600 bg-cyan-100' },
            { label: HEALTH_LABELS.billing, icon: DollarSign, href: '/health/billing', color: 'text-emerald-600 bg-emerald-100' },
          ].map((item, index) => (
            <Button
              key={index}
              variant="outline"
              className="h-auto py-4 flex-col gap-2 hover:shadow-md transition-all"
              onClick={() => router.push(item.href)}
              data-testid={`nav-${item.label.toLowerCase()}`}
            >
              <div className={`p-2 rounded-lg ${item.color}`}>
                <item.icon className="w-5 h-5" />
              </div>
              <span className="text-sm">{item.label}</span>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
