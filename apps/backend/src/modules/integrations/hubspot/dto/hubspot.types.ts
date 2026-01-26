/**
 * HubSpot Integration Types
 *
 * Defines interfaces for HubSpot API operations including contacts,
 * deals, and list assignments.
 */

/**
 * Lead qualification status based on form submission data
 */
export enum LeadQualification {
  QUALIFIED = 'qualified',
  NOT_QUALIFIED = 'not_qualified',
  PENDING = 'pending',
}

/**
 * Timeline classification for lead prioritization
 */
export enum LeadTimeline {
  IMMEDIATE = 'immediate',
  WITHIN_MONTH = 'within_month',
  WITHIN_QUARTER = 'within_quarter',
  EXPLORING = 'exploring',
}

/**
 * Contact creation request from form submission
 */
export interface CreateContactRequest {
  email: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  website?: string;
  phone?: string;
  jobTitle?: string;
  useCase?: string;
  timeline?: LeadTimeline;
  companySize?: string;
  message?: string;
  source?: string;
  gdprConsent?: boolean;
}

/**
 * Contact creation response
 */
export interface CreateContactResponse {
  id: string;
  email: string;
  createdAt: Date;
}

/**
 * Deal creation request for qualified leads
 */
export interface CreateDealRequest {
  contactId: string;
  dealName: string;
  amount?: number;
  closeDate?: Date;
  pipeline?: string;
  dealStage?: string;
  source?: string;
}

/**
 * Deal creation response
 */
export interface CreateDealResponse {
  id: string;
  dealId: string;
  createdAt: Date;
}

/**
 * List assignment request
 */
export interface AddToListRequest {
  contactId: string;
  listId: string;
}

/**
 * HubSpot configuration
 */
export interface HubSpotConfig {
  apiKey: string;
  enabled: boolean;
  demoRequestsListId?: string;
  waitlistListId?: string;
  earlyAccessListId?: string;
  dealPipeline?: string;
  dealStage?: string;
}

/**
 * Lead qualification criteria
 */
export interface QualificationCriteria {
  minCompanySize?: number;
  requiredTimeline?: LeadTimeline[];
}

/**
 * Result of lead qualification check
 */
export interface QualificationResult {
  qualified: boolean;
  reason?: string;
  score: number;
}
