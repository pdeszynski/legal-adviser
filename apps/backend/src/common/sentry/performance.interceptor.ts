import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import * as Sentry from '@sentry/node';

/**
 * Performance Interceptor for custom APM instrumentation
 *
 * Tracks:
 * - Request/response latency
 * - Database query performance
 * - External API calls
 * - Business operation metrics
 */
@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  private readonly logger = new Logger(PerformanceInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    if (!request) {
      return next.handle();
    }

    const startTime = Date.now();
    const handler = context.getHandler();
    const className = context.getClass().name;
    const methodName = handler.name;

    // Get or create active span for distributed tracing
    const activeSpan = Sentry.getActiveSpan();
    const rootSpan = activeSpan ? Sentry.getRootSpan(activeSpan) : undefined;

    if (rootSpan) {
      // Add request context to transaction
      rootSpan.setAttribute('handler', methodName);
      rootSpan.setAttribute('class', className);
      rootSpan.setAttribute('path', request.route?.path || request.url);
      rootSpan.setAttribute('request_id', request.correlationId);
    }

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;

          // Log performance metrics
          this.logger.debug(
            `${className}.${methodName} completed in ${duration}ms`,
          );

          if (rootSpan) {
            // Set transaction data
            rootSpan.setAttribute('response_time_ms', duration);

            // Add performance tag for slow requests
            if (duration > 1000) {
              rootSpan.setAttribute('performance', 'slow');
              this.logger.warn(
                `Slow request detected: ${methodName} took ${duration}ms`,
              );
            } else if (duration > 500) {
              rootSpan.setAttribute('performance', 'moderate');
            } else {
              rootSpan.setAttribute('performance', 'fast');
            }
          }
        },
        error: (error) => {
          const duration = Date.now() - startTime;

          if (rootSpan) {
            rootSpan.setAttribute('error', error.message);
            rootSpan.setAttribute('response_time_ms', duration);
          }
        },
      }),
    );
  }
}

/**
 * Create a child span for database operations
 *
 * Usage example:
 * ```typescript
 * const span = startDbSpan('users.find', { query: { id: 1 } });
 * const result = await this.userRepository.findOne({ where: { id: 1 } });
 * span?.end();
 * ```
 */
export function startDbSpan(
  operation: string,
  data?: Record<string, any>,
): ReturnType<typeof Sentry.startInactiveSpan> | undefined {
  const activeSpan = Sentry.getActiveSpan();
  if (!activeSpan) {
    return undefined;
  }

  const childSpan = Sentry.startInactiveSpan({
    op: 'db',
    name: operation,
    parentSpan: activeSpan,
  });

  if (childSpan && data) {
    Object.entries(data).forEach(([key, value]) => {
      childSpan.setAttribute(key, value);
    });
  }

  return childSpan;
}

/**
 * Create a child span for HTTP client requests
 *
 * Usage example:
 * ```typescript
 * const span = startHttpSpan('POST', 'https://api.openai.com/v1/chat');
 * const response = await axios.post(url, data);
 * span?.setAttribute('http.status_code', response.status);
 * span?.end();
 * ```
 */
export function startHttpSpan(
  method: string,
  url: string,
): ReturnType<typeof Sentry.startInactiveSpan> | undefined {
  const activeSpan = Sentry.getActiveSpan();
  if (!activeSpan) {
    return undefined;
  }

  return Sentry.startInactiveSpan({
    op: 'http.client',
    name: `${method} ${url}`,
    parentSpan: activeSpan,
  });
}

/**
 * Create a child span for AI operations
 *
 * Usage example:
 * ```typescript
 * const span = startAiSpan('openai.chat.completion', { model: 'gpt-4' });
 * const result = await this.openaiService.chat(prompt);
 * span?.setAttribute('tokens_used', result.usage.totalTokens);
 * span?.end();
 * ```
 */
export function startAiSpan(
  operation: string,
  data?: Record<string, any>,
): ReturnType<typeof Sentry.startInactiveSpan> | undefined {
  const activeSpan = Sentry.getActiveSpan();
  if (!activeSpan) {
    return undefined;
  }

  const childSpan = Sentry.startInactiveSpan({
    op: 'ai.operation',
    name: operation,
    parentSpan: activeSpan,
  });

  if (childSpan) {
    // Add default data
    childSpan.setAttribute('service', 'ai-engine');

    if (data) {
      Object.entries(data).forEach(([key, value]) => {
        childSpan.setAttribute(key, value);
      });
    }
  }

  return childSpan;
}
