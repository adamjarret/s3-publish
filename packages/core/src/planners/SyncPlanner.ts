import pLimit from 'p-limit';
import {
  File,
  FileMap,
  FilePairHandler,
  SkipEvent,
  Planner,
  Provider,
  ProviderOperation,
  PlanOptions,
  Reason
} from '../types';
import { listFiles } from '../util/listFiles';

/** @category Constructor Options */
export type SyncPlannerOptions = {
  /**
   * The object that provides access to the source Files
   */
  origin: Provider;

  /**
   * The object that provides access to the destination Files
   * and creates operations to PUT/COPY/DELETE source files
   */
  target: Provider;

  /**
   * Upload origin files that do not exist in target
   * @default true
   */
  addMissing?: boolean;

  /**
   * - If a function is provided, it should return a Promise that resolves to false if `originFile` has changed
   * - If false is provided, all non-ignored files will be uploaded (assume all files have changed)
   * - If undefined is provided, the default comparator will be used (`ETag` properties must be equal)
   * @default undefined
   */
  compare?: FilePairHandler<Promise<boolean>> | false;

  /**
   * Delete target files that do not exist in origin
   * @default false
   */
  deleteOrphans?: boolean;

  /**
   * The number of analyze jobs to execute in parallel
   * @default 1
   */
  limitCompares?: number | false;

  /**
   * The number of list requests to execute in parallel
   * @default 1
   */
  limitRequests?: number | false;
};

export class SyncPlanner implements Planner {
  protected options: SyncPlannerOptions;

  constructor(options: SyncPlannerOptions) {
    this.options = options;
  }

  /**
   * Analyze files in origin and target and return an array of
   * {@link ProviderOperation} objects that represent the actions needed
   * to sync the origin files to the target
   */
  async plan(options?: PlanOptions): Promise<ProviderOperation[]> {
    const { origin, target, deleteOrphans, limitCompares, limitRequests } = this.options;
    const limit = pLimit(limitCompares || 1);
    const operations: ProviderOperation[] = [];

    // List files in origin and target
    const [{ files: originFiles }, { files: targetFiles }] = await listFiles({
      limitRequests,
      providers: [origin, target],
      onIgnore: options?.onIgnore
    });

    // Analyze origin files
    const analyzeFileJobs: Promise<void>[] = [];

    for (const file of originFiles.values()) {
      analyzeFileJobs.push(
        limit(async () => {
          const operation = await this.analyzeFile(targetFiles, file, options?.onSkip);
          if (operation) {
            operations.push(operation);
          }
        })
      );
    }

    await Promise.all(analyzeFileJobs);

    if (deleteOrphans) {
      // Analyze orphan files (files in target that are not in origin)
      const analyzeOrphanJobs: Promise<void>[] = [];

      for (const file of targetFiles.values()) {
        analyzeOrphanJobs.push(
          limit(async () => {
            operations.push(await target.deleteFile(file));
          })
        );
      }

      await Promise.all(analyzeOrphanJobs);
    }

    return operations;
  }

  protected async analyzeFile(
    targetFiles: FileMap,
    file: File,
    onSkip?: (event: SkipEvent) => void
  ): Promise<ProviderOperation | undefined> {
    const { target, addMissing } = this.options;
    const targetKey = await target.getTargetFileKey(file);
    const targetFile = targetFiles.get(targetKey);

    if (!targetFile) {
      if (addMissing === false) {
        onSkip && onSkip({ file, reason: 'ADD' });
        return undefined;
      }
      return this.actionUpload(file, 'ADD');
    } else {
      // Remove targetKey from targetFiles collection
      targetFiles.delete(targetKey);

      // Compare origin file with target file
      if (await this.compare(file, targetFile)) {
        onSkip && onSkip({ file, targetFile, reason: 'CHANGE' });
      } else {
        return this.actionUpload(file, 'CHANGE');
      }
    }
  }

  protected async actionUpload(file: File, reason: Reason): Promise<ProviderOperation> {
    const { origin, target } = this.options;
    if (origin.protocol === target.protocol) {
      return await target.copyFile(file, reason);
    }
    return await target.putFile(file, reason);
  }

  protected async compare(originFile: File, targetFile: File): Promise<boolean> {
    const { compare } = this.options;
    // When compare is false, all files are assumed to have changed
    if (compare === false) {
      return false;
    }

    // Deffer to compare function if defined
    if (compare && typeof compare === 'function') {
      return await compare(originFile, targetFile);
    }

    const originETag = await originFile.SourceProvider.getFileETag(originFile);
    const targetETag = await targetFile.SourceProvider.getFileETag(targetFile);

    return originETag === targetETag;
  }
}

export default SyncPlanner;
