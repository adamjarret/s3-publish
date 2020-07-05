import { File, FileMap, Provider } from '@s3-publish/core';
import { Logger, LogMessage, LoggerOptions } from '../types';
import { formatDate, formatDuration, formatSize } from '../util';

export class JsonLogger implements Logger {
  protected options: LoggerOptions;

  /**
   * This function may be passed to `JSON.stringify` as the second parameter
   * when the fist parameter is a {@link LogMessage} object.
   */
  public replacer: (name: string, val: unknown) => unknown | undefined;

  constructor(options?: LoggerOptions) {
    this.options = {
      ...options,
      stream: options?.stream === null ? null : options?.stream ?? process.stdout
    };
    this.replacer = this._replacer.bind(this);
  }

  protected _replacer(name: string, val: unknown): unknown | undefined {
    switch (name) {
      case 'files':
        return [...(val as FileMap).values()].map((file) => this.renderFile(file));

      case 'file':
      case 'targetFile':
        return this.renderFile(val as File);

      case 'duration':
        return formatDuration(val as number);

      case 'ignored':
        return this.options.showIgnored ? val : undefined;

      case 'skipped':
        return this.options.showSkipped ? val : undefined;

      case 'params':
        return this.options.showParams ? val : undefined;

      case 'type':
        // Hide redundant properties
        return val !== 'skip' && val !== 'ignore' ? val : undefined;

      case 'provider':
      case 'SourceProvider':
        return { root: (val as Provider).root };

      case 'error': {
        const error = val as Record<string, unknown>;
        return Object.getOwnPropertyNames(error).reduce<Record<string, unknown>>(
          (agg, key) => {
            if (key !== 'stack' || this.options.showErrorStack) {
              agg[key] = error[key];
            }
            return agg;
          },
          {}
        );
      }

      default:
        return val; // return as is
    }
  }

  protected renderFile(file: File): Record<string, unknown> {
    return {
      ...file,
      LastModified: formatDate(file.LastModified),
      Size: formatSize(file.Size),
      ETag: this.options.showHashes ? file.ETag : undefined
    };
  }

  log(message: LogMessage): void {
    this.options.onLog && this.options.onLog(message);

    switch (message.type) {
      case 'init:result':
        // If wrote is undefined, content was already written to stdout
        if (!message.wrote) {
          return;
        }
        break;
    }

    this.options.stream?.write(JSON.stringify(message, this.replacer, 2) + '\n');
  }
}
