/**
 * Church Suite — Type Definitions
 * Phase 1: Registry & Membership
 *
 * Authorization: January 8, 2026
 * Classification: HIGH-RISK VERTICAL
 * Commerce Boundary: FACTS ONLY
 */

import { ChuMemberStatus, ChuChurchUnitLevel, ChuRoleType, ChuGender } from '@prisma/client';

// Re-export Prisma enums
export { ChuMemberStatus, ChuChurchUnitLevel, ChuRoleType, ChuGender };

// --- CHURCH INPUTS ---

export interface CreateChurchInput {
  name: string;
  acronym?: string;
  motto?: string;
  vision?: string;
  mission?: string;
  registrationNo?: string;
  registeredDate?: Date;
  headquarters?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  phone?: string;
  email?: string;
  website?: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

export interface UpdateChurchInput extends Partial<CreateChurchInput> {
  status?: string;
}

export interface ChurchQueryFilters {
  status?: string;
  state?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

// --- CHURCH UNIT INPUTS ---

export interface CreateChurchUnitInput {
  churchId: string;
  name: string;
  code?: string;
  level: ChuChurchUnitLevel;
  parentUnitId?: string;
  address?: string;
  city?: string;
  lga?: string;
  state?: string;
  phone?: string;
  email?: string;
  establishedDate?: Date;
}

export interface UpdateChurchUnitInput extends Partial<Omit<CreateChurchUnitInput, 'churchId' | 'level'>> {
  status?: string;
  currentLeaderId?: string;
  currentLeaderTitle?: string;
}

export interface ChurchUnitQueryFilters {
  churchId?: string;
  level?: ChuChurchUnitLevel;
  parentUnitId?: string;
  state?: string;
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

// --- CELL GROUP INPUTS ---

export interface CreateCellGroupInput {
  churchId: string;
  unitId?: string;
  name: string;
  code?: string;
  hostName?: string;
  hostPhone?: string;
  address?: string;
  area?: string;
  meetingDay?: string;
  meetingTime?: string;
  cellLeaderId?: string;
  assistantLeaderId?: string;
  maxMembers?: number;
}

export interface UpdateCellGroupInput extends Partial<Omit<CreateCellGroupInput, 'churchId'>> {
  status?: string;
}

export interface CellGroupQueryFilters {
  churchId?: string;
  unitId?: string;
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

// --- ROLE INPUTS ---

export interface CreateRoleInput {
  churchId: string;
  name: string;
  type: ChuRoleType;
  description?: string;
  canAssignAtUnit?: boolean;
  permissions?: string[];
}

export interface UpdateRoleInput extends Partial<Omit<CreateRoleInput, 'churchId' | 'type'>> {
  isActive?: boolean;
}

// --- ROLE ASSIGNMENT INPUTS ---

export interface CreateRoleAssignmentInput {
  churchId: string;
  memberId: string;
  roleId: string;
  unitId?: string;
  effectiveDate?: Date;
  endDate?: Date;
}

export interface TerminateRoleAssignmentInput {
  terminationReason?: string;
}

// --- MEMBER INPUTS ---

export interface CreateMemberInput {
  churchId: string;
  unitId?: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  gender?: ChuGender;
  dateOfBirth?: Date;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  lga?: string;
  state?: string;
  membershipNo?: string;
  joinDate?: Date;
  baptismDate?: Date;
  previousChurch?: string;
  transferLetter?: boolean;
  occupation?: string;
  employer?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  photoUrl?: string;
}

export interface UpdateMemberInput extends Partial<Omit<CreateMemberInput, 'churchId'>> {
  // Note: status changes go through statusHistory
}

export interface MemberQueryFilters {
  churchId?: string;
  unitId?: string;
  status?: ChuMemberStatus;
  isMinor?: boolean;
  state?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface ChangeMemberStatusInput {
  newStatus: ChuMemberStatus;
  reason?: string;
}

// --- GUARDIAN LINK INPUTS ---

export interface CreateGuardianLinkInput {
  minorId: string;
  guardianId: string;
  relationship: string;
  isPrimaryGuardian?: boolean;
}

export interface VerifyGuardianLinkInput {
  consentGiven?: boolean;
}

// --- FAMILY UNIT INPUTS ---

export interface CreateFamilyUnitInput {
  churchId: string;
  familyName: string;
  headId?: string;
  address?: string;
  city?: string;
  state?: string;
}

export interface UpdateFamilyUnitInput extends Partial<Omit<CreateFamilyUnitInput, 'churchId'>> {
  isActive?: boolean;
}

// --- CELL MEMBERSHIP INPUTS ---

export interface CreateCellMembershipInput {
  memberId: string;
  cellGroupId: string;
  role?: string;
}

// --- API RESPONSE DISCLAIMERS ---

export const CHURCH_DISCLAIMERS = {
  GENERAL: 'Church Suite — Digital Infrastructure for Faith Communities',
  INTERNAL: 'INTERNAL CHURCH MANAGEMENT SYSTEM',
  CONFIDENTIALITY: 'Member information is confidential and protected',
  COMMERCE_BOUNDARY: 'FACTS_ONLY — Church Suite does NOT process payments',
  MINORS_SAFEGUARDING: 'Minors data is protected with restricted access',
  PASTORAL_CONFIDENTIALITY: 'Pastoral notes are encrypted and access-logged',
} as const;
