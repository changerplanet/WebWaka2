'use client';

/**
 * Vendor Mobile Dashboard Page
 * Wave F4: Vendor Mobile Dashboard (MVM)
 * 
 * Mobile-first vendor dashboard for marketplace vendors.
 * Optimized for low-end Android devices and unstable networks.
 * Read-only views - NO write operations.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  VendorDashboardStatsCards,
  VendorOrderList,
  VendorEarningsView,
  VendorFulfillmentQueue,
  NetworkStatusBanner,
} from '@/components/commerce/vendor-dashboard';
import {
  VendorDashboardData,
  VendorOrderListResult,
  VendorFulfillmentListResult,
  VendorEarningsResult,
  VendorDashboardTab,
  OrderFilterStatus,
  FulfillmentPriority,
} from '@/lib/commerce/vendor-dashboard';

export default function VendorDashboardPage() {
  const [activeTab, setActiveTab] = useState<VendorDashboardTab>('orders');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [dashboardData, setDashboardData] = useState<VendorDashboardData | null>(null);
  const [ordersData, setOrdersData] = useState<VendorOrderListResult | null>(null);
  const [fulfillmentData, setFulfillmentData] = useState<VendorFulfillmentListResult | null>(null);
  const [earningsData, setEarningsData] = useState<VendorEarningsResult | null>(null);

  const [orderFilter, setOrderFilter] = useState<OrderFilterStatus>('ALL');
  const [fulfillmentFilter, setFulfillmentFilter] = useState<FulfillmentPriority | undefined>();
  const [earningsPeriod, setEarningsPeriod] = useState('30d');
  const [ordersPage, setOrdersPage] = useState(0);

  const vendorId = 'demo-vendor-id';

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch(`/api/commerce/vendor-dashboard?vendorId=${vendorId}`);
      if (!res.ok) throw new Error('Failed to load dashboard');
      const data = await res.json();
      if (data.success) {
        setDashboardData(data.dashboard);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    }
  }, [vendorId]);

  const fetchOrders = useCallback(async (status: OrderFilterStatus, offset = 0) => {
    try {
      const res = await fetch('/api/commerce/vendor-dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_orders',
          vendorId,
          status,
          limit: 20,
          offset,
          sortBy: 'priority',
          sortOrder: 'desc',
        }),
      });
      if (!res.ok) throw new Error('Failed to load orders');
      const data = await res.json();
      if (data.success) {
        if (offset > 0 && ordersData) {
          setOrdersData({
            ...data,
            orders: [...ordersData.orders, ...data.orders],
          });
        } else {
          setOrdersData(data);
        }
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    }
  }, [vendorId, ordersData]);

  const fetchFulfillment = useCallback(async (priority?: FulfillmentPriority) => {
    try {
      const res = await fetch('/api/commerce/vendor-dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_fulfillment_queue',
          vendorId,
          priority,
          limit: 50,
        }),
      });
      if (!res.ok) throw new Error('Failed to load fulfillment queue');
      const data = await res.json();
      if (data.success) {
        setFulfillmentData(data);
      }
    } catch (err) {
      console.error('Error fetching fulfillment:', err);
    }
  }, [vendorId]);

  const fetchEarnings = useCallback(async (period: string) => {
    try {
      const res = await fetch('/api/commerce/vendor-dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_earnings',
          vendorId,
          period,
        }),
      });
      if (!res.ok) throw new Error('Failed to load earnings');
      const data = await res.json();
      if (data.success) {
        setEarningsData(data);
      }
    } catch (err) {
      console.error('Error fetching earnings:', err);
    }
  }, [vendorId]);

  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      await fetchDashboard();
      await fetchOrders('ALL');
      setIsLoading(false);
    };
    loadInitialData();
  }, []);

  useEffect(() => {
    if (activeTab === 'fulfillment' && !fulfillmentData) {
      fetchFulfillment();
    }
    if (activeTab === 'earnings' && !earningsData) {
      fetchEarnings(earningsPeriod);
    }
  }, [activeTab]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchDashboard();
    if (activeTab === 'orders') {
      await fetchOrders(orderFilter);
    } else if (activeTab === 'fulfillment') {
      await fetchFulfillment(fulfillmentFilter);
    } else if (activeTab === 'earnings') {
      await fetchEarnings(earningsPeriod);
    }
    setIsRefreshing(false);
  };

  const handleOrderFilterChange = (status: OrderFilterStatus) => {
    setOrderFilter(status);
    setOrdersPage(0);
    fetchOrders(status);
  };

  const handleFulfillmentFilterChange = (priority?: FulfillmentPriority) => {
    setFulfillmentFilter(priority);
    fetchFulfillment(priority);
  };

  const handleEarningsPeriodChange = (period: string) => {
    setEarningsPeriod(period);
    fetchEarnings(period);
  };

  const handleLoadMoreOrders = () => {
    const nextOffset = (ordersPage + 1) * 20;
    setOrdersPage(ordersPage + 1);
    fetchOrders(orderFilter, nextOffset);
  };

  if (error && !dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NetworkStatusBanner
        lastUpdated={dashboardData?.lastUpdated}
        isRefreshing={isRefreshing}
        onRefresh={handleRefresh}
      />

      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-lg font-bold text-gray-900">
                {dashboardData?.profile.name || 'Vendor Dashboard'}
              </h1>
              {dashboardData?.profile.tierName && (
                <p className="text-xs text-gray-500">{dashboardData.profile.tierName}</p>
              )}
            </div>
            {dashboardData?.profile.isVerified && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Verified
              </span>
            )}
          </div>

          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {(['orders', 'fulfillment', 'earnings'] as VendorDashboardTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="p-4 pb-20">
        {dashboardData && (
          <div className="mb-6">
            <VendorDashboardStatsCards
              stats={dashboardData.stats}
              isLoading={isLoading}
            />
          </div>
        )}

        {activeTab === 'orders' && (
          <VendorOrderList
            orders={ordersData?.orders || []}
            total={ordersData?.total || 0}
            isLoading={isLoading}
            hasMore={ordersData?.hasMore}
            onLoadMore={handleLoadMoreOrders}
            onFilterChange={handleOrderFilterChange}
            currentFilter={orderFilter}
          />
        )}

        {activeTab === 'fulfillment' && (
          <VendorFulfillmentQueue
            items={fulfillmentData?.items || []}
            urgentCount={fulfillmentData?.urgentCount || 0}
            normalCount={fulfillmentData?.normalCount || 0}
            isLoading={!fulfillmentData}
            onFilterChange={handleFulfillmentFilterChange}
            currentFilter={fulfillmentFilter}
          />
        )}

        {activeTab === 'earnings' && (
          <VendorEarningsView
            earnings={earningsData || undefined}
            payoutInfo={dashboardData?.payoutInfo}
            isLoading={!earningsData}
            onPeriodChange={handleEarningsPeriodChange}
            currentPeriod={earningsPeriod}
          />
        )}
      </main>
    </div>
  );
}
