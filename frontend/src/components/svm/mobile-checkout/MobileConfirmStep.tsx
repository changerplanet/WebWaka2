'use client';

/**
 * Mobile Confirm Step
 * Wave F6: Mobile Checkout Redesign (SVM)
 * 
 * Order review and confirmation with NGN formatting.
 * Trust signals and clear order summary.
 */

import { useState } from 'react';
import {
  MapPin,
  Truck,
  CreditCard,
  Package,
  Shield,
  Check,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { NigeriaShippingAddress, ShippingOption, PaymentMethod, formatNGN } from './types';

interface CartItem {
  productId: string;
  productName: string;
  variantName?: string;
  imageUrl?: string;
  unitPrice: number;
  quantity: number;
}

interface MobileConfirmStepProps {
  address: NigeriaShippingAddress;
  shippingOption: ShippingOption;
  paymentMethod: PaymentMethod;
  items: CartItem[];
  subtotal: number;
  discountTotal: number;
  shippingTotal: number;
  taxTotal: number;
  paymentFee: number;
  grandTotal: number;
  onSubmit: () => void;
  onBack: () => void;
  onEditAddress: () => void;
  onEditDelivery: () => void;
  onEditPayment: () => void;
  isLoading?: boolean;
}

export function MobileConfirmStep({
  address,
  shippingOption,
  paymentMethod,
  items,
  subtotal,
  discountTotal,
  shippingTotal,
  taxTotal,
  paymentFee,
  grandTotal,
  onSubmit,
  onBack,
  onEditAddress,
  onEditDelivery,
  onEditPayment,
  isLoading,
}: MobileConfirmStepProps) {
  const [showItems, setShowItems] = useState(false);

  return (
    <div className="flex flex-col min-h-full">
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <h3 className="font-semibold text-gray-900 text-lg">Review your order</h3>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Delivery Address</p>
                  <p className="text-sm text-gray-600 mt-1">{address.recipientName}</p>
                  <p className="text-sm text-gray-500">{address.recipientPhone}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Near {address.landmark}, {address.area}
                  </p>
                  <p className="text-sm text-gray-500">
                    {address.lga}, {address.state}
                  </p>
                </div>
              </div>
              <button
                onClick={onEditAddress}
                className="text-sm text-green-600 font-medium"
              >
                Edit
              </button>
            </div>
          </div>

          <div className="p-4 border-b border-gray-100">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <Truck className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Delivery Method</p>
                  <p className="text-sm text-gray-600 mt-1">{shippingOption.name}</p>
                  <p className="text-sm text-gray-500">
                    {shippingOption.estimatedDays.min === shippingOption.estimatedDays.max
                      ? `${shippingOption.estimatedDays.min} day${shippingOption.estimatedDays.min > 1 ? 's' : ''}`
                      : `${shippingOption.estimatedDays.min}-${shippingOption.estimatedDays.max} days`}
                  </p>
                </div>
              </div>
              <button
                onClick={onEditDelivery}
                className="text-sm text-green-600 font-medium"
              >
                Edit
              </button>
            </div>
          </div>

          <div className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <CreditCard className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Payment Method</p>
                  <p className="text-sm text-gray-600 mt-1">{paymentMethod.name}</p>
                </div>
              </div>
              <button
                onClick={onEditPayment}
                className="text-sm text-green-600 font-medium"
              >
                Edit
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <button
            onClick={() => setShowItems(!showItems)}
            className="w-full p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <Package className="w-5 h-5 text-green-600" />
              <span className="font-medium text-gray-900">
                {items.length} item{items.length > 1 ? 's' : ''} in your order
              </span>
            </div>
            {showItems ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {showItems && (
            <div className="border-t border-gray-100 divide-y divide-gray-100">
              {items.map((item) => (
                <div
                  key={`${item.productId}`}
                  className="p-4 flex gap-3"
                >
                  <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-6 h-6 text-gray-300" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {item.productName}
                    </p>
                    {item.variantName && (
                      <p className="text-sm text-gray-500">{item.variantName}</p>
                    )}
                    <p className="text-sm text-gray-500 mt-1">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-medium text-gray-900">
                    {formatNGN(item.unitPrice * item.quantity)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal</span>
            <span className="text-gray-900">{formatNGN(subtotal)}</span>
          </div>

          {discountTotal > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-green-600">Discount</span>
              <span className="text-green-600">-{formatNGN(discountTotal)}</span>
            </div>
          )}

          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Delivery</span>
            <span className="text-gray-900">
              {shippingTotal === 0 ? 'FREE' : formatNGN(shippingTotal)}
            </span>
          </div>

          {taxTotal > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">VAT</span>
              <span className="text-gray-900">{formatNGN(taxTotal)}</span>
            </div>
          )}

          {paymentFee > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Payment Fee</span>
              <span className="text-gray-900">{formatNGN(paymentFee)}</span>
            </div>
          )}

          <div className="flex justify-between pt-3 border-t border-gray-200">
            <span className="font-bold text-gray-900 text-lg">Total</span>
            <span className="font-bold text-green-600 text-lg">
              {formatNGN(grandTotal)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Shield className="w-4 h-4 text-green-600" />
          <span>Your order is secure and protected</span>
        </div>
      </div>

      <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 space-y-3 safe-area-bottom">
        <button
          onClick={onSubmit}
          disabled={isLoading}
          className="w-full py-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white rounded-xl font-bold text-lg transition-colors flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Placing Order...
            </>
          ) : (
            <>
              <Check className="w-5 h-5" />
              Place Order - {formatNGN(grandTotal)}
            </>
          )}
        </button>
        <button
          onClick={onBack}
          disabled={isLoading}
          className="w-full py-3 text-gray-600 font-medium disabled:opacity-50"
        >
          Back
        </button>
      </div>
    </div>
  );
}
