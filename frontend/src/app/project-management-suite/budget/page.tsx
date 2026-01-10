/**
 * PROJECT MANAGEMENT SUITE — Budget Page
 * Phase 7C.2, S5 Admin UI
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Wallet, 
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Clock,
  AlertTriangle,
  FolderKanban
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
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
  DropdownMenuSeparator,
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

interface BudgetItem {
  id: string;
  projectId: string;
  projectName: string;
  projectCode: string;
  category: string;
  description: string;
  estimatedAmount: number;
  actualAmount: number | null;
  isApproved: boolean;
}

interface ProjectBudget {
  id: string;
  projectCode: string;
  projectName: string;
  totalEstimated: number;
  totalActual: number;
  variance: number;
  percentUsed: number;
  isOverBudget: boolean;
  itemCount: number;
}

const DEMO_BUDGET_ITEMS: BudgetItem[] = [
  {
    id: '1',
    projectId: '1',
    projectName: 'Victoria Island Office Renovation',
    projectCode: 'PRJ-2026-0001',
    category: 'Materials',
    description: 'Office furniture - desks, chairs, cabinets',
    estimatedAmount: 8500000,
    actualAmount: 7800000,
    isApproved: true,
  },
  {
    id: '2',
    projectId: '1',
    projectName: 'Victoria Island Office Renovation',
    projectCode: 'PRJ-2026-0001',
    category: 'Labor',
    description: 'Construction workers and contractors',
    estimatedAmount: 6000000,
    actualAmount: 4500000,
    isApproved: true,
  },
  {
    id: '3',
    projectId: '1',
    projectName: 'Victoria Island Office Renovation',
    projectCode: 'PRJ-2026-0001',
    category: 'Equipment',
    description: 'Air conditioning units and installation',
    estimatedAmount: 4500000,
    actualAmount: null,
    isApproved: false,
  },
  {
    id: '4',
    projectId: '2',
    projectName: 'Youth Empowerment Program',
    projectCode: 'PRJ-2026-0002',
    category: 'Training',
    description: 'Facilitator fees and training materials',
    estimatedAmount: 5000000,
    actualAmount: 1500000,
    isApproved: true,
  },
  {
    id: '5',
    projectId: '2',
    projectName: 'Youth Empowerment Program',
    projectCode: 'PRJ-2026-0002',
    category: 'Logistics',
    description: 'Venue rental and participant transportation',
    estimatedAmount: 3500000,
    actualAmount: 800000,
    isApproved: true,
  },
  {
    id: '6',
    projectId: '2',
    projectName: 'Youth Empowerment Program',
    projectCode: 'PRJ-2026-0002',
    category: 'Communication',
    description: 'Advertising and participant outreach',
    estimatedAmount: 1500000,
    actualAmount: 1200000,
    isApproved: true,
  },
  {
    id: '7',
    projectId: '3',
    projectName: 'E-commerce Platform Development',
    projectCode: 'PRJ-2026-0003',
    category: 'Consulting',
    description: 'External API integration consultants',
    estimatedAmount: 2500000,
    actualAmount: 2800000,
    isApproved: true,
  },
  {
    id: '8',
    projectId: '3',
    projectName: 'E-commerce Platform Development',
    projectCode: 'PRJ-2026-0003',
    category: 'Equipment',
    description: 'Server infrastructure and hosting',
    estimatedAmount: 1800000,
    actualAmount: 1800000,
    isApproved: true,
  },
];

const DEMO_PROJECT_BUDGETS: ProjectBudget[] = [
  {
    id: '1',
    projectCode: 'PRJ-2026-0001',
    projectName: 'Victoria Island Office Renovation',
    totalEstimated: 25000000,
    totalActual: 12300000,
    variance: 12700000,
    percentUsed: 49,
    isOverBudget: false,
    itemCount: 3,
  },
  {
    id: '2',
    projectCode: 'PRJ-2026-0002',
    projectName: 'Youth Empowerment Program',
    totalEstimated: 15000000,
    totalActual: 3500000,
    variance: 11500000,
    percentUsed: 23,
    isOverBudget: false,
    itemCount: 3,
  },
  {
    id: '3',
    projectCode: 'PRJ-2026-0003',
    projectName: 'E-commerce Platform Development',
    totalEstimated: 8500000,
    totalActual: 4600000,
    variance: 3900000,
    percentUsed: 54,
    isOverBudget: false,
    itemCount: 2,
  },
];

const BUDGET_CATEGORIES = [
  'Materials',
  'Labor',
  'Equipment',
  'Consulting',
  'Travel',
  'Communication',
  'Training',
  'Logistics',
  'Permits & Licenses',
  'Contingency',
  'Other',
];

export default function BudgetPage() {
  const [items] = useState<BudgetItem[]>(DEMO_BUDGET_ITEMS);
  const [projectBudgets] = useState<ProjectBudget[]>(DEMO_PROJECT_BUDGETS);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'items' | 'projects'>('projects');
  const [showAddItemDialog, setShowAddItemDialog] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = !searchQuery || 
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.projectName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Overall stats
  const totalEstimated = projectBudgets.reduce((sum: any, p: any) => sum + p.totalEstimated, 0);
  const totalActual = projectBudgets.reduce((sum: any, p: any) => sum + p.totalActual, 0);
  const overallVariance = totalEstimated - totalActual;
  const overBudgetCount = projectBudgets.filter((p: any) => p.isOverBudget).length;

  return (
    <div className="container mx-auto p-6 space-y-6" data-testid="budget-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/project-management-suite">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Wallet className="h-6 w-6 text-orange-600" />
              Budget
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Track project budgets and expenses
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'projects' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('projects')}
          >
            By Project
          </Button>
          <Button
            variant={viewMode === 'items' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('items')}
          >
            All Items
          </Button>
          <Dialog open={showAddItemDialog} onOpenChange={setShowAddItemDialog}>
            <DialogTrigger asChild>
              <Button data-testid="add-budget-btn">
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Budget Item</DialogTitle>
                <DialogDescription>
                  Add a new budget line item to a project
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Select Project *</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a project" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Victoria Island Office Renovation</SelectItem>
                      <SelectItem value="2">Youth Empowerment Program</SelectItem>
                      <SelectItem value="3">E-commerce Platform Development</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Category *</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {BUDGET_CATEGORIES.map(cat => (
                        <SelectItem key={cat} value={cat.toLowerCase()}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea id="description" placeholder="e.g., Office furniture" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="estimated">Estimated Amount (₦) *</Label>
                    <Input id="estimated" type="number" placeholder="e.g., 5000000" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="actual">Actual Amount (₦)</Label>
                    <Input id="actual" type="number" placeholder="If spent" />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddItemDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setShowAddItemDialog(false)}>
                  Add Item
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-500">Total Budgeted</div>
            <div className="text-xl font-bold">{formatCurrency(totalEstimated)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-500">Total Spent</div>
            <div className="text-xl font-bold text-blue-600">{formatCurrency(totalActual)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-500">Remaining</div>
            <div className={`text-xl font-bold ${overallVariance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(overallVariance)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-500">Budget Health</div>
            <div className="text-xl font-bold flex items-center gap-2">
              {overBudgetCount === 0 ? (
                <>
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <span className="text-green-600">On Track</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <span className="text-red-600">{overBudgetCount} Over</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters (for items view) */}
      {viewMode === 'items' && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search budget items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="search-budget"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full md:w-48" data-testid="filter-category">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {BUDGET_CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Projects View */}
      {viewMode === 'projects' && (
        <div className="space-y-4">
          {projectBudgets.map((project) => (
            <Card key={project.id} data-testid={`project-budget-${project.id}`}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{project.projectName}</CardTitle>
                    <CardDescription>{project.projectCode} • {project.itemCount} items</CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{project.percentUsed}%</div>
                    <div className="text-sm text-gray-500">used</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Progress 
                  value={project.percentUsed} 
                  className={`h-3 ${project.isOverBudget ? 'bg-red-100' : ''}`}
                />
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500">Budgeted</div>
                    <div className="font-medium">{formatCurrency(project.totalEstimated)}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Spent</div>
                    <div className="font-medium">{formatCurrency(project.totalActual)}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Remaining</div>
                    <div className={`font-medium ${project.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(project.variance)}
                    </div>
                  </div>
                </div>
                {project.isOverBudget && (
                  <Badge variant="destructive" className="w-full justify-center">
                    <AlertTriangle className="mr-1 h-3 w-3" />
                    Over Budget
                  </Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Items View */}
      {viewMode === 'items' && (
        <div className="space-y-3">
          {filteredItems.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-gray-500">
                No budget items found matching your criteria
              </CardContent>
            </Card>
          ) : (
            filteredItems.map((item) => (
              <Card key={item.id} className="hover:shadow-md transition-shadow" data-testid={`budget-item-${item.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline">{item.category}</Badge>
                        {item.isApproved ? (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Approved
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="flex items-center gap-1 text-orange-600">
                            <Clock className="h-3 w-3" />
                            Pending
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-medium">{item.description}</h3>
                      <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                        <FolderKanban className="h-3.5 w-3.5" />
                        {item.projectName}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">Estimated</div>
                      <div className="font-medium">{formatCurrency(item.estimatedAmount)}</div>
                      {item.actualAmount !== null && (
                        <>
                          <div className="text-sm text-gray-500 mt-1">Actual</div>
                          <div className={`font-medium ${item.actualAmount > item.estimatedAmount ? 'text-red-600' : 'text-green-600'}`}>
                            {formatCurrency(item.actualAmount)}
                          </div>
                        </>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="ml-2">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        {!item.isApproved && (
                          <DropdownMenuItem>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Approve
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Summary */}
      <Card>
        <CardContent className="py-4">
          <div className="flex justify-between items-center text-sm text-gray-500">
            <span>
              {viewMode === 'projects' 
                ? `${projectBudgets.length} projects tracked`
                : `Showing ${filteredItems.length} of ${items.length} items`
              }
            </span>
            <div className="flex gap-4">
              <span>{items.filter((i: any) => i.isApproved).length} Approved</span>
              <span>{items.filter((i: any) => !i.isApproved).length} Pending</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
