/**
 * PARKHUB POS PAGE
 * Wave F1: ParkHub Walk-Up POS Interface
 * 
 * Mobile-first, offline-capable POS for Nigerian motor parks.
 * 5-step flow: Route → Trip/Seats → Info → Payment → Confirm
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { OfflineIndicator, OfflineBanner } from '@/components/offline-ux';
import { SyncStatusBadge, LastSyncedTimestamp } from '@/components/offline-ux';
import { useOnlineStatus, useSyncStatus } from '@/lib/offline-ux';

type Step = 'route' | 'trip' | 'info' | 'payment' | 'confirm';

interface Route {
  id: string;
  name: string;
  shortName: string | null;
  origin: string;
  destination: string;
  basePrice: number;
}

interface Trip {
  id: string;
  tripNumber: string;
  departureMode: string;
  scheduledDeparture: string | null;
  status: string;
  totalSeats: number;
  bookedSeats: number;
  availableSeats: number;
  currentPrice: number;
}

interface Seat {
  number: string;
  status: 'available' | 'booked' | 'queued';
}

interface SyncStatus {
  queuedCount: number;
  syncingCount: number;
  syncedCount: number;
  errorCount: number;
  lastSyncedAt: string | null;
}

type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'POS_CARD' | 'COD';

export default function ParkHubPosPage() {
  const params = useParams();
  const parkId = params.parkId as string;
  
  const { isOnline, isOffline } = useOnlineStatus();
  const syncStatus = useSyncStatus();

  const [step, setStep] = useState<Step>('route');
  const [routes, setRoutes] = useState<Route[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [serverSyncStatus, setServerSyncStatus] = useState<SyncStatus | null>(null);

  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [passengerName, setPassengerName] = useState('');
  const [passengerPhone, setPassengerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [roundingMode, setRoundingMode] = useState<'N5' | 'N10' | 'N50' | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const fetchRoutes = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/parkhub/pos/routes?parkId=${parkId}`);
      const data = await res.json();
      if (data.success) {
        setRoutes(data.routes);
      }
    } catch {
      setError('Failed to load routes');
    } finally {
      setLoading(false);
    }
  }, [parkId]);

  const fetchTrips = useCallback(async (routeId: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/parkhub/pos/trips?parkId=${parkId}&routeId=${routeId}`);
      const data = await res.json();
      if (data.success) {
        setTrips(data.trips);
      }
    } catch {
      setError('Failed to load trips');
    } finally {
      setLoading(false);
    }
  }, [parkId]);

  const fetchSeats = useCallback(async (tripId: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/parkhub/pos/trips?parkId=${parkId}&tripId=${tripId}`);
      const data = await res.json();
      if (data.success) {
        setSeats(data.trip.seats);
      }
    } catch {
      setError('Failed to load seats');
    } finally {
      setLoading(false);
    }
  }, [parkId]);

  const fetchSyncStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/parkhub/pos/sync');
      const data = await res.json();
      if (data.success) {
        setServerSyncStatus(data.status);
        if (data.status.queuedCount > 0) {
          syncStatus.setQueued(data.status.queuedCount);
        } else if (data.status.errorCount > 0) {
          syncStatus.setError(`${data.status.errorCount} failed`);
        } else {
          syncStatus.setSynced();
        }
      }
    } catch {
      console.error('Failed to fetch sync status');
    }
  }, [syncStatus]);

  useEffect(() => {
    fetchRoutes();
    fetchSyncStatus();
  }, [fetchRoutes, fetchSyncStatus]);

  const handleRouteSelect = (route: Route) => {
    setSelectedRoute(route);
    fetchTrips(route.id);
    setStep('trip');
  };

  const handleTripSelect = (trip: Trip) => {
    setSelectedTrip(trip);
    fetchSeats(trip.id);
  };

  const handleSeatToggle = (seatNum: string) => {
    setSelectedSeats(prev => 
      prev.includes(seatNum)
        ? prev.filter(s => s !== seatNum)
        : [...prev, seatNum]
    );
  };

  const handleConfirmSeats = () => {
    if (selectedSeats.length > 0) {
      setStep('info');
    }
  };

  const handleConfirmInfo = () => {
    setStep('payment');
  };

  const handleConfirmPayment = () => {
    setStep('confirm');
  };

  const calculateTotal = () => {
    if (!selectedTrip) return { subtotal: 0, rounding: 0, total: 0 };
    
    const subtotal = selectedTrip.currentPrice * selectedSeats.length;
    let rounding = 0;
    let total = subtotal;
    
    if (roundingMode) {
      const roundVal = parseInt(roundingMode.replace('N', ''));
      total = Math.round(subtotal / roundVal) * roundVal;
      rounding = total - subtotal;
    }
    
    return { subtotal, rounding, total };
  };

  const handleSubmit = async () => {
    if (!selectedRoute || !selectedTrip) return;
    
    setLoading(true);
    setError(null);
    
    const { subtotal, rounding, total } = calculateTotal();
    const clientTicketId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    
    try {
      const res = await fetch('/api/parkhub/pos/ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parkId,
          clientTicketId,
          clientTimestamp: new Date().toISOString(),
          routeId: selectedRoute.id,
          routeName: selectedRoute.name,
          tripId: selectedTrip.id,
          tripNumber: selectedTrip.tripNumber,
          seatNumbers: selectedSeats,
          ticketCount: selectedSeats.length,
          passengerName: passengerName || 'Walk-up Customer',
          passengerPhone: passengerPhone || null,
          unitPrice: selectedTrip.currentPrice,
          subtotal,
          discount: 0,
          roundingAmount: rounding,
          roundingMode,
          totalAmount: total,
          paymentMethod,
          paymentNotes,
        }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        setSuccess(true);
        syncStatus.incrementPending();
        
        if (isOnline) {
          setTimeout(() => handleSync(), 1000);
        }
      } else {
        setError(data.error || 'Failed to queue ticket');
      }
    } catch {
      setError('Failed to save ticket. It will sync when online.');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    syncStatus.setSyncing();
    
    try {
      const res = await fetch('/api/parkhub/pos/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      
      const data = await res.json();
      
      if (data.success) {
        if (data.status.queuedCount === 0 && data.status.errorCount === 0) {
          syncStatus.setSynced();
        } else if (data.status.errorCount > 0) {
          syncStatus.setError(`${data.status.errorCount} failed`);
        } else {
          syncStatus.setQueued(data.status.queuedCount);
        }
        setServerSyncStatus(data.status);
      }
    } catch {
      syncStatus.setError('Sync failed');
    }
  };

  const handleNewSale = () => {
    setStep('route');
    setSelectedRoute(null);
    setSelectedTrip(null);
    setSelectedSeats([]);
    setPassengerName('');
    setPassengerPhone('');
    setPaymentMethod('CASH');
    setPaymentNotes('');
    setRoundingMode(null);
    setSuccess(false);
    setError(null);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return 'When full';
    return new Date(dateStr).toLocaleTimeString('en-NG', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <OfflineBanner position="top" />
      
      <header className="bg-white border-b px-4 py-3 sticky top-0 z-40">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-900">ParkHub POS</h1>
          <div className="flex items-center gap-3">
            <SyncStatusBadge
              status={{
                state: syncStatus.isSynced ? 'synced' : syncStatus.isSyncing ? 'syncing' : syncStatus.hasError ? 'error' : 'queued',
                lastSyncedAt: serverSyncStatus?.lastSyncedAt ? new Date(serverSyncStatus.lastSyncedAt) : null,
                pendingCount: serverSyncStatus?.queuedCount || 0,
              }}
              size="sm"
              onRetry={handleSync}
            />
            <OfflineIndicator compact showWhenOnline={false} />
          </div>
        </div>
        
        <div className="flex gap-1 mt-3">
          {(['route', 'trip', 'info', 'payment', 'confirm'] as Step[]).map((s, i) => (
            <div
              key={s}
              className={`flex-1 h-1.5 rounded-full ${
                step === s ? 'bg-green-500' :
                ['route', 'trip', 'info', 'payment', 'confirm'].indexOf(step) > i ? 'bg-green-300' :
                'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </header>

      <main className="p-4">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {success ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Ticket Saved!</h2>
            <p className="text-gray-600 mb-6">
              {isOnline ? 'Syncing to server...' : 'Will sync when online'}
            </p>
            
            <div className="bg-white rounded-lg border p-4 mb-6 text-left">
              <div className="flex justify-between mb-2">
                <span className="text-gray-500">Route</span>
                <span className="font-medium">{selectedRoute?.name}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-500">Trip</span>
                <span className="font-medium">{selectedTrip?.tripNumber}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-500">Seats</span>
                <span className="font-medium">{selectedSeats.join(', ')}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-500">Payment</span>
                <span className="font-medium">{paymentMethod}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2">
                <span>Total</span>
                <span className="text-green-600">{formatCurrency(calculateTotal().total)}</span>
              </div>
            </div>
            
            <button
              onClick={handleNewSale}
              className="w-full bg-green-600 text-white py-4 rounded-xl font-semibold text-lg"
            >
              New Sale
            </button>
          </div>
        ) : step === 'route' ? (
          <div>
            <h2 className="text-lg font-semibold mb-4">Select Route</h2>
            
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading routes...</div>
            ) : routes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No routes available</div>
            ) : (
              <div className="space-y-3">
                {routes.map(route => (
                  <button
                    key={route.id}
                    onClick={() => handleRouteSelect(route)}
                    className="w-full bg-white rounded-xl border p-4 text-left hover:border-green-300 transition-colors"
                  >
                    <div className="font-semibold text-gray-900">{route.name}</div>
                    <div className="text-sm text-gray-500 mt-1">
                      {route.origin} → {route.destination}
                    </div>
                    <div className="text-green-600 font-medium mt-2">
                      {formatCurrency(route.basePrice)}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : step === 'trip' ? (
          <div>
            <button
              onClick={() => setStep('route')}
              className="flex items-center text-gray-500 mb-4"
            >
              <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            
            <h2 className="text-lg font-semibold mb-2">Select Trip & Seats</h2>
            <p className="text-gray-500 text-sm mb-4">{selectedRoute?.name}</p>
            
            {!selectedTrip ? (
              <div className="space-y-3">
                {trips.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No trips available</div>
                ) : trips.map(trip => (
                  <button
                    key={trip.id}
                    onClick={() => handleTripSelect(trip)}
                    className="w-full bg-white rounded-xl border p-4 text-left hover:border-green-300 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-semibold text-gray-900">{trip.tripNumber}</div>
                        <div className="text-sm text-gray-500 mt-1">
                          {formatTime(trip.scheduledDeparture)}
                          {trip.departureMode === 'WHEN_FULL' && ' (leaves when full)'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-green-600 font-medium">
                          {formatCurrency(trip.currentPrice)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {trip.availableSeats} seats left
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div>
                <div className="bg-white rounded-xl border p-4 mb-4">
                  <div className="flex justify-between">
                    <div>
                      <div className="font-semibold">{selectedTrip.tripNumber}</div>
                      <div className="text-sm text-gray-500">
                        {formatTime(selectedTrip.scheduledDeparture)}
                      </div>
                    </div>
                    <button
                      onClick={() => { setSelectedTrip(null); setSelectedSeats([]); }}
                      className="text-gray-400"
                    >
                      Change
                    </button>
                  </div>
                </div>
                
                <h3 className="font-medium mb-3">Select Seats ({selectedSeats.length} selected)</h3>
                
                <div className="grid grid-cols-4 gap-2 mb-6">
                  {seats.map(seat => (
                    <button
                      key={seat.number}
                      onClick={() => seat.status === 'available' && handleSeatToggle(seat.number)}
                      disabled={seat.status !== 'available'}
                      className={`h-12 rounded-lg font-medium text-sm transition-colors ${
                        selectedSeats.includes(seat.number)
                          ? 'bg-green-500 text-white'
                          : seat.status === 'available'
                            ? 'bg-white border border-gray-300 hover:border-green-400'
                            : seat.status === 'queued'
                              ? 'bg-yellow-100 text-yellow-600 cursor-not-allowed'
                              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {seat.number}
                    </button>
                  ))}
                </div>
                
                {selectedSeats.length > 0 && (
                  <button
                    onClick={handleConfirmSeats}
                    className="w-full bg-green-600 text-white py-4 rounded-xl font-semibold"
                  >
                    Continue ({formatCurrency(selectedTrip.currentPrice * selectedSeats.length)})
                  </button>
                )}
              </div>
            )}
          </div>
        ) : step === 'info' ? (
          <div>
            <button
              onClick={() => setStep('trip')}
              className="flex items-center text-gray-500 mb-4"
            >
              <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            
            <h2 className="text-lg font-semibold mb-4">Passenger Info (Optional)</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Passenger Name
                </label>
                <input
                  type="text"
                  value={passengerName}
                  onChange={(e) => setPassengerName(e.target.value)}
                  placeholder="Walk-up Customer"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={passengerPhone}
                  onChange={(e) => setPassengerPhone(e.target.value)}
                  placeholder="080XXXXXXXX"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>
            
            <button
              onClick={handleConfirmInfo}
              className="w-full bg-green-600 text-white py-4 rounded-xl font-semibold mt-6"
            >
              Continue
            </button>
          </div>
        ) : step === 'payment' ? (
          <div>
            <button
              onClick={() => setStep('info')}
              className="flex items-center text-gray-500 mb-4"
            >
              <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            
            <h2 className="text-lg font-semibold mb-4">Payment Method</h2>
            
            <div className="space-y-3 mb-6">
              {([
                { value: 'CASH', label: 'Cash', icon: '💵' },
                { value: 'BANK_TRANSFER', label: 'Bank Transfer', icon: '🏦' },
                { value: 'POS_CARD', label: 'POS / Card', icon: '💳' },
                { value: 'COD', label: 'Collect Later', icon: '📋' },
              ] as const).map(method => (
                <button
                  key={method.value}
                  onClick={() => setPaymentMethod(method.value)}
                  className={`w-full flex items-center p-4 rounded-xl border transition-colors ${
                    paymentMethod === method.value
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <span className="text-2xl mr-3">{method.icon}</span>
                  <span className="font-medium">{method.label}</span>
                  {paymentMethod === method.value && (
                    <svg className="w-5 h-5 text-green-500 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
            
            {paymentMethod === 'CASH' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cash Rounding
                </label>
                <div className="flex gap-2">
                  {[null, 'N5', 'N10', 'N50'].map(mode => (
                    <button
                      key={mode || 'none'}
                      onClick={() => setRoundingMode(mode as 'N5' | 'N10' | 'N50' | null)}
                      className={`flex-1 py-2 rounded-lg border font-medium text-sm ${
                        roundingMode === mode
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-200 bg-white text-gray-700'
                      }`}
                    >
                      {mode || 'None'}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {paymentMethod === 'BANK_TRANSFER' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reference / Notes
                </label>
                <textarea
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="Transaction reference or notes..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-green-500"
                />
              </div>
            )}
            
            <button
              onClick={handleConfirmPayment}
              className="w-full bg-green-600 text-white py-4 rounded-xl font-semibold"
            >
              Review Order
            </button>
          </div>
        ) : step === 'confirm' ? (
          <div>
            <button
              onClick={() => setStep('payment')}
              className="flex items-center text-gray-500 mb-4"
            >
              <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            
            <h2 className="text-lg font-semibold mb-4">Confirm Sale</h2>
            
            <div className="bg-white rounded-xl border p-4 mb-6">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">Route</span>
                  <span className="font-medium">{selectedRoute?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Trip</span>
                  <span className="font-medium">{selectedTrip?.tripNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Seats</span>
                  <span className="font-medium">{selectedSeats.join(', ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Passenger</span>
                  <span className="font-medium">{passengerName || 'Walk-up Customer'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Payment</span>
                  <span className="font-medium">{paymentMethod}</span>
                </div>
                
                <div className="border-t pt-3 mt-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">
                      {selectedSeats.length} × {formatCurrency(selectedTrip?.currentPrice || 0)}
                    </span>
                    <span>{formatCurrency(calculateTotal().subtotal)}</span>
                  </div>
                  {calculateTotal().rounding !== 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Rounding ({roundingMode})</span>
                      <span>{formatCurrency(calculateTotal().rounding)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold pt-2">
                    <span>Total</span>
                    <span className="text-green-600">{formatCurrency(calculateTotal().total)}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-green-600 text-white py-4 rounded-xl font-semibold text-lg disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Confirm & Save'}
            </button>
          </div>
        ) : null}
      </main>
      
      {serverSyncStatus && serverSyncStatus.queuedCount > 0 && isOnline && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 safe-area-inset">
          <button
            onClick={handleSync}
            disabled={syncStatus.isSyncing}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
          >
            {syncStatus.isSyncing ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Syncing...
              </>
            ) : (
              <>
                Sync {serverSyncStatus.queuedCount} Tickets
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
