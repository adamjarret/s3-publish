/**
 * Returns absolute root location
 */
export function formatRoot(root: string): string {
  return root.replace(/^\./, process.cwd());
}
