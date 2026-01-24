
🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Explore existing authentication structure in backend",
      "status": "in_progress",
      "activeForm": "Exploring existing authentication structure"
    },
    {
      "content": "Identify JWT guard and authentication strategy",
      "status": "pending",
      "activeForm": "Identifying JWT guard and authentication strategy"
    },
    {
      "content": "Plan implementation approach",
      "status": "pending",
      "activeForm": "Planning implementation approach"
    },
    {
      "content": "Implement proper HTTP status codes for auth errors",
      "status": "pending",
      "activeForm": "Implementing proper HTTP status codes"
    },
    {
      "content": "Verify with Playwright test",
      "status": "pending",
      "activeForm": "Verifying with Playwright test"
    }
  ]
}
Let me explore the authentication structure in the backend to understand the existing implementation.

🔧 Tool: Glob
Input: {
  "pattern": "apps/backend/src/**/*auth*"
}

🔧 Tool: Glob
Input: {
  "pattern": "apps/backend/src/**/*guard*"
}

🔧 Tool: Glob
Input: {
  "pattern": "apps/backend/src/**/*jwt*"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/auth/jwt.strategy.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/auth/guards/gql-auth.guard.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/auth/guards/gql-hybrid-auth.guard.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/auth/auth.module.ts"
}

🔧 Tool: Glob
Input: {
  "pattern": "apps/backend/src/modules/auth/strategies/*.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/auth/auth.resolver.ts"
}

🔧 Tool: Grep
Input: {
  "pattern": "UnauthorizedException|ForbiddenException",
  "path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/auth/strategies/api-key.strategy.ts"
}

🔧 Tool: Grep
Input: {
  "pattern": "exceptionFactory|GraphQLError|GqlOptionsFactory",
  "path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src"
}

🔧 Tool: Grep
Input: {
  "path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src",
  "pattern": "GraphQLModule|ApolloDriver"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/app.module.ts"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "activeForm": "Exploring existing authentication structure",
      "content": "Explore existing authentication structure in backend",
      "status": "completed"
    },
    {
      "activeForm": "Identifying JWT guard and authentication strategy",
      "content": "Identify JWT guard and authentication strategy",
      "status": "completed"
    },
    {
      "activeForm": "Planning implementation approach",
      "content": "Plan implementation approach",
      "status": "in_progress"
    },
    {
      "activeForm": "Implementing proper HTTP status codes",
      "content": "Implement proper HTTP status codes for auth errors",
      "status": "pending"
    },
    {
      "activeForm": "Verifying with Playwright test",
      "content": "Verify with Playwright test",
      "status": "pending"
    }
  ]
}
Let me also check how Apollo Server handles errors in GraphQL and look for any existing exception filters:

🔧 Tool: Grep
Input: {
  "path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src",
  "pattern": "ExceptionFilter|HttpException"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/auth/guards/admin.guard.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/auth/guards/document-permission.guard.ts"
}
Now let me check the existing tests to see how authentication errors are currently tested:

🔧 Tool: Glob
Input: {
  "pattern": "apps/backend/tests/**/*.spec.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/tests/playwright/graphql-auth.spec.ts"
}
Now I have a good understanding of the codebase. Let me update the todo list and plan the implementation:

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "activeForm": "Exploring existing authentication structure",
      "content": "Explore existing authentication structure in backend",
      "status": "completed"
    },
    {
      "activeForm": "Identifying JWT guard and authentication strategy",
      "content": "Identify JWT guard and authentication strategy",
      "status": "completed"
    },
    {
      "activeForm": "Planning implementation approach",
      "content": "Plan implementation approach",
      "status": "completed"
    },
    {
      "activeForm": "Creating custom auth exceptions",
      "content": "Create custom auth exceptions with proper HTTP status codes",
      "status": "in_progress"
    },
    {
      "activeForm": "Creating GraphQL exception filter",
      "content": "Create GraphQL exception filter for proper error formatting",
      "status": "pending"
    },
    {
      "activeForm": "Updating JWT strategy",
      "content": "Update JWT strategy to throw proper exceptions",
      "status": "pending"
    },
    {
      "activeForm": "Updating guards",
      "content": "Update guards to use proper exceptions",
      "status": "pending"
    },
    {
      "activeForm": "Verifying with Playwright test",
      "content": "Verify with Playwright test",
      "status": "pending"
    }
  ]
}
## Implementation Plan

Based on my exploration, I need to:

1. **Create custom auth exceptions** with proper HTTP status codes (401 for expired/invalid tokens, 403 for forbidden)
2. **Create a GraphQL exception filter** to properly format errors with HTTP status codes
3. **Update the GraphQL module** to use the custom exception filter
4. **Update the JWT strategy** to detect token expiry and throw proper exceptions
5. **Update guards** to use the new exceptions

In GraphQL, errors are returned in the response body but the HTTP status is typically 200. To return proper HTTP status codes, we need to:
1. Use custom exceptions that include status code metadata
2. Add a filter/interceptor that sets the HTTP status code based on the exception

Let me start implementing:

🔧 Tool: Glob
Input: {
  "pattern": "apps/backend/src/**/*.filter.ts"
}

🔧 Tool: Glob
Input: {
  "pattern": "apps/backend/src/**/*exception*"
}

🔧 Tool: Glob
Input: {
  "pattern": "apps/backend/src/shared/**/*.ts"
}
Now let me create the necessary files. First, I'll create custom exceptions and a GraphQL exception filter:

🔧 Tool: Write
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/auth/exceptions/auth.exceptions.ts",
  "content": "import { UnauthorizedException, ForbiddenException } from '@nestjs/common';\n\n/**\n * Base Authentication Exception\n *\n * All auth exceptions extend this to allow consistent handling\n */\nexport class BaseAuthException extends Error {\n  constructor(\n    message: string,\n    public readonly code: string,\n    public readonly httpStatus: number,\n  ) {\n    super(message);\n    this.name = this.constructor.name;\n    Object.setPrototypeOf(this, BaseAuthException.prototype);\n  }\n}\n\n/**\n * Token Expired Exception\n *\n * Thrown when JWT token has expired\n * HTTP Status: 401 Unauthorized\n */\nexport class TokenExpiredException extends BaseAuthException {\n  constructor(message: string = 'Token has expired') {\n    super(message, 'TOKEN_EXPIRED', 401);\n    Object.setPrototypeOf(this, TokenExpiredException.prototype);\n  }\n}\n\n/**\n * Invalid Token Exception\n *\n * Thrown when JWT token is malformed or invalid\n * HTTP Status: 401 Unauthorized\n */\nexport class InvalidTokenException extends BaseAuthException {\n  constructor(message: string = 'Invalid token') {\n    super(message, 'INVALID_TOKEN', 401);\n    Object.setPrototypeOf(this, InvalidTokenException.prototype);\n  }\n}\n\n/**\n * Missing Token Exception\n *\n * Thrown when no authorization token is provided\n * HTTP Status: 401 Unauthorized\n */\nexport class MissingTokenException extends BaseAuthException {\n  constructor(message: string = 'Authorization token is required') {\n    super(message, 'MISSING_TOKEN', 401);\n    Object.setPrototypeOf(this, MissingTokenException.prototype);\n  }\n}\n\n/**\n * Forbidden Access Exception\n *\n * Thrown when user is authenticated but lacks required permissions\n * HTTP Status: 403 Forbidden\n */\nexport class ForbiddenAccessException extends BaseAuthException {\n  constructor(message: string = 'Access forbidden') {\n    super(message, 'FORBIDDEN', 403);\n    Object.setPrototypeOf(this, ForbiddenAccessException.prototype);\n  }\n}\n\n/**\n * User Inactive Exception\n *\n * Thrown when user account is inactive\n * HTTP Status: 403 Forbidden\n */\nexport class UserInactiveException extends BaseAuthException {\n  constructor(message: string = 'User account is inactive') {\n    super(message, 'USER_INACTIVE', 403);\n    Object.setPrototypeOf(this, UserInactiveException.prototype);\n  }\n}\n\n/**\n * Convert NestJS HTTP exceptions to our custom exceptions\n * Used in guards and strategies for consistent error handling\n */\nexport function toAuthException(\n  error: any,\n): BaseAuthException | UnauthorizedException | ForbiddenException {\n  // If it's already one of our custom exceptions, return as-is\n  if (error instanceof BaseAuthException) {\n    return error;\n  }\n\n  // Convert JWT expiry error\n  if (error?.name === 'TokenExpiredError') {\n    return new TokenExpiredException();\n  }\n\n  // Convert JWT validation error\n  if (error?.name === 'JsonWebTokenError') {\n    return new InvalidTokenException(error.message);\n  }\n\n  // Convert not before error\n  if (error?.name === 'NotBeforeError') {\n    return new InvalidTokenException('Token not yet valid');\n  }\n\n  // Return generic unauthorized exception\n  return new UnauthorizedException(error?.message || 'Authentication failed');\n}\n"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "activeForm": "Exploring existing authentication structure",
      "content": "Explore existing authentication structure in backend",
      "status": "completed"
    },
    {
      "activeForm": "Identifying JWT guard and authentication strategy",
      "content": "Identify JWT guard and authentication strategy",
      "status": "completed"
    },
    {
      "activeForm": "Planning implementation approach",
      "content": "Plan implementation approach",
      "status": "completed"
    },
    {
      "activeForm": "Creating custom auth exceptions",
      "content": "Create custom auth exceptions with proper HTTP status codes",
      "status": "completed"
    },
    {
      "activeForm": "Creating GraphQL exception filter",
      "content": "Create GraphQL exception filter for proper error formatting",
      "status": "in_progress"
    },
    {
      "activeForm": "Updating JWT strategy",
      "content": "Update JWT strategy to throw proper exceptions",
      "status": "pending"
    },
    {
      "activeForm": "Updating guards",
      "content": "Update guards to use proper exceptions",
      "status": "pending"
    },
    {
      "activeForm": "Verifying with Playwright test",
      "content": "Verify with Playwright test",
      "status": "pending"
    }
  ]
}
Now let me create the GraphQL exception filter to properly handle errors and return correct HTTP status codes:

🔧 Tool: Write
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/auth/exceptions/graphql-auth-exception.filter.ts",
  "content": "import {\n  ExceptionFilter,\n  Catch,\n  ArgumentsHost,\n  HttpException,\n  HttpStatus,\n  Injectable,\n} from '@nestjs/common';\nimport { ApolloError } from 'apollo-server-errors';\nimport { GqlExecutionContext } from '@nestjs/graphql';\nimport { GraphQLError } from 'graphql';\n\nimport {\n  BaseAuthException,\n  TokenExpiredException,\n  InvalidTokenException,\n  MissingTokenException,\n  ForbiddenAccessException,\n  UserInactiveException,\n} from './auth.exceptions';\n\n/**\n * GraphQL Authentication Exception Filter\n *\n * Catches authentication and authorization exceptions and:\n * 1. Sets appropriate HTTP status code on response\n * 2. Returns properly formatted GraphQL errors with code extensions\n *\n * This ensures clients receive:\n * - Correct HTTP status (401 for auth errors, 403 for forbidden)\n * - Clear error codes for client-side handling\n * - Indicators for token expiry\n */\n@Injectable()\n@Catch()\nexport class GqlAuthExceptionFilter implements ExceptionFilter {\n  catch(exception: unknown, host: ArgumentsHost) {\n    const ctx = GqlExecutionContext.create(host);\n    const { res } = ctx.getContext();\n\n    // Default values\n    let status = HttpStatus.INTERNAL_SERVER_ERROR;\n    let message = 'Internal server error';\n    let code = 'INTERNAL_SERVER_ERROR';\n    let extensions: Record<string, any> = {};\n\n    // Handle BaseAuthException (our custom exceptions)\n    if (exception instanceof BaseAuthException) {\n      status = exception.httpStatus;\n      message = exception.message;\n      code = exception.code;\n      extensions = {\n        code,\n        httpStatus: exception.httpStatus,\n      };\n\n      // Add specific extension for token expiry\n      if (exception instanceof TokenExpiredException) {\n        extensions.expired = true;\n      }\n    }\n    // Handle standard NestJS HttpException\n    else if (exception instanceof HttpException) {\n      status = exception.getStatus();\n      const exceptionResponse = exception.getResponse();\n\n      if (typeof exceptionResponse === 'string') {\n        message = exceptionResponse;\n      } else if (typeof exceptionResponse === 'object') {\n        const responseObj = exceptionResponse as any;\n        message = responseObj.message || exception.message;\n        // Handle array of messages from validation\n        if (Array.isArray(message)) {\n          message = message.join(', ');\n        }\n      } else {\n        message = exception.message;\n      }\n\n      code = this.getErrorCodeFromStatus(status);\n      extensions = {\n        code,\n        httpStatus: status,\n      };\n\n      // Detect token expiry from standard unauthorized exception\n      if (\n        status === HttpStatus.UNAUTHORIZED &&\n        message.toLowerCase().includes('expired')\n      ) {\n        extensions.expired = true;\n        code = 'TOKEN_EXPIRED';\n      }\n    }\n    // Handle standard Error\n    else if (exception instanceof Error) {\n      message = exception.message;\n\n      // Detect JWT errors from jsonwebtoken library\n      if (exception.name === 'TokenExpiredError') {\n        status = HttpStatus.UNAUTHORIZED;\n        code = 'TOKEN_EXPIRED';\n        message = 'Token has expired';\n        extensions = { code, httpStatus: status, expired: true };\n      } else if (exception.name === 'JsonWebTokenError') {\n        status = HttpStatus.UNAUTHORIZED;\n        code = 'INVALID_TOKEN';\n        message = 'Invalid token';\n        extensions = { code, httpStatus: status };\n      } else if (exception.name === 'NotBeforeError') {\n        status = HttpStatus.UNAUTHORIZED;\n        code = 'INVALID_TOKEN';\n        message = 'Token not yet valid';\n        extensions = { code, httpStatus: status };\n      }\n    }\n\n    // Set HTTP status code on response\n    res.status(status);\n\n    // Return GraphQL error\n    return new GraphQLError(message, {\n      extensions: {\n        ...extensions,\n        exception: {\n          message,\n          status,\n        },\n      },\n    });\n  }\n\n  /**\n   * Map HTTP status codes to error codes\n   */\n  private getErrorCodeFromStatus(status: number): string {\n    switch (status) {\n      case HttpStatus.UNAUTHORIZED:\n        return 'UNAUTHORIZED';\n      case HttpStatus.FORBIDDEN:\n        return 'FORBIDDEN';\n      case HttpStatus.NOT_FOUND:\n        return 'NOT_FOUND';\n      case HttpStatus.BAD_REQUEST:\n        return 'BAD_REQUEST';\n      case HttpStatus.TOO_MANY_REQUESTS:\n        return 'TOO_MANY_REQUESTS';\n      default:\n        return 'INTERNAL_SERVER_ERROR';\n    }\n  }\n}\n\n/**\n * Re-export for convenience\n */\nexport * from './auth.exceptions';\n"
}
Now I need to create an index file for easier imports:

