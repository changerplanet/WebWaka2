'use client';

import { ReactNode } from 'react';
import { Breadcrumb } from './Breadcrumb';

interface AdminWrapperProps {
  children: ReactNode;
  showBreadcrumb?: boolean;
  className?: string;
}

export function AdminWrapper({ 
  children, 
  showBreadcrumb = true,
  className = ''
}: AdminWrapperProps) {
  return (
    <div className={`min-h-screen ${className}`}>
      {showBreadcrumb && (
        <div className="px-4 pt-4 sm:px-6 lg:px-8">
          <Breadcrumb />
        </div>
      )}
      {children}
    </div>
  );
}

export default AdminWrapper;
