import { FSProviderOptions } from '@s3-publish/provider-fs';
import { S3ProviderOptions } from '@s3-publish/provider-s3';

export type ProviderOptions = FSProviderOptions | S3ProviderOptions;

export type ProviderIgnoresOptions = {
  /**
   * Glob patterns to ignore
   */
  ignorePatterns?: string[];

  /**
   * Path to .ignore file (glob patterns will be loaded from this file if it exists)
   * - If false or empty, no file will be loaded (unless specified with arg)
   * @default .s3p.origin.ignore or .s3p.target.ignore
   */
  ignorePath?: string | false;
};

export type ProviderOptionsWithIgnores = ProviderOptions & ProviderIgnoresOptions;