🔧 Tool: Write
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/auth/exceptions/index.ts",
  "content": "export * from './auth.exceptions';\nexport * from './graphql-auth-exception.filter';\n"
}
Now I need to update the AuthModule to include the exception filter in providers:

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/auth/auth.module.ts"
}
For GraphQL, exception filters need to be applied differently. Let me update the app.module.ts to configure the GraphQL module with proper error formatting:

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/app.module.ts",
  "old_string": "import { Module } from '@nestjs/common';\nimport { ConfigModule, ConfigService } from '@nestjs/config';\nimport { EventEmitterModule } from '@nestjs/event-emitter';\nimport { BullModule } from '@nestjs/bull';\nimport { ScheduleModule } from '@nestjs/schedule';\nimport { GraphQLModule } from '@nestjs/graphql';\nimport { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';\nimport { ThrottlerModule } from '@nestjs/throttler';\nimport { APP_INTERCEPTOR } from '@nestjs/core';\nimport { join } from 'node:path';\nimport { AppController } from './app.controller';\nimport { AppService } from './app.service';\nimport { AiClientModule } from './shared/ai-client/ai-client.module';\nimport { StreamingModule } from './shared/streaming';\nimport { QueueRegistry } from './shared/queues';\nimport { CsrfModule } from './shared/csrf';\nimport { UsersModule } from './modules/users/users.module';\nimport { AuthModule } from './modules/auth/auth.module';\nimport { DocumentsModule } from './modules/documents/documents.module';\nimport { AuditLogModule } from './modules/audit-log/audit-log.module';\nimport { QueriesModule } from './modules/queries/queries.module';\nimport { NotificationsModule } from './modules/notifications/notifications.module';\nimport { HealthModule } from './modules/health/health.module';\nimport { BillingModule } from './modules/billing/billing.module';\nimport { UsageTrackingModule } from './modules/usage-tracking/usage-tracking.module';\nimport { UserPreferencesModule } from './modules/user-preferences/user-preferences.module';\nimport { AnalyticsModule } from './modules/analytics/analytics.module';\nimport { ApiKeysModule } from './modules/api-keys/api-keys.module';\nimport { BackupModule } from './modules/backup/backup.module';\nimport { DatabaseModule } from './database/database.module';\nimport { CollaborationModule } from './modules/collaboration/collaboration.module';\nimport { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';\nimport { SystemSettingsModule } from './modules/system-settings/system-settings.module';\nimport { WebhooksModule } from './modules/webhooks/webhooks.module';\n// Strict Layered Architecture - new modules following DDD patterns\nimport { PresentationModule } from './presentation/presentation.module';\n// Interceptors\nimport { AuditLoggingInterceptor } from './shared/interceptors/audit-logging.interceptor';\nimport { EventDispatcherModule } from './shared/events/event-dispatcher.module';\n// Error tracking\nimport { SentryModule } from './common/sentry/sentry.module';\n// Structured logging\nimport { LoggerModule } from './shared/logger';\nimport { LoggingInterceptor } from './shared/logger';",
  "new_string": "import { Module } from '@nestjs/common';\nimport { ConfigModule, ConfigService } from '@nestjs/config';\nimport { EventEmitterModule } from '@nestjs/event-emitter';\nimport { BullModule } from '@nestjs/bull';\nimport { ScheduleModule } from '@nestjs/schedule';\nimport { GraphQLModule } from '@nestjs/graphql';\nimport { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';\nimport { ThrottlerModule } from '@nestjs/throttler';\nimport { APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';\nimport { join } from 'node:path';\nimport { AppController } from './app.controller';\nimport { AppService } from './app.service';\nimport { AiClientModule } from './shared/ai-client/ai-client.module';\nimport { StreamingModule } from './shared/streaming';\nimport { QueueRegistry } from './shared/queues';\nimport { CsrfModule } from './shared/csrf';\nimport { UsersModule } from './modules/users/users.module';\nimport { AuthModule } from './modules/auth/auth.module';\nimport { DocumentsModule } from './modules/documents/documents.module';\nimport { AuditLogModule } from './modules/audit-log/audit-log.module';\nimport { QueriesModule } from './modules/queries/queries.module';\nimport { NotificationsModule } from './modules/notifications/notifications.module';\nimport { HealthModule } from './modules/health/health.module';\nimport { BillingModule } from './modules/billing/billing.module';\nimport { UsageTrackingModule } from './modules/usage-tracking/usage-tracking.module';\nimport { UserPreferencesModule } from './modules/user-preferences/user-preferences.module';\nimport { AnalyticsModule } from './modules/analytics/analytics.module';\nimport { ApiKeysModule } from './modules/api-keys/api-keys.module';\nimport { BackupModule } from './modules/backup/backup.module';\nimport { DatabaseModule } from './database/database.module';\nimport { CollaborationModule } from './modules/collaboration/collaboration.module';\nimport { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';\nimport { SystemSettingsModule } from './modules/system-settings/system-settings.module';\nimport { WebhooksModule } from './modules/webhooks/webhooks.module';\n// Strict Layered Architecture - new modules following DDD patterns\nimport { PresentationModule } from './presentation/presentation.module';\n// Interceptors\nimport { AuditLoggingInterceptor } from './shared/interceptors/audit-logging.interceptor';\nimport { EventDispatcherModule } from './shared/events/event-dispatcher.module';\n// Error tracking\nimport { SentryModule } from './common/sentry/sentry.module';\n// Structured logging\nimport { LoggerModule } from './shared/logger';\nimport { LoggingInterceptor } from './shared/logger';\n// Exception filters\nimport { GqlAuthExceptionFilter } from './modules/auth/exceptions';"
}

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/app.module.ts",
  "old_string": "  providers: [\n    AppService,\n    // Throttler is no longer applied globally to avoid issues with dashboard requests\n    // Use @UseGuards(GqlThrottlerGuard) on specific routes that need rate limiting (e.g., login)\n    // Apply audit logging interceptor globally to capture all GraphQL mutations\n    {\n      provide: APP_INTERCEPTOR,\n      useClass: AuditLoggingInterceptor,\n    },\n    // Apply structured logging interceptor globally\n    {\n      provide: APP_INTERCEPTOR,\n      useClass: LoggingInterceptor,\n    },\n  ],",
  "new_string": "  providers: [\n    AppService,\n    // Throttler is no longer applied globally to avoid issues with dashboard requests\n    // Use @UseGuards(GqlThrottlerGuard) on specific routes that need rate limiting (e.g., login)\n    // Apply audit logging interceptor globally to capture all GraphQL mutations\n    {\n      provide: APP_INTERCEPTOR,\n      useClass: AuditLoggingInterceptor,\n    },\n    // Apply structured logging interceptor globally\n    {\n      provide: APP_INTERCEPTOR,\n      useClass: LoggingInterceptor,\n    },\n    // Apply GraphQL authentication exception filter globally\n    // This ensures proper HTTP status codes (401, 403) are returned for auth errors\n    {\n      provide: APP_FILTER,\n      useClass: GqlAuthExceptionFilter,\n    },\n  ],"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "activeForm": "Exploring existing authentication structure",
      "content": "Explore existing authentication structure in backend",
      "status": "completed"
    },
    {
      "activeForm": "Identifying JWT guard and authentication strategy",
      "content": "Identify JWT guard and authentication strategy",
      "status": "completed"
    },
    {
      "activeForm": "Planning implementation approach",
      "content": "Plan implementation approach",
      "status": "completed"
    },
    {
      "activeForm": "Creating custom auth exceptions",
      "content": "Create custom auth exceptions with proper HTTP status codes",
      "status": "completed"
    },
    {
      "activeForm": "Creating GraphQL exception filter",
      "content": "Create GraphQL exception filter for proper error formatting",
      "status": "completed"
    },
    {
      "activeForm": "Updating JWT strategy",
      "content": "Update JWT strategy to throw proper exceptions",
      "status": "in_progress"
    },
    {
      "activeForm": "Updating guards",
      "content": "Update guards to use proper exceptions",
      "status": "pending"
    },
    {
      "activeForm": "Verifying with Playwright test",
      "content": "Verify with Playwright test",
      "status": "pending"
    }
  ]
}
Now let me update the JWT strategy to handle token expiry properly:

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/auth/jwt.strategy.ts"
}
The JWT strategy with `ignoreExpiration: false` will automatically throw a TokenExpiredError when the token is expired. This error is caught by our exception filter. However, I need to update the guards to handle authentication failures properly:

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/auth/guards/gql-auth.guard.ts",
  "old_string": "import { Injectable, ExecutionContext } from '@nestjs/common';\nimport { AuthGuard } from '@nestjs/passport';\nimport { GqlExecutionContext } from '@nestjs/graphql';\n\n/**\n * GraphQL Authentication Guard\n *\n * Extends the default JWT AuthGuard to work with GraphQL context\n * instead of standard HTTP request context.\n */\n@Injectable()\nexport class GqlAuthGuard extends AuthGuard('jwt') {\n  /**\n   * Override getRequest to extract the request from GraphQL context\n   */\n  getRequest(context: ExecutionContext) {\n    const ctx = GqlExecutionContext.create(context);\n    return ctx.getContext().req;\n  }\n}",
  "new_string": "import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';\nimport { AuthGuard } from '@nestjs/passport';\nimport { GqlExecutionContext } from '@nestjs/graphql';\nimport { MissingTokenException } from '../exceptions';\n\n/**\n * GraphQL Authentication Guard\n *\n * Extends the default JWT AuthGuard to work with GraphQL context\n * instead of standard HTTP request context.\n *\n * Throws appropriate exceptions for different authentication failure scenarios:\n * - Missing authorization header -> MissingTokenException (401)\n * - Invalid/expired token -> TokenExpiredException/InvalidTokenException (401)\n */\n@Injectable()\nexport class GqlAuthGuard extends AuthGuard('jwt') {\n  /**\n   * Override getRequest to extract the request from GraphQL context\n   */\n  getRequest(context: ExecutionContext) {\n    const ctx = GqlExecutionContext.create(context);\n    return ctx.getContext().req;\n  }\n\n  /**\n   * Override handleRequest to provide custom exception handling\n   *\n   * When authentication fails, this method is called with the error.\n   * We convert errors to our custom exceptions for consistent error handling.\n   */\n  handleRequest<TUser = any>(\n    err: any,\n    user: TUser,\n    info: any,\n    context: ExecutionContext,\n  ): TUser {\n    // If authentication succeeded, return the user\n    if (user) {\n      return user;\n    }\n\n    // Handle specific JWT errors\n    if (info) {\n      // No token provided\n      if (info.name === 'NoAuthTokenError' || !info) {\n        throw new MissingTokenException();\n      }\n      // Token expired\n      if (info.name === 'TokenExpiredError') {\n        const exception = new Error('Token has expired');\n        (exception as any).name = 'TokenExpiredError';\n        throw exception;\n      }\n      // Invalid token\n      if (info.name === 'JsonWebTokenError') {\n        const exception = new Error('Invalid token');\n        (exception as any).name = 'JsonWebTokenError';\n        throw exception;\n      }\n    }\n\n    // General authentication failure\n    if (err || !user) {\n      throw err || new UnauthorizedException('Authentication failed');\n    }\n\n    return user;\n  }\n}"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "activeForm": "Exploring existing authentication structure",
      "content": "Explore existing authentication structure in backend",
      "status": "completed"
    },
    {
      "activeForm": "Identifying JWT guard and authentication strategy",
      "content": "Identify JWT guard and authentication strategy",
      "status": "completed"
    },
    {
      "activeForm": "Planning implementation approach",
      "content": "Plan implementation approach",
      "status": "completed"
    },
    {
      "activeForm": "Creating custom auth exceptions",
      "content": "Create custom auth exceptions with proper HTTP status codes",
      "status": "completed"
    },
    {
      "activeForm": "Creating GraphQL exception filter",
      "content": "Create GraphQL exception filter for proper error formatting",
      "status": "completed"
    },
    {
      "activeForm": "Updating JWT strategy",
      "content": "Update JWT strategy to throw proper exceptions",
      "status": "completed"
    },
    {
      "activeForm": "Updating guards",
      "content": "Update guards to use proper exceptions",
      "status": "in_progress"
    },
    {
      "activeForm": "Verifying with Playwright test",
      "content": "Verify with Playwright test",
      "status": "pending"
    }
  ]
}
Now let me update the GqlHybridAuthGuard:

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/auth/guards/gql-hybrid-auth.guard.ts",
  "old_string": "import {\n  Injectable,\n  ExecutionContext,\n  UnauthorizedException,\n} from '@nestjs/common';\nimport { AuthGuard } from '@nestjs/passport';\nimport { GqlExecutionContext } from '@nestjs/graphql';\nimport { Observable } from 'rxjs';\n\n/**\n * GraphQL Hybrid Authentication Guard\n *\n * Supports both JWT and API key authentication methods.\n * Tries JWT first, then falls back to API key authentication.\n *\n * Priority:\n * 1. JWT Bearer token (Authorization: Bearer <jwt>)\n * 2. API Key (Authorization: Bearer pk_... or X-API-Key: pk_...)\n *\n * Usage:\n * @UseGuards(GqlHybridAuthGuard)\n *\n * The authenticated user is available in context.req.user\n * with authMethod indicating which method was used.\n */\n@Injectable()\nexport class GqlHybridAuthGuard extends AuthGuard(['jwt', 'api-key']) {\n  /**\n   * Override getRequest to extract the request from GraphQL context\n   */\n  getRequest(context: ExecutionContext) {\n    const ctx = GqlExecutionContext.create(context);\n    return ctx.getContext().req;\n  }\n\n  /**\n   * Override handleRequest to allow fallback between strategies\n   * When JWT fails, try API key authentication\n   */\n  handleRequest<TUser = any>(\n    err: any,\n    user: TUser,\n    info: any,\n    context: ExecutionContext,\n  ): TUser {\n    if (err || !user) {\n      // Check if request has an API key header\n      const req = this.getRequest(context);\n      const hasApiKey = this.hasApiKeyHeader(req);\n\n      if (hasApiKey) {\n        // API key was provided but authentication failed\n        throw new UnauthorizedException('Invalid or expired API key');\n      }\n\n      // No valid authentication found\n      throw new UnauthorizedException(\n        'Authentication required. Provide a valid JWT token or API key.',\n      );\n    }\n\n    return user;\n  }\n\n  /**\n   * Check if the request contains an API key header\n   */\n  private hasApiKeyHeader(req: any): boolean {\n    const authHeader = req.headers?.authorization;\n    const xApiKey = req.headers?.['x-api-key'];\n\n    // Check X-API-Key header\n    if (xApiKey) {\n      return true;\n    }\n\n    // Check Authorization header for API key format (Bearer pk_...)\n    if (authHeader) {\n      const parts = authHeader.split(' ');\n      if (parts.length === 2 && parts[0] === 'Bearer') {\n        const token = parts[1];\n        return token.startsWith('pk_');\n      }\n    }\n\n    return false;\n  }\n\n  /**\n   * Override canActivate to try both strategies sequentially\n   */\n  canActivate(\n    context: ExecutionContext,\n  ): boolean | Promise<boolean> | Observable<boolean> {\n    const req = this.getRequest(context);\n    const hasApiKey = this.hasApiKeyHeader(req);\n\n    // If API key header is present, use API key strategy\n    if (hasApiKey) {\n      return super.canActivate(context);\n    }\n\n    // Otherwise, use JWT strategy (default)\n    return super.canActivate(context);\n  }\n}",
  "new_string": "import {\n  Injectable,\n  ExecutionContext,\n  UnauthorizedException,\n} from '@nestjs/common';\nimport { AuthGuard } from '@nestjs/passport';\nimport { GqlExecutionContext } from '@nestjs/graphql';\nimport { Observable } from 'rxjs';\nimport { MissingTokenException } from '../exceptions';\n\n/**\n * GraphQL Hybrid Authentication Guard\n *\n * Supports both JWT and API key authentication methods.\n * Tries JWT first, then falls back to API key authentication.\n *\n * Priority:\n * 1. JWT Bearer token (Authorization: Bearer <jwt>)\n * 2. API Key (Authorization: Bearer pk_... or X-API-Key: pk_...)\n *\n * Usage:\n * @UseGuards(GqlHybridAuthGuard)\n *\n * The authenticated user is available in context.req.user\n * with authMethod indicating which method was used.\n */\n@Injectable()\nexport class GqlHybridAuthGuard extends AuthGuard(['jwt', 'api-key']) {\n  /**\n   * Override getRequest to extract the request from GraphQL context\n   */\n  getRequest(context: ExecutionContext) {\n    const ctx = GqlExecutionContext.create(context);\n    return ctx.getContext().req;\n  }\n\n  /**\n   * Override handleRequest to allow fallback between strategies\n   * When JWT fails, try API key authentication\n   */\n  handleRequest<TUser = any>(\n    err: any,\n    user: TUser,\n    info: any,\n    context: ExecutionContext,\n  ): TUser {\n    if (err || !user) {\n      // Check if request has an API key header\n      const req = this.getRequest(context);\n      const hasApiKey = this.hasApiKeyHeader(req);\n\n      // Check for missing auth\n      const hasJwt = this.hasJwtHeader(req);\n\n      if (!hasApiKey && !hasJwt) {\n        throw new MissingTokenException(\n          'Authentication required. Provide a valid JWT token or API key.',\n        );\n      }\n\n      if (hasApiKey) {\n        // API key was provided but authentication failed\n        throw new UnauthorizedException('Invalid or expired API key');\n      }\n\n      // JWT was provided but failed\n      if (info?.name === 'TokenExpiredError') {\n        const exception = new Error('Token has expired');\n        (exception as any).name = 'TokenExpiredError';\n        throw exception;\n      }\n\n      // No valid authentication found\n      throw new UnauthorizedException(\n        'Authentication failed. Provide a valid JWT token or API key.',\n      );\n    }\n\n    return user;\n  }\n\n  /**\n   * Check if the request contains an API key header\n   */\n  private hasApiKeyHeader(req: any): boolean {\n    const authHeader = req.headers?.authorization;\n    const xApiKey = req.headers?.['x-api-key'];\n\n    // Check X-API-Key header\n    if (xApiKey) {\n      return true;\n    }\n\n    // Check Authorization header for API key format (Bearer pk_...)\n    if (authHeader) {\n      const parts = authHeader.split(' ');\n      if (parts.length === 2 && parts[0] === 'Bearer') {\n        const token = parts[1];\n        return token.startsWith('pk_');\n      }\n    }\n\n    return false;\n  }\n\n  /**\n   * Check if the request contains a JWT token in Authorization header\n   */\n  private hasJwtHeader(req: any): boolean {\n    const authHeader = req.headers?.authorization;\n    if (authHeader) {\n      const parts = authHeader.split(' ');\n      if (parts.length === 2 && parts[0] === 'Bearer') {\n        const token = parts[1];\n        // JWT tokens don't start with pk_ (which is API key format)\n        return token.length > 0 && !token.startsWith('pk_');\n      }\n    }\n    return false;\n  }\n\n  /**\n   * Override canActivate to try both strategies sequentially\n   */\n  canActivate(\n    context: ExecutionContext,\n  ): boolean | Promise<boolean> | Observable<boolean> {\n    const req = this.getRequest(context);\n    const hasApiKey = this.hasApiKeyHeader(req);\n\n    // If API key header is present, use API key strategy\n    if (hasApiKey) {\n      return super.canActivate(context);\n    }\n\n    // Otherwise, use JWT strategy (default)\n    return super.canActivate(context);\n  }\n}"
}
Now let me update the admin guard to use proper exceptions:

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/auth/guards/admin.guard.ts",
  "old_string": "import {\n  CanActivate,\n  ExecutionContext,\n  Injectable,\n  ForbiddenException,\n} from '@nestjs/common';\nimport { GqlExecutionContext } from '@nestjs/graphql';\nimport { Reflector } from '@nestjs/core';\nimport { UserRole } from '../enums/user-role.enum';\n\n/**\n * Admin Guard\n *\n * Protects GraphQL resolvers and REST routes to ensure only users with admin role can access them.\n * Use as a decorator on resolvers or controller methods.\n *\n * @example\n * @UseGuards(GqlAuthGuard, AdminGuard)\n * @Mutation(() => SomeType)\n * async adminOnlyMutation() { ... }\n */\n@Injectable()\nexport class AdminGuard implements CanActivate {\n  constructor(private reflector: Reflector) {}\n\n  canActivate(context: ExecutionContext): boolean {\n    const ctx = GqlExecutionContext.create(context);\n    const user = ctx.getContext().req?.user;\n\n    if (!user) {\n      throw new ForbiddenException('User not authenticated');\n    }\n\n    // Check if user has admin role (user.roles from JWT or user.role from User entity)\n    const userRoles = user.roles || (user.role ? [user.role] : []);\n    if (!userRoles.includes(UserRole.ADMIN)) {\n      throw new ForbiddenException('Admin access required');\n    }\n\n    return true;\n  }\n}",
  "new_string": "import {\n  CanActivate,\n  ExecutionContext,\n  Injectable,\n} from '@nestjs/common';\nimport { GqlExecutionContext } from '@nestjs/graphql';\nimport { Reflector } from '@nestjs/core';\nimport { UserRole } from '../enums/user-role.enum';\nimport { MissingTokenException, ForbiddenAccessException } from '../exceptions';\n\n/**\n * Admin Guard\n *\n * Protects GraphQL resolvers and REST routes to ensure only users with admin role can access them.\n * Use as a decorator on resolvers or controller methods.\n *\n * Returns proper HTTP status codes:\n * - 401 Unauthorized: User not authenticated\n * - 403 Forbidden: User authenticated but not an admin\n *\n * @example\n * @UseGuards(GqlAuthGuard, AdminGuard)\n * @Mutation(() => SomeType)\n * async adminOnlyMutation() { ... }\n */\n@Injectable()\nexport class AdminGuard implements CanActivate {\n  constructor(private reflector: Reflector) {}\n\n  canActivate(context: ExecutionContext): boolean {\n    const ctx = GqlExecutionContext.create(context);\n    const user = ctx.getContext().req?.user;\n\n    if (!user) {\n      throw new MissingTokenException('User not authenticated');\n    }\n\n    // Check if user has admin role (user.roles from JWT or user.role from User entity)\n    const userRoles = user.roles || (user.role ? [user.role] : []);\n    if (!userRoles.includes(UserRole.ADMIN)) {\n      throw new ForbiddenAccessException('Admin access required');\n    }\n\n    return true;\n  }\n}"
}
Now let me update the document permission guard:

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/auth/guards/document-permission.guard.ts",
  "old_string": "import {\n  Injectable,\n  ExecutionContext,\n  ForbiddenException,\n  UnauthorizedException,\n  SetMetadata,\n} from '@nestjs/common';\nimport { GqlExecutionContext } from '@nestjs/graphql';\nimport { Reflector } from '@nestjs/core';\nimport { InjectRepository } from '@nestjs/typeorm';\nimport { Repository } from 'typeorm';\nimport { LegalDocument } from '../../documents/entities/legal-document.entity';\nimport {\n  DocumentShare,\n  SharePermission,\n} from '../../documents/entities/document-share.entity';\n\n/**\n * Permission metadata key for decorator\n */\nexport const PERMISSION_KEY = 'permission';\n\n/**\n * Permission levels for document access\n */\nexport enum DocumentPermissionLevel {\n  READ = 'read',\n  WRITE = 'write',\n  SHARE = 'share',\n  OWNER = 'owner',\n}\n\n/**\n * Document Permission Guard\n *\n * Checks if the authenticated user has the required permission\n * to access a document based on:\n * 1. Document ownership (via UserSession)\n * 2. Document shares (via DocumentShare entity)\n *\n * Usage:\n * @UseGuards(DocumentPermissionGuard)\n * @RequireDocumentPermission(DocumentPermissionLevel.READ)\n *\n * The guard expects the document ID to be provided in one of these ways:\n * 1. Via 'id' argument in the args\n * 2. Via 'input.documentId' or 'input.id' in the args\n * 3. Via 'documentId' argument\n */\n@Injectable()\nexport class DocumentPermissionGuard {\n  constructor(\n    private reflector: Reflector,\n    @InjectRepository(LegalDocument)\n    private readonly documentRepository: Repository<LegalDocument>,\n    @InjectRepository(DocumentShare)\n    private readonly shareRepository: Repository<DocumentShare>,\n  ) {}\n\n  async canActivate(context: ExecutionContext): Promise<boolean> {\n    // Get required permission from decorator metadata\n    const requiredPermission =\n      this.reflector.getAllAndOverride<DocumentPermissionLevel>(\n        PERMISSION_KEY,\n        [context.getHandler(), context.getClass()],\n      );\n\n    if (!requiredPermission) {\n      // No permission requirement - allow access\n      return true;\n    }\n\n    // Get GraphQL context\n    const ctx = GqlExecutionContext.create(context);\n    const { req } = ctx.getContext();\n    const userId = req.user?.userId;\n\n    if (!userId) {\n      throw new UnauthorizedException('User not authenticated');\n    }",
  "new_string": "import {\n  Injectable,\n  ExecutionContext,\n  SetMetadata,\n} from '@nestjs/common';\nimport { GqlExecutionContext } from '@nestjs/graphql';\nimport { Reflector } from '@nestjs/core';\nimport { InjectRepository } from '@nestjs/typeorm';\nimport { Repository } from 'typeorm';\nimport { LegalDocument } from '../../documents/entities/legal-document.entity';\nimport {\n  DocumentShare,\n  SharePermission,\n} from '../../documents/entities/document-share.entity';\nimport { MissingTokenException, ForbiddenAccessException } from '../exceptions';\n\n/**\n * Permission metadata key for decorator\n */\nexport const PERMISSION_KEY = 'permission';\n\n/**\n * Permission levels for document access\n */\nexport enum DocumentPermissionLevel {\n  READ = 'read',\n  WRITE = 'write',\n  SHARE = 'share',\n  OWNER = 'owner',\n}\n\n/**\n * Document Permission Guard\n *\n * Checks if the authenticated user has the required permission\n * to access a document based on:\n * 1. Document ownership (via UserSession)\n * 2. Document shares (via DocumentShare entity)\n *\n * Returns proper HTTP status codes:\n * - 401 Unauthorized: User not authenticated\n * - 403 Forbidden: User authenticated but lacks permission\n *\n * Usage:\n * @UseGuards(DocumentPermissionGuard)\n * @RequireDocumentPermission(DocumentPermissionLevel.READ)\n *\n * The guard expects the document ID to be provided in one of these ways:\n * 1. Via 'id' argument in the args\n * 2. Via 'input.documentId' or 'input.id' in the args\n * 3. Via 'documentId' argument\n */\n@Injectable()\nexport class DocumentPermissionGuard {\n  constructor(\n    private reflector: Reflector,\n    @InjectRepository(LegalDocument)\n    private readonly documentRepository: Repository<LegalDocument>,\n    @InjectRepository(DocumentShare)\n    private readonly shareRepository: Repository<DocumentShare>,\n  ) {}\n\n  async canActivate(context: ExecutionContext): Promise<boolean> {\n    // Get required permission from decorator metadata\n    const requiredPermission =\n      this.reflector.getAllAndOverride<DocumentPermissionLevel>(\n        PERMISSION_KEY,\n        [context.getHandler(), context.getClass()],\n      );\n\n    if (!requiredPermission) {\n      // No permission requirement - allow access\n      return true;\n    }\n\n    // Get GraphQL context\n    const ctx = GqlExecutionContext.create(context);\n    const { req } = ctx.getContext();\n    const userId = req.user?.userId;\n\n    if (!userId) {\n      throw new MissingTokenException('User not authenticated');\n    }"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/auth/guards/document-permission.guard.ts"
}

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/auth/guards/document-permission.guard.ts",
  "old_string": "import {\n  Injectable,\n  ExecutionContext,\n  ForbiddenException,\n  UnauthorizedException,\n  SetMetadata,\n} from '@nestjs/common';\nimport { GqlExecutionContext } from '@nestjs/graphql';\nimport { Reflector } from '@nestjs/core';\nimport { InjectRepository } from '@nestjs/typeorm';\nimport { Repository } from 'typeorm';\nimport { LegalDocument } from '../../documents/entities/legal-document.entity';\nimport {\n  DocumentShare,\n  SharePermission,\n} from '../../documents/entities/document-share.entity';",
  "new_string": "import {\n  Injectable,\n  ExecutionContext,\n  SetMetadata,\n} from '@nestjs/common';\nimport { GqlExecutionContext } from '@nestjs/graphql';\nimport { Reflector } from '@nestjs/core';\nimport { InjectRepository } from '@nestjs/typeorm';\nimport { Repository } from 'typeorm';\nimport { LegalDocument } from '../../documents/entities/legal-document.entity';\nimport {\n  DocumentShare,\n  SharePermission,\n} from '../../documents/entities/document-share.entity';\nimport { MissingTokenException, ForbiddenAccessException } from '../exceptions';"
}

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/auth/guards/document-permission.guard.ts",
  "old_string": "/**\n * Document Permission Guard\n *\n * Checks if the authenticated user has the required permission\n * to access a document based on:\n * 1. Document ownership (via UserSession)\n * 2. Document shares (via DocumentShare entity)\n *\n * Usage:\n * @UseGuards(DocumentPermissionGuard)\n * @RequireDocumentPermission(DocumentPermissionLevel.READ)\n *\n * The guard expects the document ID to be provided in one of these ways:\n * 1. Via 'id' argument in the args\n * 2. Via 'input.documentId' or 'input.id' in the args\n * 3. Via 'documentId' argument\n */",
  "new_string": "/**\n * Document Permission Guard\n *\n * Checks if the authenticated user has the required permission\n * to access a document based on:\n * 1. Document ownership (via UserSession)\n * 2. Document shares (via DocumentShare entity)\n *\n * Returns proper HTTP status codes:\n * - 401 Unauthorized: User not authenticated\n * - 403 Forbidden: User authenticated but lacks permission\n *\n * Usage:\n * @UseGuards(DocumentPermissionGuard)\n * @RequireDocumentPermission(DocumentPermissionLevel.READ)\n *\n * The guard expects the document ID to be provided in one of these ways:\n * 1. Via 'id' argument in the args\n * 2. Via 'input.documentId' or 'input.id' in the args\n * 3. Via 'documentId' argument\n */"
}

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/auth/guards/document-permission.guard.ts",
  "old_string": "    if (!userId) {\n      throw new UnauthorizedException('User not authenticated');\n    }",
  "new_string": "    if (!userId) {\n      throw new MissingTokenException('User not authenticated');\n    }"
}

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/auth/guards/document-permission.guard.ts",
  "old_string": "    if (!hasPermission) {\n      throw new ForbiddenException(\n        `You do not have ${requiredPermission} permission for this document`,\n      );\n    }",
  "new_string": "    if (!hasPermission) {\n      throw new ForbiddenAccessException(\n        `You do not have ${requiredPermission} permission for this document`,\n      );\n    }"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "activeForm": "Exploring existing authentication structure",
      "content": "Explore existing authentication structure in backend",
      "status": "completed"
    },
    {
      "activeForm": "Identifying JWT guard and authentication strategy",
      "content": "Identify JWT guard and authentication strategy",
      "status": "completed"
    },
    {
      "activeForm": "Planning implementation approach",
      "content": "Plan implementation approach",
      "status": "completed"
    },
    {
      "activeForm": "Creating custom auth exceptions",
      "content": "Create custom auth exceptions with proper HTTP status codes",
      "status": "completed"
    },
    {
      "activeForm": "Creating GraphQL exception filter",
      "content": "Create GraphQL exception filter for proper error formatting",
      "status": "completed"
    },
    {
      "activeForm": "Updating JWT strategy",
      "content": "Update JWT strategy to throw proper exceptions",
      "status": "completed"
    },
    {
      "activeForm": "Updating guards",
      "content": "Update guards to use proper exceptions",
      "status": "completed"
    },
    {
      "activeForm": "Verifying with Playwright test",
      "content": "Verify with Playwright test",
      "status": "in_progress"
    }
  ]
}
Now let me run type checking and linting before creating the Playwright test:

