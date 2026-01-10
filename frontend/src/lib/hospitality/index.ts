/**
 * HOSPITALITY SUITE: Main Exports
 * 
 * Barrel file for all hospitality suite services and types.
 */

// Configuration & Types
export * from './config';

// Demo Data
export {
  DEMO_TENANT_ID,
  DEMO_HOTEL_NAME,
  DEMO_ROOMS,
  DEMO_GUESTS,
  DEMO_RESERVATIONS,
  DEMO_HOUSEKEEPING_TASKS,
  DEMO_FOLIOS,
  DEMO_FOLIO_CHARGES,
  DEMO_STATS,
  getRoomsStore,
  getGuestsStore,
  getReservationsStore,
  getHousekeepingStore,
  getFoliosStore,
  getChargesStore,
  resetDemoData,
} from './demo-data';

// Room Service
export {
  getRooms,
  getRoomById,
  getRoomByNumber,
  updateRoomStatus,
  setRoomOccupied,
  setRoomVacant,
  setRoomCleaningStatus,
  checkAvailability,
  getRoomAvailabilityForDate,
  getRoomStats,
} from './room-service';

// Reservation Service
export {
  getReservations,
  getReservationById,
  getReservationByNumber,
  getTodayArrivals,
  getTodayDepartures,
  getInHouseGuests,
  createReservation,
  updateReservation,
  checkIn,
  checkOut,
  cancelReservation,
  markNoShow,
  getReservationStats,
} from './reservation-service';

// Guest Service
export {
  getGuests,
  getGuestById,
  getGuestByPhone,
  getGuestByEmail,
  searchGuests,
  createGuest,
  updateGuest,
  blacklistGuest,
  removeBlacklist,
  addLoyaltyPoints,
  redeemLoyaltyPoints,
  getGuestHistory,
  getVIPGuests,
  getCorporateGuests,
  getGuestStats,
} from './guest-service';

// Housekeeping Service
export {
  getHousekeepingTasks,
  getTaskById,
  getTasksByRoom,
  getPendingTasks,
  createTask,
  assignTask,
  startTask,
  completeTask,
  inspectTask,
  cancelTask,
  createCheckoutCleanTasks,
  createStayOverTasks,
  getRoomStatusBoard,
  getHousekeepingStats,
} from './housekeeping-service';

// Folio Service
export {
  getFolios,
  getFolioById,
  getFolioByReservation,
  createFolio,
  postCharge,
  postPayment,
  postRefund,
  getChargesByFolio,
  settleFolio,
  closeFolio,
  getFolioStats,
  postRoomCharge,
} from './folio-service';
