import { Provider } from '@s3-publish/core';
import { FSProvider, FSProviderOptions } from '@s3-publish/provider-fs';
import { S3Provider, S3ProviderOptions, parseS3Root } from '@s3-publish/provider-s3';
import { ProviderOptions } from '../types';

/**
 * Create appropriate `Provider` for given options
 */
export function createProvider(options: ProviderOptions): Provider {
  if (parseS3Root(options.root)) {
    return new S3Provider(options as S3ProviderOptions);
  }

  return new FSProvider(options as FSProviderOptions);
}
