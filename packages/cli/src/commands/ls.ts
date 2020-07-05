import { File, Provider, ListFilesResult, listFiles } from '@s3-publish/core';
import {
  Logger,
  FileIgnored,
  MessageLsBegin,
  MessageLsResult
} from '@s3-publish/loggers';

/** @category Command Options */
export type LsLogger = Logger<MessageLsBegin | MessageLsResult>;

/** @category Command Options */
export type LsOptions = {
  logger?: LsLogger;

  /**
   * List files in these providers
   */
  providers: Provider[];

  /**
   * If true, calculate ETag (md5 hash) for files (if not already defined)
   * @default false
   */
  calculateETag?: boolean;

  /**
   * Max parallel file list requests
   * @default 1
   */
  limitRequests?: number | false;

  /**
   * If true, list of ignored files is provided to logger
   * @default false
   */
  trackIgnored?: boolean;
};

/**
 * List files in origin, target, and any specified roots
 * @category Command
 */
export async function ls(options: LsOptions): Promise<void> {
  const { logger, trackIgnored, ...rest } = options;
  const ignored: Record<string, FileIgnored[]> = {};
  const ignoredCounts: Record<string, number> = {};

  function onIgnore(file: File): void {
    const { root } = file.SourceProvider;
    if (trackIgnored) {
      if (!ignored[root]) {
        ignored[root] = [];
      }
      ignored[root].push({ type: 'ignore', file });
    }
    if (!ignoredCounts[root]) {
      ignoredCounts[root] = 0;
    }
    ignoredCounts[root]++;
  }

  function onProgress(provider: Provider, result?: ListFilesResult): void {
    if (!result) {
      // Log ls start
      logger?.log({ type: 'ls:begin', provider });
    } else {
      // Log ls result
      const { files, duration } = result;
      logger?.log({
        type: 'ls:result',
        provider,
        files,
        ignored: ignored[provider.root] ?? [],
        ignoredCount: ignoredCounts[provider.root] ?? 0,
        duration
      });
    }
  }

  // List files in each provider
  await listFiles({
    ...rest,
    onIgnore,
    onProgress
  });
}

export default ls;
