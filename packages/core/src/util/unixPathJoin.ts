import path from 'path';
import { normalizeSeparators } from './normalizeSeparators';

/**
 * Like path.join but uses '/' even on Windows
 * @internal
 */
export function unixPathJoin(...args: string[]): string {
  return normalizeSeparators(path.join(...args));
}
