/**
 * LEGAL PRACTICE SUITE — Documents Page
 * Phase 7B.1, S5 Admin UI
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  FileText, 
  Plus, 
  Search, 
  File,
  Shield,
  Tag,
  MoreVertical,
  Eye,
  Download
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Demo documents
const DEMO_DOCUMENTS = [
  { id: '1', title: 'Motion for Adjournment', category: 'motion', matterNumber: 'MAT-2026-0012', matterTitle: 'Chief Okafor v. ABC Construction', isEvidence: false, isConfidential: false, authorName: 'Barr. Adaeze Nwosu', createdAt: '2026-01-05', status: 'Draft' },
  { id: '2', title: 'Witness Statement - Mr. Eze', category: 'evidence', matterNumber: 'MAT-2026-0012', matterTitle: 'Chief Okafor v. ABC Construction', isEvidence: true, exhibitNumber: 'Exhibit C', isConfidential: false, authorName: 'Barr. Adaeze Nwosu', createdAt: '2026-01-04', status: 'Final' },
  { id: '3', title: 'Bail Application', category: 'motion', matterNumber: 'MAT-2026-0008', matterTitle: 'State v. Mr. Adebayo', isEvidence: false, isConfidential: false, authorName: 'Barr. Chidi Okoro', createdAt: '2026-01-03', status: 'Filed' },
  { id: '4', title: 'Client Engagement Letter', category: 'correspondence', matterNumber: 'MAT-2026-0015', matterTitle: 'Zenith Bank v. Pinnacle', isEvidence: false, isConfidential: true, authorName: 'Barr. Adaeze Nwosu', createdAt: '2025-09-20', status: 'Final' },
  { id: '5', title: 'Contract Agreement (Disputed)', category: 'evidence', matterNumber: 'MAT-2026-0015', matterTitle: 'Zenith Bank v. Pinnacle', isEvidence: true, exhibitNumber: 'Exhibit A', isConfidential: false, authorName: 'Zenith Bank Legal', createdAt: '2025-09-15', status: 'Final' },
  { id: '6', title: 'Trademark Application Form', category: 'draft', matterNumber: 'MAT-2025-0089', matterTitle: 'NaijaTech Trademark', isEvidence: false, isConfidential: false, authorName: 'Barr. Funmi Adeola', createdAt: '2025-06-12', status: 'Draft' },
];

const CATEGORY_COLORS: Record<string, string> = {
  motion: 'bg-blue-100 text-blue-800',
  evidence: 'bg-purple-100 text-purple-800',
  correspondence: 'bg-green-100 text-green-800',
  draft: 'bg-gray-100 text-gray-800',
  brief: 'bg-yellow-100 text-yellow-800',
  affidavit: 'bg-orange-100 text-orange-800',
};

export default function DocumentsPage() {
  const [documents] = useState(DEMO_DOCUMENTS);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const filteredDocuments = documents.filter((d) => {
    const matchesSearch = 
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.matterNumber.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || d.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const stats = {
    total: documents.length,
    evidence: documents.filter((d: any) => d.isEvidence).length,
    confidential: documents.filter((d: any) => d.isConfidential).length,
    drafts: documents.filter((d: any) => d.status === 'Draft').length,
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/legal-practice-suite" className="hover:text-foreground transition-colors">
          Legal Practice
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">Documents</span>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Documents
          </h1>
          <p className="text-muted-foreground">Manage case documents and evidence</p>
        </div>
        <Button data-testid="upload-doc-btn">
          <Plus className="mr-2 h-4 w-4" />
          Upload Document
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Total Documents</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-purple-600">{stats.evidence}</div>
            <p className="text-xs text-muted-foreground">Evidence Items</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-red-600">{stats.confidential}</div>
            <p className="text-xs text-muted-foreground">Confidential</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-gray-600">{stats.drafts}</div>
            <p className="text-xs text-muted-foreground">Drafts</p>
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
                placeholder="Search documents..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
                data-testid="doc-search"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="motion">Motion</SelectItem>
                <SelectItem value="brief">Brief</SelectItem>
                <SelectItem value="evidence">Evidence</SelectItem>
                <SelectItem value="correspondence">Correspondence</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Documents Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Document</TableHead>
              <TableHead>Matter</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDocuments.map((doc) => (
              <TableRow key={doc.id} data-testid={`doc-row-${doc.id}`}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <File className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {doc.title}
                        {doc.isConfidential && <Shield className="h-3 w-3 text-red-500" />}
                      </div>
                      {doc.isEvidence && doc.exhibitNumber && (
                        <div className="flex items-center gap-1 text-xs text-purple-600">
                          <Tag className="h-3 w-3" />
                          {doc.exhibitNumber}
                        </div>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-mono text-xs">{doc.matterNumber}</div>
                    <div className="text-xs text-muted-foreground truncate max-w-[150px]">{doc.matterTitle}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={CATEGORY_COLORS[doc.category]}>
                    {doc.category}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">{doc.authorName}</TableCell>
                <TableCell className="text-sm">{new Date(doc.createdAt).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })}</TableCell>
                <TableCell>
                  <Badge variant={doc.status === 'Filed' ? 'default' : doc.status === 'Final' ? 'secondary' : 'outline'}>
                    {doc.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {filteredDocuments.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No documents found</h3>
            <p className="text-sm text-muted-foreground">Try adjusting your filters</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
