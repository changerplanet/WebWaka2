'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import {
  ArrowLeft,
  Save,
  Eye,
  Settings,
  Plus,
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronRight,
  PlayCircle,
  PauseCircle,
  Target,
  Users,
  BarChart3,
  FileText,
  Phone,
  Mail,
  CreditCard,
  Calendar,
  Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface FunnelStep {
  id: string;
  name: string;
  slug: string;
  pageType: string;
  stepOrder: number;
  blocks: any[];
}

interface Funnel {
  id: string;
  name: string;
  slug: string;
  description?: string;
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ARCHIVED';
  goalType?: string;
  goalValue?: string;
  steps: FunnelStep[];
  totalVisitors: number;
  totalConversions: number;
}

const STEP_TYPES = [
  { type: 'LANDING', name: 'Landing Page', icon: FileText, description: 'Entry point for visitors' },
  { type: 'OPTIN', name: 'Opt-in Form', icon: Mail, description: 'Capture email/contact info' },
  { type: 'SALES', name: 'Sales Page', icon: CreditCard, description: 'Product/service sales' },
  { type: 'CHECKOUT', name: 'Checkout', icon: CreditCard, description: 'Payment processing' },
  { type: 'UPSELL', name: 'Upsell', icon: Target, description: 'Additional offer' },
  { type: 'DOWNSELL', name: 'Downsell', icon: Target, description: 'Alternative offer' },
  { type: 'THANKYOU', name: 'Thank You', icon: FileText, description: 'Confirmation page' },
  { type: 'BOOKING', name: 'Booking', icon: Calendar, description: 'Appointment scheduling' },
  { type: 'WEBINAR', name: 'Webinar', icon: Users, description: 'Webinar registration' },
  { type: 'DOWNLOAD', name: 'Download', icon: Download, description: 'Lead magnet delivery' },
];

const GOAL_TYPES = [
  { value: 'lead', label: 'Lead Capture', icon: Mail },
  { value: 'purchase', label: 'Product Purchase', icon: CreditCard },
  { value: 'booking', label: 'Appointment Booking', icon: Calendar },
  { value: 'signup', label: 'Account Signup', icon: Users },
  { value: 'download', label: 'Download', icon: Download },
  { value: 'webinar', label: 'Webinar Registration', icon: Users },
];

