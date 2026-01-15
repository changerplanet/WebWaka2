/**
 * Printable Manifest Component
 * Wave F8: Manifest Generation (ParkHub)
 * 
 * Paper-first design optimized for:
 * - A4 paper printing
 * - Thermal printer output
 * - Black-and-white printing
 * - Nigerian motor park requirements
 */

'use client';

import React from 'react';
import { ManifestData, ManifestPassenger } from '@/lib/parkhub/manifest';

interface PrintableManifestProps {
  manifest: ManifestData;
  showQrCode?: boolean;
  compact?: boolean;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
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

function formatDateTime(date: Date | null): string {
  if (!date) return 'N/A';
  return `${formatDate(date)} ${formatTime(date)}`;
}

export function PrintableManifest({ manifest, showQrCode = true, compact = false }: PrintableManifestProps) {
  const passengers = manifest.passengerList || [];
  
  return (
    <div className="bg-white text-black font-mono text-sm print:text-xs" style={{ maxWidth: '210mm' }}>
      {manifest.isDemo && (
        <div className="text-center bg-gray-200 py-1 font-bold text-xs border-b-2 border-dashed border-gray-400">
          *** DEMO / SAMPLE - NOT VALID FOR TRAVEL ***
        </div>
      )}
      
      {manifest.syncStatus === 'PENDING_SYNC' && (
        <div className="text-center bg-yellow-100 py-1 font-bold text-xs border-b-2 border-dashed border-yellow-600">
          ⚠ PENDING SYNC - VERIFY ONLINE BEFORE TRAVEL
        </div>
      )}
      
      <div className="p-4 print:p-2">
        <header className="text-center border-b-2 border-black pb-3 mb-4">
          <h1 className="text-xl font-bold uppercase tracking-wide print:text-lg">
            PASSENGER MANIFEST
          </h1>
          <div className="text-lg font-semibold mt-1 print:text-base">
            {manifest.parkName || 'Motor Park'}
          </div>
          {manifest.parkLocation && (
            <div className="text-sm text-gray-600">{manifest.parkLocation}</div>
          )}
          {manifest.parkPhone && (
            <div className="text-xs text-gray-500">Tel: {manifest.parkPhone}</div>
          )}
        </header>

        <section className="grid grid-cols-2 gap-4 mb-4 print:gap-2">
          <div>
            <div className="font-bold text-xs uppercase text-gray-500 mb-1">Manifest No.</div>
            <div className="font-bold text-base">{manifest.manifestNumber}</div>
          </div>
          <div className="text-right">
            <div className="font-bold text-xs uppercase text-gray-500 mb-1">Serial No.</div>
            <div className="font-bold text-base">#{manifest.serialNumber}</div>
          </div>
        </section>

        <section className="border border-black p-3 mb-4 print:p-2">
          <div className="font-bold text-xs uppercase text-gray-500 mb-2">Trip Details</div>
          
          <div className="grid grid-cols-2 gap-2 text-sm print:text-xs">
            <div>
              <span className="font-semibold">Route:</span> {manifest.routeName}
            </div>
            <div>
              <span className="font-semibold">Mode:</span> {manifest.departureMode === 'WHEN_FULL' ? 'When Full' : manifest.departureMode === 'HYBRID' ? 'Hybrid' : 'Scheduled'}
            </div>
            <div>
              <span className="font-semibold">From:</span> {manifest.origin}
            </div>
            <div>
              <span className="font-semibold">To:</span> {manifest.destination}
            </div>
            <div className="col-span-2">
              <span className="font-semibold">Departure:</span> {formatDateTime(manifest.scheduledDeparture)}
            </div>
          </div>
        </section>

        <section className="border border-black p-3 mb-4 print:p-2">
          <div className="font-bold text-xs uppercase text-gray-500 mb-2">Vehicle & Driver</div>
          
          <div className="grid grid-cols-2 gap-2 text-sm print:text-xs">
            <div>
              <span className="font-semibold">Plate No:</span> {manifest.vehiclePlateNumber || 'N/A'}
            </div>
            <div>
              <span className="font-semibold">Vehicle:</span> {[manifest.vehicleMake, manifest.vehicleModel].filter(Boolean).join(' ') || 'N/A'}
            </div>
            <div>
              <span className="font-semibold">Driver:</span> {manifest.driverName || 'Not Assigned'}
            </div>
            <div>
              <span className="font-semibold">Phone:</span> {manifest.driverPhone || 'N/A'}
            </div>
          </div>
        </section>

        <section className="mb-4">
          <div className="flex justify-between items-center border-b-2 border-black pb-1 mb-2">
            <div className="font-bold text-xs uppercase">Passenger List</div>
            <div className="text-xs">
              <span className="font-bold">{manifest.bookedSeats}</span> of {manifest.totalSeats} seats
            </div>
          </div>
          
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-400">
                <th className="text-left py-1 w-12">#</th>
                <th className="text-left py-1 w-16">Seat</th>
                <th className="text-left py-1">Passenger Name</th>
                <th className="text-left py-1 w-28 print:hidden">Phone</th>
                <th className="text-left py-1 w-24">Ticket No.</th>
                {!compact && <th className="text-right py-1 w-20">Amount</th>}
              </tr>
            </thead>
            <tbody>
              {passengers.map((passenger: ManifestPassenger, index: number) => (
                <tr key={passenger.ticketId} className="border-b border-gray-200">
                  <td className="py-1">{index + 1}</td>
                  <td className="py-1 font-mono">{passenger.seatNumber}</td>
                  <td className="py-1">{passenger.passengerName}</td>
                  <td className="py-1 print:hidden">{passenger.passengerPhone || '-'}</td>
                  <td className="py-1 font-mono text-xs">{passenger.ticketNumber}</td>
                  {!compact && <td className="py-1 text-right">{formatCurrency(passenger.amount)}</td>}
                </tr>
              ))}
              {passengers.length === 0 && (
                <tr>
                  <td colSpan={compact ? 5 : 6} className="py-4 text-center text-gray-500">
                    No passengers booked
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        <section className="border border-black p-3 mb-4 print:p-2">
          <div className="font-bold text-xs uppercase text-gray-500 mb-2">Summary</div>
          
          <div className="grid grid-cols-3 gap-4 text-sm print:text-xs print:gap-2">
            <div className="text-center">
              <div className="text-xs text-gray-500">Total Passengers</div>
              <div className="text-xl font-bold print:text-lg">{manifest.bookedSeats}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500">Available Seats</div>
              <div className="text-xl font-bold print:text-lg">{manifest.availableSeats}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500">Total Seats</div>
              <div className="text-xl font-bold print:text-lg">{manifest.totalSeats}</div>
            </div>
          </div>
          
          {!compact && (
            <div className="mt-4 pt-3 border-t border-gray-300">
              <div className="font-bold text-xs uppercase text-gray-500 mb-2">Revenue Breakdown</div>
              <div className="grid grid-cols-4 gap-2 text-xs">
                <div>
                  <span className="text-gray-500">Cash:</span>
                  <div className="font-bold">{formatCurrency(manifest.cashAmount)}</div>
                </div>
                <div>
                  <span className="text-gray-500">Card:</span>
                  <div className="font-bold">{formatCurrency(manifest.cardAmount)}</div>
                </div>
                <div>
                  <span className="text-gray-500">Transfer:</span>
                  <div className="font-bold">{formatCurrency(manifest.transferAmount)}</div>
                </div>
                <div>
                  <span className="text-gray-500">Total:</span>
                  <div className="font-bold text-base">{formatCurrency(manifest.totalRevenue)}</div>
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="grid grid-cols-2 gap-8 mb-6 print:gap-4">
          <div className="border-t-2 border-black pt-2">
            <div className="h-12 border-b border-dashed border-gray-400"></div>
            <div className="text-xs text-center mt-1">
              <div className="font-semibold">Issuing Agent Signature</div>
              <div className="text-gray-500">{manifest.generatedByName || 'N/A'}</div>
            </div>
          </div>
          <div className="border-t-2 border-black pt-2">
            <div className="h-12 border-b border-dashed border-gray-400"></div>
            <div className="text-xs text-center mt-1">
              <div className="font-semibold">Driver Signature</div>
              <div className="text-gray-500">{manifest.driverName || 'N/A'}</div>
            </div>
          </div>
        </section>

        <footer className="border-t-2 border-black pt-3 text-xs text-gray-600">
          <div className="flex justify-between items-start">
            <div>
              <div>Generated: {formatDateTime(manifest.generatedAt)}</div>
              <div>By: {manifest.generatedByName || 'System'}</div>
              {manifest.printCount > 0 && (
                <div className="text-yellow-700 font-semibold">
                  Printed {manifest.printCount} time{manifest.printCount !== 1 ? 's' : ''}
                  {manifest.lastPrintedAt && ` (Last: ${formatDateTime(manifest.lastPrintedAt)})`}
                </div>
              )}
            </div>
            
            {showQrCode && manifest.qrCodeData && (
              <div className="text-center">
                <div className="w-20 h-20 bg-gray-100 border border-gray-300 flex items-center justify-center text-xs text-gray-400 print:w-16 print:h-16">
                  [QR Code]
                </div>
                <div className="text-xs mt-1">Scan to verify</div>
              </div>
            )}
          </div>
          
          <div className="text-center mt-4 pt-2 border-t border-gray-300 text-xs">
            <div className="font-semibold">
              {manifest.isDemo ? 'DEMO DOCUMENT' : 'OFFICIAL PASSENGER MANIFEST'}
            </div>
            <div>Verification: {manifest.verificationHash?.substring(0, 12) || 'N/A'}</div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export function ThermalManifest({ manifest }: { manifest: ManifestData }) {
  const passengers = manifest.passengerList || [];
  
  return (
    <div className="bg-white text-black font-mono text-xs" style={{ width: '80mm', margin: '0 auto' }}>
      {manifest.isDemo && (
        <div className="text-center font-bold py-1 border-b border-dashed">
          ** DEMO **
        </div>
      )}
      
      <div className="p-2">
        <div className="text-center font-bold text-sm uppercase mb-2">
          MANIFEST
        </div>
        <div className="text-center text-xs mb-2">
          {manifest.parkName || 'Motor Park'}
        </div>
        
        <div className="border-t border-dashed pt-2 mb-2">
          <div className="font-bold">{manifest.manifestNumber}</div>
          <div>{manifest.routeName}</div>
          <div>{manifest.origin} → {manifest.destination}</div>
          <div>Dep: {formatDateTime(manifest.scheduledDeparture)}</div>
        </div>
        
        <div className="border-t border-dashed pt-2 mb-2">
          <div>Vehicle: {manifest.vehiclePlateNumber || 'N/A'}</div>
          <div>Driver: {manifest.driverName || 'N/A'}</div>
        </div>
        
        <div className="border-t border-dashed pt-2 mb-2">
          <div className="font-bold mb-1">PASSENGERS ({manifest.bookedSeats}/{manifest.totalSeats})</div>
          {passengers.map((p: ManifestPassenger, i: number) => (
            <div key={p.ticketId} className="flex justify-between">
              <span>{i + 1}. {p.seatNumber}</span>
              <span className="truncate ml-2">{p.passengerName}</span>
            </div>
          ))}
        </div>
        
        <div className="border-t border-dashed pt-2 text-center">
          <div>Total: {formatCurrency(manifest.totalRevenue)}</div>
          <div className="text-xs mt-2">
            {formatDateTime(manifest.generatedAt)}
          </div>
          <div className="text-xs">
            V: {manifest.verificationHash?.substring(0, 8)}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PrintableManifest;
