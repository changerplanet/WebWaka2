'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[];
  showHome?: boolean;
}

const routeLabels: Record<string, string> = {
  'admin': 'Admin',
  'dashboard': 'Dashboard',
  'pos-suite': 'POS Suite',
  'sites-funnels-suite': 'Sites & Funnels',
  'education': 'Education',
  'health': 'Health',
  'hospitality': 'Hospitality',
  'civic': 'Civic',
  'logistics-suite': 'Logistics',
  'real-estate-suite': 'Real Estate',
  'legal-practice-suite': 'Legal Practice',
  'recruitment-suite': 'Recruitment',
  'project-management-suite': 'Project Management',
  'advanced-warehouse-suite': 'Warehouse',
  'partner-portal': 'Partner Portal',
  'parkhub': 'ParkHub',
  'users': 'Users',
  'partners': 'Partners',
  'tenants': 'Tenants',
  'settings': 'Settings',
  'students': 'Students',
  'patients': 'Patients',
  'products': 'Products',
  'orders': 'Orders',
  'inventory': 'Inventory',
  'reports': 'Reports',
  'analytics': 'Analytics',
  'governance': 'Governance',
  'sites': 'Sites',
  'funnels': 'Funnels',
};

function formatSegment(segment: string): string {
  return routeLabels[segment] || segment
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function Breadcrumb({ items, showHome = true }: BreadcrumbProps) {
  const pathname = usePathname();
  
  const breadcrumbItems: BreadcrumbItem[] = items || (() => {
    const segments = pathname.split('/').filter(Boolean);
    return segments.map((segment, index) => ({
      label: formatSegment(segment),
      href: index < segments.length - 1 ? '/' + segments.slice(0, index + 1).join('/') : undefined,
    }));
  })();

  if (breadcrumbItems.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex items-center flex-wrap gap-1 text-sm text-gray-600">
        {showHome && (
          <li className="flex items-center">
            <Link 
              href="/" 
              className="hover:text-green-600 transition-colors p-1 -m-1"
              aria-label="Home"
            >
              <Home className="w-4 h-4" />
            </Link>
            {breadcrumbItems.length > 0 && (
              <ChevronRight className="w-4 h-4 mx-1 text-gray-400 flex-shrink-0" />
            )}
          </li>
        )}
        {breadcrumbItems.map((item, index) => (
          <li key={index} className="flex items-center min-w-0">
            {item.href ? (
              <Link 
                href={item.href}
                className="hover:text-green-600 transition-colors truncate max-w-[120px] sm:max-w-none"
              >
                {item.label}
              </Link>
            ) : (
              <span className="font-medium text-gray-900 truncate max-w-[120px] sm:max-w-none">
                {item.label}
              </span>
            )}
            {index < breadcrumbItems.length - 1 && (
              <ChevronRight className="w-4 h-4 mx-1 text-gray-400 flex-shrink-0" />
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export default Breadcrumb;
