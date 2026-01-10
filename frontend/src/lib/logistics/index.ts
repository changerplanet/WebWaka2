/**
 * LOGISTICS SUITE: Main Exports
 * 
 * Barrel file for all logistics suite services and types.
 * ⚠️ DEMO ONLY - All data is in-memory
 */

// Configuration & Types
export * from './config';

// Demo Data
export {
  DEMO_TENANT_ID,
  DEMO_COMPANY_NAME,
  DEMO_COMPANY_LOCATION,
  DEMO_VEHICLES,
  DEMO_DRIVERS,
  DEMO_JOBS,
  DEMO_STATS,
  getVehiclesStore,
  getDriversStore,
  getJobsStore,
  getPODStore,
  resetDemoData,
} from './demo-data';

// Fleet Service
export {
  getVehicles,
  getVehicleById,
  getVehicleByNumber,
  getAvailableVehicles,
  updateVehicleStatus,
  assignDriverToVehicle,
  releaseVehicle,
  setVehicleMaintenance,
  createVehicle,
  getFleetStats,
} from './fleet-service';

// Driver Service
export {
  getDrivers,
  getDriverById,
  getDriverByNumber,
  getAvailableDrivers,
  searchDrivers,
  updateDriverStatus,
  assignDriverToJob,
  releaseDriver,
  setDriverOffDuty,
  suspendDriver,
  reinstateDriver,
  createDriver,
  updateDriverRating,
  recordTripCompletion,
  getDriverPerformance,
  getDriverStats,
} from './driver-service';

// Job/Dispatch Service
export {
  getJobs,
  getJobById,
  getJobByNumber,
  getActiveJobs,
  getPendingJobs,
  getJobsByDriver,
  createJob,
  assignJob,
  acceptJob,
  unassignJob,
  cancelJob,
  getJobStats,
} from './job-service';

// Tracking Service
export {
  updateJobStatus,
  getJobStatusHistory,
  updateDriverLocation,
  recordProofOfDelivery,
  getPODByJobId,
  markJobPaid,
  completeJob,
  getTrackingBoard,
} from './tracking-service';
