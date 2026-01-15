'use client';

/**
 * Landmark Address Form Component
 * Wave F5: Landmark-Based Addressing (SVM)
 * 
 * Mobile-first address form optimized for Nigerian delivery addresses.
 * Uses landmarks as primary navigation points.
 */

import { useState, useEffect } from 'react';
import {
  LandmarkAddress,
  LandmarkType,
  AddressLabel,
  AddressValidationResult,
  NIGERIAN_STATES,
  LANDMARK_TYPE_LABELS,
  ADDRESS_LABEL_LABELS,
  getLGAsForState,
  getStateByName,
} from '@/lib/commerce/landmark-address';

interface LandmarkAddressFormProps {
  initialAddress?: Partial<LandmarkAddress>;
  onSubmit: (address: LandmarkAddress) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  submitLabel?: string;
}

export function LandmarkAddressForm({
  initialAddress,
  onSubmit,
  onCancel,
  isLoading,
  submitLabel = 'Save Address',
}: LandmarkAddressFormProps) {
  const [formData, setFormData] = useState<Partial<LandmarkAddress>>({
    recipientName: '',
    recipientPhone: '',
    alternatePhone: '',
    state: '',
    lga: '',
    city: '',
    area: '',
    landmark: '',
    landmarkType: undefined,
    nearbyLandmark: '',
    streetName: '',
    houseNumber: '',
    buildingName: '',
    floor: '',
    deliveryInstructions: '',
    isDefault: false,
    label: 'HOME',
    ...initialAddress,
  });

  const [lgas, setLgas] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showOptionalFields, setShowOptionalFields] = useState(false);

  useEffect(() => {
    if (formData.state) {
      const state = getStateByName(formData.state);
      if (state) {
        setLgas(state.lgas);
      }
    } else {
      setLgas([]);
    }
  }, [formData.state]);

  const handleChange = (field: keyof LandmarkAddress, value: any) => {
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
      newErrors.recipientName = 'Please enter recipient name';
    }

    if (!formData.recipientPhone?.trim()) {
      newErrors.recipientPhone = 'Please enter phone number';
    }

    if (!formData.state?.trim()) {
      newErrors.state = 'Please select a state';
    }

    if (!formData.lga?.trim()) {
      newErrors.lga = 'Please select a Local Government Area';
    }

    if (!formData.area?.trim()) {
      newErrors.area = 'Please enter your area/neighborhood';
    }

    if (!formData.landmark?.trim()) {
      newErrors.landmark = 'Please enter a landmark near your location';
    } else if (formData.landmark.length < 5) {
      newErrors.landmark = 'Please provide a more descriptive landmark';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    await onSubmit(formData as LandmarkAddress);
  };

  const landmarkTypes = Object.entries(LANDMARK_TYPE_LABELS) as [LandmarkType, string][];
  const addressLabels = Object.entries(ADDRESS_LABEL_LABELS) as [AddressLabel, string][];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-800">
        <p className="font-medium">Tip: Use landmarks for easier delivery</p>
        <p className="text-green-700">Describe your location using well-known places nearby like churches, markets, or bus stops.</p>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900">Recipient Information</h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Recipient Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.recipientName || ''}
            onChange={(e) => handleChange('recipientName', e.target.value)}
            placeholder="Full name of person receiving delivery"
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
              errors.recipientName ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.recipientName && (
            <p className="text-red-500 text-sm mt-1">{errors.recipientName}</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={formData.recipientPhone || ''}
              onChange={(e) => handleChange('recipientPhone', e.target.value)}
              placeholder="e.g., 08012345678"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                errors.recipientPhone ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.recipientPhone && (
              <p className="text-red-500 text-sm mt-1">{errors.recipientPhone}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Alternate Phone
            </label>
            <input
              type="tel"
              value={formData.alternatePhone || ''}
              onChange={(e) => handleChange('alternatePhone', e.target.value)}
              placeholder="Backup number (optional)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900">Location</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              State <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.state || ''}
              onChange={(e) => {
                handleChange('state', e.target.value);
                handleChange('lga', '');
              }}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                errors.state ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select State</option>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Local Government Area <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.lga || ''}
              onChange={(e) => handleChange('lga', e.target.value)}
              disabled={!formData.state}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100 ${
                errors.lga ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select LGA</option>
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
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Area / Neighborhood <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.area || ''}
            onChange={(e) => handleChange('area', e.target.value)}
            placeholder="e.g., Ikeja GRA, Surulere, Wuse 2"
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
              errors.area ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.area && (
            <p className="text-red-500 text-sm mt-1">{errors.area}</p>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900">Landmark Details</h3>
        <p className="text-sm text-gray-600">Help us find you easily by describing nearby landmarks</p>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Primary Landmark <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.landmark || ''}
            onChange={(e) => handleChange('landmark', e.target.value)}
            placeholder="e.g., Opposite Shoprite, Behind First Bank, Near Obalende Bus Stop"
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
              errors.landmark ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.landmark && (
            <p className="text-red-500 text-sm mt-1">{errors.landmark}</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Landmark Type
            </label>
            <select
              value={formData.landmarkType || ''}
              onChange={(e) => handleChange('landmarkType', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="">Select Type (optional)</option>
              {landmarkTypes.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Another Nearby Landmark
            </label>
            <input
              type="text"
              value={formData.nearbyLandmark || ''}
              onChange={(e) => handleChange('nearbyLandmark', e.target.value)}
              placeholder="Second landmark for easier finding"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setShowOptionalFields(!showOptionalFields)}
        className="text-green-600 font-medium text-sm flex items-center gap-1"
      >
        <svg
          className={`w-4 h-4 transition-transform ${showOptionalFields ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
        {showOptionalFields ? 'Hide' : 'Show'} additional details (street, house number)
      </button>

      {showOptionalFields && (
        <div className="space-y-4 pl-4 border-l-2 border-gray-200">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                House/Plot Number
              </label>
              <input
                type="text"
                value={formData.houseNumber || ''}
                onChange={(e) => handleChange('houseNumber', e.target.value)}
                placeholder="e.g., Plot 5, No. 12"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Building Name
              </label>
              <input
                type="text"
                value={formData.buildingName || ''}
                onChange={(e) => handleChange('buildingName', e.target.value)}
                placeholder="e.g., Silverbird Towers"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Street Name
            </label>
            <input
              type="text"
              value={formData.streetName || ''}
              onChange={(e) => handleChange('streetName', e.target.value)}
              placeholder="Street name if known"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Floor/Apartment
            </label>
            <input
              type="text"
              value={formData.floor || ''}
              onChange={(e) => handleChange('floor', e.target.value)}
              placeholder="e.g., 3rd Floor, Flat 2A"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Delivery Instructions
        </label>
        <textarea
          value={formData.deliveryInstructions || ''}
          onChange={(e) => handleChange('deliveryInstructions', e.target.value)}
          placeholder="Any special instructions for the delivery person..."
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
        />
      </div>

      <div className="flex flex-wrap gap-4 items-center">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Address Label
          </label>
          <div className="flex gap-2">
            {addressLabels.map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => handleChange('label', value)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  formData.label === value
                    ? 'bg-green-600 text-white border-green-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-green-500'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.isDefault || false}
            onChange={(e) => handleChange('isDefault', e.target.checked)}
            className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
          />
          <span className="text-sm text-gray-700">Set as default address</span>
        </label>
      </div>

      <div className="flex gap-3 pt-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 py-3 px-4 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 py-3 px-4 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isLoading && (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          )}
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
