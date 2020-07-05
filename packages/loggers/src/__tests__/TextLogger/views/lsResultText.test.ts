import chalk from 'chalk';
import { A, B } from '../../__fixtures__/files';
import { lsResultText } from '../../../TextLogger/views/lsResultText';
import { MessageLsResult, LoggableFile } from '../../../types';
import { lsResult } from '../../__constants__/MessageTypes';

describe('lsResult', () => {
  const OLD_ENV = process.env;
  const OLD_CHALK = chalk.level;

  beforeEach(() => {
    jest.resetModules(); // this is important - it clears the cache
    process.env = { ...OLD_ENV };
    chalk.level = OLD_CHALK;
  });

  afterEach(() => {
    process.env = OLD_ENV;
    chalk.level = OLD_CHALK;
  });

  test('lsResult: no color', () => {
    //process.env['FORCE_COLOR'] = '0';
    chalk.level = 0;
    const value: MessageLsResult = {
      type: lsResult,
      provider: { root: './public' },
      files: new Map([
        [A.Key, A],
        [B.Key, B]
      ]),
      ignored: [],
      ignoredCount: 0,
      duration: 122
    };
    const expected = `
# ${process.cwd()}/public
  2020-01-01 03:42:17          122 B      A.txt
  2020-04-01 09:42:17            1 MB     B.txt
# 0 ignored
# 2 files (1 MB)
# Finished in 122ms
`.trim();
    const result = lsResultText(value, {});
    expect(result).toBe(expected);
  });

  test('lsResult: default', () => {
    const value: MessageLsResult = {
      type: lsResult,
      provider: { root: './public' },
      files: new Map([[B.Key, B]]),
      ignored: [],
      ignoredCount: 0,
      duration: 122
    };
    const displayRoot = `# ${process.cwd()}/public`;
    const expected = `
${chalk.bold(displayRoot)}
  2020-04-01 09:42:17            1 MB     B.txt
${chalk.bold('# 0 ignored')}
${chalk.bold('# 1 files (1 MB)')}
${chalk.bold('# Finished in 122ms')}
`.trim();
    const result = lsResultText(value, {});
    expect(result).toBe(expected);
  });

  test('lsResult: default with ignored', () => {
    const value: MessageLsResult = {
      type: lsResult,
      provider: { root: './public' },
      files: new Map([[B.Key, B]]),
      ignored: [
        {
          type: 'ignore',
          file: A
        }
      ],
      ignoredCount: 1,
      duration: 122
    };
    const displayRoot = `# ${process.cwd()}/public`;
    const expected = `
${chalk.bold(displayRoot)}
  2020-04-01 09:42:17            1 MB     B.txt
${chalk.bold('# 1 ignored')}
${chalk.bold('# 1 files (1 MB)')}
${chalk.bold('# Finished in 122ms')}
`.trim();
    const result = lsResultText(value, {});
    expect(result).toBe(expected);
  });

  test('lsResult: showIgnored', () => {
    const value: MessageLsResult = {
      type: lsResult,
      provider: { root: './public' },
      files: new Map([[B.Key, B]]),
      ignored: [
        {
          type: 'ignore',
          file: A
        }
      ],
      ignoredCount: 1,
      duration: 122
    };
    const displayRoot = `# ${process.cwd()}/public`;
    const expected = `
${chalk.bold(displayRoot)}
${chalk.grey('! 2020-01-01 03:42:17          122 B      A.txt')}
  2020-04-01 09:42:17            1 MB     B.txt
${chalk.bold('# 1 ignored')}
${chalk.bold('# 1 files (1 MB)')}
${chalk.bold('# Finished in 122ms')}
`.trim();
    const result = lsResultText(value, { showIgnored: true });
    expect(result).toBe(expected);
  });

  test('lsResult: DATE_FORMAT', () => {
    process.env['DATE_FORMAT'] = 'dd mmm h:MM:ss tt';
    //expect(result).toBe('01 Jan 3:42:17 am');
    const broken: LoggableFile = {
      SourceProvider: { root: './public' },
      Key: 'broken.txt'
    };
    const value: MessageLsResult = {
      type: lsResult,
      provider: { root: './public' },
      files: new Map([
        [B.Key, B],
        [broken.Key, broken]
      ]),
      ignored: [
        {
          type: 'ignore',
          file: A
        }
      ],
      ignoredCount: 1,
      duration: 122
    };
    const displayRoot = `# ${process.cwd()}/public`;
    const expected = `
${chalk.bold(displayRoot)}
${chalk.grey('! 01 Jan 3:42:17 am            122 B      A.txt')}
  01 Apr 9:42:17 am              1 MB     B.txt
                                 0 B      broken.txt
${chalk.bold('# 1 ignored')}
${chalk.bold('# 2 files (1 MB)')}
${chalk.bold('# Finished in 122ms')}
`.trim();
    const result = lsResultText(value, { showIgnored: true });
    expect(result).toBe(expected);
  });

  test('lsResult: PORCELAIN', () => {
    process.env['PORCELAIN'] = '1';
    //expect(result).toBe('01 Jan 3:42:17 am');
    const broken: LoggableFile = {
      SourceProvider: { root: './public' },
      Key: 'broken.txt'
    };
    const value: MessageLsResult = {
      type: lsResult,
      provider: { root: './public' },
      files: new Map([
        [B.Key, B],
        [broken.Key, broken]
      ]),
      ignored: [
        {
          type: 'ignore',
          file: A
        }
      ],
      ignoredCount: 1,
      duration: 122
    };
    const displayRoot = `# ${process.cwd()}/public`;
    const expected = `
${chalk.bold(displayRoot)}
${chalk.grey('! 2020-01-01T08:42:17.000Z             122 B      A.txt')}
  2020-04-01T13:42:17.000Z         1048576 B      B.txt
                                         0 B      broken.txt
${chalk.bold('# 1 ignored')}
${chalk.bold('# 2 files (1048576 B)')}
${chalk.bold('# Finished in 122ms')}
`.trim();
    const result = lsResultText(value, { showIgnored: true });
    expect(result).toBe(expected);
  });

  test('lsResult: showHashes', () => {
    const a = { ...A };
    delete a.ETag;
    const value: MessageLsResult = {
      type: lsResult,
      provider: { root: './public' },
      files: new Map([[B.Key, B]]),
      ignored: [
        {
          type: 'ignore',
          file: a
        }
      ],
      ignoredCount: 1,
      duration: 122
    };
    const displayRoot = `# ${process.cwd()}/public`;
    // prettier-ignore
    const expected = `
${chalk.bold(displayRoot)}
${chalk.grey('!                                     2020-01-01 03:42:17          122 B      A.txt')}
  e4995362f4cbc0c00bea8c662b891e42    2020-04-01 09:42:17            1 MB     B.txt
${chalk.bold('# 1 ignored')}
${chalk.bold('# 1 files (1 MB)')}
${chalk.bold('# Finished in 122ms')}
`.trim();
    const result = lsResultText(value, { showHashes: true, showIgnored: true });
    expect(result).toBe(expected);
  });

  // END describe
});
