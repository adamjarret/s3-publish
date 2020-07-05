import { Args } from '../../types/Args';
import { parseArgs } from '../../util/parseArgs';

const defaultArgs: Args = {
  _: []
};

function argsWithDefaults(args?: Partial<Args>): Args {
  return { ...defaultArgs, ...args };
}

function checkBoolArg(key: string): void {
  const arg = `--${key}`;
  const noArg = `--no-${key}`;
  let args: Args;

  // true
  args = parseArgs([arg]);
  expect(args).toEqual(argsWithDefaults({ [key]: true }));

  // false
  args = parseArgs([noArg]);
  expect(args).toEqual(argsWithDefaults({ [key]: false }));

  // multi
  args = parseArgs([arg, noArg]);
  expect(args).toEqual(argsWithDefaults({ [key]: false }));

  // multi false first
  args = parseArgs([noArg, arg]);
  expect(args).toEqual(argsWithDefaults({ [key]: true }));

  // multi false sandwich
  args = parseArgs([arg, noArg, arg]);
  expect(args).toEqual(argsWithDefaults({ [key]: true }));

  // multi true sandwich
  args = parseArgs([noArg, arg, noArg]);
  expect(args).toEqual(argsWithDefaults({ [key]: false }));

  // extra value
  args = parseArgs([arg, 'VALUE']);
  expect(args).toEqual(argsWithDefaults({ _: ['VALUE'], [key]: true }));

  // multi extra value
  args = parseArgs([arg, 'AAA', arg, 'BBB']);
  expect(args).toEqual(argsWithDefaults({ _: ['AAA', 'BBB'], [key]: true }));
}

function checkBoolShortArg(longKey: string, shortKey: string, value = true) {
  let args: Args;

  // true
  args = parseArgs([`-${shortKey}`]);
  expect(args).toEqual(argsWithDefaults({ [longKey]: value }));

  // extra value
  args = parseArgs([`-${shortKey}`, 'EXTRA']);
  expect(args).toEqual(argsWithDefaults({ _: ['EXTRA'], [longKey]: value }));
}

function checkIntArg(key: string): void {
  const arg = `--${key}`;
  const noArg = `--no-${key}`;
  let args: Args;

  // true
  args = parseArgs([arg]);
  expect(args).toEqual(argsWithDefaults());

  // false
  args = parseArgs([noArg]);
  expect(args).toEqual(argsWithDefaults({ [key]: false }));

  // value
  args = parseArgs([arg, '1']);
  expect(args).toEqual(argsWithDefaults({ [key]: 1 }));

  // invalid value
  args = parseArgs([arg, 'not-a-number']);
  expect(args).toEqual(argsWithDefaults());

  // multi
  args = parseArgs([arg, '1', arg, '2']);
  expect(args).toEqual(argsWithDefaults({ [key]: 2 }));

  // multi false
  args = parseArgs([arg, '3', noArg]);
  expect(args).toEqual(argsWithDefaults({ [key]: false }));

  // multi false first
  args = parseArgs([noArg, arg, '4']);
  expect(args).toEqual(argsWithDefaults({ [key]: 4 }));

  // multi false sandwich
  args = parseArgs([arg, '5', noArg, arg, '6']);
  expect(args).toEqual(argsWithDefaults({ [key]: 6 }));

  // multi value sandwich
  args = parseArgs([noArg, arg, '7', noArg]);
  expect(args).toEqual(argsWithDefaults({ [key]: false }));
}

function checkStringArg(key: string): void {
  const arg = `--${key}`;
  const noArg = `--no-${key}`;
  let args: Args;

  // true
  args = parseArgs([arg]);
  expect(args).toEqual(argsWithDefaults());

  // false
  args = parseArgs([noArg]);
  expect(args).toEqual(argsWithDefaults({ [key]: false }));

  // value
  args = parseArgs([arg, 'VALUE']);
  expect(args).toEqual(argsWithDefaults({ [key]: 'VALUE' }));

  // multi
  args = parseArgs([arg, 'AAA', arg, 'BBB']);
  expect(args).toEqual(argsWithDefaults({ [key]: 'BBB' }));

  // multi false
  args = parseArgs([arg, 'MULTI_FALSE', noArg]);
  expect(args).toEqual(argsWithDefaults({ [key]: false }));

  // multi false first
  args = parseArgs([noArg, arg, 'MULTI_FALSE_FIRST']);
  expect(args).toEqual(argsWithDefaults({ [key]: 'MULTI_FALSE_FIRST' }));

  // multi false sandwich
  args = parseArgs([arg, 'ZZZ', noArg, arg, 'YYY']);
  expect(args).toEqual(argsWithDefaults({ [key]: 'YYY' }));

  // multi value sandwich
  args = parseArgs([noArg, arg, 'VVV', noArg]);
  expect(args).toEqual(argsWithDefaults({ [key]: false }));
}

function checkStringArrayArg(key: string): void {
  const arg = `--${key}`;
  const noArg = `--no-${key}`;
  let args: Args;

  // true
  args = parseArgs([arg]);
  expect(args).toEqual(argsWithDefaults());

  // false
  args = parseArgs([noArg]);
  expect(args).toEqual(argsWithDefaults({ [key]: false }));

  // value
  args = parseArgs([arg, 'VALUE']);
  expect(args).toEqual(argsWithDefaults({ [key]: ['VALUE'] }));

  // multi
  args = parseArgs([arg, 'AAA', arg, 'BBB']);
  expect(args).toEqual(argsWithDefaults({ [key]: ['AAA', 'BBB'] }));

  // multi false
  args = parseArgs([arg, 'MULTI_FALSE', noArg]);
  expect(args).toEqual(argsWithDefaults({ [key]: false }));

  // multi false first
  args = parseArgs([noArg, arg, 'MULTI_FALSE_FIRST']);
  expect(args).toEqual(argsWithDefaults({ [key]: false }));

  // multi false sandwich
  args = parseArgs([arg, 'ZZZ', noArg, arg, 'YYY']);
  expect(args).toEqual(argsWithDefaults({ [key]: false }));

  // multi value sandwich
  args = parseArgs([noArg, arg, 'MULTI_VALUE_SANDWICH', noArg]);
  expect(args).toEqual(argsWithDefaults({ [key]: false }));
}

