import { Logger, LoggerOptionsWithMode } from '@s3-publish/loggers';
import { Planner, Provider, SyncPlannerOptions } from '@s3-publish/core';
import { ProviderOptions } from './ProviderOptions';

export interface CliDelegate {
  /**
   * Return custom `Provider` instance for the given options
   */
  createProvider?(options: ProviderOptions): Provider;

  /**
   * Return custom `Logger` instance for the given options
   */
  createLogger?(options: LoggerOptionsWithMode): Logger;

  /**
   * Return custom `Planner` instance for the given options
   */
  createPlanner?(options: SyncPlannerOptions): Planner;
}
