import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { setupBullBoard } from './shared/queues/bull-board.setup';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

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

  // Setup Bull Board for queue monitoring (development only)
  try {
    setupBullBoard(app);
  } catch (error) {
    console.warn(
      'Bull Board setup skipped:',
      error instanceof Error ? error.message : 'Unknown error',
    );
  }

  await app.listen(process.env.PORT ?? 3001);
}
void bootstrap();
