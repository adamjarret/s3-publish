import { Planner } from '@s3-publish/core';
import { SyncPlanner, SyncPlannerOptions } from '@s3-publish/core';

/**
 * Return new instance of {@linkcode SyncPlanner}
 */
export function createPlanner(options: SyncPlannerOptions): Planner {
  return new SyncPlanner(options);
}
