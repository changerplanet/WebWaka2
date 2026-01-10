/**
 * MODULE 1: Inventory & Warehouse Management
 * Warehouse Service - Manages warehouse CRUD and mappings
 */

import { prisma } from '../prisma';
import { 
  CreateWarehouseRequest, 
  WarehouseResponse 
} from './types';

// ============================================================================
// WAREHOUSE SERVICE
// ============================================================================

export class WarehouseService {
  /**
   * Create a new warehouse (extends a Core Location)
   */
  static async create(
    tenantId: string,
    data: CreateWarehouseRequest
  ): Promise<WarehouseResponse> {
    // Verify the location exists and belongs to tenant
    const location = await prisma.location.findFirst({
      where: {
        id: data.locationId,
        tenantId,
      },
    });

    if (!location) {
      throw new Error('Location not found or does not belong to tenant');
    }

    // Check if warehouse already exists for this location
    const existing = await prisma.inv_warehouses.findUnique({
      where: { locationId: data.locationId },
    });

    if (existing) {
      throw new Error('Warehouse already exists for this location');
    }

    // Check for duplicate code
    const duplicateCode = await prisma.inv_warehouses.findFirst({
      where: {
        tenantId,
        code: data.code,
      },
    });

    if (duplicateCode) {
      throw new Error(`Warehouse code '${data.code}' already exists`);
    }

    // If setting as default, unset other defaults
    if (data.isDefaultForReceiving) {
      await prisma.inv_warehouses.updateMany({
        where: { tenantId, isDefaultForReceiving: true },
        data: { isDefaultForReceiving: false },
      });
    }

    const warehouse = await (prisma.inv_warehouses.create as any)({
      data: {
        tenantId,
        locationId: data.locationId,
        name: data.name,
        code: data.code,
        description: data.description,
        warehouseType: data.warehouseType || 'GENERAL',
        totalCapacity: data.totalCapacity,
        capacityUnit: data.capacityUnit,
        fulfillmentPriority: data.fulfillmentPriority || 0,
        acceptsTransfersIn: data.acceptsTransfersIn ?? true,
        acceptsTransfersOut: data.acceptsTransfersOut ?? true,
        isDefaultForReceiving: data.isDefaultForReceiving ?? false,
        managerName: data.managerName,
        managerPhone: data.managerPhone,
        managerEmail: data.managerEmail,
        lgaCode: data.lgaCode,
        stateCode: data.stateCode,
      },
    });

    return this.toResponse(warehouse, location);
  }

  /**
   * Get all warehouses for a tenant
   */
  static async list(
    tenantId: string,
    options?: {
      isActive?: boolean;
      warehouseType?: string;
      acceptsTransfersIn?: boolean;
      acceptsTransfersOut?: boolean;
    }
  ): Promise<WarehouseResponse[]> {
    const where: Record<string, unknown> = { tenantId };
    
    if (options?.isActive !== undefined) {
      where.isActive = options.isActive;
    }
    if (options?.warehouseType) {
      where.warehouseType = options.warehouseType;
    }
    if (options?.acceptsTransfersIn !== undefined) {
      where.acceptsTransfersIn = options.acceptsTransfersIn;
    }
    if (options?.acceptsTransfersOut !== undefined) {
      where.acceptsTransfersOut = options.acceptsTransfersOut;
    }

    const warehouses = await prisma.inv_warehouses.findMany({
      where,
      orderBy: [
        { fulfillmentPriority: 'desc' },
        { name: 'asc' },
      ],
    });

    // Fetch locations for all warehouses
    const locationIds = warehouses.map(w => w.locationId);
    const locations = await prisma.location.findMany({
      where: { id: { in: locationIds } },
    });
    const locationMap = new Map(locations.map(l => [l.id, l]));

    return warehouses.map(w => this.toResponse(w, locationMap.get(w.locationId)));
  }

  /**
   * Get a single warehouse by ID
   */
  static async getById(
    tenantId: string,
    warehouseId: string
  ): Promise<WarehouseResponse | null> {
    const warehouse = await prisma.inv_warehouses.findFirst({
      where: {
        id: warehouseId,
        tenantId,
      },
    });

    if (!warehouse) return null;

    const location = await prisma.location.findUnique({
      where: { id: warehouse.locationId },
    });

    return this.toResponse(warehouse, location);
  }

  /**
   * Get warehouse by location ID
   */
  static async getByLocationId(
    tenantId: string,
    locationId: string
  ): Promise<WarehouseResponse | null> {
    const warehouse = await prisma.inv_warehouses.findFirst({
      where: {
        locationId,
        tenantId,
      },
    });

    if (!warehouse) return null;

    const location = await prisma.location.findUnique({
      where: { id: locationId },
    });

    return this.toResponse(warehouse, location);
  }

