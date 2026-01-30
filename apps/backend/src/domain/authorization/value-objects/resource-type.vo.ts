import { SimpleValueObject } from '../../shared/base';

/**
 * Resource Types Enumeration
 * Defines the resources that can be accessed in the system
 */
export enum ResourceTypeEnum {
  // User management
  USERS = 'users',
  USER_SESSIONS = 'user_sessions',

  // Authorization
  ROLES = 'roles',
  PERMISSIONS = 'permissions',

  // Legal documents
  DOCUMENTS = 'documents',
  DOCUMENT_TEMPLATES = 'document_templates',

  // Queries and AI
  QUERIES = 'queries',
  AI_PROMPTS = 'ai_prompts',

  // Legal rulings
  RULINGS = 'rulings',

  // Billing
  SUBSCRIPTIONS = 'subscriptions',
  PAYMENTS = 'payments',
  INVOICES = 'invoices',

  // Audit and logs
  AUDIT_LOGS = 'audit_logs',
  SYSTEM_LOGS = 'system_logs',

  // System settings
  SYSTEM_SETTINGS = 'system_settings',

  // Notifications
  NOTIFICATIONS = 'notifications',

  // Analytics
  ANALYTICS = 'analytics',

  // API keys
  API_KEYS = 'api_keys',

  // Collaboration
  COLLABORATION = 'collaboration',
}

/**
 * Resource Type Value Object
 * Represents a type of resource in the system
 */
export class ResourceType extends SimpleValueObject<ResourceTypeEnum> {
  protected validate(value: ResourceTypeEnum): void {
    if (!Object.values(ResourceTypeEnum).includes(value)) {
      throw new Error(`Invalid resource type: ${value}`);
    }
  }

  static create(type: ResourceTypeEnum): ResourceType {
    return new ResourceType(type);
  }

  static fromString(type: string): ResourceType {
    const enumValue = type as ResourceTypeEnum;
    if (!Object.values(ResourceTypeEnum).includes(enumValue)) {
      throw new Error(`Invalid resource type: ${type}`);
    }
    return new ResourceType(enumValue);
  }

  // Helper factory methods
  static users(): ResourceType {
    return new ResourceType(ResourceTypeEnum.USERS);
  }

  static roles(): ResourceType {
    return new ResourceType(ResourceTypeEnum.ROLES);
  }

  static documents(): ResourceType {
    return new ResourceType(ResourceTypeEnum.DOCUMENTS);
  }

  static queries(): ResourceType {
    return new ResourceType(ResourceTypeEnum.QUERIES);
  }

  static auditLogs(): ResourceType {
    return new ResourceType(ResourceTypeEnum.AUDIT_LOGS);
  }

  static systemSettings(): ResourceType {
    return new ResourceType(ResourceTypeEnum.SYSTEM_SETTINGS);
  }
}
