import chalk from 'chalk';
import {
  MessageSyncPlanResult,
  LoggableOperation,
  LoggerOptions,
  FileSkipped
} from '../../types';
import { formatSizeAsString, formatRoot, compareFileKeys } from '../../util';

/**
 * Return a string representing a MessageSyncPlanResult object
 * @category View
 */
export function syncPlanResultText(
  message: MessageSyncPlanResult,
  options: Pick<LoggerOptions, 'showIgnored' | 'showParams' | 'showSkipped'>
): string {
  //
  // Renderers

  function renderOperationParams(operation: LoggableOperation): string | undefined {
    if (operation.params && options.showParams) {
      const text = `${operation.type} ${JSON.stringify(operation.params, null, 2)}`;

      return chalk.bgWhiteBright(text);
    }
  }

  function renderOperation(operation: LoggableOperation): string {
    switch (operation.type) {
      case 'COPY':
      case 'PUT': {
        const params = renderOperationParams(operation);
        const key = operation.file.Key;
        const size = formatSizeAsString(operation.file.Size);
        const isAdd = operation.reason === 'ADD';
        const symbol = isAdd ? '+' : '%';
        const style = chalk.keyword(isAdd ? 'green' : 'blue');

        return style(`${symbol} ${key} (${size})`) + (params ? `\n${params}` : '');
      }
      case 'DELETE': {
        const params = renderOperationParams(operation);
        const key = operation.file.Key;

        return chalk.red(`- ${key}`) + (params ? `\n${params}` : '');
      }
    }
  }

  function renderSkipped(operation: FileSkipped): string {
    return `${operation.reason === 'ADD' ? '?' : '='} ${operation.file.Key}`;
  }

  //
  // View

  const { operations, ignored, ignoredCount, skipped, skippedCount } = message;
  const lines: string[] = [];
  let size = 0;

  if (options.showIgnored) {
    Object.keys(ignored).forEach((root) => {
      if (!ignored[root].length) {
        return;
      }
      lines.push(chalk.grey(chalk.bold(`# Ignored in ${formatRoot(root)}`)));
      ignored[root].sort(compareFileKeys).forEach(({ file }) => {
        lines.push(chalk.grey(`! ${file.Key}`));
      });
    });
  }

  lines.push(chalk.bold('# Plan'));

  [...operations, ...(options.showSkipped ? skipped : [])]
    .sort(compareFileKeys)
    .forEach((operation) => {
      // Handle SkipMessage
      if (operation.type === 'skip') {
        return lines.push(renderSkipped(operation));
      }
      // Handle ProviderOperation
      if (operation.type === 'PUT' || operation.type === 'COPY') {
        size += operation.file.Size ?? 0;
      }
      return lines.push(renderOperation(operation));
    });

  const totalSize = formatSizeAsString(size);

  lines.push(chalk.bold(`# ${ignoredCount} ignored`));
  lines.push(chalk.bold(`# ${skippedCount} skipped`));
  lines.push(chalk.bold(`# ${operations.length} operations (${totalSize} to transfer)`));

  if (!operations.length) {
    lines.push('Nothing to do');
  }

  return lines.join('\n');
}
