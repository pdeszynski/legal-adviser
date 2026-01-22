import { AppLogger } from './logger.service';

export const getLogger = (context: string): AppLogger => {
  const logger = new AppLogger({});
  logger.setContext(context);
  return logger;
};
