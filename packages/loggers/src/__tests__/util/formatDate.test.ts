import { formatDate } from '../../util/formatDate';

describe('formatDate', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules(); // this is important - it clears the cache
    process.env = { ...OLD_ENV };
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  test('no arg', () => {
    const result = formatDate();
    expect(result).toBe(undefined);
  });

  test('undefined', () => {
    const result = formatDate(undefined);
    expect(result).toBe(undefined);
  });

  test('2020-01-01T00:00:00', () => {
    const result = formatDate(new Date('2020-01-01T00:00:00'));
    expect(result).toBe('2020-01-01 00:00:00');
  });

  test('PORCELAIN: 2020-01-01T00:00:00Z', () => {
    process.env['PORCELAIN'] = '1';
    const result = formatDate(new Date('2020-01-01T00:00:00Z'));
    expect(result).toBe('2020-01-01T00:00:00.000Z');
  });

  test('DATE_FORMAT: 2020-01-01T03:42:17', () => {
    process.env['DATE_FORMAT'] = 'dd mmm h:MM:ss tt';
    const result = formatDate(new Date('2020-01-01T03:42:17'));
    expect(result).toBe('01 Jan 3:42:17 am');
  });

  test('DATE_FORMAT + PORCELAIN: 2020-01-01T00:00:00Z', () => {
    process.env['DATE_FORMAT'] = 'dd mmm h:MM:ss tt';
    process.env['PORCELAIN'] = '1';
    const result = formatDate(new Date('2020-01-01T00:00:00Z'));
    expect(result).toBe('2020-01-01T00:00:00.000Z');
  });

  // END describe
});
