import fs from 'fs';
import path from 'path';
import { defaultConfigPath } from '../constants';
import { ConfigLoader } from '../types';

/**
 * Returns a function that will load a config file when invoked
 * @param req Standard NodeJS require function
 * @remarks The req function will be used to the load config file (if it exists).
 * Without this dependency injection, require cannot be used to load the config file
 * if the CLI has been bundled with webpack.
 * @example `const configLoader = createConfigLoader(require);`
 */
export function createConfigLoader(req: NodeJS.Require): ConfigLoader {
  return (configPath = defaultConfigPath) => {
    if (configPath) {
      const absConfigPath = path.resolve(process.cwd(), configPath);

      if (fs.existsSync(absConfigPath)) {
        // Use req to support loading external files when this code is bundled with webpack
        const config = req(absConfigPath);

        if (config.schemaVersion !== 2) {
          throw new Error(
            `Unsupported config schema defined in ${absConfigPath} - schemaVersion must be 2`
          );
        }

        return config;
      }
    }

    // Load internal config using standard require (not req) so default config is included in webpack bundle
    return require('../../config/s3p.config');
  };
}
