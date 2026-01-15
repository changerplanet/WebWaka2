/**
 * TRUST SIGNAL COMPONENT
 * Wave 2.5: Offline UX Clarity & Trust Signals
 * 
 * Badge showing trust level: Verified, Pending, Demo, Unverified, Rejected.
 * Builds confidence for Nigerian commerce operators.
 */

'use client';

import React from 'react';
import { TrustLevel, TRUST_LABELS, formatTimeAgo } from '@/lib/offline-ux/types';
import { cn } from '@/lib/utils';

export interface TrustSignalProps {
  level: TrustLevel;
  className?: string;
  showDescription?: boolean;
  timestamp?: Date;
  size?: 'sm' | 'md' | 'lg';
}

const levelStyles: Record<TrustLevel, string> = {
  verified: 'bg-green-100 text-green-800 border-green-300',
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  demo: 'bg-purple-100 text-purple-800 border-purple-300',
  unverified: 'bg-gray-100 text-gray-700 border-gray-300',
  rejected: 'bg-red-100 text-red-800 border-red-300',
};

const iconContent: Record<TrustLevel, React.ReactNode> = {
  verified: (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  ),
  pending: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  demo: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  ),
  unverified: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  rejected: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

const sizeStyles = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
  lg: 'text-base px-3 py-1.5',
};

export function TrustSignal({
  level,
  className,
  showDescription = false,
  timestamp,
  size = 'md',
}: TrustSignalProps) {
  const { label, description } = TRUST_LABELS[level];

  return (
    <div className={cn('inline-flex flex-col', className)}>
      <div
        className={cn(
          'inline-flex items-center gap-1.5 rounded-md border font-medium',
          levelStyles[level],
          sizeStyles[size]
        )}
        role="status"
      >
        {iconContent[level]}
        <span>{label}</span>
      </div>
      
      {showDescription && (
        <p className="text-xs text-gray-500 mt-1 max-w-[200px]">
          {description}
        </p>
      )}
      
      {timestamp && (
        <span className="text-xs text-gray-400 mt-0.5">
          {formatTimeAgo(timestamp)}
        </span>
      )}
    </div>
  );
}

export default TrustSignal;
