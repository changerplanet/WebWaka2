'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ClipboardList,
  ChevronLeft,
  User,
  Clock,
  CheckCircle,
  Activity,
  Stethoscope,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HEALTH_LABELS, CONSULTATION_STATUS, ConsultationRecord } from '@/lib/health/config';

export default function ConsultationsPage() {
  const router = useRouter();
  const [consultations, setConsultations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulated data
    setConsultations([
      { id: 'c1', patientId: 'p1', patientName: 'Adaeze Okonkwo', doctorName: 'Dr. Olumide Adeyemi', status: 'WAITING', chiefComplaint: 'Fever and body pain', createdAt: '2025-01-05T08:30:00' },
      { id: 'c2', patientId: 'p2', patientName: 'Chukwuemeka Eze', doctorName: 'Dr. Olumide Adeyemi', status: 'VITALS_TAKEN', chiefComplaint: 'Follow-up visit', createdAt: '2025-01-05T08:45:00', vitalSigns: { bloodPressure: '120/80', pulse: 72 } },
      { id: 'c3', patientId: 'p3', patientName: 'Fatima Ibrahim', doctorName: 'Dr. Ngozi Onyekachi', status: 'WITH_DOCTOR', chiefComplaint: 'Persistent headache', createdAt: '2025-01-05T09:00:00' },
      { id: 'c4', patientId: 'p4', patientName: 'Oluwaseun Adeleke', doctorName: 'Dr. Olumide Adeyemi', status: 'COMPLETED', chiefComplaint: 'General checkup', createdAt: '2025-01-05T08:00:00' },
    ]);
    setLoading(false);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'WAITING': return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'VITALS_TAKEN': return <Activity className="w-5 h-5 text-blue-600" />;
      case 'WITH_DOCTOR': return <Stethoscope className="w-5 h-5 text-purple-600" />;
      case 'COMPLETED': return <CheckCircle className="w-5 h-5 text-green-600" />;
      default: return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    const config = CONSULTATION_STATUS[status as keyof typeof CONSULTATION_STATUS];
    const colors: Record<string, string> = {
      yellow: 'bg-yellow-100 border-yellow-300',
      blue: 'bg-blue-100 border-blue-300',
      purple: 'bg-purple-100 border-purple-300',
      green: 'bg-green-100 border-green-300',
      orange: 'bg-orange-100 border-orange-300',
    };
    return colors[config?.color || 'gray'];
  };

  const groupedConsultations = {
    waiting: consultations.filter((c: any) => c.status === 'WAITING'),
    vitals: consultations.filter((c: any) => c.status === 'VITALS_TAKEN'),
    withDoctor: consultations.filter((c: any) => c.status === 'WITH_DOCTOR'),
    completed: consultations.filter((c: any) => c.status === 'COMPLETED'),
  };

  return (
    <div className="min-h-screen bg-gray-50" data-testid="consultations-page">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/health/admin')}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="bg-purple-100 p-2 rounded-lg">
                <ClipboardList className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">{HEALTH_LABELS.consultations}</h1>
                <p className="text-xs text-gray-500">Today's patient queue</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
          </div>
        ) : (
          <div className="grid md:grid-cols-4 gap-4">
            {/* Waiting */}
            <div className="bg-white rounded-lg border">
              <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-yellow-600" />
                  <span className="font-medium">Waiting</span>
                </div>
                <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded-full">{groupedConsultations.waiting.length}</span>
              </div>
              <div className="p-2 space-y-2">
                {groupedConsultations.waiting.map((c: any) => (
                  <div key={c.id} className={`p-3 rounded-lg border-2 ${getStatusColor(c.status)} cursor-pointer`}
                       onClick={() => router.push(`/health/consultations/${c.id}`)}>
                    <p className="font-medium text-sm">{c.patientName}</p>
                    <p className="text-xs text-gray-600">{c.chiefComplaint}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Vitals Taken */}
            <div className="bg-white rounded-lg border">
              <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-600" />
                  <span className="font-medium">Vitals Done</span>
                </div>
                <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">{groupedConsultations.vitals.length}</span>
              </div>
              <div className="p-2 space-y-2">
                {groupedConsultations.vitals.map((c: any) => (
                  <div key={c.id} className={`p-3 rounded-lg border-2 ${getStatusColor(c.status)} cursor-pointer`}
                       onClick={() => router.push(`/health/consultations/${c.id}`)}>
                    <p className="font-medium text-sm">{c.patientName}</p>
                    <p className="text-xs text-gray-600">BP: {c.vitalSigns?.bloodPressure}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* With Doctor */}
            <div className="bg-white rounded-lg border">
              <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-purple-600" />
                  <span className="font-medium">With Doctor</span>
                </div>
                <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full">{groupedConsultations.withDoctor.length}</span>
              </div>
              <div className="p-2 space-y-2">
                {groupedConsultations.withDoctor.map((c: any) => (
                  <div key={c.id} className={`p-3 rounded-lg border-2 ${getStatusColor(c.status)} cursor-pointer`}
                       onClick={() => router.push(`/health/consultations/${c.id}`)}>
                    <p className="font-medium text-sm">{c.patientName}</p>
                    <p className="text-xs text-gray-600">{c.doctorName}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Completed */}
            <div className="bg-white rounded-lg border">
              <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="font-medium">Completed</span>
                </div>
                <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">{groupedConsultations.completed.length}</span>
              </div>
              <div className="p-2 space-y-2">
                {groupedConsultations.completed.map((c: any) => (
                  <div key={c.id} className={`p-3 rounded-lg border-2 ${getStatusColor(c.status)} cursor-pointer`}
                       onClick={() => router.push(`/health/consultations/${c.id}`)}>
                    <p className="font-medium text-sm">{c.patientName}</p>
                    <p className="text-xs text-gray-600">Done</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
