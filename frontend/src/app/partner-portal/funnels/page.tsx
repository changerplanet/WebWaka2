'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import {
  GitBranch,
  Plus,
  Search,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Play,
  Pause,
  BarChart3,
  Target,
  Users,
  TrendingUp,
  ArrowUpRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface Funnel {
  id: string;
  name: string;
  slug: string;
  description?: string;
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ARCHIVED';
  goalType?: string;
  totalVisitors: number;
  totalConversions: number;
  conversionRate?: number;
  _count?: { pages: number };
  createdAt: string;
  updatedAt: string;
}

const statusConfig = {
  DRAFT: { label: 'Draft', color: 'text-yellow-600 bg-yellow-50' },
  ACTIVE: { label: 'Active', color: 'text-green-600 bg-green-50' },
  PAUSED: { label: 'Paused', color: 'text-orange-600 bg-orange-50' },
  COMPLETED: { label: 'Completed', color: 'text-blue-600 bg-blue-50' },
  ARCHIVED: { label: 'Archived', color: 'text-gray-600 bg-gray-50' },
};

const goalTypes = [
  { value: 'lead', label: 'Lead Capture' },
  { value: 'booking', label: 'Appointment Booking' },
  { value: 'purchase', label: 'Product Purchase' },
  { value: 'signup', label: 'Account Signup' },
  { value: 'download', label: 'Download' },
  { value: 'webinar', label: 'Webinar Registration' },
];

