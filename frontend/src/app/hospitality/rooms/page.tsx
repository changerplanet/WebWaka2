'use client';

/**
 * HOSPITALITY SUITE: Rooms Management Page
 * 
 * View and manage room inventory and status.
 * ⚠️ DEMO ONLY - All data is in-memory.
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BedDouble,
  ArrowLeft,
  AlertCircle,
  Loader2,
  Search,
  Filter,
  User,
  Sparkles,
  Ban,
  CheckCircle,
  Clock,
} from 'lucide-react';

interface Room {
  id: string;
  roomNumber: string;
  roomType: string;
  floor: number;
  bedType: string;
  maxOccupancy: number;
  baseRate: number;
  amenities: string[];
  occupancyStatus: string;
  cleaningStatus: string;
  currentGuestName?: string;
  isActive: boolean;
}

interface RoomStats {
  totalRooms: number;
  activeRooms: number;
  occupiedRooms: number;
  vacantRooms: number;
  occupancyRate: number;
  outOfOrder: number;
  dirtyRooms: number;
}

const ROOM_TYPES: Record<string, { name: string }> = {
  STANDARD: { name: 'Standard Room' },
  DELUXE: { name: 'Deluxe Room' },
  EXECUTIVE: { name: 'Executive Room' },
  SUITE: { name: 'Suite' },
  PRESIDENTIAL: { name: 'Presidential Suite' },
  SINGLE: { name: 'Single Room' },
  TWIN: { name: 'Twin Room' },
  FAMILY: { name: 'Family Room' },
};

const OCCUPANCY_STATUS: Record<string, { name: string; color: string }> = {
  VACANT: { name: 'Vacant', color: 'bg-green-100 text-green-700' },
  OCCUPIED: { name: 'Occupied', color: 'bg-blue-100 text-blue-700' },
  DUE_OUT: { name: 'Due Out', color: 'bg-orange-100 text-orange-700' },
  DUE_IN: { name: 'Due In', color: 'bg-purple-100 text-purple-700' },
  RESERVED: { name: 'Reserved', color: 'bg-indigo-100 text-indigo-700' },
};

const CLEANING_STATUS: Record<string, { name: string; color: string }> = {
  CLEAN: { name: 'Clean', color: 'bg-green-100 text-green-700' },
  DIRTY: { name: 'Dirty', color: 'bg-red-100 text-red-700' },
  INSPECTED: { name: 'Inspected', color: 'bg-teal-100 text-teal-700' },
  IN_PROGRESS: { name: 'Cleaning', color: 'bg-yellow-100 text-yellow-700' },
  OUT_OF_ORDER: { name: 'Out of Order', color: 'bg-gray-100 text-gray-700' },
};

function formatNaira(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [stats, setStats] = useState<RoomStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterOccupancy, setFilterOccupancy] = useState<string>('all');
  const [filterCleaning, setFilterCleaning] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/hospitality/rooms');
      const data = await response.json();
      
      if (data.success) {
        setRooms(data.rooms);
        setStats(data.stats);
      } else {
        setError(data.error || 'Failed to load rooms');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const filteredRooms = rooms.filter(room => {
    if (filterType !== 'all' && room.roomType !== filterType) return false;
    if (filterOccupancy !== 'all' && room.occupancyStatus !== filterOccupancy) return false;
    if (filterCleaning !== 'all' && room.cleaningStatus !== filterCleaning) return false;
    if (searchTerm && !room.roomNumber.includes(searchTerm)) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-slate-600">Loading rooms...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/hospitality/admin">
                <Button variant="ghost" size="sm" data-testid="back-btn">
                  <ArrowLeft className="h-4 w-4 mr-1" /> Back
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BedDouble className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-slate-900">Rooms</h1>
                  <p className="text-xs text-slate-500">{stats?.activeRooms || 0} active rooms</p>
                </div>
              </div>
            </div>
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
              DEMO MODE
            </Badge>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{stats?.occupiedRooms || 0}</p>
              <p className="text-xs text-slate-500">Occupied</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{stats?.vacantRooms || 0}</p>
              <p className="text-xs text-slate-500">Vacant</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-amber-600">{stats?.dirtyRooms || 0}</p>
              <p className="text-xs text-slate-500">Dirty</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-red-600">{stats?.outOfOrder || 0}</p>
              <p className="text-xs text-slate-500">Out of Order</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-slate-900">{stats?.occupancyRate || 0}%</p>
              <p className="text-xs text-slate-500">Occupancy</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-slate-400" />
            <Input
              placeholder="Room #"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-24"
              data-testid="search-room"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-40" data-testid="filter-type">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Room Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {Object.entries(ROOM_TYPES).map(([key, { name }]) => (
                <SelectItem key={key} value={key}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterOccupancy} onValueChange={setFilterOccupancy}>
            <SelectTrigger className="w-40" data-testid="filter-occupancy">
              <SelectValue placeholder="Occupancy" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {Object.entries(OCCUPANCY_STATUS).map(([key, { name }]) => (
                <SelectItem key={key} value={key}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterCleaning} onValueChange={setFilterCleaning}>
            <SelectTrigger className="w-40" data-testid="filter-cleaning">
              <SelectValue placeholder="Cleaning" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cleaning</SelectItem>
              {Object.entries(CLEANING_STATUS).map(([key, { name }]) => (
                <SelectItem key={key} value={key}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Rooms Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filteredRooms.map((room) => (
            <Card 
              key={room.id} 
              className={`relative overflow-hidden ${!room.isActive ? 'opacity-60' : ''}`}
              data-testid={`room-${room.roomNumber}`}
            >
              <div className={`absolute top-0 left-0 right-0 h-1 ${
                room.occupancyStatus === 'OCCUPIED' ? 'bg-blue-500' :
                room.occupancyStatus === 'VACANT' ? 'bg-green-500' :
                room.occupancyStatus === 'RESERVED' ? 'bg-indigo-500' :
                room.occupancyStatus === 'DUE_OUT' ? 'bg-orange-500' :
                'bg-purple-500'
              }`} />
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xl font-bold text-slate-900">{room.roomNumber}</span>
                  {room.occupancyStatus === 'OCCUPIED' && <User className="h-4 w-4 text-blue-500" />}
                  {room.cleaningStatus === 'DIRTY' && <Sparkles className="h-4 w-4 text-red-500" />}
                  {room.cleaningStatus === 'OUT_OF_ORDER' && <Ban className="h-4 w-4 text-gray-500" />}
                  {room.cleaningStatus === 'INSPECTED' && <CheckCircle className="h-4 w-4 text-teal-500" />}
                  {room.cleaningStatus === 'IN_PROGRESS' && <Clock className="h-4 w-4 text-yellow-500" />}
                </div>
                <p className="text-xs text-slate-500 mb-2">{ROOM_TYPES[room.roomType]?.name || room.roomType}</p>
                <div className="space-y-1">
                  <Badge className={`text-xs ${OCCUPANCY_STATUS[room.occupancyStatus]?.color || 'bg-slate-100'}`}>
                    {OCCUPANCY_STATUS[room.occupancyStatus]?.name || room.occupancyStatus}
                  </Badge>
                  <Badge className={`text-xs ${CLEANING_STATUS[room.cleaningStatus]?.color || 'bg-slate-100'}`}>
                    {CLEANING_STATUS[room.cleaningStatus]?.name || room.cleaningStatus}
                  </Badge>
                </div>
                {room.currentGuestName && (
                  <p className="text-xs text-slate-600 mt-2 truncate" title={room.currentGuestName}>
                    {room.currentGuestName}
                  </p>
                )}
                <p className="text-xs text-slate-400 mt-1">
                  {formatNaira(room.baseRate)}/night
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredRooms.length === 0 && (
          <div className="text-center py-12">
            <BedDouble className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No rooms match your filters</p>
          </div>
        )}
      </main>
    </div>
  );
}
