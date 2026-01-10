'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Globe,
  GitBranch,
  Layout,
  Sparkles,
  BarChart3,
  Settings,
  ArrowRight,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  FileText,
  Layers,
  Target,
  Users,
  TrendingUp,
  Eye,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface SuiteStats {
  sites: {
    total: number;
    published: number;
    draft: number;
    totalViews: number;
  };
  funnels: {
    total: number;
    active: number;
    paused: number;
    totalConversions: number;
  };
  templates: {
    total: number;
    categories: number;
  };
  ai: {
    totalGenerations: number;
    approved: number;
    rejected: number;
  };
}

interface Capability {
  label: string;
  coverage: string;
  features: string[];
  gaps?: string[];
}

export default function SitesFunnelsSuiteAdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<SuiteStats | null>(null);
  const [capabilities, setCapabilities] = useState<Record<string, Capability>>({});
  const [suiteInfo, setSuiteInfo] = useState<any>(null);

  useEffect(() => {
    fetchSuiteData();
  }, []);

  const fetchSuiteData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/sites-funnels-suite');
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
        setCapabilities(data.config?.capabilities || {});
        setSuiteInfo(data);
      }
    } catch (error) {
      console.error('Error fetching suite data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const capabilityList = Object.entries(capabilities);

  return (
    <div className="min-h-screen bg-slate-50" data-testid="sites-funnels-suite-admin">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <Globe className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Sites & Funnels Suite</h1>
                <p className="text-sm text-slate-500">Build websites and funnels for your clients</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                <Zap className="w-3 h-3 mr-1" />
                DEMO MODE
              </Badge>
              <Button variant="outline" size="sm" onClick={fetchSuiteData}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Suite Overview */}
        <div className="grid gap-6 md:grid-cols-4 mb-8">
          <Card data-testid="sites-stat-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Sites</CardTitle>
              <Layout className="h-4 w-4 text-violet-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.sites.total || 0}</div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-green-600">{stats?.sites.published || 0} published</span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs text-slate-500">{stats?.sites.draft || 0} drafts</span>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="funnels-stat-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Funnels</CardTitle>
              <GitBranch className="h-4 w-4 text-violet-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.funnels.total || 0}</div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-green-600">{stats?.funnels.active || 0} active</span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs text-orange-500">{stats?.funnels.paused || 0} paused</span>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="views-stat-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Total Views</CardTitle>
              <Eye className="h-4 w-4 text-violet-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.sites.totalViews || 0}</div>
              <p className="text-xs text-slate-500 mt-1">Across all sites</p>
            </CardContent>
          </Card>

          <Card data-testid="conversions-stat-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Conversions</CardTitle>
              <Target className="h-4 w-4 text-violet-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.funnels.totalConversions || 0}</div>
              <p className="text-xs text-slate-500 mt-1">Funnel completions</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-violet-500"
            onClick={() => router.push('/partner-portal/sites')}
            data-testid="manage-sites-card"
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-violet-100 rounded-lg">
                  <Layout className="w-5 h-5 text-violet-600" />
                </div>
                <div>
                  <h3 className="font-medium">Manage Sites</h3>
                  <p className="text-xs text-slate-500">Create and edit websites</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-purple-500"
            onClick={() => router.push('/partner-portal/funnels')}
            data-testid="manage-funnels-card"
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <GitBranch className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-medium">Manage Funnels</h3>
                  <p className="text-xs text-slate-500">Create conversion funnels</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-blue-500"
            onClick={() => router.push('/partner-portal/sites')}
            data-testid="templates-card"
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Layers className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium">Templates</h3>
                  <p className="text-xs text-slate-500">{stats?.templates.total || 0} available</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-amber-500"
            data-testid="ai-content-card"
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Sparkles className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-medium">AI Content</h3>
                  <p className="text-xs text-slate-500">{stats?.ai.totalGenerations || 0} generated</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </CardContent>
          </Card>
        </div>

        {/* Capability Coverage */}
        <Card className="mb-8" data-testid="capability-coverage-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-violet-500" />
              Capability Coverage
            </CardTitle>
            <CardDescription>
              Suite capabilities based on Phase 5 baseline • Overall: ~85% coverage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {capabilityList.map(([key, cap]) => (
                <div key={key} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-sm">{cap.label}</h4>
                    <span className="text-sm font-semibold text-violet-600">{cap.coverage}</span>
                  </div>
                  <Progress value={parseInt(cap.coverage)} className="h-2 mb-2" />
                  <div className="flex flex-wrap gap-1 mb-2">
                    {cap.features.slice(0, 3).map((f, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        <CheckCircle className="w-3 h-3 mr-1 text-green-500" />
                        {f}
                      </Badge>
                    ))}
                    {cap.features.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{cap.features.length - 3} more
                      </Badge>
                    )}
                  </div>
                  {cap.gaps && cap.gaps.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {cap.gaps.slice(0, 2).map((g, i) => (
                        <Badge key={i} variant="outline" className="text-xs text-orange-600 border-orange-200">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          {g}
                        </Badge>
                      ))}
                      {cap.gaps.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{cap.gaps.length - 2} gaps
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Documentation & Resources */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card data-testid="documentation-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-violet-500" />
                Documentation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <a 
                href="/docs/sites-and-funnels.md" 
                target="_blank"
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 transition-colors"
              >
                <span className="text-sm font-medium">User Guide</span>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </a>
              <a 
                href="/docs/sites-and-funnels-suite-capability-map.md" 
                target="_blank"
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 transition-colors"
              >
                <span className="text-sm font-medium">Capability Mapping (S0-S1)</span>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </a>
            </CardContent>
          </Card>

          <Card data-testid="suite-info-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="w-5 h-5 text-violet-500" />
                Suite Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-sm text-slate-600">Version</span>
                <span className="text-sm font-medium">{suiteInfo?.version || '1.0.0'}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-sm text-slate-600">Baseline</span>
                <span className="text-sm font-medium">Phase 5</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-sm text-slate-600">Data Source</span>
                <span className="text-sm font-medium">Database (Prisma)</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-sm text-slate-600">Primary User</span>
                <span className="text-sm font-medium">Partners</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Demo Notice */}
        <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start gap-3">
            <Zap className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-amber-800">Demo Mode Active</h4>
              <p className="text-sm text-amber-700 mt-1">
                This suite formalizes the existing Phase 5 implementation. Data is stored in the database 
                but may be reset during demo sessions. Sites and funnels are accessible via the Partner Portal.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