🔧 Tool: Bash
Input: {
  "command": "cd /Users/piteer/workspace/radca-prawny/legal/apps/backend && pnpm dlx tsc --noEmit 2>&1 | head -50",
  "description": "Run type check on backend",
  "timeout": 120000
}

🔧 Tool: Bash
Input: {
  "command": "npx tsc --noEmit 2>&1 | head -50",
  "description": "Run type check on backend with npx",
  "timeout": 120000
}
Let me fix the exception filter - it doesn't need apollo-server-errors:

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/auth/exceptions/graphql-auth-exception.filter.ts"
}

🔧 Tool: Write
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/auth/exceptions/graphql-auth-exception.filter.ts",
  "content": "import {\n  ExceptionFilter,\n  Catch,\n  ArgumentsHost,\n  HttpException,\n  HttpStatus,\n  Injectable,\n} from '@nestjs/common';\nimport { GqlExecutionContext } from '@nestjs/graphql';\nimport { GraphQLError } from 'graphql';\n\nimport {\n  BaseAuthException,\n  TokenExpiredException,\n  InvalidTokenException,\n  MissingTokenException,\n  ForbiddenAccessException,\n  UserInactiveException,\n} from './auth.exceptions';\n\n/**\n * GraphQL Authentication Exception Filter\n *\n * Catches authentication and authorization exceptions and:\n * 1. Sets appropriate HTTP status code on response\n * 2. Returns properly formatted GraphQL errors with code extensions\n *\n * This ensures clients receive:\n * - Correct HTTP status (401 for auth errors, 403 for forbidden)\n * - Clear error codes for client-side handling\n * - Indicators for token expiry\n */\n@Injectable()\n@Catch()\nexport class GqlAuthExceptionFilter implements ExceptionFilter {\n  catch(exception: unknown, host: ArgumentsHost) {\n    // GraphQL context is accessed via GqlExecutionContext\n    // The host needs to be cast to ExecutionContext for GqlExecutionContext.create\n    const ctx = GqlExecutionContext.create(host as any);\n    const { res } = ctx.getContext();\n\n    // Default values\n    let status = HttpStatus.INTERNAL_SERVER_ERROR;\n    let message = 'Internal server error';\n    let code = 'INTERNAL_SERVER_ERROR';\n    let extensions: Record<string, any> = {};\n\n    // Handle BaseAuthException (our custom exceptions)\n    if (exception instanceof BaseAuthException) {\n      status = exception.httpStatus;\n      message = exception.message;\n      code = exception.code;\n      extensions = {\n        code,\n        httpStatus: exception.httpStatus,\n      };\n\n      // Add specific extension for token expiry\n      if (exception instanceof TokenExpiredException) {\n        extensions.expired = true;\n      }\n    }\n    // Handle standard NestJS HttpException\n    else if (exception instanceof HttpException) {\n      status = exception.getStatus();\n      const exceptionResponse = exception.getResponse();\n\n      if (typeof exceptionResponse === 'string') {\n        message = exceptionResponse;\n      } else if (typeof exceptionResponse === 'object') {\n        const responseObj = exceptionResponse as any;\n        message = responseObj.message || exception.message;\n        // Handle array of messages from validation\n        if (Array.isArray(message)) {\n          message = message.join(', ');\n        }\n      } else {\n        message = exception.message;\n      }\n\n      code = this.getErrorCodeFromStatus(status);\n      extensions = {\n        code,\n        httpStatus: status,\n      };\n\n      // Detect token expiry from standard unauthorized exception\n      if (\n        status === HttpStatus.UNAUTHORIZED &&\n        message.toLowerCase().includes('expired')\n      ) {\n        extensions.expired = true;\n        code = 'TOKEN_EXPIRED';\n      }\n    }\n    // Handle standard Error\n    else if (exception instanceof Error) {\n      message = exception.message;\n\n      // Detect JWT errors from jsonwebtoken library\n      if (exception.name === 'TokenExpiredError') {\n        status = HttpStatus.UNAUTHORIZED;\n        code = 'TOKEN_EXPIRED';\n        message = 'Token has expired';\n        extensions = { code, httpStatus: status, expired: true };\n      } else if (exception.name === 'JsonWebTokenError') {\n        status = HttpStatus.UNAUTHORIZED;\n        code = 'INVALID_TOKEN';\n        message = 'Invalid token';\n        extensions = { code, httpStatus: status };\n      } else if (exception.name === 'NotBeforeError') {\n        status = HttpStatus.UNAUTHORIZED;\n        code = 'INVALID_TOKEN';\n        message = 'Token not yet valid';\n        extensions = { code, httpStatus: status };\n      }\n    }\n\n    // Set HTTP status code on response\n    res.status(status);\n\n    // Return GraphQL error\n    return new GraphQLError(message, {\n      extensions: {\n        ...extensions,\n        exception: {\n          message,\n          status,\n        },\n      },\n    });\n  }\n\n  /**\n   * Map HTTP status codes to error codes\n   */\n  private getErrorCodeFromStatus(status: number): string {\n    switch (status) {\n      case HttpStatus.UNAUTHORIZED:\n        return 'UNAUTHORIZED';\n      case HttpStatus.FORBIDDEN:\n        return 'FORBIDDEN';\n      case HttpStatus.NOT_FOUND:\n        return 'NOT_FOUND';\n      case HttpStatus.BAD_REQUEST:\n        return 'BAD_REQUEST';\n      case HttpStatus.TOO_MANY_REQUESTS:\n        return 'TOO_MANY_REQUESTS';\n      default:\n        return 'INTERNAL_SERVER_ERROR';\n    }\n  }\n}\n\n/**\n * Re-export for convenience\n */\nexport * from './auth.exceptions';\n"
}

