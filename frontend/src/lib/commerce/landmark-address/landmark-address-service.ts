/**
 * Landmark Address Service
 * Wave F5: Landmark-Based Addressing (SVM)
 * 
 * Manages landmark-based delivery addresses for Nigerian commerce.
 * Improves delivery success by using familiar landmarks.
 */

import { prisma } from '@/lib/prisma';
import {
  LandmarkAddress,
  SavedAddress,
  AddressValidationResult,
  AddressValidationError,
  AddressSuggestion,
  AddressSearchResult,
  NIGERIAN_STATES,
  getStateByName,
  getLGAsForState,
  formatLandmarkAddress,
} from './types';

export class LandmarkAddressService {
  private tenantId: string;

  constructor(tenantId: string) {
    this.tenantId = tenantId;
  }

  validateAddress(address: LandmarkAddress): AddressValidationResult {
    const errors: AddressValidationError[] = [];
    const suggestions: AddressSuggestion[] = [];

    if (!address.recipientName?.trim()) {
      errors.push({ field: 'recipientName', message: 'Recipient name is required' });
    }

    if (!address.recipientPhone?.trim()) {
      errors.push({ field: 'recipientPhone', message: 'Phone number is required' });
    } else if (!this.isValidNigerianPhone(address.recipientPhone)) {
      errors.push({ field: 'recipientPhone', message: 'Please enter a valid Nigerian phone number' });
    }

    if (address.alternatePhone && !this.isValidNigerianPhone(address.alternatePhone)) {
      errors.push({ field: 'alternatePhone', message: 'Please enter a valid Nigerian phone number' });
    }

    if (!address.state?.trim()) {
      errors.push({ field: 'state', message: 'State is required' });
    } else {
      const state = getStateByName(address.state);
      if (!state) {
        const matchingState = this.findClosestState(address.state);
        if (matchingState) {
          suggestions.push({
            field: 'state',
            currentValue: address.state,
            suggestedValue: matchingState,
            reason: 'Did you mean this state?',
          });
        } else {
          errors.push({ field: 'state', message: 'Please select a valid Nigerian state' });
        }
      }
    }

    if (!address.lga?.trim()) {
      errors.push({ field: 'lga', message: 'Local Government Area is required' });
    } else if (address.state) {
      const state = getStateByName(address.state);
      if (state) {
        const lgaExists = state.lgas.some(
          lga => lga.toLowerCase() === address.lga.toLowerCase()
        );
        if (!lgaExists) {
          const closestLGA = this.findClosestLGA(address.lga, state.lgas);
          if (closestLGA) {
            suggestions.push({
              field: 'lga',
              currentValue: address.lga,
              suggestedValue: closestLGA,
              reason: 'Did you mean this LGA?',
            });
          }
        }
      }
    }

    if (!address.area?.trim()) {
      errors.push({ field: 'area', message: 'Area/Neighborhood is required' });
    }

    if (!address.landmark?.trim()) {
      errors.push({ field: 'landmark', message: 'Primary landmark is required for delivery' });
    } else if (address.landmark.length < 5) {
      errors.push({ field: 'landmark', message: 'Please provide a more descriptive landmark' });
    }

    const formattedAddress = errors.length === 0 ? formatLandmarkAddress(address) : undefined;

    return {
      isValid: errors.length === 0,
      errors,
      suggestions: suggestions.length > 0 ? suggestions : undefined,
      formattedAddress,
    };
  }

