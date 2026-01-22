import { Field, InputType, ObjectType, ID, Int } from '@nestjs/graphql';
import { ApiKeyScope, ApiKeyStatus } from '../entities/api-key.entity';

/**
 * Input for creating a new API key
 */
@InputType('CreateApiKeyInput')
export class CreateApiKeyInput {
  @Field(() => String)
  name: string;

  @Field(() => [ApiKeyScope])
  scopes: ApiKeyScope[];

  @Field(() => Int, { nullable: true, defaultValue: 60 })
  rateLimitPerMinute?: number | null;

  @Field(() => String, { nullable: true })
  expiresAt?: string | null;

  @Field(() => String, { nullable: true })
  description?: string | null;
}

/**
 * Input for updating an API key
 */
@InputType('UpdateApiKeyInput')
export class UpdateApiKeyInput {
  @Field(() => String, { nullable: true })
  name?: string | null;

  @Field(() => [ApiKeyScope], { nullable: true })
  scopes?: ApiKeyScope[] | null;

  @Field(() => Int, { nullable: true })
  rateLimitPerMinute?: number | null;

  @Field(() => String, { nullable: true })
  expiresAt?: string | null;

  @Field(() => String, { nullable: true })
  description?: string | null;
}

/**
 * Response when creating a new API key
 * Contains the raw key (only shown once) and the created entity
 */
@ObjectType('CreateApiKeyResponse')
export class CreateApiKeyResponse {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  rawKey: string;

  @Field(() => String)
  keyPrefix: string;

  @Field(() => String)
  name: string;

  @Field(() => [ApiKeyScope])
  scopes: ApiKeyScope[];

  @Field(() => Int)
  rateLimitPerMinute: number;

  @Field(() => ApiKeyStatus)
  status: ApiKeyStatus;

  @Field(() => String, { nullable: true })
  expiresAt: Date | null;

  @Field(() => String, { nullable: true })
  description: string | null;

  @Field(() => String)
  createdAt: Date;

  @Field(() => String)
  updatedAt: Date;
}

/**
 * Input for validating an API key
 */
@InputType('ValidateApiKeyInput')
export class ValidateApiKeyInput {
  @Field(() => String)
  rawKey: string;

  @Field(() => [ApiKeyScope], { nullable: true })
  requiredScopes?: ApiKeyScope[];
}

/**
 * Result of API key validation
 */
@ObjectType('ValidateApiKeyResponse')
export class ValidateApiKeyResponse {
  @Field(() => Boolean)
  isValid: boolean;

  @Field(() => ID, { nullable: true })
  apiKeyId: string | null;

  @Field(() => ID, { nullable: true })
  userId: string | null;

  @Field(() => [ApiKeyScope], { nullable: true })
  scopes: ApiKeyScope[] | null;

  @Field(() => ApiKeyStatus, { nullable: true })
  status: ApiKeyStatus | null;

  @Field(() => String, { nullable: true })
  message: string | null;
}
