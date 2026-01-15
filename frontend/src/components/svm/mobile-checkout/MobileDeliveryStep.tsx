'use client';

/**
 * Mobile Delivery Step
 * Wave F6: Mobile Checkout Redesign (SVM)
 * 
 * Shipping method selection with Nigeria-optimized display.
 * Touch-friendly, single-column layout.
 */

import { useState } from 'react';
import { Truck, Clock, Check, MapPin, AlertCircle } from 'lucide-react';
import { ShippingOption, formatNGN, NigeriaShippingAddress } from './types';

interface MobileDeliveryStepProps {
  shippingOptions: ShippingOption[];
  selectedOption?: ShippingOption;
  address: NigeriaShippingAddress;
  onSelect: (option: ShippingOption) => void;
  onSubmit: () => void;
  onBack: () => void;
  isLoading?: boolean;
}

export function MobileDeliveryStep({
  shippingOptions,
  selectedOption,
  address,
  onSelect,
  onSubmit,
  onBack,
  isLoading,
}: MobileDeliveryStepProps) {
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    if (!selectedOption) {
      setError('Please select a delivery method');
      return;
    }
    setError(null);
    onSubmit();
  };

  const formatDeliveryDays = (days: { min: number; max: number }) => {
    if (days.min === days.max) {
      return `${days.min} day${days.min > 1 ? 's' : ''}`;
    }
    return `${days.min}-${days.max} days`;
  };

  return (
    <div className="flex flex-col min-h-full">
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">Delivering to:</p>
              <p className="text-sm text-gray-600 truncate">{address.recipientName}</p>
              <p className="text-sm text-gray-500">
                Near {address.landmark}, {address.area}
              </p>
              <p className="text-sm text-gray-500">
                {address.lga}, {address.state}
              </p>
            </div>
            <button
              onClick={onBack}
              className="text-sm text-green-600 font-medium flex-shrink-0"
            >
              Edit
            </button>
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-3">
            <Truck className="w-5 h-5 text-green-600" />
            Choose delivery method
          </h3>

          {error && (
            <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse bg-gray-100 rounded-xl h-24" />
              ))}
            </div>
          ) : shippingOptions.length === 0 ? (
            <div className="text-center py-8">
              <Truck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">No delivery options available</p>
              <p className="text-gray-500 text-sm mt-1">
                Please check your delivery address
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {shippingOptions.map((option) => {
                const isSelected = selectedOption?.id === option.id;

                return (
                  <button
                    key={option.id}
                    onClick={() => onSelect(option)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                      isSelected
                        ? 'border-green-500 bg-green-50 ring-2 ring-green-100'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          isSelected
                            ? 'border-green-500 bg-green-500'
                            : 'border-gray-300'
                        }`}
                      >
                        {isSelected && <Check className="w-4 h-4 text-white" />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-gray-900">
                            {option.name}
                          </span>
                          <span
                            className={`font-bold ${
                              option.isFree ? 'text-green-600' : 'text-gray-900'
                            }`}
                          >
                            {option.isFree ? 'FREE' : formatNGN(option.fee)}
                          </span>
                        </div>

                        {option.carrier && (
                          <p className="text-sm text-gray-500 mt-0.5">
                            via {option.carrier}
                          </p>
                        )}

                        <div className="flex items-center gap-1.5 mt-2 text-sm text-gray-600">
                          <Clock className="w-4 h-4" />
                          <span>{formatDeliveryDays(option.estimatedDays)}</span>
                        </div>

                        {option.isLocalPickup && (
                          <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium">
                            <MapPin className="w-3 h-3" />
                            Pickup location
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 space-y-3 safe-area-bottom">
        <button
          onClick={handleSubmit}
          disabled={!selectedOption || isLoading}
          className="w-full py-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white rounded-xl font-semibold text-lg transition-colors"
        >
          Continue to Payment
        </button>
        <button
          onClick={onBack}
          className="w-full py-3 text-gray-600 font-medium"
        >
          Back
        </button>
      </div>
    </div>
  );
}
