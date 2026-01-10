/**
 * RECRUITMENT & ONBOARDING SUITE — Dashboard Page
 * Phase 7C.1, S5 Admin UI
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Briefcase, 
  Users, 
  Calendar,
  FileCheck,
  ClipboardCheck,
  UserPlus,
  AlertTriangle,
  ArrowRight,
  Plus,
  TrendingUp,
  Clock
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface DashboardData {
  summary: {
    openJobs: number;
    totalApplicants: number;
    scheduledInterviews: number;
    pendingOffers: number;
    hiresThisMonth: number;
  };
  jobs: {
    total: number;
    open: number;
    draft: number;
    filled: number;
  };
  applications: {
    total: number;
    byStage: Record<string, number>;
  };
  interviews: {
    scheduled: number;
    today: number;
  };
  offers: {
    pending: number;
    sent: number;
    accepted: number;
  };
  onboarding: {
    inProgress: number;
    overdue: number;
  };
}

export default function RecruitmentDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        // Demo data for initial render
        setData({
          summary: {
            openJobs: 5,
            totalApplicants: 23,
            scheduledInterviews: 8,
            pendingOffers: 3,
            hiresThisMonth: 2,
          },
          jobs: { total: 8, open: 5, draft: 2, filled: 1 },
          applications: {
            total: 23,
            byStage: { APPLIED: 8, SCREENING: 6, INTERVIEW: 5, OFFER: 2, HIRED: 2 },
          },
          interviews: { scheduled: 8, today: 3 },
          offers: { pending: 1, sent: 2, accepted: 1 },
          onboarding: { inProgress: 2, overdue: 1 },
        });
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch dashboard:', error);
        setLoading(false);
      }
    }

    fetchDashboard();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const quickLinks = [
    { href: '/recruitment-suite/jobs', icon: Briefcase, label: 'Jobs', color: 'bg-blue-500' },
    { href: '/recruitment-suite/applications', icon: Users, label: 'Applications', color: 'bg-green-500' },
    { href: '/recruitment-suite/interviews', icon: Calendar, label: 'Interviews', color: 'bg-purple-500' },
    { href: '/recruitment-suite/offers', icon: FileCheck, label: 'Offers', color: 'bg-orange-500' },
    { href: '/recruitment-suite/onboarding', icon: ClipboardCheck, label: 'Onboarding', color: 'bg-teal-500' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" data-testid="recruitment-loading">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6" data-testid="recruitment-dashboard">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <UserPlus className="h-8 w-8 text-blue-600" />
            Recruitment & Onboarding
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage hiring pipeline, interviews, and new hire onboarding
          </p>
        </div>
        <Badge variant="outline" className="text-blue-600 border-blue-600" data-testid="demo-mode-badge">
          Demo Mode
        </Badge>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {quickLinks.map((link) => (
          <Link key={link.href} href={link.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full" data-testid={`quicklink-${link.label.toLowerCase()}`}>
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

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card data-testid="stat-open-jobs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Jobs</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.summary.openJobs || 0}</div>
            <p className="text-xs text-muted-foreground">
              {data?.jobs.draft || 0} drafts pending
            </p>
          </CardContent>
        </Card>

        <Card data-testid="stat-total-applicants">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Applicants</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.summary.totalApplicants || 0}</div>
            <p className="text-xs text-muted-foreground">
              {data?.applications.byStage?.SCREENING || 0} in screening
            </p>
          </CardContent>
        </Card>

        <Card data-testid="stat-interviews">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Interviews</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.summary.scheduledInterviews || 0}</div>
            <p className="text-xs text-muted-foreground">
              {data?.interviews.today || 0} scheduled today
            </p>
          </CardContent>
        </Card>

        <Card data-testid="stat-offers">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Offers</CardTitle>
            <FileCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.summary.pendingOffers || 0}</div>
            <p className="text-xs text-muted-foreground">
              {data?.offers.accepted || 0} accepted this month
            </p>
          </CardContent>
        </Card>

        <Card data-testid="stat-hires">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hires This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{data?.summary.hiresThisMonth || 0}</div>
            <p className="text-xs text-muted-foreground">
              {data?.onboarding.inProgress || 0} onboarding
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Overview & Alerts */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Pipeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Application Pipeline
            </CardTitle>
            <CardDescription>Current applicants by stage</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(data?.applications.byStage || {}).map(([stage, count]) => (
              <div key={stage} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${
                    stage === 'APPLIED' ? 'bg-gray-400' :
                    stage === 'SCREENING' ? 'bg-blue-400' :
                    stage === 'INTERVIEW' ? 'bg-purple-400' :
                    stage === 'OFFER' ? 'bg-orange-400' :
                    stage === 'HIRED' ? 'bg-green-400' : 'bg-gray-300'
                  }`}></div>
                  <span className="text-sm capitalize">{stage.toLowerCase().replace('_', ' ')}</span>
                </div>
                <Badge variant="secondary">{count}</Badge>
              </div>
            ))}
            <Link href="/recruitment-suite/applications">
              <Button variant="link" className="mt-2 w-full">
                View Pipeline <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Attention Required
            </CardTitle>
            <CardDescription>Items needing immediate attention</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data?.interviews.today && data.interviews.today > 0 && (
              <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="font-medium text-sm">Interviews Today</p>
                    <p className="text-xs text-muted-foreground">{data.interviews.today} interviews scheduled</p>
                  </div>
                </div>
                <Link href="/recruitment-suite/interviews?filter=today">
                  <Button variant="ghost" size="sm">
                    View <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            )}

            {data?.onboarding.overdue && data.onboarding.overdue > 0 && (
              <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="font-medium text-sm">Overdue Tasks</p>
                    <p className="text-xs text-muted-foreground">{data.onboarding.overdue} onboarding tasks overdue</p>
                  </div>
                </div>
                <Link href="/recruitment-suite/onboarding?filter=overdue">
                  <Button variant="ghost" size="sm">
                    View <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            )}

            {data?.offers.sent && data.offers.sent > 0 && (
              <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileCheck className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="font-medium text-sm">Offers Awaiting Response</p>
                    <p className="text-xs text-muted-foreground">{data.offers.sent} offers sent, pending response</p>
                  </div>
                </div>
                <Link href="/recruitment-suite/offers?status=SENT">
                  <Button variant="ghost" size="sm">
                    View <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Quick Actions
          </CardTitle>
          <CardDescription>Common recruitment tasks</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Link href="/recruitment-suite/jobs?action=new">
            <Button variant="outline" className="w-full justify-start" data-testid="action-create-job">
              <Briefcase className="mr-2 h-4 w-4" />
              Post New Job
            </Button>
          </Link>
          <Link href="/recruitment-suite/applications?action=new">
            <Button variant="outline" className="w-full justify-start" data-testid="action-add-applicant">
              <UserPlus className="mr-2 h-4 w-4" />
              Add Applicant
            </Button>
          </Link>
          <Link href="/recruitment-suite/interviews?action=schedule">
            <Button variant="outline" className="w-full justify-start" data-testid="action-schedule-interview">
              <Calendar className="mr-2 h-4 w-4" />
              Schedule Interview
            </Button>
          </Link>
          <Link href="/recruitment-suite/offers?action=new">
            <Button variant="outline" className="w-full justify-start" data-testid="action-create-offer">
              <FileCheck className="mr-2 h-4 w-4" />
              Create Offer
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Today's Interviews */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Today&apos;s Interviews
            </span>
            <Badge variant="secondary">{data?.interviews.today || 0} scheduled</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Demo interview items */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Adaeze Okonkwo</p>
                <p className="text-sm text-muted-foreground">Senior Accountant • Phone Screen</p>
              </div>
              <div className="text-right">
                <Badge variant="secondary">10:00 AM</Badge>
                <p className="text-xs text-muted-foreground mt-1">with Mrs. Amaka</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Emeka Nwosu</p>
                <p className="text-sm text-muted-foreground">Sales Representative • In-Person</p>
              </div>
              <div className="text-right">
                <Badge variant="secondary">2:00 PM</Badge>
                <p className="text-xs text-muted-foreground mt-1">Panel Interview</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Fatima Abdullahi</p>
                <p className="text-sm text-muted-foreground">Software Developer • Video Call</p>
              </div>
              <div className="text-right">
                <Badge variant="secondary">4:30 PM</Badge>
                <p className="text-xs text-muted-foreground mt-1">Technical Assessment</p>
              </div>
            </div>
          </div>
          <Link href="/recruitment-suite/interviews">
            <Button variant="link" className="mt-4 w-full">
              View All Interviews <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
