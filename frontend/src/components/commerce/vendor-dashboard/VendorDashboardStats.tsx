'use client';

/**
 * Vendor Dashboard Stats Component
 * Wave F4: Vendor Mobile Dashboard (MVM)
 * 
 * Mobile-first stats cards optimized for low-end Android devices.
 * Uses minimal animations and lightweight rendering.
 */

import { VendorDashboardStats, formatNaira } from '@/lib/commerce/vendor-dashboard';

interface VendorDashboardStatsProps {
  stats: VendorDashboardStats;
  isLoading?: boolean;
}

export function VendorDashboardStatsCards({ stats, isLoading }: VendorDashboardStatsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-lg p-4 shadow-sm animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-20 mb-2" />
            <div className="h-8 bg-gray-200 rounded w-12" />
          </div>
        ))}
      </div>
    );
  }

  const statItems = [
    {
      label: 'Pending',
      value: stats.pendingOrders,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      label: 'Processing',
      value: stats.processingOrders + stats.readyToShip,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Shipped',
      value: stats.shippedOrders,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      label: 'Today',
      value: stats.deliveredToday,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      subLabel: 'Delivered',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {statItems.map((item) => (
          <div
            key={item.label}
            className={`rounded-lg p-4 shadow-sm ${item.bgColor}`}
          >
            <p className="text-xs text-gray-600 font-medium">
              {item.subLabel || item.label}
            </p>
            <p className={`text-2xl font-bold ${item.color}`}>
              {item.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
          <p className="text-xs font-medium opacity-90">Today&apos;s Earnings</p>
          <p className="text-xl font-bold">
            {formatNaira(stats.totalEarningsToday)}
          </p>
        </div>
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-lg p-4 text-white">
          <p className="text-xs font-medium opacity-90">Pending Payout</p>
          <p className="text-xl font-bold">
            {formatNaira(stats.pendingPayout)}
          </p>
        </div>
      </div>
    </div>
  );
}
