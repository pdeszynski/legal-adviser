import { Injectable, NestMiddleware, Inject } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AppLogger } from './logger.service';
import { X_CORRELATION_ID, CORRELATION_ID_KEY } from './logger.constants';

declare global {
  namespace Express {
    interface Request {
      correlationId?: string;
    }
  }
}

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  constructor(private readonly logger: AppLogger) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const correlationId = req.header(X_CORRELATION_ID) || uuidv4();
    req.correlationId = correlationId;

    res.setHeader(X_CORRELATION_ID, correlationId);

    this.logger.setContext('CorrelationIdMiddleware');
    this.logger.logWithMetadata(
      `Request ${req.method} ${req.path}`,
      { correlationId },
      'debug',
    );

    next();
  }
}
