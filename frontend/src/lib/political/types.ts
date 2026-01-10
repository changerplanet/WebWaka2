/**
 * Political Suite - Type Definitions
 * Phase 1: Party & Campaign Operations
 * 
 * Authorization: January 8, 2026
 * Classification: HIGH-RISK VERTICAL
 */

import {
  PolPartyStatus,
  PolPartyOrganLevel,
  PolMemberStatus,
  PolMemberRole,
  PolCampaignStatus,
  PolCampaignType,
  PolCandidateStatus,
  PolEventType,
  PolEventStatus,
  PolVolunteerStatus,
  PolVolunteerRole,
  PolAuditAction,
} from '@prisma/client';

// Re-export enums for convenience
export {
  PolPartyStatus,
  PolPartyOrganLevel,
  PolMemberStatus,
  PolMemberRole,
  PolCampaignStatus,
  PolCampaignType,
  PolCandidateStatus,
  PolEventType,
  PolEventStatus,
  PolVolunteerStatus,
  PolVolunteerRole,
  PolAuditAction,
};

// ----------------------------------------------------------------------------
// PARTY TYPES
// ----------------------------------------------------------------------------

export interface CreatePartyInput {
  name: string;
  acronym: string;
  registrationNo?: string;
  motto?: string;
  slogan?: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  foundedDate?: Date;
  registeredDate?: Date;
  headquarters?: string;
  phone?: string;
  email?: string;
  website?: string;
}

export interface UpdatePartyInput extends Partial<CreatePartyInput> {
  status?: PolPartyStatus;
}

// ----------------------------------------------------------------------------
// PARTY ORGAN TYPES
// ----------------------------------------------------------------------------

export interface CreatePartyOrganInput {
  partyId: string;
  name: string;
  level: PolPartyOrganLevel;
  zone?: string;
  state?: string;
  lga?: string;
  ward?: string;
  parentOrganId?: string;
  chairmanName?: string;
  secretaryName?: string;
  treasurerName?: string;
  officeAddress?: string;
  phone?: string;
  email?: string;
}

export interface UpdatePartyOrganInput extends Partial<Omit<CreatePartyOrganInput, 'partyId'>> {
  isActive?: boolean;
}

// ----------------------------------------------------------------------------
// MEMBER TYPES
// ----------------------------------------------------------------------------

export interface CreateMemberInput {
  partyId: string;
  organId?: string;
  firstName: string;
  lastName: string;
  otherNames?: string;
  dateOfBirth?: Date;
  gender?: string;
  phone: string;
  email?: string;
  address?: string;
  state?: string;
  lga?: string;
  ward?: string;
  pollingUnit?: string;
  membershipNo?: string;
  voterCardNo?: string;
  ninNo?: string;
  photoUrl?: string;
  notes?: string;
}

export interface UpdateMemberInput extends Partial<Omit<CreateMemberInput, 'partyId'>> {
  role?: PolMemberRole;
  status?: PolMemberStatus;
}

export interface VerifyMemberInput {
  memberId: string;
  verifiedBy: string;
}

// ----------------------------------------------------------------------------
// CAMPAIGN TYPES
// ----------------------------------------------------------------------------

export interface CreateCampaignInput {
  partyId: string;
  name: string;
  description?: string;
  type: PolCampaignType;
  zone?: string;
  state?: string;
  constituency?: string;
  lga?: string;
  ward?: string;
  startDate: Date;
  endDate?: Date;
  electionDate?: Date;
  headquarters?: string;
  phone?: string;
  email?: string;
  website?: string;
  facebookUrl?: string;
  twitterUrl?: string;
  instagramUrl?: string;
}

export interface UpdateCampaignInput extends Partial<Omit<CreateCampaignInput, 'partyId'>> {
  status?: PolCampaignStatus;
  statusNote?: string;
}

// ----------------------------------------------------------------------------
// CANDIDATE TYPES
// ----------------------------------------------------------------------------

export interface CreateCandidateInput {
  campaignId: string;
  memberId?: string;
  firstName: string;
  lastName: string;
  otherNames?: string;
  dateOfBirth?: Date;
  gender?: string;
  phone: string;
  email?: string;
  position: string;
  constituency?: string;
  zone?: string;
  state?: string;
  lga?: string;
  ward?: string;
  biography?: string;
  manifesto?: string;
  photoUrl?: string;
  facebookUrl?: string;
  twitterUrl?: string;
  instagramUrl?: string;
}

