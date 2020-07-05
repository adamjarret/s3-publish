import { formatRoot } from '../../util/formatRoot';

const cwd = process.cwd();

describe('formatRoot', () => {
  test('dot', () => {
    const result = formatRoot('.');
    expect(result).toBe(cwd);
  });

  test('relative', () => {
    const result = formatRoot('./public');
    expect(result).toBe(`${cwd}/public`);
  });

  test('absolute', () => {
    const result = formatRoot('/public');
    expect(result).toBe(`/public`);
  });

  test('s3', () => {
    const result = formatRoot('s3://s3p-test');
    expect(result).toBe(`s3://s3p-test`);
  });

  // END describe
});
