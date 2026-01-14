'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

interface PatientProfile {
  id: string;
  mrn: string;
  firstName: string;
  lastName: string;
  fullName: string;
  dateOfBirth: string | null;
  gender: string | null;
  bloodGroup: string;
  genotype: string;
  phone: string | null;
  email: string | null;
  status: string;
  allergies: string[];
  conditions: string[];
}

interface AppointmentRecord {
  id: string;
  appointmentDate: string;
  appointmentTime: string | null;
  type: string;
  status: string;
  provider: string | null;
  facility: string | null;
  reason: string | null;
  duration: number;
}

interface PrescriptionRecord {
  id: string;
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number | null;
  route: string | null;
  instructions: string | null;
  prescribedAt: string;
  prescriberName: string;
  status: string;
  expiresAt: string | null;
}

interface VisitSummary {
  id: string;
  visitNumber: string;
  visitDate: string;
  chiefComplaint: string | null;
  provider: string | null;
  facility: string | null;
  status: string;
  diagnoses: Array<{
    code: string | null;
    description: string;
    type: string;
  }>;
}

interface BillingSummary {
  totalBilled: number;
  currency: string;
  recentBills: Array<{
    id: string;
    serviceDate: string;
    description: string;
    amount: number;
    status: string;
  }>;
}

