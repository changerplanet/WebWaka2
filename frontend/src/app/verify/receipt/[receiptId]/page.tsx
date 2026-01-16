'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface PublicVerificationResult {
  valid: boolean;
  tampered: boolean;
  revoked: boolean;
  sourceType: string;
  verifiedAt: string;
  receiptNumber?: string;
  businessName?: string;
  grandTotal?: number;
  currency?: string;
  transactionDate?: string;
  isDemo?: boolean;
  syncStatus?: string;
}

export default function VerifyReceiptPage() {
  const params = useParams();
  const receiptId = params.receiptId as string;
  
  const [verification, setVerification] = useState<PublicVerificationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function verifyReceipt() {
      try {
        const response = await fetch(`/api/commerce/receipt/verify/${receiptId}?format=public`);
        if (!response.ok) {
          if (response.status === 404) {
            setError('Unable to verify');
          } else {
            setError('Unable to verify receipt');
          }
          return;
        }
        
        const data = await response.json();
        setVerification(data);
      } catch (err) {
        setError('Unable to verify receipt');
      } finally {
        setLoading(false);
      }
    }
    
    if (receiptId) {
      verifyReceipt();
    }
  }, [receiptId]);
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying receipt...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Verification Failed</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }
  
  if (!verification) {
    return null;
  }
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: verification.currency || 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };
  
  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat('en-NG', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'Africa/Lagos',
    }).format(new Date(dateStr));
  };

  const getHeaderColor = () => {
    if (verification.tampered) return 'bg-orange-600';
    if (verification.revoked) return 'bg-red-600';
    if (verification.valid) return 'bg-green-600';
    return 'bg-red-600';
  };

  const getStatusText = () => {
    if (verification.tampered) return 'Tampered Receipt';
    if (verification.revoked) return 'Revoked Receipt';
    if (verification.valid) return 'Valid Receipt';
    return 'Invalid Receipt';
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg overflow-hidden">
        {verification.isDemo && (
          <div className="bg-yellow-100 border-b border-yellow-400 text-yellow-800 px-4 py-2 text-center text-sm font-semibold">
            DEMO / SAMPLE DOCUMENT
          </div>
        )}
        
        <div className={`px-6 py-4 ${getHeaderColor()}`}>
          <div className="flex items-center justify-center">
            {verification.valid && !verification.tampered && !verification.revoked ? (
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : verification.tampered ? (
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            ) : (
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          <h1 className="text-center text-white text-xl font-semibold mt-2">
            {getStatusText()}
          </h1>
          {verification.tampered && (
            <p className="text-center text-white/80 text-sm mt-1">
              This receipt may have been altered
            </p>
          )}
          {verification.revoked && (
            <p className="text-center text-white/80 text-sm mt-1">
              This receipt has been voided
            </p>
          )}
        </div>
        
        <div className="px-6 py-6 space-y-4">
          <div className="text-center border-b pb-4">
            <p className="text-sm text-gray-500">Receipt Number</p>
            <p className="text-lg font-mono font-semibold text-gray-900">{verification.receiptNumber}</p>
            <p className="text-xs text-gray-400 mt-1">{verification.sourceType}</p>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Business</span>
              <span className="font-medium text-gray-900">{verification.businessName}</span>
            </div>
            
            {verification.grandTotal !== undefined && (
              <div className="flex justify-between">
                <span className="text-gray-600">Amount</span>
                <span className="font-semibold text-gray-900">{formatCurrency(verification.grandTotal)}</span>
              </div>
            )}
            
            {verification.transactionDate && (
              <div className="flex justify-between">
                <span className="text-gray-600">Date</span>
                <span className="text-gray-900">{formatDate(verification.transactionDate)}</span>
              </div>
            )}
            
            <div className="flex justify-between">
              <span className="text-gray-600">Status</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                verification.syncStatus === 'SYNCED' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {verification.syncStatus === 'SYNCED' ? 'Verified' : 'Pending Sync'}
              </span>
            </div>
          </div>
          
          <div className="pt-4 border-t text-center">
            <p className="text-xs text-gray-500">
              Verified at {formatDate(verification.verifiedAt)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