🔧 Tool: Bash
Input: {
  "command": "npx tsc --noEmit 2>&1 | head -30",
  "description": "Run type check on backend",
  "timeout": 120000
}
Now let's run lint:

🔧 Tool: Bash
Input: {
  "command": "pnpm dlx eslint . --ext .ts 2>&1 | head -50",
  "description": "Run lint on backend",
  "timeout": 120000
}
The linter has memory issues. Let me check just the files I changed:

🔧 Tool: Bash
Input: {
  "command": "npx eslint src/modules/auth/exceptions/ src/modules/auth/guards/ src/app.module.ts --ext .ts 2>&1",
  "description": "Run lint on changed files",
  "timeout": 60000
}
Let me fix the lint errors. First, let me update the files:

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/auth/exceptions/auth.exceptions.ts"
}

🔧 Tool: Write
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/auth/exceptions/auth.exceptions.ts",
  "content": "import { UnauthorizedException, ForbiddenException } from '@nestjs/common';\n\n/**\n * Base Authentication Exception\n *\n * All auth exceptions extend this to allow consistent handling\n */\nexport class BaseAuthException extends Error {\n  constructor(\n    message: string,\n    public readonly code: string,\n    public readonly httpStatus: number,\n  ) {\n    super(message);\n    this.name = this.constructor.name;\n    Object.setPrototypeOf(this, BaseAuthException.prototype);\n  }\n}\n\n/**\n * Token Expired Exception\n *\n * Thrown when JWT token has expired\n * HTTP Status: 401 Unauthorized\n */\nexport class TokenExpiredException extends BaseAuthException {\n  constructor(message: string = 'Token has expired') {\n    super(message, 'TOKEN_EXPIRED', 401);\n    Object.setPrototypeOf(this, TokenExpiredException.prototype);\n  }\n}\n\n/**\n * Invalid Token Exception\n *\n * Thrown when JWT token is malformed or invalid\n * HTTP Status: 401 Unauthorized\n */\nexport class InvalidTokenException extends BaseAuthException {\n  constructor(message: string = 'Invalid token') {\n    super(message, 'INVALID_TOKEN', 401);\n    Object.setPrototypeOf(this, InvalidTokenException.prototype);\n  }\n}\n\n/**\n * Missing Token Exception\n *\n * Thrown when no authorization token is provided\n * HTTP Status: 401 Unauthorized\n */\nexport class MissingTokenException extends BaseAuthException {\n  constructor(message: string = 'Authorization token is required') {\n    super(message, 'MISSING_TOKEN', 401);\n    Object.setPrototypeOf(this, MissingTokenException.prototype);\n  }\n}\n\n/**\n * Forbidden Access Exception\n *\n * Thrown when user is authenticated but lacks required permissions\n * HTTP Status: 403 Forbidden\n */\nexport class ForbiddenAccessException extends BaseAuthException {\n  constructor(message: string = 'Access forbidden') {\n    super(message, 'FORBIDDEN', 403);\n    Object.setPrototypeOf(this, ForbiddenAccessException.prototype);\n  }\n}\n\n/**\n * User Inactive Exception\n *\n * Thrown when user account is inactive\n * HTTP Status: 403 Forbidden\n */\nexport class UserInactiveException extends BaseAuthException {\n  constructor(message: string = 'User account is inactive') {\n    super(message, 'USER_INACTIVE', 403);\n    Object.setPrototypeOf(this, UserInactiveException.prototype);\n  }\n}\n\n/**\n * Error types from JWT library\n */\ninterface JwtError {\n  name?: string;\n  message?: string;\n}\n\n/**\n * Convert NestJS HTTP exceptions to our custom exceptions\n * Used in guards and strategies for consistent error handling\n */\nexport function toAuthException(\n  error: JwtError | unknown,\n): BaseAuthException | UnauthorizedException | ForbiddenException {\n  // If it's already one of our custom exceptions, return as-is\n  if (error instanceof BaseAuthException) {\n    return error;\n  }\n\n  // Convert JWT expiry error\n  const jwtError = error as JwtError;\n  if (jwtError.name === 'TokenExpiredError') {\n    return new TokenExpiredException();\n  }\n\n  // Convert JWT validation error\n  if (jwtError.name === 'JsonWebTokenError') {\n    return new InvalidTokenException(jwtError.message ?? 'Invalid token');\n  }\n\n  // Convert not before error\n  if (jwtError.name === 'NotBeforeError') {\n    return new InvalidTokenException('Token not yet valid');\n  }\n\n  // Return generic unauthorized exception\n  return new UnauthorizedException(\n    jwtError.message ?? 'Authentication failed',\n  );\n}\n"
}
Now let me update the exception filter to fix the remaining issues:

