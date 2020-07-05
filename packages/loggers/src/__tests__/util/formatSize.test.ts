import { formatSize } from '../../util/formatSize';

describe('formatSize', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules(); // this is important - it clears the cache
    process.env = { ...OLD_ENV };
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  test('no arg', () => {
    const result = formatSize();
    expect(result).toBe('0 B');
  });

  test('undefined', () => {
    const result = formatSize(undefined);
    expect(result).toBe('0 B');
  });

  test('B', () => {
    const result = formatSize(64);
    expect(result).toBe('64 B');
  });

  test('KiB', () => {
    const result = formatSize(1024);
    expect(result).toBe('1 KB');
  });

  test('MB', () => {
    const result = formatSize(1024 * 1000);
    expect(result).toBe('1000 KB');
  });

  test('MiB', () => {
    const result = formatSize(1024 * 1024);
    expect(result).toBe('1 MB');
  });

  test('GB', () => {
    const result = formatSize(1024 * 1000 * 1000);
    expect(result).toBe('976.6 MB');
  });

  test('GiB', () => {
    const result = formatSize(1024 * 1024 * 1024);
    expect(result).toBe('1 GB');
  });

  test('PORCELAIN: no arg', () => {
    process.env['PORCELAIN'] = '1';
    const result = formatSize();
    expect(result).toBe(0);
  });

  test('PORCELAIN: undefined', () => {
    process.env['PORCELAIN'] = '1';
    const result = formatSize(undefined);
    expect(result).toBe(0);
  });

  test('PORCELAIN: B', () => {
    process.env['PORCELAIN'] = '1';
    const result = formatSize(64);
    expect(result).toBe(64);
  });

  test('PORCELAIN: KiB', () => {
    process.env['PORCELAIN'] = '1';
    const result = formatSize(1024);
    expect(result).toBe(1024);
  });

  test('PORCELAIN: MiB', () => {
    process.env['PORCELAIN'] = '1';
    const result = formatSize(1024 * 1024);
    expect(result).toBe(1048576);
  });

  test('PORCELAIN: GiB', () => {
    process.env['PORCELAIN'] = '1';
    const result = formatSize(1024 * 1024 * 1024);
    expect(result).toBe(1073741824);
  });

  // END describe
});
