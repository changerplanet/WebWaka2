'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import {
  DollarSign,
  ChevronLeft,
  Plus,
  Search,
  Filter,
  AlertCircle,
  CheckCircle,
  Clock,
  Download,
  CreditCard,
  Receipt,
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

interface FeeDefaulter {
  id: string;
  studentName: string;
  className: string;
  admissionNumber: string;
  totalDue: number;
  amountPaid: number;
  balance: number;
  lastPaymentDate: string | null;
  status: 'PENDING' | 'PARTIAL' | 'OVERDUE';
}

interface FeeSummary {
  totalExpected: number;
  totalCollected: number;
  totalOutstanding: number;
  collectionRate: number;
  studentsFullyPaid: number;
  studentsPartialPaid: number;
  studentsUnpaid: number;
}

export default function FeesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [defaulters, setDefaulters] = useState<FeeDefaulter[]>([]);
  const [summary, setSummary] = useState<FeeSummary | null>(null);

  useEffect(() => {
    fetchFeeData();
  }, [selectedClass, selectedStatus]);

  const fetchFeeData = async () => {
    setLoading(true);
    // Simulated data
    setSummary({
      totalExpected: 45000000,
      totalCollected: 38250000,
      totalOutstanding: 6750000,
      collectionRate: 85,
      studentsFullyPaid: 320,
      studentsPartialPaid: 85,
      studentsUnpaid: 45,
    });

    setDefaulters([
      {
        id: 'def_1',
        studentName: 'Adaeze Okonkwo',
        className: 'JSS 1A',
        admissionNumber: 'STU/2025/0001',
        totalDue: 150000,
        amountPaid: 100000,
        balance: 50000,
        lastPaymentDate: '2025-10-15',
        status: 'PARTIAL',
      },
      {
        id: 'def_2',
        studentName: 'Chibuzo Eze',
        className: 'SS 2 Science',
        admissionNumber: 'STU/2023/0045',
        totalDue: 180000,
        amountPaid: 0,
        balance: 180000,
        lastPaymentDate: null,
        status: 'PENDING',
      },
      {
        id: 'def_3',
        studentName: 'Fatima Ibrahim',
        className: 'SS 3 Arts',
        admissionNumber: 'STU/2022/0089',
        totalDue: 200000,
        amountPaid: 50000,
        balance: 150000,
        lastPaymentDate: '2025-09-01',
        status: 'OVERDUE',
      },
      {
        id: 'def_4',
        studentName: 'Godwin Adeleke',
        className: 'JSS 3B',
        admissionNumber: 'STU/2024/0067',
        totalDue: 120000,
        amountPaid: 80000,
        balance: 40000,
        lastPaymentDate: '2025-11-20',
        status: 'PARTIAL',
      },
    ]);
    setLoading(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PARTIAL': return 'bg-yellow-100 text-yellow-800';
      case 'PENDING': return 'bg-gray-100 text-gray-800';
      case 'OVERDUE': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PARTIAL': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'PENDING': return <AlertCircle className="w-4 h-4 text-gray-600" />;
      case 'OVERDUE': return <AlertCircle className="w-4 h-4 text-red-600" />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50" data-testid="fees-page">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/education/admin')}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="bg-emerald-100 p-2 rounded-lg">
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">{EDUCATION_LABELS.fees} Management</h1>
                <p className="text-xs text-gray-500">Track and collect school fees</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
            <Button onClick={() => router.push('/education/fees/collect')} data-testid="collect-fee-btn">
              <CreditCard className="w-4 h-4 mr-2" />
              Collect Fee
            </Button>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Summary Stats */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg border p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Receipt className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.totalExpected)}</p>
              <p className="text-sm text-gray-500">Total Expected</p>
            </div>

            <div className="bg-white rounded-lg border p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="bg-green-100 p-2 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  summary.collectionRate >= 90 ? 'bg-green-100 text-green-700' : 
                  summary.collectionRate >= 75 ? 'bg-yellow-100 text-yellow-700' : 
                  'bg-red-100 text-red-700'
                }`}>
                  {summary.collectionRate}%
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.totalCollected)}</p>
              <p className="text-sm text-gray-500">Total Collected</p>
            </div>

            <div className="bg-white rounded-lg border p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="bg-red-100 p-2 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.totalOutstanding)}</p>
              <p className="text-sm text-gray-500">Outstanding</p>
            </div>

            <div className="bg-white rounded-lg border p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
              </div>
              <div className="flex gap-3 text-sm">
                <div>
                  <p className="text-lg font-bold text-green-600">{summary.studentsFullyPaid}</p>
                  <p className="text-xs text-gray-500">Paid</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-yellow-600">{summary.studentsPartialPaid}</p>
                  <p className="text-xs text-gray-500">Partial</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-red-600">{summary.studentsUnpaid}</p>
                  <p className="text-xs text-gray-500">Unpaid</p>
                </div>
              </div>
            </div>
          </div>
        )}

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
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                <SelectItem value="jss1">JSS 1</SelectItem>
                <SelectItem value="jss2">JSS 2</SelectItem>
                <SelectItem value="jss3">JSS 3</SelectItem>
                <SelectItem value="ss1">SS 1</SelectItem>
                <SelectItem value="ss2">SS 2</SelectItem>
                <SelectItem value="ss3">SS 3</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="PARTIAL">Partial</SelectItem>
                <SelectItem value="OVERDUE">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Defaulters List */}
        <div className="bg-white rounded-lg border">
          <div className="p-4 border-b">
            <h3 className="font-semibold">Outstanding Payments</h3>
            <p className="text-sm text-gray-500">Students with pending fee balances</p>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            </div>
          ) : defaulters.length === 0 ? (
            <div className="text-center p-12">
              <CheckCircle className="w-12 h-12 text-green-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">All fees collected!</h3>
              <p className="text-gray-500">No outstanding payments at this time</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full" data-testid="defaulters-table">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left p-4 text-sm font-medium text-gray-600">Student</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-600">Class</th>
                    <th className="text-right p-4 text-sm font-medium text-gray-600">Total Due</th>
                    <th className="text-right p-4 text-sm font-medium text-gray-600">Paid</th>
                    <th className="text-right p-4 text-sm font-medium text-gray-600">Balance</th>
                    <th className="text-center p-4 text-sm font-medium text-gray-600">Status</th>
                    <th className="w-20"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {defaulters.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="p-4">
                        <p className="font-medium text-gray-900">{student.studentName}</p>
                        <p className="text-xs text-gray-500">{student.admissionNumber}</p>
                      </td>
                      <td className="p-4 text-sm">{student.className}</td>
                      <td className="p-4 text-right font-medium">{formatCurrency(student.totalDue)}</td>
                      <td className="p-4 text-right text-green-600">{formatCurrency(student.amountPaid)}</td>
                      <td className="p-4 text-right font-bold text-red-600">{formatCurrency(student.balance)}</td>
                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${getStatusColor(student.status)}`}>
                          {getStatusIcon(student.status)}
                          {student.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => router.push(`/education/fees/collect?student=${student.id}`)}
                        >
                          Collect
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button 
            variant="outline" 
            className="h-auto py-4 flex-col"
            onClick={() => router.push('/education/fees/structures')}
          >
            <Receipt className="w-6 h-6 mb-2" />
            <span>Fee Structures</span>
          </Button>
          <Button 
            variant="outline" 
            className="h-auto py-4 flex-col"
            onClick={() => router.push('/education/fees/invoices')}
          >
            <DollarSign className="w-6 h-6 mb-2" />
            <span>Generate Invoices</span>
          </Button>
          <Button 
            variant="outline" 
            className="h-auto py-4 flex-col"
            onClick={() => router.push('/education/fees/payments')}
          >
            <CreditCard className="w-6 h-6 mb-2" />
            <span>Payment History</span>
          </Button>
          <Button 
            variant="outline" 
            className="h-auto py-4 flex-col"
            onClick={() => router.push('/education/fees/reports')}
          >
            <Download className="w-6 h-6 mb-2" />
            <span>Reports</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
