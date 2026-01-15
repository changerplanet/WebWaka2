/**
 * Mobile Checkout Types
 * Wave F6: Mobile Checkout Redesign (SVM)
 * 
 * Types for Nigeria-optimized mobile checkout flow.
 */

export type MobileCheckoutStep = 'address' | 'delivery' | 'payment' | 'confirm';

export interface MobileCheckoutState {
  currentStep: MobileCheckoutStep;
  isProcessing: boolean;
  error: string | null;
}

export interface NigeriaShippingAddress {
  recipientName: string;
  recipientPhone: string;
  alternatePhone?: string;
  email?: string;
  state: string;
  lga: string;
  area: string;
  landmark: string;
  landmarkType?: string;
  nearbyLandmark?: string;
  streetName?: string;
  houseNumber?: string;
  buildingName?: string;
  deliveryInstructions?: string;
}

export interface ShippingOption {
  id: string;
  name: string;
  carrier?: string;
  fee: number;
  estimatedDays: { min: number; max: number };
  isFree: boolean;
  isLocalPickup?: boolean;
}

export interface PaymentMethod {
  code: string;
  name: string;
  description: string;
  icon: string;
  fee: number;
  feeType: 'fixed' | 'percentage';
  isAvailable: boolean;
  unavailableReason?: string;
}

export const MOBILE_CHECKOUT_STEPS: { key: MobileCheckoutStep; label: string; shortLabel: string }[] = [
  { key: 'address', label: 'Delivery Address', shortLabel: 'Address' },
  { key: 'delivery', label: 'Delivery Method', shortLabel: 'Delivery' },
  { key: 'payment', label: 'Payment', shortLabel: 'Pay' },
  { key: 'confirm', label: 'Confirm Order', shortLabel: 'Confirm' },
];

export const NIGERIA_PAYMENT_METHODS: PaymentMethod[] = [
  {
    code: 'CARD',
    name: 'Debit/Credit Card',
    description: 'Pay with your card via Paystack',
    icon: 'credit-card',
    fee: 0,
    feeType: 'percentage',
    isAvailable: true,
  },
  {
    code: 'BANK_TRANSFER',
    name: 'Bank Transfer',
    description: 'Transfer to our bank account',
    icon: 'building',
    fee: 0,
    feeType: 'fixed',
    isAvailable: true,
  },
  {
    code: 'COD',
    name: 'Pay on Delivery',
    description: 'Pay cash when you receive your order',
    icon: 'banknote',
    fee: 500,
    feeType: 'fixed',
    isAvailable: true,
  },
  {
    code: 'USSD',
    name: 'USSD',
    description: 'Pay using your bank USSD code',
    icon: 'smartphone',
    fee: 0,
    feeType: 'fixed',
    isAvailable: true,
  },
];

export function formatNGN(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getStepIndex(step: MobileCheckoutStep): number {
  return MOBILE_CHECKOUT_STEPS.findIndex(s => s.key === step);
}

export function getNextStep(currentStep: MobileCheckoutStep): MobileCheckoutStep | null {
  const currentIndex = getStepIndex(currentStep);
  if (currentIndex < MOBILE_CHECKOUT_STEPS.length - 1) {
    return MOBILE_CHECKOUT_STEPS[currentIndex + 1].key;
  }
  return null;
}

export function getPreviousStep(currentStep: MobileCheckoutStep): MobileCheckoutStep | null {
  const currentIndex = getStepIndex(currentStep);
  if (currentIndex > 0) {
    return MOBILE_CHECKOUT_STEPS[currentIndex - 1].key;
  }
  return null;
}
