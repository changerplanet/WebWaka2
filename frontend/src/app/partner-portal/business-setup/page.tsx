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
  ArrowLeft,
  Check,
  Zap,
  Building2,
  Briefcase,
  Truck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface BusinessPreset {
  type: string;
  category: string;
  phase: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  baseSuites: string[];
  features: Record<string, boolean>;
  kpis: string[];
  pricing: {
    setupFee: number;
    monthlyBase: number;
    currency: string;
  };
}

const ICON_MAP: Record<string, React.ReactNode> = {
  'shopping-bag': <ShoppingBag className="w-6 h-6" />,
  'shopping-cart': <ShoppingCart className="w-6 h-6" />,
  'store': <Store className="w-6 h-6" />,
  'globe': <Globe className="w-6 h-6" />,
  'utensils': <Utensils className="w-6 h-6" />,
  'ticket': <Ticket className="w-6 h-6" />,
  'scissors': <Scissors className="w-6 h-6" />,
  'shirt': <Shirt className="w-6 h-6" />,
  'sparkles': <Sparkles className="w-6 h-6" />,
  'wrench': <Wrench className="w-6 h-6" />,
  'car': <Car className="w-6 h-6" />,
  'package': <Package className="w-6 h-6" />,
  'heart-handshake': <Heart className="w-6 h-6" />,
  'graduation-cap': <GraduationCap className="w-6 h-6" />,
  'users': <Users className="w-6 h-6" />,
  'shield-check': <Shield className="w-6 h-6" />,
  'car-front': <ParkingCircle className="w-6 h-6" />,
};

const CATEGORY_INFO = {
  commerce: {
    label: 'MSME Commerce',
    description: 'Retail, markets, restaurants, and e-commerce',
    icon: <Briefcase className="w-5 h-5" />,
    phase: '6.1',
  },
  services: {
    label: 'Services & Lifestyle',
    description: 'Salons, repair, delivery, and service businesses',
    icon: <Truck className="w-5 h-5" />,
    phase: '6.2',
  },
  community: {
    label: 'Community & Access',
    description: 'NGOs, estates, parking, and associations',
    icon: <Building2 className="w-5 h-5" />,
    phase: '6.3',
  },
};

