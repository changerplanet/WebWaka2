'use client'

import { useState, useEffect } from 'react'
import { usePOS, POSLocation } from './POSProvider'
import { MapPin, User, LogIn, Store } from 'lucide-react'

interface LocationSelectProps {
  onComplete: () => void
}

export function LocationSelect({ onComplete }: LocationSelectProps) {
  const { locations, setLocation, setStaff, tenantId } = usePOS()
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null)
  const [staffPin, setStaffPin] = useState('')
  const [staffName, setStaffName] = useState('')
  const [step, setStep] = useState<'location' | 'staff'>('location')

  const handleLocationSelect = (location: POSLocation) => {
    setSelectedLocation(location.id)
    setLocation(location.id, location.name)
    setStep('staff')
  }

  const handleStaffLogin = () => {
    // In production, this would verify against Core staff API
    // For now, accept any 4-digit PIN with a name
    if (staffPin.length >= 4 && staffName.length >= 2) {
      setStaff(`staff_${staffPin}`, staffName)
      onComplete()
    }
  }

  if (step === 'staff') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-600 to-green-700 flex items-center justify-center p-6" data-testid="pos-staff-login">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900">Staff Login</h1>
              <p className="text-slate-500 mt-1">Enter your name and PIN</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Your Name
                </label>
                <input
                  type="text"
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none text-lg"
                  autoFocus
                  data-testid="staff-name-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  PIN Code
                </label>
                <input
                  type="password"
                  value={staffPin}
                  onChange={(e) => setStaffPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="••••"
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none text-2xl text-center tracking-widest"
                  maxLength={6}
                  data-testid="staff-pin-input"
                />
              </div>

              {/* Quick PIN pad */}
              <div className="grid grid-cols-3 gap-2 mt-4" data-testid="pin-pad">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, 'del'].map((num, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      if (num === 'del') {
                        setStaffPin(p => p.slice(0, -1))
                      } else if (num !== null) {
                        setStaffPin(p => (p + num).slice(0, 6))
                      }
                    }}
                    disabled={num === null}
                    className={`py-4 text-xl font-medium rounded-xl transition-colors touch-manipulation ${
                      num === null 
                        ? 'invisible' 
                        : 'bg-slate-100 hover:bg-slate-200 active:bg-slate-300'
                    }`}
                    data-testid={num !== null ? `pin-btn-${num}` : undefined}
                  >
                    {num === 'del' ? '⌫' : num}
                  </button>
                ))}
              </div>

              <button
                onClick={handleStaffLogin}
                disabled={staffPin.length < 4 || staffName.length < 2}
                className="w-full mt-6 py-4 bg-green-600 hover:bg-green-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-lg transition-colors flex items-center justify-center gap-2 touch-manipulation"
                data-testid="start-shift-btn"
              >
                <LogIn className="w-5 h-5" />
                Start Shift
              </button>

              <button
                onClick={() => setStep('location')}
                className="w-full py-3 text-slate-500 hover:text-slate-700 transition-colors"
                data-testid="change-location-btn"
              >
                ← Change Location
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-600 to-green-700 flex items-center justify-center p-6" data-testid="pos-location-select">
      <div className="w-full max-w-lg">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Store className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Point of Sale</h1>
            <p className="text-slate-500 mt-1">Select your location to begin</p>
          </div>

          {locations.length === 0 ? (
            <div className="text-center py-8" data-testid="no-locations-message">
              <MapPin className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No locations available</p>
              <p className="text-sm text-slate-400 mt-1">
                Contact your administrator to set up locations
              </p>
            </div>
          ) : (
            <div className="space-y-3" data-testid="locations-list">
              {locations.map((location) => (
                <button
                  key={location.id}
                  onClick={() => handleLocationSelect(location)}
                  className="w-full p-4 bg-slate-50 hover:bg-green-50 border-2 border-slate-200 hover:border-green-300 rounded-xl flex items-center gap-4 transition-all touch-manipulation"
                  data-testid={`location-btn-${location.id}`}
                >
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="text-left flex-1">
                    <p className="font-semibold text-slate-900">{location.name}</p>
                    <p className="text-sm text-slate-500">{location.type}</p>
                  </div>
                  {location.isDefault && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                      Default
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