  /**
   * Update a warehouse
   */
  static async update(
    tenantId: string,
    warehouseId: string,
    data: Partial<CreateWarehouseRequest>
  ): Promise<WarehouseResponse> {
    const existing = await prisma.inv_warehouses.findFirst({
      where: { id: warehouseId, tenantId },
    });

    if (!existing) {
      throw new Error('Warehouse not found');
    }

    // Check for duplicate code if changing
    if (data.code && data.code !== existing.code) {
      const duplicateCode = await prisma.inv_warehouses.findFirst({
        where: {
          tenantId,
          code: data.code,
          id: { not: warehouseId },
        },
      });

      if (duplicateCode) {
        throw new Error(`Warehouse code '${data.code}' already exists`);
      }
    }

    // If setting as default, unset other defaults
    if (data.isDefaultForReceiving && !existing.isDefaultForReceiving) {
      await prisma.inv_warehouses.updateMany({
        where: { tenantId, isDefaultForReceiving: true },
        data: { isDefaultForReceiving: false },
      });
    }

    const warehouse = await prisma.inv_warehouses.update({
      where: { id: warehouseId },
      data: {
        name: data.name,
        code: data.code,
        description: data.description,
        warehouseType: data.warehouseType,
        totalCapacity: data.totalCapacity,
        capacityUnit: data.capacityUnit,
        fulfillmentPriority: data.fulfillmentPriority,
        acceptsTransfersIn: data.acceptsTransfersIn,
        acceptsTransfersOut: data.acceptsTransfersOut,
        isDefaultForReceiving: data.isDefaultForReceiving,
        managerName: data.managerName,
        managerPhone: data.managerPhone,
        managerEmail: data.managerEmail,
        lgaCode: data.lgaCode,
        stateCode: data.stateCode,
      },
    });

    const location = await prisma.location.findUnique({
      where: { id: warehouse.locationId },
    });

    return this.toResponse(warehouse, location);
  }

  /**
   * Deactivate a warehouse (soft delete)
   */
  static async deactivate(
    tenantId: string,
    warehouseId: string
  ): Promise<void> {
    const existing = await prisma.inv_warehouses.findFirst({
      where: { id: warehouseId, tenantId },
    });

    if (!existing) {
      throw new Error('Warehouse not found');
    }

    // Check for pending transfers
    const pendingTransfers = await prisma.inv_stock_transfers.count({
      where: {
        tenantId,
        OR: [
          { fromWarehouseId: warehouseId },
          { toWarehouseId: warehouseId },
        ],
        status: {
          in: ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'IN_TRANSIT'],
        },
      },
    });

    if (pendingTransfers > 0) {
      throw new Error(
        `Cannot deactivate warehouse with ${pendingTransfers} pending transfers`
      );
    }

    await prisma.inv_warehouses.update({
      where: { id: warehouseId },
      data: { isActive: false },
    });
  }

  /**
   * Get warehouses that can receive transfers
   */
  static async getReceivingWarehouses(
    tenantId: string
  ): Promise<WarehouseResponse[]> {
    return this.list(tenantId, {
      isActive: true,
      acceptsTransfersIn: true,
    });
  }

  /**
   * Get warehouses that can send transfers
   */
  static async getSendingWarehouses(
    tenantId: string
  ): Promise<WarehouseResponse[]> {
    return this.list(tenantId, {
      isActive: true,
      acceptsTransfersOut: true,
    });
  }

  /**
   * Get default receiving warehouse
   */
  static async getDefaultReceivingWarehouse(
    tenantId: string
  ): Promise<WarehouseResponse | null> {
    const warehouse = await prisma.inv_warehouses.findFirst({
      where: {
        tenantId,
        isActive: true,
        isDefaultForReceiving: true,
      },
    });

    if (!warehouse) return null;

    const location = await prisma.location.findUnique({
      where: { id: warehouse.locationId },
    });

    return this.toResponse(warehouse, location);
  }

  /**
   * Convert to API response
   */
  private static toResponse(
    warehouse: {
      id: string;
      tenantId: string;
      locationId: string;
      name: string;
      code: string;
      description: string | null;
      warehouseType: string;
      totalCapacity: number | null;
      usedCapacity: number | null;
      capacityUnit: string | null;
      fulfillmentPriority: number;
      isActive: boolean;
      acceptsTransfersIn: boolean;
      acceptsTransfersOut: boolean;
      isDefaultForReceiving: boolean;
      managerName: string | null;
      managerPhone: string | null;
      managerEmail: string | null;
      lgaCode: string | null;
      stateCode: string | null;
      createdAt: Date;
      updatedAt: Date;
    },
    location?: {
      id: string;
      name: string;
      type: string;
      city: string | null;
      state: string | null;
      country: string | null;
    } | null
  ): WarehouseResponse {
    return {
      id: warehouse.id,
      tenantId: warehouse.tenantId,
      locationId: warehouse.locationId,
      name: warehouse.name,
      code: warehouse.code,
      description: warehouse.description || undefined,
      warehouseType: warehouse.warehouseType,
      totalCapacity: warehouse.totalCapacity || undefined,
      usedCapacity: warehouse.usedCapacity || undefined,
      capacityUnit: warehouse.capacityUnit || undefined,
      fulfillmentPriority: warehouse.fulfillmentPriority,
      isActive: warehouse.isActive,
      acceptsTransfersIn: warehouse.acceptsTransfersIn,
      acceptsTransfersOut: warehouse.acceptsTransfersOut,
      isDefaultForReceiving: warehouse.isDefaultForReceiving,
      managerName: warehouse.managerName || undefined,
      managerPhone: warehouse.managerPhone || undefined,
      managerEmail: warehouse.managerEmail || undefined,
      lgaCode: warehouse.lgaCode || undefined,
      stateCode: warehouse.stateCode || undefined,
      createdAt: warehouse.createdAt,
      updatedAt: warehouse.updatedAt,
      location: location
        ? {
            id: location.id,
            name: location.name,
            type: location.type,
            city: location.city || undefined,
            state: location.state || undefined,
            country: location.country || undefined,
          }
        : undefined,
    };
  }
}