export default function BusinessSetupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [presets, setPresets] = useState<BusinessPreset[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<BusinessPreset | null>(null);
  const [businessName, setBusinessName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPresets();
  }, []);

  const fetchPresets = async () => {
    try {
      const res = await fetch('/api/business-presets');
      const data = await res.json();
      if (data.success) {
        setPresets(data.presets);
      }
    } catch (error) {
      console.error('Error fetching presets:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPresets = selectedCategory
    ? presets.filter((p: any) => p.category === selectedCategory)
    : presets;

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleComplete = () => {
    // In production, this would create the business instance
    alert(`Business "${businessName}" created with ${selectedPreset?.name} template!`);
    router.push('/partner-portal');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50" data-testid="business-setup-page">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Business Setup Wizard</h1>
                <p className="text-sm text-slate-500">Phase 6 Quick Start</p>
              </div>
            </div>
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
              <Zap className="w-3 h-3 mr-1" />
              17 Business Types
            </Badge>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    step >= s
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {step > s ? <Check className="w-5 h-5" /> : s}
                </div>
                {s < 3 && (
                  <div
                    className={`w-20 h-1 mx-2 ${
                      step > s ? 'bg-blue-600' : 'bg-slate-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Select Category */}
        {step === 1 && (
          <div>
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">What type of business?</h2>
              <p className="text-slate-600">Choose a category to see available templates</p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {Object.entries(CATEGORY_INFO).map(([key, info]) => (
                <Card
                  key={key}
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    selectedCategory === key
                      ? 'ring-2 ring-blue-500 border-blue-500'
                      : 'hover:border-slate-300'
                  }`}
                  onClick={() => setSelectedCategory(key)}
                  data-testid={`category-${key}`}
                >
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-blue-100 rounded-lg text-blue-600">
                        {info.icon}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{info.label}</CardTitle>
                        <Badge variant="outline" className="mt-1">Phase {info.phase}</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{info.description}</CardDescription>
                    <p className="text-sm text-slate-500 mt-2">
                      {presets.filter((p: any) => p.category === key).length} templates
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex justify-center mt-8">
              <Button
                size="lg"
                onClick={() => setStep(2)}
                disabled={!selectedCategory}
              >
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Select Business Type */}
        {step === 2 && (
          <div>
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Choose your business template</h2>
              <p className="text-slate-600">
                {CATEGORY_INFO[selectedCategory as keyof typeof CATEGORY_INFO]?.label}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredPresets.map((preset) => (
                <Card
                  key={preset.type}
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    selectedPreset?.type === preset.type
                      ? 'ring-2 ring-blue-500 border-blue-500'
                      : 'hover:border-slate-300'
                  }`}
                  onClick={() => setSelectedPreset(preset)}
                  data-testid={`preset-${preset.type}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div
                        className="p-3 rounded-lg"
                        style={{ backgroundColor: `${preset.color}20`, color: preset.color }}
                      >
                        {ICON_MAP[preset.icon] || <Store className="w-6 h-6" />}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900">{preset.name}</h3>
                        <p className="text-sm text-slate-500 mt-1">{preset.description}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {preset.baseSuites.map((suite) => (
                            <Badge key={suite} variant="secondary" className="text-xs">
                              {suite}
                            </Badge>
                          ))}
                        </div>
                        <div className="mt-3 text-sm">
                          <span className="text-slate-600">From </span>
                          <span className="font-semibold text-slate-900">
                            {formatPrice(preset.pricing.monthlyBase)}
                          </span>
                          <span className="text-slate-500">/month</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex justify-between mt-8">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button onClick={() => setStep(3)} disabled={!selectedPreset}>
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Configure & Launch */}
        {step === 3 && selectedPreset && (
          <div>
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Almost there!</h2>
              <p className="text-slate-600">Configure your {selectedPreset.name}</p>
            </div>

            <div className="max-w-2xl mx-auto">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div
                      className="p-3 rounded-lg"
                      style={{ backgroundColor: `${selectedPreset.color}20`, color: selectedPreset.color }}
                    >
                      {ICON_MAP[selectedPreset.icon] || <Store className="w-6 h-6" />}
                    </div>
                    <div>
                      <CardTitle>{selectedPreset.name}</CardTitle>
                      <CardDescription>{selectedPreset.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Business Name */}
                  <div>
                    <Label htmlFor="businessName">Business Name</Label>
                    <Input
                      id="businessName"
                      placeholder="Enter your business name"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="mt-1"
                      data-testid="business-name-input"
                    />
                  </div>

                  {/* Features */}
                  <div>
                    <Label>Included Features</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {Object.entries(selectedPreset.features).map(([key, enabled]) => (
                        <div
                          key={key}
                          className={`flex items-center gap-2 p-2 rounded ${
                            enabled ? 'bg-green-50 text-green-700' : 'bg-slate-50 text-slate-400'
                          }`}
                        >
                          <Check className={`w-4 h-4 ${enabled ? '' : 'opacity-30'}`} />
                          <span className="text-sm capitalize">{key.replace('_', ' ')}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* KPIs */}
                  <div>
                    <Label>Dashboard KPIs</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedPreset.kpis.map((kpi) => (
                        <Badge key={kpi} variant="secondary">
                          {kpi}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-slate-600">Setup Fee</span>
                      <span className="font-semibold">
                        {formatPrice(selectedPreset.pricing.setupFee)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">Monthly</span>
                      <span className="font-semibold">
                        {formatPrice(selectedPreset.pricing.monthlyBase)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-between mt-8">
                <Button variant="outline" onClick={() => setStep(2)}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={handleComplete}
                  disabled={!businessName.trim()}
                  className="bg-green-600 hover:bg-green-700"
                  data-testid="complete-setup-btn"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Create Business
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
