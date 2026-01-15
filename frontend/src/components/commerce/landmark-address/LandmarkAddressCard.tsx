'use client';

/**
 * Landmark Address Card Component
 * Wave F5: Landmark-Based Addressing (SVM)
 * 
 * Displays a saved landmark address with actions.
 */

import {
  SavedAddress,
  ADDRESS_LABEL_LABELS,
  formatShortAddress,
  AddressLabel,
} from '@/lib/commerce/landmark-address';

interface LandmarkAddressCardProps {
  address: SavedAddress;
  isSelected?: boolean;
  onSelect?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onSetDefault?: () => void;
  showActions?: boolean;
}

export function LandmarkAddressCard({
  address,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onSetDefault,
  showActions = true,
}: LandmarkAddressCardProps) {
  const labelIcon = {
    HOME: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    WORK: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    OTHER: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  };

  return (
    <div
      className={`bg-white rounded-lg border p-4 transition-colors ${
        isSelected
          ? 'border-green-500 ring-2 ring-green-100'
          : 'border-gray-200 hover:border-gray-300'
      } ${onSelect ? 'cursor-pointer' : ''}`}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-green-600">
              {labelIcon[address.label as keyof typeof labelIcon] || labelIcon.OTHER}
            </span>
            <span className="font-medium text-gray-900">
              {ADDRESS_LABEL_LABELS[address.label as AddressLabel] || 'Address'}
            </span>
            {address.isDefault && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                Default
              </span>
            )}
          </div>

          <p className="font-medium text-gray-900 mb-1">{address.recipientName}</p>
          <p className="text-sm text-gray-600 mb-1">{address.recipientPhone}</p>
          
          <p className="text-sm text-gray-700">
            <span className="font-medium">Near:</span> {address.landmark}
          </p>
          
          <p className="text-sm text-gray-500 mt-1">
            {address.area}, {address.lga}, {address.state}
          </p>

          {address.deliveryInstructions && (
            <p className="text-xs text-gray-500 mt-2 italic">
              Note: {address.deliveryInstructions}
            </p>
          )}
        </div>

        {onSelect && (
          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
            isSelected
              ? 'border-green-500 bg-green-500'
              : 'border-gray-300'
          }`}>
            {isSelected && (
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </div>
        )}
      </div>

      {showActions && (onEdit || onDelete || onSetDefault) && (
        <div className="flex gap-3 mt-4 pt-3 border-t border-gray-100">
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="text-sm text-gray-600 hover:text-gray-900 font-medium"
            >
              Edit
            </button>
          )}
          {onSetDefault && !address.isDefault && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSetDefault();
              }}
              className="text-sm text-green-600 hover:text-green-700 font-medium"
            >
              Set as Default
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="text-sm text-red-600 hover:text-red-700 font-medium ml-auto"
            >
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
}
