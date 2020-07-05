import { FilePairHandler } from '@s3-publish/core';
import { LogMessageHandler } from '@s3-publish/loggers';
import { CliDelegate } from './CliDelegate';
import { Options } from './Options';
import { ProviderOptionsWithIgnores } from './ProviderOptions';

/** Options that may be specified in the config file */
export interface ConfigFile extends Options {
  /**
   * If undefined, CWD is used as the root
   * @category File Provider
   */
  origin: ProviderOptionsWithIgnores;

  /**
   * @category File Provider
   */
  target: ProviderOptionsWithIgnores;

  /**
   * - If a function is provided, it should return a Promise that resolves to false if `originFile` has changed
   * - If false is provided, all non-ignored files will be uploaded (assume all files have changed)
   * - If undefined is provided, the default comparator will be used (`ETag` properties must be equal)
   * @remarks Only relevant to sync command
   * @category sync
   * @default undefined
   */
  compare?: FilePairHandler<Promise<boolean>> | false;

  /**
   * Optionally define a delegate object to override internal CLI implementations
   */
  delegate?: CliDelegate;

  /**
   * If defined, this function is called for each log message
   * @default undefined
   */
  onLog?: LogMessageHandler;

  /**
   * Should always be 2
   */
  schemaVersion: number;
}

/**
 * Loads configuration file at path
 * - If path is falsy, the internal standard config is returned
 * @see {@linkcode createConfigLoader}
 */
export type ConfigLoader = (configPath?: string | null | false) => ConfigFile;
