import { Injectable, Scope, Inject } from '@nestjs/common';
import type { LoggerService } from '@nestjs/common';
import * as winston from 'winston';
import { LOGGER_MODULE_OPTIONS } from './logger.constants';
import type { LoggerConfig } from './logger.interfaces';

@Injectable({ scope: Scope.TRANSIENT })
export class AppLogger implements LoggerService {
  private logger: winston.Logger;
  private context?: string;

  constructor(@Inject(LOGGER_MODULE_OPTIONS) private options: LoggerConfig) {
    this.logger = this.createLogger();
  }

  setContext(context: string): void {
    this.context = context;
  }

  log(message: any, context?: string): any {
    this.logger.info(this.formatMessage(message, context));
  }

  error(message: any, trace?: string, context?: string): any {
    this.logger.error(this.formatMessage(message, context), { trace });
  }

  warn(message: any, context?: string): any {
    this.logger.warn(this.formatMessage(message, context));
  }

  debug(message: any, context?: string): any {
    this.logger.debug(this.formatMessage(message, context));
  }

  verbose(message: any, context?: string): any {
    this.logger.verbose(this.formatMessage(message, context));
  }

  logWithMetadata(
    message: string,
    metadata: Record<string, any>,
    level: 'info' | 'warn' | 'error' | 'debug' = 'info',
  ): void {
    const formattedMetadata = this.sanitizeMetadata(metadata);
    this.logger[level](message, formattedMetadata);
  }

  private createLogger(): winston.Logger {
    const transports: winston.transport[] = [];

    // Console transport with structured format
    transports.push(
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.timestamp({ format: 'ISO8601_STRING' }),
          winston.format.errors({ stack: true }),
          winston.format.splat(),
          this.options.json !== false
            ? winston.format.json()
            : winston.format.combine(
                winston.format.colorize({
                  all: this.options.colorize !== false,
                }),
                winston.format.printf(
                  ({ timestamp, level, message, context, ...metadata }) => {
                    const ctx = context || this.context || 'Application';
                    const metaStr = Object.keys(metadata).length
                      ? JSON.stringify(metadata, null, 2)
                      : '';
                    return `${timestamp} [${ctx}] ${level}: ${message} ${metaStr}`;
                  },
                ),
              ),
        ),
      }),
    );

    return winston.createLogger({
      level: this.options.level || process.env.LOG_LEVEL || 'info',
      silent: this.options.silent || false,
      transports,
      exitOnError: false,
    });
  }

  private formatMessage(message: any, context?: string): any {
    const ctx = context || this.context;
    return typeof message === 'object' ? JSON.stringify(message) : message;
  }

  private sanitizeMetadata(metadata: Record<string, any>): Record<string, any> {
    const sanitized = { ...metadata };

    // Remove sensitive data
    const sensitiveKeys = [
      'password',
      'token',
      'secret',
      'apiKey',
      'accessToken',
    ];
    sensitiveKeys.forEach((key) => {
      if (sanitized[key]) {
        sanitized[key] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  getChildLogger(context: string): AppLogger {
    const child = new AppLogger(this.options);
    child.setContext(context);
    return child;
  }
}
