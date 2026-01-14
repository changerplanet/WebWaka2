'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

interface StudentProfile {
  id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  dateOfBirth: string | null;
  gender: string | null;
  photoUrl: string | null;
  status: string;
  admissionDate: string | null;
  currentClass: {
    id: string;
    name: string;
    section: string | null;
  } | null;
  guardians: Array<{
    id: string;
    fullName: string;
    relation: string;
    phone: string | null;
    isPrimary: boolean;
  }>;
}

interface AttendanceSummary {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  attendancePercentage: number;
}

interface FeeSummary {
  totalFees: number;
  totalPaid: number;
  balance: number;
  currency: string;
}

interface ResultRecord {
  id: string;
  term: string;
  session: string;
  subject: string;
  caScore: number | null;
  examScore: number | null;
  totalScore: number | null;
  grade: string | null;
  remark: string | null;
}

interface StudentClass {
  id: string;
  name: string;
  section: string | null;
  classTeacher: string | null;
  subjects: Array<{
    id: string;
    name: string;
    code: string | null;
    teacher: string | null;
  }>;
}

export default function EducationPortalPage() {
  const searchParams = useSearchParams();
  const studentId = searchParams.get('studentId');
  
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [attendance, setAttendance] = useState<AttendanceSummary | null>(null);
  const [fees, setFees] = useState<FeeSummary | null>(null);
  const [results, setResults] = useState<ResultRecord[]>([]);
  const [classes, setClasses] = useState<StudentClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'classes' | 'attendance' | 'results' | 'fees'>('overview');

  useEffect(() => {
    if (studentId) {
      fetchData();
    }
  }, [studentId]);

  async function fetchData() {
    setLoading(true);
    try {
      const [profileRes, attendanceRes, feesRes, resultsRes, classesRes] = await Promise.all([
        fetch(`/api/portal/education/profile?studentId=${studentId}`),
        fetch(`/api/portal/education/attendance?studentId=${studentId}`),
        fetch(`/api/portal/education/fees?studentId=${studentId}`),
        fetch(`/api/portal/education/results?studentId=${studentId}`),
        fetch(`/api/portal/education/classes?studentId=${studentId}`),
      ]);

      if (profileRes.ok) {
        const { data } = await profileRes.json();
        setProfile(data);
      }
      if (attendanceRes.ok) {
        const { data } = await attendanceRes.json();
        setAttendance(data.summary);
      }
      if (feesRes.ok) {
        const { data } = await feesRes.json();
        setFees(data);
      }
      if (resultsRes.ok) {
        const { data } = await resultsRes.json();
        setResults(data);
      }
      if (classesRes.ok) {
        const { data } = await classesRes.json();
        setClasses(data);
      }
    } catch (error) {
      console.error('Error fetching portal data:', error);
    } finally {
      setLoading(false);
    }
  }

  const formatCurrency = (amount: number, currency: string = 'NGN') => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  if (!studentId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Student Portal</h1>
          <p className="text-gray-600">No student selected. Please access this page with a valid student link.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Student Not Found</h1>
          <p className="text-gray-600">Unable to find the student record.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20">
      <header className="bg-green-600 text-white p-4 sticky top-0 z-10">
        <div className="max-w-lg mx-auto">
          <h1 className="text-lg font-semibold">Student Portal</h1>
          <p className="text-green-100 text-sm">{profile.fullName}</p>
        </div>
      </header>

      <div className="max-w-lg mx-auto p-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-2xl font-semibold text-green-600">
                {profile.firstName.charAt(0)}{profile.lastName.charAt(0)}
              </span>
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">{profile.fullName}</h2>
              <p className="text-sm text-gray-500">ID: {profile.studentId}</p>
              {profile.currentClass && (
                <p className="text-sm text-gray-500">
                  {profile.currentClass.name}
                  {profile.currentClass.section && ` (${profile.currentClass.section})`}
                </p>
              )}
            </div>
          </div>
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <p className="text-sm text-gray-500">Attendance</p>
                <p className="text-2xl font-semibold text-green-600">
                  {attendance?.attendancePercentage ?? 0}%
                </p>
                <p className="text-xs text-gray-400">
                  {attendance?.presentDays ?? 0}/{attendance?.totalDays ?? 0} days
                </p>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <p className="text-sm text-gray-500">Fee Balance</p>
                <p className="text-2xl font-semibold text-orange-600">
                  {fees ? formatCurrency(fees.balance) : '-'}
                </p>
                <p className="text-xs text-gray-400">Outstanding</p>
              </div>
            </div>

            {classes.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <h3 className="font-medium text-gray-900 mb-3">Classes & Subjects</h3>
                <div className="space-y-3">
                  {classes.slice(0, 2).map((cls) => (
                    <div key={cls.id} className="py-2 border-b border-gray-50 last:border-0">
                      <div className="flex justify-between items-center">
                        <p className="text-sm font-medium text-gray-900">{cls.name}</p>
                        {cls.classTeacher && (
                          <p className="text-xs text-gray-500">{cls.classTeacher}</p>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {cls.subjects.length} subjects
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {results.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <h3 className="font-medium text-gray-900 mb-3">Recent Results</h3>
                <div className="space-y-2">
                  {results.slice(0, 5).map((result) => (
                    <div key={result.id} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{result.subject}</p>
                        <p className="text-xs text-gray-500">{result.term} - {result.session}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">{result.totalScore}%</p>
                        <p className="text-xs text-gray-500">{result.grade}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {profile.guardians.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <h3 className="font-medium text-gray-900 mb-3">Guardians</h3>
                <div className="space-y-2">
                  {profile.guardians.map((guardian) => (
                    <div key={guardian.id} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{guardian.fullName}</p>
                        <p className="text-xs text-gray-500">{guardian.relation}</p>
                      </div>
                      {guardian.phone && (
                        <a href={`tel:${guardian.phone}`} className="text-sm text-green-600">
                          {guardian.phone}
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'classes' && (
          <div className="space-y-4">
            {classes.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
                <p className="text-gray-500">No class enrollment found</p>
              </div>
            ) : (
              classes.map((cls) => (
                <div key={cls.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-4 border-b border-gray-100 bg-green-50">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium text-gray-900">{cls.name}</h3>
                        {cls.section && (
                          <p className="text-sm text-gray-500">Section: {cls.section}</p>
                        )}
                      </div>
                      {cls.classTeacher && (
                        <p className="text-sm text-gray-600">{cls.classTeacher}</p>
                      )}
                    </div>
                  </div>
                  <div className="p-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Subjects</h4>
                    <div className="space-y-2">
                      {cls.subjects.map((subject) => (
                        <div key={subject.id} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{subject.name}</p>
                            {subject.code && (
                              <p className="text-xs text-gray-500">{subject.code}</p>
                            )}
                          </div>
                          {subject.teacher && (
                            <p className="text-sm text-gray-600">{subject.teacher}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'attendance' && attendance && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <h3 className="font-medium text-gray-900 mb-4">Attendance Summary</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-2xl font-semibold text-green-600">{attendance.presentDays}</p>
                  <p className="text-sm text-gray-600">Present</p>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <p className="text-2xl font-semibold text-red-600">{attendance.absentDays}</p>
                  <p className="text-sm text-gray-600">Absent</p>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <p className="text-2xl font-semibold text-yellow-600">{attendance.lateDays}</p>
                  <p className="text-sm text-gray-600">Late</p>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-semibold text-blue-600">{attendance.totalDays}</p>
                  <p className="text-sm text-gray-600">Total Days</p>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Overall Attendance</span>
                  <span className="font-medium">{attendance.attendancePercentage}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 rounded-full transition-all"
                    style={{ width: `${attendance.attendancePercentage}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'results' && (
          <div className="space-y-4">
            {results.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
                <p className="text-gray-500">No results available</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                  <h3 className="font-medium text-gray-900">Academic Results</h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {results.map((result) => (
                    <div key={result.id} className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">{result.subject}</p>
                          <p className="text-sm text-gray-500">{result.term} - {result.session}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-lg text-gray-900">{result.grade || '-'}</p>
                        </div>
                      </div>
                      <div className="mt-2 flex gap-4 text-sm">
                        <span className="text-gray-500">CA: <span className="text-gray-900">{result.caScore ?? '-'}</span></span>
                        <span className="text-gray-500">Exam: <span className="text-gray-900">{result.examScore ?? '-'}</span></span>
                        <span className="text-gray-500">Total: <span className="font-medium text-gray-900">{result.totalScore ?? '-'}</span></span>
                      </div>
                      {result.remark && (
                        <p className="mt-2 text-sm text-gray-600 italic">{result.remark}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'fees' && fees && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <h3 className="font-medium text-gray-900 mb-4">Fee Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Total Fees</span>
                  <span className="font-medium">{formatCurrency(fees.totalFees, fees.currency)}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Total Paid</span>
                  <span className="font-medium text-green-600">{formatCurrency(fees.totalPaid, fees.currency)}</span>
                </div>
                <div className="flex justify-between py-2 border-t border-gray-200">
                  <span className="font-medium text-gray-900">Balance</span>
                  <span className={`font-semibold ${fees.balance > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                    {formatCurrency(fees.balance, fees.currency)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="max-w-lg mx-auto flex">
          {[
            { key: 'overview', label: 'Overview', icon: 'H' },
            { key: 'classes', label: 'Classes', icon: 'C' },
            { key: 'attendance', label: 'Attend', icon: 'A' },
            { key: 'results', label: 'Results', icon: 'R' },
            { key: 'fees', label: 'Fees', icon: 'F' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`flex-1 py-3 text-center ${
                activeTab === tab.key 
                  ? 'text-green-600 border-t-2 border-green-600' 
                  : 'text-gray-500'
              }`}
            >
              <span className="text-lg font-medium">{tab.icon}</span>
              <p className="text-xs mt-1">{tab.label}</p>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
