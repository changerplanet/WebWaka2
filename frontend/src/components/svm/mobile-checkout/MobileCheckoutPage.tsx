'use client';

/**
 * Mobile Checkout Page
 * Wave F6: Mobile Checkout Redesign (SVM)
 * 
 * UI orchestration for mobile-first checkout flow.
 * Pure UI rendering - all state managed by parent.
 * Totals, selections, and options are all provided by parent to ensure consistency.
 */

import { useCallback } from 'react';
import { ArrowLeft, ShoppingBag } from 'lucide-react';
import { MobileCheckoutProgress } from './MobileCheckoutProgress';
import { MobileAddressStep } from './MobileAddressStep';
import { MobileDeliveryStep } from './MobileDeliveryStep';
import { MobilePaymentStep } from './MobilePaymentStep';
import { MobileConfirmStep } from './MobileConfirmStep';
import {
  MobileCheckoutStep,
  NigeriaShippingAddress,
  ShippingOption,
  PaymentMethod,
  getPreviousStep,
  NIGERIA_PAYMENT_METHODS,
} from './types';

interface CartItem {
  productId: string;
  variantId?: string;
  productName: string;
  variantName?: string;
  imageUrl?: string;
  unitPrice: number;
  quantity: number;
}

interface CheckoutTotals {
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  shippingTotal: number;
  paymentFee: number;
  grandTotal: number;
}

interface MobileCheckoutPageProps {
  items: CartItem[];
  currentStep: MobileCheckoutStep;
  address: NigeriaShippingAddress | null;
  shippingOptions: ShippingOption[];
  selectedShipping: ShippingOption | null;
  paymentMethods?: PaymentMethod[];
  selectedPayment: PaymentMethod | null;
  totals: CheckoutTotals;
  isLoading?: boolean;
  error?: string | null;
  onStepChange: (step: MobileCheckoutStep) => void;
  onBack: () => void;
  onAddressSubmit: (address: NigeriaShippingAddress) => void;
  onShippingSelect: (option: ShippingOption) => void;
  onPaymentSelect: (method: PaymentMethod) => void;
  onPlaceOrder: () => void;
}

export function MobileCheckoutPage({
  items,
  currentStep,
  address,
  shippingOptions,
  selectedShipping,
  paymentMethods = NIGERIA_PAYMENT_METHODS,
  selectedPayment,
  totals,
  isLoading = false,
  error = null,
  onStepChange,
  onBack,
  onAddressSubmit,
  onShippingSelect,
  onPaymentSelect,
  onPlaceOrder,
}: MobileCheckoutPageProps) {

  const handleAddressSubmit = useCallback((newAddress: NigeriaShippingAddress) => {
    onAddressSubmit(newAddress);
  }, [onAddressSubmit]);

  const handleDeliverySubmit = useCallback(() => {
    if (selectedShipping) {
      onStepChange('payment');
    }
  }, [selectedShipping, onStepChange]);

  const handlePaymentSubmit = useCallback(() => {
    if (selectedPayment) {
      onStepChange('confirm');
    }
  }, [selectedPayment, onStepChange]);

  const goBack = useCallback(() => {
    const prevStep = getPreviousStep(currentStep);
    if (prevStep) {
      onStepChange(prevStep);
    } else {
      onBack();
    }
  }, [currentStep, onStepChange, onBack]);

  const goToStep = useCallback((step: MobileCheckoutStep) => {
    onStepChange(step);
  }, [onStepChange]);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
        <ShoppingBag className="w-16 h-16 text-gray-300 mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
        <p className="text-gray-500 mb-6">Add some products before checking out</p>
        <button
          onClick={onBack}
          className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors"
        >
          Continue Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button
          onClick={goBack}
          className="p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="font-semibold text-gray-900">Checkout</h1>
      </header>

      <MobileCheckoutProgress
        currentStep={currentStep}
        onStepClick={goToStep}
      />

      {error && (
        <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="flex-1 flex flex-col">
        {currentStep === 'address' && (
          <MobileAddressStep
            initialAddress={address || undefined}
            onSubmit={handleAddressSubmit}
            onBack={onBack}
            isLoading={isLoading}
          />
        )}

        {currentStep === 'delivery' && address && (
          <MobileDeliveryStep
            shippingOptions={shippingOptions}
            selectedOption={selectedShipping || undefined}
            address={address}
            onSelect={onShippingSelect}
            onSubmit={handleDeliverySubmit}
            onBack={goBack}
            isLoading={isLoading}
          />
        )}

        {currentStep === 'payment' && (
          <MobilePaymentStep
            paymentMethods={paymentMethods}
            selectedMethod={selectedPayment || undefined}
            orderTotal={totals.subtotal - totals.discountTotal + totals.shippingTotal + totals.taxTotal}
            onSelect={onPaymentSelect}
            onSubmit={handlePaymentSubmit}
            onBack={goBack}
            isLoading={isLoading}
          />
        )}

        {currentStep === 'confirm' && address && selectedShipping && selectedPayment && (
          <MobileConfirmStep
            address={address}
            shippingOption={selectedShipping}
            paymentMethod={selectedPayment}
            items={items}
            subtotal={totals.subtotal}
            discountTotal={totals.discountTotal}
            shippingTotal={totals.shippingTotal}
            taxTotal={totals.taxTotal}
            paymentFee={totals.paymentFee}
            grandTotal={totals.grandTotal}
            onSubmit={onPlaceOrder}
            onBack={goBack}
            onEditAddress={() => onStepChange('address')}
            onEditDelivery={() => onStepChange('delivery')}
            onEditPayment={() => onStepChange('payment')}
            isLoading={isLoading}
          />
        )}
      </div>
    </div>
  );
}