export default function PartnerFunnelsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [funnels, setFunnels] = useState<Funnel[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newFunnel, setNewFunnel] = useState({ name: '', slug: '', description: '', goalType: 'lead' });
  const [creating, setCreating] = useState(false);
  const [errorState, setErrorState] = useState<{ code?: string; message?: string } | null>(null);

  useEffect(() => {
    if (!authLoading && user) {
      fetchFunnels();
    }
  }, [authLoading, user]);

  const fetchFunnels = async () => {
    try {
      setLoading(true);
      setErrorState(null);
      const res = await fetch('/api/sites-funnels/funnels?action=list');
      const data = await res.json();
      if (data.success) {
        setFunnels(data.funnels || []);
      } else if (data.error?.includes('Tenant ID required') || data.error?.includes('No active tenant')) {
        setErrorState({ code: 'NO_TENANT', message: data.error });
      } else {
        setErrorState({ message: data.error || 'Failed to load funnels' });
      }
    } catch (error) {
      console.error('Error fetching funnels:', error);
      setErrorState({ message: 'Failed to connect to server' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFunnel = async () => {
    if (!newFunnel.name || !newFunnel.slug) return;
    
    try {
      setCreating(true);
      const res = await fetch('/api/sites-funnels/funnels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create-funnel',
          ...newFunnel,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowCreateDialog(false);
        setNewFunnel({ name: '', slug: '', description: '', goalType: 'lead' });
        fetchFunnels();
        router.push(`/partner-portal/funnels/${data.funnel.id}/editor`);
      } else {
        alert(data.error || 'Failed to create funnel');
      }
    } catch (error) {
      console.error('Error creating funnel:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleActivate = async (funnelId: string) => {
    try {
      const res = await fetch('/api/sites-funnels/funnels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'activate-funnel', funnelId }),
      });
      const data = await res.json();
      if (data.success) {
        fetchFunnels();
      } else {
        alert(data.error || 'Failed to activate funnel');
      }
    } catch (error) {
      console.error('Error activating funnel:', error);
    }
  };

  const handlePause = async (funnelId: string) => {
    try {
      const res = await fetch('/api/sites-funnels/funnels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'pause-funnel', funnelId }),
      });
      const data = await res.json();
      if (data.success) {
        fetchFunnels();
      } else {
        alert(data.error || 'Failed to pause funnel');
      }
    } catch (error) {
      console.error('Error pausing funnel:', error);
    }
  };

  const handleDelete = async (funnelId: string) => {
    if (!confirm('Are you sure you want to delete this funnel?')) return;
    
    try {
      const res = await fetch('/api/sites-funnels/funnels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete-funnel', funnelId }),
      });
      const data = await res.json();
      if (data.success) {
        fetchFunnels();
      } else {
        alert(data.error || 'Failed to delete funnel');
      }
    } catch (error) {
      console.error('Error deleting funnel:', error);
    }
  };

  const filteredFunnels = funnels.filter(funnel =>
    funnel.name.toLowerCase().includes(search.toLowerCase()) ||
    funnel.slug.toLowerCase().includes(search.toLowerCase())
  );

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="partner-funnels-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Funnels</h1>
          <p className="text-muted-foreground">Build conversion funnels for your clients</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button data-testid="create-funnel-btn">
              <Plus className="w-4 h-4 mr-2" />
              Create Funnel
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Funnel</DialogTitle>
              <DialogDescription>
                Set up a conversion funnel to capture and convert leads.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Funnel Name</Label>
                <Input
                  placeholder="Lead Generation Funnel"
                  value={newFunnel.name}
                  onChange={(e) => setNewFunnel({ ...newFunnel, name: e.target.value })}
                  data-testid="funnel-name-input"
                />
              </div>
              <div className="space-y-2">
                <Label>URL Slug</Label>
                <Input
                  placeholder="lead-gen"
                  value={newFunnel.slug}
                  onChange={(e) => setNewFunnel({ 
                    ...newFunnel, 
                    slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') 
                  })}
                  data-testid="funnel-slug-input"
                />
              </div>
              <div className="space-y-2">
                <Label>Conversion Goal</Label>
                <Select
                  value={newFunnel.goalType}
                  onValueChange={(value) => setNewFunnel({ ...newFunnel, goalType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select goal type" />
                  </SelectTrigger>
                  <SelectContent>
                    {goalTypes.map((goal) => (
                      <SelectItem key={goal.value} value={goal.value}>
                        {goal.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Description (optional)</Label>
                <Textarea
                  placeholder="Brief description"
                  value={newFunnel.description}
                  onChange={(e) => setNewFunnel({ ...newFunnel, description: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateFunnel} 
                disabled={creating || !newFunnel.name || !newFunnel.slug}
                data-testid="create-funnel-submit"
              >
                {creating ? 'Creating...' : 'Create Funnel'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search funnels..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Funnels Grid */}
      {filteredFunnels.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-muted/20">
          <GitBranch className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No funnels yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first conversion funnel to start capturing leads
          </p>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Funnel
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredFunnels.map((funnel) => {
            const status = statusConfig[funnel.status];
            
            return (
              <div
                key={funnel.id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-card"
                data-testid={`funnel-card-${funnel.id}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <GitBranch className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">{funnel.name}</h3>
                      <p className="text-xs text-muted-foreground">/{funnel.slug}</p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => router.push(`/partner-portal/funnels/${funnel.id}/editor`)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Analytics
                      </DropdownMenuItem>
                      {funnel.status === 'ACTIVE' ? (
                        <DropdownMenuItem onClick={() => handlePause(funnel.id)}>
                          <Pause className="w-4 h-4 mr-2" />
                          Pause
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => handleActivate(funnel.id)}>
                          <Play className="w-4 h-4 mr-2" />
                          Activate
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => handleDelete(funnel.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="text-center p-2 bg-muted/50 rounded">
                    <Users className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                    <div className="text-lg font-semibold">{funnel.totalVisitors}</div>
                    <div className="text-xs text-muted-foreground">Visitors</div>
                  </div>
                  <div className="text-center p-2 bg-muted/50 rounded">
                    <Target className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                    <div className="text-lg font-semibold">{funnel.totalConversions}</div>
                    <div className="text-xs text-muted-foreground">Conversions</div>
                  </div>
                  <div className="text-center p-2 bg-muted/50 rounded">
                    <TrendingUp className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                    <div className="text-lg font-semibold">
                      {funnel.conversionRate ? `${Number(funnel.conversionRate).toFixed(1)}%` : '0%'}
                    </div>
                    <div className="text-xs text-muted-foreground">Rate</div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                    {status.label}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(`/partner-portal/funnels/${funnel.id}/editor`)}
                  >
                    Edit Funnel
                    <ArrowUpRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
