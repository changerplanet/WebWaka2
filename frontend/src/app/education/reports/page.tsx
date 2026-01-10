'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import {
  FileText,
  ChevronLeft,
  Download,
  Printer,
  Search,
  Filter,
  Eye,
  CheckCircle,
  Clock,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EDUCATION_LABELS } from '@/lib/education/config';

interface ReportCardStatus {
  studentId: string;
  studentName: string;
  className: string;
  rollNumber: string;
  gradesComplete: boolean;
  remarksAdded: boolean;
  reportGenerated: boolean;
  averageScore?: number;
  position?: number;
}

interface ClassSummary {
  classId: string;
  className: string;
  totalStudents: number;
  gradesComplete: number;
  reportsGenerated: number;
  progress: number;
}

export default function ReportsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [classSummaries, setClassSummaries] = useState<ClassSummary[]>([]);
  const [students, setStudents] = useState<ReportCardStatus[]>([]);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchReportData();
  }, [selectedClass]);

  const fetchReportData = async () => {
    setLoading(true);
    // Simulated data
    setClassSummaries([
      { classId: 'class_1', className: 'JSS 1A', totalStudents: 42, gradesComplete: 38, reportsGenerated: 25, progress: 60 },
      { classId: 'class_2', className: 'JSS 1B', totalStudents: 40, gradesComplete: 40, reportsGenerated: 40, progress: 100 },
      { classId: 'class_3', className: 'JSS 2A', totalStudents: 38, gradesComplete: 30, reportsGenerated: 15, progress: 40 },
      { classId: 'class_4', className: 'SS 1 Science', totalStudents: 35, gradesComplete: 35, reportsGenerated: 35, progress: 100 },
      { classId: 'class_5', className: 'SS 2 Science', totalStudents: 32, gradesComplete: 28, reportsGenerated: 0, progress: 0 },
    ]);

    setStudents([
      { studentId: 'std_1', studentName: 'Adaeze Okonkwo', className: 'JSS 1A', rollNumber: '01', gradesComplete: true, remarksAdded: true, reportGenerated: true, averageScore: 85, position: 2 },
      { studentId: 'std_2', studentName: 'Chibuzo Eze', className: 'JSS 1A', rollNumber: '02', gradesComplete: true, remarksAdded: false, reportGenerated: false, averageScore: 72, position: 8 },
      { studentId: 'std_3', studentName: 'Emeka Nwosu', className: 'JSS 1A', rollNumber: '03', gradesComplete: false, remarksAdded: false, reportGenerated: false },
      { studentId: 'std_4', studentName: 'Fatima Ibrahim', className: 'JSS 1A', rollNumber: '04', gradesComplete: true, remarksAdded: true, reportGenerated: true, averageScore: 91, position: 1 },
      { studentId: 'std_5', studentName: 'Godwin Adeleke', className: 'JSS 1A', rollNumber: '05', gradesComplete: true, remarksAdded: false, reportGenerated: false, averageScore: 65, position: 15 },
    ]);
    setLoading(false);
  };

  const handleGenerateAll = async () => {
    setGenerating(true);
    // In production: call API to generate all report cards
    await new Promise(resolve => setTimeout(resolve, 2000));
    setGenerating(false);
    alert('Report cards generated successfully!');
    fetchReportData();
  };

  const getProgressColor = (progress: number) => {
    if (progress === 100) return 'bg-green-500';
    if (progress >= 50) return 'bg-yellow-500';
    return 'bg-gray-300';
  };

  return (
    <div className="min-h-screen bg-gray-50" data-testid="reports-page">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/education/admin')}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="bg-red-100 p-2 rounded-lg">
                <FileText className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">{EDUCATION_LABELS.reportCards}</h1>
                <p className="text-xs text-gray-500">Generate and manage report cards</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export All
            </Button>
            <Button 
              onClick={handleGenerateAll} 
              disabled={generating}
              data-testid="generate-all-btn"
            >
              {generating ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Printer className="w-4 h-4 mr-2" />
              )}
              Generate All
            </Button>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Class Progress Overview */}
        <div className="bg-white rounded-lg border p-6">
          <h3 className="font-semibold mb-4">Report Card Progress by Class</h3>
          <div className="space-y-4">
            {classSummaries.map((cls) => (
              <div key={cls.classId} className="flex items-center gap-4">
                <div className="w-32 font-medium">{cls.className}</div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${getProgressColor(cls.progress)} transition-all`}
                      style={{ width: `${cls.progress}%` }}
                    />
                  </div>
                </div>
                <div className="w-24 text-right text-sm text-gray-600">
                  {cls.reportsGenerated}/{cls.totalStudents}
                </div>
                <div className="w-16 text-right">
                  <span className={`text-sm font-medium ${
                    cls.progress === 100 ? 'text-green-600' : 
                    cls.progress >= 50 ? 'text-yellow-600' : 
                    'text-gray-400'
                  }`}>
                    {cls.progress}%
                  </span>
                </div>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setSelectedClass(cls.classId)}
                >
                  View
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[250px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search students..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classSummaries.map(cls => (
                  <SelectItem key={cls.classId} value={cls.classId}>{cls.className}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Students Report Status */}
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="p-4 border-b">
            <h3 className="font-semibold">Student Report Cards</h3>
            <p className="text-sm text-gray-500">Individual student report card status</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full" data-testid="reports-table">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left p-4 text-sm font-medium text-gray-600">Student</th>
                    <th className="text-center p-4 text-sm font-medium text-gray-600">Grades</th>
                    <th className="text-center p-4 text-sm font-medium text-gray-600">Remarks</th>
                    <th className="text-center p-4 text-sm font-medium text-gray-600">Report</th>
                    <th className="text-center p-4 text-sm font-medium text-gray-600">Average</th>
                    <th className="text-center p-4 text-sm font-medium text-gray-600">Position</th>
                    <th className="w-32"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {students.map((student) => (
                    <tr key={student.studentId} className="hover:bg-gray-50">
                      <td className="p-4">
                        <p className="font-medium text-gray-900">{student.studentName}</p>
                        <p className="text-xs text-gray-500">{student.className} • Roll #{student.rollNumber}</p>
                      </td>
                      <td className="p-4 text-center">
                        {student.gradesComplete ? (
                          <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                        ) : (
                          <Clock className="w-5 h-5 text-gray-400 mx-auto" />
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {student.remarksAdded ? (
                          <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                        ) : (
                          <Clock className="w-5 h-5 text-gray-400 mx-auto" />
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {student.reportGenerated ? (
                          <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                        ) : (
                          <Clock className="w-5 h-5 text-gray-400 mx-auto" />
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {student.averageScore !== undefined ? (
                          <span className={`font-bold ${
                            student.averageScore >= 70 ? 'text-green-600' :
                            student.averageScore >= 50 ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {student.averageScore}%
                          </span>
                        ) : '-'}
                      </td>
                      <td className="p-4 text-center">
                        {student.position !== undefined ? (
                          <span className={`font-bold ${
                            student.position <= 3 ? 'text-yellow-600' : 'text-gray-700'
                          }`}>
                            #{student.position}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="p-4">
                        <div className="flex gap-1 justify-end">
                          {student.reportGenerated ? (
                            <>
                              <Button size="sm" variant="outline">
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="outline">
                                <Download className="w-4 h-4" />
                              </Button>
                            </>
                          ) : (
                            <Button 
                              size="sm" 
                              disabled={!student.gradesComplete}
                            >
                              Generate
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="bg-white rounded-lg border p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Status Legend</h4>
          <div className="flex flex-wrap gap-4 text-sm">
            <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-600" /> Complete</span>
            <span className="flex items-center gap-2"><Clock className="w-4 h-4 text-gray-400" /> Pending</span>
          </div>
        </div>
      </div>
    </div>
  );
}