  async saveAddress(customerId: string, address: LandmarkAddress): Promise<SavedAddress> {
    const validation = this.validateAddress(address);
    if (!validation.isValid) {
      throw new Error(`Invalid address: ${validation.errors.map(e => e.message).join(', ')}`);
    }

    if (address.isDefault) {
      await prisma.landmarkDeliveryAddress.updateMany({
        where: {
          tenantId: this.tenantId,
          customerId,
          isDefault: true,
        },
        data: { isDefault: false },
      });
    }

    const savedAddress = await prisma.landmarkDeliveryAddress.create({
      data: {
        tenantId: this.tenantId,
        customerId,
        recipientName: address.recipientName,
        recipientPhone: address.recipientPhone,
        alternatePhone: address.alternatePhone,
        state: address.state,
        lga: address.lga,
        city: address.city,
        area: address.area,
        landmark: address.landmark,
        landmarkType: address.landmarkType,
        nearbyLandmark: address.nearbyLandmark,
        streetName: address.streetName,
        houseNumber: address.houseNumber,
        buildingName: address.buildingName,
        floor: address.floor,
        deliveryInstructions: address.deliveryInstructions,
        isDefault: address.isDefault || false,
        label: address.label || 'OTHER',
        latitude: address.coordinates?.latitude,
        longitude: address.coordinates?.longitude,
        formattedAddress: formatLandmarkAddress(address),
      },
    });

    return this.mapToSavedAddress(savedAddress);
  }

  async updateAddress(addressId: string, customerId: string, address: Partial<LandmarkAddress>): Promise<SavedAddress> {
    const existing = await prisma.landmarkDeliveryAddress.findFirst({
      where: {
        id: addressId,
        tenantId: this.tenantId,
        customerId,
      },
    });

    if (!existing) {
      throw new Error('Address not found');
    }

    const updatedData: any = {};

    if (address.recipientName !== undefined) updatedData.recipientName = address.recipientName;
    if (address.recipientPhone !== undefined) updatedData.recipientPhone = address.recipientPhone;
    if (address.alternatePhone !== undefined) updatedData.alternatePhone = address.alternatePhone;
    if (address.state !== undefined) updatedData.state = address.state;
    if (address.lga !== undefined) updatedData.lga = address.lga;
    if (address.city !== undefined) updatedData.city = address.city;
    if (address.area !== undefined) updatedData.area = address.area;
    if (address.landmark !== undefined) updatedData.landmark = address.landmark;
    if (address.landmarkType !== undefined) updatedData.landmarkType = address.landmarkType;
    if (address.nearbyLandmark !== undefined) updatedData.nearbyLandmark = address.nearbyLandmark;
    if (address.streetName !== undefined) updatedData.streetName = address.streetName;
    if (address.houseNumber !== undefined) updatedData.houseNumber = address.houseNumber;
    if (address.buildingName !== undefined) updatedData.buildingName = address.buildingName;
    if (address.floor !== undefined) updatedData.floor = address.floor;
    if (address.deliveryInstructions !== undefined) updatedData.deliveryInstructions = address.deliveryInstructions;
    if (address.label !== undefined) updatedData.label = address.label;

    if (address.isDefault) {
      await prisma.landmarkDeliveryAddress.updateMany({
        where: {
          tenantId: this.tenantId,
          customerId,
          isDefault: true,
          id: { not: addressId },
        },
        data: { isDefault: false },
      });
      updatedData.isDefault = true;
    }

    const mergedAddress = {
      ...existing,
      ...updatedData,
    };
    updatedData.formattedAddress = formatLandmarkAddress({
      recipientName: mergedAddress.recipientName,
      recipientPhone: mergedAddress.recipientPhone,
      state: mergedAddress.state,
      lga: mergedAddress.lga,
      area: mergedAddress.area,
      landmark: mergedAddress.landmark,
      nearbyLandmark: mergedAddress.nearbyLandmark || undefined,
      streetName: mergedAddress.streetName || undefined,
      houseNumber: mergedAddress.houseNumber || undefined,
      buildingName: mergedAddress.buildingName || undefined,
    });

    const updated = await prisma.landmarkDeliveryAddress.update({
      where: { id: addressId },
      data: updatedData,
    });

    return this.mapToSavedAddress(updated);
  }

