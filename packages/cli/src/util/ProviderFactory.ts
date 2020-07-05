import { Provider } from '@s3-publish/core';
import { Args, ProviderOptions, ProviderOptionsWithIgnores } from '../types';
import { createIgnoresWithArgs } from './createIgnoresWithArgs';
import { createProvider } from './createProvider';

/** @internal */
export type ProviderFactoryOptions = {
  createProvider(options: ProviderOptions): Provider;
};

/** @internal */
export class ProviderFactory {
  public options: ProviderFactoryOptions;

  constructor(options?: Partial<ProviderFactoryOptions>) {
    this.options = {
      createProvider: options?.createProvider ?? createProvider
    };
  }

  create(options: ProviderOptions): Provider {
    return this.options.createProvider(options);
  }

  createWithArgs(
    key: 'origin' | 'target',
    args: Args,
    options: ProviderOptionsWithIgnores
  ): Provider {
    const { ignorePatterns, ignorePath, ...providerOptions } = options;

    return this.create({
      ignores: createIgnoresWithArgs(key, args, { ignorePatterns, ignorePath }),
      // Merge provider options from options
      ...providerOptions,
      // Allow root to be overridden by command line arg
      root: args[key] || providerOptions.root
    });
  }
}
