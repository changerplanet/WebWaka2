'use client';

import { useState, useEffect } from 'react';
import {
  Bus,
  MapPin,
  Clock,
  Search,
  Plus,
  Minus,
  Printer,
  Receipt,
  User,
  Phone,
  CreditCard,
  Banknote,
  QrCode,
  Check,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { PARKHUB_LABELS } from '@/lib/parkhub/config';

interface Route {
  id: string;
  companyName: string;
  origin: string;
  destination: string;
  departureTime: string;
  price: number;
  availableSeats: number;
  busType: string;
}

interface CartItem {
  route: Route;
  quantity: number;
  passengerName?: string;
  passengerPhone?: string;
}

export default function ParkAgentPOSPage() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'TRANSFER' | 'USSD'>('CASH');
  const [processing, setProcessing] = useState(false);
  const [lastTicket, setLastTicket] = useState<any>(null);

  useEffect(() => {
    fetchAvailableRoutes();
  }, []);

  const fetchAvailableRoutes = async () => {
    // Simulated - in production calls MVM product API
    setRoutes([
      {
        id: '1',
        companyName: 'ABC Transport',
        origin: 'Lagos',
        destination: 'Abuja',
        departureTime: '06:00',
        price: 15000,
        availableSeats: 12,
        busType: 'LUXURY',
      },
      {
        id: '2',
        companyName: 'ABC Transport',
        origin: 'Lagos',
        destination: 'Ibadan',
        departureTime: '07:30',
        price: 4500,
        availableSeats: 5,
        busType: 'STANDARD',
      },
      {
        id: '3',
        companyName: 'Peace Mass Transit',
        origin: 'Lagos',
        destination: 'Benin',
        departureTime: '08:00',
        price: 8000,
        availableSeats: 18,
        busType: 'STANDARD',
      },
      {
        id: '4',
        companyName: 'GUO Transport',
        origin: 'Lagos',
        destination: 'Port Harcourt',
        departureTime: '09:00',
        price: 12000,
        availableSeats: 22,
        busType: 'ECONOMY',
      },
      {
        id: '5',
        companyName: 'ABC Transport',
        origin: 'Lagos',
        destination: 'Owerri',
        departureTime: '10:00',
        price: 10000,
        availableSeats: 8,
        busType: 'STANDARD',
      },
    ]);
  };

  const addToCart = (route: Route) => {
    const existing = cart.find((item) => item.route.id === route.id);
    if (existing) {
      if (existing.quantity < route.availableSeats) {
        setCart(cart.map((item) =>
          item.route.id === route.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ));
      }
    } else {
      setCart([...cart, { route, quantity: 1 }]);
    }
  };

  const updateQuantity = (routeId: string, delta: number) => {
    setCart(cart.map((item) => {
      if (item.route.id === routeId) {
        const newQty = Math.max(0, Math.min(item.quantity + delta, item.route.availableSeats));
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter((item) => item.quantity > 0));
  };

  const removeFromCart = (routeId: string) => {
    setCart(cart.filter((item) => item.route.id !== routeId));
  };

  const getTotal = () => {
    return cart.reduce((sum, item) => sum + (item.route.price * item.quantity), 0);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
  };

  const handleCheckout = async () => {
    setProcessing(true);
    // Simulated checkout - in production calls MVM order API
    setTimeout(() => {
      const ticketNumber = `TKT-${Date.now().toString(36).toUpperCase()}`;
      setLastTicket({
        ticketNumber,
        items: cart,
        total: getTotal(),
        paymentMethod,
        createdAt: new Date().toISOString(),
      });
      setCart([]);
      setShowCheckout(false);
      setProcessing(false);
    }, 1500);
  };

  const filteredRoutes = routes.filter((route) =>
    route.destination.toLowerCase().includes(search.toLowerCase()) ||
    route.origin.toLowerCase().includes(search.toLowerCase()) ||
    route.companyName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-gray-100" data-testid="park-agent-pos">
      {/* Left Panel - Routes */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white p-4 border-b">
          <h1 className="text-xl font-bold mb-2">ParkHub POS - {PARKHUB_LABELS.order} Sales</h1>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={`Search ${PARKHUB_LABELS.products.toLowerCase()} or destinations...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Routes Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredRoutes.map((route) => (
              <button
                key={route.id}
                onClick={() => addToCart(route)}
                disabled={route.availableSeats === 0}
                className={`text-left p-4 rounded-lg border transition-all ${
                  route.availableSeats === 0
                    ? 'bg-gray-100 opacity-50 cursor-not-allowed'
                    : 'bg-white hover:border-primary hover:shadow-md'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="text-xs bg-muted px-2 py-0.5 rounded">
                    {route.busType}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {route.companyName}
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span className="font-medium">{route.origin} → {route.destination}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {route.departureTime}
                  </div>
                  <div className="text-sm">
                    <span className={route.availableSeats < 5 ? 'text-red-600' : 'text-muted-foreground'}>
                      {route.availableSeats} {PARKHUB_LABELS.inventory.toLowerCase()}
                    </span>
                  </div>
                </div>
                <div className="mt-2 text-lg font-bold text-primary">
                  {formatCurrency(route.price)}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Cart */}
      <div className="w-96 bg-white border-l flex flex-col">
        <div className="p-4 border-b">
          <h2 className="font-semibold flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Current {PARKHUB_LABELS.order}
          </h2>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {cart.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bus className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No {PARKHUB_LABELS.orders.toLowerCase()} added</p>
              <p className="text-sm">Click on a {PARKHUB_LABELS.product.toLowerCase()} to add</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item) => (
                <div key={item.route.id} className="border rounded-lg p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-medium text-sm">
                        {item.route.origin} → {item.route.destination}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {item.route.departureTime} • {item.route.companyName}
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.route.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => updateQuantity(item.route.id, -1)}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => updateQuantity(item.route.id, 1)}
                        disabled={item.quantity >= item.route.availableSeats}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="font-medium">
                      {formatCurrency(item.route.price * item.quantity)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Total & Actions */}
        <div className="p-4 border-t space-y-3">
          <div className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span>{formatCurrency(getTotal())}</span>
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{PARKHUB_LABELS.orders}: {cart.reduce((sum, item) => sum + item.quantity, 0)}</span>
            <span>{PARKHUB_LABELS.commission}: {formatCurrency(getTotal() * 0.1)}</span>
          </div>
          <Button
            className="w-full"
            size="lg"
            onClick={() => setShowCheckout(true)}
            disabled={cart.length === 0}
          >
            Checkout
          </Button>
        </div>
      </div>

      {/* Last Ticket Display */}
      {lastTicket && (
        <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 w-80 border border-green-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-green-600">
              <Check className="w-5 h-5" />
              <span className="font-medium">{PARKHUB_LABELS.order} Completed</span>
            </div>
            <button onClick={() => setLastTicket(null)} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="text-sm space-y-1">
            <p>Ticket #: <span className="font-mono">{lastTicket.ticketNumber}</span></p>
            <p>Total: {formatCurrency(lastTicket.total)}</p>
            <p>Payment: {lastTicket.paymentMethod}</p>
          </div>
          <Button variant="outline" size="sm" className="w-full mt-3">
            <Printer className="w-4 h-4 mr-2" />
            Print {PARKHUB_LABELS.order}
          </Button>
        </div>
      )}

      {/* Checkout Dialog */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Complete {PARKHUB_LABELS.order}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Passenger Details */}
            <div className="space-y-3">
              <Label>{PARKHUB_LABELS.customer} Details (Optional)</Label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Name" className="pl-9" />
              </div>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Phone number" className="pl-9" />
              </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: 'CASH', icon: Banknote, label: 'Cash' },
                  { key: 'CARD', icon: CreditCard, label: 'Card' },
                  { key: 'TRANSFER', icon: Receipt, label: 'Transfer' },
                  { key: 'USSD', icon: QrCode, label: 'USSD' },
                ].map((method) => (
                  <button
                    key={method.key}
                    onClick={() => setPaymentMethod(method.key as typeof paymentMethod)}
                    className={`p-3 rounded-lg border text-center transition-all ${
                      paymentMethod === method.key
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'hover:border-muted-foreground'
                    }`}
                  >
                    <method.icon className="w-5 h-5 mx-auto mb-1" />
                    <span className="text-sm">{method.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="bg-muted/30 rounded-lg p-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>{formatCurrency(getTotal())}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>{PARKHUB_LABELS.commission} (10%)</span>
                <span>{formatCurrency(getTotal() * 0.1)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-bold">
                <span>Total</span>
                <span>{formatCurrency(getTotal())}</span>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCheckout(false)}>
              Cancel
            </Button>
            <Button onClick={handleCheckout} disabled={processing}>
              {processing ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Complete Sale
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
