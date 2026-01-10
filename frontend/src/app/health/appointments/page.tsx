'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { HEALTH_LABELS, APPOINTMENT_STATUS, APPOINTMENT_TYPES, Appointment } from '@/lib/health/config';

export default function AppointmentsPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedDoctor, setSelectedDoctor] = useState<string>('all');

  useEffect(() => {
    // Simulated data
    setAppointments([
      { id: 'a1', tenantId: '', patientId: 'p1', patientName: 'Adaeze Okonkwo', doctorId: 'd1', doctorName: 'Dr. Olumide Adeyemi', appointmentDate: selectedDate, startTime: '09:00', endTime: '09:30', status: 'CONFIRMED', type: 'CONSULTATION', reason: 'Fever', createdAt: '', updatedAt: '' },
      { id: 'a2', tenantId: '', patientId: 'p2', patientName: 'Chukwuemeka Eze', doctorId: 'd1', doctorName: 'Dr. Olumide Adeyemi', appointmentDate: selectedDate, startTime: '09:30', endTime: '10:00', status: 'CHECKED_IN', type: 'FOLLOW_UP', createdAt: '', updatedAt: '' },
      { id: 'a3', tenantId: '', patientId: 'p3', patientName: 'Fatima Ibrahim', doctorId: 'd2', doctorName: 'Dr. Ngozi Onyekachi', appointmentDate: selectedDate, startTime: '10:00', endTime: '10:30', status: 'SCHEDULED', type: 'CONSULTATION', reason: 'Headache', createdAt: '', updatedAt: '' },
      { id: 'a4', tenantId: '', patientId: 'p4', patientName: 'Oluwaseun Adeleke', doctorId: 'd1', doctorName: 'Dr. Olumide Adeyemi', appointmentDate: selectedDate, startTime: '11:00', endTime: '11:30', status: 'COMPLETED', type: 'CONSULTATION', createdAt: '', updatedAt: '' },
    ]);
    setLoading(false);
  }, [selectedDate]);

  const changeDate = (days: number) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + days);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'CANCELLED': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'CHECKED_IN': return <User className="w-4 h-4 text-purple-600" />;
      case 'CONFIRMED': return <CheckCircle className="w-4 h-4 text-blue-600" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    const statusConfig = APPOINTMENT_STATUS[status as keyof typeof APPOINTMENT_STATUS];
    const colors: Record<string, string> = {
      blue: 'bg-blue-100 text-blue-800',
      green: 'bg-green-100 text-green-800',
      purple: 'bg-purple-100 text-purple-800',
      orange: 'bg-orange-100 text-orange-800',
      gray: 'bg-gray-100 text-gray-800',
      red: 'bg-red-100 text-red-800',
      yellow: 'bg-yellow-100 text-yellow-800',
    };
    return colors[statusConfig?.color || 'gray'];
  };

  const filteredAppointments = selectedDoctor === 'all' 
    ? appointments 
    : appointments.filter((a: any) => a.doctorId === selectedDoctor);

  return (
    <div className="min-h-screen bg-gray-50" data-testid="appointments-page">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/health/admin')}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="bg-green-100 p-2 rounded-lg">
                <Calendar className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">{HEALTH_LABELS.appointments}</h1>
                <p className="text-xs text-gray-500">{filteredAppointments.length} today</p>
              </div>
            </div>
          </div>
          <Button onClick={() => router.push('/health/appointments/new')} data-testid="book-appointment-btn">
            <Plus className="w-4 h-4 mr-2" />
            Book Appointment
          </Button>
        </div>
      </header>

      <div className="p-6 space-y-4">
        {/* Date & Filter */}
        <div className="bg-white rounded-lg border p-4 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" onClick={() => changeDate(-1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm"
            />
            <Button variant="outline" size="icon" onClick={() => changeDate(1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Doctors" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Doctors</SelectItem>
              <SelectItem value="d1">Dr. Olumide Adeyemi</SelectItem>
              <SelectItem value="d2">Dr. Ngozi Onyekachi</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Appointments List */}
        <div className="bg-white rounded-lg border overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="text-center p-12">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No appointments</h3>
              <p className="text-gray-500 mb-4">No appointments scheduled for this day</p>
              <Button onClick={() => router.push('/health/appointments/new')}>
                <Plus className="w-4 h-4 mr-2" />
                Book Appointment
              </Button>
            </div>
          ) : (
            <div className="divide-y" data-testid="appointments-list">
              {filteredAppointments.sort((a, b) => a.startTime.localeCompare(b.startTime)).map((appointment) => (
                <div key={appointment.id} className="p-4 hover:bg-gray-50 cursor-pointer flex items-center justify-between"
                     onClick={() => router.push(`/health/appointments/${appointment.id}`)}>
                  <div className="flex items-center gap-4">
                    <div className="text-center min-w-[60px]">
                      <p className="text-lg font-bold text-gray-900">{appointment.startTime}</p>
                      <p className="text-xs text-gray-500">{APPOINTMENT_TYPES[appointment.type]?.duration || 30} min</p>
                    </div>
                    <div className="w-1 h-12 rounded-full bg-cyan-500"></div>
                    <div>
                      <p className="font-medium text-gray-900">{appointment.patientName}</p>
                      <p className="text-sm text-gray-500">{APPOINTMENT_TYPES[appointment.type]?.name} • {appointment.doctorName}</p>
                      {appointment.reason && <p className="text-xs text-gray-400">{appointment.reason}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${getStatusColor(appointment.status)}`}>
                      {getStatusIcon(appointment.status)}
                      {APPOINTMENT_STATUS[appointment.status]?.name}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
