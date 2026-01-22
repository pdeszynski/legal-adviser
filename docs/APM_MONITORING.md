# APM Monitoring Setup

This document describes the Application Performance Monitoring (APM) setup for the Legal AI Platform using Sentry.

## Overview

The platform uses **Sentry** for comprehensive APM, including:
- **Error Tracking**: Automatic error capture and reporting
- **Performance Monitoring**: Request latency and throughput tracking
- **Distributed Tracing**: Cross-service request tracing
- **Database Monitoring**: Query performance tracking
- **AI Operations Tracking**: OpenAI API calls and LangGraph execution

## Architecture

```
┌─────────────┐         ┌─────────────┐         ┌──────────────┐
│   Frontend  │────────▶│   Backend   │────────▶│  AI Engine   │
│  (Next.js)  │         │  (NestJS)   │         │  (FastAPI)   │
└─────────────┘         └─────────────┘         └──────────────┘
       │                       │                       │
       └───────────────────────┴───────────────────────┘
                               │
                         ┌──────▼──────┐
                         │   Sentry    │
                         │   (APM)     │
                         └─────────────┘
```

## Features

### 1. Distributed Tracing

Every request is automatically traced across services:
- **Frontend → Backend**: Via Sentry browser SDK
- **Backend → AI Engine**: Via `sentry-trace` header propagation
- **AI Engine → OpenAI**: Via custom instrumentation

### 2. Performance Metrics

Automatically tracked:
- Request/response latency (p50, p95, p99)
- Database query performance
- HTTP client requests
- Custom business metrics

### 3. Error Tracking

Captures and aggregates:
- Unhandled exceptions
- GraphQL errors
- HTTP 4xx/5xx responses
- AI operation failures

## Environment Configuration

### Backend (NestJS)

```bash
# Required
SENTRY_DSN=https://your-dsn@sentry.io/project-id

# Optional
SENTRY_TRACES_SAMPLE_RATE=0.1  # 10% in production
SENTRY_PROFILES_SAMPLE_RATE=0.1  # Profiling rate
SENTRY_ENVIRONMENT=production
NODE_ENV=production
```

### AI Engine (FastAPI)

```bash
# Required
SENTRY_DSN=https://your-dsn@sentry.io/project-id

# Optional
SENTRY_TRACES_SAMPLE_RATE=0.1
SENTRY_PROFILES_SAMPLE_RATE=0.1
SENTRY_ENVIRONMENT=production
NODE_ENV=production
ENVIRONMENT=production
```

### Frontend (Next.js)

```bash
# Required
NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/project-id

# Optional (for source maps upload)
SENTRY_ORG=your-org
SENTRY_PROJECT=legal-ai-frontend
SENTRY_AUTH_TOKEN=your-auth-token
```

## Sampling Rates

### Development
- **Traces**: 100% (all requests traced)
- **Profiles**: 0% (profiling disabled)
- **Events**: Captured locally, not sent to Sentry

### Production
- **Traces**: 10% (configurable via `SENTRY_TRACES_SAMPLE_RATE`)
- **Profiles**: 10% (configurable via `SENTRY_PROFILES_SAMPLE_RATE`)
- **Events**: Filtered, only errors sent to Sentry

## Usage

### Backend (NestJS)

#### Custom Spans

```typescript
import { startDbSpan, startHttpSpan, startAiSpan } from '@common/sentry/performance.interceptor';

// Database operation
const span = startDbSpan('users.find', { query: { id: 1 } });
const result = await this.userRepository.findOne({ where: { id: 1 } });
span?.finish();

// HTTP client request
const httpSpan = startHttpSpan('POST', 'https://api.openai.com/v1/chat');
const response = await axios.post(url, data);
httpSpan?.setHttpStatus(response.status);
httpSpan?.finish();

// AI operation
const aiSpan = startAiSpan('openai.chat.completion', { model: 'gpt-4' });
const result = await this.aiService.chat(prompt);
aiSpan?.setData('tokens_used', result.usage.totalTokens);
aiSpan?.finish();
```

#### Manual Error Capture

