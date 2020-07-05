import { performance } from 'perf_hooks';
import pLimit from 'p-limit';
import { FileHandler, FileMap, Provider } from '../types';

export type ListFilesHandler = (provider: Provider, result?: ListFilesResult) => void;

export type ListFilesResult = {
  files: FileMap;

  /**
   * Run time of the request in milliseconds
   */
  duration: number;
};

export type ListFilesOptions = {
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
   * Called for each ignored file
   * @default undefined
   */
  onIgnore?: FileHandler;

  /**
   * Called twice for each provider (before start of list request and after list request finishes)
   * @default undefined
   */
  onProgress?: ListFilesHandler;
};

/**
 * List files in providers with start/end progress reporting
 */
export async function listFiles(options: ListFilesOptions): Promise<ListFilesResult[]> {
  const { providers, limitRequests, calculateETag, onIgnore, onProgress } = options;

  // Throw if no providers
  if (!providers || !providers.length) {
    throw new Error('Nothing to do');
  }

  // Create parallel promise limiter
  const limit = pLimit(limitRequests || 1);

  // Create provider-to-promise mapper
  const mapper = (provider: Provider): Promise<ListFilesResult> =>
    limit(async () => {
      const start = performance.now();

      // Report operation progress (start)
      onProgress && onProgress(provider);

      // List files in provider root
      const files = await provider.listFiles(onIgnore);

      // Calculate ETag (md5 hash) for files (if calculateETag is true)
      if (calculateETag) {
        for (const file of files.values()) {
          // Calling getFileETag updates the ETag property on the provided file if necessary
          await provider.getFileETag(file);
        }
      }

      // Calculate task duration
      const duration = performance.now() - start;

      // Set result
      const result = { files, duration };

      // Report operation progress (finish)
      onProgress && onProgress(provider, result);

      // Return result
      return result;
    });

  // List files in each provider
  return await Promise.all(providers.map(mapper));
}
