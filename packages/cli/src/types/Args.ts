import { Options } from './Options';
/**
 * Options that may be specified as command line arguments
 */
export interface Args extends Options {
  /**
   * Positional arguments (first one is interpreted as the command)
   * - ls: subsequent values are interpreted as additional provider roots
   * - sync: subsequent values are ignored
   * @default []
   */
  _: string[];

  /**
   * Load config from this file path
   * @default .s3p.config.js
   */
  configPath?: string | false;

  /**
   * Explicitly set current working directory
   * @default undefined
   */
  cwd?: string | false;

  /**
   * Origin root
   * @default process.cwd()
   * @category File Provider
   */
  origin?: string | false;

  /**
   * Glob patterns used to ignore origin files (should use [.gitignore syntax](https://git-scm.com/docs/gitignore))
   * @remarks Specify multiple patterns like this: `s3p sync -i '.*' -i 'node_modules/'`
   * @category File Provider
   * @default undefined
   */
  originIgnore?: string[] | false;

  /**
   * Path to file containing glob patterns that should be used to ignore origin files (should use [.gitignore syntax](https://git-scm.com/docs/gitignore))
   * @remarks If file does not exist, no origin files are ignored
   * @category File Provider
   * @default .s3p.origin.ignore
   */
  originIgnorePath?: string | false;

  /**
   * Target root
   * @category File Provider
   * @default undefined
   */
  target?: string | false;

  /**
   * Glob patterns used to ignore target files (should use [.gitignore syntax](https://git-scm.com/docs/gitignore))
   * @remarks Specify multiple patterns like this: `s3p sync -I '.*' -I 'node_modules/'`
   * @category File Provider
   * @default undefined
   */
  targetIgnore?: string[] | false;

  /**
   * Path to file containing glob patterns that should be used to ignore target files (should use [.gitignore syntax](https://git-scm.com/docs/gitignore))
   * @remarks If file does not exist, no target files are ignored
   * @category File Provider
   * @default .s3p.target.ignore
   */
  targetIgnorePath?: string | false;

  /**
   * If true, upload non-ignored origin files even if unchanged
   * @remarks Only relevant to sync command
   * @category sync
   * @default false
   */
  change?: boolean;

  /**
   * If true, overwrite config file if it exists
   * @remarks Only relevant to init command
   * @category init
   * @default false
   */
  force?: boolean;

  /**
   * Path to output file
   * @remarks Only relevant to init command
   * @category init
   * @default false
   */
  writePath?: string;
}
