import { File, Provider, ProviderOperation, Reason } from '@s3-publish/core';

export type LoggableProvider = Pick<Provider, 'root'>;

export type LoggableFile = Omit<File, 'SourceProvider'> & {
  SourceProvider: LoggableProvider;
};

export type LoggableFileMap = Map<string, LoggableFile>;

export type LoggableOperation = Omit<ProviderOperation, 'file'> & {
  file: LoggableFile;
};

export type FileSkipped = {
  type: 'skip';
  file: LoggableFile;
  targetFile?: LoggableFile;
  reason: Reason;
};

export type FileIgnored = {
  type: 'ignore';
  file: LoggableFile;
};

/** @category Message */
export type MessageInitResult = {
  type: 'init:result';

  /**
   * Path to output file (undefined if output to stdout)
   */
  wrote?: string;
};

/** @category Message */
export type MessageLsBegin = {
  type: 'ls:begin';
  provider: LoggableProvider;
};

/** @category Message */
export type MessageLsResult = {
  type: 'ls:result';
  provider: LoggableProvider;
  files: LoggableFileMap;
  ignored: FileIgnored[];
  ignoredCount: number;

  /**
   * Time elapsed during request (in ms)
   */
  duration: number;
};

/** @category Message */
export type MessageSyncPlanBegin = {
  type: 'sync:plan:begin';
};

/** @category Message */
export type MessageSyncPlanResult = {
  type: 'sync:plan:result';
  operations: LoggableOperation[];
  skipped: FileSkipped[];
  skippedCount: number;
  ignored: Record<string, FileIgnored[]>;
  ignoredCount: number;
};

/** @category Message */
export type MessageSyncOperationBegin = {
  type: 'sync:operation:begin';
  operation: LoggableOperation;
};

/** @category Message */
export type MessageSyncOperationResult = {
  type: 'sync:operation:result';
  operation: LoggableOperation;

  /**
   * Time elapsed during operation (in ms)
   */
  duration: number;
};

/** @category Message */
export type MessageSyncResult = {
  type: 'sync:result';

  /**
   * Time elapsed during all operations (in ms)
   */
  duration: number;
};

/** @category Message */
export type MessageVersion = {
  type: 'version';
  packageVersions: Record<string, string>;
};

/** @category Message */
export type MessageError = {
  type: 'error';
  error: Error;
};

/** @category Message */
export type LogMessage =
  | MessageInitResult
  | MessageLsBegin
  | MessageLsResult
  | MessageSyncPlanBegin
  | MessageSyncPlanResult
  | MessageSyncOperationBegin
  | MessageSyncOperationResult
  | MessageSyncResult
  | MessageVersion
  | MessageError;

/**
 * Handle log messages
 * @typeParam M  Message type
 * <dl class="tsd-comment-tags">
 *   <dt>default</dt>
 *	 <dd><p>{@linkcode LogMessage}</p></dd>
 * </dl>
 */
export interface Logger<M = LogMessage> {
  log(message: M): void;
}
