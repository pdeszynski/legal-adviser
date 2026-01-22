import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import * as Sentry from '@sentry/node';

@Injectable()
export class SentryInterceptor implements NestInterceptor {
  private readonly logger = new Logger(SentryInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    // Check if request exists before accessing its properties
    if (!request) {
      return next.handle();
    }

    // Add user context if available
    if (request?.user) {
      Sentry.setUser({
        id: request.user.id,
        email: request.user.email,
      });
    }

    // Add additional context
    Sentry.setContext('request', {
      method: request.method,
      url: request.url,
      headers: request.headers,
    });

    return next.handle().pipe(
      catchError((error) => {
        // Log error locally
        this.logger.error(
          `Error in ${request.method} ${request.url}: ${error.message}`,
          error.stack,
        );

        // Capture exception in Sentry
        if (process.env.SENTRY_DSN && process.env.NODE_ENV !== 'development') {
          Sentry.captureException(error, {
            tags: {
              method: request.method,
              url: request.url,
            },
            extra: {
              body: request.body,
              query: request.query,
              params: request.params,
            },
          });
        }

        // Re-throw the error
        throw error;
      }),
    );
  }
}
