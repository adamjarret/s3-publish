import chalk from 'chalk';
import Twisters, {
  LineBuffer,
  Message as TwistersMessage,
  defaultRender,
  terminalSupportsUnicode
} from 'twisters';
import {
  Logger,
  LoggerOptions,
  LoggableOperation,
  LogMessage,
  MessageError
} from '../types';
import { assertNever, formatDurationAsString, formatRoot } from '../util';
import { lsResultText, syncPlanResultText } from './views';

/** @internal */
export type Meta = {
  status?: 'success' | 'fail';
};

/** @internal */
export type WriteOptions = Partial<TwistersMessage<Meta>> & {
  name: string;
};

// Styled message prefixes
const isUniOk = terminalSupportsUnicode();
const prefixes = {
  success: chalk.green(isUniOk ? '✓' : '√'),
  fail: chalk.red(isUniOk ? '✖' : '×'),
  next: isUniOk ? '↩' : ''
};
const messageDefaults: Partial<TwistersMessage<Meta>> = {
  render: (message, frame) => {
    // If frame is null, the line buffer is disabled.
    if (message.meta?.status === 'success') {
      const prefix = frame === null ? 'FINISHED' : prefixes.success;
      message.text = `${prefix} ${message.text}`;
    }
    if (frame === null) {
      return `[${new Date().toISOString()}]${
        message.text.indexOf('\n') >= 0 ? ` ${prefixes.next}\n` : ' '
      }${message.text}`;
    }
    return defaultRender(message, frame);
  }
};

export class TextLogger implements Logger {
  private twisters: Twisters<Meta>;
  protected options: LoggerOptions;

  constructor(options?: LoggerOptions) {
    const stream: NodeJS.WriteStream | null =
      options?.stream === null
        ? null
        : (options?.stream as NodeJS.WriteStream) ?? process.stdout;

    this.options = {
      ...options,
      stream
    };

    this.twisters = new Twisters<Meta>({
      messageDefaults,
      pinActive: true,
      buffer: new LineBuffer({
        handleSigint: process.env.NODE_ENV !== 'test',
        stream
      })
    });
  }

  public log(message: LogMessage): void {
    this.options.onLog && this.options.onLog(message);

    switch (message.type) {
      case 'init:result': {
        // If wrote is undefined, content was already written to stream
        const { wrote } = message;
        wrote && this.write(`Wrote ${wrote}`);
        break;
      }

      case 'ls:begin': {
        const { root } = message.provider;
        this.write(`Listing ${formatRoot(root)}`, {
          name: `list-${root}`,
          active: true
        });
        break;
      }

      case 'ls:result': {
        const { root } = message.provider;
        this.write(lsResultText(message, this.options), {
          name: `list-${root}`,
          active: false
        });
        break;
      }

      case 'sync:plan:begin':
        this.write('Planning', {
          name: 'plan',
          active: true
        });
        break;

      case 'sync:plan:result':
        this.write(syncPlanResultText(message, this.options), {
          name: 'plan',
          active: false
        });
        break;

      case 'sync:operation:begin': {
        const { operation } = message;
        this.write(`${operation?.type} ${operation?.file.Key}`, {
          name: this.getSpinnerKey(message.operation),
          active: true
        });
        break;
      }

      case 'sync:operation:result': {
        const { operation, duration } = message;
        const elapsed = formatDurationAsString(duration);
        this.write(`${operation?.type} ${operation?.file.Key} (${elapsed})`, {
          name: this.getSpinnerKey(message.operation),
          active: false,
          meta: { status: 'success' }
        });
        break;
      }

      case 'sync:result': {
        const { duration } = message;
        this.write(chalk.bold(`# Finished in ${formatDurationAsString(duration)}`));
        break;
      }

      case 'error':
        return this.error(message);

      case 'version': {
        const { packageVersions } = message;
        Object.keys(packageVersions).forEach((key: string): void => {
          console.log(key, packageVersions[key]);
        });
        break;
      }

      default:
        // Error here if there are missing cases
        //  Thanks https://www.typescriptlang.org/docs/handbook/advanced-types.html#exhaustiveness-checking
        return assertNever(message);
    }
  }

  protected write(text: string, options?: WriteOptions): void {
    if (options) {
      const { name, ...rest } = options;
      this.twisters.put(name, { text, ...rest });
    } else {
      this.twisters.put(text, { active: false });
    }
  }

  protected error(message: MessageError): void {
    const { error } = message;
    this.twisters.forEachMessage((message, name) => this.twisters.remove(name));

    this.write(error.message);

    if (error.stack && this.options.showErrorStack) {
      this.write(error.stack);
    }
  }

  protected getSpinnerKey(operation: LoggableOperation): string {
    return `${operation?.file.Key}`;
  }
}
