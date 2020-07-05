const slash = '/';
const reBackslash = /\\/g;

/**
 * Normalize Windows path separator (force unix path separator)
 * @internal
 */
export function normalizeSeparators(pathToNormalize: string): string {
  return pathToNormalize.replace(reBackslash, slash);
}
