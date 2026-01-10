/**
 * PROJECT MANAGEMENT SUITE — Team Page
 * Phase 7C.2, S5 Admin UI
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Users, 
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  ArrowLeft,
  Mail,
  Phone,
  FolderKanban,
  CheckSquare,
  Crown,
  Shield,
  UserCog
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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

interface TeamMember {
  id: string;
  memberId: string;
  memberName: string;
  memberEmail: string;
  memberType: string;
  role: string;
  department: string;
  projectCount: number;
  activeTaskCount: number;
  completedTaskCount: number;
}

const DEMO_TEAM: TeamMember[] = [
  {
    id: '1',
    memberId: 'staff-001',
    memberName: 'Chidi Okonkwo',
    memberEmail: 'chidi.okonkwo@webwaka.com',
    memberType: 'STAFF',
    role: 'OWNER',
    department: 'Operations',
    projectCount: 2,
    activeTaskCount: 5,
    completedTaskCount: 12,
  },
  {
    id: '2',
    memberId: 'staff-002',
    memberName: 'Amaka Eze',
    memberEmail: 'amaka.eze@webwaka.com',
    memberType: 'STAFF',
    role: 'MANAGER',
    department: 'Programs',
    projectCount: 1,
    activeTaskCount: 4,
    completedTaskCount: 8,
  },
  {
    id: '3',
    memberId: 'staff-003',
    memberName: 'Tunde Adeyemi',
    memberEmail: 'tunde.adeyemi@webwaka.com',
    memberType: 'STAFF',
    role: 'LEAD',
    department: 'IT',
    projectCount: 1,
    activeTaskCount: 6,
    completedTaskCount: 15,
  },
  {
    id: '4',
    memberId: 'staff-004',
    memberName: 'Ngozi Amadi',
    memberEmail: 'ngozi.amadi@webwaka.com',
    memberType: 'STAFF',
    role: 'MEMBER',
    department: 'Procurement',
    projectCount: 1,
    activeTaskCount: 3,
    completedTaskCount: 5,
  },
  {
    id: '5',
    memberId: 'staff-005',
    memberName: 'Ibrahim Musa',
    memberEmail: 'ibrahim.musa@webwaka.com',
    memberType: 'STAFF',
    role: 'MEMBER',
    department: 'Engineering',
    projectCount: 2,
    activeTaskCount: 2,
    completedTaskCount: 7,
  },
  {
    id: '6',
    memberId: 'staff-006',
    memberName: 'Fatima Abdullahi',
    memberEmail: 'fatima.abdullahi@webwaka.com',
    memberType: 'STAFF',
    role: 'MEMBER',
    department: 'HR',
    projectCount: 1,
    activeTaskCount: 2,
    completedTaskCount: 4,
  },
  {
    id: '7',
    memberId: 'staff-007',
    memberName: 'Emeka Nwosu',
    memberEmail: 'emeka.nwosu@webwaka.com',
    memberType: 'STAFF',
    role: 'MEMBER',
    department: 'Logistics',
    projectCount: 1,
    activeTaskCount: 1,
    completedTaskCount: 3,
  },
  {
    id: '8',
    memberId: 'ext-001',
    memberName: 'Architect Dele Balogun',
    memberEmail: 'dele.balogun@architects.ng',
    memberType: 'EXTERNAL',
    role: 'OBSERVER',
    department: 'External Consultant',
    projectCount: 1,
    activeTaskCount: 0,
    completedTaskCount: 2,
  },
];

export default function TeamPage() {
  const [team] = useState<TeamMember[]>(DEMO_TEAM);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);

  const getRoleBadge = (role: string) => {
    const config: Record<string, { variant: 'default' | 'secondary' | 'outline'; icon: any; label: string }> = {
      OWNER: { variant: 'default', icon: Crown, label: 'Owner' },
      MANAGER: { variant: 'default', icon: Shield, label: 'Manager' },
      LEAD: { variant: 'outline', icon: UserCog, label: 'Lead' },
      MEMBER: { variant: 'secondary', icon: Users, label: 'Member' },
      OBSERVER: { variant: 'secondary', icon: Eye, label: 'Observer' },
    };
    const style = config[role] || { variant: 'secondary', icon: Users, label: role };
    const Icon = style.icon;
    return (
      <Badge variant={style.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {style.label}
      </Badge>
    );
  };

  const filteredTeam = team.filter(member => {
    const matchesSearch = !searchQuery || 
      member.memberName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.memberEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.department.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || member.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Stats
  const totalMembers = team.length;
  const staffCount = team.filter((m: any) => m.memberType === 'STAFF').length;
  const externalCount = team.filter((m: any) => m.memberType === 'EXTERNAL').length;

  return (
    <div className="container mx-auto p-6 space-y-6" data-testid="team-page">
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
              <Users className="h-6 w-6 text-purple-600" />
              Team
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Manage project team members
            </p>
          </div>
        </div>
        <Dialog open={showAddMemberDialog} onOpenChange={setShowAddMemberDialog}>
          <DialogTrigger asChild>
            <Button data-testid="add-member-btn">
              <Plus className="mr-2 h-4 w-4" />
              Add Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Team Member</DialogTitle>
              <DialogDescription>
                Add a staff member or external contributor to projects
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Member Type</Label>
                <Select defaultValue="STAFF">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STAFF">Internal Staff</SelectItem>
                    <SelectItem value="EXTERNAL">External Contributor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Select Staff Member</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose from HR directory" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">+ Add New Staff</SelectItem>
                    <SelectItem value="staff-008">Blessing Okafor</SelectItem>
                    <SelectItem value="staff-009">Yusuf Danladi</SelectItem>
                    <SelectItem value="staff-010">Chioma Igwe</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Assign to Projects</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select projects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Victoria Island Office Renovation</SelectItem>
                    <SelectItem value="2">Youth Empowerment Program</SelectItem>
                    <SelectItem value="3">E-commerce Platform Development</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select defaultValue="MEMBER">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OWNER">Owner</SelectItem>
                    <SelectItem value="MANAGER">Manager</SelectItem>
                    <SelectItem value="LEAD">Lead</SelectItem>
                    <SelectItem value="MEMBER">Member</SelectItem>
                    <SelectItem value="OBSERVER">Observer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddMemberDialog(false)}>
                Cancel
              </Button>
              <Button onClick={() => setShowAddMemberDialog(false)}>
                Add Member
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{totalMembers}</div>
            <div className="text-sm text-gray-500">Total Members</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{staffCount}</div>
            <div className="text-sm text-gray-500">Internal Staff</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{externalCount}</div>
            <div className="text-sm text-gray-500">External</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, email, or department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="search-team"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full md:w-48" data-testid="filter-role">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="OWNER">Owner</SelectItem>
                <SelectItem value="MANAGER">Manager</SelectItem>
                <SelectItem value="LEAD">Lead</SelectItem>
                <SelectItem value="MEMBER">Member</SelectItem>
                <SelectItem value="OBSERVER">Observer</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Team List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredTeam.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="py-8 text-center text-gray-500">
              No team members found matching your criteria
            </CardContent>
          </Card>
        ) : (
          filteredTeam.map((member) => (
            <Card key={member.id} className="hover:shadow-md transition-shadow" data-testid={`member-card-${member.id}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white font-medium">
                      {member.memberName.split(' ').map((n: any) => n[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <h3 className="font-medium">{member.memberName}</h3>
                      <p className="text-sm text-gray-500">{member.department}</p>
                      <div className="mt-1">{getRoleBadge(member.role)}</div>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Eye className="mr-2 h-4 w-4" />
                        View Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Edit className="mr-2 h-4 w-4" />
                        Change Role
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Mail className="mr-2 h-4 w-4" />
                        Send Email
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Remove
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="mt-4 pt-3 border-t">
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                    <Mail className="h-3.5 w-3.5" />
                    {member.memberEmail}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1 text-gray-500">
                      <FolderKanban className="h-3.5 w-3.5" />
                      {member.projectCount} projects
                    </span>
                    <span className="flex items-center gap-1 text-gray-500">
                      <CheckSquare className="h-3.5 w-3.5" />
                      {member.activeTaskCount} active / {member.completedTaskCount} done
                    </span>
                  </div>
                </div>

                {member.memberType === 'EXTERNAL' && (
                  <Badge variant="outline" className="mt-3 w-full justify-center">
                    External Contributor
                  </Badge>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Summary */}
      <Card>
        <CardContent className="py-4">
          <div className="flex justify-between items-center text-sm text-gray-500">
            <span>Showing {filteredTeam.length} of {team.length} members</span>
            <div className="flex gap-4">
              <span>{team.filter((m: any) => m.role === 'OWNER' || m.role === 'MANAGER').length} Leads</span>
              <span>{team.filter((m: any) => m.role === 'MEMBER').length} Members</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
