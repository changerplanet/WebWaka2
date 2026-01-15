'use client';

/**
 * Mobile Checkout Page
 * Wave F6: Mobile Checkout Redesign (SVM)
 * 
 * Orchestrates the mobile-first checkout flow for Nigeria.
 * Integrates all step components into a seamless experience.
 */

import { useState, useCallback } from 'react';
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
  getNextStep,
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

interface MobileCheckoutPageProps {
  items: CartItem[];
  subtotal: number;
  discountTotal?: number;
  taxTotal?: number;
  tenantId: string;
  onBack: () => void;
  onComplete: (result: { orderId: string; orderNumber: string }) => void;
  fetchShippingOptions?: (address: NigeriaShippingAddress) => Promise<ShippingOption[]>;
  fetchPaymentMethods?: (amount: number, state: string) => Promise<PaymentMethod[]>;
  submitOrder?: (data: {
    address: NigeriaShippingAddress;
    shipping: ShippingOption;
    payment: PaymentMethod;
    items: CartItem[];
  }) => Promise<{ success: boolean; orderId?: string; orderNumber?: string; error?: string }>;
}

const MOCK_SHIPPING_OPTIONS: ShippingOption[] = [
  {
    id: 'standard',
    name: 'Standard Delivery',
    carrier: 'GIG Logistics',
    fee: 2500,
    estimatedDays: { min: 3, max: 5 },
    isFree: false,
  },
  {
    id: 'express',
    name: 'Express Delivery',
    carrier: 'Kwik Delivery',
    fee: 4500,
    estimatedDays: { min: 1, max: 2 },
    isFree: false,
  },
  {
    id: 'pickup',
    name: 'Pickup from Store',
    fee: 0,
    estimatedDays: { min: 1, max: 1 },
    isFree: true,
    isLocalPickup: true,
  },
];

export function MobileCheckoutPage({
  items,
  subtotal,
  discountTotal = 0,
  taxTotal = 0,
  tenantId,
  onBack,
  onComplete,
  fetchShippingOptions,
  fetchPaymentMethods,
  submitOrder,
}: MobileCheckoutPageProps) {
  const [currentStep, setCurrentStep] = useState<MobileCheckoutStep>('address');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [address, setAddress] = useState<NigeriaShippingAddress | null>(null);
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<ShippingOption | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(NIGERIA_PAYMENT_METHODS);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod | null>(null);

  const shippingTotal = selectedShipping?.fee || 0;
  const paymentFee = selectedPayment?.fee || 0;
  const grandTotal = subtotal - discountTotal + shippingTotal + taxTotal + paymentFee;

  const handleAddressSubmit = useCallback(async (newAddress: NigeriaShippingAddress) => {
    setIsLoading(true);
    setError(null);
    setAddress(newAddress);

    try {
      if (fetchShippingOptions) {
        const options = await fetchShippingOptions(newAddress);
        setShippingOptions(options);
      } else {
        await new Promise(resolve => setTimeout(resolve, 500));
        setShippingOptions(MOCK_SHIPPING_OPTIONS);
      }

      if (fetchPaymentMethods) {
        const methods = await fetchPaymentMethods(subtotal, newAddress.state);
        setPaymentMethods(methods);
      }

      setCurrentStep('delivery');
    } catch (err) {
      setError('Failed to load delivery options. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [fetchShippingOptions, fetchPaymentMethods, subtotal]);

  const handleDeliverySelect = useCallback((option: ShippingOption) => {
    setSelectedShipping(option);
  }, []);

  const handleDeliverySubmit = useCallback(() => {
    if (selectedShipping) {
      setCurrentStep('payment');
    }
  }, [selectedShipping]);

  const handlePaymentSelect = useCallback((method: PaymentMethod) => {
    setSelectedPayment(method);
  }, []);

  const handlePaymentSubmit = useCallback(() => {
    if (selectedPayment) {
      setCurrentStep('confirm');
    }
  }, [selectedPayment]);

  const handlePlaceOrder = useCallback(async () => {
    if (!address || !selectedShipping || !selectedPayment) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (submitOrder) {
        const result = await submitOrder({
          address,
          shipping: selectedShipping,
          payment: selectedPayment,
          items,
        });

        if (result.success && result.orderId && result.orderNumber) {
          onComplete({
            orderId: result.orderId,
            orderNumber: result.orderNumber,
          });
        } else {
          setError(result.error || 'Failed to place order. Please try again.');
        }
      } else {
        await new Promise(resolve => setTimeout(resolve, 1500));
        const mockOrderId = `order_${Date.now()}`;
        const mockOrderNumber = `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
        
        onComplete({
          orderId: mockOrderId,
          orderNumber: mockOrderNumber,
        });
      }
    } catch (err) {
      setError('Failed to place order. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [address, selectedShipping, selectedPayment, items, submitOrder, onComplete]);

  const goBack = useCallback(() => {
    const prevStep = getPreviousStep(currentStep);
    if (prevStep) {
      setCurrentStep(prevStep);
    } else {
      onBack();
    }
  }, [currentStep, onBack]);

  const goToStep = useCallback((step: MobileCheckoutStep) => {
    setCurrentStep(step);
  }, []);

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
            onSelect={handleDeliverySelect}
            onSubmit={handleDeliverySubmit}
            onBack={goBack}
            isLoading={isLoading}
          />
        )}

        {currentStep === 'payment' && (
          <MobilePaymentStep
            paymentMethods={paymentMethods}
            selectedMethod={selectedPayment || undefined}
            orderTotal={subtotal + shippingTotal}
            onSelect={handlePaymentSelect}
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
            subtotal={subtotal}
            discountTotal={discountTotal}
            shippingTotal={shippingTotal}
            taxTotal={taxTotal}
            paymentFee={paymentFee}
            grandTotal={grandTotal}
            onSubmit={handlePlaceOrder}
            onBack={goBack}
            onEditAddress={() => setCurrentStep('address')}
            onEditDelivery={() => setCurrentStep('delivery')}
            onEditPayment={() => setCurrentStep('payment')}
            isLoading={isLoading}
          />
        )}
      </div>
    </div>
  );
}
