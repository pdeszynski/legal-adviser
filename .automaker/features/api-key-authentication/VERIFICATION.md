# API Key Authentication - Implementation Summary

## Overview

This implementation adds API key authentication as an alternative to JWT authentication for the GraphQL API. Both authentication methods are now supported through the hybrid authentication guard.

## Changes Implemented

### 1. API Key Authentication Strategy
**File**: `apps/backend/src/modules/auth/strategies/api-key.strategy.ts`

- Created `ApiKeyStrategy` using `passport-http-bearer`
- Validates API keys from two header sources:
  - `Authorization: Bearer pk_...` (standard bearer token format)
  - `X-API-Key: pk_...` (custom header)
- Validates API key against hashed database values
- Records usage statistics (last used timestamp, IP address, usage count)
- Returns user information with API key metadata

### 2. Hybrid Authentication Guard
**File**: `apps/backend/src/modules/auth/guards/gql-hybrid-auth.guard.ts`

- Created `GqlHybridAuthGuard` that supports both JWT and API key authentication
- Automatically detects which auth method is being used
- Provides clear error messages for invalid credentials
- Maintains backward compatibility with existing JWT authentication

### 3. Auth Module Updates
**File**: `apps/backend/src/modules/auth/auth.module.ts`

- Registered `ApiKeyStrategy` in the AuthModule
- Added `ApiKeysModule` import to provide `ApiKeysService`
- Exported `GqlHybridAuthGuard` for use in other modules
- Updated providers to include new strategy and guard

### 4. API Keys Service Enhancement
**File**: `apps/backend/src/modules/api-keys/services/api-keys.service.ts`

- Updated `validate()` method to include user relation when querying API keys
- This allows the strategy to access user details for authentication

### 5. Guards Index
**File**: `apps/backend/src/modules/auth/guards/index.ts`

- Exported `GqlHybridAuthGuard` for easy importing

## Dependencies Added

```json
{
  "dependencies": {
    "passport-http-bearer": "^1.0.1"
  },
  "devDependencies": {
    "@types/passport-http-bearer": "^1.0.3"
  }
}
```

## How to Use

### Using JWT Authentication (existing behavior)
```graphql
query Me {
  me {
    id
    email
  }
}
```
Headers:
```
Authorization: Bearer <jwt_token>
```

### Using API Key Authentication (new)
```graphql
query Me {
  me {
    id
    email
  }
}
```
Headers (Option 1 - Bearer format):
```
Authorization: Bearer pk_...
```

Headers (Option 2 - Custom header):
```
X-API-Key: pk_...
```

### In Your Resolvers
Use the `GqlHybridAuthGuard` to support both authentication methods:

```typescript
import { UseGuards } from '@nestjs/common';
import { GqlHybridAuthGuard } from '../auth/guards';

@Resolver()
export class MyResolver {
  @Query(() => User)
  @UseGuards(GqlHybridAuthGuard)
  async me(@Context() context) {
    // context.req.user contains:
    // - userId: string
    // - username: string
    // - email: string
    // - roles: string[]
    // - authMethod: 'jwt' | 'api-key'
    // - apiKeyId: string (only present for API key auth)
  }
}
```

## Verification Steps

Since there are pre-existing build errors in the backup module that prevent compilation, follow these manual verification steps once those are resolved:

### 1. Start the Backend
```bash
cd apps/backend
pnpm dev:backend
```

### 2. Create a Test User and API Key
```bash
# Register a user
curl -X POST http://localhost:3333/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation Register($input: RegisterInput!) { register(input: $input) { accessToken user { id } } }",
    "variables": {
      "input": {
        "email": "test@example.com",
        "password": "TestPassword123!",
        "username": "testuser"
      }
    }
  }'

# Save the access token from the response

# Create an API key
curl -X POST http://localhost:3333/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{
    "query": "mutation CreateApiKey($input: CreateApiKeyInput!) { createApiKey(input: $input) { rawKey keyPrefix name } }",
    "variables": {
      "input": {
        "name": "Test API Key",
        "scopes": ["DOCUMENTS_READ", "QUERIES_READ"]
      }
    }
  }'

# Save the rawKey from the response
```

### 3. Test API Key Authentication
```bash
# Test with Authorization header (Bearer format)
curl -X POST http://localhost:3333/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <api_key>" \
  -d '{
    "query": "query Me { me { id email username } }"
  }'

# Test with X-API-Key header
curl -X POST http://localhost:3333/graphql \
  -H "Content-Type: application/json" \
  -H "X-API-Key: <api_key>" \
  -d '{
    "query": "query Me { me { id email username } }"
  }'

# Both should return the user information
```

### 4. Test Invalid API Key
```bash
curl -X POST http://localhost:3333/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer pk_invalidkey123" \
  -d '{
    "query": "query Me { me { id } }"
  }'

# Should return error: "Invalid or expired API key"
```

### 5. Test JWT Still Works
```bash
# JWT authentication should continue to work
curl -X POST http://localhost:3333/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt_token>" \
  -d '{
    "query": "query Me { me { id email } }"
  }'

# Should return user information
```

## Security Features

1. **Hashed API Keys**: API keys are hashed using bcrypt before storage
2. **Key Prefix**: Only the first 12 characters are stored in plain text for identification
3. **Usage Tracking**: Records last used timestamp, IP address, and usage count
4. **Expiration**: Supports optional expiration dates
5. **Scopes**: Fine-grained permission control per API key
6. **Rate Limiting**: Per-key rate limit configuration
7. **Status Management**: Active, Revoked, or Expired states

## Architecture Notes

- The `ApiKeyStrategy` extends Passport's `Strategy` class for consistency with existing JWT strategy
- The `GqlHybridAuthGuard` automatically detects which authentication method to use
- Both authentication methods return the same user structure for compatibility
- API key authentication includes additional metadata (`apiKeyId`, `authMethod`) in the user object

## Files Modified

- `apps/backend/src/modules/auth/auth.module.ts` - Added strategy and guard
- `apps/backend/src/modules/auth/guards/index.ts` - Exported new guard
- `apps/backend/src/modules/api-keys/services/api-keys.service.ts` - Added user relation to validate method

## Files Created

- `apps/backend/src/modules/auth/strategies/api-key.strategy.ts` - API key authentication strategy
- `apps/backend/src/modules/auth/strategies/index.ts` - Strategy exports
- `apps/backend/src/modules/auth/guards/gql-hybrid-auth.guard.ts` - Hybrid authentication guard

## Next Steps

1. Resolve existing build errors in the backup module
2. Run the automated Playwright tests for full verification
3. Consider adding rate limiting middleware for API keys
4. Add API key rotation functionality
5. Implement API key audit logging
