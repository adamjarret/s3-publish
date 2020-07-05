import { formatDurationAsString } from '../../util/formatDuration';

const S = 1000;
const M = S * 60;
const H = M * 60;
const D = H * 24;

describe('formatDurationAsString', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules(); // this is important - it clears the cache
    process.env = { ...OLD_ENV };
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  test('no arg', () => {
    const result = formatDurationAsString();
    expect(result).toBe('0ms');
  });

  test('undefined', () => {
    const result = formatDurationAsString(undefined);
    expect(result).toBe('0ms');
  });

  test('ms', () => {
    const result = formatDurationAsString(64);
    expect(result).toBe('64ms');
  });

  test('S', () => {
    const result = formatDurationAsString(S);
    expect(result).toBe('1s');
  });

  test('M', () => {
    const result = formatDurationAsString(M);
    expect(result).toBe('1m');
  });

  test('H', () => {
    const result = formatDurationAsString(H);
    expect(result).toBe('1h');
  });

  test('D', () => {
    const result = formatDurationAsString(D);
    expect(result).toBe('1d');
  });

  test('D + H + M + S', () => {
    const result = formatDurationAsString(D + H + M + S);
    expect(result).toBe('1d 1h 1m 1s');
  });

  test('27H + M + S', () => {
    const result = formatDurationAsString(H * 27 + M + S);
    expect(result).toBe('1d 3h 1m 1s');
  });

  test('367D + H + M + S', () => {
    const result = formatDurationAsString(D * 367 + H + M + S);
    expect(result).toBe('1y 2d 1h 1m 1s');
  });

  test('100Y + D + H + M + S', () => {
    const result = formatDurationAsString(D * 365 * 100 + D + H + M + S);
    expect(result).toBe('100y 1d 1h 1m 1s');
  });

  test('100Y + H + M + S', () => {
    const result = formatDurationAsString(D * 365 * 100 + H + M + S);
    expect(result).toBe('100y 1h 1m 1s');
  });

  test('S + 349', () => {
    const result = formatDurationAsString(S + 349);
    expect(result).toBe('1.3s');
  });

  test('S + 350', () => {
    // pretty-ms always rounds down as of version 7.0.0
    //  see https://github.com/sindresorhus/pretty-ms/releases/tag/v7.0.0
    const result = formatDurationAsString(S + 350);
    expect(result).toBe('1.3s');
  });

  test('PORCELAIN: no arg', () => {
    process.env['PORCELAIN'] = '1';
    const result = formatDurationAsString();
    expect(result).toBe('0ms');
  });

  test('PORCELAIN: undefined', () => {
    process.env['PORCELAIN'] = '1';
    const result = formatDurationAsString(undefined);
    expect(result).toBe('0ms');
  });

  test('PORCELAIN: ms', () => {
    process.env['PORCELAIN'] = '1';
    const result = formatDurationAsString(64);
    expect(result).toBe('64ms');
  });

  test('PORCELAIN: S', () => {
    process.env['PORCELAIN'] = '1';
    const result = formatDurationAsString(S);
    expect(result).toBe(S + 'ms');
  });

  test('PORCELAIN: M', () => {
    process.env['PORCELAIN'] = '1';
    const result = formatDurationAsString(M);
    expect(result).toBe(M + 'ms');
  });

  test('PORCELAIN: H', () => {
    process.env['PORCELAIN'] = '1';
    const result = formatDurationAsString(H);
    expect(result).toBe(H + 'ms');
  });

  test('PORCELAIN: D', () => {
    process.env['PORCELAIN'] = '1';
    const result = formatDurationAsString(D);
    expect(result).toBe(D + 'ms');
  });

  test('PORCELAIN: D + H + M + S', () => {
    process.env['PORCELAIN'] = '1';
    const result = formatDurationAsString(D + H + M + S);
    expect(result).toBe(D + H + M + S + 'ms');
  });

  test('PORCELAIN: 27H + M + S', () => {
    process.env['PORCELAIN'] = '1';
    const result = formatDurationAsString(H * 27 + M + S);
    expect(result).toBe(H * 27 + M + S + 'ms');
  });

  test('PORCELAIN: 367D + H + M + S', () => {
    process.env['PORCELAIN'] = '1';
    const result = formatDurationAsString(D * 367 + H + M + S);
    expect(result).toBe(D * 367 + H + M + S + 'ms');
  });

  test('PORCELAIN: 100Y + D + H + M + S', () => {
    process.env['PORCELAIN'] = '1';
    const result = formatDurationAsString(D * 365 * 100 + D + H + M + S);
    expect(result).toBe(D * 365 * 100 + D + H + M + S + 'ms');
  });

  test('PORCELAIN: 100Y + H + M + S', () => {
    process.env['PORCELAIN'] = '1';
    const result = formatDurationAsString(D * 365 * 100 + H + M + S);
    expect(result).toBe(D * 365 * 100 + H + M + S + 'ms');
  });

  test('PORCELAIN: S + 349', () => {
    process.env['PORCELAIN'] = '1';
    const result = formatDurationAsString(S + 349);
    expect(result).toBe('1349ms');
  });

  test('PORCELAIN: S + 350', () => {
    process.env['PORCELAIN'] = '1';
    const result = formatDurationAsString(S + 350);
    expect(result).toBe('1350ms');
  });

  // END describe
});