🔧 Tool: Write
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/auth/exceptions/graphql-auth-exception.filter.ts",
  "content": "import {\n  ExceptionFilter,\n  Catch,\n  ArgumentsHost,\n  HttpException,\n  HttpStatus,\n  Injectable,\n} from '@nestjs/common';\nimport { GqlExecutionContext } from '@nestjs/graphql';\nimport { GraphQLError } from 'graphql';\n\nimport { BaseAuthException, TokenExpiredException } from './auth.exceptions';\n\n/**\n * GraphQL Authentication Exception Filter\n *\n * Catches authentication and authorization exceptions and:\n * 1. Sets appropriate HTTP status code on response\n * 2. Returns properly formatted GraphQL errors with code extensions\n *\n * This ensures clients receive:\n * - Correct HTTP status (401 for auth errors, 403 for forbidden)\n * - Clear error codes for client-side handling\n * - Indicators for token expiry\n */\n@Injectable()\n@Catch()\nexport class GqlAuthExceptionFilter implements ExceptionFilter {\n  catch(exception: unknown, host: ArgumentsHost) {\n    // GraphQL context is accessed via GqlExecutionContext\n    // The host needs to be cast to ExecutionContext for GqlExecutionContext.create\n    const ctx = GqlExecutionContext.create(host as any);\n    const context = ctx.getContext();\n    const res = context.res as Response | undefined;\n\n    // Default values\n    let status = HttpStatus.INTERNAL_SERVER_ERROR;\n    let message = 'Internal server error';\n    let code = 'INTERNAL_SERVER_ERROR';\n    const extensions: Record<string, unknown> = {};\n\n    // Handle BaseAuthException (our custom exceptions)\n    if (exception instanceof BaseAuthException) {\n      status = exception.httpStatus;\n      message = exception.message;\n      code = exception.code;\n      extensions.code = code;\n      extensions.httpStatus = exception.httpStatus;\n\n      // Add specific extension for token expiry\n      if (exception instanceof TokenExpiredException) {\n        extensions.expired = true;\n      }\n    }\n    // Handle standard NestJS HttpException\n    else if (exception instanceof HttpException) {\n      status = exception.getStatus();\n      const exceptionResponse = exception.getResponse();\n\n      if (typeof exceptionResponse === 'string') {\n        message = exceptionResponse;\n      } else if (typeof exceptionResponse === 'object') {\n        const responseObj = exceptionResponse as Record<string, unknown>;\n        message = (responseObj.message as string) ?? exception.message;\n        // Handle array of messages from validation\n        if (Array.isArray(message)) {\n          message = message.join(', ');\n        }\n      } else {\n        message = exception.message;\n      }\n\n      code = this.getErrorCodeFromStatus(status);\n      extensions.code = code;\n      extensions.httpStatus = status;\n\n      // Detect token expiry from standard unauthorized exception\n      if (\n        status === HttpStatus.UNAUTHORIZED &&\n        message.toLowerCase().includes('expired')\n      ) {\n        extensions.expired = true;\n        (extensions.code as string) = 'TOKEN_EXPIRED';\n        code = 'TOKEN_EXPIRED';\n      }\n    }\n    // Handle standard Error\n    else if (exception instanceof Error) {\n      message = exception.message;\n\n      // Detect JWT errors from jsonwebtoken library\n      if (exception.name === 'TokenExpiredError') {\n        status = HttpStatus.UNAUTHORIZED;\n        code = 'TOKEN_EXPIRED';\n        message = 'Token has expired';\n        extensions.code = code;\n        extensions.httpStatus = status;\n        extensions.expired = true;\n      } else if (exception.name === 'JsonWebTokenError') {\n        status = HttpStatus.UNAUTHORIZED;\n        code = 'INVALID_TOKEN';\n        message = 'Invalid token';\n        extensions.code = code;\n        extensions.httpStatus = status;\n      } else if (exception.name === 'NotBeforeError') {\n        status = HttpStatus.UNAUTHORIZED;\n        code = 'INVALID_TOKEN';\n        message = 'Token not yet valid';\n        extensions.code = code;\n        extensions.httpStatus = status;\n      }\n    }\n\n    // Set HTTP status code on response (if available)\n    if (res && typeof (res as any).status === 'function') {\n      (res as any).status(status);\n    }\n\n    // Return GraphQL error\n    return new GraphQLError(message, {\n      extensions: {\n        ...extensions,\n        exception: {\n          message,\n          status,\n        },\n      },\n    });\n  }\n\n  /**\n   * Map HTTP status codes to error codes\n   */\n  private getErrorCodeFromStatus(status: number): string {\n    const statusCode = status as HttpStatus;\n    switch (statusCode) {\n      case HttpStatus.UNAUTHORIZED:\n        return 'UNAUTHORIZED';\n      case HttpStatus.FORBIDDEN:\n        return 'FORBIDDEN';\n      case HttpStatus.NOT_FOUND:\n        return 'NOT_FOUND';\n      case HttpStatus.BAD_REQUEST:\n        return 'BAD_REQUEST';\n      case HttpStatus.TOO_MANY_REQUESTS:\n        return 'TOO_MANY_REQUESTS';\n      default:\n        return 'INTERNAL_SERVER_ERROR';\n    }\n  }\n}\n\n/**\n * Re-export for convenience\n */\nexport * from './auth.exceptions';\n"
}
Now let me update the guards to fix the remaining lint issues. Let me check and fix the admin guard:

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/auth/guards/admin.guard.ts"
}

🔧 Tool: Write
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/auth/guards/admin.guard.ts",
  "content": "import {\n  CanActivate,\n  ExecutionContext,\n  Injectable,\n} from '@nestjs/common';\nimport { GqlExecutionContext } from '@nestjs/graphql';\nimport { Reflector } from '@nestjs/core';\nimport { UserRole } from '../enums/user-role.enum';\nimport { MissingTokenException, ForbiddenAccessException } from '../exceptions';\n\n/**\n * User object from request\n */\ninterface RequestUser {\n  roles?: string[];\n  role?: string;\n}\n\n/**\n * GraphQL request context\n */\ninterface GqlContext {\n  req?: {\n    user?: RequestUser;\n  };\n}\n\n/**\n * Admin Guard\n *\n * Protects GraphQL resolvers and REST routes to ensure only users with admin role can access them.\n * Use as a decorator on resolvers or controller methods.\n *\n * Returns proper HTTP status codes:\n * - 401 Unauthorized: User not authenticated\n * - 403 Forbidden: User authenticated but not an admin\n *\n * @example\n * @UseGuards(GqlAuthGuard, AdminGuard)\n * @Mutation(() => SomeType)\n * async adminOnlyMutation() { ... }\n */\n@Injectable()\nexport class AdminGuard implements CanActivate {\n  constructor(private reflector: Reflector) {}\n\n  canActivate(context: ExecutionContext): boolean {\n    const ctx = GqlExecutionContext.create(context);\n    const gqlContext = ctx.getContext() as GqlContext;\n    const user = gqlContext.req?.user;\n\n    if (!user) {\n      throw new MissingTokenException('User not authenticated');\n    }\n\n    // Check if user has admin role (user.roles from JWT or user.role from User entity)\n    const userRoles = user.roles ?? (user.role ? [user.role] : []);\n    if (!userRoles.includes(UserRole.ADMIN)) {\n      throw new ForbiddenAccessException('Admin access required');\n    }\n\n    return true;\n  }\n}\n"
}
Now let me update the gql-auth.guard:

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/auth/guards/gql-auth.guard.ts"
}

🔧 Tool: Write
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/auth/guards/gql-auth.guard.ts",
  "content": "import {\n  Injectable,\n  ExecutionContext,\n  UnauthorizedException,\n} from '@nestjs/common';\nimport { AuthGuard } from '@nestjs/passport';\nimport { GqlExecutionContext } from '@nestjs/graphql';\nimport { MissingTokenException } from '../exceptions';\n\n/**\n * JWT Strategy error info interface\n */\ninterface StrategyInfo {\n  name?: string;\n  message?: string;\n}\n\n/**\n * GraphQL Authentication Guard\n *\n * Extends the default JWT AuthGuard to work with GraphQL context\n * instead of standard HTTP request context.\n *\n * Throws appropriate exceptions for different authentication failure scenarios:\n * - Missing authorization header -> MissingTokenException (401)\n * - Invalid/expired token -> TokenExpiredException/InvalidTokenException (401)\n */\n@Injectable()\nexport class GqlAuthGuard extends AuthGuard('jwt') {\n  /**\n   * Override getRequest to extract the request from GraphQL context\n   */\n  getRequest(context: ExecutionContext) {\n    const ctx = GqlExecutionContext.create(context);\n    return ctx.getContext().req;\n  }\n\n  /**\n   * Override handleRequest to provide custom exception handling\n   *\n   * When authentication fails, this method is called with the error.\n   * We convert errors to our custom exceptions for consistent error handling.\n   */\n  handleRequest<TUser = unknown>(\n    err: unknown,\n    user: TUser,\n    info: StrategyInfo | undefined,\n    // eslint-disable-next-line @typescript-eslint/no-unused-vars\n    _context: ExecutionContext,\n  ): TUser {\n    // If authentication succeeded, return the user\n    if (user) {\n      return user;\n    }\n\n    // Handle specific JWT errors\n    if (info?.name === 'NoAuthTokenError' || !info) {\n      throw new MissingTokenException();\n    }\n\n    // Token expired - throw error that exception filter will recognize\n    if (info?.name === 'TokenExpiredError') {\n      const exception = new Error('Token has expired');\n      (exception as Record<string, unknown>).name = 'TokenExpiredError';\n      throw exception;\n    }\n\n    // Invalid token - throw error that exception filter will recognize\n    if (info?.name === 'JsonWebTokenError') {\n      const exception = new Error('Invalid token');\n      (exception as Record<string, unknown>).name = 'JsonWebTokenError';\n      throw exception;\n    }\n\n    // General authentication failure\n    if (err || !user) {\n      throw err instanceof Error ? err : new UnauthorizedException('Authentication failed');\n    }\n\n    return user;\n  }\n}\n"
}
Now let me update the gql-hybrid-auth.guard:

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/auth/guards/gql-hybrid-auth.guard.ts"
}

