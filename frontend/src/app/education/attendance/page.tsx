'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Save,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EDUCATION_LABELS, ATTENDANCE_STATUS } from '@/lib/education/config';

interface Student {
  id: string;
  name: string;
  rollNumber: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED' | 'UNMARKED';
}

interface ClassOption {
  id: string;
  name: string;
}

export default function AttendancePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchAttendance();
    }
  }, [selectedClass, selectedDate]);

  const fetchClasses = async () => {
    setClasses([
      { id: 'class_1', name: 'JSS 1A' },
      { id: 'class_2', name: 'JSS 1B' },
      { id: 'class_3', name: 'JSS 2A' },
      { id: 'class_4', name: 'JSS 2B' },
      { id: 'class_5', name: 'SS 1 Science' },
      { id: 'class_6', name: 'SS 1 Arts' },
      { id: 'class_7', name: 'SS 2 Science' },
      { id: 'class_8', name: 'SS 2 Arts' },
    ]);
  };

  const fetchAttendance = async () => {
    setLoading(true);
    // Simulated data
    setStudents([
      { id: 'std_1', name: 'Adaeze Okonkwo', rollNumber: '01', status: 'UNMARKED' },
      { id: 'std_2', name: 'Chibuzo Eze', rollNumber: '02', status: 'UNMARKED' },
      { id: 'std_3', name: 'Emeka Nwosu', rollNumber: '03', status: 'UNMARKED' },
      { id: 'std_4', name: 'Fatima Ibrahim', rollNumber: '04', status: 'UNMARKED' },
      { id: 'std_5', name: 'Godwin Adeleke', rollNumber: '05', status: 'UNMARKED' },
      { id: 'std_6', name: 'Helen Obi', rollNumber: '06', status: 'UNMARKED' },
      { id: 'std_7', name: 'Ibrahim Musa', rollNumber: '07', status: 'UNMARKED' },
      { id: 'std_8', name: 'Janet Akpan', rollNumber: '08', status: 'UNMARKED' },
      { id: 'std_9', name: 'Kelechi Onyeka', rollNumber: '09', status: 'UNMARKED' },
      { id: 'std_10', name: 'Lilian Nnamdi', rollNumber: '10', status: 'UNMARKED' },
    ]);
    setLoading(false);
  };

  const handleStatusChange = (studentId: string, status: Student['status']) => {
    setStudents(prev => prev.map((s: any) => 
      s.id === studentId ? { ...s, status } : s
    ));
    setHasUnsavedChanges(true);
  };

  const handleMarkAll = (status: Student['status']) => {
    setStudents(prev => prev.map((s: any) => ({ ...s, status })));
    setHasUnsavedChanges(true);
  };

  const handleSaveAttendance = async () => {
    setSaving(true);
    // In production: call API to save attendance
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSaving(false);
    setHasUnsavedChanges(false);
    alert('Attendance saved successfully!');
  };

  const changeDate = (days: number) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + days);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const getStatusIcon = (status: Student['status']) => {
    switch (status) {
      case 'PRESENT': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'ABSENT': return <XCircle className="w-5 h-5 text-red-600" />;
      case 'LATE': return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'EXCUSED': return <AlertCircle className="w-5 h-5 text-blue-600" />;
      default: return <div className="w-5 h-5 rounded-full border-2 border-gray-300" />;
    }
  };

  const getStatusColor = (status: Student['status']) => {
    switch (status) {
      case 'PRESENT': return 'bg-green-100 border-green-500 text-green-700';
      case 'ABSENT': return 'bg-red-100 border-red-500 text-red-700';
      case 'LATE': return 'bg-yellow-100 border-yellow-500 text-yellow-700';
      case 'EXCUSED': return 'bg-blue-100 border-blue-500 text-blue-700';
      default: return 'bg-gray-50 border-gray-300 text-gray-500';
    }
  };

  const getStats = () => {
    const present = students.filter((s: any) => s.status === 'PRESENT').length;
    const absent = students.filter((s: any) => s.status === 'ABSENT').length;
    const late = students.filter((s: any) => s.status === 'LATE').length;
    const excused = students.filter((s: any) => s.status === 'EXCUSED').length;
    const unmarked = students.filter((s: any) => s.status === 'UNMARKED').length;
    const rate = students.length > 0 ? Math.round(((present + late) / students.length) * 100) : 0;
    return { present, absent, late, excused, unmarked, rate };
  };

  const stats = getStats();

  return (
    <div className="min-h-screen bg-gray-50" data-testid="attendance-page">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/education/admin')}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="bg-orange-100 p-2 rounded-lg">
                <Calendar className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Attendance</h1>
                <p className="text-xs text-gray-500">Mark daily {EDUCATION_LABELS.students.toLowerCase()} attendance</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasUnsavedChanges && (
              <span className="text-sm text-orange-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                Unsaved
              </span>
            )}
            <Button 
              onClick={handleSaveAttendance} 
              disabled={!hasUnsavedChanges || saving}
              data-testid="save-attendance-btn"
            >
              {saving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save
            </Button>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Selection */}
        <div className="bg-white rounded-lg border p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger data-testid="class-select">
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map(cls => (
                    <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" onClick={() => changeDate(-1)}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-2 border rounded-md text-sm"
                  data-testid="date-picker"
                />
                <Button variant="outline" size="icon" onClick={() => changeDate(1)}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        {selectedClass && students.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white rounded-lg border p-4">
              <div className="flex items-center gap-2 text-green-600 mb-1">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">Present</span>
              </div>
              <p className="text-2xl font-bold">{stats.present}</p>
            </div>
            <div className="bg-white rounded-lg border p-4">
              <div className="flex items-center gap-2 text-red-600 mb-1">
                <XCircle className="w-4 h-4" />
                <span className="text-sm">Absent</span>
              </div>
              <p className="text-2xl font-bold">{stats.absent}</p>
            </div>
            <div className="bg-white rounded-lg border p-4">
              <div className="flex items-center gap-2 text-yellow-600 mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-sm">Late</span>
              </div>
              <p className="text-2xl font-bold">{stats.late}</p>
            </div>
            <div className="bg-white rounded-lg border p-4">
              <div className="flex items-center gap-2 text-blue-600 mb-1">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">Excused</span>
              </div>
              <p className="text-2xl font-bold">{stats.excused}</p>
            </div>
            <div className="bg-white rounded-lg border p-4">
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <Users className="w-4 h-4" />
                <span className="text-sm">Rate</span>
              </div>
              <p className={`text-2xl font-bold ${
                stats.rate >= 90 ? 'text-green-600' : 
                stats.rate >= 75 ? 'text-yellow-600' : 
                'text-red-600'
              }`}>{stats.rate}%</p>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        {selectedClass && students.length > 0 && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => handleMarkAll('PRESENT')}>
              Mark All Present
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleMarkAll('ABSENT')}>
              Mark All Absent
            </Button>
          </div>
        )}

        {/* Attendance Grid */}
        {!selectedClass ? (
          <div className="bg-white rounded-lg border p-12 text-center">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">Select a Class</h3>
            <p className="text-gray-500">Choose a class to mark attendance</p>
          </div>
        ) : loading ? (
          <div className="bg-white rounded-lg border p-12 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          </div>
        ) : (
          <div className="bg-white rounded-lg border overflow-hidden">
            <div className="grid gap-2 p-4" data-testid="attendance-grid">
              {students.map((student) => (
                <div 
                  key={student.id} 
                  className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all ${getStatusColor(student.status)}`}
                  data-testid={`attendance-row-${student.id}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium w-8">{student.rollNumber}</span>
                    <span className="font-medium">{student.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'] as const).map((status) => (
                      <button
                        key={status}
                        onClick={() => handleStatusChange(student.id, status)}
                        className={`p-2 rounded-lg transition-all ${
                          student.status === status 
                            ? 'bg-white shadow-sm ring-2 ring-offset-1' 
                            : 'hover:bg-white/50'
                        } ${
                          status === 'PRESENT' ? 'ring-green-500' :
                          status === 'ABSENT' ? 'ring-red-500' :
                          status === 'LATE' ? 'ring-yellow-500' :
                          'ring-blue-500'
                        }`}
                        title={ATTENDANCE_STATUS[status].name}
                        data-testid={`status-btn-${student.id}-${status}`}
                      >
                        {getStatusIcon(status)}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="bg-white rounded-lg border p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Legend</h4>
          <div className="flex flex-wrap gap-4 text-sm">
            <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-600" /> Present</span>
            <span className="flex items-center gap-2"><XCircle className="w-4 h-4 text-red-600" /> Absent</span>
            <span className="flex items-center gap-2"><Clock className="w-4 h-4 text-yellow-600" /> Late</span>
            <span className="flex items-center gap-2"><AlertCircle className="w-4 h-4 text-blue-600" /> Excused</span>
          </div>
        </div>
      </div>
    </div>
  );
}