test('parseArgs: long', () => {
  checkStringArg('configPath');
  checkStringArg('cwd');
  checkStringArg('origin');
  checkStringArg('originIgnorePath');
  checkStringArg('target');
  checkStringArg('targetIgnorePath');
  checkStringArg('writePath');

  checkStringArrayArg('originIgnore');
  checkStringArrayArg('targetIgnore');

  checkIntArg('limitCompares');
  checkIntArg('limitRequests');

  checkBoolArg('change');
  checkBoolArg('delete');
  checkBoolArg('expect');
  checkBoolArg('force');
  checkBoolArg('go');
  checkBoolArg('json');
  checkBoolArg('showHashes');
  checkBoolArg('showIgnored');
  checkBoolArg('showParams');
  checkBoolArg('showSkipped');
});

test('parseArgs: aliases short', () => {
  const args = parseArgs([
    '-C',
    'PATH',
    '-o',
    'ORIGIN',
    '-t',
    'TARGET',
    '-i',
    'ORIGIN_IGNORE',
    '-g',
    'ORIGIN_IGNORE_PATH',
    '-I',
    'TARGET_IGNORE',
    '-G',
    'TARGET_IGNORE_PATH'
  ]);
  expect(args).toEqual(
    argsWithDefaults({
      cwd: 'PATH',
      origin: 'ORIGIN',
      originIgnore: ['ORIGIN_IGNORE'],
      originIgnorePath: 'ORIGIN_IGNORE_PATH',
      target: 'TARGET',
      targetIgnore: ['TARGET_IGNORE'],
      targetIgnorePath: 'TARGET_IGNORE_PATH'
    })
  );

  checkBoolShortArg('change', 'c');
  checkBoolShortArg('delete', 'd');
  checkBoolShortArg('expect', 'e');
  checkBoolShortArg('force', 'f');
  checkBoolShortArg('go', 'n', false);
  checkBoolShortArg('go', 'y');
  checkBoolShortArg('json', 'j');
  checkBoolShortArg('showHashes', 'h');
  checkBoolShortArg('showIgnored', 'x');
  checkBoolShortArg('showParams', 'p');
  checkBoolShortArg('showSkipped', 'v');
});

test('parseArgs: aliases short group (go)', () => {
  const args = parseArgs(['-cdefhjpvxy']);
  expect(args).toEqual(
    argsWithDefaults({
      change: true,
      delete: true,
      expect: true,
      force: true,
      go: true,
      json: true,
      showHashes: true,
      showIgnored: true,
      showParams: true,
      showSkipped: true
    })
  );
});

test('parseArgs: aliases short group (no-go)', () => {
  const args = parseArgs(['-cdefhjpvxn']);
  expect(args).toEqual(
    argsWithDefaults({
      change: true,
      delete: true,
      expect: true,
      force: true,
      go: false,
      json: true,
      showHashes: true,
      showIgnored: true,
      showParams: true,
      showSkipped: true
    })
  );
});

test('parseArgs: aliases kebab', () => {
  let args: Args;

  args = parseArgs([
    '--config-path',
    'CONFIG_PATH',
    '--origin-ignore',
    'ORIGIN_IGNORE',
    '--origin-ignore-path',
    'ORIGIN_IGNORE_PATH',
    '--target-ignore',
    'TARGET_IGNORE',
    '--target-ignore-path',
    'TARGET_IGNORE_PATH',
    '--limit-compares',
    '11',
    '--limit-requests',
    '33'
  ]);
  expect(args).toEqual(
    argsWithDefaults({
      configPath: 'CONFIG_PATH',
      originIgnore: ['ORIGIN_IGNORE'],
      originIgnorePath: 'ORIGIN_IGNORE_PATH',
      targetIgnore: ['TARGET_IGNORE'],
      targetIgnorePath: 'TARGET_IGNORE_PATH',
      limitCompares: 11,
      limitRequests: 33
    })
  );

  args = parseArgs(['--show-ignored']);
  expect(args).toEqual(argsWithDefaults({ showIgnored: true }));

  args = parseArgs(['--show-skipped']);
  expect(args).toEqual(argsWithDefaults({ showSkipped: true }));

  args = parseArgs(['--show-params']);
  expect(args).toEqual(argsWithDefaults({ showParams: true }));

  args = parseArgs(['--show-hashes']);
  expect(args).toEqual(argsWithDefaults({ showHashes: true }));
});

test('parseArgs: aliases other', () => {
  const args = parseArgs(['--config', 'CONFIG', '--write', 'WRITE']);
  expect(args).toEqual(
    argsWithDefaults({
      configPath: 'CONFIG',
      writePath: 'WRITE'
    })
  );
});

test('parseArgs: aliases unknown', () => {
  const args = parseArgs(['--foo', 'BAR']);
  expect(args).toEqual(argsWithDefaults());
});

test('parseArgs: empty array', () => {
  const args = parseArgs([]);
  expect(args).toEqual(argsWithDefaults());
});
