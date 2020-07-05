import filesize from 'filesize';

/**
 * - If `process.env.PORCELAIN` is set, returns `sizeInBytes` unchanged
 * - Otherwise, returns a human readable string (ex. "42 KB")
 * @remarks This is a thin wrapper around {@link https://www.npmjs.com/package/filesize | filesize}
 */
export function formatSize(sizeInBytes = 0): string | number {
  return process.env.PORCELAIN ? sizeInBytes : filesize(sizeInBytes, { round: 1 });
}

/**
 * Same as {@linkcode formatSize} but result is always a string
 * (with " B" suffix added if needed)
 */
export function formatSizeAsString(sizeInBytes = 0): string {
  const size = formatSize(sizeInBytes);
  if (typeof size === 'number') {
    return `${size} B`;
  }
  return size;
}
