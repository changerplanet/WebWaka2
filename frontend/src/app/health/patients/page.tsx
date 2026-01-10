'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  Plus,
  Search,
  ChevronLeft,
  MoreVertical,
  Eye,
  Edit,
  Phone,
  Mail,
  AlertCircle,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { HEALTH_LABELS, BloodGroup } from '@/lib/health/config';

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  medicalRecordNumber: string;
  phone?: string;
  email?: string;
  dateOfBirth?: string;
  bloodGroup?: BloodGroup;
  allergies: string[];
  insuranceProvider?: string;
  status: string;
  lastVisitDate?: string;
}

export default function PatientsPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    // Simulated data
    setPatients([
      { id: 'p1', firstName: 'Adaeze', lastName: 'Okonkwo', medicalRecordNumber: 'MRN-2025-0001', phone: '+234 803 456 7890', bloodGroup: 'O+', allergies: ['Penicillin'], insuranceProvider: 'HMO Nigeria', status: 'ACTIVE', lastVisitDate: '2025-01-03' },
      { id: 'p2', firstName: 'Chukwuemeka', lastName: 'Eze', medicalRecordNumber: 'MRN-2025-0002', phone: '+234 802 345 6789', bloodGroup: 'A+', allergies: [], status: 'ACTIVE', lastVisitDate: '2025-01-05' },
      { id: 'p3', firstName: 'Fatima', lastName: 'Ibrahim', medicalRecordNumber: 'MRN-2025-0003', phone: '+234 805 678 9012', bloodGroup: 'B+', allergies: ['Sulfa drugs'], insuranceProvider: 'NHIS', status: 'ACTIVE' },
      { id: 'p4', firstName: 'Oluwaseun', lastName: 'Adeleke', medicalRecordNumber: 'MRN-2024-0089', phone: '+234 806 789 0123', bloodGroup: 'AB-', allergies: [], status: 'ACTIVE', lastVisitDate: '2024-12-20' },
    ]);
    setLoading(false);
  }, []);

  const filteredPatients = patients.filter((p: any) => 
    `${p.firstName} ${p.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
    p.medicalRecordNumber.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50" data-testid="patients-page">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/health/admin')}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">{HEALTH_LABELS.patients}</h1>
                <p className="text-xs text-gray-500">{patients.length} registered</p>
              </div>
            </div>
          </div>
          <Button onClick={() => router.push('/health/patients/new')} data-testid="add-patient-btn">
            <Plus className="w-4 h-4 mr-2" />
            New Patient
          </Button>
        </div>
      </header>

      <div className="p-6 space-y-4">
        <div className="bg-white rounded-lg border p-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search by name or MRN..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              data-testid="patient-search"
            />
          </div>
        </div>

        <div className="bg-white rounded-lg border overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="text-center p-12">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No patients found</h3>
              <p className="text-gray-500 mb-4">Register your first patient</p>
              <Button onClick={() => router.push('/health/patients/new')}>
                <Plus className="w-4 h-4 mr-2" />
                New Patient
              </Button>
            </div>
          ) : (
            <table className="w-full" data-testid="patients-table">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Patient</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">MRN</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Contact</th>
                  <th className="text-center p-4 text-sm font-medium text-gray-600">Blood</th>
                  <th className="text-center p-4 text-sm font-medium text-gray-600">Allergies</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Insurance</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredPatients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => router.push(`/health/patients/${patient.id}`)}>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-cyan-100 text-cyan-700 font-semibold text-sm w-10 h-10 rounded-full flex items-center justify-center">
                          {patient.firstName[0]}{patient.lastName[0]}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{patient.firstName} {patient.lastName}</p>
                          <p className="text-xs text-gray-500">Last visit: {patient.lastVisitDate || 'Never'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-mono text-sm">{patient.medicalRecordNumber}</td>
                    <td className="p-4">
                      {patient.phone && <p className="text-sm flex items-center gap-1"><Phone className="w-3 h-3" /> {patient.phone}</p>}
                    </td>
                    <td className="p-4 text-center">
                      <span className="text-sm font-medium">{patient.bloodGroup || '-'}</span>
                    </td>
                    <td className="p-4 text-center">
                      {patient.allergies.length > 0 ? (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-red-100 text-red-700">
                          <AlertCircle className="w-3 h-3" />
                          {patient.allergies.length}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">None</span>
                      )}
                    </td>
                    <td className="p-4 text-sm">{patient.insuranceProvider || '-'}</td>
                    <td className="p-4" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm"><MoreVertical className="w-4 h-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/health/patients/${patient.id}`)}>
                            <Eye className="w-4 h-4 mr-2" /> View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push(`/health/appointments/new?patient=${patient.id}`)}>
                            Book Appointment
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
