/**
 * Public Manifest Verification Page
 * Wave F8: Manifest Generation (ParkHub)
 * 
 * Publicly accessible page for verifying manifest authenticity.
 * No authentication required - anyone can verify.
 */

import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';

export const metadata: Metadata = {
  title: 'Verify Manifest - WebWaka',
  description: 'Verify the authenticity of a ParkHub passenger manifest',
};

interface PageProps {
  params: { manifestNumber: string };
  searchParams: { v?: string };
}

function formatDate(date: Date | null): string {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatTime(date: Date | null): string {
  if (!date) return 'N/A';
  return new Date(date).toLocaleTimeString('en-NG', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export default async function VerifyManifestPage({ params, searchParams }: PageProps) {
  const manifestNumber = decodeURIComponent(params.manifestNumber);
  const verificationCode = searchParams.v;

  const manifest = await prisma.park_manifest.findFirst({
    where: { manifestNumber },
    select: {
      manifestNumber: true,
      serialNumber: true,
      routeName: true,
      origin: true,
      destination: true,
      scheduledDeparture: true,
      status: true,
      syncStatus: true,
      isDemo: true,
      bookedSeats: true,
      totalSeats: true,
      generatedAt: true,
      parkName: true,
      parkLocation: true,
      vehiclePlateNumber: true,
      driverName: true,
      verificationHash: true,
    },
  });

  if (!manifest) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-red-500 text-6xl mb-4">✗</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Manifest Not Found</h1>
          <p className="text-gray-600 mb-4">
            The manifest number <span className="font-mono font-bold">{manifestNumber}</span> was not found in our system.
          </p>
          <div className="bg-red-50 border border-red-200 rounded p-4 text-sm text-red-700">
            This document may be invalid or fraudulent. Please verify with the issuing motor park.
          </div>
        </div>
      </div>
    );
  }

  let hashValid = true;
  if (verificationCode && manifest.verificationHash) {
    hashValid = verificationCode === manifest.verificationHash.substring(0, 12);
  }

  const isValid = hashValid && manifest.status !== 'VOIDED';

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-lg mx-auto">
        {manifest.isDemo && (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded mb-4 text-center font-semibold">
            DEMO / SAMPLE DOCUMENT
          </div>
        )}

        {manifest.syncStatus === 'PENDING_SYNC' && (
          <div className="bg-orange-100 border border-orange-400 text-orange-800 px-4 py-3 rounded mb-4 text-center">
            ⚠ This manifest is pending synchronization. Final verification is not yet available.
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className={`p-6 text-center ${isValid ? 'bg-green-500' : 'bg-red-500'} text-white`}>
            <div className="text-6xl mb-2">{isValid ? '✓' : '✗'}</div>
            <h1 className="text-2xl font-bold">
              {isValid ? 'VERIFIED' : 'VERIFICATION FAILED'}
            </h1>
            <p className="text-sm opacity-90 mt-1">
              {isValid
                ? 'This manifest is authentic'
                : manifest.status === 'VOIDED'
                ? 'This manifest has been voided'
                : 'Verification code mismatch'}
            </p>
          </div>

          <div className="p-6">
            <div className="mb-6">
              <div className="text-xs text-gray-500 uppercase font-semibold mb-1">Manifest Number</div>
              <div className="text-2xl font-bold font-mono">{manifest.manifestNumber}</div>
              <div className="text-sm text-gray-500">Serial: #{manifest.serialNumber}</div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <div className="text-xs text-gray-500 uppercase font-semibold mb-1">Status</div>
                <div className={`inline-block px-2 py-1 rounded text-sm font-semibold ${
                  manifest.status === 'VOIDED' ? 'bg-red-100 text-red-700' :
                  manifest.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                  manifest.status === 'DEPARTED' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {manifest.status}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase font-semibold mb-1">Passengers</div>
                <div className="text-lg font-bold">
                  {manifest.bookedSeats} / {manifest.totalSeats}
                </div>
              </div>
            </div>

            <div className="space-y-4 border-t pt-4">
              <div>
                <div className="text-xs text-gray-500 uppercase font-semibold mb-1">Route</div>
                <div className="font-semibold">{manifest.routeName}</div>
                <div className="text-sm text-gray-600">
                  {manifest.origin} → {manifest.destination}
                </div>
              </div>

              <div>
                <div className="text-xs text-gray-500 uppercase font-semibold mb-1">Departure</div>
                <div className="font-semibold">
                  {formatDate(manifest.scheduledDeparture)} at {formatTime(manifest.scheduledDeparture)}
                </div>
              </div>

              {(manifest.vehiclePlateNumber || manifest.driverName) && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-500 uppercase font-semibold mb-1">Vehicle</div>
                    <div className="font-mono">{manifest.vehiclePlateNumber || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 uppercase font-semibold mb-1">Driver</div>
                    <div>{manifest.driverName || 'N/A'}</div>
                  </div>
                </div>
              )}

              <div>
                <div className="text-xs text-gray-500 uppercase font-semibold mb-1">Issuing Park</div>
                <div className="font-semibold">{manifest.parkName || 'N/A'}</div>
                {manifest.parkLocation && (
                  <div className="text-sm text-gray-600">{manifest.parkLocation}</div>
                )}
              </div>

              <div>
                <div className="text-xs text-gray-500 uppercase font-semibold mb-1">Generated</div>
                <div className="text-sm">
                  {formatDate(manifest.generatedAt)} at {formatTime(manifest.generatedAt)}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 text-center text-xs text-gray-500 border-t">
            <div>Verification Code: {manifest.verificationHash?.substring(0, 12) || 'N/A'}</div>
            <div className="mt-2">
              {manifest.isDemo 
                ? 'This is a demo document and is not valid for travel.'
                : 'For any concerns, please contact the issuing motor park.'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
