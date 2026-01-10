'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Pill,
  ChevronLeft,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HEALTH_LABELS, PRESCRIPTION_STATUS, Prescription } from '@/lib/health/config';

export default function PharmacyPage() {
  const router = useRouter();
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulated data
    setPrescriptions([
      { id: 'rx1', patientName: 'Adaeze Okonkwo', doctorName: 'Dr. Olumide Adeyemi', status: 'PENDING_DISPENSING', items: [{ drugName: 'Paracetamol 500mg', quantity: 20 }, { drugName: 'Vitamin C 1000mg', quantity: 30 }], createdAt: '2025-01-05T09:30:00' },
      { id: 'rx2', patientName: 'Chukwuemeka Eze', doctorName: 'Dr. Olumide Adeyemi', status: 'PENDING_DISPENSING', items: [{ drugName: 'Amoxicillin 500mg', quantity: 21 }], createdAt: '2025-01-05T09:45:00' },
      { id: 'rx3', patientName: 'Fatima Ibrahim', doctorName: 'Dr. Ngozi Onyekachi', status: 'DISPENSED', items: [{ drugName: 'Ibuprofen 400mg', quantity: 15 }], createdAt: '2025-01-05T08:30:00' },
    ]);
    setLoading(false);
  }, []);

  const pendingPrescriptions = prescriptions.filter((p: any) => p.status === 'PENDING_DISPENSING' || p.status === 'PARTIALLY_DISPENSED');
  const completedPrescriptions = prescriptions.filter((p: any) => p.status === 'DISPENSED');

  const getStatusColor = (status: string) => {
    const config = PRESCRIPTION_STATUS[status as keyof typeof PRESCRIPTION_STATUS];
    const colors: Record<string, string> = {
      yellow: 'bg-yellow-100 text-yellow-800',
      green: 'bg-green-100 text-green-800',
      orange: 'bg-orange-100 text-orange-800',
      blue: 'bg-blue-100 text-blue-800',
      red: 'bg-red-100 text-red-800',
      gray: 'bg-gray-100 text-gray-800',
    };
    return colors[config?.color || 'gray'];
  };

  return (
    <div className="min-h-screen bg-gray-50" data-testid="pharmacy-page">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/health/admin')}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="bg-orange-100 p-2 rounded-lg">
                <Pill className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">{HEALTH_LABELS.pharmacy}</h1>
                <p className="text-xs text-gray-500">{pendingPrescriptions.length} pending</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Pending Prescriptions */}
        <div className="bg-white rounded-lg border">
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-600" />
              <h3 className="font-semibold">Pending Dispensing</h3>
            </div>
            <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded-full">{pendingPrescriptions.length}</span>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
            </div>
          ) : pendingPrescriptions.length === 0 ? (
            <div className="text-center p-12">
              <CheckCircle className="w-12 h-12 text-green-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">All caught up!</h3>
              <p className="text-gray-500">No pending prescriptions</p>
            </div>
          ) : (
            <div className="divide-y">
              {pendingPrescriptions.map(rx => (
                <div key={rx.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="bg-cyan-100 text-cyan-700 font-semibold text-sm w-10 h-10 rounded-full flex items-center justify-center">
                        {rx.patientName.split(' ').map((n: string) => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{rx.patientName}</p>
                        <p className="text-xs text-gray-500">{rx.doctorName}</p>
                      </div>
                    </div>
                    <Button size="sm" onClick={() => alert('Dispense prescription: ' + rx.id)}>
                      Dispense
                    </Button>
                  </div>
                  <div className="pl-13 space-y-1">
                    {rx.items.map((item: any, i: number) => (
                      <div key={i} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded">
                        <span>{item.drugName}</span>
                        <span className="font-medium">x{item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Completed Today */}
        <div className="bg-white rounded-lg border">
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold">Dispensed Today</h3>
            </div>
            <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">{completedPrescriptions.length}</span>
          </div>
          <div className="divide-y">
            {completedPrescriptions.map(rx => (
              <div key={rx.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-gray-100 text-gray-600 text-sm w-10 h-10 rounded-full flex items-center justify-center">
                    {rx.patientName.split(' ').map((n: string) => n[0]).join('')}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{rx.patientName}</p>
                    <p className="text-xs text-gray-500">{rx.items.length} items</p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(rx.status)}`}>
                  {PRESCRIPTION_STATUS[rx.status as keyof typeof PRESCRIPTION_STATUS]?.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
