import dateformat from 'dateformat';

/**
 * - If `date` is falsy, returns undefined
 * - If `process.env.PORCELAIN` is set, returns `date` represented in UTC formatted as ISO 8601
 * - Otherwise, returns `date` represented in local time formatted using `process.env.DATE_FORMAT`
 * (which defaults to "yyyy-mm-dd HH:MM:ss")
 * @see `DATE_FORMAT` {@link https://www.npmjs.com/package/dateformat#mask-options | mask options}
 * @remarks This is a thin wrapper around {@link https://www.npmjs.com/package/dateformat | dateformat}
 */
export function formatDate(date?: Date): string | undefined {
  if (!date) {
    return undefined;
  }
  return process.env.PORCELAIN
    ? date.toISOString()
    : dateformat(date, process.env.DATE_FORMAT || 'yyyy-mm-dd HH:MM:ss');
}
