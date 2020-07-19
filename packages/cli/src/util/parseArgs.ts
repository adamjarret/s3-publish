import { Args } from '../types';
import walkArgv from 'argv-walk';

/** @internal */
export const aliases: Record<string, string[]> = {
  configPath: ['config-path', 'config'],
  cwd: ['C'],
  json: ['j'],
  origin: ['o'],
  originIgnore: ['i', 'origin-ignore'],
  originIgnorePath: ['g', 'origin-ignore-path'],
  target: ['t'],
  targetIgnore: ['I', 'target-ignore'],
  targetIgnorePath: ['G', 'target-ignore-path'],
  change: ['c'],
  delete: ['d'],
  expect: ['e'],
  go: ['y', 'n'],
  limitCompares: ['s', 'limit-compares'],
  limitRequests: ['l', 'limit-requests'],
  showIgnored: ['x', 'show-ignored'],
  showSkipped: ['v', 'verbose', 'show-skipped'],
  showParams: ['p', 'show-params'],
  showHashes: ['h', 'show-hashes'],
  force: ['f'],
  writePath: ['write']
};

const booleanKeys: string[] = [
  'change',
  'delete',
  'expect',
  'force',
  'go',
  'json',
  'showHashes',
  'showIgnored',
  'showParams',
  'showSkipped'
];

const negativeAliasIndex: Record<string, true> = {
  n: true
};

const aliasIndex = Object.keys(aliases).reduce<Record<string, string>>((agg, key) => {
  aliases[key].forEach((alias) => {
    agg[alias] = key;
  });
  return agg;
}, {});

const booleanKeyIndex: Record<string, true> = {};

const booleanKeysAndAliases = booleanKeys.reduce<string[]>((agg, key) => {
  booleanKeyIndex[key] = true;
  agg.push(key);
  // All boolean keys currently have aliases but the following code works
  // even if aliases[key] is undefined (nothing is added to the array).
  Array.prototype.push.apply(agg, aliases[key]);
  return agg;
}, []);

/** @internal */
export function isNegativeAlias(key: string | null): boolean {
  return !!key && !!negativeAliasIndex[key];
}

/** @internal */
export function isBooleanArg(key: string): boolean {
  return !!key && !!booleanKeyIndex[key];
}

/** @internal */
export function isValidArg(key: string): boolean {
  return !!key && key in aliases;
}

/** @internal */
export function parseArgs(argv: string[]): Args {
  const args: Args & Record<string, unknown> = { _: [] };

  walkArgv(argv, {
    boolean: booleanKeysAndAliases,
    onArg: (arg) => {
      const realKey = aliasIndex[arg.key ?? ''] ?? arg.key;
      const setValue = (value: boolean | number | string | string[]) => {
        if (realKey) {
          args[realKey] = value;
        } else {
          args._.push(value as string);
        }
      };

      switch (realKey) {
        case null:
          setValue(arg.value);
          break;

        case 'limitCompares':
        case 'limitRequests': {
          if (arg.value === true) {
            return;
          }
          if (arg.value === false) {
            setValue(false);
          } else {
            const val = parseInt(arg.value, 10);
            if (!isNaN(val)) {
              setValue(val);
            }
          }
          break;
        }

        case 'originIgnore':
        case 'targetIgnore': {
          const currentValue = args[realKey];
          if (currentValue === false || arg.value === true) {
            return;
          }
          if (arg.value === false) {
            setValue(false);
          } else if (!currentValue) {
            setValue([arg.value]);
          } else {
            currentValue.push(arg.value);
          }
          break;
        }

        default: {
          if (isBooleanArg(realKey)) {
            if (isNegativeAlias(arg.key)) {
              setValue(false);
            } else {
              setValue(!!arg.value);
            }
          } else if (isValidArg(realKey) && arg.value !== true) {
            setValue(arg.value);
          }
          break;
        }
      }
    }
  });

  return args;
}
