import { ModuleMetadata } from '@nestjs/common';

export interface LoggerConfig {
  level?: string;
  silent?: boolean;
  colorize?: boolean;
  timestamp?: boolean;
  json?: boolean;
}

export interface LoggerModuleOptions extends LoggerConfig {
  global?: boolean;
}

export interface LoggerModuleAsyncOptions extends Pick<
  ModuleMetadata,
  'imports'
> {
  useFactory: (
    ...args: any[]
  ) => Promise<LoggerModuleOptions> | LoggerModuleOptions;
  inject?: any[];
}
