import { Writable } from 'stream';
import { LogMessage } from './Logger';

export type LogMessageHandler = (message: LogMessage) => void;

/** @category Constructor Options */
export type LoggerOptions = {
  /**
   * If defined, this function is called for each log message
   * @default undefined
   */
  onLog?: LogMessageHandler;

  /**
   * Show Error stacktrace
   * @default false
   */
  showErrorStack?: boolean;

  /**
   * Show ignored files (both in origin and target)
   * @default false
   */
  showIgnored?: boolean;

  /**
   * Show skipped (unchanged/unexpected) files
   * @default false
   */
  showSkipped?: boolean;

  /**
   * Show request parameters
   * @default false
   */
  showParams?: boolean;

  /**
   * Show File ETag property
   * @default false
   */
  showHashes?: boolean;

  /**
   * @see {@link https://nodejs.org/api/stream.html#stream_class_stream_writable | Writable}
   * @default process.stdout
   * @remarks If null, nothing will be output
   */
  stream?: Writable | null;
};

export type LoggerOptionsWithMode = LoggerOptions & { mode: 'json' | 'text' };
