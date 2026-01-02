# MVM Vendor Portal UI - Component Breakdown & API Mapping

## Overview
Multi-Vendor Marketplace vendor portal implemented as Phase A, Step 3. Vendors can manage their store, view orders, track earnings, and manage product mappings.

## UI Flow
```
[Dashboard] ←→ [Orders] ←→ [Products] ←→ [Earnings] ←→ [Profile]
     ↓              ↓           ↓            ↓            ↓
 Overview     Order List    Mappings    Commission    Settings
```

## Component Breakdown

### Provider
| Component | File | Purpose |
|-----------|------|---------|
| `MVMProvider` | `MVMProvider.tsx` | Context provider for vendor state (profile, dashboard, orders, products, commissions) |

### Dashboard
| Component | File | Purpose |
|-----------|------|---------|
| `VendorDashboard` | `VendorDashboard.tsx` | Main dashboard with metrics, earnings overview, recent orders, top products |

### Orders
| Component | File | Purpose |
|-----------|------|---------|
| `VendorOrdersView` | `VendorOrders.tsx` | Orders list with filtering, search, and order detail modal |
| `OrderDetailModal` | `VendorOrders.tsx` | Slide-out panel showing full order details |
| `OrderStatusBadge` | `VendorOrders.tsx` | Status indicator (Pending/Confirmed/Shipped/Delivered/Cancelled) |

### Products
| Component | File | Purpose |
|-----------|------|---------|
| `VendorProductsView` | `VendorProducts.tsx` | Product mappings list with stats |
| `AddProductModal` | `VendorProducts.tsx` | Modal to map Core products to vendor |

### Earnings
| Component | File | Purpose |
|-----------|------|---------|
| `VendorEarningsView` | `VendorEarnings.tsx` | Earnings overview, commission history, payout info |
| `CommissionStatusBadge` | `VendorEarnings.tsx` | Status indicator (Pending/Processing/Paid) |

### Profile
| Component | File | Purpose |
|-----------|------|---------|
| `VendorProfile` | `VendorProfile.tsx` | Editable vendor profile with account status |

### Page
| Component | File | Route |
|-----------|------|-------|
| `VendorPortalPage` | `/app/vendor/page.tsx` | `/vendor` |

## API Usage Mapping

### Vendor APIs
| Action | API Endpoint | Method | Component |
|--------|-------------|--------|-----------|
| Get vendor | `/api/mvm/vendors/:vendorId` | GET | `fetchVendor()` |
| Update vendor | `/api/mvm/vendors/:vendorId` | PATCH | `updateVendorProfile()` |
| Get dashboard | `/api/mvm/vendors/:vendorId/dashboard` | GET | `fetchDashboard()` |

### Orders APIs
| Action | API Endpoint | Method | Component |
|--------|-------------|--------|-----------|
| List orders | `/api/mvm/vendors/:vendorId/orders` | GET | `fetchOrders()` |
| Filter by status | `/api/mvm/vendors/:vendorId/orders?status=XXX` | GET | `VendorOrdersView` |

### Product Mapping APIs
| Action | API Endpoint | Method | Component |
|--------|-------------|--------|-----------|
| List mappings | `/api/mvm/vendors/:vendorId/products` | GET | `fetchProductMappings()` |
| Add mapping | `/api/mvm/vendors/:vendorId/products` | POST | `addProductMapping()` |
| Remove mapping | `/api/mvm/vendors/:vendorId/products` | DELETE | `removeProductMapping()` |

### Commission APIs
| Action | API Endpoint | Method | Component |
|--------|-------------|--------|-----------|
| Get commissions | `/api/mvm/commissions?vendorId=xxx` | GET | `fetchCommissions()` |

## Demo Data (MOCKED)
When no database data exists, the frontend provides:
- **Vendor**: Demo Vendor Store (APPROVED, Verified, Gold Tier)
- **Dashboard**: $15,750.50 total sales, 127 orders, 4.7★ rating
- **Orders**: 4 sample orders with various statuses
- **Products**: 4 product mappings with sales/revenue data
- **Commissions**: 4 commission records (Pending/Processing/Paid)

## Permissions Mapping
| Permission | Vendors Can | Notes |
|------------|-------------|-------|
| Dashboard | View only | Read metrics and analytics |
| Orders | View only | Cannot change order status |
| Products | Map/Unmap | Core product selection only |
| Earnings | View only | No payout actions |
| Profile | Edit | Name, email, phone, description |
| Wallet | N/A | No wallet mutations |
| Payouts | N/A | Admin-triggered only |

## Key Features
- ✅ Dashboard with key metrics and trends
- ✅ Orders view with filtering and search
- ✅ Order detail modal with commission breakdown
- ✅ Product mapping management
- ✅ Earnings/commission tracking (read-only)
- ✅ Profile management with edit mode
- ✅ Status badges for orders and commissions
- ✅ Responsive sidebar navigation
- ✅ data-testid attributes for testing
- ✅ Demo mode with realistic data

## Constraints Applied
- ✅ Vendors are NOT tenants
- ✅ Uses existing MVM APIs only
- ✅ No payout actions (read-only earnings)
- ✅ No wallet mutations
- ✅ No backend modifications
