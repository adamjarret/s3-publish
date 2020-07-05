import { Logger, MessageVersion } from '@s3-publish/loggers';
import { packageVersions } from '../constants';

/** @category Command Options */
export type VersionLogger = Logger<MessageVersion>;

/** @category Command Options */
export type VersionOptions = {
  logger?: VersionLogger;
};

/**
 * Display package versions
 * @category Command
 */
export function version(options: VersionOptions): void {
  const { logger } = options;
  logger?.log({ type: 'version', packageVersions });
}

export default version;
