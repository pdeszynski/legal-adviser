import {
  Field,
  ObjectType,
  ID,
  InputType,
  registerEnumType,
} from '@nestjs/graphql';

// Enums for TypeScript
export enum RoleTypeEnum {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  LAWYER = 'lawyer',
  PARALEGAL = 'paralegal',
  CLIENT = 'client',
  GUEST = 'guest',
}

export enum PermissionTypeEnum {
  READ = 'read',
  WRITE = 'write',
  DELETE = 'delete',
  MANAGE = 'manage',
  EXECUTE = 'execute',
  APPROVE = 'approve',
}

export enum ResourceTypeEnum {
  USERS = 'users',
  USER_SESSIONS = 'user_sessions',
  ROLES = 'roles',
  PERMISSIONS = 'permissions',
  DOCUMENTS = 'documents',
  DOCUMENT_TEMPLATES = 'document_templates',
  QUERIES = 'queries',
  AI_PROMPTS = 'ai_prompts',
  RULINGS = 'rulings',
  SUBSCRIPTIONS = 'subscriptions',
  PAYMENTS = 'payments',
  INVOICES = 'invoices',
  AUDIT_LOGS = 'audit_logs',
  SYSTEM_LOGS = 'system_logs',
  SYSTEM_SETTINGS = 'system_settings',
  NOTIFICATIONS = 'notifications',
  ANALYTICS = 'analytics',
  API_KEYS = 'api_keys',
  COLLABORATION = 'collaboration',
}

// Register enums for GraphQL
registerEnumType(RoleTypeEnum, {
  name: 'RoleTypeEnum',
  description: 'Available role types in the system',
  valuesMap: {
    SUPER_ADMIN: { description: 'Super administrator with full access' },
    ADMIN: { description: 'Administrator with most permissions' },
    LAWYER: { description: 'Legal professional' },
    PARALEGAL: { description: 'Legal support staff' },
    CLIENT: { description: 'Client user' },
    GUEST: { description: 'Guest user with limited access' },
  },
});

registerEnumType(PermissionTypeEnum, {
  name: 'PermissionTypeEnum',
  description: 'Types of permissions available',
});

registerEnumType(ResourceTypeEnum, {
  name: 'ResourceTypeEnum',
  description: 'Resource types that can be accessed',
});

// Output Types
@ObjectType('Permission')
export class PermissionDTO {
  @Field(() => String)
  type: string;

  @Field(() => String)
  resource: string;

  @Field(() => String, { nullable: true })
  condition?: string;
}

@ObjectType('Role')
export class RoleDTO {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  name: string;

  @Field(() => String, { nullable: true })
  description: string | null;

  @Field(() => String)
  type: string;

  @Field(() => [PermissionDTO])
  permissions: PermissionDTO[];

  @Field(() => String, { nullable: true })
  inheritsFrom: string | null;

  @Field(() => Boolean)
  isSystemRole: boolean;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}

// Input Types
@InputType('CreateRoleInput')
export class CreateRoleInput {
  @Field(() => String)
  name: string;

  @Field(() => String, { nullable: true })
  description?: string;

  @Field(() => String)
  type: string;

  @Field(() => [String])
  permissions: string[];

  @Field(() => String, { nullable: true })
  inheritsFrom?: string;
}

@InputType('UpdateRoleInput')
export class UpdateRoleInput {
  @Field(() => String, { nullable: true })
  name?: string;

  @Field(() => String, { nullable: true })
  description?: string;
}

@InputType('AddPermissionInput')
export class AddPermissionInput {
  @Field(() => String)
  roleId: string;

  @Field(() => String)
  permission: string;
}

@InputType('RemovePermissionInput')
export class RemovePermissionInput {
  @Field(() => String)
  roleId: string;

  @Field(() => String)
  permission: string;
}

@InputType('CheckPermissionInput')
export class CheckPermissionInput {
  @Field(() => [String])
  roleNames: string[];

  @Field(() => String)
  permissionType: string;

  @Field(() => String)
  resourceType: string;
}

@ObjectType('PermissionCheckResult')
export class PermissionCheckResultDTO {
  @Field(() => Boolean)
  allowed: boolean;

  @Field(() => [String], { nullable: true })
  permissions?: string[] | null;
}