export interface UpdateCandidateInput extends Partial<Omit<CreateCandidateInput, 'campaignId'>> {
  status?: PolCandidateStatus;
  statusNote?: string;
}

export interface ScreenCandidateInput {
  candidateId: string;
  screenedBy: string;
  screeningNote?: string;
  passed: boolean;
}

export interface ClearCandidateInput {
  candidateId: string;
  clearedBy: string;
  clearanceNote?: string;
}

// ----------------------------------------------------------------------------
// EVENT TYPES
// ----------------------------------------------------------------------------

export interface CreateEventInput {
  campaignId: string;
  name: string;
  description?: string;
  type: PolEventType;
  venue?: string;
  address?: string;
  state?: string;
  lga?: string;
  ward?: string;
  coordinates?: string;
  startDateTime: Date;
  endDateTime?: Date;
  expectedAttendance?: number;
  organizerId?: string;
  organizerName?: string;
  organizerPhone?: string;
  notes?: string;
}

export interface UpdateEventInput extends Partial<Omit<CreateEventInput, 'campaignId'>> {
  status?: PolEventStatus;
  statusNote?: string;
  actualAttendance?: number;
  internalNotes?: string;
}

// ----------------------------------------------------------------------------
// VOLUNTEER TYPES
// ----------------------------------------------------------------------------

export interface CreateVolunteerInput {
  campaignId: string;
  memberId?: string;
  eventId?: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  role: PolVolunteerRole;
  assignment?: string;
  state?: string;
  lga?: string;
  ward?: string;
  pollingUnit?: string;
  availableFrom?: Date;
  availableTo?: Date;
  isFullTime?: boolean;
  supervisorId?: string;
  supervisorName?: string;
  notes?: string;
}

export interface UpdateVolunteerInput extends Partial<Omit<CreateVolunteerInput, 'campaignId'>> {
  status?: PolVolunteerStatus;
  statusNote?: string;
  isTrainedAgent?: boolean;
  hoursLogged?: number;
  tasksCompleted?: number;
}

// ----------------------------------------------------------------------------
// AUDIT LOG TYPES
// ----------------------------------------------------------------------------

export interface CreateAuditLogInput {
  action: PolAuditAction;
  entityType: string;
  entityId: string;
  actorId: string;
  actorEmail?: string;
  actorName?: string;
  actorRole?: string;
  ipAddress?: string;
  userAgent?: string;
  description?: string;
  changes?: Record<string, { old: unknown; new: unknown }>;
  metadata?: Record<string, unknown>;
  state?: string;
  lga?: string;
  ward?: string;
}

// ----------------------------------------------------------------------------
// QUERY FILTERS
// ----------------------------------------------------------------------------

export interface PoliticalQueryFilters {
  state?: string;
  lga?: string;
  ward?: string;
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface PartyQueryFilters extends PoliticalQueryFilters {
  status?: PolPartyStatus;
}

export interface MemberQueryFilters extends PoliticalQueryFilters {
  partyId?: string;
  organId?: string;
  role?: PolMemberRole;
  status?: PolMemberStatus;
  isVerified?: boolean;
}

export interface CampaignQueryFilters extends PoliticalQueryFilters {
  partyId?: string;
  type?: PolCampaignType;
  status?: PolCampaignStatus;
}

export interface EventQueryFilters extends PoliticalQueryFilters {
  campaignId?: string;
  type?: PolEventType;
  status?: PolEventStatus;
  fromDate?: Date;
  toDate?: Date;
}

export interface VolunteerQueryFilters extends PoliticalQueryFilters {
  campaignId?: string;
  eventId?: string;
  role?: PolVolunteerRole;
  status?: PolVolunteerStatus;
}

// ----------------------------------------------------------------------------
// RESPONSE TYPES
// ----------------------------------------------------------------------------

export interface PoliticalListResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface PoliticalStatsResponse {
  parties: number;
  members: number;
  campaigns: number;
  activeCampaigns: number;
  candidates: number;
  events: number;
  upcomingEvents: number;
  volunteers: number;
  activeVolunteers: number;
}
