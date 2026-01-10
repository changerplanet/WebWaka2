'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShoppingBag,
  ShoppingCart,
  Store,
  Globe,
  Utensils,
  Ticket,
  Scissors,
  Shirt,
  Sparkles,
  Wrench,
  Car,
  Package,
  Heart,
  GraduationCap,
  Users,
  Shield,
  ParkingCircle,
  ArrowRight,
  Check,
  Zap,
  Building2,
  Briefcase,
  Truck,
  RefreshCw,
  ExternalLink,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface BusinessPreset {
  type: string;
  category: string;
  phase: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  baseSuites: string[];
  pricing: {
    setupFee: number;
    monthlyBase: number;
    currency: string;
  };
}

const ICON_MAP: Record<string, React.ReactNode> = {
  'shopping-bag': <ShoppingBag className="w-5 h-5" />,
  'shopping-cart': <ShoppingCart className="w-5 h-5" />,
  'store': <Store className="w-5 h-5" />,
  'globe': <Globe className="w-5 h-5" />,
  'utensils': <Utensils className="w-5 h-5" />,
  'ticket': <Ticket className="w-5 h-5" />,
  'scissors': <Scissors className="w-5 h-5" />,
  'shirt': <Shirt className="w-5 h-5" />,
  'sparkles': <Sparkles className="w-5 h-5" />,
  'wrench': <Wrench className="w-5 h-5" />,
  'car': <Car className="w-5 h-5" />,
  'package': <Package className="w-5 h-5" />,
  'heart-handshake': <Heart className="w-5 h-5" />,
  'graduation-cap': <GraduationCap className="w-5 h-5" />,
  'users': <Users className="w-5 h-5" />,
  'shield-check': <Shield className="w-5 h-5" />,
  'car-front': <ParkingCircle className="w-5 h-5" />,
};

const PHASE_INFO = {
  '6.1': {
    name: 'MSME Commerce Acceleration',
    color: 'bg-blue-500',
    textColor: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  '6.2': {
    name: 'Services & Lifestyle Businesses',
    color: 'bg-amber-500',
    textColor: 'text-amber-600',
    bgColor: 'bg-amber-50',
  },
  '6.3': {
    name: 'Community, Access & Field Operations',
    color: 'bg-emerald-500',
    textColor: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
  },
};

export default function Phase6DashboardPage() {
  const router = useRouter();
  const [presets, setPresets] = useState<BusinessPreset[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchPresets();
  }, []);

  const fetchPresets = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/business-presets');
      const data = await res.json();
      if (data.success) {
        setPresets(data.presets);
        setSummary(data.summary);
      }
    } catch (error) {
      console.error('Error fetching presets:', error);
    } finally {
      setLoading(false);
    }
  };

  const groupedByPhase = {
    '6.1': presets.filter((p: any) => p.phase === '6.1'),
    '6.2': presets.filter((p: any) => p.phase === '6.2'),
    '6.3': presets.filter((p: any) => p.phase === '6.3'),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50" data-testid="phase6-dashboard">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Phase 6 — Quick Wins</h1>
                <p className="text-sm text-slate-500">17 Nigeria-First Business Verticals</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <Check className="w-3 h-3 mr-1" />
                ACTIVE
              </Badge>
              <Button variant="outline" size="sm" onClick={fetchPresets}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card data-testid="total-verticals-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Total Verticals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{summary.total || 17}</div>
              <p className="text-xs text-slate-500 mt-1">Class A business types</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Commerce (6.1)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{summary.commerce || 6}</div>
              <Progress value={100} className="h-1 mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Services (6.2)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-600">{summary.services || 6}</div>
              <Progress value={100} className="h-1 mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Community (6.3)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-600">{summary.community || 5}</div>
              <Progress value={100} className="h-1 mt-2" />
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-4 mb-8">
          <Button onClick={() => router.push('/partner-portal/business-setup')}>
            <Building2 className="w-4 h-4 mr-2" />
            Launch Business Setup Wizard
          </Button>
          <Button variant="outline">
            <FileText className="w-4 h-4 mr-2" />
            View Documentation
          </Button>
        </div>

        {/* Phase Sections */}
        {(['6.1', '6.2', '6.3'] as const).map((phase) => (
          <div key={phase} className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-2 h-8 rounded-full ${PHASE_INFO[phase].color}`} />
              <div>
                <h2 className="text-lg font-bold text-slate-900">Phase {phase}</h2>
                <p className="text-sm text-slate-500">{PHASE_INFO[phase].name}</p>
              </div>
              <Badge className={`${PHASE_INFO[phase].bgColor} ${PHASE_INFO[phase].textColor} border-0`}>
                {groupedByPhase[phase].length} types
              </Badge>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {groupedByPhase[phase].map((preset) => (
                <Card
                  key={preset.type}
                  className="hover:shadow-md transition-shadow cursor-pointer group"
                  data-testid={`preset-card-${preset.type}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div
                          className="p-2.5 rounded-lg"
                          style={{ backgroundColor: `${preset.color}20`, color: preset.color }}
                        >
                          {ICON_MAP[preset.icon] || <Store className="w-5 h-5" />}
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900">{preset.name}</h3>
                          <p className="text-sm text-slate-500 mt-0.5 line-clamp-2">
                            {preset.description}
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t">
                      <div className="flex gap-1">
                        {preset.baseSuites.slice(0, 2).map((suite) => (
                          <Badge key={suite} variant="secondary" className="text-xs">
                            {suite}
                          </Badge>
                        ))}
                        {preset.baseSuites.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{preset.baseSuites.length - 2}
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-slate-500">
                        ₦{(preset.pricing.monthlyBase / 1000).toFixed(0)}k/mo
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}

        {/* Strategy Info */}
        <Card className="mt-8 bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
          <CardHeader>
            <CardTitle className="text-lg text-indigo-900">Phase 6 Strategy</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-indigo-800 space-y-2">
            <div className="flex items-start gap-2">
              <Check className="w-4 h-4 mt-0.5 text-indigo-600" />
              <span>High ROI, Nigeria-first, minimal risk</span>
            </div>
            <div className="flex items-start gap-2">
              <Check className="w-4 h-4 mt-0.5 text-indigo-600" />
              <span>NO schema changes — config, templates, UX only</span>
            </div>
            <div className="flex items-start gap-2">
              <Check className="w-4 h-4 mt-0.5 text-indigo-600" />
              <span>Leverages existing 7 frozen suites</span>
            </div>
            <div className="flex items-start gap-2">
              <Check className="w-4 h-4 mt-0.5 text-indigo-600" />
              <span>Partner-sellable templates with demo data</span>
            </div>
          </CardContent>
        </Card>

        {/* Demo Notice */}
        <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start gap-3">
            <Zap className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-amber-800">Phase 6 Implementation Complete</h4>
              <p className="text-sm text-amber-700 mt-1">
                All 17 business verticals are configured with presets, demo data, and partner setup flows.
                This is configuration-only — no new services or schema changes.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
