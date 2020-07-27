/**
 * Options that may be specified in the config file or as command line arguments
 * (command line arguments take precedence)
 */
export interface Options {
  /**
   * If true, delete target files that do not exist in origin
   * @remarks Only relevant to sync command
   * @category sync
   * @default false
   */
  delete?: boolean;

  /**
   * If true, only upload origin files that already exist in target
   * @remarks Only relevant to sync command
   * @category sync
   * @default true
   */
  expect?: boolean;

  /**
   * - If true, preview and perform operations without prompting (`-y`, `--go`)
   * - If false, preview operations without performing them or prompting (`-n`, `--no-go`)
   * - If undefined, preview operations and prompt to confirm before performing
   * @remarks Only relevant to sync command
   * @category sync
   * @default undefined
   */
  go?: boolean;

  /**
   * Render output as JSON
   * @default false
   */
  json?: boolean;

  /**
   * Max parallel file compare operations
   * @remarks Only relevant to sync command
   * @category sync
   * @default 10
   */
  limitCompares?: number | false;

  /**
   * Max parallel list/put/copy/delete operations
   * @default 3
   */
  limitRequests?: number | false;

  /**
   * If true, display ETag property for File(s)
   * @remarks No effect on sync command when `--json` is false
   * @default false
   */
  showHashes?: boolean;

  /**
   * If true, display ignored files
   * @default false
   */
  showIgnored?: boolean;

  /**
   * If true, display operation request parameters
   * @remarks Only relevant to sync command
   * @category sync
   * @default false
   */
  showParams?: boolean;

  /**
   * If true, display skipped (unchanged/unexpected) files
   * @remarks Only relevant to sync command
   * @category sync
   * @default false
   */
  showSkipped?: boolean;
}
