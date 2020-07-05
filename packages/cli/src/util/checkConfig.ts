import { ConfigFile } from '../types';

/**
 * Optional function that may be used in config files to enable type checking
 * @see {@link https://adamjarret.github.io/s3-publish/pages/guides/advanced.html#type-checking-config-files | Advanced Usage }
 */
export function checkConfig(config: ConfigFile): ConfigFile {
  return config;
}
