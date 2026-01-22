import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { SentryInterceptor } from './sentry.interceptor';
import { PerformanceInterceptor } from './performance.interceptor';
import { APP_INTERCEPTOR } from '@nestjs/core';

@Module({
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: SentryInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: PerformanceInterceptor,
    },
  ],
  exports: [],
})
export class SentryModule implements NestModule {
  constructor() {
    // Initialize Sentry with enhanced APM features
    if (process.env.SENTRY_DSN) {
      const integrations: any[] = [
        // Enable HTTP calls tracing
        Sentry.httpIntegration(),
        // Enable Express.js monitoring
        Sentry.expressIntegration(),
        // Enable PostgreSQL query tracing
        Sentry.postgresIntegration(),
      ];

      // Add profiling in production for deeper performance insights
      if (process.env.NODE_ENV === 'production') {
        integrations.push(nodeProfilingIntegration());
      }

      Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV || 'development',
        // Performance monitoring
        tracesSampleRate: this.getTracesSampleRate(),
        // Profiling (production only)
        profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,
        // Filter out development events
        beforeSend(event, hint) {
          if (process.env.NODE_ENV === 'development') {
            return null;
          }
          return event;
        },
        // Filter out development transactions
        beforeSendTransaction(event, hint) {
          if (process.env.NODE_ENV === 'development') {
            return null;
          }
          return event;
        },
        integrations,
        // Custom tags for better filtering in Sentry
        initialScope: {
          tags: {
            service: 'backend',
            runtime: 'node',
          },
        },
      });
    }
  }

  configure(consumer: MiddlewareConsumer) {
    // Note: Sentry 10.x doesn't expose Handlers in the same way
    // Request/tracing is automatically handled by the integrations above
  }

  private getTracesSampleRate(): number {
    // Configurable trace sampling via environment variable
    if (process.env.SENTRY_TRACES_SAMPLE_RATE) {
      return parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE);
    }
    // Default: 100% in development, 10% in production
    return process.env.NODE_ENV === 'production' ? 0.1 : 1.0;
  }
}
