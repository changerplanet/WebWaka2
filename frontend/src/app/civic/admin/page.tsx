'use client';

/**
 * CIVIC SUITE: Admin Dashboard
 * 
 * Main dashboard for civic organization administrators.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Users, 
  DollarSign, 
  FileText, 
  Calendar, 
  Vote,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Plus,
  Building2,
  MessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CivicStats {
  constituents: {
    totalConstituents: number;
    activeConstituents: number;
    suspendedConstituents: number;
    pendingApproval: number;
  };
  dues: {
    totalBilled: number;
    totalCollected: number;
    totalPending: number;
    totalOverdue: number;
    collectionRate: number;
  };
  serviceRequests: {
    total: number;
    open: number;
    resolved: number;
    escalated: number;
    overdue: number;
  };
  certificates: {
    total: number;
    pending: number;
    issued: number;
  };
  events: {
    upcoming: number;
    completed: number;
  };
  polls: {
    active: number;
    scheduled: number;
  };
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function CivicAdminDashboard() {
  const [stats, setStats] = useState<CivicStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch('/api/civic');
        const data = await response.json();
        
        if (data.success) {
          setStats(data.stats);
        } else {
          setError(data.error || 'Failed to load dashboard data');
        }
      } catch (err) {
        setError('Failed to connect to server');
      } finally {
        setLoading(false);
      }
    }
    
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading Civic Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600">{error}</p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto" data-testid="civic-admin-dashboard">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Civic Dashboard</h1>
          <p className="text-gray-500 mt-1">Harmony Estate Residents Association</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" asChild>
            <Link href="/civic/constituents">
              <MessageSquare className="h-4 w-4 mr-2" />
              Send Announcement
            </Link>
          </Button>
          <Button asChild>
            <Link href="/civic/constituents">
              <Plus className="h-4 w-4 mr-2" />
              Add Member
            </Link>
          </Button>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl border p-6 shadow-sm" data-testid="stat-members">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-500">Total Members</span>
            <Users className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="text-3xl font-bold">{stats.constituents.totalConstituents}</div>
          <p className="text-sm text-gray-500 mt-1">
            {stats.constituents.activeConstituents} active
            {stats.constituents.pendingApproval > 0 && (
              <span className="text-yellow-600 ml-2">
                ({stats.constituents.pendingApproval} pending)
              </span>
            )}
          </p>
        </div>

        <div className="bg-white rounded-xl border p-6 shadow-sm" data-testid="stat-collection">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-500">Dues Collected</span>
            <DollarSign className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="text-3xl font-bold">{formatCurrency(stats.dues.totalCollected)}</div>
          <p className="text-sm text-gray-500 mt-1">
            {stats.dues.collectionRate.toFixed(0)}% collection rate
          </p>
          {stats.dues.totalOverdue > 0 && (
            <p className="text-sm text-red-500 mt-1">
              {formatCurrency(stats.dues.totalOverdue)} overdue
            </p>
          )}
        </div>

        <div className="bg-white rounded-xl border p-6 shadow-sm" data-testid="stat-requests">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-500">Open Requests</span>
            <FileText className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="text-3xl font-bold">{stats.serviceRequests.open}</div>
          <p className="text-sm text-gray-500 mt-1">
            {stats.serviceRequests.resolved} resolved
          </p>
          {stats.serviceRequests.escalated > 0 && (
            <p className="text-sm text-orange-500 mt-1">
              {stats.serviceRequests.escalated} escalated
            </p>
          )}
        </div>

        <div className="bg-white rounded-xl border p-6 shadow-sm" data-testid="stat-events">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-500">Upcoming Events</span>
            <Calendar className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="text-3xl font-bold">{stats.events.upcoming}</div>
          <p className="text-sm text-gray-500 mt-1">
            {stats.polls.scheduled > 0 && `${stats.polls.scheduled} polls scheduled`}
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-2">Quick Actions</h2>
        <p className="text-sm text-gray-500 mb-4">Common tasks for estate management</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link 
            href="/civic/constituents"
            className="flex flex-col items-center gap-2 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <DollarSign className="h-6 w-6 text-emerald-600" />
            <span className="text-sm font-medium">Record Payment</span>
          </Link>
          <Link 
            href="/civic/constituents"
            className="flex flex-col items-center gap-2 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FileText className="h-6 w-6 text-blue-600" />
            <span className="text-sm font-medium">View Requests</span>
          </Link>
          <Link 
            href="/civic/constituents"
            className="flex flex-col items-center gap-2 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <CheckCircle className="h-6 w-6 text-purple-600" />
            <span className="text-sm font-medium">Issue Certificate</span>
          </Link>
          <Link 
            href="/civic/constituents"
            className="flex flex-col items-center gap-2 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Calendar className="h-6 w-6 text-orange-600" />
            <span className="text-sm font-medium">Schedule Event</span>
          </Link>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Actions */}
        <div className="bg-white rounded-xl border p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold">Pending Actions</h2>
              <p className="text-sm text-gray-500">Items requiring attention</p>
            </div>
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
          </div>
          <div className="space-y-4">
            {stats.constituents.pendingApproval > 0 && (
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="font-medium">{stats.constituents.pendingApproval} Membership Applications</p>
                    <p className="text-sm text-gray-500">Awaiting approval</p>
                  </div>
                </div>
                <Link href="/civic/constituents" className="text-gray-400 hover:text-gray-600">
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}
            
            {stats.certificates.pending > 0 && (
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="font-medium">{stats.certificates.pending} Certificate Requests</p>
                    <p className="text-sm text-gray-500">Ready for processing</p>
                  </div>
                </div>
                <Link href="/civic/constituents" className="text-gray-400 hover:text-gray-600">
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}
            
            {stats.serviceRequests.escalated > 0 && (
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="font-medium">{stats.serviceRequests.escalated} Escalated Requests</p>
                    <p className="text-sm text-gray-500">SLA breached</p>
                  </div>
                </div>
                <Link href="/civic/constituents" className="text-gray-400 hover:text-gray-600">
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}
            
            {stats.dues.totalOverdue > 0 && (
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="font-medium">{formatCurrency(stats.dues.totalOverdue)} Overdue</p>
                    <p className="text-sm text-gray-500">Payment follow-up needed</p>
                  </div>
                </div>
                <Link href="/civic/constituents" className="text-gray-400 hover:text-gray-600">
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}
            
            {stats.constituents.pendingApproval === 0 && 
             stats.certificates.pending === 0 && 
             stats.serviceRequests.escalated === 0 &&
             stats.dues.totalOverdue === 0 && (
              <div className="flex items-center justify-center p-6 text-gray-500">
                <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
                All caught up! No pending actions.
              </div>
            )}
          </div>
        </div>

        {/* Module Navigation */}
        <div className="bg-white rounded-xl border p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-2">Civic Modules</h2>
          <p className="text-sm text-gray-500 mb-4">Access all civic management features</p>
          <div className="grid grid-cols-2 gap-4">
            <Link 
              href="/civic/constituents" 
              className="flex items-center gap-3 p-4 rounded-lg border hover:bg-gray-50 transition-colors"
            >
              <Users className="h-8 w-8 text-emerald-600" />
              <div>
                <p className="font-medium">Members</p>
                <p className="text-sm text-gray-500">{stats.constituents.totalConstituents} registered</p>
              </div>
            </Link>
            
            <Link 
              href="/civic/constituents" 
              className="flex items-center gap-3 p-4 rounded-lg border hover:bg-gray-50 transition-colors"
            >
              <DollarSign className="h-8 w-8 text-green-600" />
              <div>
                <p className="font-medium">Dues & Levies</p>
                <p className="text-sm text-gray-500">{stats.dues.collectionRate.toFixed(0)}% collected</p>
              </div>
            </Link>
            
            <Link 
              href="/civic/constituents" 
              className="flex items-center gap-3 p-4 rounded-lg border hover:bg-gray-50 transition-colors"
            >
              <FileText className="h-8 w-8 text-blue-600" />
              <div>
                <p className="font-medium">Service Requests</p>
                <p className="text-sm text-gray-500">{stats.serviceRequests.open} open</p>
              </div>
            </Link>
            
            <Link 
              href="/civic/constituents" 
              className="flex items-center gap-3 p-4 rounded-lg border hover:bg-gray-50 transition-colors"
            >
              <CheckCircle className="h-8 w-8 text-purple-600" />
              <div>
                <p className="font-medium">Certificates</p>
                <p className="text-sm text-gray-500">{stats.certificates.issued} issued</p>
              </div>
            </Link>
            
            <Link 
              href="/civic/constituents" 
              className="flex items-center gap-3 p-4 rounded-lg border hover:bg-gray-50 transition-colors"
            >
              <Calendar className="h-8 w-8 text-orange-600" />
              <div>
                <p className="font-medium">Events</p>
                <p className="text-sm text-gray-500">{stats.events.upcoming} upcoming</p>
              </div>
            </Link>
            
            <Link 
              href="/civic/constituents" 
              className="flex items-center gap-3 p-4 rounded-lg border hover:bg-gray-50 transition-colors"
            >
              <Vote className="h-8 w-8 text-indigo-600" />
              <div>
                <p className="font-medium">Voting & Polls</p>
                <p className="text-sm text-gray-500">{stats.polls.active > 0 ? `${stats.polls.active} active` : 'No active polls'}</p>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer Note */}
      <div className="text-center text-sm text-gray-500 py-4">
        <Building2 className="h-4 w-4 inline mr-1" />
        Civic Suite powered by WebWaka Platform
      </div>
    </div>
  );
}
