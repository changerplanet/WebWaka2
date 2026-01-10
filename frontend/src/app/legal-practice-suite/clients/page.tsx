/**
 * LEGAL PRACTICE SUITE — Clients Page
 * Phase 7B.1, S5 Admin UI
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Users, 
  Plus, 
  Search, 
  Building2,
  User,
  Phone,
  Mail,
  MoreVertical,
  Eye,
  Briefcase
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Demo clients
const DEMO_CLIENTS = [
  { id: '1', name: 'Chief Emeka Okafor', type: 'individual', phone: '08033445566', email: 'chief.okafor@email.com', activeMatters: 2, organization: null },
  { id: '2', name: 'Zenith Bank Plc', type: 'corporate', phone: '07012345678', email: 'legal@zenithbank.com', activeMatters: 1, organization: 'Banking' },
  { id: '3', name: 'Mr. Tunde Adebayo', type: 'individual', phone: '08098765432', email: 'tunde.adebayo@email.com', activeMatters: 1, organization: null },
  { id: '4', name: 'NaijaTech Solutions Ltd', type: 'corporate', phone: '09011223344', email: 'legal@naijatech.ng', activeMatters: 1, organization: 'Technology' },
  { id: '5', name: 'Mrs. Aisha Mohammed', type: 'individual', phone: '08055667788', email: 'aisha.mohammed@email.com', activeMatters: 0, organization: null },
  { id: '6', name: 'ABC Construction Ltd', type: 'corporate', phone: '08099887766', email: 'info@abcconstruction.ng', activeMatters: 0, organization: 'Construction' },
];

export default function ClientsPage() {
  const [clients] = useState(DEMO_CLIENTS);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const filteredClients = clients.filter((c) => {
    const matchesSearch = 
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || c.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const stats = {
    total: clients.length,
    individual: clients.filter((c: any) => c.type === 'individual').length,
    corporate: clients.filter((c: any) => c.type === 'corporate').length,
    withActiveMatters: clients.filter((c: any) => c.activeMatters > 0).length,
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/legal-practice-suite" className="hover:text-foreground transition-colors">
          Legal Practice
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">Clients</span>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            Clients
          </h1>
          <p className="text-muted-foreground">Manage client directory</p>
        </div>
        <Button data-testid="add-client-btn">
          <Plus className="mr-2 h-4 w-4" />
          Add Client
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Total Clients</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-blue-600">{stats.individual}</div>
            <p className="text-xs text-muted-foreground">Individuals</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">{stats.corporate}</div>
            <p className="text-xs text-muted-foreground">Corporate</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-purple-600">{stats.withActiveMatters}</div>
            <p className="text-xs text-muted-foreground">Active Matters</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search clients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              data-testid="client-search"
            />
          </div>
        </CardContent>
      </Card>

      {/* Clients Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredClients.map((client) => (
          <Card key={client.id} className="hover:shadow-md transition-shadow" data-testid={`client-card-${client.id}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${client.type === 'corporate' ? 'bg-green-100' : 'bg-blue-100'}`}>
                    {client.type === 'corporate' ? (
                      <Building2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <User className="h-5 w-5 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold">{client.name}</h3>
                    <Badge variant="outline" className="mt-1">
                      {client.type === 'corporate' ? 'Corporate' : 'Individual'}
                    </Badge>
                    {client.organization && (
                      <p className="text-xs text-muted-foreground mt-1">{client.organization}</p>
                    )}
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Eye className="mr-2 h-4 w-4" />
                      View Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Briefcase className="mr-2 h-4 w-4" />
                      View Matters
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-3 w-3" />
                  {client.phone}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-3 w-3" />
                  {client.email}
                </div>
              </div>
              <div className="mt-4 pt-3 border-t flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Active Matters</span>
                <Badge variant={client.activeMatters > 0 ? 'default' : 'secondary'}>
                  {client.activeMatters}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredClients.length === 0 && (
          <Card className="md:col-span-2 lg:col-span-3">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No clients found</h3>
              <p className="text-sm text-muted-foreground">Try adjusting your search</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
