import prettyMs from 'pretty-ms';

/**
 * - If `process.env.PORCELAIN` is set, returns `milliseconds` unchanged
 * - Otherwise, returns a human readable string (ex. "15d 11h 23m 20s")
 * @remarks This is a thin wrapper around {@link https://www.npmjs.com/package/pretty-ms | pretty-ms}
 */
export function formatDuration(milliseconds = 0): string | number {
  return process.env.PORCELAIN ? milliseconds : prettyMs(milliseconds);
}

/**
 * Same as {@linkcode formatDuration} but result is always a string
 * (with "ms" suffix added if needed)
 */
export function formatDurationAsString(milliseconds = 0): string {
  const duration = formatDuration(milliseconds);
  if (typeof duration === 'number') {
    return `${duration}ms`;
  }
  return duration;
}
