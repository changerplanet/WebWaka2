'use client';

/**
 * Mobile Address Step
 * Wave F6: Mobile Checkout Redesign (SVM)
 * 
 * Nigeria-optimized address form with landmark-based addressing.
 * Mobile-first, thumb-zone optimized layout.
 */

import { useState, useEffect } from 'react';
import { MapPin, Phone, User, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { NigeriaShippingAddress } from './types';
import {
  NIGERIAN_STATES,
  getStateByName,
  LANDMARK_TYPE_LABELS,
  LandmarkType,
} from '@/lib/commerce/landmark-address';

interface MobileAddressStepProps {
  initialAddress?: Partial<NigeriaShippingAddress>;
  onSubmit: (address: NigeriaShippingAddress) => void;
  onBack?: () => void;
  isLoading?: boolean;
}

export function MobileAddressStep({
  initialAddress,
  onSubmit,
  onBack,
  isLoading,
}: MobileAddressStepProps) {
  const [formData, setFormData] = useState<Partial<NigeriaShippingAddress>>({
    recipientName: '',
    recipientPhone: '',
    alternatePhone: '',
    email: '',
    state: '',
    lga: '',
    area: '',
    landmark: '',
    landmarkType: '',
    nearbyLandmark: '',
    streetName: '',
    houseNumber: '',
    deliveryInstructions: '',
    ...initialAddress,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [lgas, setLgas] = useState<string[]>([]);
  const [showOptionalFields, setShowOptionalFields] = useState(false);

  useEffect(() => {
    if (formData.state) {
      const state = getStateByName(formData.state);
      if (state) {
        setLgas(state.lgas);
        if (!state.lgas.includes(formData.lga || '')) {
          setFormData(prev => ({ ...prev, lga: '' }));
        }
      }
    } else {
      setLgas([]);
    }
  }, [formData.state]);

  const handleChange = (field: keyof NigeriaShippingAddress, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.recipientName?.trim()) {
      newErrors.recipientName = 'Enter your name';
    }

    if (!formData.recipientPhone?.trim()) {
      newErrors.recipientPhone = 'Enter phone number';
    } else {
      const phone = formData.recipientPhone.replace(/\s/g, '');
      const phoneRegex = /^(\+234|0)[789][01]\d{8}$/;
      if (!phoneRegex.test(phone)) {
        newErrors.recipientPhone = 'Enter a valid Nigerian phone number';
      }
    }

    if (!formData.state) {
      newErrors.state = 'Select your state';
    }

    if (!formData.lga) {
      newErrors.lga = 'Select your LGA';
    }

    if (!formData.area?.trim()) {
      newErrors.area = 'Enter your area';
    }

    if (!formData.landmark?.trim()) {
      newErrors.landmark = 'Enter a nearby landmark';
    } else if (formData.landmark.length < 5) {
      newErrors.landmark = 'Please be more specific';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData as NigeriaShippingAddress);
    }
  };

  const landmarkTypes = Object.entries(LANDMARK_TYPE_LABELS) as [LandmarkType, string][];

  return (
    <form onSubmit={handleSubmit} className="flex flex-col min-h-full">
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        <div className="bg-green-50 border border-green-200 rounded-xl p-3">
          <div className="flex gap-2">
            <Info className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-green-800">Tip for faster delivery</p>
              <p className="text-sm text-green-700">
                Describe your location using landmarks like churches, markets, or bus stops.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <User className="w-5 h-5 text-green-600" />
            Who should we deliver to?
          </h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.recipientName || ''}
              onChange={(e) => handleChange('recipientName', e.target.value)}
              placeholder="Enter your full name"
              className={`w-full px-4 py-3.5 text-base border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                errors.recipientName ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.recipientName && (
              <p className="text-red-500 text-sm mt-1">{errors.recipientName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="tel"
                value={formData.recipientPhone || ''}
                onChange={(e) => handleChange('recipientPhone', e.target.value)}
                placeholder="08012345678"
                className={`w-full pl-12 pr-4 py-3.5 text-base border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                  errors.recipientPhone ? 'border-red-500' : 'border-gray-300'
                }`}
              />
            </div>
            {errors.recipientPhone && (
              <p className="text-red-500 text-sm mt-1">{errors.recipientPhone}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Email (for order updates)
            </label>
            <input
              type="email"
              value={formData.email || ''}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="your@email.com"
              className="w-full px-4 py-3.5 text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-green-600" />
            Where should we deliver?
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                State <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.state || ''}
                onChange={(e) => handleChange('state', e.target.value)}
                className={`w-full px-3 py-3.5 text-base border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 appearance-none bg-white ${
                  errors.state ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select</option>
                {NIGERIAN_STATES.map((state) => (
                  <option key={state.code} value={state.name}>
                    {state.name}
                  </option>
                ))}
              </select>
              {errors.state && (
                <p className="text-red-500 text-sm mt-1">{errors.state}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                LGA <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.lga || ''}
                onChange={(e) => handleChange('lga', e.target.value)}
                disabled={!formData.state}
                className={`w-full px-3 py-3.5 text-base border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 appearance-none bg-white disabled:bg-gray-100 ${
                  errors.lga ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select</option>
                {lgas.map((lga) => (
                  <option key={lga} value={lga}>
                    {lga}
                  </option>
                ))}
              </select>
              {errors.lga && (
                <p className="text-red-500 text-sm mt-1">{errors.lga}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Area / Neighborhood <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.area || ''}
              onChange={(e) => handleChange('area', e.target.value)}
              placeholder="e.g., Ikeja GRA, Surulere, Wuse 2"
              className={`w-full px-4 py-3.5 text-base border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                errors.area ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.area && (
              <p className="text-red-500 text-sm mt-1">{errors.area}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Landmark <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.landmark || ''}
              onChange={(e) => handleChange('landmark', e.target.value)}
              placeholder="e.g., Opposite Shoprite, Near First Bank"
              className={`w-full px-4 py-3.5 text-base border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                errors.landmark ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.landmark && (
              <p className="text-red-500 text-sm mt-1">{errors.landmark}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Landmark Type
            </label>
            <select
              value={formData.landmarkType || ''}
              onChange={(e) => handleChange('landmarkType', e.target.value)}
              className="w-full px-3 py-3.5 text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 appearance-none bg-white"
            >
              <option value="">Select type (optional)</option>
              {landmarkTypes.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowOptionalFields(!showOptionalFields)}
          className="flex items-center gap-2 text-green-600 font-medium text-sm w-full justify-center py-2"
        >
          {showOptionalFields ? (
            <>
              <ChevronUp className="w-4 h-4" />
              Hide additional details
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              Add more details (optional)
            </>
          )}
        </button>

        {showOptionalFields && (
          <div className="space-y-4 pb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Another Nearby Landmark
              </label>
              <input
                type="text"
                value={formData.nearbyLandmark || ''}
                onChange={(e) => handleChange('nearbyLandmark', e.target.value)}
                placeholder="Second landmark for easier finding"
                className="w-full px-4 py-3.5 text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  House/Plot No.
                </label>
                <input
                  type="text"
                  value={formData.houseNumber || ''}
                  onChange={(e) => handleChange('houseNumber', e.target.value)}
                  placeholder="e.g., Plot 5"
                  className="w-full px-4 py-3.5 text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Street Name
                </label>
                <input
                  type="text"
                  value={formData.streetName || ''}
                  onChange={(e) => handleChange('streetName', e.target.value)}
                  placeholder="Street name"
                  className="w-full px-4 py-3.5 text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Alternate Phone
              </label>
              <input
                type="tel"
                value={formData.alternatePhone || ''}
                onChange={(e) => handleChange('alternatePhone', e.target.value)}
                placeholder="Backup phone number"
                className="w-full px-4 py-3.5 text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Delivery Instructions
              </label>
              <textarea
                value={formData.deliveryInstructions || ''}
                onChange={(e) => handleChange('deliveryInstructions', e.target.value)}
                placeholder="Any special instructions for the rider..."
                rows={2}
                className="w-full px-4 py-3 text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
              />
            </div>
          </div>
        )}
      </div>

      <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 safe-area-bottom">
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white rounded-xl font-semibold text-lg transition-colors flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            'Continue to Delivery'
          )}
        </button>
      </div>
    </form>
  );
}