🔧 Tool: Write
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/auth/guards/gql-hybrid-auth.guard.ts",
  "content": "import {\n  Injectable,\n  ExecutionContext,\n  UnauthorizedException,\n} from '@nestjs/common';\nimport { AuthGuard } from '@nestjs/passport';\nimport { GqlExecutionContext } from '@nestjs/graphql';\nimport { Observable } from 'rxjs';\nimport { MissingTokenException } from '../exceptions';\n\n/**\n * Request object with headers\n */\ninterface RequestWithHeaders {\n  headers?: {\n    authorization?: string;\n    'x-api-key'?: string;\n  };\n}\n\n/**\n * JWT Strategy error info interface\n */\ninterface StrategyInfo {\n  name?: string;\n  message?: string;\n}\n\n/**\n * GraphQL Hybrid Authentication Guard\n *\n * Supports both JWT and API key authentication methods.\n * Tries JWT first, then falls back to API key authentication.\n *\n * Priority:\n * 1. JWT Bearer token (Authorization: Bearer <jwt>)\n * 2. API Key (Authorization: Bearer pk_... or X-API-Key: pk_...)\n *\n * Usage:\n * @UseGuards(GqlHybridAuthGuard)\n *\n * The authenticated user is available in context.req.user\n * with authMethod indicating which method was used.\n */\n@Injectable()\nexport class GqlHybridAuthGuard extends AuthGuard(['jwt', 'api-key']) {\n  /**\n   * Override getRequest to extract the request from GraphQL context\n   */\n  getRequest(context: ExecutionContext): RequestWithHeaders {\n    const ctx = GqlExecutionContext.create(context);\n    return ctx.getContext().req;\n  }\n\n  /**\n   * Override handleRequest to allow fallback between strategies\n   * When JWT fails, try API key authentication\n   */\n  handleRequest<TUser = unknown>(\n    err: unknown,\n    user: TUser,\n    info: StrategyInfo | undefined,\n    context: ExecutionContext,\n  ): TUser {\n    if (err || !user) {\n      // Check if request has an API key header\n      const req = this.getRequest(context);\n      const hasApiKey = this.hasApiKeyHeader(req);\n\n      // Check for missing auth\n      const hasJwt = this.hasJwtHeader(req);\n\n      if (!hasApiKey && !hasJwt) {\n        throw new MissingTokenException(\n          'Authentication required. Provide a valid JWT token or API key.',\n        );\n      }\n\n      if (hasApiKey) {\n        // API key was provided but authentication failed\n        throw new UnauthorizedException('Invalid or expired API key');\n      }\n\n      // JWT was provided but failed\n      if (info?.name === 'TokenExpiredError') {\n        const exception = new Error('Token has expired');\n        (exception as Record<string, unknown>).name = 'TokenExpiredError';\n        throw exception;\n      }\n\n      // No valid authentication found\n      throw new UnauthorizedException(\n        'Authentication failed. Provide a valid JWT token or API key.',\n      );\n    }\n\n    return user;\n  }\n\n  /**\n   * Check if the request contains an API key header\n   */\n  private hasApiKeyHeader(req: RequestWithHeaders): boolean {\n    const authHeader = req.headers?.authorization;\n    const xApiKey = req.headers?.['x-api-key'];\n\n    // Check X-API-Key header\n    if (xApiKey) {\n      return true;\n    }\n\n    // Check Authorization header for API key format (Bearer pk_...)\n    if (authHeader) {\n      const parts = authHeader.split(' ');\n      if (parts.length === 2 && parts[0] === 'Bearer') {\n        const token = parts[1];\n        return token.startsWith('pk_');\n      }\n    }\n\n    return false;\n  }\n\n  /**\n   * Check if the request contains a JWT token in Authorization header\n   */\n  private hasJwtHeader(req: RequestWithHeaders): boolean {\n    const authHeader = req.headers?.authorization;\n    if (authHeader) {\n      const parts = authHeader.split(' ');\n      if (parts.length === 2 && parts[0] === 'Bearer') {\n        const token = parts[1];\n        // JWT tokens don't start with pk_ (which is API key format)\n        return token.length > 0 && !token.startsWith('pk_');\n      }\n    }\n    return false;\n  }\n\n  /**\n   * Override canActivate to try both strategies sequentially\n   */\n  canActivate(\n    context: ExecutionContext,\n  ): boolean | Promise<boolean> | Observable<boolean> {\n    const req = this.getRequest(context);\n    const hasApiKey = this.hasApiKeyHeader(req);\n\n    // If API key header is present, use API key strategy\n    if (hasApiKey) {\n      return super.canActivate(context);\n    }\n\n    // Otherwise, use JWT strategy (default)\n    return super.canActivate(context);\n  }\n}\n"
}
Now let me also update the document-permission.guard to fix the lint issues. First let me check the current state:

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/auth/guards/document-permission.guard.ts"
}
The document-permission.guard looks OK. Let me run the type check and lint again to see if all errors are fixed:

🔧 Tool: Bash
Input: {
  "command": "npx tsc --noEmit 2>&1 | head -30",
  "description": "Run type check on backend",
  "timeout": 120000
}
Let me fix the type issues in my code:

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/auth/guards/gql-auth.guard.ts"
}

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/auth/guards/gql-auth.guard.ts",
  "old_string": "    // Token expired - throw error that exception filter will recognize\n    if (info?.name === 'TokenExpiredError') {\n      const exception = new Error('Token has expired');\n      (exception as Record<string, unknown>).name = 'TokenExpiredError';\n      throw exception;\n    }\n\n    // Invalid token - throw error that exception filter will recognize\n    if (info?.name === 'JsonWebTokenError') {\n      const exception = new Error('Invalid token');\n      (exception as Record<string, unknown>).name = 'JsonWebTokenError';\n      throw exception;\n    }",
  "new_string": "    // Token expired - throw error that exception filter will recognize\n    if (info?.name === 'TokenExpiredError') {\n      const exception = new Error('Token has expired') as Error & {\n        name: string;\n      };\n      exception.name = 'TokenExpiredError';\n      throw exception;\n    }\n\n    // Invalid token - throw error that exception filter will recognize\n    if (info?.name === 'JsonWebTokenError') {\n      const exception = new Error('Invalid token') as Error & {\n        name: string;\n      };\n      exception.name = 'JsonWebTokenError';\n      throw exception;\n    }"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/auth/guards/gql-hybrid-auth.guard.ts",
  "limit": 100
}

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/auth/guards/gql-hybrid-auth.guard.ts",
  "old_string": "      // JWT was provided but failed\n      if (info?.name === 'TokenExpiredError') {\n        const exception = new Error('Token has expired');\n        (exception as Record<string, unknown>).name = 'TokenExpiredError';\n        throw exception;\n      }",
  "new_string": "      // JWT was provided but failed\n      if (info?.name === 'TokenExpiredError') {\n        const exception = new Error('Token has expired') as Error & {\n          name: string;\n        };\n        exception.name = 'TokenExpiredError';\n        throw exception;\n      }"
}

🔧 Tool: Bash
Input: {
  "command": "npx tsc --noEmit 2>&1 | grep -E \"(gql-auth|gql-hybrid|document-permission|admin\\.guard|auth\\.exceptions|graphql-auth-exception)\" | head -20",
  "description": "Run type check on changed files",
  "timeout": 120000
}
The type check passes for my changes. Now let me run lint on the changed files:

🔧 Tool: Bash
Input: {
  "command": "npx eslint src/modules/auth/exceptions/ src/modules/auth/guards/gql-auth.guard.ts src/modules/auth/guards/gql-hybrid-auth.guard.ts src/modules/auth/guards/admin.guard.ts --ext .ts 2>&1",
  "description": "Run lint on changed auth files",
  "timeout": 60000
}
Let me fix the lint errors. First, let me run prettier to auto-fix the formatting:

🔧 Tool: Bash
Input: {
  "command": "npx prettier --write src/modules/auth/exceptions/auth.exceptions.ts src/modules/auth/guards/admin.guard.ts src/modules/auth/guards/gql-auth.guard.ts 2>&1",
  "description": "Run prettier on auth files",
  "timeout": 30000
}
Now let me fix the remaining type issues. First let me update the auth.exceptions.ts:

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/auth/exceptions/auth.exceptions.ts"
}

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/auth/exceptions/auth.exceptions.ts",
  "old_string": "/**\n * Convert NestJS HTTP exceptions to our custom exceptions\n * Used in guards and strategies for consistent error handling\n */\nexport function toAuthException(\n  error: JwtError | unknown,\n): BaseAuthException | UnauthorizedException | ForbiddenException {\n  // If it's already one of our custom exceptions, return as-is\n  if (error instanceof BaseAuthException) {\n    return error;\n  }\n\n  // Convert JWT expiry error\n  const jwtError = error as JwtError;\n  if (jwtError.name === 'TokenExpiredError') {\n    return new TokenExpiredException();\n  }\n\n  // Convert JWT validation error\n  if (jwtError.name === 'JsonWebTokenError') {\n    return new InvalidTokenException(jwtError.message ?? 'Invalid token');\n  }\n\n  // Convert not before error\n  if (jwtError.name === 'NotBeforeError') {\n    return new InvalidTokenException('Token not yet valid');\n  }\n\n  // Return generic unauthorized exception\n  return new UnauthorizedException(jwtError.message ?? 'Authentication failed');\n}",
  "new_string": "/**\n * Convert NestJS HTTP exceptions to our custom exceptions\n * Used in guards and strategies for consistent error handling\n */\nexport function toAuthException(\n  error: unknown,\n): BaseAuthException | UnauthorizedException | ForbiddenException {\n  // If it's already one of our custom exceptions, return as-is\n  if (error instanceof BaseAuthException) {\n    return error;\n  }\n\n  // Convert JWT expiry error\n  const jwtError = error as JwtError;\n  if (jwtError.name === 'TokenExpiredError') {\n    return new TokenExpiredException();\n  }\n\n  // Convert JWT validation error\n  if (jwtError.name === 'JsonWebTokenError') {\n    return new InvalidTokenException(\n      jwtError.message ?? 'Invalid token',\n    );\n  }\n\n  // Convert not before error\n  if (jwtError.name === 'NotBeforeError') {\n    return new InvalidTokenException('Token not yet valid');\n  }\n\n  // Return generic unauthorized exception\n  return new UnauthorizedException(\n    jwtError.message ?? 'Authentication failed',\n  );\n}"
}
Now let me fix the exception filter:

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/auth/exceptions/graphql-auth-exception.filter.ts"
}

🔧 Tool: Write
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/auth/exceptions/graphql-auth-exception.filter.ts",
  "content": "import {\n  ExceptionFilter,\n  Catch,\n  ArgumentsHost,\n  HttpException,\n  HttpStatus,\n  Injectable,\n} from '@nestjs/common';\nimport { GqlExecutionContext } from '@nestjs/graphql';\nimport { GraphQLError } from 'graphql';\n\nimport { BaseAuthException, TokenExpiredException } from './auth.exceptions';\n\n/**\n * GraphQL context with response\n */\ninterface GqlContext {\n  res?: {\n    status: (code: number) => void;\n  };\n}\n\n/**\n * GraphQL Authentication Exception Filter\n *\n * Catches authentication and authorization exceptions and:\n * 1. Sets appropriate HTTP status code on response\n * 2. Returns properly formatted GraphQL errors with code extensions\n *\n * This ensures clients receive:\n * - Correct HTTP status (401 for auth errors, 403 for forbidden)\n * - Clear error codes for client-side handling\n * - Indicators for token expiry\n */\n@Injectable()\n@Catch()\nexport class GqlAuthExceptionFilter implements ExceptionFilter {\n  catch(exception: unknown, host: ArgumentsHost) {\n    // GraphQL context is accessed via GqlExecutionContext\n    // The host needs to be cast to ExecutionContext for GqlExecutionContext.create\n    const ctx = GqlExecutionContext.create(host as unknown as ExecutionContext);\n    const context = ctx.getContext() as GqlContext;\n    const res = context.res;\n\n    // Default values\n    let status = HttpStatus.INTERNAL_SERVER_ERROR;\n    let message = 'Internal server error';\n    let code = 'INTERNAL_SERVER_ERROR';\n    const extensions: Record<string, unknown> = {};\n\n    // Handle BaseAuthException (our custom exceptions)\n    if (exception instanceof BaseAuthException) {\n      status = exception.httpStatus;\n      message = exception.message;\n      code = exception.code;\n      extensions.code = code;\n      extensions.httpStatus = exception.httpStatus;\n\n      // Add specific extension for token expiry\n      if (exception instanceof TokenExpiredException) {\n        extensions.expired = true;\n      }\n    }\n    // Handle standard NestJS HttpException\n    else if (exception instanceof HttpException) {\n      status = exception.getStatus();\n      const exceptionResponse = exception.getResponse();\n\n      if (typeof exceptionResponse === 'string') {\n        message = exceptionResponse;\n      } else if (typeof exceptionResponse === 'object') {\n        const responseObj = exceptionResponse as Record<string, unknown>;\n        message = (responseObj.message as string) ?? exception.message;\n        // Handle array of messages from validation\n        if (Array.isArray(message)) {\n          message = message.join(', ');\n        }\n      } else {\n        message = exception.message;\n      }\n\n      code = this.getErrorCodeFromStatus(status);\n      extensions.code = code;\n      extensions.httpStatus = status;\n\n      // Detect token expiry from standard unauthorized exception\n      if (\n        status === HttpStatus.UNAUTHORIZED &&\n        message.toLowerCase().includes('expired')\n      ) {\n        extensions.expired = true;\n        (extensions.code as string) = 'TOKEN_EXPIRED';\n        code = 'TOKEN_EXPIRED';\n      }\n    }\n    // Handle standard Error\n    else if (exception instanceof Error) {\n      message = exception.message;\n\n      // Detect JWT errors from jsonwebtoken library\n      if (exception.name === 'TokenExpiredError') {\n        status = HttpStatus.UNAUTHORIZED;\n        code = 'TOKEN_EXPIRED';\n        message = 'Token has expired';\n        extensions.code = code;\n        extensions.httpStatus = status;\n        extensions.expired = true;\n      } else if (exception.name === 'JsonWebTokenError') {\n        status = HttpStatus.UNAUTHORIZED;\n        code = 'INVALID_TOKEN';\n        message = 'Invalid token';\n        extensions.code = code;\n        extensions.httpStatus = status;\n      } else if (exception.name === 'NotBeforeError') {\n        status = HttpStatus.UNAUTHORIZED;\n        code = 'INVALID_TOKEN';\n        message = 'Token not yet valid';\n        extensions.code = code;\n        extensions.httpStatus = status;\n      }\n    }\n\n    // Set HTTP status code on response (if available)\n    if (res) {\n      res.status(status);\n    }\n\n    // Return GraphQL error\n    return new GraphQLError(message, {\n      extensions: {\n        ...extensions,\n        exception: {\n          message,\n          status,\n        },\n      },\n    });\n  }\n\n  /**\n   * Map HTTP status codes to error codes\n   */\n  private getErrorCodeFromStatus(status: number): string {\n    const statusCode = status as HttpStatus;\n    switch (statusCode) {\n      case HttpStatus.UNAUTHORIZED:\n        return 'UNAUTHORIZED';\n      case HttpStatus.FORBIDDEN:\n        return 'FORBIDDEN';\n      case HttpStatus.NOT_FOUND:\n        return 'NOT_FOUND';\n      case HttpStatus.BAD_REQUEST:\n        return 'BAD_REQUEST';\n      case HttpStatus.TOO_MANY_REQUESTS:\n        return 'TOO_MANY_REQUESTS';\n      default:\n        return 'INTERNAL_SERVER_ERROR';\n    }\n  }\n}\n\n/**\n * Re-export for convenience\n */\nexport * from './auth.exceptions';\n"
}
Now let me fix the guards. First let me check admin.guard:

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/auth/guards/admin.guard.ts"
}

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/auth/guards/admin.guard.ts",
  "old_string": "  canActivate(context: ExecutionContext): boolean {\n    const ctx = GqlExecutionContext.create(context);\n    const gqlContext = ctx.getContext() as GqlContext;\n    const user = gqlContext.req?.user;",
  "new_string": "  canActivate(context: ExecutionContext): boolean {\n    const ctx = GqlExecutionContext.create(context);\n    const gqlContext = ctx.getContext<GqlContext>();\n    const user = gqlContext.req?.user;"
}
Now let me update the other guards with similar type-safe changes:

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/auth/guards/gql-auth.guard.ts"
}

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/auth/guards/gql-auth.guard.ts",
  "old_string": "  /**\n   * Override getRequest to extract the request from GraphQL context\n   */\n  getRequest(context: ExecutionContext) {\n    const ctx = GqlExecutionContext.create(context);\n    return ctx.getContext().req;\n  }",
  "new_string": "  /**\n   * Override getRequest to extract the request from GraphQL context\n   */\n  getRequest(context: ExecutionContext): unknown {\n    const ctx = GqlExecutionContext.create(context);\n    return ctx.getContext().req;\n  }"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/auth/guards/gql-hybrid-auth.guard.ts",
  "limit": 60
}

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/auth/guards/gql-hybrid-auth.guard.ts",
  "old_string": "  /**\n   * Override getRequest to extract the request from GraphQL context\n   */\n  getRequest(context: ExecutionContext): RequestWithHeaders {\n    const ctx = GqlExecutionContext.create(context);\n    return ctx.getContext().req;\n  }",
  "new_string": "  /**\n   * Override getRequest to extract the request from GraphQL context\n   */\n  getRequest(context: ExecutionContext): RequestWithHeaders {\n    const ctx = GqlExecutionContext.create(context);\n    return ctx.getContext().req as RequestWithHeaders;\n  }"
}
Now let me run lint again:

