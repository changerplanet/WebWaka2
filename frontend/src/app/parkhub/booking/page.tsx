'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Bus,
  MapPin,
  Clock,
  Calendar,
  Search,
  Filter,
  ArrowRight,
  Star,
  Wifi,
  Snowflake,
  Tv,
  Plug,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PARKHUB_LABELS } from '@/lib/parkhub/config';

interface Route {
  id: string;
  companyName: string;
  companyLogo?: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  price: number;
  availableSeats: number;
  totalSeats: number;
  busType: 'LUXURY' | 'STANDARD' | 'ECONOMY';
  amenities: string[];
  rating: number;
  reviewCount: number;
}

const AMENITY_ICONS: Record<string, React.ReactNode> = {
  'AC': <Snowflake className="w-3 h-3" />,
  'WiFi': <Wifi className="w-3 h-3" />,
  'TV': <Tv className="w-3 h-3" />,
  'USB': <Plug className="w-3 h-3" />,
};

export default function PassengerBookingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchForm, setSearchForm] = useState({
    origin: searchParams.get('origin') || '',
    destination: searchParams.get('destination') || '',
    date: searchParams.get('date') || new Date().toISOString().split('T')[0],
    passengers: searchParams.get('passengers') || '1',
  });
  const [hasSearched, setHasSearched] = useState(false);

  // Popular routes for quick selection
  const popularRoutes = [
    { from: 'Lagos', to: 'Abuja' },
    { from: 'Lagos', to: 'Ibadan' },
    { from: 'Lagos', to: 'Port Harcourt' },
    { from: 'Abuja', to: 'Kano' },
    { from: 'Lagos', to: 'Benin' },
  ];

  const handleSearch = async () => {
    if (!searchForm.origin || !searchForm.destination) return;
    
    setLoading(true);
    setHasSearched(true);
    
    // Simulated search - in production calls MVM product search
    setTimeout(() => {
      setRoutes([
        {
          id: '1',
          companyName: 'ABC Transport',
          origin: searchForm.origin,
          destination: searchForm.destination,
          departureTime: '06:00',
          arrivalTime: '14:00',
          duration: '8 hrs',
          price: 15000,
          availableSeats: 12,
          totalSeats: 18,
          busType: 'LUXURY',
          amenities: ['AC', 'WiFi', 'TV', 'USB'],
          rating: 4.5,
          reviewCount: 234,
        },
        {
          id: '2',
          companyName: 'Peace Mass Transit',
          origin: searchForm.origin,
          destination: searchForm.destination,
          departureTime: '07:00',
          arrivalTime: '15:30',
          duration: '8.5 hrs',
          price: 12000,
          availableSeats: 8,
          totalSeats: 18,
          busType: 'STANDARD',
          amenities: ['AC', 'USB'],
          rating: 4.2,
          reviewCount: 567,
        },
        {
          id: '3',
          companyName: 'GUO Transport',
          origin: searchForm.origin,
          destination: searchForm.destination,
          departureTime: '08:00',
          arrivalTime: '17:00',
          duration: '9 hrs',
          price: 10000,
          availableSeats: 22,
          totalSeats: 32,
          busType: 'ECONOMY',
          amenities: ['AC'],
          rating: 4.0,
          reviewCount: 189,
        },
      ]);
      setLoading(false);
    }, 1000);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
  };

  const getBusTypeColor = (type: string) => {
    switch (type) {
      case 'LUXURY': return 'bg-purple-100 text-purple-800';
      case 'STANDARD': return 'bg-blue-100 text-blue-800';
      case 'ECONOMY': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50" data-testid="passenger-booking-page">
      {/* Hero Section with Search */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-white py-12">
        <div className="max-w-5xl mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Book Your Trip</h1>
          <p className="text-white/80 mb-8">
            Find and book {PARKHUB_LABELS.orders.toLowerCase()} from trusted {PARKHUB_LABELS.vendors.toLowerCase()}
          </p>
          
          {/* Search Form */}
          <div className="bg-white rounded-lg p-4 md:p-6 text-foreground">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="md:col-span-1">
                <Label className="text-sm">From</Label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Origin city"
                    value={searchForm.origin}
                    onChange={(e) => setSearchForm({ ...searchForm, origin: e.target.value })}
                    className="pl-9"
                  />
                </div>
              </div>
              
              <div className="md:col-span-1">
                <Label className="text-sm">To</Label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Destination city"
                    value={searchForm.destination}
                    onChange={(e) => setSearchForm({ ...searchForm, destination: e.target.value })}
                    className="pl-9"
                  />
                </div>
              </div>
              
              <div className="md:col-span-1">
                <Label className="text-sm">Date</Label>
                <div className="relative">
                  <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="date"
                    value={searchForm.date}
                    onChange={(e) => setSearchForm({ ...searchForm, date: e.target.value })}
                    className="pl-9"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
              
              <div className="md:col-span-1">
                <Label className="text-sm">{PARKHUB_LABELS.customers}</Label>
                <Select
                  value={searchForm.passengers}
                  onValueChange={(v) => setSearchForm({ ...searchForm, passengers: v })}
                >
                  <SelectTrigger>
                    <Users className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <SelectItem key={n} value={n.toString()}>
                        {n} {n === 1 ? PARKHUB_LABELS.customer : PARKHUB_LABELS.customers}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="md:col-span-1 flex items-end">
                <Button 
                  className="w-full" 
                  onClick={handleSearch}
                  disabled={loading}
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Search
                    </>
                  )}
                </Button>
              </div>
            </div>
            
            {/* Popular Routes */}
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-sm text-muted-foreground">Popular:</span>
              {popularRoutes.map((route, idx) => (
                <button
                  key={idx}
                  onClick={() => setSearchForm({ ...searchForm, origin: route.from, destination: route.to })}
                  className="text-sm text-primary hover:underline"
                >
                  {route.from} → {route.to}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        {hasSearched && (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">
                {routes.length} {PARKHUB_LABELS.products} Found
              </h2>
              <div className="flex gap-2">
                <Select defaultValue="price">
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="price">Lowest Price</SelectItem>
                    <SelectItem value="departure">Departure Time</SelectItem>
                    <SelectItem value="duration">Duration</SelectItem>
                    <SelectItem value="rating">Highest Rating</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline">
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                </Button>
              </div>
            </div>

            {/* Route Cards */}
            <div className="space-y-4">
              {routes.map((route) => (
                <div key={route.id} className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Company & Route Info */}
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                        <Bus className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{route.companyName}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded ${getBusTypeColor(route.busType)}`}>
                            {route.busType}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span>{route.rating}</span>
                          <span>({route.reviewCount} reviews)</span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          {route.amenities.map((amenity) => (
                            <span 
                              key={amenity}
                              className="flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded"
                              title={amenity}
                            >
                              {AMENITY_ICONS[amenity] || amenity}
                              <span>{amenity}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Time & Duration */}
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="text-lg font-bold">{route.departureTime}</div>
                        <div className="text-xs text-muted-foreground">{route.origin}</div>
                      </div>
                      <div className="flex flex-col items-center px-4">
                        <div className="text-xs text-muted-foreground">{route.duration}</div>
                        <div className="flex items-center gap-1">
                          <div className="h-0.5 w-16 bg-muted"></div>
                          <ArrowRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="text-xs text-muted-foreground">Direct</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold">{route.arrivalTime}</div>
                        <div className="text-xs text-muted-foreground">{route.destination}</div>
                      </div>
                    </div>

                    {/* Price & Book */}
                    <div className="flex flex-col items-end gap-2">
                      <div className="text-2xl font-bold text-primary">
                        {formatCurrency(route.price)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {route.availableSeats} {PARKHUB_LABELS.inventory.toLowerCase()} left
                      </div>
                      <Button 
                        onClick={() => router.push(`/parkhub/booking/checkout?route=${route.id}&passengers=${searchForm.passengers}`)}
                        disabled={route.availableSeats === 0}
                      >
                        {route.availableSeats === 0 ? 'Sold Out' : `Book ${PARKHUB_LABELS.order}`}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {!hasSearched && (
          <div className="text-center py-12">
            <Bus className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Search for {PARKHUB_LABELS.products}</h3>
            <p className="text-muted-foreground">
              Enter your origin and destination to find available trips
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
