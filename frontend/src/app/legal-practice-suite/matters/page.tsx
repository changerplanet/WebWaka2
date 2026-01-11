/**
 * LEGAL PRACTICE SUITE — Matters Page
 * Phase 7B.1, S5 Admin UI
 * Enhanced with Matter Templates feature
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Briefcase, 
  Plus, 
  Search, 
  Users,
  Calendar,
  MoreVertical,
  Eye,
  Edit,
  Clock,
  FileText,
  ChevronRight,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Scale,
  Building2,
  Home,
  Banknote,
  Gavel,
  ShieldCheck
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

// Template Type Icons
const TYPE_ICONS: Record<string, React.ReactNode> = {
  CIVIL: <Scale className="h-5 w-5" />,
  CRIMINAL: <Gavel className="h-5 w-5" />,
  CORPORATE: <Building2 className="h-5 w-5" />,
  FAMILY: <Users className="h-5 w-5" />,
  PROPERTY: <Home className="h-5 w-5" />,
  EMPLOYMENT: <Briefcase className="h-5 w-5" />,
  INTELLECTUAL_PROPERTY: <ShieldCheck className="h-5 w-5" />,
  TAX: <Banknote className="h-5 w-5" />,
  BANKING: <Building2 className="h-5 w-5" />,
};

// Demo data
const DEMO_MATTERS = [
  {
    id: '1',
    matterNumber: 'MAT-2026-0012',
    title: 'Chief Okafor v. ABC Construction Ltd',
    matterType: 'CIVIL',
    status: 'ACTIVE',
    clientName: 'Chief Emeka Okafor',
    court: 'Federal High Court, Lagos',
    suitNumber: 'FHC/L/CS/245/2026',
    leadLawyerName: 'Barr. Adaeze Nwosu',
    openDate: '2026-01-02',
    nextDeadline: '2026-01-08',
  },
  {
    id: '2',
    matterNumber: 'MAT-2026-0008',
    title: 'State v. Mr. Adebayo (Criminal Defense)',
    matterType: 'CRIMINAL',
    status: 'ACTIVE',
    clientName: 'Mr. Tunde Adebayo',
    court: 'Lagos State High Court, Ikeja',
    suitNumber: 'ID/234C/2025',
    leadLawyerName: 'Barr. Chidi Okoro',
    openDate: '2025-11-15',
    nextDeadline: '2026-01-10',
  },
  {
    id: '3',
    matterNumber: 'MAT-2026-0015',
    title: 'Zenith Bank Plc v. Pinnacle Enterprises',
    matterType: 'BANKING',
    status: 'ACTIVE',
    clientName: 'Zenith Bank Plc',
    court: 'Court of Appeal, Lagos Division',
    suitNumber: 'CA/L/456/2025',
    leadLawyerName: 'Barr. Adaeze Nwosu',
    openDate: '2025-09-20',
    nextDeadline: '2026-01-12',
  },
  {
    id: '4',
    matterNumber: 'MAT-2025-0089',
    title: 'Trademark Registration - NaijaTech Solutions',
    matterType: 'INTELLECTUAL_PROPERTY',
    status: 'ON_HOLD',
    clientName: 'NaijaTech Solutions Ltd',
    court: null,
    suitNumber: null,
    leadLawyerName: 'Barr. Funmi Adeola',
    openDate: '2025-06-10',
    nextDeadline: null,
  },
  {
    id: '5',
    matterNumber: 'MAT-2025-0045',
    title: 'Mrs. Aisha Mohammed Divorce Proceedings',
    matterType: 'FAMILY',
    status: 'CLOSED',
    clientName: 'Mrs. Aisha Mohammed',
    court: 'Customary Court, Abuja',
    suitNumber: 'CCA/FCT/78/2025',
    leadLawyerName: 'Barr. Funmi Adeola',
    openDate: '2025-03-15',
    nextDeadline: null,
  },
];

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  ON_HOLD: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  CLOSED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  ARCHIVED: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
};

const TYPE_LABELS: Record<string, string> = {
  CIVIL: 'Civil',
  CRIMINAL: 'Criminal',
  CORPORATE: 'Corporate',
  FAMILY: 'Family',
  PROPERTY: 'Property',
  EMPLOYMENT: 'Employment',
  INTELLECTUAL_PROPERTY: 'IP',
  TAX: 'Tax',
  BANKING: 'Banking',
  ADMINISTRATIVE: 'Admin',
  ARBITRATION: 'Arbitration',
  OTHER: 'Other',
};

interface MatterTemplate {
  id: string;
  name: string;
  description: string;
  matterType: string;
  practiceArea: string;
  billingType: string;
  suggestedFee: number;
  suggestedRetainer: number;
  tags: string[];
  estimatedDuration: string;
  commonCourts: string[];
  notes: string;
}

export default function MattersPage() {
  const [matters] = useState(DEMO_MATTERS);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  
  // Template states
  const [templates, setTemplates] = useState<MatterTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<MatterTemplate | null>(null);
  const [templateStep, setTemplateStep] = useState<'select' | 'details'>('select');
  const [creating, setCreating] = useState(false);
  
  // Form states
  const [clientName, setClientName] = useState('');
  const [matterTitle, setMatterTitle] = useState('');
  const [court, setCourt] = useState('');

  // Fetch templates on dialog open
  useEffect(() => {
    if (templateDialogOpen && templates.length === 0) {
      fetchTemplates();
    }
  }, [templateDialogOpen]);

  const fetchTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const res = await fetch('/api/legal-practice/templates');
      const data = await res.json();
      setTemplates(data.templates || []);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    } finally {
      setLoadingTemplates(false);
    }
  };

  const handleSelectTemplate = (template: MatterTemplate) => {
    setSelectedTemplate(template);
    setMatterTitle(template.name);
    setTemplateStep('details');
  };

  const handleCreateFromTemplate = async () => {
    if (!selectedTemplate || !clientName || !matterTitle) return;
    
    setCreating(true);
    try {
      const res = await fetch('/api/legal-practice/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': 'demo-legal-practice-tenant',
        },
        body: JSON.stringify({
          templateId: selectedTemplate.id,
          clientId: `client-${Date.now()}`,
          clientName,
          title: matterTitle,
          court: court || undefined,
        }),
      });
      
      if (res.ok) {
        const result = await res.json();
        alert(`Matter created successfully!\n\nMatter Number: ${result.matter.matterNumber}\nDeadlines Created: ${result.deadlinesCreated}\nDocuments Created: ${result.documentsCreated}\n\nNote: ${result.notes}`);
        setTemplateDialogOpen(false);
        resetTemplateForm();
      } else {
        const error = await res.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Failed to create matter:', error);
      alert('Failed to create matter');
    } finally {
      setCreating(false);
    }
  };

  const resetTemplateForm = () => {
    setSelectedTemplate(null);
    setTemplateStep('select');
    setClientName('');
    setMatterTitle('');
    setCourt('');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const filteredMatters = matters.filter((m) => {
    const matchesSearch = 
      m.matterNumber.toLowerCase().includes(search.toLowerCase()) ||
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      m.clientName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
    const matchesType = typeFilter === 'all' || m.matterType === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const stats = {
    total: matters.length,
    active: matters.filter((m: any) => m.status === 'ACTIVE').length,
    onHold: matters.filter((m: any) => m.status === 'ON_HOLD').length,
    closed: matters.filter((m: any) => m.status === 'CLOSED').length,
  };

  // Group templates by type
  const templatesByType = templates.reduce((acc: any, t: any) => {
    if (!acc[t.matterType]) acc[t.matterType] = [];
    acc[t.matterType].push(t);
    return acc;
  }, {} as Record<string, MatterTemplate[]>);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/legal-practice-suite" className="hover:text-foreground transition-colors">
          Legal Practice
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">Matters</span>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Briefcase className="h-6 w-6" />
            Matters
          </h1>
          <p className="text-muted-foreground">Manage legal cases and matters</p>
        </div>
        <div className="flex gap-2">
          {/* Create from Template Dialog */}
          <Dialog open={templateDialogOpen} onOpenChange={(open) => {
            setTemplateDialogOpen(open);
            if (!open) resetTemplateForm();
          }}>
            <DialogTrigger asChild>
              <Button variant="outline" data-testid="create-from-template-btn">
                <Sparkles className="mr-2 h-4 w-4" />
                From Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Create Matter from Template
                </DialogTitle>
                <DialogDescription>
                  {templateStep === 'select' 
                    ? 'Select a template to quickly create a new matter with pre-configured deadlines and documents.'
                    : `Creating matter from: ${selectedTemplate?.name}`
                  }
                </DialogDescription>
              </DialogHeader>

              {templateStep === 'select' ? (
                <div className="py-4">
                  {loadingTemplates ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : (
                    <Tabs defaultValue="all" className="w-full">
                      <TabsList className="mb-4 flex flex-wrap h-auto gap-1">
                        <TabsTrigger value="all" className="text-xs">All ({templates.length})</TabsTrigger>
                        {Object.entries(templatesByType).map(([type, items]: [string, unknown[]]) => (
                          <TabsTrigger key={type} value={type} className="text-xs">
                            {TYPE_LABELS[type] || type} ({items.length})
                          </TabsTrigger>
                        ))}
                      </TabsList>

                      <TabsContent value="all" className="mt-0">
                        <div className="grid gap-3 max-h-[50vh] overflow-y-auto pr-2">
                          {templates.map((template) => (
                            <TemplateCard 
                              key={template.id} 
                              template={template} 
                              onSelect={handleSelectTemplate}
                              formatCurrency={formatCurrency}
                            />
                          ))}
                        </div>
                      </TabsContent>

                      {Object.entries(templatesByType).map(([type, items]) => (
                        <TabsContent key={type} value={type} className="mt-0">
                          <div className="grid gap-3 max-h-[50vh] overflow-y-auto pr-2">
                            {items.map((template) => (
                              <TemplateCard 
                                key={template.id} 
                                template={template} 
                                onSelect={handleSelectTemplate}
                                formatCurrency={formatCurrency}
                              />
                            ))}
                          </div>
                        </TabsContent>
                      ))}
                    </Tabs>
                  )}
                </div>
              ) : (
                <div className="py-4 space-y-6">
                  {/* Selected Template Summary */}
                  {selectedTemplate && (
                    <Card className="bg-muted/50">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-primary/10 text-primary">
                            {TYPE_ICONS[selectedTemplate.matterType] || <Briefcase className="h-5 w-5" />}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold">{selectedTemplate.name}</h4>
                            <p className="text-sm text-muted-foreground">{selectedTemplate.description}</p>
                            <div className="flex flex-wrap gap-2 mt-2">
                              <Badge variant="outline">{TYPE_LABELS[selectedTemplate.matterType]}</Badge>
                              <Badge variant="outline">{selectedTemplate.practiceArea}</Badge>
                              <Badge variant="outline">{selectedTemplate.estimatedDuration}</Badge>
                            </div>
                            {selectedTemplate.notes && (
                              <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-950/30 rounded text-sm text-amber-800 dark:text-amber-200 flex items-start gap-2">
                                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                <span>{selectedTemplate.notes}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Client & Matter Details */}
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="clientName">Client Name *</Label>
                        <Input
                          id="clientName"
                          placeholder="e.g., Chief Emeka Okafor"
                          value={clientName}
                          onChange={(e) => setClientName(e.target.value)}
                          data-testid="template-client-name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="matterTitle">Matter Title *</Label>
                        <Input
                          id="matterTitle"
                          placeholder="e.g., Debt Recovery - ABC Ltd"
                          value={matterTitle}
                          onChange={(e) => setMatterTitle(e.target.value)}
                          data-testid="template-matter-title"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="court">Court (Optional)</Label>
                      <Select value={court} onValueChange={setCourt}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select court..." />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedTemplate?.commonCourts?.map((c) => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* What will be created */}
                    <Card className="border-dashed">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          What will be created
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="text-sm text-muted-foreground">
                        <ul className="space-y-1">
                          <li>• New matter with status: DRAFT</li>
                          <li>• Suggested fee: {selectedTemplate && formatCurrency(selectedTemplate.suggestedFee)}</li>
                          <li>• Suggested retainer: {selectedTemplate && formatCurrency(selectedTemplate.suggestedRetainer)}</li>
                          <li>• Default deadlines based on template</li>
                          <li>• Required document placeholders</li>
                        </ul>
                      </CardContent>
                    </Card>
                  </div>

                  <DialogFooter className="flex gap-2">
                    <Button variant="outline" onClick={() => setTemplateStep('select')}>
                      Back
                    </Button>
                    <Button 
                      onClick={handleCreateFromTemplate}
                      disabled={!clientName || !matterTitle || creating}
                      data-testid="create-matter-from-template-submit"
                    >
                      {creating ? 'Creating...' : 'Create Matter'}
                    </Button>
                  </DialogFooter>
                </div>
              )}
            </DialogContent>
          </Dialog>

          <Button data-testid="add-matter-btn">
            <Plus className="mr-2 h-4 w-4" />
            New Matter
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Total Matters</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <p className="text-xs text-muted-foreground">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.onHold}</div>
            <p className="text-xs text-muted-foreground">On Hold</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-blue-600">{stats.closed}</div>
            <p className="text-xs text-muted-foreground">Closed</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search matters..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
                data-testid="matter-search"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="ON_HOLD">On Hold</SelectItem>
                <SelectItem value="CLOSED">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="CIVIL">Civil</SelectItem>
                <SelectItem value="CRIMINAL">Criminal</SelectItem>
                <SelectItem value="CORPORATE">Corporate</SelectItem>
                <SelectItem value="FAMILY">Family</SelectItem>
                <SelectItem value="BANKING">Banking</SelectItem>
                <SelectItem value="INTELLECTUAL_PROPERTY">IP</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Matters List */}
      <div className="grid gap-4">
        {filteredMatters.map((matter) => (
          <Card key={matter.id} className="hover:shadow-md transition-shadow" data-testid={`matter-card-${matter.id}`}>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-sm text-muted-foreground">{matter.matterNumber}</span>
                    <Badge className={STATUS_COLORS[matter.status]}>{matter.status}</Badge>
                    <Badge variant="outline">{TYPE_LABELS[matter.matterType]}</Badge>
                  </div>
                  <h3 className="font-semibold mt-1">{matter.title}</h3>
                  <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {matter.clientName}
                    </span>
                    {matter.court && (
                      <span className="flex items-center gap-1">
                        {matter.court}
                      </span>
                    )}
                    {matter.suitNumber && (
                      <span className="font-mono text-xs">
                        {matter.suitNumber}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Lead: {matter.leadLawyerName}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  {matter.nextDeadline && (
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Next Deadline</p>
                      <p className="text-sm font-medium flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(matter.nextDeadline).toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Matter
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Clock className="mr-2 h-4 w-4" />
                        Log Time
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredMatters.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No matters found</h3>
              <p className="text-sm text-muted-foreground">Try adjusting your filters</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// Template Card Component
function TemplateCard({ 
  template, 
  onSelect,
  formatCurrency 
}: { 
  template: MatterTemplate; 
  onSelect: (t: MatterTemplate) => void;
  formatCurrency: (n: number) => string;
}) {
  return (
    <Card 
      className="cursor-pointer hover:border-primary/50 hover:shadow-sm transition-all"
      onClick={() => onSelect(template)}
      data-testid={`template-card-${template.id}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            {TYPE_ICONS[template.matterType] || <Briefcase className="h-5 w-5" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h4 className="font-semibold truncate">{template.name}</h4>
              <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">{template.description}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant="outline" className="text-xs">{TYPE_LABELS[template.matterType] || template.matterType}</Badge>
              <Badge variant="outline" className="text-xs">{template.estimatedDuration}</Badge>
              <Badge variant="secondary" className="text-xs">{formatCurrency(template.suggestedFee)}</Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
