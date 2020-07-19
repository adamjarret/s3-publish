import path from 'path';

const reUrl = /^[a-z0-9]+:\/\//;

/**
 * Returns absolute root location
 */
export function formatRoot(root: string): string {
  return !root.match(reUrl) ? path.resolve(process.cwd(), root) : root;
}
