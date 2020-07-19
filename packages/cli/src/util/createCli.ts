import { ConfigLoader, Options, Args } from '../types';
import { help, init, ls, sync, version } from '../commands';
import { createLogger } from './createLogger';
import { createPlanner } from './createPlanner';
import { parseArgs } from './parseArgs';
import { ProviderFactory } from './ProviderFactory';

const defaultOptions: Options = {
  limitCompares: 10,
  limitRequests: 3
};

export type CreateCliOptions = {
  /**
   * Function that returns a parsed config file
   * @see {@linkcode createConfigLoader}
   */
  configLoader: ConfigLoader;

  /**
   * Path to s3.config.js template files
   */
  templatePath: string;

  /**
   * Function that returns a parsed Args object
   */
  parseArgs?: (argv: string[]) => Args;

  /**
   * Handle errors
   * @remarks If undefined and an error occurs, process will exit with code that is greater than 0
   */
  handleError?: (error: Error) => void;
};

/**
 * Execute CLI
 */
export async function createCli(options: CreateCliOptions): Promise<void> {
  const args = (options.parseArgs ?? parseArgs)(process.argv.slice(2));
  const { _, cwd, configPath } = args;
  const [commandName, ...roots] = _;

  if (cwd) {
    process.chdir(cwd);
  }

  const { configLoader: loadConfig, templatePath } = options;
  const config = loadConfig(configPath);
  const { origin: oCfg, target: tCfg, compare, delegate, onLog, ...rest } = config;
  const factory = new ProviderFactory(delegate);
  const settings: Options = { ...defaultOptions, ...rest, ...args };
  const logger = (delegate?.createLogger ?? createLogger)({
    onLog,
    showErrorStack: !!process.env.DEBUG,
    showHashes: settings.showHashes,
    showIgnored: settings.showIgnored,
    showSkipped: settings.showSkipped,
    showParams: settings.showParams,
    stream: process.env.MUTE ? null : process.stdout,
    mode: settings.json ? 'json' : 'text'
  });

  try {
    switch (commandName) {
      case 'init':
        await init({
          logger,
          templatePath,
          writePath: args.writePath,
          force: args.force
        });
        break;

      case 'ls': {
        const origin = factory.createWithArgs('origin', args, oCfg);
        const target = factory.createWithArgs('target', args, tCfg);

        await ls({
          logger,
          providers: [
            // List files in origin (unless args.origin is false or root is falsy)
            ...(args.origin === false || !origin.root ? [] : [origin]),
            // List files in target (unless args.target is false or root is falsy)
            ...(args.target === false || !target.root ? [] : [target]),
            // Allow additional roots to be provided as positional arguments
            ...roots.map((root) => factory.create({ root }))
          ],
          // Calculate ETag (md5 hash) for files only when needed (for performance)
          calculateETag: settings.showHashes,
          // Max parallel list files operations
          limitRequests: settings.limitRequests,
          // Keep track of ignored files only when needed (for performance)
          trackIgnored: settings.showIgnored
        });
        break;
      }

      case 'sync': {
        const origin = factory.createWithArgs('origin', args, oCfg);
        const target = factory.createWithArgs('target', args, tCfg);

        await sync({
          logger,
          planner: (delegate?.createPlanner ?? createPlanner)({
            origin,
            target,
            // If a function, it should return a Promise that resolves to false if origin File has changed
            // If false, all non-ignored files will be uploaded (assume all files have changed)
            // If undefined, the default comparator will be used (ETag properties must be equal)
            compare: args.change ? false : compare,
            // If true, upload origin files that do not exist in target
            addMissing: !settings.expect,
            // If true, delete target files that do not exist in origin
            deleteOrphans: settings.delete,
            // Max parallel file compare operations
            limitCompares: settings.limitCompares,
            // Max parallel list files operations
            limitRequests: settings.limitRequests
          }),
          // If true, perform operations without prompting
          // If false, preview operations without performing them or prompting
          // If undefined, prompt to confirm
          proceed: settings.go,
          // Max parallel put/copy/delete operations
          limitRequests: settings.limitRequests,
          // Keep track of ignored files only when needed (for performance)
          trackIgnored: settings.showIgnored,
          // Keep track of skipped files only when needed (for performance)
          trackSkipped: settings.showSkipped
        });
        break;
      }

      case 'version':
        version({ logger });
        break;

      default:
        help();
        break;
    }
  } catch (error) {
    logger.log({ type: 'error', error });
    options.handleError ? options.handleError(error) : process.exit(error.code || 1);
  }
}
