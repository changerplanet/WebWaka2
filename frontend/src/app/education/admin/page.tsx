'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import {
  GraduationCap,
  Users,
  BookOpen,
  Calendar,
  DollarSign,
  ClipboardList,
  TrendingUp,
  Plus,
  Search,
  Bell,
  Settings,
  ChevronRight,
  UserCheck,
  UserX,
  Clock,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EDUCATION_LABELS } from '@/lib/education/config';

interface DashboardStats {
  totalStudents: number;
  activeStudents: number;
  totalTeachers: number;
  totalClasses: number;
  attendanceToday: {
    present: number;
    absent: number;
    rate: number;
  };
  feeCollection: {
    expected: number;
    collected: number;
    rate: number;
  };
  upcomingExams: number;
  pendingReportCards: number;
}

interface QuickAction {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  color: string;
}

export default function SchoolAdminDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSession, setActiveSession] = useState<string>('2025/2026');
  const [activeTerm, setActiveTerm] = useState<string>('First Term');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        setLoading(false);
        setError('Request timed out. Please refresh the page.');
      }
    }, 30000);
    
    return () => clearTimeout(timeout);
  }, [loading]);

  const fetchDashboardData = async () => {
    setLoading(true);
    // Simulated data - in production, fetches from Education APIs
    setStats({
      totalStudents: 450,
      activeStudents: 438,
      totalTeachers: 28,
      totalClasses: 12,
      attendanceToday: {
        present: 412,
        absent: 26,
        rate: 94,
      },
      feeCollection: {
        expected: 45000000,
        collected: 38250000,
        rate: 85,
      },
      upcomingExams: 3,
      pendingReportCards: 156,
    });
    setLoading(false);
  };

  const quickActions: QuickAction[] = [
    {
      title: 'Add Student',
      description: 'Enroll a new student',
      icon: <Users className="w-5 h-5" />,
      href: '/education/students/new',
      color: 'bg-blue-500',
    },
    {
      title: 'Mark Attendance',
      description: 'Record daily attendance',
      icon: <Calendar className="w-5 h-5" />,
      href: '/education/attendance',
      color: 'bg-green-500',
    },
    {
      title: 'Enter Grades',
      description: 'Record student grades',
      icon: <BookOpen className="w-5 h-5" />,
      href: '/education/grades',
      color: 'bg-purple-500',
    },
    {
      title: 'Generate Reports',
      description: 'Create report cards',
      icon: <FileText className="w-5 h-5" />,
      href: '/education/reports',
      color: 'bg-orange-500',
    },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(amount);
  };

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" data-testid="education-admin-dashboard">
      {/* Top Navigation */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="bg-emerald-100 p-2 rounded-lg">
                <GraduationCap className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Education Suite</h1>
                <p className="text-xs text-gray-500">{activeSession} • {activeTerm}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative hidden md:block">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input 
                placeholder="Search students, teachers..." 
                className="pl-9 w-64 bg-gray-50"
              />
            </div>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                3
              </span>
            </Button>
            <Button variant="ghost" size="icon">
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 text-white">
          <h2 className="text-2xl font-bold mb-1">Welcome back!</h2>
          <p className="text-emerald-100 mb-4">Here's what's happening at your school today.</p>
          <div className="flex gap-3">
            <Button className="bg-white text-emerald-700 hover:bg-emerald-50">
              <Plus className="w-4 h-4 mr-2" />
              Quick Actions
            </Button>
            <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">
              View Calendar
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div 
            className="bg-white p-5 rounded-xl border cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => router.push('/education/students')}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.activeStudents}</p>
            <p className="text-sm text-gray-500">{EDUCATION_LABELS.students}</p>
            <p className="text-xs text-gray-400 mt-1">{stats.totalStudents - stats.activeStudents} inactive</p>
          </div>

          <div 
            className="bg-white p-5 rounded-xl border cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => router.push('/education/attendance')}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <UserCheck className="w-5 h-5 text-green-600" />
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${
                stats.attendanceToday.rate >= 90 ? 'bg-green-100 text-green-700' : 
                stats.attendanceToday.rate >= 75 ? 'bg-yellow-100 text-yellow-700' : 
                'bg-red-100 text-red-700'
              }`}>
                {stats.attendanceToday.rate}%
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.attendanceToday.present}</p>
            <p className="text-sm text-gray-500">Present Today</p>
            <p className="text-xs text-gray-400 mt-1">{stats.attendanceToday.absent} absent</p>
          </div>

          <div 
            className="bg-white p-5 rounded-xl border cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => router.push('/education/fees')}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="bg-purple-100 p-2 rounded-lg">
                <DollarSign className="w-5 h-5 text-purple-600" />
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${
                stats.feeCollection.rate >= 90 ? 'bg-green-100 text-green-700' : 
                stats.feeCollection.rate >= 75 ? 'bg-yellow-100 text-yellow-700' : 
                'bg-red-100 text-red-700'
              }`}>
                {stats.feeCollection.rate}%
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.feeCollection.collected)}</p>
            <p className="text-sm text-gray-500">{EDUCATION_LABELS.fees} Collected</p>
            <p className="text-xs text-gray-400 mt-1">of {formatCurrency(stats.feeCollection.expected)}</p>
          </div>

          <div 
            className="bg-white p-5 rounded-xl border cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => router.push('/education/reports')}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="bg-orange-100 p-2 rounded-lg">
                <FileText className="w-5 h-5 text-orange-600" />
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-700">
                Pending
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.pendingReportCards}</p>
            <p className="text-sm text-gray-500">{EDUCATION_LABELS.reportCards}</p>
            <p className="text-xs text-gray-400 mt-1">Need generation</p>
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

          {/* Class Overview */}
          <div className="bg-white rounded-xl border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{EDUCATION_LABELS.classes}</h3>
              <Button variant="ghost" size="sm" onClick={() => router.push('/education/classes')}>
                View All
              </Button>
            </div>
            <div className="space-y-3">
              {['JSS 1', 'JSS 2', 'JSS 3', 'SS 1', 'SS 2', 'SS 3'].map((className, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-emerald-100 text-emerald-700 font-semibold text-sm w-8 h-8 rounded-full flex items-center justify-center">
                      {className.split(' ')[1]}
                    </div>
                    <span className="font-medium text-gray-900">{className}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{35 + index * 3}</p>
                    <p className="text-xs text-gray-500">students</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[
            { label: EDUCATION_LABELS.students, icon: Users, href: '/education/students', color: 'text-blue-600 bg-blue-100' },
            { label: EDUCATION_LABELS.teachers, icon: GraduationCap, href: '/education/teachers', color: 'text-purple-600 bg-purple-100' },
            { label: EDUCATION_LABELS.grades, icon: BookOpen, href: '/education/grades', color: 'text-green-600 bg-green-100' },
            { label: 'Attendance', icon: Calendar, href: '/education/attendance', color: 'text-orange-600 bg-orange-100' },
            { label: EDUCATION_LABELS.fees, icon: DollarSign, href: '/education/fees', color: 'text-emerald-600 bg-emerald-100' },
            { label: EDUCATION_LABELS.reportCards, icon: ClipboardList, href: '/education/reports', color: 'text-red-600 bg-red-100' },
          ].map((item, index) => (
            <Button
              key={index}
              variant="outline"
              className="h-auto py-4 flex-col gap-2 hover:shadow-md transition-all"
              onClick={() => router.push(item.href)}
              data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
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
