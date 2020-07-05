import chalk from 'chalk';
import { tabStop } from 'twisters';
import { MessageLsResult, LoggableFile, LoggerOptions } from '../../types';
import {
  formatDate,
  formatDurationAsString,
  formatSizeAsString,
  formatRoot,
  compareFileKeys,
  compareKeys
} from '../../util';

const OBJ = {};

/**
 * Return a string representing a MessageLsResult object
 * @category View
 */
export function lsResultText(
  message: MessageLsResult,
  options: Pick<LoggerOptions, 'showHashes' | 'showIgnored'>
): string {
  //
  // Renderers

  /**
   * Return a string representing a listed file
   * @remarks `tabStop` is used (instead of actual tabs) to sidestep a TTY quirk.
   * When Twisters overwrites a line of text, it only clears from the end of the new text
   * to the end of the terminal line (as opposed to clearing the entire line before
   * writing which would cause a flickering effect).
   * When a tab (`\t`) character is written to the stream, the cursor advances without
   * overwriting the text, which can cause garbage text to remain on the line.
   * The `tabStop` function is used to create the illusion of regular tab breaks by
   * inserting the required number of spaces (assumes 8 column tab stop).
   */
  function renderFile(file: LoggableFile, ignored?: boolean): string {
    const { showHashes } = options;
    const { ETag, Key, LastModified, Size } = file;
    const { DATE_FORMAT, PORCELAIN } = process.env;
    const dateFormatLength = DATE_FORMAT ? DATE_FORMAT.length : 22;
    const displayDatePad = PORCELAIN ? 24 : dateFormatLength; // ISO date format is 24 characters long (default format is 22)
    const displayDate = (formatDate(LastModified) ?? '').padEnd(displayDatePad, ' ');
    const displayETag = !showHashes ? '' : (ETag ?? '').padEnd(36, ' '); // ETag hash is 32 characters long
    const displaySize = formatSizeAsString(Size).replace(' B', ' B ').padStart(11, ' ');
    const prefix = ignored ? '! ' : '  ';
    const line = `${prefix}${displayETag}${tabStop([displayDate, displaySize, Key])}`;

    return ignored ? chalk.grey(line) : line;
  }

  //
  // View

  const {
    provider: { root },
    files,
    ignored,
    ignoredCount,
    duration
  } = message;
  const { showIgnored } = options;
  const lines = [chalk.bold(`# ${formatRoot(root)}`)];
  const filesArray = Array.from(files.values()).sort(compareKeys);
  const ignoredArray = showIgnored ? Array.from(ignored).sort(compareFileKeys) : [];
  let size = 0;
  let fileIndex = 0;
  let ignoredIndex = 0;

  // Thanks https://wsvincent.com/javascript-merge-two-sorted-arrays/
  for (let i = 0; i < filesArray.length + ignoredArray.length; i++) {
    const noMoreFiles = fileIndex >= filesArray.length;
    const noMoreIgnored = ignoredIndex >= ignoredArray.length;
    const file = filesArray[fileIndex];
    const { file: ignoredFile } = ignoredArray[ignoredIndex] ?? OBJ;

    if (!noMoreFiles && (noMoreIgnored || compareKeys(file, ignoredFile) < 0)) {
      lines.push(renderFile(file));
      size += file.Size ?? 0;
      fileIndex++;
    } else {
      lines.push(renderFile(ignoredFile, true));
      ignoredIndex++;
    }
  }

  lines.push(chalk.bold(`# ${ignoredCount} ignored`));
  lines.push(chalk.bold(`# ${filesArray.length} files (${formatSizeAsString(size)})`));
  lines.push(chalk.bold(`# Finished in ${formatDurationAsString(duration)}`));

  return lines.join('\n');
}