export default function FunnelEditorPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const funnelId = params.funnelId as string;

  const [funnel, setFunnel] = useState<Funnel | null>(null);
  const [selectedStep, setSelectedStep] = useState<FunnelStep | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddStep, setShowAddStep] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [newStep, setNewStep] = useState({ name: '', slug: '', pageType: 'LANDING' });

  useEffect(() => {
    if (funnelId) {
      fetchFunnel();
    }
  }, [funnelId]);

  const fetchFunnel = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/sites-funnels/funnels?action=get&funnelId=${funnelId}`);
      const data = await res.json();
      if (data.success && data.funnel) {
        setFunnel(data.funnel);
        if (data.funnel.steps?.length > 0) {
          setSelectedStep(data.funnel.steps[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching funnel:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!funnel) return;
    
    try {
      setSaving(true);
      const res = await fetch('/api/sites-funnels/funnels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update-funnel',
          funnelId: funnel.id,
          name: funnel.name,
          description: funnel.description,
          goalType: funnel.goalType,
          goalValue: funnel.goalValue,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.error || 'Failed to save');
      }
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleAddStep = async () => {
    if (!funnel || !newStep.name || !newStep.slug) return;
    
    try {
      const res = await fetch('/api/sites-funnels/funnels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add-step',
          funnelId: funnel.id,
          name: newStep.name,
          slug: newStep.slug,
          pageType: newStep.pageType,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowAddStep(false);
        setNewStep({ name: '', slug: '', pageType: 'LANDING' });
        fetchFunnel();
      } else {
        alert(data.error || 'Failed to add step');
      }
    } catch (error) {
      console.error('Error adding step:', error);
    }
  };

  const handleActivate = async () => {
    if (!funnel) return;
    
    try {
      const res = await fetch('/api/sites-funnels/funnels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'activate-funnel',
          funnelId: funnel.id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchFunnel();
      } else {
        alert(data.error || 'Failed to activate');
      }
    } catch (error) {
      console.error('Error activating:', error);
    }
  };

  const handlePause = async () => {
    if (!funnel) return;
    
    try {
      const res = await fetch('/api/sites-funnels/funnels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'pause-funnel',
          funnelId: funnel.id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchFunnel();
      } else {
        alert(data.error || 'Failed to pause');
      }
    } catch (error) {
      console.error('Error pausing:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'DRAFT': return 'bg-yellow-100 text-yellow-800';
      case 'PAUSED': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!funnel) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-medium mb-2">Funnel not found</h2>
          <Button onClick={() => router.push('/partner-portal/funnels')}>
            Back to Funnels
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background" data-testid="funnel-editor-page">
      {/* Left Sidebar - Funnel Steps */}
      <div className="w-64 border-r bg-muted/30 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.push('/partner-portal/funnels')}
            className="mb-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h2 className="font-semibold truncate">{funnel.name}</h2>
          <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(funnel.status)}`}>
            {funnel.status}
          </span>
        </div>

        {/* Steps List */}
        <div className="flex-1 overflow-y-auto p-2">
          <div className="mb-2 flex items-center justify-between px-2">
            <span className="text-sm font-medium">Steps</span>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowAddStep(true)}
              data-testid="add-step-btn"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-1">
            {funnel.steps?.map((step, index) => (
              <div key={step.id} className="relative">
                {/* Connector Line */}
                {index > 0 && (
                  <div className="absolute left-5 -top-1 w-0.5 h-2 bg-muted-foreground/30" />
                )}
                
                <button
                  onClick={() => setSelectedStep(step)}
                  className={`w-full flex items-center gap-2 p-2 rounded-md text-left transition-colors ${
                    selectedStep?.id === step.id 
                      ? 'bg-primary text-primary-foreground' 
                      : 'hover:bg-muted'
                  }`}
                  data-testid={`step-${step.id}`}
                >
                  <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{step.name}</p>
                    <p className="text-xs opacity-70">{step.pageType}</p>
                  </div>
                </button>

                {/* Connector to next */}
                {index < (funnel.steps?.length || 0) - 1 && (
                  <div className="absolute left-5 top-full w-0.5 h-2 bg-muted-foreground/30" />
                )}
              </div>
            ))}
          </div>

          {(!funnel.steps || funnel.steps.length === 0) && (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground mb-2">No steps yet</p>
              <Button size="sm" onClick={() => setShowAddStep(true)}>
                <Plus className="w-4 h-4 mr-1" />
                Add First Step
              </Button>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="p-4 border-t space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Visitors</span>
            <span className="font-medium">{funnel.totalVisitors || 0}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Conversions</span>
            <span className="font-medium">{funnel.totalConversions || 0}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Rate</span>
            <span className="font-medium">
              {funnel.totalVisitors 
                ? ((funnel.totalConversions / funnel.totalVisitors) * 100).toFixed(1)
                : 0}%
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="h-14 border-b flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <h3 className="font-medium">
              {selectedStep ? selectedStep.name : 'Select a step'}
            </h3>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowSettings(true)}
            >
              <Settings className="w-4 h-4 mr-1" />
              Settings
            </Button>
            
            {funnel.status === 'DRAFT' || funnel.status === 'PAUSED' ? (
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleActivate}
                className="text-green-600"
              >
                <PlayCircle className="w-4 h-4 mr-1" />
                Activate
              </Button>
            ) : (
              <Button 
                variant="outline" 
                size="sm"
                onClick={handlePause}
                className="text-orange-600"
              >
                <PauseCircle className="w-4 h-4 mr-1" />
                Pause
              </Button>
            )}
            
            <Button 
              size="sm"
              onClick={handleSave}
              disabled={saving}
              data-testid="save-funnel-btn"
            >
              <Save className="w-4 h-4 mr-1" />
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>

        {/* Editor Canvas */}
        <div className="flex-1 overflow-y-auto p-6">
          {selectedStep ? (
            <div className="max-w-3xl mx-auto space-y-6">
              {/* Step Info */}
              <div className="bg-muted/30 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Step Name</Label>
                    <Input 
                      value={selectedStep.name}
                      onChange={(e) => setSelectedStep({...selectedStep, name: e.target.value})}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>URL Slug</Label>
                    <Input 
                      value={selectedStep.slug}
                      onChange={(e) => setSelectedStep({...selectedStep, slug: e.target.value})}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Blocks */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Page Blocks</h4>
                  <Button size="sm" variant="outline">
                    <Plus className="w-4 h-4 mr-1" />
                    Add Block
                  </Button>
                </div>

                {selectedStep.blocks?.length > 0 ? (
                  selectedStep.blocks.map((block: any, index: number) => (
                    <div 
                      key={block.id || index}
                      className="border rounded-lg p-4 bg-background"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <GripVertical className="w-4 h-4 text-muted-foreground cursor-move" />
                          <span className="font-medium">{block.name || block.type}</span>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {block.type} block
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="border-2 border-dashed rounded-lg p-8 text-center">
                    <p className="text-muted-foreground mb-2">No blocks yet</p>
                    <Button size="sm" variant="outline">
                      <Plus className="w-4 h-4 mr-1" />
                      Add First Block
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Select a Step</h3>
                <p className="text-muted-foreground mb-4">
                  Choose a step from the sidebar to edit its content
                </p>
                {(!funnel.steps || funnel.steps.length === 0) && (
                  <Button onClick={() => setShowAddStep(true)}>
                    <Plus className="w-4 h-4 mr-1" />
                    Create First Step
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Step Dialog */}
      <Dialog open={showAddStep} onOpenChange={setShowAddStep}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Funnel Step</DialogTitle>
            <DialogDescription>
              Add a new step to your funnel flow.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Step Name</Label>
              <Input
                placeholder="e.g., Opt-in Page"
                value={newStep.name}
                onChange={(e) => setNewStep({...newStep, name: e.target.value})}
                data-testid="step-name-input"
              />
            </div>
            
            <div className="space-y-2">
              <Label>URL Slug</Label>
              <Input
                placeholder="e.g., opt-in"
                value={newStep.slug}
                onChange={(e) => setNewStep({
                  ...newStep, 
                  slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-')
                })}
                data-testid="step-slug-input"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Step Type</Label>
              <Select 
                value={newStep.pageType} 
                onValueChange={(v) => setNewStep({...newStep, pageType: v})}
              >
                <SelectTrigger data-testid="step-type-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STEP_TYPES.map((type) => (
                    <SelectItem key={type.type} value={type.type}>
                      <div className="flex items-center gap-2">
                        <type.icon className="w-4 h-4" />
                        <span>{type.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddStep(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddStep} data-testid="confirm-add-step-btn">
              Add Step
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Funnel Settings</DialogTitle>
            <DialogDescription>
              Configure your funnel settings and goals.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Funnel Name</Label>
              <Input
                value={funnel.name}
                onChange={(e) => setFunnel({...funnel, name: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={funnel.description || ''}
                onChange={(e) => setFunnel({...funnel, description: e.target.value})}
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Goal Type</Label>
              <Select 
                value={funnel.goalType || 'lead'} 
                onValueChange={(v) => setFunnel({...funnel, goalType: v})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GOAL_TYPES.map((goal) => (
                    <SelectItem key={goal.value} value={goal.value}>
                      <div className="flex items-center gap-2">
                        <goal.icon className="w-4 h-4" />
                        <span>{goal.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Goal Value (optional)</Label>
              <Input
                placeholder="e.g., $99 or 100 leads"
                value={funnel.goalValue || ''}
                onChange={(e) => setFunnel({...funnel, goalValue: e.target.value})}
              />
              <p className="text-xs text-muted-foreground">
                Set a target value for tracking funnel performance
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSettings(false)}>
              Cancel
            </Button>
            <Button onClick={() => { handleSave(); setShowSettings(false); }}>
              Save Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
