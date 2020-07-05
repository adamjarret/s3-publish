import {
  Logger,
  LoggerOptionsWithMode,
  JsonLogger,
  TextLogger
} from '@s3-publish/loggers';

/**
 * Create appropriate `Logger` for given options
 */
export function createLogger(options: LoggerOptionsWithMode): Logger {
  const { mode, ...opts } = options;
  return new (mode === 'json' ? JsonLogger : TextLogger)(opts);
}
