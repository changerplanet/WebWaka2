/**
 * ADVANCED WAREHOUSE SUITE — Layout
 * Phase 7C.3, S5 Admin UI
 */

import Link from 'next/link';
import { 
  Warehouse, 
  Package, 
  Boxes, 
  ClipboardList, 
  Truck, 
  ArrowLeftRight,
  LayoutDashboard 
} from 'lucide-react';

export default function AdvancedWarehouseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const navItems = [
    { href: '/advanced-warehouse-suite', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/advanced-warehouse-suite/zones', icon: Warehouse, label: 'Zones & Bins' },
    { href: '/advanced-warehouse-suite/batches', icon: Package, label: 'Batches' },
    { href: '/advanced-warehouse-suite/receipts', icon: Boxes, label: 'Receipts' },
    { href: '/advanced-warehouse-suite/pick-lists', icon: ClipboardList, label: 'Pick Lists' },
    { href: '/advanced-warehouse-suite/movements', icon: ArrowLeftRight, label: 'Movements' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Top Navigation */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/advanced-warehouse-suite" className="flex items-center gap-2">
                <div className="bg-amber-600 text-white p-2 rounded-lg">
                  <Truck className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                    Advanced Warehouse
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Multi-location Operations
                  </p>
                </div>
              </Link>
              
              {/* Demo Mode Badge */}
              <span 
                className="px-2 py-1 text-xs font-medium bg-amber-100 text-amber-800 rounded-full"
                data-testid="demo-mode-badge"
              >
                Demo Mode
              </span>
            </div>
            
            {/* Quick Stats */}
            <div className="hidden md:flex items-center gap-4 text-sm">
              <div className="text-center">
                <div className="font-semibold text-gray-900 dark:text-white">3</div>
                <div className="text-xs text-gray-500">Warehouses</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-green-600">24</div>
                <div className="text-xs text-gray-500">Active Zones</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-blue-600">156</div>
                <div className="text-xs text-gray-500">Total Bins</div>
              </div>
            </div>
          </div>
          
          {/* Navigation Tabs */}
          <nav className="flex gap-1 mt-3 overflow-x-auto pb-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-amber-600 hover:bg-amber-50 dark:text-gray-300 dark:hover:text-amber-400 dark:hover:bg-gray-700 rounded-lg whitespace-nowrap transition-colors"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}
