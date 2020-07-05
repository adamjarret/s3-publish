import { formatSizeAsString } from '../../util/formatSize';

describe('formatSizeAsString', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules(); // this is important - it clears the cache
    process.env = { ...OLD_ENV };
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  test('no arg', () => {
    const result = formatSizeAsString();
    expect(result).toBe('0 B');
  });

  test('undefined', () => {
    const result = formatSizeAsString(undefined);
    expect(result).toBe('0 B');
  });

  test('B', () => {
    const result = formatSizeAsString(64);
    expect(result).toBe('64 B');
  });

  test('KB', () => {
    const result = formatSizeAsString(1024);
    expect(result).toBe('1 KB');
  });

  test('MB', () => {
    const result = formatSizeAsString(1024 * 1000);
    expect(result).toBe('1000 KB');
  });

  test('MiB', () => {
    const result = formatSizeAsString(1024 * 1024);
    expect(result).toBe('1 MB');
  });

  test('GB', () => {
    const result = formatSizeAsString(1024 * 1000 * 1000);
    expect(result).toBe('976.6 MB');
  });

  test('GiB', () => {
    const result = formatSizeAsString(1024 * 1024 * 1024);
    expect(result).toBe('1 GB');
  });

  test('PORCELAIN: no arg', () => {
    process.env['PORCELAIN'] = '1';
    const result = formatSizeAsString();
    expect(result).toBe('0 B');
  });

  test('PORCELAIN: undefined', () => {
    process.env['PORCELAIN'] = '1';
    const result = formatSizeAsString(undefined);
    expect(result).toBe('0 B');
  });

  test('PORCELAIN: B', () => {
    process.env['PORCELAIN'] = '1';
    const result = formatSizeAsString(64);
    expect(result).toBe('64 B');
  });

  test('PORCELAIN: KiB', () => {
    process.env['PORCELAIN'] = '1';
    const result = formatSizeAsString(1024);
    expect(result).toBe('1024 B');
  });

  test('PORCELAIN: MiB', () => {
    process.env['PORCELAIN'] = '1';
    const result = formatSizeAsString(1024 * 1024);
    expect(result).toBe('1048576 B');
  });

  test('PORCELAIN: GiB', () => {
    process.env['PORCELAIN'] = '1';
    const result = formatSizeAsString(1024 * 1024 * 1024);
    expect(result).toBe('1073741824 B');
  });

  // END describe
});
