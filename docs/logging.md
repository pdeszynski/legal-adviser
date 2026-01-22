# Structured Logging Infrastructure

This document describes the structured logging implementation using Winston with correlation IDs.

## Overview

The logging infrastructure provides:
- **Structured JSON logging** in production for log aggregation
- **Readable console logs** in development with colors
- **Correlation IDs** for tracking requests across services
- **Automatic sanitization** of sensitive data (passwords, tokens)
- **Child loggers** with context for better traceability

## Installation

The logger is installed as a global module via `LoggerModule` in `app.module.ts`.

```typescript
import { LoggerModule } from './shared/logger';

@Module({
  imports: [
    LoggerModule.forRoot({
      level: process.env.LOG_LEVEL || 'info',
      json: process.env.NODE_ENV === 'production',
      colorize: process.env.NODE_ENV !== 'production',
    }),
  ],
})
export class AppModule {}
```

## Usage

### Basic Usage in Services

```typescript
import { Injectable } from '@nestjs/common';
import { AppLogger } from '../shared/logger';

@Injectable()
export class MyService {
  private readonly logger = new AppLogger({});

  constructor() {
    this.logger.setContext('MyService');
  }

  myMethod() {
    this.logger.log('Info message');
    this.logger.error('Error message', 'stack-trace');
    this.logger.warn('Warning message');
    this.logger.debug('Debug message');
  }
}
```

### Logging with Metadata

Use `logWithMetadata()` to include structured metadata:

```typescript
this.logger.logWithMetadata(
  'User logged in',
  {
    userId: user.id,
    correlationId: req.correlationId,
    loginMethod: 'password',
  },
  'info'
);
```

### Accessing Correlation ID

Correlation IDs are automatically added to all requests by the `CorrelationIdMiddleware`:

```typescript
@UseInterceptors(LoggingInterceptor)
export class MyController {
  @Get()
  async findAll(@Req() req: Request) {
    const correlationId = req.correlationId;
    this.logger.logWithMetadata('Processing request', { correlationId });
  }
}
```

### Child Loggers

Create child loggers for specific contexts:

```typescript
const childLogger = this.logger.getChildLogger('SpecificOperation');
childLogger.log('Child logger message');
```

## Configuration

### Environment Variables

- `LOG_LEVEL`: Logging level (default: 'info')
- `NODE_ENV`: Environment (affects JSON formatting)
- `SENTRY_DSN`: Sentry integration for error tracking

### Log Levels

- `error`: Error conditions
- `warn`: Warning conditions
- `info`: Informational messages (default)
- `debug`: Debug-level messages
- `verbose`: Verbose debugging

## Log Format

### Development (console format)

```
2025-01-22T10:30:45.123Z [AuthService] info: User logged successfully {
  "userId": "123e4567-e89b-12d3-a456-426614174000"
}
```

### Production (JSON format)

```json
{
  "timestamp": "2025-01-22T10:30:45.123Z",
  "level": "info",
  "message": "User logged successfully",
  "context": "AuthService",
  "userId": "123e4567-e89b-12d3-a456-426614174000"
}
```

## Sensitive Data Sanitization

The logger automatically redacts sensitive fields:
- `password`
- `token`
- `secret`
- `apiKey`
- `accessToken`

Example:
```typescript
this.logger.logWithMetadata('Login attempt', {
  username: 'user@example.com',
  password: 'secret123', // Automatically redacted to [REDACTED]
});
```

## Best Practices

1. **Use appropriate log levels**: `error` for failures, `info` for normal operations, `debug` for troubleshooting
2. **Include correlation IDs**: Always pass correlation ID from requests
3. **Structure metadata**: Use structured objects for machine parsing
4. **Avoid logging secrets**: The logger sanitizes known fields, but be careful with custom fields
5. **Use context**: Set meaningful context with `setContext()` or child loggers
6. **Don't log large objects**: Avoid logging entire request/response bodies; log relevant fields only

## Integration with Existing Services

The `AuthService` has been updated to use the new logger:

```typescript
@Injectable()
export class AuthService {
  private readonly logger = new AppLogger({});

  constructor(private jwtService: JwtService, ...) {
    this.logger.setContext('AuthService');
  }
}
```

Update other services similarly to use structured logging.
