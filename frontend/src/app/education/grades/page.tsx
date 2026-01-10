'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import {
  BookOpen,
  ChevronLeft,
  Save,
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
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
import { EDUCATION_LABELS, ASSESSMENT_TYPES, getGradeFromScore } from '@/lib/education/config';

interface Student {
  id: string;
  name: string;
  rollNumber: string;
  score: number | null;
  remarks: string;
}

interface ClassOption {
  id: string;
  name: string;
}

interface SubjectOption {
  code: string;
  name: string;
}

export default function GradesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedAssessment, setSelectedAssessment] = useState<string>('EXAM');
  const [maxScore, setMaxScore] = useState<string>('100');
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchSubjects();
    }
  }, [selectedClass]);

  useEffect(() => {
    if (selectedClass && selectedSubject) {
      fetchStudentsForGrading();
    }
  }, [selectedClass, selectedSubject, selectedAssessment]);

  const fetchClasses = async () => {
    setClasses([
      { id: 'class_1', name: 'JSS 1' },
      { id: 'class_2', name: 'JSS 2' },
      { id: 'class_3', name: 'JSS 3' },
      { id: 'class_4', name: 'SS 1' },
      { id: 'class_5', name: 'SS 2' },
      { id: 'class_6', name: 'SS 3' },
    ]);
  };

  const fetchSubjects = async () => {
    setSubjects([
      { code: 'ENG', name: 'English Language' },
      { code: 'MATH', name: 'Mathematics' },
      { code: 'SCI', name: 'Basic Science' },
      { code: 'SST', name: 'Social Studies' },
      { code: 'PHY', name: 'Physics' },
      { code: 'CHEM', name: 'Chemistry' },
      { code: 'BIO', name: 'Biology' },
    ]);
  };

  const fetchStudentsForGrading = async () => {
    setLoading(true);
    // Simulated data
    setStudents([
      { id: 'std_1', name: 'Adaeze Okonkwo', rollNumber: '01', score: null, remarks: '' },
      { id: 'std_2', name: 'Chibuzo Eze', rollNumber: '02', score: null, remarks: '' },
      { id: 'std_3', name: 'Emeka Nwosu', rollNumber: '03', score: null, remarks: '' },
      { id: 'std_4', name: 'Fatima Ibrahim', rollNumber: '04', score: null, remarks: '' },
      { id: 'std_5', name: 'Godwin Adeleke', rollNumber: '05', score: null, remarks: '' },
      { id: 'std_6', name: 'Helen Obi', rollNumber: '06', score: null, remarks: '' },
      { id: 'std_7', name: 'Ibrahim Musa', rollNumber: '07', score: null, remarks: '' },
      { id: 'std_8', name: 'Janet Akpan', rollNumber: '08', score: null, remarks: '' },
    ]);
    setLoading(false);
  };

  const handleScoreChange = (studentId: string, score: string) => {
    setStudents(prev => prev.map((s: any) => 
      s.id === studentId ? { ...s, score: score === '' ? null : parseFloat(score) } : s
    ));
    setHasUnsavedChanges(true);
  };

  const handleRemarksChange = (studentId: string, remarks: string) => {
    setStudents(prev => prev.map((s: any) => 
      s.id === studentId ? { ...s, remarks } : s
    ));
    setHasUnsavedChanges(true);
  };

  const handleSaveGrades = async () => {
    setSaving(true);
    // In production: call API to save grades
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSaving(false);
    setHasUnsavedChanges(false);
    alert('Grades saved successfully!');
  };

  const getGradeDisplay = (score: number | null) => {
    if (score === null) return { letter: '-', color: 'text-gray-400' };
    const result = getGradeFromScore(score);
    const color = score >= 70 ? 'text-green-600' : score >= 50 ? 'text-yellow-600' : 'text-red-600';
    return { letter: result.letter, color };
  };

  const getEnteredCount = () => students.filter((s: any) => s.score !== null).length;
  const getAverageScore = () => {
    const scores = students.filter((s: any) => s.score !== null).map((s: any) => s.score as number);
    if (scores.length === 0) return 0;
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  };

  return (
    <div className="min-h-screen bg-gray-50" data-testid="grades-page">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/education/admin')}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="bg-green-100 p-2 rounded-lg">
                <BookOpen className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Grade Entry</h1>
                <p className="text-xs text-gray-500">Record student {EDUCATION_LABELS.grades}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasUnsavedChanges && (
              <span className="text-sm text-orange-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                Unsaved changes
              </span>
            )}
            <Button 
              onClick={handleSaveGrades} 
              disabled={!hasUnsavedChanges || saving}
              data-testid="save-grades-btn"
            >
              {saving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Grades
            </Button>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Selection Filters */}
        <div className="bg-white rounded-lg border p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject} disabled={!selectedClass}>
                <SelectTrigger data-testid="subject-select">
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map(subj => (
                    <SelectItem key={subj.code} value={subj.code}>{subj.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assessment Type</label>
              <Select value={selectedAssessment} onValueChange={setSelectedAssessment}>
                <SelectTrigger data-testid="assessment-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ASSESSMENT_TYPES).map(([key, value]) => (
                    <SelectItem key={key} value={key}>{value.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Score</label>
              <Input 
                type="number" 
                value={maxScore} 
                onChange={(e) => setMaxScore(e.target.value)}
                placeholder="100"
                data-testid="max-score-input"
              />
            </div>
          </div>
        </div>

        {/* Stats */}
        {students.length > 0 && (
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-lg border p-4">
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <Users className="w-4 h-4" />
                <span className="text-sm">Total Students</span>
              </div>
              <p className="text-2xl font-bold">{students.length}</p>
            </div>
            <div className="bg-white rounded-lg border p-4">
              <div className="flex items-center gap-2 text-green-600 mb-1">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">Grades Entered</span>
              </div>
              <p className="text-2xl font-bold">{getEnteredCount()} / {students.length}</p>
            </div>
            <div className="bg-white rounded-lg border p-4">
              <div className="flex items-center gap-2 text-blue-600 mb-1">
                <BookOpen className="w-4 h-4" />
                <span className="text-sm">Class Average</span>
              </div>
              <p className="text-2xl font-bold">{getAverageScore()}%</p>
            </div>
          </div>
        )}

        {/* Grade Entry Table */}
        {!selectedClass || !selectedSubject ? (
          <div className="bg-white rounded-lg border p-12 text-center">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">Select Class and Subject</h3>
            <p className="text-gray-500">Choose a class and subject to begin entering grades</p>
          </div>
        ) : loading ? (
          <div className="bg-white rounded-lg border p-12 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          </div>
        ) : (
          <div className="bg-white rounded-lg border overflow-hidden">
            <table className="w-full" data-testid="grades-table">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-4 text-sm font-medium text-gray-600 w-12">#</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Student Name</th>
                  <th className="text-center p-4 text-sm font-medium text-gray-600 w-32">Score</th>
                  <th className="text-center p-4 text-sm font-medium text-gray-600 w-20">Grade</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {students.map((student, index) => {
                  const gradeDisplay = getGradeDisplay(student.score);
                  return (
                    <tr key={student.id} className="hover:bg-gray-50" data-testid={`grade-row-${student.id}`}>
                      <td className="p-4 text-sm text-gray-500">{student.rollNumber}</td>
                      <td className="p-4">
                        <p className="font-medium text-gray-900">{student.name}</p>
                      </td>
                      <td className="p-4">
                        <Input
                          type="number"
                          min="0"
                          max={maxScore}
                          value={student.score ?? ''}
                          onChange={(e) => handleScoreChange(student.id, e.target.value)}
                          placeholder="0"
                          className="w-24 text-center mx-auto"
                          data-testid={`score-input-${student.id}`}
                        />
                      </td>
                      <td className="p-4 text-center">
                        <span className={`font-bold text-lg ${gradeDisplay.color}`}>
                          {gradeDisplay.letter}
                        </span>
                      </td>
                      <td className="p-4">
                        <Input
                          value={student.remarks}
                          onChange={(e) => handleRemarksChange(student.id, e.target.value)}
                          placeholder="Add remarks..."
                          className="w-full"
                          data-testid={`remarks-input-${student.id}`}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Legend */}
        <div className="bg-white rounded-lg border p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Grade Scale (WAEC)</h4>
          <div className="flex flex-wrap gap-4 text-sm">
            <span className="text-green-600">A1 (75-100) • Excellent</span>
            <span className="text-green-600">B2-B3 (65-74) • Very Good</span>
            <span className="text-yellow-600">C4-C6 (50-64) • Credit</span>
            <span className="text-orange-600">D7-E8 (40-49) • Pass</span>
            <span className="text-red-600">F9 (0-39) • Fail</span>
          </div>
        </div>
      </div>
    </div>
  );
}
