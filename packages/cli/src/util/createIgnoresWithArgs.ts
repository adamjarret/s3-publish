import { FilePredicate } from '@s3-publish/core';
import { Args, ProviderIgnoresOptions } from '../types';
import { createIgnores } from './createIgnores';
import { loadIgnorePatterns } from './loadIgnorePatterns';

/** @internal */
export function createIgnoresWithArgs(
  key: 'origin' | 'target',
  args: Args,
  options: ProviderIgnoresOptions
): FilePredicate | undefined {
  // Use createIgnores to create an ignores function from glob patterns
  // Note: gitignore syntax allows subsequent patterns to negate previously defined ones
  // so the order of the patterns is significant
  return createIgnores([
    // Include patterns from ignore file (if it exists, it should use .gitignore syntax)
    ...loadIgnorePatterns(
      (key === 'origin' ? args.originIgnorePath : args.targetIgnorePath) ??
        options.ignorePath ??
        `.s3p.${key}.ignore`
    ),
    // Include patterns from options
    ...(options.ignorePatterns || []),
    // Include patterns from args
    ...((key === 'origin' ? args.originIgnore : args.targetIgnore) || [])
  ]);
}
