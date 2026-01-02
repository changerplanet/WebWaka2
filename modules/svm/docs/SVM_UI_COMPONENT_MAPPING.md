# SVM Storefront UI - Component Breakdown & API Mapping

## Overview
Single Vendor Marketplace customer-facing e-commerce storefront implemented as Phase A, Step 2.

## UI Flow
```
[Product Listing] → [Product Detail] → [Cart Drawer] → [Checkout] → [Order Confirmation]
       ↓                    ↓              ↓              ↓              ↓
   Browse/Search      View/Select      Review Cart    4-Step Flow    Success
```

## Component Breakdown

### Provider
| Component | File | Purpose |
|-----------|------|---------|
| `SVMProvider` | `SVMProvider.tsx` | Context provider for storefront state (products, cart, shipping, orders) |

### Product Components
| Component | File | Purpose |
|-----------|------|---------|
| `ProductGrid` | `ProductComponents.tsx` | Product listing with search, filters, sorting |
| `ProductCard` | `ProductComponents.tsx` | Individual product card with quick-add |
| `ProductDetail` | `ProductComponents.tsx` | Full product detail page with variants |

### Cart Components  
| Component | File | Purpose |
|-----------|------|---------|
| `CartDrawer` | `CartComponents.tsx` | Slide-out cart with promo code support |
| `MiniCart` | `CartComponents.tsx` | Header cart icon with badge |

### Checkout Components
| Component | File | Purpose |
|-----------|------|---------|
| `CheckoutPage` | `CheckoutComponents.tsx` | Multi-step checkout (Shipping → Delivery → Payment → Review) |

### Order Components
| Component | File | Purpose |
|-----------|------|---------|
| `OrderConfirmation` | `OrderConfirmation.tsx` | Order success page with details |

### Page
| Component | File | Route |
|-----------|------|-------|
| `StorePage` | `/app/store/page.tsx` | `/store` |

## API Usage Mapping

### Product APIs
| Action | API Endpoint | Method | Component |
|--------|-------------|--------|-----------|
| List products | `/api/svm/catalog` | GET | `ProductGrid` |
| Get product | `/api/svm/catalog?productId=xxx` | GET | `ProductDetail` |
| Search products | `/api/svm/catalog?query=xxx` | GET | `ProductGrid` |
| Filter by category | `/api/svm/catalog?categoryId=xxx` | GET | `ProductGrid` |

### Cart APIs
| Action | API Endpoint | Method | Component |
|--------|-------------|--------|-----------|
| Add item | `/api/svm/cart` | POST (action: ADD_ITEM) | `addToCart()` |
| Update quantity | `/api/svm/cart` | POST (action: UPDATE_QUANTITY) | `updateCartQuantity()` |
| Remove item | `/api/svm/cart` | POST (action: REMOVE_ITEM) | `removeFromCart()` |
| Apply promo | `/api/svm/cart` | POST (action: APPLY_PROMO) | `applyPromoCode()` |
| Get cart | `/api/svm/cart` | GET | Cart state |
| Clear cart | `/api/svm/cart` | DELETE | `clearCart()` |

### Shipping APIs
| Action | API Endpoint | Method | Component |
|--------|-------------|--------|-----------|
| Calculate shipping | `/api/svm/shipping` | POST | `CheckoutPage` |
| List zones | `/api/svm/shipping` | GET | N/A (admin) |

### Promotion APIs
| Action | API Endpoint | Method | Component |
|--------|-------------|--------|-----------|
| Validate code | `/api/svm/promotions` | POST (action: VALIDATE) | `applyPromoCode()` |
| Calculate discounts | `/api/svm/promotions` | POST (action: CALCULATE) | Cart totals |

### Order APIs
| Action | API Endpoint | Method | Component |
|--------|-------------|--------|-----------|
| Create order | `/api/svm/orders` | POST | `placeOrder()` |
| Get orders | `/api/svm/orders` | GET | N/A (account) |

## Demo Data (MOCKED)
When no database products exist, the frontend provides:
- 8 demo products across 4 categories (Clothing, Footwear, Accessories, Electronics)
- Demo shipping options (Standard, Express, Overnight)
- Demo promo codes: SAVE10, DEMO (10% discount)
- Order creation works in demo mode (saved to localStorage)

## Data Flow
```
User Action → SVMProvider → API Call → Response
                  ↓
            State Update → UI Re-render
                  ↓
            localStorage (cart persistence)
```

## Key Features
- ✅ Product listing with grid/list view
- ✅ Product search and category filtering
- ✅ Product sorting (name, price, newest)
- ✅ Product detail with variant selection
- ✅ Quantity selection
- ✅ Cart drawer with quantity controls
- ✅ Promo code application
- ✅ Multi-step checkout
- ✅ Shipping address form
- ✅ Delivery method selection
- ✅ Payment form (demo)
- ✅ Order review
- ✅ Order confirmation
- ✅ Free shipping threshold ($50)
- ✅ Responsive design
- ✅ data-testid attributes for testing

## Constraints Applied
- ✅ Uses existing SVM APIs only
- ✅ Cart persistence uses localStorage (mocked)
- ✅ No backend modifications
- ✅ No shipping/promotions logic changes
