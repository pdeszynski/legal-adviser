/**
 * HubSpot Webhook Types
 *
 * Defines interfaces for HubSpot webhook event payloads.
 * HubSpot sends webhook notifications for contact, company, and deal lifecycle changes.
 * @see https://developers.hubspot.com/docs/api/webhooks
 */

/**
 * HubSpot webhook event types
 * These are the subscription types that can be configured in HubSpot
 */
export enum HubSpotEventType {
  CONTACT_CREATED = 'contact.creation',
  CONTACT_DELETED = 'contact.deletion',
  CONTACT_PROPERTY_CHANGE = 'contact.propertyChange',
  DEAL_CREATED = 'deal.creation',
  DEAL_DELETED = 'deal.deletion',
  DEAL_PROPERTY_CHANGE = 'deal.propertyChange',
  COMPANY_CREATED = 'company.creation',
  COMPANY_DELETED = 'company.deletion',
  COMPANY_PROPERTY_CHANGE = 'company.propertyChange',
}

/**
 * HubSpot webhook event payload structure
 * Each event contains the object ID, event type, and property changes
 */
export interface HubSpotWebhookEvent {
  eventId: number;
  subscriptionId: number;
  portalId: number;
  ownerId?: number;
  appId?: number;
  occurredAt: number; // Unix timestamp
  subscriptionType: string;
  attemptNumber: number;
  objectId: number;
  changeFlag?: string;
  changes?: HubSpotPropertyChange[];
  sourceId?: string;
  propertyName?: string;
  propertyValue?: string;
}

/**
 * Property change details for property change events
 */
export interface HubSpotPropertyChange {
  name: string;
  value: unknown;
}

/**
 * HubSpot webhook signature verification headers
 * HubSpot signs webhook payloads using SHA-256 with the app secret
 */
export interface HubSpotWebhookHeaders {
  'x-hubspot-signature': string;
  'x-hubspot-signature-version': string;
  'x-hubspot-request-timestamp'?: string;
}

/**
 * Status mapping between HubSpot deal stages and local DemoRequest status
 */
export enum HubSpotDealStage {
  APPOINTMENT_SCHEDULED = 'appointmentscheduled',
  QUALIFIED_TO_BUY = 'qualifiedtobuy',
  PRESENTATION_SCHEDULED = 'presentationscheduled',
  DECISION_MAKER_BOUGHT_IN = 'decisionmakerboughtin',
  CONTRACT_SENT = 'contractsent',
  CLOSED_WON = 'closedwon',
  CLOSED_LOST = 'closedlost',
}

/**
 * Mapping of HubSpot deal stages to DemoRequest status
 */
export const DEAL_STAGE_TO_STATUS: Record<HubSpotDealStage, string> = {
  [HubSpotDealStage.APPOINTMENT_SCHEDULED]: 'CONTACTED',
  [HubSpotDealStage.QUALIFIED_TO_BUY]: 'QUALIFIED',
  [HubSpotDealStage.PRESENTATION_SCHEDULED]: 'SCHEDULED',
  [HubSpotDealStage.DECISION_MAKER_BOUGHT_IN]: 'QUALIFIED',
  [HubSpotDealStage.CONTRACT_SENT]: 'QUALIFIED',
  [HubSpotDealStage.CLOSED_WON]: 'CLOSED',
  [HubSpotDealStage.CLOSED_LOST]: 'CLOSED',
};

/**
 * Webhook event processing result
 */
export interface WebhookProcessResult {
  success: boolean;
  demoRequestId?: string;
  oldStatus?: string;
  newStatus?: string;
  message: string;
}