```typescript
import * as Sentry from '@sentry/node';

try {
  await someOperation();
} catch (error) {
  Sentry.captureException(error, {
    tags: {
      component: 'UserService',
      operation: 'createUser',
    },
    extra: {
      userId: user.id,
      email: user.email,
    },
  });
  throw error;
}
```

### AI Engine (FastAPI)

#### Custom Spans

```python
from .sentry_init import start_ai_span, start_db_span, start_http_span, set_transaction_name, set_measurement

# Set transaction name
set_transaction_name("qa_graph.process_question")

# AI operation span
with start_ai_span("openai.chat.completion", model="gpt-4", prompt_tokens=100) as span:
    result = await openai.chat.completions.create(...)
    span.set_data("completion_tokens", result.usage.completion_tokens)
    span.set_data("total_cost_usd", result.usage.total_tokens * 0.00003)

# Database operation span
with start_db_span("vector_search", table="document_embeddings", query_type="similarity") as span:
    results = await db.execute(query)
    span.set_data("rows_returned", len(results))

# Custom measurements
set_measurement("tokens_used", 1250, "tokens")
set_measurement("processing_time_ms", 523, "ms")
```

#### Manual Error Capture

```python
from .sentry_init import capture_exception, set_user

try:
    await some_operation()
except Exception as e:
    # Set user context
    set_user(user_id=str(user.id), email=user.email)

    # Capture with context
    capture_exception(e, {
        "component": "QAGraph",
        "question": question[:100],  # Truncate for privacy
        "mode": mode,
    })
    raise
```

## Sentry Dashboard

### Key Views

1. **Performance**: Transaction duration, throughput, error rate
2. **Services**: Backend, AI Engine, Frontend performance breakdown
3. **Database**: Slow query identification
4. **AI Operations**: OpenAI API call performance and costs

### Useful Queries

#### Slow Requests
```
transaction.duration > 1000ms
service:backend OR service:ai-engine
```

#### Failed AI Operations
```
transaction.op:ai.operation
transaction.status:internal_error
```

#### Database Performance
```
transaction.op:db
transaction.duration > 500ms
```

## Troubleshooting

### No Traces Appearing

1. Check `SENTRY_DSN` is set correctly
2. Verify `SENTRY_TRACES_SAMPLE_RATE > 0`
3. Ensure not in development mode (development traces are filtered)
4. Check browser console for frontend errors

### Missing Distributed Traces

1. Verify `sentry-trace` header is being propagated
2. Check AI Engine middleware is configured
3. Ensure both services use same Sentry project/DSN

### High Sampling Rate Costs

If Sentry costs are too high:
1. Reduce `SENTRY_TRACES_SAMPLE_RATE` to 0.05 (5%)
2. Set `SENTRY_PROFILES_SAMPLE_RATE=0` to disable profiling
3. Use transaction filtering to ignore health checks

## Best Practices

1. **Always add custom spans** for external API calls
2. **Set meaningful transaction names** for better grouping
3. **Use tags for filtering** (e.g., `model:gpt-4`, `operation:classification`)
4. **Add measurements** for business metrics (tokens, documents processed)
5. **Set user context** when available for user-specific error views
6. **Don't send sensitive data** to Sentry (passwords, tokens, PII)
7. **Monitor slow queries** regularly to identify database optimization opportunities

## Alerts Configuration

Recommended alerts in Sentry:

### Performance
- **P95 latency > 2s** for any service
- **Error rate > 1%** for critical endpoints
- **Database query time > 1s**

### AI Operations
- **OpenAI API failures** > 5%
- **AI operation timeout** > 30s
- **Token usage spike** (potential abuse)

### Cost
- **Monthly token budget** approaching limit
- **API call rate** exceeds expected thresholds

## Additional Resources

- [Sentry Performance Monitoring Docs](https://docs.sentry.io/platforms/node/performance/)
- [Distributed Tracing Guide](https://docs.sentry.io/platforms/python/performance/distributed-tracing/)
- [Custom Instrumentation](https://docs.sentry.io/platforms/node/performance/instrumentation/)
