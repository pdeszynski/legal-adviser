import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe, Logger } from '@nestjs/common';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import * as Sentry from '@sentry/node';
import { AppModule } from './app.module';
import { AppLogger } from './shared/logger';
import {
  buildDependencyChecks,
  validateDependencies,
  waitForDependency,
} from './shared/startup';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // Validate external dependencies before starting NestJS
  const dependencies = buildDependencyChecks();

  if (dependencies.length > 0) {
    logger.log('Validating external dependencies...');

    const isDevelopment = process.env.NODE_ENV === 'development';
    const skipAiEngineCheck = process.env.SKIP_AI_ENGINE_CHECK === 'true';

    if (isDevelopment && !skipAiEngineCheck) {
      // In development, wait for AI Engine with retries but don't fail if unavailable
      const aiEngineUrl = process.env.AI_ENGINE_URL || 'http://localhost:8000';
      const healthUrl = `${aiEngineUrl}/health`;

      logger.log(`Waiting for AI Engine at ${healthUrl}...`);
      const isHealthy = await waitForDependency(healthUrl, {
        maxRetries: 15,
        retryDelay: 2000,
        timeout: 5000,
        logPrefix: 'Bootstrap',
      });

      if (!isHealthy) {
        logger.warn(
          'AI Engine is not available. Some features may not work correctly. ' +
            'Set SKIP_AI_ENGINE_CHECK=true to suppress this warning.',
        );
      }
    } else if (!skipAiEngineCheck) {
      // In production, validate all required dependencies
      const results = await validateDependencies(dependencies);
      const requiredUnhealthy = results.filter((r) => !r.healthy);

      if (requiredUnhealthy.length > 0) {
        logger.error('Required dependencies are unhealthy:');
        for (const result of requiredUnhealthy) {
          logger.error(
            `  - ${result.name}: ${result.error || 'Unknown error'}`,
          );
        }
        throw new Error(
          'Cannot start application: required dependencies are unavailable',
        );
      }
    }
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
  });

  // Enable CORS for frontend access (Next.js dev server runs on different port)
  app.enableCors({
    origin: [
      'http://localhost:3000', // Next.js frontend (default port)
      'http://localhost:3001', // Alternative dev port
      'http://localhost:4000', // Alternative dev port
      process.env.FRONTEND_URL, // Production frontend URL
    ].filter(Boolean) as string[],
    credentials: true, // Allow cookies for authentication
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-CSRF-Token'],
    exposedHeaders: ['Set-Cookie'], // Allow frontend to see Set-Cookie header
  });

  // Enable cookie parsing for CSRF token validation
  app.use(cookieParser());

  // Configure helmet for security headers and XSS protection
  app.use(
    helmet({
      // Content Security Policy - prevents inline scripts and unauthorized resources
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles for development
          imgSrc: ["'self'", 'data:', 'https:'],
          fontSrc: ["'self'", 'https:', 'data:'],
          objectSrc: ["'none'"],
          upgradeInsecureRequests: [],
          frameAncestors: ["'none'"],
        },
      },
      // X-XSS-Protection header (legacy browsers)
      xXssProtection: true,
      // Prevent MIME type sniffing
      xContentTypeOptions: true,
      // Referrer Policy for privacy
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      // Hide X-Powered-By header
      hidePoweredBy: true,
      // Prevent clickjacking
      frameguard: { action: 'deny' },
      // Strict Transport Security
      hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
      },
    }),
  );

  // Enable global validation pipe for all DTOs and input types
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties not in DTO
      forbidNonWhitelisted: true, // Throw error for non-whitelisted properties
      transform: true, // Auto-transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true, // Allow implicit type conversion
      },
    }),
  );

  // Setup Sentry error handler (must be after all other middleware)
  if (process.env.SENTRY_DSN) {
    // Sentry error handler is automatically setup by the SDK in v10
    // No need to manually add middleware
  }

  const port = process.env.PORT ?? 3001;
  await app.listen(port);

  logger.log(`Application is running on: http://localhost:${port}`);
  logger.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
}
void bootstrap();
