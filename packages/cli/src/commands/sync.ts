import {
  File,
  SkipEvent,
  Planner,
  ProviderOperation,
  ProviderOperationResult,
  runOperations
} from '@s3-publish/core';
import {
  Logger,
  FileIgnored,
  FileSkipped,
  MessageSyncPlanBegin,
  MessageSyncPlanResult,
  MessageSyncOperationBegin,
  MessageSyncOperationResult,
  MessageSyncResult
} from '@s3-publish/loggers';
import { question } from '../util/question';

const isYes = /^[Yy].*$/;

/** @category Command Options */
export type SyncLogger = Logger<
  | MessageSyncPlanBegin
  | MessageSyncPlanResult
  | MessageSyncOperationBegin
  | MessageSyncOperationResult
  | MessageSyncResult
>;

/** @category Command Options */
export type SyncOptions = {
  logger?: SyncLogger;
  planner: Planner;
  /**
   * - If true, perform operations without prompting
   * - If false, preview operations without performing them or prompting
   * - If undefined, prompt to confirm
   */
  proceed?: boolean;
  /**
   * Max parallel put/copy/delete operations
   * @default 1
   */
  limitRequests?: number | false;

  /**
   * If true, list of ignored files is provided to logger
   * @default false
   */
  trackIgnored?: boolean;

  /**
   * If true, list of skipped (unchanged/unexpected) files is provided to logger
   * @default false
   */
  trackSkipped?: boolean;
};

/**
 * Upload changed origin files to target
 * @category Command
 */
export async function sync(options: SyncOptions): Promise<void> {
  const { logger, planner, proceed, limitRequests, trackIgnored, trackSkipped } = options;
  const skipped: FileSkipped[] = [];
  const ignored: Record<string, FileIgnored[]> = {};
  let confirmed: boolean;
  let ignoredCount = 0;
  let skippedCount = 0;
  let totalDuration = 0;

  function onIgnore(file: File): void {
    const { root } = file.SourceProvider;
    if (trackIgnored) {
      if (!ignored[root]) {
        ignored[root] = [];
      }
      ignored[root].push({ type: 'ignore', file });
    }
    ignoredCount++;
  }

  function onSkip(event: SkipEvent): void {
    trackSkipped && skipped.push({ ...event, type: 'skip' });
    skippedCount++;
  }

  function onProgress(
    operation: ProviderOperation,
    result?: ProviderOperationResult
  ): void {
    if (!result) {
      // Log operation (start)
      logger?.log({ type: 'sync:operation:begin', operation });
    } else {
      // Log operation (finish)
      const { duration } = result;
      logger?.log({ type: 'sync:operation:result', operation, duration });
      totalDuration += duration;
    }
  }

  // Log planner start
  logger?.log({ type: 'sync:plan:begin' });

  // Build list of operations
  const operations = await planner.plan({
    onIgnore,
    onSkip
  });

  // Log operations preview
  logger?.log({
    type: 'sync:plan:result',
    operations,
    skipped,
    skippedCount,
    ignored,
    ignoredCount
  });

  // Done if no operations defined
  if (!operations.length) {
    return;
  }

  // Confirm operation
  if (proceed === false || proceed === true) {
    // Skip prompt
    confirmed = proceed;
  } else {
    // Prompt to confirm
    const answer = await question(`Perform ${operations.length} operations? (Y/n):`);
    confirmed = !answer.length || isYes.test(answer);
  }

  // Done if not confirmed
  if (!confirmed) {
    return;
  }

  // Perform all operations
  await runOperations({ operations, onProgress, parallel: limitRequests });

  // Log overall result
  logger?.log({ type: 'sync:result', duration: totalDuration });
}

export default sync;
