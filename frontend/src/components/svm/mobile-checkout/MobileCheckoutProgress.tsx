'use client';

/**
 * Mobile Checkout Progress Indicator
 * Wave F6: Mobile Checkout Redesign (SVM)
 * 
 * Compact progress indicator optimized for mobile screens.
 * Shows current step with minimal vertical space usage.
 */

import { Check } from 'lucide-react';
import { MobileCheckoutStep, MOBILE_CHECKOUT_STEPS, getStepIndex } from './types';

interface MobileCheckoutProgressProps {
  currentStep: MobileCheckoutStep;
  onStepClick?: (step: MobileCheckoutStep) => void;
}

export function MobileCheckoutProgress({ currentStep, onStepClick }: MobileCheckoutProgressProps) {
  const currentIndex = getStepIndex(currentStep);

  return (
    <div className="bg-white border-b border-gray-100 px-4 py-3">
      <div className="flex items-center justify-between">
        {MOBILE_CHECKOUT_STEPS.map((step, index) => {
          const isActive = index === currentIndex;
          const isCompleted = index < currentIndex;
          const isClickable = isCompleted && onStepClick;

          return (
            <div key={step.key} className="flex items-center">
              <button
                onClick={() => isClickable && onStepClick(step.key)}
                disabled={!isClickable}
                className={`flex flex-col items-center ${isClickable ? 'cursor-pointer' : 'cursor-default'}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    isCompleted
                      ? 'bg-green-500 text-white'
                      : isActive
                      ? 'bg-green-600 text-white ring-4 ring-green-100'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : index + 1}
                </div>
                <span
                  className={`text-xs mt-1 font-medium ${
                    isActive ? 'text-green-600' : isCompleted ? 'text-green-600' : 'text-gray-400'
                  }`}
                >
                  {step.shortLabel}
                </span>
              </button>

              {index < MOBILE_CHECKOUT_STEPS.length - 1 && (
                <div
                  className={`w-8 sm:w-12 h-0.5 mx-1 ${
                    index < currentIndex ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
