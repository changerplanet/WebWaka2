'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import {
  Globe,
  Plus,
  Search,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  ExternalLink,
  CheckCircle,
  Clock,
  XCircle,
  Layout,
  Layers,
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface Site {
  id: string;
  name: string;
  slug: string;
  description?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'UNPUBLISHED' | 'ARCHIVED';
  publishedAt?: string;
  viewCount: number;
  _count?: { pages: number };
  createdAt: string;
  updatedAt: string;
}

const statusConfig = {
  DRAFT: { label: 'Draft', icon: Clock, color: 'text-yellow-600 bg-yellow-50' },
  PUBLISHED: { label: 'Published', icon: CheckCircle, color: 'text-green-600 bg-green-50' },
  UNPUBLISHED: { label: 'Unpublished', icon: XCircle, color: 'text-gray-600 bg-gray-50' },
  ARCHIVED: { label: 'Archived', icon: XCircle, color: 'text-red-600 bg-red-50' },
};

export default function PartnerSitesPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newSite, setNewSite] = useState({ name: '', slug: '', description: '' });
  const [creating, setCreating] = useState(false);
  const [errorState, setErrorState] = useState<{ code?: string; message?: string } | null>(null);

  useEffect(() => {
    if (!authLoading && user) {
      fetchSites();
    }
  }, [authLoading, user]);

  const fetchSites = async () => {
    try {
      setLoading(true);
      setErrorState(null);
      const res = await fetch('/api/sites-funnels/sites?action=list');
      const data = await res.json();
      if (data.success) {
        setSites(data.sites || []);
      } else if (data.code === 'NO_TENANT') {
        setErrorState({ code: 'NO_TENANT', message: data.error });
      } else {
        setErrorState({ message: data.error || 'Failed to load sites' });
      }
    } catch (error) {
      console.error('Error fetching sites:', error);
      setErrorState({ message: 'Failed to connect to server' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSite = async () => {
    if (!newSite.name || !newSite.slug) return;
    
    try {
      setCreating(true);
      const res = await fetch('/api/sites-funnels/sites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create-site',
          name: newSite.name,
          slug: newSite.slug,
          description: newSite.description,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowCreateDialog(false);
        setNewSite({ name: '', slug: '', description: '' });
        fetchSites();
        // Navigate to editor
        router.push(`/partner-portal/sites/${data.site.id}/editor`);
      } else {
        alert(data.error || 'Failed to create site');
      }
    } catch (error) {
      console.error('Error creating site:', error);
    } finally {
      setCreating(false);
    }
  };

  const handlePublish = async (siteId: string) => {
    try {
      const res = await fetch('/api/sites-funnels/sites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'publish-site', siteId }),
      });
      const data = await res.json();
      if (data.success) {
        fetchSites();
      } else {
        alert(data.error || 'Failed to publish site');
      }
    } catch (error) {
      console.error('Error publishing site:', error);
    }
  };

  const handleUnpublish = async (siteId: string) => {
    try {
      const res = await fetch('/api/sites-funnels/sites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'unpublish-site', siteId }),
      });
      const data = await res.json();
      if (data.success) {
        fetchSites();
      } else {
        alert(data.error || 'Failed to unpublish site');
      }
    } catch (error) {
      console.error('Error unpublishing site:', error);
    }
  };

  const handleDelete = async (siteId: string) => {
    if (!confirm('Are you sure you want to delete this site? This action cannot be undone.')) {
      return;
    }
    
    try {
      const res = await fetch('/api/sites-funnels/sites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete-site', siteId }),
      });
      const data = await res.json();
      if (data.success) {
        fetchSites();
      } else {
        alert(data.error || 'Failed to delete site');
      }
    } catch (error) {
      console.error('Error deleting site:', error);
    }
  };

  const filteredSites = sites.filter(site =>
    site.name.toLowerCase().includes(search.toLowerCase()) ||
    site.slug.toLowerCase().includes(search.toLowerCase())
  );

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show error state for no tenant
  if (errorState?.code === 'NO_TENANT') {
    return (
      <div className="space-y-6" data-testid="partner-sites-page">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Sites</h1>
            <p className="text-muted-foreground">Build and manage websites for your clients</p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center min-h-[400px] bg-muted/30 rounded-lg border-2 border-dashed">
          <div className="flex flex-col items-center text-center p-8 max-w-md">
            <div className="p-4 bg-yellow-100 rounded-full mb-4">
              <Globe className="w-8 h-8 text-yellow-600" />
            </div>
            <h2 className="text-xl font-semibold mb-2">No Active Tenant</h2>
            <p className="text-muted-foreground mb-6">
              To create and manage websites, you need to select an active tenant first. 
              Visit your partner dashboard to select or create a tenant.
            </p>
            <Button onClick={() => router.push('/partner-portal')} data-testid="go-to-dashboard-btn">
              Go to Partner Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="partner-sites-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sites</h1>
          <p className="text-muted-foreground">Build and manage websites for your clients</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button data-testid="create-site-btn">
              <Plus className="w-4 h-4 mr-2" />
              Create Site
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Site</DialogTitle>
              <DialogDescription>
                Create a new website for your client. You can customize it later.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="site-name">Site Name</Label>
                <Input
                  id="site-name"
                  placeholder="My Client's Website"
                  value={newSite.name}
                  onChange={(e) => setNewSite({ ...newSite, name: e.target.value })}
                  data-testid="site-name-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="site-slug">URL Slug</Label>
                <Input
                  id="site-slug"
                  placeholder="my-clients-website"
                  value={newSite.slug}
                  onChange={(e) => setNewSite({ 
                    ...newSite, 
                    slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') 
                  })}
                  data-testid="site-slug-input"
                />
                <p className="text-xs text-muted-foreground">
                  This will be used in the URL: yoursite.com/{newSite.slug || 'slug'}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="site-description">Description (optional)</Label>
                <Textarea
                  id="site-description"
                  placeholder="Brief description of this site"
                  value={newSite.description}
                  onChange={(e) => setNewSite({ ...newSite, description: e.target.value })}
                  data-testid="site-description-input"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateSite} 
                disabled={creating || !newSite.name || !newSite.slug}
                data-testid="create-site-submit"
              >
                {creating ? 'Creating...' : 'Create Site'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search sites..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
          data-testid="site-search-input"
        />
      </div>

      {/* Sites Grid */}
      {filteredSites.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-muted/20">
          <Globe className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No sites yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first website to get started
          </p>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Site
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredSites.map((site) => {
            const status = statusConfig[site.status];
            const StatusIcon = status.icon;
            
            return (
              <div
                key={site.id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-card"
                data-testid={`site-card-${site.id}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Layout className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">{site.name}</h3>
                      <p className="text-xs text-muted-foreground">/{site.slug}</p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => router.push(`/partner-portal/sites/${site.id}/editor`)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => window.open(`/preview/${site.slug}`, '_blank')}>
                        <Eye className="w-4 h-4 mr-2" />
                        Preview
                      </DropdownMenuItem>
                      {site.status === 'PUBLISHED' ? (
                        <DropdownMenuItem onClick={() => handleUnpublish(site.id)}>
                          <XCircle className="w-4 h-4 mr-2" />
                          Unpublish
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => handlePublish(site.id)}>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Publish
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => handleDelete(site.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {site.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {site.description}
                  </p>
                )}

                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                  <div className="flex items-center gap-1">
                    <Layers className="w-4 h-4" />
                    {site._count?.pages || 0} pages
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {site.viewCount} views
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                    <StatusIcon className="w-3 h-3" />
                    {status.label}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(`/partner-portal/sites/${site.id}/editor`)}
                  >
                    Edit Site
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