export default function HealthPortalPage() {
  const searchParams = useSearchParams();
  const patientId = searchParams.get('patientId');
  
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [prescriptions, setPrescriptions] = useState<PrescriptionRecord[]>([]);
  const [visits, setVisits] = useState<VisitSummary[]>([]);
  const [billing, setBilling] = useState<BillingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'appointments' | 'prescriptions' | 'visits' | 'billing'>('overview');

  useEffect(() => {
    if (patientId) {
      fetchData();
    }
  }, [patientId]);

  async function fetchData() {
    setLoading(true);
    try {
      const [profileRes, appointmentsRes, prescriptionsRes, visitsRes, billingRes] = await Promise.all([
        fetch(`/api/portal/health/profile?patientId=${patientId}`),
        fetch(`/api/portal/health/appointments?patientId=${patientId}`),
        fetch(`/api/portal/health/prescriptions?patientId=${patientId}`),
        fetch(`/api/portal/health/visits?patientId=${patientId}`),
        fetch(`/api/portal/health/billing?patientId=${patientId}`),
      ]);

      if (profileRes.ok) {
        const { data } = await profileRes.json();
        setProfile(data);
      }
      if (appointmentsRes.ok) {
        const { data } = await appointmentsRes.json();
        setAppointments(data);
      }
      if (prescriptionsRes.ok) {
        const { data } = await prescriptionsRes.json();
        setPrescriptions(data);
      }
      if (visitsRes.ok) {
        const { data } = await visitsRes.json();
        setVisits(data);
      }
      if (billingRes.ok) {
        const { data } = await billingRes.json();
        setBilling(data);
      }
    } catch (error) {
      console.error('Error fetching portal data:', error);
    } finally {
      setLoading(false);
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number, currency: string = 'NGN') => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'SCHEDULED':
      case 'CONFIRMED':
        return 'bg-blue-100 text-blue-800';
      case 'COMPLETED':
      case 'PAID':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'EXPIRED':
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  if (!patientId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Patient Portal</h1>
          <p className="text-gray-600">No patient selected. Please access this page with a valid patient link.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Patient Not Found</h1>
          <p className="text-gray-600">Unable to find the patient record.</p>
        </div>
      </div>
    );
  }

  const upcomingAppointments = appointments.filter(
    apt => new Date(apt.appointmentDate) >= new Date() && apt.status !== 'CANCELLED'
  );
  const activePrescriptions = prescriptions.filter(rx => rx.status === 'ACTIVE');

  return (
    <div className="pb-20">
      <header className="bg-blue-600 text-white p-4 sticky top-0 z-10">
        <div className="max-w-lg mx-auto">
          <h1 className="text-lg font-semibold">Patient Portal</h1>
          <p className="text-blue-100 text-sm">{profile.fullName}</p>
        </div>
      </header>

      <div className="max-w-lg mx-auto p-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-2xl font-semibold text-blue-600">
                {profile.firstName.charAt(0)}{profile.lastName.charAt(0)}
              </span>
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-gray-900">{profile.fullName}</h2>
              <p className="text-sm text-gray-500">MRN: {profile.mrn}</p>
              <div className="flex gap-2 mt-1">
                {profile.bloodGroup && (
                  <span className="text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded">
                    Blood: {profile.bloodGroup}
                  </span>
                )}
                {profile.genotype && (
                  <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded">
                    {profile.genotype}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <p className="text-sm text-gray-500">Upcoming</p>
                <p className="text-2xl font-semibold text-blue-600">{upcomingAppointments.length}</p>
                <p className="text-xs text-gray-400">Appointments</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <p className="text-sm text-gray-500">Active</p>
                <p className="text-2xl font-semibold text-green-600">{activePrescriptions.length}</p>
                <p className="text-xs text-gray-400">Prescriptions</p>
              </div>
            </div>

            {profile.allergies.length > 0 && (
              <div className="bg-red-50 rounded-xl p-4">
                <h3 className="font-medium text-red-800 mb-2">Allergies</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.allergies.map((allergy, idx) => (
                    <span key={idx} className="bg-red-100 text-red-700 text-sm px-2 py-1 rounded">
                      {allergy}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {profile.conditions.length > 0 && (
              <div className="bg-yellow-50 rounded-xl p-4">
                <h3 className="font-medium text-yellow-800 mb-2">Conditions</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.conditions.map((condition, idx) => (
                    <span key={idx} className="bg-yellow-100 text-yellow-700 text-sm px-2 py-1 rounded">
                      {condition}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {upcomingAppointments.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <h3 className="font-medium text-gray-900 mb-3">Upcoming Appointments</h3>
                <div className="space-y-3">
                  {upcomingAppointments.slice(0, 3).map((apt) => (
                    <div key={apt.id} className="flex justify-between items-start py-2 border-b border-gray-50 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{apt.type}</p>
                        <p className="text-xs text-gray-500">
                          {formatDate(apt.appointmentDate)}
                          {apt.appointmentTime && ` at ${apt.appointmentTime}`}
                        </p>
                        {apt.provider && (
                          <p className="text-xs text-gray-500">{apt.provider}</p>
                        )}
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${getStatusColor(apt.status)}`}>
                        {apt.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {billing && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <h3 className="font-medium text-gray-900 mb-3">Billing Summary</h3>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Billed</span>
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(billing.totalBilled, billing.currency)}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'appointments' && (
          <div className="space-y-4">
            {appointments.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
                <p className="text-gray-500">No appointments found</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                  <h3 className="font-medium text-gray-900">All Appointments</h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {appointments.map((apt) => (
                    <div key={apt.id} className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">{apt.type}</p>
                          <p className="text-sm text-gray-500">
                            {formatDate(apt.appointmentDate)}
                            {apt.appointmentTime && ` at ${apt.appointmentTime}`}
                          </p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded ${getStatusColor(apt.status)}`}>
                          {apt.status}
                        </span>
                      </div>
                      {apt.provider && (
                        <p className="text-sm text-gray-600 mt-1">{apt.provider}</p>
                      )}
                      {apt.facility && (
                        <p className="text-sm text-gray-500">{apt.facility}</p>
                      )}
                      {apt.reason && (
                        <p className="text-sm text-gray-600 mt-2">{apt.reason}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'prescriptions' && (
          <div className="space-y-4">
            {prescriptions.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
                <p className="text-gray-500">No prescriptions found</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                  <h3 className="font-medium text-gray-900">Prescriptions</h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {prescriptions.map((rx) => (
                    <div key={rx.id} className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">{rx.medication}</p>
                          <p className="text-sm text-gray-600">{rx.dosage}</p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded ${getStatusColor(rx.status)}`}>
                          {rx.status}
                        </span>
                      </div>
                      <div className="mt-2 text-sm space-y-1">
                        <p className="text-gray-600"><span className="text-gray-500">Frequency:</span> {rx.frequency}</p>
                        <p className="text-gray-600"><span className="text-gray-500">Duration:</span> {rx.duration}</p>
                        {rx.route && (
                          <p className="text-gray-600"><span className="text-gray-500">Route:</span> {rx.route}</p>
                        )}
                        {rx.instructions && (
                          <p className="text-gray-600 italic">{rx.instructions}</p>
                        )}
                      </div>
                      <div className="mt-2 flex justify-between text-xs text-gray-500">
                        <span>By {rx.prescriberName}</span>
                        <span>{formatDate(rx.prescribedAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'visits' && (
          <div className="space-y-4">
            {visits.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
                <p className="text-gray-500">No visit history found</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                  <h3 className="font-medium text-gray-900">Visit History</h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {visits.map((visit) => (
                    <div key={visit.id} className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">Visit #{visit.visitNumber}</p>
                          <p className="text-sm text-gray-500">{formatDate(visit.visitDate)}</p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded ${getStatusColor(visit.status)}`}>
                          {visit.status}
                        </span>
                      </div>
                      {visit.chiefComplaint && (
                        <p className="text-sm text-gray-600 mt-2">{visit.chiefComplaint}</p>
                      )}
                      {visit.provider && (
                        <p className="text-sm text-gray-500 mt-1">{visit.provider}</p>
                      )}
                      {visit.diagnoses.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-500 mb-1">Diagnoses:</p>
                          <div className="flex flex-wrap gap-1">
                            {visit.diagnoses.map((dx, idx) => (
                              <span key={idx} className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                                {dx.description}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'billing' && (
          <div className="space-y-4">
            {!billing ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
                <p className="text-gray-500">No billing information available</p>
              </div>
            ) : (
              <>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                  <h3 className="font-medium text-gray-900 mb-4">Billing Summary</h3>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600">Total Billed</span>
                    <span className="font-semibold text-xl text-gray-900">
                      {formatCurrency(billing.totalBilled, billing.currency)}
                    </span>
                  </div>
                </div>

                {billing.recentBills.length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b border-gray-100">
                      <h3 className="font-medium text-gray-900">Recent Bills</h3>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {billing.recentBills.map((bill) => (
                        <div key={bill.id} className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-gray-900">{bill.description}</p>
                              <p className="text-sm text-gray-500">{formatDate(bill.serviceDate)}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-gray-900">
                                {formatCurrency(bill.amount, billing.currency)}
                              </p>
                              <span className={`text-xs px-2 py-1 rounded ${getStatusColor(bill.status)}`}>
                                {bill.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="max-w-lg mx-auto flex">
          {[
            { key: 'overview', label: 'Overview', icon: 'H' },
            { key: 'appointments', label: 'Appts', icon: 'A' },
            { key: 'prescriptions', label: 'Rx', icon: 'R' },
            { key: 'visits', label: 'Visits', icon: 'V' },
            { key: 'billing', label: 'Bills', icon: 'B' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`flex-1 py-3 text-center ${
                activeTab === tab.key 
                  ? 'text-blue-600 border-t-2 border-blue-600' 
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