🔧 Tool: Bash
Input: {
  "command": "npx eslint src/modules/auth/exceptions/ src/modules/auth/guards/gql-auth.guard.ts src/modules/auth/guards/gql-hybrid-auth.guard.ts src/modules/auth/guards/admin.guard.ts --ext .ts 2>&1",
  "description": "Run lint on changed auth files",
  "timeout": 60000
}

🔧 Tool: Bash
Input: {
  "command": "npx prettier --write src/modules/auth/exceptions/auth.exceptions.ts 2>&1",
  "description": "Run prettier on auth.exceptions.ts",
  "timeout": 30000
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/auth/exceptions/graphql-auth-exception.filter.ts",
  "limit": 50
}

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/auth/exceptions/graphql-auth-exception.filter.ts",
  "old_string": "  catch(exception: unknown, host: ArgumentsHost) {\n    // GraphQL context is accessed via GqlExecutionContext\n    // The host needs to be cast to ExecutionContext for GqlExecutionContext.create\n    const ctx = GqlExecutionContext.create(host as unknown as ExecutionContext);\n    const context = ctx.getContext() as GqlContext;\n    const res = context.res;",
  "new_string": "  catch(exception: unknown, host: ArgumentsHost) {\n    // GraphQL context is accessed via GqlExecutionContext\n    // The host needs to be cast to ExecutionContext for GqlExecutionContext.create\n    const ctx = GqlExecutionContext.create(host as ExecutionContext);\n    const context = ctx.getContext() as GqlContext;\n    const res = context.res;"
}
Now let me fix the guards by adding the ExecutionContext import:

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/auth/guards/gql-auth.guard.ts"
}

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/auth/guards/gql-auth.guard.ts",
  "old_string": "  /**\n   * Override getRequest to extract the request from GraphQL context\n   */\n  getRequest(context: ExecutionContext): unknown {\n    const ctx = GqlExecutionContext.create(context);\n    return ctx.getContext().req;\n  }",
  "new_string": "  /**\n   * Override getRequest to extract the request from GraphQL context\n   */\n  getRequest(context: ExecutionContext): unknown {\n    const ctx = GqlExecutionContext.create(context);\n    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access\n    return ctx.getContext().req;\n  }"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/auth/guards/gql-hybrid-auth.guard.ts",
  "limit": 60
}

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/auth/guards/gql-hybrid-auth.guard.ts",
  "old_string": "  /**\n   * Override getRequest to extract the request from GraphQL context\n   */\n  getRequest(context: ExecutionContext): RequestWithHeaders {\n    const ctx = GqlExecutionContext.create(context);\n    return ctx.getContext().req as RequestWithHeaders;\n  }",
  "new_string": "  /**\n   * Override getRequest to extract the request from GraphQL context\n   */\n  getRequest(context: ExecutionContext): RequestWithHeaders {\n    const ctx = GqlExecutionContext.create(context);\n    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access\n    return ctx.getContext().req as RequestWithHeaders;\n  }"
}

🔧 Tool: Bash
Input: {
  "command": "npx eslint src/modules/auth/exceptions/ src/modules/auth/guards/gql-auth.guard.ts src/modules/auth/guards/gql-hybrid-auth.guard.ts src/modules/auth/guards/admin.guard.ts --ext .ts 2>&1",
  "description": "Run lint on changed auth files",
  "timeout": 60000
}

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/auth/exceptions/graphql-auth-exception.filter.ts",
  "old_string": "  catch(exception: unknown, host: ArgumentsHost) {\n    // GraphQL context is accessed via GqlExecutionContext\n    // The host needs to be cast to ExecutionContext for GqlExecutionContext.create\n    const ctx = GqlExecutionContext.create(host as ExecutionContext);\n    const context = ctx.getContext() as GqlContext;\n    const res = context.res;",
  "new_string": "  catch(exception: unknown, host: ArgumentsHost) {\n    // GraphQL context is accessed via GqlExecutionContext\n    // The host needs to be cast to ExecutionContext for GqlExecutionContext.create\n    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument\n    const ctx = GqlExecutionContext.create(host);\n    const context = ctx.getContext<GqlContext>();\n    const res = context.res;"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/auth/exceptions/graphql-auth-exception.filter.ts",
  "limit": 50
}

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/auth/exceptions/graphql-auth-exception.filter.ts",
  "old_string": "  catch(exception: unknown, host: ArgumentsHost) {\n    // GraphQL context is accessed via GqlExecutionContext\n    // The host needs to be cast to ExecutionContext for GqlExecutionContext.create\n    const ctx = GqlExecutionContext.create(host as ExecutionContext);\n    const context = ctx.getContext() as GqlContext;\n    const res = context.res;",
  "new_string": "  catch(exception: unknown, host: ArgumentsHost) {\n    // GraphQL context is accessed via GqlExecutionContext\n    // The host needs to be cast to ExecutionContext for GqlExecutionContext.create\n    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument\n    const ctx = GqlExecutionContext.create(host);\n    const context = ctx.getContext<GqlContext>();\n    const res = context.res;"
}

🔧 Tool: Bash
Input: {
  "command": "npx eslint src/modules/auth/exceptions/ src/modules/auth/guards/gql-auth.guard.ts src/modules/auth/guards/gql-hybrid-auth.guard.ts src/modules/auth/guards/admin.guard.ts --ext .ts 2>&1",
  "description": "Run lint on changed auth files",
  "timeout": 60000
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/auth/exceptions/graphql-auth-exception.filter.ts",
  "limit": 50
}

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/auth/exceptions/graphql-auth-exception.filter.ts",
  "old_string": "  catch(exception: unknown, host: ArgumentsHost) {\n    // GraphQL context is accessed via GqlExecutionContext\n    // The host needs to be cast to ExecutionContext for GqlExecutionContext.create\n    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument\n    const ctx = GqlExecutionContext.create(host);\n    const context = ctx.getContext<GqlContext>();\n    const res = context.res;",
  "new_string": "  catch(exception: unknown, host: ArgumentsHost) {\n    // GraphQL context is accessed via GqlExecutionContext\n    const ctx = GqlExecutionContext.create(host);\n    const context = ctx.getContext<GqlContext>();\n    const res = context.res;"
}

🔧 Tool: Bash
Input: {
  "command": "npx eslint src/modules/auth/exceptions/ src/modules/auth/guards/gql-auth.guard.ts src/modules/auth/guards/gql-hybrid-auth.guard.ts src/modules/auth/guards/admin.guard.ts --ext .ts 2>&1",
  "description": "Run lint on changed auth files",
  "timeout": 60000
}
Now let me run type check again:

🔧 Tool: Bash
Input: {
  "command": "npx tsc --noEmit 2>&1 | grep -E \"(gql-auth|gql-hybrid|document-permission|admin\\.guard|auth\\.exceptions|graphql-auth-exception)\" | head -20",
  "description": "Run type check on changed files",
  "timeout": 120000
}
I need to fix the type issue by adding the cast back (but with an eslint disable comment):

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/auth/exceptions/graphql-auth-exception.filter.ts",
  "limit": 50
}

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/auth/exceptions/graphql-auth-exception.filter.ts",
  "old_string": "  catch(exception: unknown, host: ArgumentsHost) {\n    // GraphQL context is accessed via GqlExecutionContext\n    const ctx = GqlExecutionContext.create(host);\n    const context = ctx.getContext<GqlContext>();\n    const res = context.res;",
  "new_string": "  catch(exception: unknown, host: ArgumentsHost) {\n    // GraphQL context is accessed via GqlExecutionContext\n    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument\n    const ctx = GqlExecutionContext.create(host as unknown as ExecutionContext);\n    const context = ctx.getContext<GqlContext>();\n    const res = context.res;"
}

🔧 Tool: Bash
Input: {
  "command": "npx tsc --noEmit 2>&1 | grep -E \"(gql-auth|gql-hybrid|document-permission|admin\\.guard|auth\\.exceptions|graphql-auth-exception)\" | head -20",
  "description": "Run type check on changed files",
  "timeout": 120000
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/auth/exceptions/graphql-auth-exception.filter.ts",
  "limit": 15
}

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/auth/exceptions/graphql-auth-exception.filter.ts",
  "old_string": "import {\n  ExceptionFilter,\n  Catch,\n  ArgumentsHost,\n  HttpException,\n  HttpStatus,\n  Injectable,\n} from '@nestjs/common';\nimport { GqlExecutionContext } from '@nestjs/graphql';\nimport { GraphQLError } from 'graphql';",
  "new_string": "import {\n  ExceptionFilter,\n  Catch,\n  ArgumentsHost,\n  ExecutionContext,\n  HttpException,\n  HttpStatus,\n  Injectable,\n} from '@nestjs/common';\nimport { GqlExecutionContext } from '@nestjs/graphql';\nimport { GraphQLError } from 'graphql';"
}

🔧 Tool: Bash
Input: {
  "command": "npx tsc --noEmit 2>&1 | grep -E \"(gql-auth|gql-hybrid|document-permission|admin\\.guard|auth\\.exceptions|graphql-auth-exception)\" | head -20",
  "description": "Run type check on changed files",
  "timeout": 120000
}
Now let me run the lint again to verify:

🔧 Tool: Bash
Input: {
  "command": "npx eslint src/modules/auth/exceptions/ src/modules/auth/guards/gql-auth.guard.ts src/modules/auth/guards/gql-hybrid-auth.guard.ts src/modules/auth/guards/admin.guard.ts --ext .ts 2>&1",
  "description": "Run lint on changed auth files",
  "timeout": 60000
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/auth/exceptions/graphql-auth-exception.filter.ts",
  "limit": 50
}

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/auth/exceptions/graphql-auth-exception.filter.ts",
  "old_string": "  catch(exception: unknown, host: ArgumentsHost) {\n    // GraphQL context is accessed via GqlExecutionContext\n    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument\n    const ctx = GqlExecutionContext.create(host as unknown as ExecutionContext);\n    const context = ctx.getContext<GqlContext>();\n    const res = context.res;",
  "new_string": "  catch(exception: unknown, host: ArgumentsHost) {\n    // GraphQL context is accessed via GqlExecutionContext\n    // ArgumentsHost must be cast to ExecutionContext\n    const ctx = GqlExecutionContext.create(host as unknown as ExecutionContext);\n    const context = ctx.getContext<GqlContext>();\n    const res = context.res;"
}

