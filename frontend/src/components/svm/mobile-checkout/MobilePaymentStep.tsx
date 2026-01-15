'use client';

/**
 * Mobile Payment Step
 * Wave F6: Mobile Checkout Redesign (SVM)
 * 
 * Nigeria payment methods with COD, Bank Transfer, Card options.
 * Clear trust signals and payment method explanations.
 */

import { useState } from 'react';
import {
  CreditCard,
  Building2,
  Banknote,
  Smartphone,
  Check,
  Shield,
  AlertCircle,
  Info,
} from 'lucide-react';
import { PaymentMethod, formatNGN, NIGERIA_PAYMENT_METHODS } from './types';

interface MobilePaymentStepProps {
  paymentMethods?: PaymentMethod[];
  selectedMethod?: PaymentMethod;
  orderTotal: number;
  onSelect: (method: PaymentMethod) => void;
  onSubmit: () => void;
  onBack: () => void;
  isLoading?: boolean;
}

const PAYMENT_ICONS: Record<string, any> = {
  'credit-card': CreditCard,
  building: Building2,
  banknote: Banknote,
  smartphone: Smartphone,
};

export function MobilePaymentStep({
  paymentMethods = NIGERIA_PAYMENT_METHODS,
  selectedMethod,
  orderTotal,
  onSelect,
  onSubmit,
  onBack,
  isLoading,
}: MobilePaymentStepProps) {
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    if (!selectedMethod) {
      setError('Please select a payment method');
      return;
    }
    setError(null);
    onSubmit();
  };

  const calculateFee = (method: PaymentMethod): number => {
    if (method.feeType === 'percentage') {
      return Math.round(orderTotal * method.fee / 100);
    }
    return method.fee;
  };

  const availableMethods = paymentMethods.filter((m) => m.isAvailable);
  const unavailableMethods = paymentMethods.filter((m) => !m.isAvailable);

  return (
    <div className="flex flex-col min-h-full">
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <div>
          <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-3">
            <CreditCard className="w-5 h-5 text-green-600" />
            How would you like to pay?
          </h3>

          {error && (
            <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-3">
            {availableMethods.map((method) => {
              const isSelected = selectedMethod?.code === method.code;
              const Icon = PAYMENT_ICONS[method.icon] || CreditCard;
              const fee = calculateFee(method);

              return (
                <button
                  key={method.code}
                  onClick={() => onSelect(method)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    isSelected
                      ? 'border-green-500 bg-green-50 ring-2 ring-green-100'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        isSelected ? 'bg-green-500' : 'bg-gray-100'
                      }`}
                    >
                      <Icon
                        className={`w-5 h-5 ${
                          isSelected ? 'text-white' : 'text-gray-600'
                        }`}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-900">
                          {method.name}
                        </span>
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                            isSelected
                              ? 'border-green-500 bg-green-500'
                              : 'border-gray-300'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>
                      </div>

                      <p className="text-sm text-gray-500 mt-0.5">
                        {method.description}
                      </p>

                      {fee > 0 && (
                        <p className="text-sm text-amber-600 mt-1 font-medium">
                          +{formatNGN(fee)} fee
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {unavailableMethods.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-gray-500 mb-2">Unavailable for this order:</p>
              <div className="space-y-2">
                {unavailableMethods.map((method) => {
                  const Icon = PAYMENT_ICONS[method.icon] || CreditCard;

                  return (
                    <div
                      key={method.code}
                      className="p-3 rounded-xl border border-gray-100 bg-gray-50 opacity-60"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center">
                          <Icon className="w-4 h-4 text-gray-400" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-500">{method.name}</p>
                          {method.unavailableReason && (
                            <p className="text-xs text-gray-400">
                              {method.unavailableReason}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {selectedMethod?.code === 'COD' && (() => {
          const codFee = calculateFee(selectedMethod);
          const totalWithFee = orderTotal + codFee;
          return (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex gap-3">
                <Banknote className="w-6 h-6 text-amber-600 flex-shrink-0" />
                <div className="space-y-2">
                  <p className="font-semibold text-amber-800">Pay on Delivery - Important</p>
                  <ul className="text-sm text-amber-700 space-y-1">
                    <li>• Please prepare exact change ({formatNGN(totalWithFee)})</li>
                    <li>• Our delivery rider may not have change for large notes (₦1,000+)</li>
                    {codFee > 0 && (
                      <li>• A {formatNGN(codFee)} COD fee applies to this order</li>
                    )}
                    <li>• Pay only when you receive and inspect your items</li>
                  </ul>
                </div>
              </div>
            </div>
          );
        })()}

        {selectedMethod?.code === 'BANK_TRANSFER' && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex gap-3">
              <Building2 className="w-6 h-6 text-blue-600 flex-shrink-0" />
              <div className="space-y-2">
                <p className="font-semibold text-blue-800">Bank Transfer Payment</p>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>1. Place your order to see our bank account details</li>
                  <li>2. Transfer the exact amount shown to our account</li>
                  <li>3. Tap "I Have Paid" button after making your transfer</li>
                  <li>4. We'll confirm and process your order (5-30 mins)</li>
                </ul>
                <p className="text-xs text-blue-600 mt-2 font-medium">
                  Tip: Use your Order Number as payment reference for faster confirmation.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
          <Shield className="w-4 h-4 text-green-600" />
          <span>Your payment is secure and protected</span>
        </div>
      </div>

      <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 space-y-3 safe-area-bottom">
        <button
          onClick={handleSubmit}
          disabled={!selectedMethod || isLoading}
          className="w-full py-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white rounded-xl font-semibold text-lg transition-colors"
        >
          Review Order
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
