/**
 * LEGAL PRACTICE SUITE — Dashboard Page
 * Phase 7B.1, S5 Admin UI
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
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
  Plus,
  Gavel
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface DashboardStats {
  matters: { totalMatters: number; activeMatters: number; closedMatters: number; upcomingDeadlines: number };
  time: { totalHours: number; billableHours: number; unbilledHours: number; unbilledAmount: number };
  deadlines: { pendingDeadlines: number; overdueDeadlines: number; upcomingCourtDates: number; next7DaysDeadlines: number };
  retainers: { activeRetainers: number; totalBalance: number; lowBalanceRetainers: number };
}

export default function LegalPracticeDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Demo data for now
    setStats({
      matters: { totalMatters: 45, activeMatters: 28, closedMatters: 17, upcomingDeadlines: 12 },
      time: { totalHours: 342, billableHours: 285, unbilledHours: 78, unbilledAmount: 3900000 },
      deadlines: { pendingDeadlines: 24, overdueDeadlines: 2, upcomingCourtDates: 8, next7DaysDeadlines: 6 },
      retainers: { activeRetainers: 18, totalBalance: 12500000, lowBalanceRetainers: 3 },
    });
    setLoading(false);
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const quickLinks = [
    { href: '/legal-practice-suite/matters', icon: Briefcase, label: 'Matters', color: 'bg-blue-500' },
    { href: '/legal-practice-suite/clients', icon: Users, label: 'Clients', color: 'bg-green-500' },
    { href: '/legal-practice-suite/deadlines', icon: Calendar, label: 'Deadlines', color: 'bg-red-500' },
    { href: '/legal-practice-suite/time-billing', icon: Clock, label: 'Time & Billing', color: 'bg-purple-500' },
    { href: '/legal-practice-suite/documents', icon: FileText, label: 'Documents', color: 'bg-yellow-500' },
    { href: '/legal-practice-suite/filings', icon: Gavel, label: 'Filings', color: 'bg-orange-500' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Scale className="h-8 w-8 text-blue-600" />
            Legal Practice Management
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage matters, clients, billing, and deadlines
          </p>
        </div>
        <Badge variant="outline" className="text-blue-600 border-blue-600">
          Demo Mode
        </Badge>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {quickLinks.map((link) => (
          <Link key={link.href} href={link.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="flex flex-col items-center justify-center p-4">
                <div className={`${link.color} rounded-full p-3 mb-2`}>
                  <link.icon className="h-5 w-5 text-white" />
                </div>
                <span className="text-sm font-medium text-center">{link.label}</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Matters</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.matters.activeMatters || 0}</div>
            <p className="text-xs text-muted-foreground">
              of {stats?.matters.totalMatters} total matters
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Billable Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.time.billableHours || 0}h</div>
            <p className="text-xs text-muted-foreground">
              {stats?.time.unbilledHours || 0}h unbilled
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unbilled Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats?.time.unbilledAmount || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Ready to invoice
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Retainer Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.retainers.totalBalance || 0)}</div>
            <p className="text-xs text-muted-foreground">
              across {stats?.retainers.activeRetainers} accounts
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts & Deadlines */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Alerts Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Attention Required
            </CardTitle>
            <CardDescription>Items needing immediate attention</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats?.deadlines.overdueDeadlines && stats.deadlines.overdueDeadlines > 0 && (
              <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="font-medium text-sm">Overdue Deadlines</p>
                    <p className="text-xs text-muted-foreground">{stats.deadlines.overdueDeadlines} deadlines past due</p>
                  </div>
                </div>
                <Link href="/legal-practice-suite/deadlines?status=overdue">
                  <Button variant="ghost" size="sm">
                    View <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            )}

            {stats?.retainers.lowBalanceRetainers && stats.retainers.lowBalanceRetainers > 0 && (
              <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="font-medium text-sm">Low Retainer Balance</p>
                    <p className="text-xs text-muted-foreground">{stats.retainers.lowBalanceRetainers} accounts need top-up</p>
                  </div>
                </div>
                <Link href="/legal-practice-suite/time-billing?lowBalance=true">
                  <Button variant="ghost" size="sm">
                    View <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            )}

            {stats?.deadlines.upcomingCourtDates && stats.deadlines.upcomingCourtDates > 0 && (
              <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <Gavel className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-sm">Upcoming Court Dates</p>
                    <p className="text-xs text-muted-foreground">{stats.deadlines.upcomingCourtDates} court appearances scheduled</p>
                  </div>
                </div>
                <Link href="/legal-practice-suite/deadlines?type=COURT_DATE">
                  <Button variant="ghost" size="sm">
                    View <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Quick Actions
            </CardTitle>
            <CardDescription>Common tasks</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Link href="/legal-practice-suite/matters?action=new">
              <Button variant="outline" className="w-full justify-start">
                <Briefcase className="mr-2 h-4 w-4" />
                Open New Matter
              </Button>
            </Link>
            <Link href="/legal-practice-suite/time-billing?action=log">
              <Button variant="outline" className="w-full justify-start">
                <Clock className="mr-2 h-4 w-4" />
                Log Time Entry
              </Button>
            </Link>
            <Link href="/legal-practice-suite/deadlines?action=new">
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="mr-2 h-4 w-4" />
                Add Deadline
              </Button>
            </Link>
            <Link href="/legal-practice-suite/filings?action=new">
              <Button variant="outline" className="w-full justify-start">
                <Gavel className="mr-2 h-4 w-4" />
                Record Filing
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Deadlines */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming Deadlines
            </span>
            <Badge variant="secondary">{stats?.deadlines.next7DaysDeadlines || 0} this week</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Demo deadline items */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Filing Deadline - Motion for Adjournment</p>
                <p className="text-sm text-muted-foreground">MAT-2026-0012 • Chief Okafor v. ABC Ltd</p>
              </div>
              <div className="text-right">
                <Badge variant="destructive">Tomorrow</Badge>
                <p className="text-xs text-muted-foreground mt-1">Federal High Court, Lagos</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Court Appearance</p>
                <p className="text-sm text-muted-foreground">MAT-2026-0008 • State v. Mr. Adebayo</p>
              </div>
              <div className="text-right">
                <Badge variant="secondary">Jan 10, 2026</Badge>
                <p className="text-xs text-muted-foreground mt-1">Lagos State High Court</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Brief Submission</p>
                <p className="text-sm text-muted-foreground">MAT-2026-0015 • Zenith Bank v. Pinnacle Enterprises</p>
              </div>
              <div className="text-right">
                <Badge variant="secondary">Jan 12, 2026</Badge>
                <p className="text-xs text-muted-foreground mt-1">Court of Appeal, Lagos</p>
              </div>
            </div>
          </div>
          <Link href="/legal-practice-suite/deadlines">
            <Button variant="link" className="mt-4 w-full">
              View All Deadlines <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
