import { formatDuration } from '../../util/formatDuration';

const S = 1000;
const M = S * 60;
const H = M * 60;
const D = H * 24;

describe('formatDuration', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules(); // this is important - it clears the cache
    process.env = { ...OLD_ENV };
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  test('no arg', () => {
    const result = formatDuration();
    expect(result).toBe('0ms');
  });

  test('undefined', () => {
    const result = formatDuration(undefined);
    expect(result).toBe('0ms');
  });

  test('ms', () => {
    const result = formatDuration(64);
    expect(result).toBe('64ms');
  });

  test('S', () => {
    const result = formatDuration(S);
    expect(result).toBe('1s');
  });

  test('M', () => {
    const result = formatDuration(M);
    expect(result).toBe('1m');
  });

  test('H', () => {
    const result = formatDuration(H);
    expect(result).toBe('1h');
  });

  test('D', () => {
    const result = formatDuration(D);
    expect(result).toBe('1d');
  });

  test('D + H + M + S', () => {
    const result = formatDuration(D + H + M + S);
    expect(result).toBe('1d 1h 1m 1s');
  });

  test('27H + M + S', () => {
    const result = formatDuration(H * 27 + M + S);
    expect(result).toBe('1d 3h 1m 1s');
  });

  test('367D + H + M + S', () => {
    const result = formatDuration(D * 367 + H + M + S);
    expect(result).toBe('1y 2d 1h 1m 1s');
  });

  test('100Y + D + H + M + S', () => {
    const result = formatDuration(D * 365 * 100 + D + H + M + S);
    expect(result).toBe('100y 1d 1h 1m 1s');
  });

  test('100Y + H + M + S', () => {
    const result = formatDuration(D * 365 * 100 + H + M + S);
    expect(result).toBe('100y 1h 1m 1s');
  });

  test('S + 349', () => {
    const result = formatDuration(S + 349);
    expect(result).toBe('1.3s');
  });

  test('S + 350', () => {
    // pretty-ms always rounds down as of version 7.0.0
    //  see https://github.com/sindresorhus/pretty-ms/releases/tag/v7.0.0
    const result = formatDuration(S + 350);
    expect(result).toBe('1.3s');
  });

  test('PORCELAIN: no arg', () => {
    process.env['PORCELAIN'] = '1';
    const result = formatDuration();
    expect(result).toBe(0);
  });

  test('PORCELAIN: undefined', () => {
    process.env['PORCELAIN'] = '1';
    const result = formatDuration(undefined);
    expect(result).toBe(0);
  });

  test('PORCELAIN: ms', () => {
    process.env['PORCELAIN'] = '1';
    const result = formatDuration(64);
    expect(result).toBe(64);
  });

  test('PORCELAIN: S', () => {
    process.env['PORCELAIN'] = '1';
    const result = formatDuration(S);
    expect(result).toBe(S);
  });

  test('PORCELAIN: M', () => {
    process.env['PORCELAIN'] = '1';
    const result = formatDuration(M);
    expect(result).toBe(M);
  });

  test('PORCELAIN: H', () => {
    process.env['PORCELAIN'] = '1';
    const result = formatDuration(H);
    expect(result).toBe(H);
  });

  test('PORCELAIN: D', () => {
    process.env['PORCELAIN'] = '1';
    const result = formatDuration(D);
    expect(result).toBe(D);
  });

  test('PORCELAIN: D + H + M + S', () => {
    process.env['PORCELAIN'] = '1';
    const result = formatDuration(D + H + M + S);
    expect(result).toBe(D + H + M + S);
  });

  test('PORCELAIN: 27H + M + S', () => {
    process.env['PORCELAIN'] = '1';
    const result = formatDuration(H * 27 + M + S);
    expect(result).toBe(H * 27 + M + S);
  });

  test('PORCELAIN: 367D + H + M + S', () => {
    process.env['PORCELAIN'] = '1';
    const result = formatDuration(D * 367 + H + M + S);
    expect(result).toBe(D * 367 + H + M + S);
  });

  test('PORCELAIN: 100Y + D + H + M + S', () => {
    process.env['PORCELAIN'] = '1';
    const result = formatDuration(D * 365 * 100 + D + H + M + S);
    expect(result).toBe(D * 365 * 100 + D + H + M + S);
  });

  test('PORCELAIN: 100Y + H + M + S', () => {
    process.env['PORCELAIN'] = '1';
    const result = formatDuration(D * 365 * 100 + H + M + S);
    expect(result).toBe(D * 365 * 100 + H + M + S);
  });

  test('PORCELAIN: 100Y + H + M + S', () => {
    process.env['PORCELAIN'] = '1';
    const result = formatDuration(D * 365 * 100 + H + M + S);
    expect(result).toBe(D * 365 * 100 + H + M + S);
  });

  test('PORCELAIN: S + 349', () => {
    process.env['PORCELAIN'] = '1';
    const result = formatDuration(S + 349);
    expect(result).toBe(S + 349);
  });

  test('PORCELAIN: S + 350', () => {
    process.env['PORCELAIN'] = '1';
    const result = formatDuration(S + 350);
    expect(result).toBe(S + 350);
  });

  // END describe
});
