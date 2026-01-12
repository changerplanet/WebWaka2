'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import {
  Users,
  Plus,
  Search,
  Filter,
  MoreVertical,
  ChevronLeft,
  Download,
  Upload,
  Eye,
  Edit,
  Trash2,
  Phone,
  Mail,
  GraduationCap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EDUCATION_LABELS } from '@/lib/education/config';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  admissionNumber: string;
  className: string;
  classId: string;
  section: string;
  rollNumber: string;
  phone?: string;
  email?: string;
  guardianName: string;
  guardianPhone: string;
  status: 'ACTIVE' | 'GRADUATED' | 'TRANSFERRED' | 'WITHDRAWN' | 'SUSPENDED';
  enrollmentDate: string;
}

interface ClassOption {
  id: string;
  name: string;
  sections: string[];
}

export default function StudentsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });

  // Phase 12B: Wrapped in useCallback for hook hygiene
  const fetchClasses = useCallback(async () => {
    // Simulated - in production, fetch from API
    setClasses([
      { id: 'class_1', name: 'JSS 1', sections: ['A', 'B'] },
      { id: 'class_2', name: 'JSS 2', sections: ['A', 'B'] },
      { id: 'class_3', name: 'JSS 3', sections: ['A', 'B'] },
      { id: 'class_4', name: 'SS 1', sections: ['Science', 'Arts', 'Commercial'] },
      { id: 'class_5', name: 'SS 2', sections: ['Science', 'Arts', 'Commercial'] },
      { id: 'class_6', name: 'SS 3', sections: ['Science', 'Arts', 'Commercial'] },
    ]);
  }, []);

  // Phase 12B: Wrapped in useCallback for hook hygiene
  const fetchStudents = useCallback(async () => {
    setLoading(true);
    // Simulated data - in production, fetches from Education API
    const mockStudents: Student[] = [
      {
        id: 'std_1',
        firstName: 'Adaeze',
        lastName: 'Okonkwo',
        admissionNumber: 'STU/2025/0001',
        className: 'JSS 1',
        classId: 'class_1',
        section: 'A',
        rollNumber: '01',
        phone: '+234 803 456 7890',
        email: 'adaeze@example.com',
        guardianName: 'Chief Okonkwo',
        guardianPhone: '+234 801 234 5678',
        status: 'ACTIVE',
        enrollmentDate: '2025-09-01',
      },
      {
        id: 'std_2',
        firstName: 'Chibuzo',
        lastName: 'Eze',
        admissionNumber: 'STU/2025/0002',
        className: 'JSS 1',
        classId: 'class_1',
        section: 'A',
        rollNumber: '02',
        guardianName: 'Mrs. Eze',
        guardianPhone: '+234 802 345 6789',
        status: 'ACTIVE',
        enrollmentDate: '2025-09-01',
      },
      {
        id: 'std_3',
        firstName: 'Emeka',
        lastName: 'Nwosu',
        admissionNumber: 'STU/2025/0003',
        className: 'SS 2',
        classId: 'class_5',
        section: 'Science',
        rollNumber: '15',
        email: 'emeka.n@example.com',
        guardianName: 'Dr. Nwosu',
        guardianPhone: '+234 805 678 9012',
        status: 'ACTIVE',
        enrollmentDate: '2023-09-01',
      },
      {
        id: 'std_4',
        firstName: 'Fatima',
        lastName: 'Ibrahim',
        admissionNumber: 'STU/2024/0045',
        className: 'SS 3',
        classId: 'class_6',
        section: 'Arts',
        rollNumber: '08',
        guardianName: 'Alhaji Ibrahim',
        guardianPhone: '+234 806 789 0123',
        status: 'ACTIVE',
        enrollmentDate: '2022-09-01',
      },
      {
        id: 'std_5',
        firstName: 'Godwin',
        lastName: 'Adeleke',
        admissionNumber: 'STU/2023/0089',
        className: 'JSS 3',
        classId: 'class_3',
        section: 'B',
        rollNumber: '22',
        guardianName: 'Pastor Adeleke',
        guardianPhone: '+234 807 890 1234',
        status: 'SUSPENDED',
        enrollmentDate: '2023-09-01',
      },
    ];

    // Apply filters
    let filtered = mockStudents;
    if (selectedClass !== 'all') {
      filtered = filtered.filter((s: any) => s.classId === selectedClass);
    }
    if (selectedStatus !== 'all') {
      filtered = filtered.filter((s: any) => s.status === selectedStatus);
    }
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter((s: any) => 
        `${s.firstName} ${s.lastName}`.toLowerCase().includes(searchLower) ||
        s.admissionNumber.toLowerCase().includes(searchLower)
      );
    }

    setPagination(prev => ({ ...prev, total: filtered.length }));
    setStudents(filtered);
    setLoading(false);
  }, [selectedClass, selectedStatus, search]);

  useEffect(() => {
    fetchStudents();
    fetchClasses();
  }, [fetchStudents, fetchClasses]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'GRADUATED': return 'bg-blue-100 text-blue-800';
      case 'TRANSFERRED': return 'bg-yellow-100 text-yellow-800';
      case 'WITHDRAWN': return 'bg-gray-100 text-gray-800';
      case 'SUSPENDED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50" data-testid="students-page">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/education/admin')}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">{EDUCATION_LABELS.students}</h1>
                <p className="text-xs text-gray-500">{pagination.total} total students</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Upload className="w-4 h-4 mr-2" />
              Import
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button onClick={() => router.push('/education/students/new')} data-testid="add-student-btn">
              <Plus className="w-4 h-4 mr-2" />
              Add Student
            </Button>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-4">
        {/* Filters */}
        <div className="bg-white rounded-lg border p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[250px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search by name or admission number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
                data-testid="student-search"
              />
            </div>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-40" data-testid="class-filter">
                <SelectValue placeholder="All Classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classes.map(cls => (
                  <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-40" data-testid="status-filter">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="GRADUATED">Graduated</SelectItem>
                <SelectItem value="TRANSFERRED">Transferred</SelectItem>
                <SelectItem value="SUSPENDED">Suspended</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => { setSearch(''); setSelectedClass('all'); setSelectedStatus('all'); }}>
              Clear Filters
            </Button>
          </div>
        </div>

        {/* Students Table */}
        <div className="bg-white rounded-lg border overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            </div>
          ) : students.length === 0 ? (
            <div className="text-center p-12">
              <GraduationCap className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No students found</h3>
              <p className="text-gray-500 mb-4">Try adjusting your filters or add a new student</p>
              <Button onClick={() => router.push('/education/students/new')}>
                <Plus className="w-4 h-4 mr-2" />
                Add Student
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full" data-testid="students-table">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left p-4 text-sm font-medium text-gray-600">Student</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-600">Admission No.</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-600">Class</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-600">Guardian</th>
                    <th className="text-center p-4 text-sm font-medium text-gray-600">Status</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {students.map((student) => (
                    <tr 
                      key={student.id} 
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => router.push(`/education/students/${student.id}`)}
                      data-testid={`student-row-${student.id}`}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-emerald-100 text-emerald-700 font-semibold text-sm w-10 h-10 rounded-full flex items-center justify-center">
                            {student.firstName[0]}{student.lastName[0]}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{student.firstName} {student.lastName}</p>
                            {student.email && (
                              <p className="text-xs text-gray-500 flex items-center gap-1">
                                <Mail className="w-3 h-3" /> {student.email}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="font-mono text-sm">{student.admissionNumber}</p>
                      </td>
                      <td className="p-4">
                        <p className="font-medium">{student.className}</p>
                        <p className="text-xs text-gray-500">Section {student.section} • Roll #{student.rollNumber}</p>
                      </td>
                      <td className="p-4">
                        <p className="text-sm">{student.guardianName}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {student.guardianPhone}
                        </p>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(student.status)}`}>
                          {student.status}
                        </span>
                      </td>
                      <td className="p-4" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/education/students/${student.id}`)}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/education/students/${student.id}/edit`)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {students.length > 0 && (
          <div className="flex items-center justify-between text-sm text-gray-600">
            <p>Showing {students.length} of {pagination.total} students</p>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                disabled={pagination.page === 1}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              >
                Previous
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                disabled={pagination.page * pagination.limit >= pagination.total}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
