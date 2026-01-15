/**
 * STATUS EXPLAINER COMPONENT
 * Wave 2.5: Offline UX Clarity & Trust Signals
 * 
 * Contextual help component that explains status in plain language.
 * Designed for Nigerian commerce operators who need clarity, not jargon.
 */

'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

export interface StatusExplainerProps {
  title: string;
  description: string;
  whatItMeans?: string;
  whatToDo?: string;
  className?: string;
  variant?: 'inline' | 'tooltip' | 'expandable';
}

export function StatusExplainer({
  title,
  description,
  whatItMeans,
  whatToDo,
  className,
  variant = 'expandable',
}: StatusExplainerProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (variant === 'inline') {
    return (
      <div className={cn('bg-gray-50 rounded-lg p-4 border border-gray-200', className)}>
        <h4 className="font-semibold text-gray-900">{title}</h4>
        <p className="text-sm text-gray-600 mt-1">{description}</p>
        
        {whatItMeans && (
          <div className="mt-3">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              What this means
            </span>
            <p className="text-sm text-gray-700 mt-1">{whatItMeans}</p>
          </div>
        )}
        
        {whatToDo && (
          <div className="mt-3">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              What to do
            </span>
            <p className="text-sm text-gray-700 mt-1">{whatToDo}</p>
          </div>
        )}
      </div>
    );
  }

  if (variant === 'tooltip') {
    return (
      <div className={cn('relative inline-block group', className)}>
        <button
          className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-full"
          aria-label="More information"
          aria-describedby="tooltip-content"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
        <div
          id="tooltip-content"
          role="tooltip"
          className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible transition-all max-w-xs pointer-events-none z-10"
        >
          <div className="font-medium">{title}</div>
          <div className="mt-1 opacity-80">{description}</div>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
            <div className="border-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('border border-gray-200 rounded-lg overflow-hidden', className)}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-medium text-gray-900">{title}</span>
        </div>
        <svg
          className={cn('w-5 h-5 text-gray-400 transition-transform', isExpanded && 'rotate-180')}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isExpanded && (
        <div className="px-4 pb-4 pt-0 border-t border-gray-100">
          <p className="text-sm text-gray-600 mt-3">{description}</p>
          
          {whatItMeans && (
            <div className="mt-4 bg-blue-50 rounded-md p-3">
              <span className="text-xs font-semibold text-blue-800 uppercase tracking-wide">
                What this means for you
              </span>
              <p className="text-sm text-blue-900 mt-1">{whatItMeans}</p>
            </div>
          )}
          
          {whatToDo && (
            <div className="mt-3 bg-green-50 rounded-md p-3">
              <span className="text-xs font-semibold text-green-800 uppercase tracking-wide">
                What you can do
              </span>
              <p className="text-sm text-green-900 mt-1">{whatToDo}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default StatusExplainer;
