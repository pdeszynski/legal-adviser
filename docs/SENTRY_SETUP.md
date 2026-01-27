# Sentry Error Tracking Setup

This document describes how to configure Sentry error tracking for the Legal AI Platform.

## Overview

Sentry is integrated across all three components of the platform:

- **Frontend** (Next.js) - Captures client-side errors and performance monitoring
- **Backend** (NestJS) - Captures server-side errors and API failures
- **AI Engine** (Python/FastAPI) - Captures AI processing errors

## Environment Variables

Add the following environment variables to enable Sentry:

### Frontend (Next.js)

```bash
# Required: Sentry Data Source Name (DSN)
NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/project-id

# Optional: Sentry organization for release tracking
SENTRY_ORG=your-organization
SENTRY_PROJECT=your-project

# Optional: Auth token for uploading source maps
SENTRY_AUTH_TOKEN=your-auth-token
```

### Backend (NestJS)

```bash
# Required: Sentry Data Source Name (DSN)
SENTRY_DSN=https://your-dsn@sentry.io/project-id

# Environment will be auto-detected from NODE_ENV
NODE_ENV=production
```

### AI Engine (Python)

```bash
# Required: Sentry Data Source Name (DSN)
SENTRY_DSN=https://your-dsn@sentry.io/project-id

# Optional: Environment override (defaults to development)
NODE_ENV=production
# or
ENVIRONMENT=production
```

## Getting Sentry Credentials

1. Create a Sentry account at https://sentry.io
2. Create a new project
3. Select the appropriate platform (Node.js, Next.js, Python)
4. Copy the DSN from the project settings
5. For release tracking and source maps, create an auth token in Settings > Auth Tokens

## Development Mode

By default, Sentry is configured **not** to send events in development mode to avoid cluttering your Sentry dashboard with development errors.

- Frontend: Events from `localhost` are filtered out
- Backend: Events are filtered when `NODE_ENV=development`
- AI Engine: Events are filtered when `ENVIRONMENT=development`

To test Sentry in development, temporarily set `NODE_ENV=production`.

## Features

### Automatic Error Capturing

- Unhandled exceptions
- Unhandled promise rejections
- HTTP request failures
- GraphQL errors

### Performance Monitoring

- Frontend: Page load times, rendering performance
- Backend: API response times, database queries
- AI Engine: Request processing time

### Session Replay (Frontend)

- Records user sessions to help debug issues
- Masked for privacy (all text masked, media blocked)

### Context Tracking

- User information (when authenticated)
- Request details (URL, method, headers)
- Custom tags and extra data

## Troubleshooting

### Events not appearing in Sentry

1. Check that `SENTRY_DSN` is set correctly
2. Verify `NODE_ENV` is not set to `development`
3. Check browser console for initialization errors
4. Verify network requests to Sentry are not blocked

### Source maps not working

1. Ensure `SENTRY_AUTH_TOKEN` has `project:releases` scope
2. Check that `next.config.mjs` has the Sentry webpack configuration
3. Verify source maps are uploaded during build

### Build warnings

The following warnings are expected during first-time setup:

- Missing instrumentation file
- Missing global error handler
- Deprecation warnings about config file naming

These can be resolved by following Sentry's Next.js setup guide, but the integration will work as-is.

## Configuration Files

### Frontend

- `apps/web/sentry.client.config.ts` - Client-side configuration
- `apps/web/sentry.server.config.ts` - Server-side configuration
- `apps/web/sentry.edge.config.ts` - Edge runtime configuration
- `apps/web/next.config.mjs` - Webpack configuration for source maps

### Backend

- `apps/backend/src/common/sentry/sentry.module.ts` - Sentry module initialization
- `apps/backend/src/common/sentry/sentry.interceptor.ts` - Error interceptor
- `apps/backend/src/main.ts` - Error handler middleware

### AI Engine

- `apps/ai-engine/src/sentry_init.py` - Sentry initialization and helper functions
- `apps/ai-engine/src/main.py` - FastAPI integration

## Additional Resources

- [Sentry JavaScript Documentation](https://docs.sentry.io/platforms/javascript/)
- [Sentry Node.js Documentation](https://docs.sentry.io/platforms/node/)
- [Sentry Python Documentation](https://docs.sentry.io/platforms/python/)
- [Next.js Sentry Integration](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
