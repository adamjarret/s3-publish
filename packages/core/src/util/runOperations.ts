import { performance } from 'perf_hooks';
import pLimit from 'p-limit';
import { ProviderOperation, ProviderOperationResult } from '../types';

export type RunOperationsHandler = (
  operation: ProviderOperation,
  result?: ProviderOperationResult
) => void;

export type RunOperationsOptions = {
  /**
   * Operations to run
   */
  operations: ProviderOperation[];

  /**
   * Max parallel operations
   * @default 1
   */
  parallel?: number | false;

  /**
   * Called twice for each operation (before start and after end)
   * @default undefined
   */
  onProgress?: RunOperationsHandler;
};

/**
 * Execute provided operations with start/end progress reporting
 */
export async function runOperations(
  options: RunOperationsOptions
): Promise<ProviderOperationResult[]> {
  const { parallel, operations, onProgress } = options;

  // Throw if no operations
  if (!operations || !operations.length) {
    throw new Error('Nothing to do');
  }

  // Create parallel promise limiter
  const limit = pLimit(parallel || 1);

  // Create operation-to-promise mapper
  const mapper = (operation: ProviderOperation): Promise<ProviderOperationResult> =>
    limit(async () => {
      // Get current time
      const start = performance.now();

      // Report operation progress (start)
      onProgress && onProgress(operation);

      // Execute operation job
      await operation.job();

      // Calculate job duration
      const duration = performance.now() - start;

      // Set result
      const result = { duration };

      // Report operation progress (finish)
      onProgress && onProgress(operation, result);

      // Return result
      return result;
    });

  // Perform all operations
  return await Promise.all(operations.map(mapper));
}