  async deleteAddress(addressId: string, customerId: string): Promise<void> {
    const existing = await prisma.landmarkDeliveryAddress.findFirst({
      where: {
        id: addressId,
        tenantId: this.tenantId,
        customerId,
      },
    });

    if (!existing) {
      throw new Error('Address not found');
    }

    await prisma.landmarkDeliveryAddress.delete({
      where: { id: addressId },
    });
  }

  async getCustomerAddresses(customerId: string): Promise<AddressSearchResult> {
    const addresses = await prisma.landmarkDeliveryAddress.findMany({
      where: {
        tenantId: this.tenantId,
        customerId,
      },
      orderBy: [
        { isDefault: 'desc' },
        { updatedAt: 'desc' },
      ],
    });

    return {
      addresses: addresses.map((a: any) => this.mapToSavedAddress(a)),
      total: addresses.length,
    };
  }

  async getAddress(addressId: string, customerId: string): Promise<SavedAddress | null> {
    const address = await prisma.landmarkDeliveryAddress.findFirst({
      where: {
        id: addressId,
        tenantId: this.tenantId,
        customerId,
      },
    });

    return address ? this.mapToSavedAddress(address) : null;
  }

  async setDefaultAddress(addressId: string, customerId: string): Promise<SavedAddress> {
    await prisma.landmarkDeliveryAddress.updateMany({
      where: {
        tenantId: this.tenantId,
        customerId,
        isDefault: true,
      },
      data: { isDefault: false },
    });

    const updated = await prisma.landmarkDeliveryAddress.update({
      where: { id: addressId },
      data: { isDefault: true },
    });

    return this.mapToSavedAddress(updated);
  }

  getStates(): Array<{ code: string; name: string }> {
    return NIGERIAN_STATES.map(s => ({ code: s.code, name: s.name }));
  }

  getLGAs(stateName: string): string[] {
    const state = getStateByName(stateName);
    return state?.lgas || [];
  }

  private isValidNigerianPhone(phone: string): boolean {
    const cleaned = phone.replace(/[\s\-\(\)]/g, '');
    
    const patterns = [
      /^0[789][01]\d{8}$/,
      /^\+234[789][01]\d{8}$/,
      /^234[789][01]\d{8}$/,
    ];
    
    return patterns.some(pattern => pattern.test(cleaned));
  }

  private findClosestState(input: string): string | null {
    const normalized = input.toLowerCase().trim();
    
    for (const state of NIGERIAN_STATES) {
      if (state.name.toLowerCase().includes(normalized) ||
          normalized.includes(state.name.toLowerCase())) {
        return state.name;
      }
    }
    
    return null;
  }

  private findClosestLGA(input: string, lgas: string[]): string | null {
    const normalized = input.toLowerCase().trim();
    
    for (const lga of lgas) {
      if (lga.toLowerCase().includes(normalized) ||
          normalized.includes(lga.toLowerCase())) {
        return lga;
      }
    }
    
    return null;
  }

  private mapToSavedAddress(record: any): SavedAddress {
    return {
      id: record.id,
      customerId: record.customerId,
      tenantId: record.tenantId,
      recipientName: record.recipientName,
      recipientPhone: record.recipientPhone,
      alternatePhone: record.alternatePhone || undefined,
      state: record.state,
      lga: record.lga,
      city: record.city || undefined,
      area: record.area,
      landmark: record.landmark,
      landmarkType: record.landmarkType || undefined,
      nearbyLandmark: record.nearbyLandmark || undefined,
      streetName: record.streetName || undefined,
      houseNumber: record.houseNumber || undefined,
      buildingName: record.buildingName || undefined,
      floor: record.floor || undefined,
      deliveryInstructions: record.deliveryInstructions || undefined,
      isDefault: record.isDefault,
      label: record.label,
      coordinates: record.latitude && record.longitude
        ? { latitude: Number(record.latitude), longitude: Number(record.longitude) }
        : undefined,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}

export function createLandmarkAddressService(tenantId: string): LandmarkAddressService {
  return new LandmarkAddressService(tenantId);
}
