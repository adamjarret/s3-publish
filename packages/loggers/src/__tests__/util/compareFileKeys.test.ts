import { compareFileKeys, compareKeys } from '../../util/compareFileKeys';
import { A, B } from '../__fixtures__/files';

test('compareKeys: lt', () => {
  const result = compareKeys(A, B);
  expect(result).toBe(-1);
});

test('compareKeys: gt', () => {
  const result = compareKeys(B, A);
  expect(result).toBe(1);
});

test('compareKeys: eq', () => {
  const result = compareKeys(A, A);
  expect(result).toBe(0);
});

test('compareKeys: case', () => {
  const result = compareKeys({ Key: 'Apple' }, { Key: 'ace' });
  expect(result).toBe(1);
});

test('compareKeys: edge, A undefined', () => {
  const result = compareKeys({}, B);
  expect(result).toBe(-1);
});

test('compareKeys: edge, B undefined', () => {
  const result = compareKeys(A, {});
  expect(result).toBe(1);
});

test('compareKeys: edge, both undefined', () => {
  const result = compareKeys({}, {});
  expect(result).toBe(0);
});

test('compareFileKeys: lt', () => {
  const result = compareFileKeys({ file: A }, { file: B });
  expect(result).toBe(-1);
});

test('compareFileKeys: gt', () => {
  const result = compareFileKeys({ file: B }, { file: A });
  expect(result).toBe(1);
});

test('compareFileKeys: eq', () => {
  const result = compareFileKeys({ file: A }, { file: A });
  expect(result).toBe(0);
});

test('compareFileKeys: case', () => {
  const result = compareFileKeys({ file: { Key: 'Apple' } }, { file: { Key: 'ace' } });
  expect(result).toBe(1);
});

test('compareFileKeys: edge, A undefined', () => {
  const result = compareFileKeys({ file: {} }, { file: B });
  expect(result).toBe(-1);
});

test('compareFileKeys: edge, B undefined', () => {
  const result = compareFileKeys({ file: A }, { file: {} });
  expect(result).toBe(1);
});

test('compareFileKeys: edge, both undefined', () => {
  const result = compareFileKeys({ file: {} }, { file: {} });
  expect(result).toBe(0);
});
