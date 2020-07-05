import path from 'path';
import { loadIgnorePatterns } from '../../util/loadIgnorePatterns';

const fix = path.resolve(__dirname, '..', '__fixtures__');

test('loadIgnorePatterns', () => {
  const result = loadIgnorePatterns(path.resolve(fix, 's3p.test.ignore'));
  expect(result).toEqual(['*.txt', '!B.txt']);
});

test('loadIgnorePatterns: non-existent', () => {
  const result = loadIgnorePatterns(path.resolve(fix, 's3p.nope.ignore'));
  expect(result).toEqual([]);
});

test('loadIgnorePatterns: empty', () => {
  const result = loadIgnorePatterns('');
  expect(result).toEqual([]);
});

test('loadIgnorePatterns: false', () => {
  const result = loadIgnorePatterns(false);
  expect(result).toEqual([]);
});

test('loadIgnorePatterns: undefined', () => {
  const result = loadIgnorePatterns();
  expect(result).toEqual([]);
});