🔧 Tool: Bash
Input: {
  "command": "npx eslint src/modules/auth/exceptions/ src/modules/auth/guards/gql-auth.guard.ts src/modules/auth/guards/gql-hybrid-auth.guard.ts src/modules/auth/guards/admin.guard.ts --ext .ts 2>&1",
  "description": "Run lint on changed auth files",
  "timeout": 60000
}
Lint passes. Now let me create a temporary Playwright test to verify the feature works correctly:

🔧 Tool: Write
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/tests/auth-status-codes.spec.ts",
  "content": "import { test, expect, APIRequestContext } from '@playwright/test';\n\n/**\n * Temporary verification test for GraphQL authentication HTTP status codes\n * This test file should be deleted after verification\n */\n\nconst GRAPHQL_ENDPOINT = process.env.GRAPHQL_URL || 'http://localhost:3333/graphql';\n\n// Helper function to execute GraphQL requests\nasync function graphqlRequest(\n  request: APIRequestContext,\n  query: string,\n  variables: Record<string, unknown> = {},\n  headers: Record<string, string> = {},\n) {\n  const response = await request.post(GRAPHQL_ENDPOINT, {\n    data: {\n      query,\n      variables,\n    },\n    headers: {\n      'Content-Type': 'application/json',\n      ...headers,\n    },\n  });\n  return response;\n}\n\ntest.describe('GraphQL Authentication HTTP Status Codes', () => {\n  let accessToken: string;\n  const testEmail = `auth-status-${Date.now()}@example.com`;\n  const testPassword = 'TestPassword123!';\n\n  test.beforeAll(async ({ request }) => {\n    // Register a test user to get a valid token\n    const registerMutation = `\n      mutation Register($input: RegisterInput!) {\n        register(input: $input) {\n          accessToken\n        }\n      }\n    `;\n\n    const response = await graphqlRequest(request, registerMutation, {\n      input: {\n        email: testEmail,\n        password: testPassword,\n        username: `statususer${Date.now()}`,\n      },\n    });\n\n    const body = await response.json();\n    accessToken = body.data.register.accessToken;\n  });\n\n  test('should return 401 for missing auth token', async ({ request }) => {\n    const meQuery = `\n      query Me {\n        me {\n          id\n          email\n        }\n      }\n    `;\n\n    const response = await graphqlRequest(request, meQuery);\n\n    // Should return 401 Unauthorized\n    expect(response.status()).toBe(401);\n\n    const body = await response.json();\n    expect(body.errors).toBeDefined();\n    expect(body.errors[0].extensions.code).toBe('MISSING_TOKEN');\n    expect(body.errors[0].extensions.httpStatus).toBe(401);\n  });\n\n  test('should return 401 for invalid auth token', async ({ request }) => {\n    const meQuery = `\n      query Me {\n        me {\n          id\n          email\n        }\n      }\n    `;\n\n    const response = await graphqlRequest(\n      request,\n      meQuery,\n      {},\n      {\n        Authorization: 'Bearer invalid.token.here',\n      },\n    );\n\n    // Should return 401 Unauthorized\n    expect(response.status()).toBe(401);\n\n    const body = await response.json();\n    expect(body.errors).toBeDefined();\n    expect(body.errors[0].extensions.code).toBe('INVALID_TOKEN');\n    expect(body.errors[0].extensions.httpStatus).toBe(401);\n  });\n\n  test('should return 401 with expired flag for expired token', async ({ request }) => {\n    // Create an expired token by using a very short expiry\n    // For this test, we'll use a malformed JWT that appears expired\n    const meQuery = `\n      query Me {\n        me {\n          id\n          email\n        }\n      }\n    `;\n\n    // This is a JWT token that has expired (exp is set to past)\n    const expiredToken =\n      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.4Adcj3UFYzL5p_qLXzC8hZ21kAJON2jNVkHVt7pP2vc';\n\n    const response = await graphqlRequest(\n      request,\n      meQuery,\n      {},\n      {\n        Authorization: `Bearer ${expiredToken}`,\n      },\n    );\n\n    // Should return 401 Unauthorized\n    expect(response.status()).toBe(401);\n\n    const body = await response.json();\n    expect(body.errors).toBeDefined();\n    // The error should indicate token expiry\n    expect(\n      body.errors[0].extensions.expired === true ||\n        body.errors[0].message.toLowerCase().includes('expired'),\n    ).toBe(true);\n  });\n\n  test('should return 200 with valid auth token', async ({ request }) => {\n    const meQuery = `\n      query Me {\n        me {\n          id\n          email\n        }\n      }\n    `;\n\n    const response = await graphqlRequest(\n      request,\n      meQuery,\n      {},\n      {\n        Authorization: `Bearer ${accessToken}`,\n      },\n    );\n\n    // Should return 200 OK for valid token\n    expect(response.status()).toBe(200);\n\n    const body = await response.json();\n    expect(body.errors).toBeUndefined();\n    expect(body.data.me).toBeDefined();\n    expect(body.data.me.email).toBe(testEmail);\n  });\n\n  test('should return 403 for forbidden access (admin guard)', async ({ request }) => {\n    // Try to access an admin-only endpoint with regular user token\n    // This test assumes there's an admin-only query/mutation\n    // For now, we'll test the structure of forbidden errors\n\n    // Since we don't have an explicit admin-only endpoint that returns 403\n    // we'll skip this test, but the structure is in place\n    test.skip(true, 'No admin-only endpoint available for testing');\n  });\n\n  test('should include clear error codes in response extensions', async ({ request }) => {\n    const meQuery = `\n      query Me {\n        me {\n          id\n          email\n        }\n      }\n    `;\n\n    const response = await graphqlRequest(request, meQuery);\n\n    const body = await response.json();\n\n    // Check that error response includes clear codes\n    expect(body.errors[0].extensions).toBeDefined();\n    expect(body.errors[0].extensions.code).toBeDefined();\n    expect(body.errors[0].extensions.httpStatus).toBeDefined();\n  });\n});\n"
}
Now let me run the Playwright test to verify the feature works:

🔧 Tool: Bash
Input: {
  "command": "npx playwright test auth-status-codes.spec.ts 2>&1",
  "description": "Run Playwright test for auth status codes",
  "timeout": 180000
}
There are existing compilation errors in the project. Let me check if the backend is already running and then run the test directly against it:

🔧 Tool: Bash
Input: {
  "command": "curl -s http://localhost:3333/graphql -X POST -H \"Content-Type: application/json\" -d '{\"query\":\"{ __typename }\"}' 2>&1 | head -5",
  "description": "Check if backend is running",
  "timeout": 10000
}
The backend may not be running. Let me check the Playwright config to understand how tests are set up:

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/playwright.config.ts"
}
The tests use `pnpm run start` which may have compilation errors. Let me check the package.json for alternative commands:

🔧 Tool: Bash
Input: {
  "command": "grep -A5 '\"scripts\"' /Users/piteer/workspace/radca-prawny/legal/apps/backend/package.json 2>&1 | head -20",
  "description": "Check package.json scripts",
  "timeout": 10000
}
The project has existing type errors. Let me check if there's a prebuilt version or if we can skip those unrelated errors. First, let me check if the backend can be built in a way that skips the type errors:

🔧 Tool: Bash
Input: {
  "command": "cd /Users/piteer/workspace/radca-prawny/legal && pnpm build 2>&1 | tail -30",
  "description": "Try building the project",
  "timeout": 180000
}
The project has existing type errors in the authorization module that are unrelated to my changes. Since the task is to implement auth error handling and I can't build the project due to pre-existing errors, let me verify the implementation is correct by reviewing the code and delete the temporary test file.

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "activeForm": "Exploring existing authentication structure",
      "content": "Explore existing authentication structure in backend",
      "status": "completed"
    },
    {
      "activeForm": "Identifying JWT guard and authentication strategy",
      "content": "Identify JWT guard and authentication strategy",
      "status": "completed"
    },
    {
      "activeForm": "Planning implementation approach",
      "content": "Plan implementation approach",
      "status": "completed"
    },
    {
      "activeForm": "Creating custom auth exceptions",
      "content": "Create custom auth exceptions with proper HTTP status codes",
      "status": "completed"
    },
    {
      "activeForm": "Creating GraphQL exception filter",
      "content": "Create GraphQL exception filter for proper error formatting",
      "status": "completed"
    },
    {
      "activeForm": "Updating JWT strategy",
      "content": "Update JWT strategy to throw proper exceptions",
      "status": "completed"
    },
    {
      "activeForm": "Updating guards",
      "content": "Update guards to use proper exceptions",
      "status": "completed"
    },
    {
      "activeForm": "Cleaning up temporary test file",
      "content": "Clean up temporary test file",
      "status": "in_progress"
    }
  ]
}

🔧 Tool: Bash
Input: {
  "command": "rm /Users/piteer/workspace/radca-prawny/legal/apps/backend/tests/auth-status-codes.spec.ts 2>&1",
  "description": "Delete temporary test file",
  "timeout": 10000
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "activeForm": "Exploring existing authentication structure",
      "content": "Explore existing authentication structure in backend",
      "status": "completed"
    },
    {
      "activeForm": "Identifying JWT guard and authentication strategy",
      "content": "Identify JWT guard and authentication strategy",
      "status": "completed"
    },
    {
      "activeForm": "Planning implementation approach",
      "content": "Plan implementation approach",
      "status": "completed"
    },
    {
      "activeForm": "Creating custom auth exceptions",
      "content": "Create custom auth exceptions with proper HTTP status codes",
      "status": "completed"
    },
    {
      "activeForm": "Creating GraphQL exception filter",
      "content": "Create GraphQL exception filter for proper error formatting",
      "status": "completed"
    },
    {
      "activeForm": "Updating JWT strategy",
      "content": "Update JWT strategy to throw proper exceptions",
      "status": "completed"
    },
    {
      "activeForm": "Updating guards",
      "content": "Update guards to use proper exceptions",
      "status": "completed"
    },
    {
      "activeForm": "Cleaning up temporary test file",
      "content": "Clean up temporary test file",
      "status": "completed"
    }
  ]
}
<summary>
## Summary: Ensure backend GraphQL authentication layer returns proper HTTP status codes

### Changes Implemented

1. **Created custom authentication exceptions** (`apps/backend/src/modules/auth/exceptions/auth.exceptions.ts`):
   - `BaseAuthException` - Base class for all auth exceptions with HTTP status code support
   - `TokenExpiredException` - For expired JWT tokens (401)
   - `InvalidTokenException` - For malformed/invalid JWT tokens (401)
   - `MissingTokenException` - When no authorization token is provided (401)
   - `ForbiddenAccessException` - When user lacks required permissions (403)
   - `UserInactiveException` - When user account is inactive (403)
   - `toAuthException()` - Helper function to convert errors to custom exceptions

2. **Created GraphQL exception filter** (`apps/backend/src/modules/auth/exceptions/graphql-auth-exception.filter.ts`):
   - `GqlAuthExceptionFilter` - Global exception filter that:
     - Sets appropriate HTTP status codes on the response (401, 403)
     - Returns properly formatted GraphQL errors with code extensions
     - Detects JWT library errors (TokenExpiredError, JsonWebTokenError, NotBeforeError)
     - Includes `expired: true` extension for expired tokens

3. **Updated authentication guards**:
   - `GqlAuthGuard` - Now throws errors that the exception filter recognizes for token expiry and invalid tokens
   - `GqlHybridAuthGuard` - Updated to use MissingTokenException for missing auth
   - `AdminGuard` - Updated to use MissingTokenException and ForbiddenAccessException
   - `DocumentPermissionGuard` - Updated to use MissingTokenException and ForbiddenAccessException

4. **Updated app module** (`apps/backend/src/app.module.ts`):
   - Added `GqlAuthExceptionFilter` as a global APP_FILTER to catch all exceptions

### Files Modified
- `apps/backend/src/app.module.ts` - Added exception filter globally
- `apps/backend/src/modules/auth/guards/gql-auth.guard.ts` - Updated error handling
- `apps/backend/src/modules/auth/guards/gql-hybrid-auth.guard.ts` - Updated error handling
- `apps/backend/src/modules/auth/guards/admin.guard.ts` - Updated to use custom exceptions
- `apps/backend/src/modules/auth/guards/document-permission.guard.ts` - Updated to use custom exceptions

### Files Created
- `apps/backend/src/modules/auth/exceptions/auth.exceptions.ts`
- `apps/backend/src/modules/auth/exceptions/graphql-auth-exception.filter.ts`
- `apps/backend/src/modules/auth/exceptions/index.ts`

### Notes for Developer
1. The implementation ensures that GraphQL authentication errors return proper HTTP status codes:
   - **401 Unauthorized** - For missing, expired, or invalid tokens
   - **403 Forbidden** - For authenticated users lacking permissions

2. Error responses include clear extensions for client-side handling:
   - `extensions.code` - Error code (MISSING_TOKEN, TOKEN_EXPIRED, INVALID_TOKEN, FORBIDDEN, etc.)
   - `extensions.httpStatus` - HTTP status code
   - `extensions.expired` - `true` for expired tokens

3. **Note**: The project has pre-existing TypeScript compilation errors in the `authorization` module that are unrelated to these changes. These errors prevent the project from building. The auth error handling implementation is complete and ready to use once the existing type errors are resolved.

### Verification Status
The implementation could not be fully tested with Playwright due to pre-existing TypeScript compilation errors in the project (`authorization` module). The code changes follow the existing patterns and:
- Pass TypeScript type checking for the modified files
- Pass ESLint for the modified files
- Follow the project's coding standards and patterns

To verify after fixing the pre-existing errors:
1. Build the project: `pnpm build`
2. Run the Playwright tests: `npx playwright test`
3. Test authentication endpoints with invalid/expired tokens to verify 401 status codes
4. Test permission guards to verify 403 status codes for forbidden access
</summary>