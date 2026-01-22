import {
  Module,
  Global,
  DynamicModule,
  Provider,
  NestModule,
  MiddlewareConsumer,
  RequestMethod,
} from '@nestjs/common';
import { ModuleMetadata } from '@nestjs/common';
import { AppLogger } from './logger.service';
import { CorrelationIdMiddleware } from './correlation-id.middleware';
import {
  LoggerModuleOptions,
  LoggerModuleAsyncOptions,
} from './logger.interfaces';
import { LOGGER_MODULE_OPTIONS } from './logger.constants';

@Global()
@Module({})
export class LoggerModule implements NestModule {
  private static createLoggerProviders(
    options: LoggerModuleOptions,
  ): Provider[] {
    return [
      {
        provide: AppLogger,
        useValue: new AppLogger(options),
      },
      {
        provide: LOGGER_MODULE_OPTIONS,
        useValue: options,
      },
    ];
  }

  static forRoot(options?: LoggerModuleOptions): DynamicModule {
    const loggerOptions: LoggerModuleOptions = {
      level: process.env.LOG_LEVEL || 'info',
      json: process.env.NODE_ENV === 'production',
      colorize: process.env.NODE_ENV !== 'production',
      timestamp: true,
      ...options,
    };

    return {
      module: LoggerModule,
      providers: [
        ...this.createLoggerProviders(loggerOptions),
        CorrelationIdMiddleware,
      ],
      exports: [AppLogger],
    };
  }

  static forRootAsync(asyncOptions: LoggerModuleAsyncOptions): DynamicModule {
    return {
      module: LoggerModule,
      imports: asyncOptions.imports || [],
      providers: [
        {
          provide: LOGGER_MODULE_OPTIONS,
          useFactory: async (...args: any[]) => {
            const options = await asyncOptions.useFactory(...args);
            return {
              level: process.env.LOG_LEVEL || 'info',
              json: process.env.NODE_ENV === 'production',
              colorize: process.env.NODE_ENV !== 'production',
              timestamp: true,
              ...options,
            };
          },
          inject: asyncOptions.inject || [],
        },
        {
          provide: AppLogger,
          useFactory: (options: LoggerModuleOptions) => new AppLogger(options),
          inject: [LOGGER_MODULE_OPTIONS],
        },
        CorrelationIdMiddleware,
      ],
      exports: [AppLogger],
    };
  }

  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CorrelationIdMiddleware)
      .exclude('/health', '/health/liveness')
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
