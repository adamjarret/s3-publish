import ignore from 'ignore';
import { File, FilePredicate } from '@s3-publish/core';

/**
 * Create a function suitable for usage with {@linkcode ProviderOptions} `ignores`
 *
 * Files matching the given glob patterns will be ignored
 */
export function createIgnores(globPatterns?: string[]): FilePredicate | undefined {
  if (!globPatterns || !globPatterns.length) {
    // Return undefined to ignore no files
    return;
  }

  // Create ignore instance
  const ig = ignore();
  ig.add(globPatterns);

  // Return FilePredicate
  return (file: File): boolean => ig.ignores(file.Key);
}
